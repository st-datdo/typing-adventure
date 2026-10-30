import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { parseLine } from '../board-state.mjs';
import { logPath } from '../log-path.mjs';

const EMIT = fileURLToPath(new URL('../emit.mjs', import.meta.url));
const dir = mkdtempSync(join(tmpdir(), 'agent-board-emit-'));
after(() => rmSync(dir, { recursive: true, force: true }));

const run = (file, args) =>
  spawnSync(process.execPath, [EMIT, ...args], {
    encoding: 'utf8',
    env: { PATH: process.env.PATH, AGENT_BOARD_LOG: file },
  });

const lines = (file) => readFileSync(file, 'utf8').split('\n').filter(Boolean);

test('emit appends exactly one valid line per call', () => {
  const file = join(dir, 'a', 'events.jsonl');
  const first = run(file, ['--task', 'L08-EX1', '--agent', 'lead', '--status', 'running', '--title', 'board']);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(lines(file).length, 1);
  const second = run(file, [
    '--task',
    '#5',
    '--agent',
    'implementer',
    '--status',
    'review',
    '--branch',
    'agent/issue-5-x',
    '--pr',
    '#12',
    '--note',
    'ok',
  ]);
  assert.equal(second.status, 0, second.stderr);
  const all = lines(file);
  assert.equal(all.length, 2);
  const event = parseLine(all[1]);
  assert.deepEqual(
    { task: event.task, agent: event.agent, status: event.status, branch: event.branch, pr: event.pr, note: event.note },
    { task: '#5', agent: 'implementer', status: 'review', branch: 'agent/issue-5-x', pr: 12, note: 'ok' },
  );
  assert.ok(!Number.isNaN(Date.parse(event.ts)));
});

test('emit rejects unknown status and writes nothing', () => {
  const file = join(dir, 'b', 'events.jsonl');
  const result = run(file, ['--task', '#1', '--agent', 'lead', '--status', 'done']);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /unknown status/);
  assert.equal(existsSync(file), false);
});

test('emit rejects missing fields, bad pr, bad agent and unknown flags', () => {
  const file = join(dir, 'c', 'events.jsonl');
  assert.equal(run(file, ['--task', '#1', '--status', 'queued']).status, 2);
  assert.equal(run(file, ['--task', '#1', '--agent', 'lead', '--status', 'queued', '--pr', 'abc']).status, 2);
  assert.equal(run(file, ['--task', '#1', '--agent', 'bad agent', '--status', 'queued']).status, 2);
  assert.equal(run(file, ['--task', '#1', '--agent', 'lead', '--status', 'queued', '--prompt', 'x']).status, 2);
  assert.equal(existsSync(file), false);
});

test('emit clips long title so the line still fits in 2 KB', () => {
  const file = join(dir, 'd', 'events.jsonl');
  const result = run(file, ['--task', '#1', '--agent', 'lead', '--status', 'queued', '--title', 'ệ'.repeat(5000)]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(parseLine(lines(file)[0]).title.length, 200);
});

test('logPath honours AGENT_BOARD_LOG and defaults next to the git common dir', () => {
  assert.equal(logPath({ AGENT_BOARD_LOG: '/tmp/x.jsonl' }, '/'), '/tmp/x.jsonl');
  const repoRoot = fileURLToPath(new URL('../../../', import.meta.url)).replace(/\/$/, '');
  const common = spawnSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], {
    cwd: repoRoot,
    encoding: 'utf8',
  }).stdout.trim();
  assert.equal(logPath({}, repoRoot), join(common, '..', '.agent-board', 'events.jsonl'));
});
