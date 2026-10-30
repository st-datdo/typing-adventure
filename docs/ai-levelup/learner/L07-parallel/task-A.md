# L07 · Task A · `l07/rg-register-limit` (RG)

PR: https://github.com/st-datdo/typing-adventure/pull/10 · Spec: `specs/RG/spec.md` (5 ID) · Worktree: `.worktrees/l07_rg_register_limit` (PORT 3001, schema `wt_l07_rg_register_limit`) · BACKLOG #21, #24 (phần cảnh báo)

## Mốc giờ (`date '+%F %H:%M:%S'`, giờ máy local)

| Mốc | Giờ | Commit |
|---|---|---|
| Bắt đầu (đọc LESSON) | 2026-10-30 20:25:00 | |
| spec `approved` | 2026-10-30 20:26:03 | `d445572` docs(specs) |
| draft PR #10 | 2026-10-30 20:26:27 | (24 s sau commit spec) |
| `test:` đỏ | 2026-10-30 20:27:19 | `8f55285` test(web) |
| `feat:` xanh | 2026-10-30 20:28:20 | `f3600ca` feat(web) |
| ready | xem PR timeline (`ready_for_review`) | |

Spec v1 ghi giờ Lịch sử 20:27 (ước trước khi commit), commit thật lúc 20:26:03. Spec v2 (20:29) thêm lý do giữ chuỗi `getClientIp` trong test RG-05.

## Dòng đỏ đầu tiên từng ID (commit `test:` `8f55285`)

| ID | Test đỏ | Dòng đỏ đầu tiên |
|---|---|---|
| RG-01 | `a request with only x-forwarded-for is not counted in that IP bucket` | `AssertionError: expected 429 to be 200` |
| RG-02 | `keys by the last x-forwarded-for entry and ignores a spoofed x-real-ip` | `AssertionError: expected 200 to be 429` |
| RG-03 | `without a trusted header no site-wide unknown bucket locks registration` | `expected [ 200, 200, 200, 200, 200, 429, 429 ] to deeply equal [ 200, 200, 200, 200, 200, 200, 200 ]` |
| RG-04 | `warns exactly once per process in production without TRUST_PROXY_HEADER` | `expected "warn" to be called 1 times, but got 0 times` |
| RG-05 | `no longer exports getClientIp` | `expected [ 'createRateLimiter', …(4) ] to not include 'getClientIp'` |

Tổng ở commit `test:`: `Tests 7 failed | 9 passed (16)`. 9 ca xanh là ca bảo toàn: 429 + body + `Retry-After` (RG-01), IP khác có bucket riêng (RG-02), validate 400 / trùng 409 (RG-03), không warn khi đã cấu hình (RG-04), cùng 5 ca `createRateLimiter` không sửa. Test `getClientIp` (4 ca) được xoá trong commit `test:` này, không phải trong `feat:`.

## Verify ở HEAD `f3600ca` (qua `rtk proxy`, trong `typing-adventure/`)

| Lệnh | Kết quả |
|---|---|
| `pnpm --filter @typing-adventure/web test` | exit 0, `Test Files 6 passed`, `Tests 49 passed (49)` |
| `pnpm typecheck` | exit 0, `Tasks: 4 successful, 4 total` |
| `pnpm lint` | exit 0, `✖ 37 problems (0 errors, 37 warnings)` (bằng baseline) |
| `scripts/ci/check-tdd-commits.sh main HEAD` | exit 0, `check-tdd-commits: OK (3 commits in main..HEAD)` |
| `scripts/ci/guard-diff.sh main HEAD` (không `PR_LABELS`) | exit 0, `guard-diff: OK (main...HEAD)` |
| Kiểm scope offline AC-2 (hook `guard-scope.sh` của lead, `.wt-scope` = `specs/RG/spec.md`) | in rỗng (không có `OUT:`) |
| Ca âm: `packages/db/prisma/schema.prisma` | exit 2 |
| `grep -rn getClientIp typing-adventure/apps/web/src` | chỉ 2 dòng trong test RG-05 (`rate-limit.test.ts:67-68`), lý do ở spec v2 |

Integration `auth-leaderboard.int.test.ts` (cần DB): chưa verify runtime, không thuộc `pnpm test` mặc định; phần register của nó không đổi hành vi (validate/409/200 có test mock ở RG-03).

## Criteria có test

5/5 ID có ít nhất một test cite ID = **100%** (đếm `it('RG-xx` như AC-6 L06): RG-01 ×2, RG-02 ×2, RG-03 ×3, RG-04 ×3, RG-05 ×1, tổng 11 ca.

## File đã đổi (`git diff --name-only main...HEAD`)

- `specs/RG/spec.md` (thêm)
- `typing-adventure/apps/web/src/app/api/auth/register/__tests__/register-limit.test.ts` (thêm)
- `typing-adventure/apps/web/src/lib/__tests__/rate-limit.test.ts` (sửa: xoá test `getClientIp`, thêm RG-05)
- `typing-adventure/apps/web/src/app/api/auth/register/route.ts` (sửa)
- `typing-adventure/apps/web/src/lib/rate-limit.ts` (sửa: bỏ `getClientIp`, thêm `warnIfProxyUntrusted`)
- `docs/ai-levelup/learner/L07-parallel/task-A.md` (thêm)

Không chạm `packages/`, `.claude/`, `scripts/`, FEATURE_MAP/metrics/mistakes/BACKLOG/lessons.

## Quyết định thiết kế

- IP `unknown` → bỏ limit theo IP (không có bucket `unknown` chung). Một bucket 5 lần/15 phút cho cả site thì 5 lượt đăng ký bất kỳ khoá đăng ký toàn site. Không thêm key email vì kẻ phá đổi email mỗi lần, còn email trùng đã bị 409. Cái giá: chưa cấu hình thì register không có limit, nên RG-04 phải cảnh báo.
- Cảnh báo dùng flag module trong `rate-limit.ts` (1 lần mỗi process). Route credentials không gọi hàm này (ngoài phạm vi RG).

## Đề xuất BACKLOG

- **#21** (register còn dùng `getClientIp`): **done** khi PR #10 merge. Register dùng `getTrustedClientIp` + `parseTrustProxyHeader`, `getClientIp` đã bị xoá, có test RG-05 chặn nó quay lại.
- **#24**: **một phần**. Phần cảnh báo production thiếu `TRUST_PROXY_HEADER` đã xong cho register (RG-04). Còn lại: gọi `warnIfProxyUntrusted` trong route credentials (1 dòng, cần spec RL v4), và limiter Redis sau interface `RateLimiter` (#2). Có thể cân nhắc warn ngay lúc khởi động thay vì ở request đầu tiên.
