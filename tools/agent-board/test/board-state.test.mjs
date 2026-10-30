import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { LANES, MAX_TEXT, STATUSES, laneOf, parseLine, parseLines, reduce, summary } from '../board-state.mjs';

const ev = (ts, task, agent, status, extra = {}) => ({ ts, task, agent, status, ...extra });
const line = (obj) => JSON.stringify(obj);
const T0 = Date.parse('2026-10-30T13:00:00Z');
const at = (s) => new Date(T0 + s * 1000).toISOString();

test('STATUSES and LANES match the lesson contract', () => {
  assert.deepEqual(STATUSES, [
    'queued',
    'assigned',
    'running',
    'waiting_human',
    'review',
    'changes_requested',
    'merged',
    'failed',
    'blocked',
  ]);
  assert.deepEqual(LANES, ['lead', 'teacher', 'learner', 'test-writer', 'implementer', 'pr-reviewer', 'human']);
  assert.equal(laneOf('implementer'), 'implementer');
  assert.equal(laneOf('general-purpose'), 'other');
});

test('parseLine accepts a valid event and keeps only known fields', () => {
  const parsed = parseLine(line(ev(at(0), '#1', 'lead', 'queued', { title: 'x', pr: '#12', prompt: 'secret', extra: 1 })));
  assert.deepEqual(parsed, { ts: at(0), task: '#1', agent: 'lead', status: 'queued', title: 'x', pr: 12 });
});

test('parseLine rejects broken JSON, non-objects and missing fields', () => {
  assert.equal(parseLine('{"ts":'), null);
  assert.equal(parseLine('not json'), null);
  assert.equal(parseLine(''), null);
  assert.equal(parseLine('[]'), null);
  assert.equal(parseLine('42'), null);
  assert.equal(parseLine('null'), null);
  assert.equal(parseLine(undefined), null);
  for (const key of ['ts', 'task', 'agent', 'status']) {
    const obj = ev(at(0), '#1', 'lead', 'queued');
    delete obj[key];
    assert.equal(parseLine(line(obj)), null, `missing ${key}`);
  }
  assert.equal(parseLine(line(ev('yesterday-ish', '#1', 'lead', 'queued'))), null);
  assert.equal(parseLine(line(ev(at(0), '', 'lead', 'queued'))), null);
  assert.equal(parseLine(line(ev(at(0), '#1', 'lead lane', 'queued'))), null);
  assert.equal(parseLine(line(ev(at(0), '#1', 'lead', 'done'))), null);
  assert.equal(parseLine(line(ev(at(0), '#1', 'lead', 'QUEUED'))), null);
});

test('parseLine rejects lines over 2 KB and clips title/note to 200 chars', () => {
  const tooLong = line(ev(at(0), '#1', 'lead', 'queued', { note: 'x'.repeat(2100) }));
  assert.equal(parseLine(tooLong), null);
  const multibyte = line(ev(at(0), '#1', 'lead', 'queued', { note: 'ệ'.repeat(700) }));
  assert.ok(multibyte.length < 2048 && Buffer.byteLength(multibyte) > 2048);
  assert.equal(parseLine(multibyte), null);
  const parsed = parseLine(line(ev(at(0), '#1', 'lead', 'queued', { title: 'a'.repeat(500), note: 'b'.repeat(300) })));
  assert.equal(parsed.title.length, MAX_TEXT);
  assert.equal(parsed.note.length, MAX_TEXT);
  const html = parseLine(line(ev(at(0), '#1', 'lead', 'queued', { title: '<img src=x onerror=alert(1)>\n' })));
  assert.equal(html.title, '<img src=x onerror=alert(1)> ');
});

test('parseLines skips bad lines', () => {
  const text = [line(ev(at(0), '#1', 'lead', 'queued')), '{bad', '', line(ev(at(1), '#1', 'lead', 'nope'))].join('\n');
  assert.equal(parseLines(text).length, 1);
});

test('reduce sorts by ts and keeps input order on ties', () => {
  const events = [
    ev(at(10), '#1', 'implementer', 'running'),
    ev(at(0), '#1', 'lead', 'queued'),
    ev(at(5), '#1', 'lead', 'assigned'),
    ev(at(5), '#1', 'test-writer', 'running'),
  ];
  const state = reduce(events, T0 + 20000);
  const task = state.tasks['#1'];
  assert.deepEqual(
    task.history.map((h) => `${h.agent}:${h.status}`),
    ['lead:queued', 'lead:assigned', 'test-writer:running', 'implementer:running'],
  );
  assert.equal(task.agent, 'implementer');
  assert.equal(task.status, 'running');
  assert.equal(task.since, at(10));
  assert.equal(state.timeline[0].status, 'running');
  assert.equal(state.timeline[0].agent, 'implementer');
  assert.deepEqual(state.timeline[0].from, { agent: 'test-writer', status: 'running' });
});

test('reduce computes durations per status including the open segment', () => {
  const events = [
    ev(at(0), '#1', 'lead', 'queued'),
    ev(at(10), '#1', 'test-writer', 'running'),
    ev(at(40), '#1', 'implementer', 'running'),
    ev(at(100), '#1', 'pr-reviewer', 'review'),
    ev(at(0), '#2', 'lead', 'queued'),
    ev(at(30), '#2', 'pr-reviewer', 'merged'),
  ];
  const state = reduce(events, T0 + 130000);
  assert.deepEqual(state.tasks['#1'].durations, { queued: 10000, running: 90000, review: 30000 });
  assert.deepEqual(state.tasks['#2'].durations, { queued: 30000 });
});

