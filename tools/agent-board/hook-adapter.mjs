#!/usr/bin/env node
import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { MAX_TEXT, parseLine } from './board-state.mjs';
import { appendEvent, logPath } from './log-path.mjs';

const MAX_STDIN = 1024 * 1024;
const TASK_RE = /^\s*(#\d{1,7}|L\d{2}-EX\d{1,2})(?![\w-])/;

function clip(value) {
  return typeof value === 'string' && value ? Array.from(value).slice(0, MAX_TEXT).join('') : undefined;
}

function readStdin() {
  return new Promise((resolve) => {
    const chunks = [];
    let size = 0;
    let done = false;
    const finish = (value) => {
      if (done) return;
      done = true;
      resolve(value);
    };
    process.stdin.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_STDIN) {
        process.stdin.pause();
        process.stdin.removeAllListeners('data');
        finish(null);
        return;
      }
      chunks.push(chunk);
    });
    process.stdin.on('end', () => finish(Buffer.concat(chunks).toString('utf8')));
    process.stdin.on('error', () => finish(null));
  });
}

function taskId(input) {
  const description = input?.tool_input?.description;
  if (typeof description === 'string') {
    const match = TASK_RE.exec(description);
    if (match) return match[1];
  }
  const session = String(input?.session_id ?? '').replace(/[^\w-]/g, '').slice(0, 8);
  return `session-${session || 'unknown'}`;
}

export function toEvent(input, now = new Date()) {
  if (!input || typeof input !== 'object') return null;
  const name = input.hook_event_name;
  const base = { ts: now.toISOString(), task: taskId(input) };
  let draft = null;
  if (name === 'PreToolUse' && ['Agent', 'Task'].includes(input.tool_name)) {
    const subagent = input.tool_input?.subagent_type;
    draft = {
      ...base,
      agent: typeof subagent === 'string' && subagent ? subagent : 'other',
      status: 'running',
      title: clip(input.tool_input?.description),
    };
  } else if (name === 'SubagentStop') {
    draft = { ...base, agent: 'lead', status: 'assigned', note: 'SubagentStop' };
  } else if (name === 'Notification') {
    draft = { ...base, agent: 'human', status: 'waiting_human', note: clip(input.message) };
  } else if (name === 'Stop') {
    draft = { ...base, agent: 'lead', status: 'assigned', note: 'Stop' };
  }
  if (!draft) return null;
  for (const key of Object.keys(draft)) {
    if (draft[key] === undefined) delete draft[key];
  }
  return parseLine(JSON.stringify(draft));
}

async function main() {
  try {
    const text = await readStdin();
    if (!text) return;
    let input;
    try {
      input = JSON.parse(text);
    } catch {
      return;
    }
    const event = toEvent(input);
    if (event) appendEvent(logPath(process.env, typeof input.cwd === 'string' && input.cwd ? input.cwd : process.cwd()), event);
  } catch {
    return;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  main().finally(() => process.exit(0));
}
