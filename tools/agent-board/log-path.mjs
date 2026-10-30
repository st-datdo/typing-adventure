import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

export function logPath(env = process.env, cwd = process.cwd()) {
  if (env.AGENT_BOARD_LOG) return resolve(cwd, env.AGENT_BOARD_LOG);
  let root = cwd;
  try {
    const common = execFileSync('git', ['rev-parse', '--git-common-dir'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    root = dirname(resolve(cwd, common));
  } catch {
    root = cwd;
  }
  return join(root, '.agent-board', 'events.jsonl');
}

export function appendEvent(file, event) {
  mkdirSync(dirname(file), { recursive: true });
  appendFileSync(file, `${JSON.stringify(event)}\n`, { encoding: 'utf8', mode: 0o600 });
}
