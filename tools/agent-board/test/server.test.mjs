import assert from 'node:assert/strict';
import { appendFileSync, mkdtempSync, rmSync } from 'node:fs';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { reduce } from '../board-state.mjs';
import { startBoard } from '../server.mjs';
import { scenario } from '../simulate.mjs';

const dir = mkdtempSync(join(tmpdir(), 'agent-board-server-'));
const logFile = join(dir, 'events.jsonl');
let board;

before(async () => {
  appendFileSync(logFile, `${JSON.stringify({ ts: new Date().toISOString(), task: '#1', agent: 'lead', status: 'queued' })}\n`);
  board = await startBoard({ port: 0, logFile, pollMs: 50 });
});

after(async () => {
  await board.close();
  rmSync(dir, { recursive: true, force: true });
});

function get(path, { host, headers = {}, port = board.port, stream = false } = {}) {
  return new Promise((resolve, reject) => {
    const req = request(
      { host: '127.0.0.1', port, path, method: 'GET', headers: { host: host ?? `127.0.0.1:${port}`, ...headers } },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          body += chunk;
          if (stream && body.includes('\n\n', body.indexOf('event: state'))) {
            req.destroy();
            resolve({ status: res.statusCode, headers: res.headers, body });
          }
        });
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
      },
    );
    req.on('error', (error) => (stream ? undefined : reject(error)));
    req.end();
  });
}

test('GET / serves HTML with CSP and nosniff', async () => {
  const res = await get('/');
  assert.equal(res.status, 200);
  assert.match(res.headers['content-type'], /text\/html/);
  assert.match(res.headers['content-security-policy'], /default-src 'self'/);
  assert.equal(res.headers['x-content-type-options'], 'nosniff');
  assert.match(res.body, /<script src="\/app.js" defer><\/script>/);
});

test('GET /app.js and /style.css are served with the right type', async () => {
  const js = await get('/app.js');
  assert.equal(js.status, 200);
  assert.match(js.headers['content-type'], /javascript/);
  const css = await get('/style.css');
  assert.equal(css.status, 200);
  assert.match(css.headers['content-type'], /text\/css/);
});

test('GET /state returns reduced JSON from the log', async () => {
  const res = await get('/state');
  assert.equal(res.status, 200);
  const state = JSON.parse(res.body);
  assert.equal(state.mode, 'live');
  assert.equal(state.tasks['#1'].status, 'queued');
  assert.ok(state.statuses.includes('waiting_human'));
  assert.ok(state.lanes.includes('other'));
});

test('GET /events streams event: state on connect', async () => {
  const res = await get('/events', { stream: true });
  assert.equal(res.status, 200);
  assert.match(res.headers['content-type'], /text\/event-stream/);
  assert.match(res.headers['content-security-policy'], /default-src 'self'/);
  assert.match(res.body, /event: state\ndata: \{/);
});

test('appended log lines show up in /state (tail reads only new data)', async () => {
  appendFileSync(
    logFile,
    `${JSON.stringify({ ts: new Date().toISOString(), task: '#2', agent: 'implementer', status: 'running', title: '<img src=x onerror=alert(1)>' })}\n{broken\n`,
  );
  let state;
  for (let i = 0; i < 40; i += 1) {
    await new Promise((r) => setTimeout(r, 50));
    state = JSON.parse((await get('/state')).body);
    if (state.tasks['#2']) break;
  }
  assert.equal(state.tasks['#2'].status, 'running');
  assert.equal(state.tasks['#2'].title, '<img src=x onerror=alert(1)>');
  assert.equal(Object.keys(state.tasks).length, 2);
});

test('foreign Host header -> 403 on every route', async () => {
  for (const path of ['/', '/state', '/events', '/app.js']) {
    const res = await get(path, { host: 'evil.example' });
    assert.equal(res.status, 403, path);
  }
  assert.equal((await get('/state', { host: `evil.example:${board.port}` })).status, 403);
  assert.equal((await get('/state', { host: `localhost:${board.port}` })).status, 200);
});

test('foreign Origin -> 403, unknown route -> 404', async () => {
  assert.equal((await get('/state', { headers: { origin: 'http://evil.example' } })).status, 403);
  assert.equal((await get('/nope')).status, 404);
});

test('server binds 127.0.0.1 only', () => {
  assert.equal(board.server.address().address, '127.0.0.1');
});

test('replay of the l07 fixture ends with 3 merged tasks', async () => {
  const replay = await startBoard({
    port: 0,
    replay: fileURLToPath(new URL('../fixtures/l07.jsonl', import.meta.url)),
    speed: 100000,
  });
  try {
    await new Promise((r) => setTimeout(r, 200));
    const state = JSON.parse((await get('/state', { port: replay.port })).body);
    assert.equal(state.mode, 'replay');
    assert.equal(Object.keys(state.tasks).length, 3);
    assert.ok(Object.values(state.tasks).every((t) => t.status === 'merged'));
    assert.equal(state.clock.rate, 0);
  } finally {
    await replay.close();
  }
});

test('simulate has >= 4 overlapping tasks, a WIP warning and does not write the log', async () => {
  const simLog = join(dir, 'sim.jsonl');
  const sim = await startBoard({ port: 0, simulate: true, logFile: simLog, speed: 1 });
  try {
    const state = JSON.parse((await get('/state', { port: sim.port })).body);
    assert.equal(state.mode, 'simulate');
    assert.ok(Object.keys(state.tasks).length >= 4);
    assert.ok(state.warnings.some((w) => w.type === 'wip_limit'));
    const statuses = new Set(Object.values(state.tasks).flatMap((t) => t.history.map((h) => h.status)));
    for (const s of ['queued', 'assigned', 'running', 'waiting_human', 'review', 'blocked']) {
      assert.ok(statuses.has(s), s);
    }
  } finally {
    await sim.close();
  }
  const { existsSync } = await import('node:fs');
  assert.equal(existsSync(simLog), false);
});

test('simulate scenario covers the L08 pipeline, rework, human wait and gate block', () => {
  const t0 = Date.parse('2026-10-30T14:00:00Z');
  const events = scenario().map(({ at, event }) => ({ ts: new Date(t0 + at).toISOString(), ...event }));
  const state = reduce(events, t0 + 120000);
  const tasks = Object.values(state.tasks);
  assert.ok(tasks.length >= 4);
  const path = (t) => t.history.map((h) => `${h.agent}:${h.status}`);
  const pipeline = tasks.find((t) => t.task === '#201');
  assert.deepEqual(path(pipeline), [
    'lead:queued',
    'lead:assigned',
    'test-writer:running',
    'implementer:running',
    'pr-reviewer:review',
    'pr-reviewer:merged',
  ]);
  const rework = tasks.find((t) => t.history.some((h) => h.status === 'changes_requested'));
  const after = rework.history.slice(rework.history.findIndex((h) => h.status === 'changes_requested'));
  assert.deepEqual(after.map((h) => h.agent).slice(0, 2), ['pr-reviewer', 'implementer']);
  assert.equal(rework.status, 'merged');
  const human = tasks.find((t) => t.history.some((h) => h.status === 'waiting_human'));
  assert.equal(human.status, 'merged');
  const blocked = tasks.find((t) => t.history.some((h) => h.status === 'blocked' && /3 PR/.test(h.note)));
  assert.ok(blocked);
  let peak = 0;
  for (let i = 1; i <= events.length; i += 1) {
    peak = Math.max(peak, reduce(events.slice(0, i), t0).active);
  }
  assert.ok(peak > 3);
});