test('reduce keeps sticky title/branch/pr and counts WIP by agent', () => {
  const events = [
    ev(at(0), '#1', 'lead', 'queued', { title: 'T', branch: 'agent/issue-1-x' }),
    ev(at(1), '#1', 'implementer', 'running', { pr: 7 }),
    ev(at(2), '#1', 'pr-reviewer', 'review'),
    ev(at(0), '#2', 'implementer', 'running'),
    ev(at(0), '#3', 'lead', 'queued'),
    ev(at(0), '#4', 'lead', 'failed'),
  ];
  const state = reduce(events, T0 + 5000);
  assert.equal(state.tasks['#1'].title, 'T');
  assert.equal(state.tasks['#1'].branch, 'agent/issue-1-x');
  assert.equal(state.tasks['#1'].pr, 7);
  assert.deepEqual(state.wip, { 'pr-reviewer': 1, implementer: 1 });
  assert.equal(state.active, 2);
  assert.deepEqual(state.warnings, []);
});

test('reduce warns wip_limit only when more than 3 tasks are active', () => {
  const three = ['#1', '#2', '#3'].map((id, i) => ev(at(i), id, 'implementer', 'running'));
  assert.deepEqual(reduce(three, T0 + 9000).warnings, []);
  const four = [...three, ev(at(4), '#4', 'human', 'waiting_human'), ev(at(5), '#5', 'lead', 'merged')];
  const state = reduce(four, T0 + 9000);
  assert.equal(state.active, 4);
  assert.deepEqual(state.warnings, [{ type: 'wip_limit', active: 4, limit: 3 }]);
  const blocked = [...three, ev(at(4), '#4', 'lead', 'blocked')];
  assert.equal(reduce(blocked, T0 + 9000).warnings.length, 1);
});

test('reduce maps unknown agents to lane other', () => {
  const state = reduce([ev(at(0), '#9', 'general-purpose', 'running')], T0 + 1000);
  assert.equal(state.tasks['#9'].lane, 'other');
  assert.equal(state.tasks['#9'].agent, 'general-purpose');
  assert.deepEqual(state.wip, { 'general-purpose': 1 });
});

test('reduce keeps only the 30 most recent transitions, newest first', () => {
  const events = Array.from({ length: 40 }, (_, i) => ev(at(i), `#${i}`, 'lead', 'queued'));
  const state = reduce(events, T0 + 50000);
  assert.equal(state.timeline.length, 30);
  assert.equal(state.timeline[0].task, '#39');
  assert.equal(state.timeline[29].task, '#10');
});

test('summary flags intervention, rework, merge and computes both ratios', () => {
  const events = [
    ev(at(0), '#1', 'test-writer', 'running'),
    ev(at(1), '#1', 'pr-reviewer', 'review'),
    ev(at(2), '#1', 'pr-reviewer', 'merged'),
    ev(at(0), '#2', 'implementer', 'running'),
    ev(at(1), '#2', 'pr-reviewer', 'review'),
    ev(at(2), '#2', 'pr-reviewer', 'changes_requested'),
    ev(at(3), '#2', 'pr-reviewer', 'merged'),
    ev(at(0), '#3', 'learner', 'running'),
    ev(at(1), '#3', 'human', 'waiting_human'),
    ev(at(2), '#3', 'pr-reviewer', 'review'),
    ev(at(0), '#4', 'lead', 'blocked'),
  ];
  const result = summary(events);
  const byId = Object.fromEntries(result.tasks.map((row) => [row.task, row]));
  assert.deepEqual(
    { i: byId['#1'].intervened, r: byId['#1'].rework, m: byId['#1'].merged },
    { i: false, r: false, m: true },
  );
  assert.equal(byId['#2'].rework, true);
  assert.equal(byId['#2'].merged, true);
  assert.equal(byId['#3'].intervened, true);
  assert.equal(byId['#3'].merged, false);
  assert.equal(byId['#4'].merged, false);
  assert.deepEqual(result.noIntervention, { ok: 2, total: 4, rate: 0.5 });
  assert.deepEqual(result.noRework, { ok: 1, total: 2, rate: 0.5 });
});

test('summary with no merged task returns rate null', () => {
  assert.equal(summary([ev(at(0), '#1', 'lead', 'queued')]).noRework.rate, null);
  assert.equal(summary([]).noIntervention.rate, null);
});

test('l07 fixture: >= 12 events, 3 tasks, all merged, every note says reconstructed', () => {
  const text = readFileSync(fileURLToPath(new URL('../fixtures/l07.jsonl', import.meta.url)), 'utf8');
  const raw = text.trim().split('\n');
  const events = parseLines(text);
  assert.equal(events.length, raw.length);
  assert.ok(events.length >= 12);
  assert.ok(events.every((e) => e.ts.endsWith('+07:00') && /tái dựng/.test(e.note)));
  const state = reduce(events, Date.parse('2026-10-30T13:40:00Z'));
  assert.deepEqual(Object.keys(state.tasks).sort(), ['#10', '#11', 'L07-EX1']);
  assert.ok(Object.values(state.tasks).every((t) => t.status === 'merged'));
  assert.equal(state.tasks['#10'].since, '2026-10-30T20:36:44+07:00');
  assert.equal(state.tasks['#11'].since, '2026-10-30T20:37:18+07:00');
});
