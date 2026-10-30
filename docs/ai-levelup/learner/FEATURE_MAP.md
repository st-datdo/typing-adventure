# Feature map

Mỗi lesson một section. Mỗi file thay đổi xuất hiện đúng 1 lần trong section của lesson đó.

## L01 · Basic setup (trước khoá, PR #1, #3)
| Feature | File | Loại | Verify bằng |
|---|---|---|---|
| Hướng dẫn agent cho repo | `CLAUDE.md` | thêm | đọc tay |
| Scoped rules | `.claude/rules/{api-routes,game-engine,multiplayer}.md` | thêm | rule nạp khi đọc file khớp `paths` |
| Skills | `.claude/skills/{add-api-route,add-game-mode-logic,prisma-change}/SKILL.md` | thêm | skill xuất hiện trong danh sách |
| ESLint + Prettier | `typing-adventure/apps/web/eslint.config.mjs`, `typing-adventure/.prettierrc` | thêm | `pnpm lint` |

## L00 · Dựng đội agent
| Feature | File | Loại | Verify bằng |
|---|---|---|---|
| Agent người dạy | `.claude/agents/teacher.md` | thêm | frontmatter hợp lệ |
| Agent người học | `.claude/agents/learner.md` | thêm | frontmatter hợp lệ |
| Agent reviewer PR | `.claude/agents/pr-reviewer.md` | thêm | review + merge PR L00 |
| Reviewer chạy trên GitHub | `.github/workflows/claude-pr-review.yml` | thêm | cần secret `ANTHROPIC_API_KEY` |
| Mục lục bài học | `docs/ai-levelup/lessons/README.md` | thêm | đọc tay |
| Feature map | `docs/ai-levelup/learner/FEATURE_MAP.md` | thêm | đọc tay |
| Bài học + chấm điểm | `docs/ai-levelup/lessons/L00-agent-team/{LESSON,GRADE}.md` | thêm | GRADE kết luận PASS |
| Báo cáo người học | `docs/ai-levelup/learner/L00-agent-team/REPORT.md` | thêm | đọc tay |
| Metric + lỗi lặp | `docs/ai-levelup/metrics.md`, `docs/ai-levelup/mistakes.md` | sửa | dòng L00 |

## L02 · Advanced setup
| Feature | File | Loại | Verify bằng |
|---|---|---|---|
| Devcontainer: khai báo | `.devcontainer/devcontainer.json` | thêm | `jq empty`; `devcontainers/cli up` outcome success |
| Devcontainer: override compose (5 volume `node_modules`, `ports: !reset []`) | `.devcontainer/docker-compose.devcontainer.yml` | thêm | `docker compose ... config -q`, grep không có `.ssh/.aws/published` |
| Devcontainer: image Node 20 + pnpm 9.15.0 | `.devcontainer/Dockerfile` | thêm | trong container `node -v` v20.19.2, `pnpm -v` 9.15.0 |
| Devcontainer: cài deps, migrate, seed | `.devcontainer/post-create.sh` | thêm | `bash -n`; log `Seed complete!` |
| Role Postgres read-only cho MCP | `.devcontainer/init-db/01-mcp-readonly.sql` | thêm | chạy 2 lần (host `postgres`, container `dev`), SELECT ok, DELETE bị chặn |
| MCP project scope | `.mcp.json` | thêm | `jq '.mcpServers \| keys'`, `claude mcp list` |
| Bỏ qua pnpm store sinh trong container | `.gitignore` | sửa | `git status` không còn `.pnpm-store/` |
| Mục Conventions/MCP, typecheck, gotcha init-db | `CLAUDE.md` | sửa | `wc -l` = 60 |
| Vitest config game-engine | `typing-adventure/packages/game-engine/vitest.config.ts` | thêm | `vitest run` 12 file / 137 test |
| Task turbo `typecheck` | `typing-adventure/turbo.json` | sửa | `pnpm typecheck` 4 task |
| Script `typecheck` root | `typing-adventure/package.json` | sửa | `pnpm typecheck` |
| Script `typecheck` web | `typing-adventure/apps/web/package.json` | sửa | `pnpm typecheck` |
| Script `typecheck` game-engine | `typing-adventure/packages/game-engine/package.json` | sửa | `pnpm typecheck` |
| Script `typecheck` + `typescript` devDep | `typing-adventure/packages/i18n/package.json` | sửa | `pnpm typecheck` |
| Script `typecheck` + `@types/node` (sửa lỗi `process`) | `typing-adventure/packages/db/package.json` | sửa | `pnpm typecheck` |
| Lockfile cho 2 devDep mới | `typing-adventure/pnpm-lock.yaml` | sửa | `pnpm install --frozen-lockfile` trong container |
| Checklist trước khi mở PR (orchestrator/teacher) | `.claude/agents/learner.md` | sửa | đọc tay |
| Trạng thái L02 trong mục lục (teacher) | `docs/ai-levelup/lessons/README.md` | sửa | đọc tay |
| Bài học L02 (teacher) | `docs/ai-levelup/lessons/L02-advanced-setup/LESSON.md` | thêm | đọc tay |
| Chấm điểm L02 (teacher) | `docs/ai-levelup/lessons/L02-advanced-setup/GRADE.md` | thêm | kết luận PASS |
| Báo cáo người học | `docs/ai-levelup/learner/L02-advanced-setup/REPORT.md` | thêm | đọc tay |
| Feature map | `docs/ai-levelup/learner/FEATURE_MAP.md` | sửa | section L02 |
| Metric L2 | `docs/ai-levelup/metrics.md` | sửa | 4 dòng L2 |
| Lỗi lặp + sửa header bảng | `docs/ai-levelup/mistakes.md` | sửa | bảng render, 5 dòng L02 |

