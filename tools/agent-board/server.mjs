#!/usr/bin/env node
import { closeSync, openSync, readFileSync, readSync, realpathSync, statSync, unwatchFile, watchFile } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { LANES, OTHER_LANE, STATUSES, parseLine, parseLines, reduce } from './board-state.mjs';
import { logPath } from './log-path.mjs';
import { SCENARIO_SECONDS, scenario } from './simulate.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const BIND = '127.0.0.1';
const HEARTBEAT_MS = 15000;
const MAX_CLIENTS = 32;
const MAX_PENDING = 1024 * 1024;
const PREROLL_MS = 25000;

const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Cache-Control': 'no-store',
};

const STATIC = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/style.css': ['style.css', 'text/css; charset=utf-8'],
};

function loadStatic() {
  const files = {};
  for (const [route, [name, type]] of Object.entries(STATIC)) {
    files[route] = { body: readFileSync(join(HERE, 'public', name)), type };
  }
  return files;
}

function createLogTail(file, onChange, pollMs) {
  let offset = 0;
  let pending = '';
  let events = [];

  const reset = () => {
    offset = 0;
    pending = '';
    events = [];
  };

  const readNew = () => {
    let size;
    try {
      size = statSync(file).size;
    } catch {
      if (offset > 0 || events.length > 0) {
        reset();
        onChange();
      }
      return;
    }
    let changed = false;
    if (size < offset) {
      reset();
      changed = true;
    }
    if (size === offset) {
      if (changed) onChange();
      return;
    }
    const length = size - offset;
    const buffer = Buffer.alloc(length);
    const fd = openSync(file, 'r');
    try {
      readSync(fd, buffer, 0, length, offset);
    } finally {
      closeSync(fd);
    }
    offset = size;
    const text = pending + buffer.toString('utf8');
    const lines = text.split('\n');
    pending = lines.pop() ?? '';
    if (pending.length > MAX_PENDING) pending = '';
    let added = 0;
    for (const line of lines) {
      const event = parseLine(line);
      if (event) {
        events.push(event);
        added += 1;
      }
    }
    if (added > 0 || changed) onChange();
  };

  const listener = () => readNew();
  readNew();
  watchFile(file, { interval: pollMs, persistent: true }, listener);
  return {
    events: () => events,
    poll: readNew,
    stop: () => unwatchFile(file, listener),
  };
}

function createSimulation(speed, onChange) {
  let events = [];
  let timers = [];
  const steps = scenario();

  const run = (preroll) => {
    events = [];
    const origin = Date.now() - preroll / speed;
    for (const step of steps) {
      const realAt = origin + step.at / speed;
      const push = () => {
        events.push({ ts: new Date(realAt).toISOString(), ...step.event });
        onChange();
      };
      const delay = realAt - Date.now();
      if (delay <= 0) events.push({ ts: new Date(realAt).toISOString(), ...step.event });
      else timers.push(setTimeout(push, delay));
    }
    const loopAt = origin + (SCENARIO_SECONDS * 1000) / speed - Date.now();
    timers.push(
      setTimeout(() => {
        timers = [];
        run(0);
        onChange();
      }, Math.max(0, loopAt)),
    );
  };

  run(PREROLL_MS);
  return {
    events: () => events,
    clock: () => ({ now: Date.now(), rate: 1 }),
    stop: () => timers.forEach(clearTimeout),
  };
}

function createReplay(file, speed, onChange) {
  const all = parseLines(readFileSync(file, 'utf8'))
    .map((event, index) => ({ event, index, t: Date.parse(event.ts) }))
    .sort((a, b) => a.t - b.t || a.index - b.index);
  const t0 = all.length ? all[0].t : Date.now();
  const tEnd = all.length ? all[all.length - 1].t : t0;
  const start = Date.now();
  const events = [];
  const timers = [];
  let played = 0;
  for (const item of all) {
    timers.push(
      setTimeout(() => {
        events.push(item.event);
        played += 1;
        onChange();
      }, (item.t - t0) / speed),
    );
  }
  return {
    events: () => events,
    clock: () => {
      if (played >= all.length) return { now: tEnd, rate: 0 };
      return { now: Math.min(tEnd, t0 + (Date.now() - start) * speed), rate: speed };
    },
    stop: () => timers.forEach(clearTimeout),
  };
}

