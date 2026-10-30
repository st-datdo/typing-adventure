const A = { task: '#201', title: 'WX: skeleton TR39 Cyrillic/Greek → Latin', branch: 'agent/issue-201-wx-skeleton' };
const B = { task: '#202', title: 'RC: cảnh báo TRUST_PROXY_HEADER, cắt email ≤ 254', branch: 'agent/issue-202-rc-credentials' };
const C = { task: '#203', title: 'Rule await import() + test little-content', branch: 'agent/issue-203-await-import' };
const D = { task: '#204', title: 'Issue thứ 4: chờ cổng ≤ 3 PR agent/*', branch: 'agent/issue-204-extra' };
const E = { task: 'L08-EX5', title: 'agent.yml + pin SHA cho mọi uses:', branch: 'lesson/L08-autonomous' };

const STEPS = [
  [0, A, 'lead', 'queued', 'owner gắn agent-ready'],
  [0, B, 'lead', 'queued', 'owner gắn agent-ready'],
  [1, C, 'lead', 'queued', 'owner gắn agent-ready'],
  [2, A, 'lead', 'assigned', 'ready-gate OK'],
  [3, A, 'test-writer', 'running', 'viết test đỏ WX-*'],
  [4, B, 'lead', 'assigned', 'ready-gate OK'],
  [5, B, 'test-writer', 'running', 'viết test đỏ RC-*'],
  [6, C, 'lead', 'assigned', 'ready-gate OK, chore + plan'],
  [7, C, 'learner', 'running', 'chore: learner sửa rule'],
  [8, E, 'lead', 'running', 'lead làm EX-5 song song'],
  [12, A, 'implementer', 'running', 'feat: skeleton()'],
  [15, B, 'implementer', 'running', 'feat: cảnh báo + cắt email'],
  [16, C, 'human', 'waiting_human', 'hỏi: rule áp cho cả apps/web?'],
  [20, { ...A, pr: 301 }, 'pr-reviewer', 'review', 'risk=standard'],
  [22, D, 'lead', 'queued', 'owner gắn agent-ready'],
  [23, D, 'lead', 'blocked', 'ready-gate: đã có 3 PR agent/* mở'],
  [24, { ...B, pr: 302 }, 'pr-reviewer', 'review', 'risk=high, review đầy đủ'],
  [26, C, 'learner', 'running', 'người đã trả lời, tiếp tục'],
  [30, A, 'pr-reviewer', 'merged', 'người merge'],
  [32, B, 'pr-reviewer', 'changes_requested', 'thiếu test cite RC-03'],
  [34, B, 'implementer', 'running', 'sửa theo review'],
  [36, { ...C, pr: 303 }, 'pr-reviewer', 'review', 'risk=high (.claude/**)'],
  [42, B, 'pr-reviewer', 'review', 'review lại'],
  [44, { ...E, pr: 310 }, 'pr-reviewer', 'review', 'PR lesson cần label'],
  [46, C, 'pr-reviewer', 'merged', 'người merge'],
  [50, B, 'pr-reviewer', 'merged', 'người merge'],
  [55, D, 'lead', 'queued', 'cổng mở lại sau merge'],
  [56, D, 'lead', 'assigned', 'ready-gate OK'],
  [57, D, 'test-writer', 'running', 'viết test đỏ'],
  [62, D, 'implementer', 'running', 'feat'],
  [68, { ...D, pr: 304 }, 'pr-reviewer', 'review', 'risk=standard'],
  [74, D, 'pr-reviewer', 'merged', 'người merge'],
];

export const SCENARIO_SECONDS = 84;

export function scenario() {
  return STEPS.map(([at, info, agent, status, note]) => ({
    at: at * 1000,
    event: { task: info.task, agent, status, title: info.title, branch: info.branch, ...(info.pr ? { pr: info.pr } : {}), note },
  }));
}
