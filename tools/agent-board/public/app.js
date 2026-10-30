'use strict';

const STATUS_META = {
  queued: { label: 'Chờ xếp', icon: '○' },
  assigned: { label: 'Đã giao', icon: '◐' },
  running: { label: 'Đang chạy', icon: '▶' },
  waiting_human: { label: 'Chờ người', icon: '?' },
  review: { label: 'Review', icon: '◎' },
  changes_requested: { label: 'Cần sửa', icon: '↺' },
  merged: { label: 'Đã merge', icon: '✓' },
  failed: { label: 'Lỗi', icon: '✕' },
  blocked: { label: 'Bị chặn', icon: '⊘' },
};

const LANE_LABEL = {
  lead: 'Lead',
  teacher: 'Teacher',
  learner: 'Learner',
  'test-writer': 'Test writer',
  implementer: 'Implementer',
  'pr-reviewer': 'PR reviewer',
  human: 'Người',
  other: 'Khác',
};

const MODE_LABEL = { live: 'Log thật', simulate: 'Mô phỏng + log', replay: 'Phát lại' };
const TERMINAL = ['merged', 'failed'];
const INACTIVE = ['queued', 'merged', 'failed'];
const STALE_STATUSES = ['running', 'waiting_human', 'blocked', 'changes_requested', 'review'];
const STALE_MS = 10 * 60 * 1000;
const SILENCE_MS = 40000;

let clock = { now: Date.now(), rate: 1, receivedAt: Date.now() };
let source = null;
let lastSeen = 0;
let attempts = 0;
let retryTimer = null;

const $ = (id) => document.getElementById(id);

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}

function meta(status) {
  return STATUS_META[status] ?? { label: status, icon: '·' };
}

function badge(status) {
  const node = el('span', `badge s-${status}`);
  node.append(el('span', 'badge-icon', meta(status).icon), el('span', 'badge-text', meta(status).label));
  node.setAttribute('aria-label', `Trạng thái: ${meta(status).label}`);
  return node;
}

