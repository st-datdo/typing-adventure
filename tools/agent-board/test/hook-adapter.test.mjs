import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { parseLine } from '../board-state.mjs';

const ADAPTER = fileURLToPath(new URL('../hook-adapter.mjs', import.meta.url));
const dir = mkdtempSync(join(tmpdir(), 'agent-board-hook-'));
after(() => rmSync(dir, { recursive: true, force: true }));

let n = 0;
const run = (input) => {
  n += 1;
  const file = join(dir, `events-${n}.jsonl`);
  const result = spawnSync(process.execPath, [ADAPTER], {
    input: typeof input === 'string' ? input : JSON.stringify(input),
    encoding: 'utf8',
    env: { PATH: process.env.PATH, AGENT_BOARD_LOG: file },
  });
  const raw = existsSync(file) ? readFileSync(file, 'utf8') : '';
  return { ...result, file, raw, events: raw.split('\n').filter(Boolean).map(parseLine) };
};

const PROMPT_TEXT = 'do not log this prompt body';

test('PreToolUse Agent -> running with subagent_type, task from description, no prompt', () => {
  const r = run({
    hook_event_name: 'PreToolUse',
    session_id: 'abcdef1234567890',
    tool_name: 'Agent',
    tool_input: { subagent_type: 'test-writer', description: '#42 viết test đỏ', prompt: PROMPT_TEXT },
  });
  assert.equal(r.status, 0);
  assert.equal(r.stdout, '');
  assert.equal(r.events.length, 1);
  assert.deepEqual(
    { task: r.events[0].task, agent: r.events[0].agent, status: r.events[0].status, title: r.events[0].title },
    { task: '#42', agent: 'test-writer', status: 'running', title: '#42 viết test đỏ' },
  );
  assert.ok(!r.raw.includes(PROMPT_TEXT));
  assert.ok(!r.raw.includes('prompt'));
});

test('PreToolUse Task with L08-EX<k> description and unknown subagent', () => {
  const r = run({
    hook_event_name: 'PreToolUse',
    session_id: 's',
    tool_name: 'Task',
    tool_input: { subagent_type: 'general-purpose', description: 'L08-EX3 risk.sh', prompt: PROMPT_TEXT },
  });
  assert.equal(r.events[0].task, 'L08-EX3');
  assert.equal(r.events[0].agent, 'general-purpose');
  assert.ok(!r.raw.includes(PROMPT_TEXT));
});

test('PreToolUse for other tools writes nothing', () => {
  const r = run({ hook_event_name: 'PreToolUse', session_id: 's', tool_name: 'Bash', tool_input: { command: 'ls' } });
  assert.equal(r.status, 0);
  assert.equal(r.events.length, 0);
});

test('SubagentStop -> lead/assigned, task falls back to session id', () => {
  const r = run({ hook_event_name: 'SubagentStop', session_id: '1234abcd-ffff-0000', prompt: PROMPT_TEXT });
  assert.equal(r.status, 0);
  assert.equal(r.stdout, '');
  assert.deepEqual(
    { task: r.events[0].task, agent: r.events[0].agent, status: r.events[0].status },
    { task: 'session-1234abcd', agent: 'lead', status: 'assigned' },
  );
  assert.ok(!r.raw.includes(PROMPT_TEXT));
});

test('Notification -> human/waiting_human', () => {
  const r = run({ hook_event_name: 'Notification', session_id: 'zz', message: 'Claude needs your permission' });
  assert.equal(r.events[0].agent, 'human');
  assert.equal(r.events[0].status, 'waiting_human');
  assert.equal(r.events[0].task, 'session-zz');
  assert.equal(r.events[0].note, 'Claude needs your permission');
});

test('Stop -> agent lead', () => {
  const r = run({ hook_event_name: 'Stop', session_id: 'abc' });
  assert.equal(r.status, 0);
  assert.equal(r.stdout, '');
  assert.equal(r.events[0].agent, 'lead');
  assert.equal(r.events[0].task, 'session-abc');
});

test('broken JSON, empty input and unknown events exit 0 with empty stdout and no log', () => {
  for (const input of ['{not json', '', '[]', JSON.stringify({ hook_event_name: 'SessionStart' })]) {
    const r = run(input);
    assert.equal(r.status, 0);
    assert.equal(r.stdout, '');
    assert.equal(r.events.length, 0);
  }
});

test('stdin over 1 MB is ignored, exit 0', () => {
  const big = JSON.stringify({ hook_event_name: 'Stop', session_id: 'big', pad: 'x'.repeat(1024 * 1024 + 10) });
  const r = run(big);
  assert.equal(r.status, 0);
  assert.equal(r.stdout, '');
  assert.equal(r.events.length, 0);
});
