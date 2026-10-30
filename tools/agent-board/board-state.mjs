export const STATUSES = Object.freeze([
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

export const LANES = Object.freeze([
  'lead',
  'teacher',
  'learner',
  'test-writer',
  'implementer',
  'pr-reviewer',
  'human',
]);

export const OTHER_LANE = 'other';
export const INACTIVE = Object.freeze(['queued', 'merged', 'failed']);
export const WIP_LIMIT = 3;
export const MAX_LINE_BYTES = 2048;
export const MAX_TEXT = 200;
export const TIMELINE_SIZE = 30;

const TEXT_FIELDS = ['title', 'note', 'branch'];
const ID_RE = /^[\w#.:/-]{1,80}$/;
const AGENT_RE = /^[\w.:-]{1,60}$/;

export function laneOf(agent) {
  return LANES.includes(agent) ? agent : OTHER_LANE;
}

function clip(value) {
  return Array.from(value.replace(/[\u0000-\u001f\u007f]+/g, ' ')).slice(0, MAX_TEXT).join('');
}

export function parseLine(line) {
  if (typeof line !== 'string') return null;
  if (Buffer.byteLength(line, 'utf8') > MAX_LINE_BYTES) return null;
  const trimmed = line.trim();
  if (!trimmed) return null;
  let raw;
  try {
    raw = JSON.parse(trimmed);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const { ts, task, agent, status } = raw;
  if (typeof ts !== 'string' || Number.isNaN(Date.parse(ts))) return null;
  if (typeof task !== 'string' || !ID_RE.test(task)) return null;
  if (typeof agent !== 'string' || !AGENT_RE.test(agent)) return null;
  if (typeof status !== 'string' || !STATUSES.includes(status)) return null;
  const event = { ts, task, agent, status };
  for (const field of TEXT_FIELDS) {
    if (typeof raw[field] === 'string' && raw[field].length > 0) event[field] = clip(raw[field]);
  }
  const pr = typeof raw.pr === 'string' ? Number(raw.pr.replace(/^#/, '')) : raw.pr;
  if (Number.isInteger(pr) && pr > 0) event.pr = pr;
  return event;
}

export function parseLines(text) {
  const events = [];
  for (const line of String(text).split('\n')) {
    const event = parseLine(line);
    if (event) events.push(event);
  }
  return events;
}

function sortEvents(events) {
  return events
    .map((event, index) => ({ event, index, t: Date.parse(event.ts) }))
    .sort((a, b) => a.t - b.t || a.index - b.index);
}

function isActive(status) {
  return !INACTIVE.includes(status);
}

export function reduce(events, now = Date.now()) {
  const tasks = {};
  const transitions = [];
  for (const { event, t } of sortEvents(events)) {
    const prev = tasks[event.task];
    if (!prev) {
      tasks[event.task] = {
        task: event.task,
        agent: event.agent,
        lane: laneOf(event.agent),
        status: event.status,
        since: event.ts,
        sinceMs: t,
        history: [],
        durations: {},
      };
    } else if (prev.status !== event.status || prev.agent !== event.agent) {
      prev.durations[prev.status] = (prev.durations[prev.status] ?? 0) + Math.max(0, t - prev.sinceMs);
      prev.since = event.ts;
      prev.sinceMs = t;
    }
    const state = tasks[event.task];
    const from = prev ? { agent: prev.agent, status: prev.status } : null;
    state.agent = event.agent;
    state.lane = laneOf(event.agent);
    state.status = event.status;
    for (const field of ['title', 'branch', 'pr']) {
      if (event[field] !== undefined) state[field] = event[field];
    }
    const entry = { ts: event.ts, agent: event.agent, status: event.status };
    if (event.note) entry.note = event.note;
    state.history.push(entry);
    transitions.push({
      ts: event.ts,
      task: event.task,
      agent: event.agent,
      status: event.status,
      from,
      ...(event.title ? { title: event.title } : {}),
      ...(event.note ? { note: event.note } : {}),
    });
  }

  const wip = {};
  let active = 0;
  for (const state of Object.values(tasks)) {
    if (!['merged', 'failed'].includes(state.status)) {
      state.durations[state.status] =
        (state.durations[state.status] ?? 0) + Math.max(0, now - state.sinceMs);
    }
    delete state.sinceMs;
    if (isActive(state.status)) {
      active += 1;
      wip[state.agent] = (wip[state.agent] ?? 0) + 1;
    }
  }

  const warnings = [];
  if (active > WIP_LIMIT) warnings.push({ type: 'wip_limit', active, limit: WIP_LIMIT });

  return {
    now: new Date(now).toISOString(),
    tasks,
    wip,
    active,
    limit: WIP_LIMIT,
    warnings,
    timeline: transitions.slice(-TIMELINE_SIZE).reverse(),
  };
}

function ratio(ok, total) {
  return { ok, total, rate: total === 0 ? null : ok / total };
}

export function summary(events) {
  const byTask = new Map();
  for (const { event } of sortEvents(events)) {
    if (!byTask.has(event.task)) {
      byTask.set(event.task, { task: event.task, intervened: false, rework: false, merged: false, reachedReview: false });
    }
    const row = byTask.get(event.task);
    if (event.agent === 'human' || event.status === 'waiting_human') row.intervened = true;
    if (event.status === 'changes_requested') row.rework = true;
    if (event.status === 'review' || event.status === 'merged') row.reachedReview = true;
    row.merged = event.status === 'merged';
  }
  const tasks = [...byTask.values()];
  const merged = tasks.filter((row) => row.merged);
  return {
    tasks,
    noIntervention: ratio(tasks.filter((row) => row.reachedReview && !row.intervened).length, tasks.length),
    noRework: ratio(merged.filter((row) => !row.rework).length, merged.length),
  };
}
