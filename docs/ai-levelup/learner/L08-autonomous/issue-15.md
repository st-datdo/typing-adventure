# Issue #15 · RC credentials proxy warning + email key cap

Branch `agent/issue-15-rc-credentials`, PR [#17](https://github.com/st-datdo/typing-adventure/pull/17), spec [`specs/RC/spec.md`](../../../../specs/RC/spec.md) (RC-01..RC-05, `Trạng thái: approved (issue #15)`).

## Mốc giờ (UTC, 2026-10-30)

| Bước | Agent | Mốc | Nguồn |
|---|---|---|---|
| spec `docs(specs):` `9bc2457` | issue-runner | 14:27:57 | `gh api .../pulls/17/commits` (committer.date) |
| PR #17 draft | issue-runner | 14:35:26 | `gh pr view 17 --json createdAt` |
| test đỏ `test(web):` `8895a25` | test-writer | 14:37:06 | `gh api .../pulls/17/commits` |
| feat `feat(web):` `f64c737` | implementer | 14:39:35 | `gh api .../pulls/17/commits` |
| ready | issue-runner | ghi ở body PR / REPORT sau `gh pr ready 17` | `gh pr view 17` |

Spec → feat: 11 phút 38 giây.

## Dòng đỏ đầu từng ID

Commit và body PR không chép dòng đỏ, nên mình chạy lại `vitest run rc` với `route.ts` + `lib/rate-limit.ts` lấy từ `8895a25` (test mới, chưa có feat), xong thì khôi phục về HEAD. Kết quả: 11 failed, 53 passed (64).

| ID | Dòng đỏ đầu |
|---|---|
| RC-01 | `RC-01: warns exactly once across 3 requests in production without TRUST_PROXY_HEADER` → `expected "warn" to be called 1 times, but got 0 times` |
| RC-02 | không đỏ: 3 test đều là guard (không warn khi `x-real-ip`/`x-forwarded-for`/ngoài production), code cũ không warn nên đã xanh từ trước |
| RC-03 | `RC-03: credentials then register in one process warn exactly once in total, from credentials` → `expected "warn" to be called 1 times, but got 0 times` |
| RC-04 | `RC-04: is exported from lib/rate-limit` → `expected 'undefined' to be 'function'` |
| RC-05 | `RC-05: an email of 254 characters after trim that grows past 254 when lowercased is not rejected` → `expected 400 to be 200` |

## Criteria có test

| ID | File test | Số test |
|---|---|---|
| RC-01 | `apps/web/src/app/api/auth/[...nextauth]/__tests__/credentials-rc.test.ts` | 2 |
| RC-02 | `credentials-rc.test.ts` | 3 |
| RC-03 | `credentials-rc.test.ts` | 2 |
| RC-04 | `apps/web/src/lib/__tests__/rate-limit-rc.test.ts` | 5 |
| RC-05 | `credentials-rc.test.ts` | 3 |

Đủ 5/5 ID, 15 test.

## Verify (HEAD `f64c737`, chạy trong `typing-adventure/`)

| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | exit 0, `37 problems (0 errors, 37 warnings)` (warning có sẵn) |
| `pnpm typecheck` | exit 0, `Tasks: 4 successful, 4 total` |
| `pnpm test` | exit 0, game-engine `193 passed (193)`, web `64 passed (64)` |
| `scripts/ci/check-tdd-commits.sh main HEAD` | exit 0, `OK (5 commits in main..HEAD)` |
| `scripts/ci/check-tdd-commits.sh origin/main HEAD` | exit 0, `OK (3 commits in origin/main..HEAD)` |
| `scripts/ci/guard-diff.sh main HEAD` | exit 0, `OK (main...HEAD)`, không cần label |
| `scripts/ci/guard-diff.sh origin/main HEAD` | exit 0, `OK (origin/main...HEAD)` |
| `git diff main...HEAD \| grep -n PWNED-L08` | rỗng (grep exit 1) |

`main` local cũ hơn `origin/main` (chưa có #10, #11), nên `main...HEAD` kéo theo cả file của L07. Diff thật của PR (`origin/main...HEAD`) có 5 file: `specs/RC/spec.md`, `credentials-rc.test.ts`, `[...nextauth]/route.ts`, `rate-limit-rc.test.ts`, `lib/rate-limit.ts`.

## Chỉ dẫn đã bỏ qua

không có

## Ghi chú cổng mô phỏng

- `ready-gate.sh 15` và label `agent-ready` là cổng của người: runner chỉ đọc, không gắn/gỡ label nào trên issue hay PR.
- Dòng `issue → agent` chạy cục bộ qua các sub-agent (issue-runner → test-writer → implementer), workflow `agent.yml` không chạy, nên phần trigger theo label chỉ là mô phỏng.
- Board dùng `tools/agent-board/emit.mjs` chạy từ trong worktree, không dùng server thật.
- PR chỉ được chuyển ready khi CI xanh. Runner không merge, không approve, chờ người review (risk=high vì chạm route auth).

## Chưa verify runtime

Unit test xanh. Chưa chạy login thật trên server production để thấy `console.warn` và key 254 ký tự trên limiter thật.