function boardNow() {
  return clock.now + (Date.now() - clock.receivedAt) * clock.rate;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function clockText(ms) {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function duration(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${pad(s % 60)}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${pad(m % 60)}m`;
}

function durationsTitle(task) {
  const parts = Object.entries(task.durations ?? {})
    .filter(([, ms]) => ms > 0)
    .map(([status, ms]) => `${meta(status).label}: ${duration(ms)}`);
  return parts.length ? `Thời gian theo trạng thái\n${parts.join('\n')}` : '';
}

function card(task) {
  const node = el('article', `card s-${task.status}`);
  node.dataset.status = task.status;
  node.dataset.since = String(Date.parse(task.since));
  node.title = durationsTitle(task);

  const top = el('div', 'card-top');
  top.append(el('span', 'card-id', task.task), badge(task.status));
  node.append(top);

  node.append(el('p', 'card-title', task.title || '(không có tiêu đề)'));

  const metaRow = el('div', 'card-meta');
  if (task.lane === 'other' || task.lane === 'human') metaRow.append(el('span', 'card-agent', task.agent));
  const timer = el('span', 'timer');
  timer.setAttribute('aria-label', 'Thời gian ở trạng thái hiện tại');
  metaRow.append(timer, el('span', 'stale-tag', 'lâu'));
  node.append(metaRow);

  if (task.branch || task.pr) {
    const foot = el('div', 'card-foot');
    if (task.branch) {
      const branch = el('span', 'branch', task.branch);
      branch.title = task.branch;
      foot.append(branch);
    }
    if (task.pr) foot.append(el('span', 'pr', `PR #${task.pr}`));
    node.append(foot);
  }
  return node;
}

function tick() {
  const now = boardNow();
  $('clock').textContent = clockText(now);
  for (const node of document.querySelectorAll('.card')) {
    const since = Number(node.dataset.since);
    const status = node.dataset.status;
    const timer = node.querySelector('.timer');
    if (TERMINAL.includes(status)) {
      timer.textContent = `lúc ${clockText(since)}`;
      node.classList.remove('stale');
      continue;
    }
    const elapsed = now - since;
    timer.textContent = duration(elapsed);
    node.classList.toggle('stale', STALE_STATUSES.includes(status) && elapsed >= STALE_MS);
  }
}

function renderBoard(state) {
  const board = $('board');
  const tasks = Object.values(state.tasks ?? {});
  const statuses = state.statuses;
  const byCell = new Map();
  for (const task of tasks) {
    const key = `${task.lane}|${task.status}`;
    if (!byCell.has(key)) byCell.set(key, []);
    byCell.get(key).push(task);
  }

  const nodes = [];
  const corner = el('div', 'corner');
  corner.append(el('span', null, 'Làn agent'), el('span', 'corner-sub', 'trạng thái →'));
  nodes.push(corner);
  for (const status of statuses) {
    const head = el('div', `col-head s-${status}`);
    const count = tasks.filter((t) => t.status === status).length;
    head.append(badge(status), el('span', 'col-count', count));
    if (count === 0) head.classList.add('is-zero');
    nodes.push(head);
  }

  for (const lane of state.lanes) {
    const laneTasks = tasks.filter((t) => t.lane === lane);
    if (lane === 'other' && laneTasks.length === 0) continue;
    const activeCount = laneTasks.filter((t) => !INACTIVE.includes(t.status)).length;
    const row = el('div', 'lane-head');
    row.append(el('span', 'lane-name', LANE_LABEL[lane] ?? lane));
    row.append(el('span', 'lane-sub', laneTasks.length ? `${activeCount} đang làm · ${laneTasks.length} task` : 'trống'));
    if (activeCount > 0) row.classList.add('is-busy');
    const laneNodes = [row];
    for (const status of statuses) {
      const cell = el('div', `cell s-${status}`);
      const list = (byCell.get(`${lane}|${status}`) ?? []).sort((a, b) => Date.parse(a.since) - Date.parse(b.since));
      for (const task of list) cell.append(card(task));
      laneNodes.push(cell);
    }
    const group = el('div', `lane${laneTasks.length ? '' : ' lane-empty'}`);
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', `Làn ${LANE_LABEL[lane] ?? lane}`);
    group.append(...laneNodes);
    nodes.push(group);
  }
  board.replaceChildren(...nodes);
  $('empty').hidden = tasks.length > 0;
}

function renderOverview(state) {
  const limit = state.limit ?? 3;
  const active = state.active ?? 0;
  const over = active > limit;
  $('wip').classList.toggle('is-over', over);
  $('wip-count').textContent = `${active} / ${limit}${over ? ' · vượt' : ''}`;
  const meter = $('wip-meter');
  meter.setAttribute('aria-valuenow', String(active));
  meter.setAttribute('aria-valuemax', String(Math.max(limit, active)));
  const segments = [];
  for (let i = 0; i < Math.max(limit, active); i += 1) {
    const seg = el('span', 'seg');
    if (i < active) seg.classList.add('on');
    if (i >= limit) seg.classList.add('over');
    segments.push(seg);
  }
  meter.replaceChildren(...segments);

  const agents = Object.entries(state.wip ?? {}).sort((a, b) => b[1] - a[1]);
  $('wip-agents').replaceChildren(
    ...(agents.length
      ? agents.map(([agent, n]) => el('span', 'chip', `${LANE_LABEL[agent] ?? agent} ${n}`))
      : [el('span', 'chip chip-muted', 'không có task đang làm')]),
  );

  const tasks = Object.values(state.tasks ?? {});
  $('counts').replaceChildren(
    ...state.statuses.map((status) => {
      const n = tasks.filter((t) => t.status === status).length;
      const chip = el('span', `count s-${status}${n === 0 ? ' is-zero' : ''}`);
      chip.append(el('span', 'badge-icon', meta(status).icon), el('span', null, meta(status).label), el('strong', null, n));
      return chip;
    }),
  );

  const alert = $('alert');
  const warning = (state.warnings ?? []).find((w) => w.type === 'wip_limit');
  if (warning) {
    alert.replaceChildren(
      el('strong', null, 'Vượt giới hạn WIP'),
      el('span', null, ` ${warning.active} task đang hoạt động, giới hạn ${warning.limit}. Hoàn tất hoặc dừng bớt trước khi giao thêm.`),
    );
    alert.hidden = false;
  } else {
    alert.hidden = true;
    alert.replaceChildren();
  }
}

function renderTimeline(state) {
  const items = (state.timeline ?? []).map((item) => {
    const li = el('li', `tl-item s-${item.status}`);
    li.append(el('time', 'tl-time', clockText(Date.parse(item.ts))));
    li.append(el('span', 'tl-task', item.task));
    li.append(el('span', 'tl-agent', LANE_LABEL[item.agent] ?? item.agent));
    const move = el('span', 'tl-move');
    if (item.from) {
      move.append(badge(item.from.status), el('span', 'tl-arrow', '→'));
    } else {
      move.append(el('span', 'tl-new', 'mới'), el('span', 'tl-arrow', '→'));
    }
    move.append(badge(item.status));
    li.append(move);
    if (item.note) li.append(el('span', 'tl-note', item.note));
    return li;
  });
  $('timeline').replaceChildren(...(items.length ? items : [el('li', 'tl-empty', 'Chưa có lần chuyển nào.')]));
}

function render(state) {
  clock = { now: Date.parse(state.clock?.now ?? state.now), rate: state.clock?.rate ?? 1, receivedAt: Date.now() };
  $('mode').textContent = MODE_LABEL[state.mode] ?? state.mode;
  $('mode').className = `mode mode-${state.mode}`;
  renderOverview(state);
  renderBoard(state);
  renderTimeline(state);
  tick();
}

function setConn(kind, text) {
  $('conn').className = `conn conn-${kind}`;
  $('conn-text').textContent = text;
}

function scheduleReconnect() {
  if (retryTimer) return;
  attempts += 1;
  const delay = Math.min(30000, 1000 * 2 ** Math.min(attempts - 1, 5));
  setConn('down', `Mất kết nối · nối lại sau ${Math.round(delay / 1000)}s (lần ${attempts})`);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    connect();
  }, delay);
}

function connect() {
  if (source) source.close();
  setConn(attempts ? 'down' : 'connecting', attempts ? `Đang nối lại (lần ${attempts})` : 'Đang kết nối');
  source = new EventSource('/events');
  source.addEventListener('open', () => {
    attempts = 0;
    lastSeen = Date.now();
    setConn('open', 'Đã kết nối · trực tiếp');
  });
  source.addEventListener('state', (event) => {
    lastSeen = Date.now();
    try {
      render(JSON.parse(event.data));
    } catch {
      setConn('down', 'Dữ liệu lỗi');
    }
  });
  source.addEventListener('ping', () => {
    lastSeen = Date.now();
  });
  source.addEventListener('error', () => {
    if (source.readyState === EventSource.CLOSED) {
      source.close();
      scheduleReconnect();
    } else {
      setConn('down', 'Mất kết nối · đang nối lại');
    }
  });
}

setInterval(tick, 1000);
setInterval(() => {
  if (source && source.readyState === EventSource.OPEN && Date.now() - lastSeen > SILENCE_MS) {
    source.close();
    scheduleReconnect();
  }
}, 5000);

connect();
