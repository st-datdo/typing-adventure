#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { parseLines, summary } from './board-state.mjs';

const file = process.argv[2];
if (!file) {
  process.stderr.write('usage: summary.mjs <events.jsonl>\n');
  process.exit(2);
}

const result = summary(parseLines(readFileSync(file, 'utf8')));
const yesNo = (value) => (value ? 'yes' : 'no');
const pct = ({ ok, total, rate }) => `${ok}/${total}${rate === null ? ' (n/a)' : ` (${(rate * 100).toFixed(1)}%)`}`;
const width = Math.max(4, ...result.tasks.map((row) => row.task.length));

process.stdout.write(`${'task'.padEnd(width)}  intervened  rework  merged\n`);
for (const row of result.tasks) {
  process.stdout.write(
    `${row.task.padEnd(width)}  ${yesNo(row.intervened).padEnd(10)}  ${yesNo(row.rework).padEnd(6)}  ${yesNo(row.merged)}\n`,
  );
}
process.stdout.write(`no-intervention: ${pct(result.noIntervention)}\n`);
process.stdout.write(`no-rework: ${pct(result.noRework)}\n`);