export function startBoard({ port = 4317, logFile = logPath(), simulate = false, replay = null, speed = 1, pollMs = 500 } = {}) {
  if (!Number.isFinite(speed) || speed <= 0) throw new Error('speed must be > 0');
  const files = loadStatic();
  const clients = new Set();
  let actualPort = port;
  let scheduled = false;
  let version = 0;

  const mode = replay ? 'replay' : simulate ? 'simulate' : 'live';
  let source = null;
  let tail = null;

  const currentState = () => {
    const clock = source?.clock ? source.clock() : { now: Date.now(), rate: 1 };
    const events = [...(tail ? tail.events() : []), ...(source ? source.events() : [])];
    const state = reduce(events, clock.now);
    return {
      version,
      mode,
      statuses: STATUSES,
      lanes: [...LANES, OTHER_LANE],
      clock: { now: state.now, rate: clock.rate },
      ...state,
    };
  };

  const broadcast = () => {
    scheduled = false;
    version += 1;
    const payload = `event: state\ndata: ${JSON.stringify(currentState())}\n\n`;
    for (const res of clients) res.write(payload);
  };

  const onChange = () => {
    if (scheduled) return;
    scheduled = true;
    setImmediate(broadcast);
  };

  if (replay) source = createReplay(replay, speed, onChange);
  else {
    tail = createLogTail(logFile, onChange, pollMs);
    if (simulate) source = createSimulation(speed, onChange);
  }

  const allowedHost = (host) => host === `${BIND}:${actualPort}` || host === `localhost:${actualPort}`;

  const send = (res, status, type, body) => {
    res.writeHead(status, { ...SECURITY_HEADERS, 'Content-Type': type, 'Content-Length': Buffer.byteLength(body) });
    res.end(body);
  };

  const server = createServer((req, res) => {
    const host = req.headers.host ?? '';
    if (!allowedHost(host)) return send(res, 403, 'text/plain; charset=utf-8', 'forbidden host\n');
    const origin = req.headers.origin;
    if (origin && origin !== `http://${host}`) return send(res, 403, 'text/plain; charset=utf-8', 'forbidden origin\n');
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.setHeader('Allow', 'GET, HEAD');
      return send(res, 405, 'text/plain; charset=utf-8', 'method not allowed\n');
    }
    const path = (req.url ?? '/').split('?')[0];
    if (STATIC[path]) {
      const file = files[path];
      res.writeHead(200, { ...SECURITY_HEADERS, 'Content-Type': file.type, 'Content-Length': file.body.length });
      return res.end(req.method === 'HEAD' ? undefined : file.body);
    }
    if (path === '/state') return send(res, 200, 'application/json; charset=utf-8', JSON.stringify(currentState()));
    if (path === '/events') {
      if (clients.size >= MAX_CLIENTS) return send(res, 503, 'text/plain; charset=utf-8', 'too many clients\n');
      res.writeHead(200, {
        ...SECURITY_HEADERS,
        'Content-Type': 'text/event-stream; charset=utf-8',
        Connection: 'keep-alive',
      });
      res.write(`retry: 3000\n\nevent: state\ndata: ${JSON.stringify(currentState())}\n\n`);
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return undefined;
    }
    return send(res, 404, 'text/plain; charset=utf-8', 'not found\n');
  });

  const heartbeat = setInterval(() => {
    const payload = `: ping\nevent: ping\ndata: ${Date.now()}\n\n`;
    for (const res of clients) res.write(payload);
  }, HEARTBEAT_MS);

  const close = () =>
    new Promise((resolve) => {
      clearInterval(heartbeat);
      tail?.stop();
      source?.stop();
      for (const res of clients) res.end();
      clients.clear();
      server.close(() => resolve());
      server.closeAllConnections();
    });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, BIND, () => {
      actualPort = server.address().port;
      resolve({ server, port: actualPort, mode, logFile, close, state: currentState, poll: () => tail?.poll() });
    });
  });
}

async function main() {
  const { values } = parseArgs({
    options: {
      port: { type: 'string', default: '4317' },
      simulate: { type: 'boolean', default: false },
      replay: { type: 'string' },
      speed: { type: 'string', default: '1' },
    },
    strict: true,
  });
  const port = Number(values.port);
  const speed = Number(values.speed);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error(`invalid --port ${values.port}`);
  const board = await startBoard({ port, simulate: values.simulate, replay: values.replay ?? null, speed });
  process.stdout.write(
    `agent-board ${board.mode} on http://${BIND}:${board.port}${board.mode === 'replay' ? '' : ` log=${board.logFile}`}\n`,
  );
  const shutdown = () => board.close().then(() => process.exit(0));
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  main().catch((error) => {
    process.stderr.write(`agent-board: ${error.message}\n`);
    process.exit(2);
  });
}
