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
| Backlog follow-up từ review (teacher) | `docs/ai-levelup/lessons/BACKLOG.md` | thêm | đọc tay |
| Mục lục: L03 PR #6, L04 đang học, link BACKLOG (teacher) | `docs/ai-levelup/lessons/README.md` | sửa | đọc tay |
| Plan worktree scripts (approved, commit `f52ebb8`) | `docs/plans/L04-worktree-scripts.md` | thêm | commit trước code; Thực tế 5/5 |
| Tạo worktree cô lập (worktree + port + schema + env) | `scripts/wt-new.sh` | thêm | `bash -n`, `shellcheck`, `/usr/bin/time` 15.11 s / 7.44 s, AC-3 |
| Dọn worktree an toàn (từ chối bẩn/main/public, drop schema, xoá branch đã merge) | `scripts/wt-prune.sh` | thêm | EX-5 (a)–(d), prune 2 branch task |
| Ignore `.worktrees/`, `.wt-env` | `.gitignore` | sửa | `git check-ignore -q .worktrees/x` |
| Dòng lệnh worktree trong Commands | `CLAUDE.md` | sửa | `wc -l` 62, dòng 23 |
| Plan API integration test (approved, commit `fb79f38`) | `docs/plans/L04-api-integration-test.md` | thêm | commit trước code; Thực tế 6/6 |
| Unit Vitest loại `*.int.test.ts` | `typing-adventure/apps/web/vitest.config.ts` | sửa | `pnpm test` với DB sai → 17 pass |
| Config integration (nạp `.env`, globalSetup) | `typing-adventure/apps/web/vitest.integration.config.ts` | thêm | `test:integration` 6 pass |
| Guard `schema=wt_` trước khi chạm DB | `typing-adventure/apps/web/src/test/integration-global-setup.ts` | thêm | URL sai / `public` → exit 1 "refused" |
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