## L03 · Plan-first
| Feature | File | Loại | Verify bằng |
|---|---|---|---|
| Template plan | `docs/plans/_template.md` | thêm | `wc -l` 34, `grep -c '^## '` 8 |
| Plan rate limit (approved, commit `96503e0`) | `docs/plans/L03-rate-limit.md` | thêm | commit trước code; mục Thực tế 10/10 |
| Plan security headers (approved, commit `d42800d`) | `docs/plans/L03-security-headers.md` | thêm | commit trước code; mục Thực tế 3/3 |
| Quy ước plan-first + dòng `pnpm test` | `CLAUDE.md` | sửa | `wc -l` 61, `## Conventions` dòng 33 |
| Limiter in-memory + `getClientIp` (sửa sau chấm: `x-real-ip` → cuối XFF) | `typing-adventure/apps/web/src/lib/rate-limit.ts` | thêm | 9 test Vitest; curl giả lập nginx |
| Helper 429 `tooManyRequests` (`Retry-After`, `url` cho NextAuth) | `typing-adventure/apps/web/src/lib/api-response.ts` | sửa | curl `retry-after: 900`; 2 test |
| Rate limit register 5/15 phút/IP | `typing-adventure/apps/web/src/app/api/auth/register/route.ts` | sửa | curl `400 ×5 429` |
| Rate limit credentials 10/15 phút/IP, 429 kèm `url=/login?error=RateLimited` | `typing-adventure/apps/web/src/app/api/auth/[...nextauth]/route.ts` | sửa | curl `302 ×10 429`, body có `url` |
| Rate limit sessions 30/phút/user | `typing-adventure/apps/web/src/app/api/sessions/route.ts` | sửa | unit test limiter; runtime chưa verify |
| Test limiter + hồi quy XFF giả | `typing-adventure/apps/web/src/lib/__tests__/rate-limit.test.ts` | thêm | `pnpm --filter @typing-adventure/web test` |
| Vitest config web | `typing-adventure/apps/web/vitest.config.ts` | thêm | `pnpm test` chạy web |
| Script `test` + devDep `vitest` | `typing-adventure/apps/web/package.json` | sửa | `pnpm test` Tasks 2 |
| Lockfile cho `vitest` web | `typing-adventure/pnpm-lock.yaml` | sửa | +3 dòng importer `apps/web` |
| Plan sửa sau chấm (approved, commit `60cd241`) | `docs/plans/L03-rate-limit-fixes.md` | thêm | commit trước code; Thực tế 9/9 |
| Test `tooManyRequests` | `typing-adventure/apps/web/src/lib/__tests__/api-response.test.ts` | thêm | 2 test Vitest |
| Login không treo khi 429 (`try/finally`, câu báo i18n) | `typing-adventure/apps/web/src/app/(auth)/login/page.tsx` | sửa | typecheck; mô phỏng `signIn` → `RateLimited` |
| Register xử lý 429 (API + auto sign-in) | `typing-adventure/apps/web/src/app/(auth)/register/page.tsx` | sửa | typecheck |
| Key `authRateLimited`, `authConnectionError` (vi) | `typing-adventure/packages/i18n/src/vi.ts` | sửa | `pnpm typecheck` |
| Key `authRateLimited`, `authConnectionError` (en) | `typing-adventure/packages/i18n/src/en.ts` | sửa | `pnpm typecheck` |
| Builder security header | `typing-adventure/apps/web/src/lib/security-headers.ts` | thêm | 6 test Vitest |
| Test security header | `typing-adventure/apps/web/src/lib/__tests__/security-headers.test.ts` | thêm | `pnpm --filter @typing-adventure/web test` |
| `headers()` cho `/:path*` | `typing-adventure/apps/web/next.config.ts` | sửa | `curl -sI /` dev:ws + next start |
| Dọn nợ L02: pin MCP postgres `0.6.2` (deprecated) | `.mcp.json` | sửa | `jq empty`, `npm view` |
| Dọn nợ L02: pin Claude Code `2.1.312` | `.devcontainer/Dockerfile` | sửa | `docker build`, `claude --version` |
| Bài học L03 (teacher) | `docs/ai-levelup/lessons/L03-plan-first/LESSON.md` | thêm | đọc tay |
| Chấm điểm L03 (teacher) | `docs/ai-levelup/lessons/L03-plan-first/GRADE.md` | thêm | kết luận PASS |
| Dòng PR #5 trong chấm L02 (teacher) | `docs/ai-levelup/lessons/L02-advanced-setup/GRADE.md` | sửa | đọc tay |
| Trạng thái L02 #5 / L03 trong mục lục (teacher) | `docs/ai-levelup/lessons/README.md` | sửa | đọc tay |
| Báo cáo người học | `docs/ai-levelup/learner/L03-plan-first/REPORT.md` | thêm | đọc tay |
| Feature map | `docs/ai-levelup/learner/FEATURE_MAP.md` | sửa | section L03 |
| Metric L3 | `docs/ai-levelup/metrics.md` | sửa | 5 dòng L3 |
| Lỗi lặp | `docs/ai-levelup/mistakes.md` | sửa | 3 dòng L03 |

