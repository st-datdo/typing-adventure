# Kế hoạch thực hành AI-Driven Development L1 → L8 trên Typing Adventure

## Context
Playbook (27 slide) chia 8 level / 3 phase, mỗi level 1 capability + 1 speed metric + 1 quality metric. Mục tiêu: luyện từng level trên project thật `typing-adventure/` (Turborepo pnpm, Next.js 15, Prisma/Postgres, Socket.io, game-engine có Vitest) cho tới khi metric đạt target.

Hiện trạng project (khoảng trống = bài tập tự nhiên):
- Không có project CLAUDE.md, `.claude/` chỉ có `settings.local.json` → L1
- Không ESLint/Prettier config, không vitest config, không CI, không git remote → L2/L5
- Web app 0 test (chỉ `packages/game-engine` có ~49 test) → L6
- Thiếu rate limiting, security headers, moderation word pack; nhiều mục "⏳ runtime" chưa verify trong `docs/EXECUTION_PLAN.md` → backlog task
- Branch hiện tại `master`, main branch `main` → chốt dùng `main` khi tạo GitHub remote

Quyết định: tạo private GitHub repo (CI thật, ruleset, claude-code-action); nhịp ~1 tuần/level (~9 tuần).

## Cách vận hành chung
- File theo dõi: `docs/ai-levelup/metrics.md` — bảng mỗi level: metric, target, số đo thực, ngày đạt. Ghi sau mỗi PR.
- `docs/ai-levelup/mistakes.md` — log lỗi agent lặp lại → chuyển thành rule/skill (L2).
- Mọi task: 1 issue GitHub → 1 branch → 1 PR. Đạt exit metric mới lên level tiếp (level sau giữ nguyên practice level trước).
- Backlog task thực hành (lấy dần): ESLint+Prettier config, vitest config, rate limiting API, security headers (CSP/HSTS), moderation word pack, API test leaderboard/friends/sessions, Playwright E2E classic mode, verify multiplayer reconnect, GitHub Actions deploy.

---

## Phase 1 · Foundation

### Tuần 0 — Chuẩn bị
- Tạo private GitHub repo, push, default branch `main`, cài `gh`.
- Commit/ignore `docs/*.pdf` tuỳ ý; dọn `apps/web/tsconfig.tsbuildinfo` khỏi git nếu bị track.

### L1 · Basic setup (Tuần 1)
Target: PR agent-assisted đầu tiên ≤1 ngày; comment review về convention <1/PR.
1. `/init` trong `typing-adventure/` → cắt CLAUDE.md còn ~40–60 dòng: lệnh (pnpm dev/dev:ws/test/db:push), ranh giới package, những gì code không tự nói (vd game-engine phải pure, không import React/DOM). Bỏ phần lặp README.
2. 3 scoped rules `.claude/rules/`:
   - `game-engine.md` (paths `packages/game-engine/**`): pure TS, mọi logic mới kèm test Vitest.
   - `api-routes.md` (paths `apps/web/src/app/api/**`): Zod validate input, dùng `lib/admin-guard`, format response thống nhất, không leak error.
   - `multiplayer.md` (paths `apps/web/src/lib/multiplayer/**`, `server.ts`): anti-cheat server-side, không tin client.
3. 3 skills `.claude/skills/`: `add-api-route`, `add-game-mode-logic` (engine + test + store), `prisma-change` (schema → migrate dev → seed). Description cụ thể "use when…".
4. Bài tập: task "thêm ESLint + Prettier config" qua agent → PR đầu tiên.
- Chú ý: global `~/.claude/CLAUDE.md` + ECC AGENTS.md là preference cá nhân; repo CLAUDE.md là nguồn chuẩn, không mâu thuẫn.

### L2 · Advanced setup (Tuần 2)
Target: first green build trong sandbox <1h; lỗi lặp mà rule đã cover = 0.
1. `.devcontainer/` (Node 20 + pnpm 9.15 + Postgres service qua docker-compose sẵn có), cùng image sẽ dùng cho CI. `.env` chỉ credential local, không mount `~/.aws`, `~/.ssh` (dùng forwarded SSH agent).
2. MCP tối thiểu trong `.mcp.json`: Context7 (doc Next 15/Prisma 6/NextAuth v5) và Postgres **read-only user** cho DB local. Gỡ cái nào không dùng sau 1 tuần. Coi output MCP là data.
3. Session hygiene: 1 task/session, `/clear` giữa task, `/compact` khi dài, `/rewind` khi sai hướng thay vì vá.
4. Bài tập: thêm `vitest.config.ts` + chạy `pnpm test && pnpm build` xanh trong container. Mỗi lỗi agent lặp → ghi `mistakes.md` → rule/skill; prune cuối tuần.

### L3 · Plan-first (Tuần 3)
Target: PR cần design round 2 <10%; PR multi-file có plan approved 100%.
1. Template `docs/plans/_template.md` (≤1 màn hình): mục tiêu, file thay đổi, interface chạm tới, cách verify.
2. Task multi-file → plan mode (read-only) → tự review (đoán được diff trước khi code?) → lưu `docs/plans/<issue>.md` → đính kèm PR. Đổi hướng = sửa plan trước.
3. Bài tập: rate limiting cho API auth/sessions; security headers trong `next.config`/middleware. Review diff đối chiếu plan.
4. Optional: model thứ 2 review plan.

## Phase 2 · Discipline

