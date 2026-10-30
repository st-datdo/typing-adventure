#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { MAX_TEXT, parseLine, STATUSES } from './board-state.mjs';
import { appendEvent, logPath } from './log-path.mjs';

const USAGE =
  'usage: emit.mjs --task <id> --agent <lane> --status <status> [--title <t>] [--branch <b>] [--pr <n>] [--note <n>]';

function fail(message) {
  process.stderr.write(`emit: ${message}\n${USAGE}\n`);
  process.exit(2);
}

let values;
try {
  ({ values } = parseArgs({
    options: {
      task: { type: 'string' },
      agent: { type: 'string' },
      status: { type: 'string' },
      title: { type: 'string' },
      branch: { type: 'string' },
      pr: { type: 'string' },
      note: { type: 'string' },
    },
    strict: true,
    allowPositionals: false,
  }));
} catch (error) {
  fail(error.message);
}

for (const key of ['task', 'agent', 'status']) {
  if (!values[key]) fail(`missing --${key}`);
}
if (!STATUSES.includes(values.status)) fail(`unknown status "${values.status}" (allowed: ${STATUSES.join(', ')})`);

const draft = { ts: new Date().toISOString(), task: values.task, agent: values.agent, status: values.status };
for (const key of ['title', 'branch', 'note']) {
  if (values[key]) draft[key] = Array.from(values[key]).slice(0, MAX_TEXT).join('');
}
if (values.pr) {
  const pr = Number(values.pr.replace(/^#/, ''));
  if (!Number.isInteger(pr) || pr <= 0) fail(`invalid --pr "${values.pr}"`);
  draft.pr = pr;
}

const event = parseLine(JSON.stringify(draft));
if (!event) fail('event rejected by parseLine (check task/agent format)');

const file = logPath();
appendEvent(file, event);
process.stdout.write(`${event.task} ${event.agent} ${event.status} -> ${file}\n`);