## L04 · Isolation
| Feature | File | Loại | Verify bằng |
|---|---|---|---|
| Bài học L04 (teacher) | `docs/ai-levelup/lessons/L04-isolation/LESSON.md` | thêm | đọc tay |
| Backlog follow-up từ review (teacher; #7–#9 từ GRADE L04, trạng thái đã xong sau sửa) | `docs/ai-levelup/lessons/BACKLOG.md` | thêm | đọc tay |
| Chấm điểm L04 (teacher) | `docs/ai-levelup/lessons/L04-isolation/GRADE.md` | thêm | kết luận PASS |
| Mục lục: L03 PR #6, L04 đã đạt + link GRADE, link BACKLOG (teacher) | `docs/ai-levelup/lessons/README.md` | sửa | đọc tay |
| Plan worktree scripts (approved, commit `f52ebb8`) | `docs/plans/L04-worktree-scripts.md` | thêm | commit trước code; Thực tế 5/5 |
| Tạo worktree cô lập (worktree + port + schema + env); sau chấm: từ chối schema đã có, file tạm `mktemp` + `trap`; sau review: `.env` 0600 ngay khi tạo, `psql` không nhận URI | `scripts/wt-new.sh` | thêm | `bash -n`, `shellcheck`, `/usr/bin/time` 15.11 s / 7.44 s, AC-3; smoke collision/orphan → REFUSED; `ls -l` `-rw-------` |
| Dọn worktree an toàn (từ chối bẩn/main/public/locked/host lạ, remove trước rồi drop schema, xoá branch đã merge; sau review: squash-merge chỉ xoá khi tip = `headRefOid`, password qua `PGPASSWORD`) | `scripts/wt-prune.sh` | thêm | EX-5 (a)–(d), prune 2 branch task; smoke host lạ/`?host=`/locked/remove lỗi; OID O1–O4; stub `psql` argv |
| Plan hardening sau chấm (approved, commit `abb516c`) | `docs/plans/L04-wt-hardening.md` | thêm | commit trước code `c35caf9`; Thực tế 3/3 |
| Plan sửa theo review PR #7 (approved, commit `ce7424b`) | `docs/plans/L04-review-fixes.md` | thêm | commit trước code `16b0697`; Thực tế 4/4 |
| Ignore `.worktrees/`, `.wt-env` | `.gitignore` | sửa | `git check-ignore -q .worktrees/x` |
| Dòng lệnh worktree trong Commands | `CLAUDE.md` | sửa | `wc -l` 62, dòng 23 |
| Plan API integration test (approved, commit `fb79f38`) | `docs/plans/L04-api-integration-test.md` | thêm | commit trước code; Thực tế 6/6 |
| Unit Vitest loại `*.int.test.ts` | `typing-adventure/apps/web/vitest.config.ts` | sửa | `pnpm test` với DB sai → 17 pass |
| Config integration (nạp `.env`, globalSetup) | `typing-adventure/apps/web/vitest.integration.config.ts` | thêm | `test:integration` 6 pass |
| Guard đúng 1 `schema=wt_` trước khi chạm DB | `typing-adventure/apps/web/src/test/integration-global-setup.ts` | thêm | URL sai / `public` / 2 tham số `schema=` → exit 1 "refused" |
| Integration test register + leaderboard | `typing-adventure/apps/web/src/app/api/__tests__/auth-leaderboard.int.test.ts` | thêm | 6 pass, 3 vòng song song |
| Scripts `test:integration`, `test:e2e` + devDep `@playwright/test` | `typing-adventure/apps/web/package.json` | sửa | merge conflict giữ cả 2; `pnpm build` |
| Plan e2e skeleton (approved, commit `5145a7e`) | `docs/plans/L04-e2e-skeleton.md` | thêm | commit trước code; Thực tế 6/6 |
| Playwright config theo `PORT`, không reuse server | `typing-adventure/apps/web/playwright.config.ts` | thêm | thiếu PORT → exit 1; `PORT=3000` → "already used" |
| E2E smoke: `/`, leaderboard, Socket.IO handshake | `typing-adventure/apps/web/e2e/smoke.spec.ts` | thêm | `test:e2e` 3 pass trên 3003 |
| Ignore `test-results/`, `playwright-report/` | `typing-adventure/.gitignore` | sửa | worktree sạch sau e2e |
| Lockfile cho `@playwright/test` 1.64.1 | `typing-adventure/pnpm-lock.yaml` | sửa | `pnpm install --frozen-lockfile` |
| Báo cáo người học | `docs/ai-levelup/learner/L04-isolation/REPORT.md` | thêm | đọc tay |
| Feature map | `docs/ai-levelup/learner/FEATURE_MAP.md` | sửa | section L04 |
| Metric L4 | `docs/ai-levelup/metrics.md` | sửa | 6 dòng L4 |
| Lỗi gặp trong L04 | `docs/ai-levelup/mistakes.md` | sửa | 4 dòng L04 |

## L05 · Enforcement
| Feature | File | Loại | Verify bằng |
|---|---|---|---|
| Bài học L05 (teacher) | `docs/ai-levelup/lessons/L05-enforcement/LESSON.md` | thêm | đọc tay |
| Backlog: #5, #10–#13 `đã nhận` L05; #14–#17 từ GRADE (teacher) | `docs/ai-levelup/lessons/BACKLOG.md` | sửa | đọc tay |
| Mục lục: L04 PR #7, L05 trạng thái + link GRADE (teacher) | `docs/ai-levelup/lessons/README.md` | sửa | đọc tay |
| Chấm điểm L05 (teacher; lần 1 FAIL AC-8) | `docs/ai-levelup/lessons/L05-enforcement/GRADE.md` | thêm | kết luận chấm |
| `mcp_ro`: `REVOKE CREATE ON SCHEMA public FROM PUBLIC` (sửa sau chấm) | `.devcontainer/init-db/01-mcp-readonly.sql` | sửa | container PG14 + PG16 dùng xong bỏ: `permission denied for schema public`; đối chứng script cũ tạo được |
| Plan agent hooks (approved, `bafa8d0`) | `docs/plans/L05-agent-hooks.md` | thêm | commit trước code `961284d`; Thực tế 5/5 |
| Plan Lefthook + CI + ruleset (approved `bafa8d0`, v2 `9e49fb6`) | `docs/plans/L05-git-hooks-ci.md` | thêm | commit trước code `372f7f4`/`913e101`/`71bceaa`; Thực tế 8/9 |
| Plan nợ script PR #7 (approved, `bafa8d0`) | `docs/plans/L05-script-fixes.md` | thêm | commit trước code `b6a7760`; Thực tế 5/5 |
| Plan thay MCP postgres (approved, `bafa8d0`) | `docs/plans/L05-mcp-postgres.md` | thêm | commit trước code `2a4a3aa`; Thực tế 1/1 |
| Lịch sử plan lấy giờ từ `date '+%F %H:%M'` | `docs/plans/_template.md` | sửa | AC-1: giờ Lịch sử ≤ giờ commit plan |
| Hook PostToolUse: prettier + eslint file vừa sửa | `.claude/hooks/format-lint.sh` | thêm | `test-hooks.sh` 6 ca; 0.86–0.95 s/file `.tsx`; EX-5 (1)(2)(5) |
| Hook PreToolUse Bash: chặn `rm -rf`, force push, prisma ghi DB lạ | `.claude/hooks/guard-bash.sh` | thêm | `test-hooks.sh` 30 ca (7 cho qua, gồm `\rm`/`command rm`/`/bin/rm` sau chấm), output không có URL/password |
| Hook PreToolUse Read: chặn `.env*` trừ `.env.example` | `.claude/hooks/guard-read.sh` | thêm | `test-hooks.sh` 5 ca |
| Test hooks bằng pipe JSON (36 ca) | `.claude/hooks/test-hooks.sh` | thêm | `bash .claude/hooks/test-hooks.sh` 41/41 exit 0 |
| Đề xuất khối `hooks` cho user gộp | `.claude/hooks/settings.hooks.json` | thêm | `jq empty`; 3 matcher; activation chưa verify runtime |
| Git hooks pre-commit / pre-push | `lefthook.yml` | thêm | `lefthook run pre-commit` 3.25 s; `pre-push` 1.37/4.20 s; EX-5 (3)(4) |
| Allowlist gitleaks hẹp (path + regex) | `.gitleaks.toml` | thêm | lịch sử 4 → 0 finding; token giả EX-5 vẫn bị bắt |
| Dòng lệnh cài hook + cách bỏ qua | `CLAUDE.md` | sửa | `wc -l` 63, dòng 24 |
| CI `checks` / `gitleaks` / `guard` | `.github/workflows/ci.yml` | thêm | run 40923821932: checks + gitleaks xanh, guard đỏ (thiếu label) |
| Guard dòng thêm tắt kiểm tra + config được bảo vệ | `scripts/ci/guard-diff.sh` | thêm | `test-guard-diff.sh` 15/15; EX-5 (5)(6) |
| Test guard bằng repo tạm | `scripts/ci/test-guard-diff.sh` | thêm | exit 0 |
| Ruleset `main` (JSON đã POST, id 26147711) | `.github/rulesets/main.json` | thêm | `gh api …/rules/branches/main` 4 rule |
| Reviewer không tự gắn label, thiếu label → BLOCKED | `.claude/agents/pr-reviewer.md` | sửa | đọc tay |
| Lib Postgres dùng chung (password không vào argv, giữ `\`) | `scripts/lib/pg.sh` | thêm | `test-pg.sh` 9/9; smoke wt-new/wt-prune |
| Test lib bằng stub `psql` + `od -c` | `scripts/lib/test-pg.sh` | thêm | exit 0 |
| `wt-new` source lib | `scripts/wt-new.sh` | sửa | `shellcheck`; smoke `wt/l05-smoke`, `wt/l05-matrix` |
| `wt-prune` source lib, bỏ `WT_PRUNE_TEST_MERGED_OIDS` | `scripts/wt-prune.sh` | sửa | `grep -rn WT_PRUNE_TEST scripts/` rỗng; stub `gh` → force-delete |
| Shellcheck theo `source` không cần comment | `.shellcheckrc` | thêm | `shellcheck` 0 cảnh báo |
| MCP `postgres-ro` → MCP Toolbox 1.15.0 (`mcp_ro`) | `.mcp.json` | sửa | `jq empty`, `claude mcp list`; role kiểm bằng `psql` |
| Ignore `.turbo/` gốc (cache turbo từ worktree) | `.gitignore` | sửa | `git check-ignore -q .turbo/cache/x` |
| Báo cáo người học | `docs/ai-levelup/learner/L05-enforcement/REPORT.md` | thêm | đọc tay |
| Feature map | `docs/ai-levelup/learner/FEATURE_MAP.md` | sửa | section L05 |
| Metric L5 | `docs/ai-levelup/metrics.md` | sửa | 9 dòng L5 |
| Lỗi lặp / rule mới | `docs/ai-levelup/mistakes.md` | sửa | dòng lần 2 → rule; `turbo.json` → hook; 2 dòng L05 |

## L06 · Spec + TDD
Diff: `git diff --name-only main...HEAD` (`main` = `b5377bc`, sau khi PR #8 merge và rebase).

| Feature | File | Loại | Verify bằng |
|---|---|---|---|
| Bài học L06 (teacher) | `docs/ai-levelup/lessons/L06-spec-tdd/LESSON.md` | thêm | đọc tay |
| Chấm điểm L06 (teacher, PASS; việc khi nộp: hash sau rebase, CI, break 75) | `docs/ai-levelup/lessons/L06-spec-tdd/GRADE.md` | thêm | kết luận chấm |
| Backlog: #1, #3, #15, #18 `đã nhận` L06; #18–#20 từ review PR #8; #23–#26 từ GRADE L06 (teacher) | `docs/ai-levelup/lessons/BACKLOG.md` | sửa | đọc tay |
| Mục lục: L05 đã merge, L06 đã đạt + link GRADE (teacher) | `docs/ai-levelup/lessons/README.md` | sửa | đọc tay |
| Plan EX-1/2/3/7 (approved `f77e424`, Thực tế 9/9) | `docs/plans/L06-tdd-tooling.md` | thêm | commit trước code; `git log --reverse` |
| Plan EX-6 Stryker (approved `f77e424`, Thực tế 5/5) | `docs/plans/L06-mutation.md` | thêm | commit trước `pnpm add`/`9da1145` |
| Template spec EARS (6 mục, 25 dòng) | `specs/_template.md` | thêm | đọc tay, AC-1 |
| Dòng spec-first + `test:` trước `feat:` (64 dòng) | `CLAUDE.md` | sửa | `wc -l CLAUDE.md` = 64 |
| Subagent chỉ ghi file test, cite ID | `.claude/agents/test-writer.md` | thêm | frontmatter `name/description/tools`; vai trò làm tay (Agent tool không có type này trong phiên) |
| Subagent không ghi file test | `.claude/agents/implementer.md` | thêm | như trên; `check-tdd-commits.sh` exit 0 |
| Rule learner: output làm dữ liệu chạy qua `rtk proxy` (lỗi lặp lần 3) | `.claude/agents/learner.md` | sửa | `mistakes.md` |
| CI chặn `feat:` chạm file test | `scripts/ci/check-tdd-commits.sh` | thêm | `bash scripts/ci/check-tdd-commits.sh main HEAD` → OK |
| Self-test check TDD (10 ca, repo tạm) | `scripts/ci/test-check-tdd-commits.sh` | thêm | `bash scripts/ci/test-check-tdd-commits.sh` → 10/10 |
| Guard bảo vệ workflows/actions/turbo/settings/pr-reviewer + `package.json` `.scripts` | `scripts/ci/guard-diff.sh` | sửa | `test-guard-diff.sh` 28/28; local trên L06 → FAIL đúng (6 file) |
| +13 ca guard (workflow mới/sửa, action, turbo, settings, settings.local, pr-reviewer, scripts.test, devDep, script mới, package mới) | `scripts/ci/test-guard-diff.sh` | sửa | 28/28, exit 0 |
| Job `guard` lấy 2 script từ base + bước TDD; job `checks` chạy 4 self-test | `.github/workflows/ci.yml` | sửa | YAML parse; CI `chưa verify runtime` (chưa push) |
| Spec RL (9 ID, bảng triển khai, v2 RL-07 bảo toàn, v3 RL-08/09 sau review) | `specs/RL/spec.md` | thêm | AC-4/AC-6 |
| Spec WP (7 ID, đ/Đ, v2 blocklist + va chạm dấu) | `specs/WP/spec.md` | thêm | AC-5/AC-6 |
| RL-01..03: `parseTrustProxyHeader`, `getTrustedClientIp`, `normalizeEmail` | `typing-adventure/apps/web/src/lib/rate-limit.ts` | sửa | `trusted-proxy.test.ts` 8/8; `rate-limit.test.ts` không đổi 9/9 |
| RL-04..09: limit IP + email 10/15', trần IP 30/15', body qua `req.clone()`; sau review: 1 trường email (JSON như Auth.js), trần 254, 400 trước Auth.js | `typing-adventure/apps/web/src/app/api/auth/[...nextauth]/route.ts` | sửa | `credentials-limit.test.ts` 17/17 |
| Test RL-01..03 (test-writer, `9ea8dc3`) | `typing-adventure/apps/web/src/lib/__tests__/trusted-proxy.test.ts` | thêm | đỏ `parseTrustProxyHeader is not a function` → xanh |
| Test RL-04..09 (test-writer, `9ea8dc3`; RL-08/09 `6feddfd`) | `typing-adventure/apps/web/src/app/api/auth/[...nextauth]/__tests__/credentials-limit.test.ts` | thêm | đỏ assertion (RL-04/05/06), RL-07 xanh ngay (bảo toàn) |
| Biến `TRUST_PROXY_HEADER` | `typing-adventure/.env.example` | sửa | `grep -c TRUST_PROXY_HEADER` = 1 |
| Bảng triển khai → `TRUST_PROXY_HEADER`, env EC2/ECS/App Runner, checklist; cảnh báo bắt buộc ở production (khoá tài khoản) | `typing-adventure/docs/DEPLOY_AWS.md` | sửa | đọc tay, khớp bảng trong spec RL |
| WP-01..04: `moderateWords`, `DEFAULT_BLOCKLIST`, `MAX_WORD_LENGTH` (pure, 0 import) | `typing-adventure/packages/game-engine/src/moderation.ts` | thêm | `moderation.test.ts` 18/18; Stryker 93.33% |
| Export moderation | `typing-adventure/packages/game-engine/src/index.ts` | sửa | test import qua `../index` |
| Test WP-01..04 (test-writer, `28897ba`) | `typing-adventure/packages/game-engine/src/__tests__/moderation.test.ts` | thêm | đỏ `moderateWords is not a function` → xanh |
| WP-05/06: POST kiểm duyệt, 400 + đếm, lưu `accepted` | `typing-adventure/apps/web/src/app/api/wordpacks/route.ts` | sửa | `wordpacks-moderation.int.test.ts` trên `wt_wt_l06_wp` |
| WP-07: PUT cùng luật | `typing-adventure/apps/web/src/app/api/wordpacks/[id]/route.ts` | sửa | như trên |
| Test integration WP-05..07 (test-writer, `28897ba`) | `typing-adventure/apps/web/src/app/api/__tests__/wordpacks-moderation.int.test.ts` | thêm | đỏ assertion → 12/12 xanh, `current_schema = wt_wt_l06_wp` |
| Stryker devDeps 9.6.1 + script `mutation` | `typing-adventure/packages/game-engine/package.json` | sửa | `pnpm mutation` → 77.59% ≥ break 77 |
| Lockfile Stryker | `typing-adventure/pnpm-lock.yaml` | sửa | `pnpm install --frozen-lockfile` (CI) `chưa verify runtime` |
| Config Stryker (mutate, perTest, break 77 → 75 sau chấm) | `typing-adventure/packages/game-engine/stryker.config.json` | thêm | `pnpm --filter @typing-adventure/game-engine exec stryker run` |
| Ignore `.stryker-tmp/`, `reports/` | `typing-adventure/.gitignore` | sửa | `git status` sạch sau 4 lần chạy |
| Test đặc tả layout ngón tay (diệt mutant, import trong test) | `typing-adventure/packages/game-engine/src/__tests__/keyboard.test.ts` | thêm | keyboard.ts 0% → 98.96% |
| Test đặc tả nguồn từ của `createInitialState`/custom text | `typing-adventure/packages/game-engine/src/__tests__/engine-setup.test.ts` | thêm | engine.ts 45.45% → 73.33%; 5 lần chạy liên tiếp xanh |
| Báo cáo L06 | `docs/ai-levelup/learner/L06-spec-tdd/REPORT.md` | thêm | đọc tay |
| Section L06 | `docs/ai-levelup/learner/FEATURE_MAP.md` | sửa | mọi file của diff có đúng 1 dòng |
| Dòng L6 | `docs/ai-levelup/metrics.md` | sửa | đọc tay |
| 2 dòng lỗi (rtk diff lần 3 → rule; gitignore toàn cục) | `docs/ai-levelup/mistakes.md` | sửa | đọc tay |
| Tổng kết đợt 1 L00–L06 | `docs/ai-levelup/lessons/SUMMARY-L00-L06.md` | thêm | đọc tay |

## L07 · Parallel
Diff của 3 PR: #10 (`gh pr diff 10 --name-only`, merge `4df98c8`), #11 (`gh pr diff 11 --name-only`, merge `5590f0f`), branch lesson (`rtk proxy git diff --name-only origin/main...HEAD`, `origin/main` = `5590f0f`) + file commit lead. `GRADE.md` của teacher do người điều phối thêm khi có.

| Feature | File | Loại | Verify bằng |
|---|---|---|---|
| Bài học L07 (teacher) | `docs/ai-levelup/lessons/L07-parallel/LESSON.md` | thêm | đọc tay |
| Mục lục: L07 đang học (teacher) | `docs/ai-levelup/lessons/README.md` | sửa | đọc tay |
| Plan EX-2..EX-5, EX-8 (approved `5d98eb1`, trước rebase `9ad6519`; v2 `--` cho osascript) | `docs/plans/L07-parallel-tooling.md` | thêm | commit trước code; plan khớp diff 15/15 |
| EX-2 hook chặn Edit/Write ngoài scope spec/plan (`.wt-scope`, `CLAUDE_SCOPE_FILE`) | `.claude/hooks/guard-scope.sh` | thêm | `test-hooks.sh` 23 ca guard-scope; AC-2 offline A, B rỗng, ca âm rc=2 |
| EX-3 hook thông báo Notification/Stop (osascript argv, log, luôn exit 0) | `.claude/hooks/notify.sh` | thêm | 12 ca stub osascript; `PATH=/usr/bin:/bin` rc=0 stdout rỗng |
| EX-4 chặn `find -delete`/`-exec rm`, `eval`, `sh -c` lồng, pager đọc `.env*` (BACKLOG #20) | `.claude/hooks/guard-bash.sh` | sửa | +17 ca (13 chặn, 4 cho qua) |
| EX-4 đề xuất bật guard-scope + notify (không sửa `.claude/settings*.json`) | `.claude/hooks/settings.hooks.json` | sửa | `jq .` hợp lệ; `git diff main -- .claude/settings*.json` rỗng |
| EX-5 self-test 40 → 93 ca | `.claude/hooks/test-hooks.sh` | sửa | `bash .claude/hooks/test-hooks.sh` 93/93, leaks 0 |
| Ignore `.wt-scope` | `.gitignore` | sửa | `git status --ignored` trong worktree: `.wt-scope` không lọt |
| EX-8 lead time + wait time từ `gh api` | `scripts/metrics/lead-time.sh` | thêm | PR #9 `lead=54m03s wait=16m22s`; #10 `10m41s/4m40s`; #11 `10m46s/2m08s` |
| EX-8 self-test lead-time (stub gh) | `scripts/metrics/test-lead-time.sh` | thêm | `bash scripts/metrics/test-lead-time.sh` 8/8 |
| EX-6 spec RG (5 ID, IP `unknown` bỏ limit IP, warn 1 lần) | `specs/RG/spec.md` | thêm | AC-5; `approved` `d445572` trước `test:` `8f55285` |
| RG-01..04 register dùng `getTrustedClientIp` + `parseTrustProxyHeader`, warn production | `typing-adventure/apps/web/src/app/api/auth/register/route.ts` | sửa | `register-limit.test.ts`; web 49/49 |
| RG-04/05 bỏ `getClientIp`, thêm `warnIfProxyUntrusted` (BACKLOG #21, #24 phần cảnh báo) | `typing-adventure/apps/web/src/lib/rate-limit.ts` | sửa | `grep getClientIp` chỉ còn trong test RG-05 |
| Test RG-01..04 (đỏ trước `feat:`) | `typing-adventure/apps/web/src/app/api/auth/register/__tests__/register-limit.test.ts` | thêm | đỏ 7 ca → xanh; `check-tdd-commits.sh` OK |
| Test RG-05, xoá 4 test `getClientIp` trong commit `test:` | `typing-adventure/apps/web/src/lib/__tests__/rate-limit.test.ts` | sửa | 5 ca `createRateLimiter` không đổi, xanh |
| Báo cáo task A | `docs/ai-levelup/learner/L07-parallel/task-A.md` | thêm | đọc tay |
| EX-7 spec WM (6 ID, v2 WM-04 chỉ xét `\p{L}`) | `specs/WM/spec.md` | thêm | AC-6; `approved` `556d2e6` trước `test:` `c88d94e` |
| Lịch sử WP: WP-03 thay bởi WM | `specs/WP/spec.md` | sửa | đọc tay |
| WM-01..05 tách `[\s'-]+`, cụm liên tiếp, bỏ `\p{M}`, `mixed_script` (BACKLOG #23) | `typing-adventure/packages/game-engine/src/moderation.ts` | sửa | engine 193/193; mutation 78.02% (file 97.12%); 0 `import` |
| Test WM-01..06, 11 ca GRADE L06 | `typing-adventure/packages/game-engine/src/__tests__/moderation-v3.test.ts` | thêm | đỏ 10 ca → xanh; `moderation.test.ts` 0 dòng đổi |
| Báo cáo task B | `docs/ai-levelup/learner/L07-parallel/task-B.md` | thêm | đọc tay |
| Báo cáo L07 | `docs/ai-levelup/learner/L07-parallel/REPORT.md` | thêm | đọc tay |
| Chấm điểm L07 (teacher, PASS 9/9 AC; thử phá hook) | `docs/ai-levelup/lessons/L07-parallel/GRADE.md` | thêm | kết luận chấm |
| Backlog: #20, #21, #23 `đã xong`, #24 `một phần`; mới #27–#30 từ GRADE L07 (teacher) | `docs/ai-levelup/lessons/BACKLOG.md` | sửa | đọc tay |
| Section L07 | `docs/ai-levelup/learner/FEATURE_MAP.md` | sửa | mọi file trong diff 3 PR có đúng 1 dòng |
| 13 dòng L7 | `docs/ai-levelup/metrics.md` | sửa | output `lead-time.sh`, `gh api …/commits`, timeline |
| Lỗi rtk `git diff` trong vòng lặp scope (lần 4) | `docs/ai-levelup/mistakes.md` | sửa | đọc tay |

## L08 · Autonomous
Diff của 3 PR issue: #16 (`gh pr diff 16 --name-only`, merge `333f7d6`), #17 (merge `fb9ddad`), #18 (merge `4e1766c`), branch lesson (`rtk proxy git diff --name-only origin/main...HEAD`, `origin/main` = `4e1766c`) + file commit EX-7. `GRADE.md` của teacher và `BACKLOG.md` do người điều phối thêm khi có.

| Feature | File | Loại | Verify bằng |
|---|---|---|---|
| Bài học L08 (teacher) | `docs/ai-levelup/lessons/L08-autonomous/LESSON.md` | thêm | đọc tay |
| Mục lục: L08 đang học (teacher) | `docs/ai-levelup/lessons/README.md` | sửa | đọc tay |
| Plan EX-1..EX-3, EX-5, EX-6 (approved `1d8dfd9` trước code `09a2d10`; v2..v4 + Thực tế) | `docs/plans/L08-autonomous.md` | thêm | AC-1 `git log --reverse origin/main..HEAD` |
| EX-1 `STATUSES`, `LANES`, `parseLine`, `reduce`, `summary` thuần | `tools/agent-board/board-state.mjs` | thêm | `node --test tools/agent-board/test/*.test.mjs` 38/38 |
| EX-1 đường dẫn log chung mọi worktree (cạnh git-common-dir) | `tools/agent-board/log-path.mjs` | thêm | `emit.test.mjs`; event của 3 worktree issue chung 1 file |
| EX-1 CLI emit 1 dòng, validate bằng `parseLine` | `tools/agent-board/emit.mjs` | thêm | `emit.test.mjs` (1 dòng, status lạ bị từ chối) |
| EX-1 hook adapter (không ghi `prompt`, luôn exit 0) | `tools/agent-board/hook-adapter.mjs` | thêm | `hook-adapter.test.mjs` 4 loại event; chưa verify runtime (hook chưa bật) |
| EX-1/EX-7 in `summary()` + 2 tỉ lệ | `tools/agent-board/summary.mjs` | thêm | `summary.mjs events.jsonl` → 8/11, 4/4 |
| EX-1 server 127.0.0.1, chặn Host lạ, CSP, SSE, `--simulate`/`--replay` | `tools/agent-board/server.mjs` | thêm | AC-3 curl 200 + CSP, `event: state`, Host lạ 403, `lsof` 127.0.0.1 |
| EX-1 kịch bản mô phỏng ≥ 4 task chồng lấn | `tools/agent-board/simulate.mjs` | thêm | `--simulate` `/state` active 5, `wip_limit` |
| EX-1 UI lưới làn × status (chỉ `textContent`) | `tools/agent-board/public/app.js` | thêm | grep `innerHTML\|eval(` rỗng; title `<img onerror>` hiện thành chữ |
| EX-1 khung HTML board | `tools/agent-board/public/index.html` | thêm | `curl -si /` 200 |
| EX-1 style board (light/dark, < 900px) | `tools/agent-board/public/style.css` | thêm | `board.png` |
| EX-1 fixture L07 tái dựng (20 event, 3 task) | `tools/agent-board/fixtures/l07.jsonl` | thêm | `--replay` → 3 task `merged` |
| EX-1 test parseLine/reduce/summary | `tools/agent-board/test/board-state.test.mjs` | thêm | 38/38 |
| EX-1 test emit | `tools/agent-board/test/emit.test.mjs` | thêm | 38/38 |
| EX-1 test hook adapter | `tools/agent-board/test/hook-adapter.test.mjs` | thêm | 38/38 |
| EX-1 test server port 0 | `tools/agent-board/test/server.test.mjs` | thêm | 38/38 |
| EX-1 đề xuất hook `Agent\|Task`, `SubagentStop`, adapter cạnh `notify.sh` | `.claude/hooks/settings.hooks.json` | sửa | `jq .` OK; diff `.claude/settings*.json` rỗng |
| EX-1 ignore `.agent-board/` | `.gitignore` | sửa | `git ls-files \| grep -c ^.agent-board` = 0 |
| EX-1 screenshot board | `docs/ai-levelup/learner/L08-autonomous/board.png` | thêm | đọc tay |
| EX-2 issue form 7 mục | `.github/ISSUE_TEMPLATE/agent-task.yml` | thêm | actionlint không áp dụng; `ready-gate` gate[3] 7/7 trên #13–#15 |
| EX-2 cổng owner label + < 3 PR `agent/*` + template | `scripts/agent/ready-gate.sh` | thêm | `test-ready-gate.sh` 20/20; lần 4 #19 `gate[2] FAIL` rc=1 |
| EX-2 self-test cổng (stub `gh`) | `scripts/agent/test-ready-gate.sh` | thêm | `bash scripts/agent/test-ready-gate.sh` 20/20 |
| EX-2 vai runner + điều cấm | `.claude/agents/issue-runner.md` | thêm | AC-4 đọc tay; 3 PR issue không chạm file bảo vệ |
| EX-3 phân loại risk theo path (fail closed) | `scripts/agent/risk.sh` | thêm | `test-risk.sh` 30/30; #10 high, #11 standard |
| EX-3 dòng feature map mỗi PR | `scripts/agent/feature-map.sh` | thêm | `feature-map-auto.md` (#16 5/5, #17 5/5, #18 n/a) |
| EX-3 self-test risk + feature-map | `scripts/agent/test-risk.sh` | thêm | `bash scripts/agent/test-risk.sh` 30/30 |
| EX-3 bước risk + feature map trong review, `BLOCKED` khi deviation | `.claude/agents/pr-reviewer.md` | sửa | review #16 standard, #17/#18 full |
| EX-5 workflow `agent.yml` (owner label, `permissions: {}`, concurrency, timeout 30) | `.github/workflows/agent.yml` | thêm | actionlint 0 lỗi; chưa verify runtime (không có `ANTHROPIC_API_KEY`) |
| EX-5 pin SHA + EX-6 chạy 4 self-test | `.github/workflows/ci.yml` | sửa | grep `uses:` không pin rỗng; CI PR #16–#18 xanh |
| EX-5 pin SHA | `.github/workflows/claude-pr-review.yml` | sửa | grep `uses:` không pin rỗng |
| EX-5 Dependabot `github-actions` weekly | `.github/dependabot.yml` | thêm | đọc tay |
| EX-6 bảo vệ `.claude/agents/*`, `scripts/agent/*`, `scripts/metrics/*`, `.github/*.yml`, `ISSUE_TEMPLATE` | `scripts/ci/guard-diff.sh` | sửa | `test-guard-diff.sh` 35/35 |
| EX-6 ca guard mới (28 → 35) | `scripts/ci/test-guard-diff.sh` | sửa | 35/35 |
| EX-6 chặn gắn nhãn cổng, `gh label create\|edit\|delete` | `.claude/hooks/guard-bash.sh` | sửa | `test-hooks.sh` 110/110, leaks 0 |
| EX-6 ca hook mới (93 → 110) | `.claude/hooks/test-hooks.sh` | sửa | 110/110 |
| I-1 (#14) spec WX approved (issue #14) | `specs/WX/spec.md` | thêm | `lead-time.sh 16` `952a61a7` → 21m27s |
| WX-01..05 skeleton TR39 thu gọn trước khi gấp | `typing-adventure/packages/game-engine/src/moderation.ts` | sửa | engine 236/236; mutation 78.40 (`moderation.ts` 98.55) |
| Test WX-01..05 (`сат`, `ı`) đỏ trước `feat:` | `typing-adventure/packages/game-engine/src/__tests__/moderation-skeleton.test.ts` | thêm | `check-tdd-commits.sh` OK trên PR #16 |
| Log runner #14 | `docs/ai-levelup/learner/L08-autonomous/issue-14.md` | thêm | đọc tay |
| I-2 (#15) spec RC approved (issue #15) | `specs/RC/spec.md` | thêm | `lead-time.sh 17` `9bc2457f` → 23m08s |
| RC cảnh báo 1 lần ở production khi thiếu `TRUST_PROXY_HEADER` | `typing-adventure/apps/web/src/app/api/auth/[...nextauth]/route.ts` | sửa | web 64/64; review full (high) |
| RC cắt email ≤ 254 ký tự trước khi làm key (`limiterEmailKey`) | `typing-adventure/apps/web/src/lib/rate-limit.ts` | sửa | web 64/64; review full (high) |
| Test RC route credentials | `typing-adventure/apps/web/src/app/api/auth/[...nextauth]/__tests__/credentials-rc.test.ts` | thêm | đỏ trước `feat:`; RC 56/56 reviewer chạy lại |
| Test RC rate-limit key | `typing-adventure/apps/web/src/lib/__tests__/rate-limit-rc.test.ts` | thêm | đỏ trước `feat:` |
| Log runner #15 | `docs/ai-levelup/learner/L08-autonomous/issue-15.md` | thêm | đọc tay; canary grep rỗng |
| I-3 (#13) plan chore approved (issue #13) | `docs/plans/L08-little-content-import.md` | thêm | `lead-time.sh 18` `5233b2d5` → 24m23s |
| Rule `await import()` cho init cấp module | `.claude/rules/game-engine.md` | sửa | review full (high); `guard-diff` OK không label (rule không bảo vệ) |
| Test `little-content.ts` (mutation 57.84% → 100%) | `typing-adventure/packages/game-engine/src/__tests__/little-content-import.test.ts` | thêm | little 73/73 reviewer chạy lại |
| Log runner #13 + chỉ dẫn injection đã bỏ qua | `docs/ai-levelup/learner/L08-autonomous/issue-13.md` | thêm | `gh pr diff 18 \| grep` canary rỗng |
| EX-7 bản copy log board thật (57 event) | `docs/ai-levelup/learner/L08-autonomous/events.jsonl` | thêm | `cmp` với `.agent-board/events.jsonl`; gitleaks `--no-git` 0 leak; canary 0 |
| EX-7 feature map tự sinh 3 PR | `docs/ai-levelup/learner/L08-autonomous/feature-map-auto.md` | thêm | `feature-map.sh --header 16`, `17`, `18` rc=0 |
| EX-4 output cổng lần 4 (#19) | `docs/ai-levelup/learner/L08-autonomous/gate-4th-run.txt` | thêm | `gate[2] FAIL (3 open agent/* PRs, limit 3)` rc=1 |
| Báo cáo L08 | `docs/ai-levelup/learner/L08-autonomous/REPORT.md` | thêm | đọc tay |
| Section L08 | `docs/ai-levelup/learner/FEATURE_MAP.md` | sửa | mọi file trong diff 3 PR + lesson có đúng 1 dòng |
| Dòng L8 | `docs/ai-levelup/metrics.md` | sửa | `summary.mjs`, `lead-time.sh`, timeline PR |
| Lỗi lặp L08 (rtk lần 5, canary trong log, emit từ /tmp, `main` cũ) | `docs/ai-levelup/mistakes.md` | sửa | đọc tay |