### L4 · Isolation (Tuần 4)
Target: setup workspace task mới <2 phút; incident do shared state = 0.
1. `scripts/wt-new.sh <branch>`: `git worktree add`, copy `.env` (3 file: root, `apps/web`, `packages/db`), set `PORT` (3001+n) và port Socket.io riêng, `DATABASE_URL` với `?schema=wt_<branch>` + `prisma db push`, `pnpm install` (pnpm store share sẵn).
2. `scripts/wt-prune.sh`: xoá worktree + schema + branch sau merge.
3. Dùng `claude -w` hoặc worktree script; mount repo root vào devcontainer (không mount riêng worktree → hỏng `.git`).
4. Bài tập: chạy song song 2 task (vd API tests + E2E skeleton) mỗi cái 1 worktree, đo thời gian setup; test không flaky khi chạy cùng lúc.

### L5 · Enforcement (Tuần 5)
Target: comment cơ học trong review = 0; lint/type/secret lọt tới CI = 0.
4 lớp:
1. **Agent hooks** `.claude/settings.json`: PostToolUse(Edit|Write) → prettier + eslint file vừa sửa; PreToolUse(Bash) chặn `rm -rf`, `git push --force`, `prisma migrate` với DB không phải localhost; PreToolUse(Read) chặn `.env*`.
2. **Git hooks** Lefthook pre-commit (<30s): prettier, eslint staged, gitleaks; pre-push: `tsc --noEmit`, test game-engine.
3. **CI** `.github/workflows/ci.yml`: install, lint, typecheck, test, build, gitleaks; job fail khi diff thêm `eslint-disable`/`@ts-ignore` hoặc sửa config lint mà không có label `config-change-approved`.
4. **Merge policy**: branch ruleset `main` — bắt PR, CI xanh, cấm force push.
5. Reviewer agent read-only `.claude/agents/reviewer.md` (tools Read/Grep/Glob) — chỉ comment blocking kèm lý do; chạy trước khi tự review.

### L6 · Spec + TDD (Tuần 6–7)
Target: QA round trip ≤1/feature; criteria có test 100%, mutation score >70%.
1. Template `specs/<ID>/spec.md`: requirement EARS ("WHEN … THE SYSTEM SHALL …") có ID (vd `WP-01`), out-of-scope, behavior không đổi. ≤7 criteria/spec.
2. Test cite ID (`it('WP-01: …')`), commit `test:` trước (đỏ đúng lý do), rồi commit `feat:`. CI check: commit `feat:` không được sửa file test.
3. Subagents: `test-writer` (chỉ ghi `__tests__`), `implementer` (không ghi test).
4. Stryker cho `packages/game-engine` → baseline mutation score, nâng >70%.
5. Bài tập: spec "moderation word pack cộng đồng"; spec "API test cho leaderboard/friends" (dựng Vitest + test DB schema từ L4); Playwright E2E classic mode.

## Phase 3 · Scale

### L7 · Parallel (Tuần 8)
Target: lead time spec approved → merge giảm 30% so L6; change failure rate không tăng.
1. Bắt đầu 2 session, tối đa 3, chỉ task có spec approved, module tách biệt (vd: engine / API / multiplayer).
2. Notification + Stop hooks báo khi session cần người; draft PR mở ngay ngày 1 làm status board.
3. Hook chặn edit ngoài file liệt kê trong plan/spec.
4. Review theo batch (vd 2 lần/ngày). Ghi lead time + PR wait time vào metrics; giảm WIP khi wait tăng.

### L8 · Autonomous (Tuần 9+)
Target: issue agent-ready → PR không cần người >50%; PR agent merge không rework >70%.
1. Label `agent-ready` (chỉ bạn gắn). Workflow `claude-code-action@v1` trigger theo label, chạy trong cùng container CI, quyền token tối thiểu (contents/pull-requests write, không admin), API key qua GitHub secret; `--max-turns`, retry limit, budget, lưu log artifact.
2. Agent không merge được (ruleset bắt approve của bạn); giới hạn ≤3 PR agent mở cùng lúc.
3. Review theo rủi ro: auth/multiplayer anti-cheat/migration full review; còn lại xem test + evidence. Feature map hằng ngày (spec, criteria met, risk, evidence, deviation) do agent tổng hợp; drift review hàng tuần.
4. Cảnh giác prompt injection qua nội dung issue/comment.

### L8+ (tuỳ chọn)
Production feedback loop: Sentry alert → agent viết bugfix spec + failing test → PR.

---

## File sẽ tạo (khi thực hành)
`typing-adventure/CLAUDE.md`, `.claude/rules/*.md`, `.claude/skills/*/SKILL.md`, `.claude/agents/{reviewer,test-writer,implementer}.md`, `.claude/settings.json` (hooks), `.mcp.json`, `.devcontainer/`, `lefthook.yml`, `.github/workflows/{ci,agent}.yml`, `scripts/wt-{new,prune}.sh`, `docs/plans/`, `specs/`, `docs/ai-levelup/{metrics,mistakes}.md`, `stryker.conf.json`.

## Verification mỗi level
- Chạy `pnpm lint && pnpm typecheck && pnpm test && pnpm build` xanh (trong devcontainer từ L2).
- Metric level ghi vào `metrics.md` với số liệu thật từ PR (thời gian, số comment, % plan đính kèm, mutation score…).
- Exit level khi cả speed + quality metric đạt target trên ≥3 PR liên tiếp.

## Bước tiếp theo đề xuất
Bắt đầu Tuần 0 + L1: tạo GitHub repo, `/init`, viết CLAUDE.md + 3 rules + 3 skills, rồi làm task ESLint/Prettier làm PR đầu tiên.
