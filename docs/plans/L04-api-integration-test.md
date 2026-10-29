# Plan: API integration test (register + leaderboard) trên schema wt_*

Trạng thái: approved
Lesson/PR: L04 · EX-2 (branch `lesson/L04-api-test`, worktree `.worktrees/lesson_l04_api_test`)

## Mục tiêu
- `pnpm --filter @typing-adventure/web test` vẫn chỉ chạy unit, không cần DB (loại `*.int.test.ts`).
- Script mới `test:integration` (config riêng) chạy ≥ 4 test gọi thẳng handler `POST /api/auth/register` và `GET /api/leaderboard` bằng `NextRequest` trên Postgres thật, schema `wt_<slug>` của worktree.
- Guard: `DATABASE_URL` không có `schema=wt_…` → thoát lỗi rõ trước khi chạm DB (không bao giờ ghi `public`).

## Ngoài phạm vi
- Test các route cần đăng nhập (`getSessionUser` cần cookie NextAuth): để lesson sau.
- Chạy integration trong `pnpm test`/turbo, CI: không có DB trong CI.
- Seed dữ liệu mẫu: test tự tạo dữ liệu của mình.

## File thay đổi (dự đoán)
- `docs/plans/L04-api-integration-test.md` (thêm)
- `typing-adventure/apps/web/vitest.config.ts` (sửa: `exclude` `**/*.int.test.ts`)
- `typing-adventure/apps/web/vitest.integration.config.ts` (thêm)
- `typing-adventure/apps/web/src/test/integration-global-setup.ts` (thêm: guard schema)
- `typing-adventure/apps/web/src/app/api/__tests__/auth-leaderboard.int.test.ts` (thêm)
- `typing-adventure/apps/web/package.json` (sửa: script `test:integration`)

## Interface chạm tới
- Config integration: nạp `apps/web/.env` bằng `process.loadEnvFile` (Node ≥ 20.12; `vite` không resolve được trực tiếp từ `apps/web` do pnpm strict), biến shell đã có thì giữ (để chứng minh guard). `include: ['src/**/__tests__/**/*.int.test.ts']`, alias `@`, `globalSetup` guard, `fileParallelism: false`.
- Guard (`globalSetup`): regex `[?&]schema=wt_[a-z0-9_]{1,60}(&|$)` trên `process.env.DATABASE_URL`; sai → `throw` với thông điệp chỉ nêu tên biến + yêu cầu, không in URL.
- Test dùng export có sẵn: `POST` (`@/app/api/auth/register/route`), `GET` (`@/app/api/leaderboard/route`), `prisma` (`@typing-adventure/db`). Không sửa route.
- Limiter register 5 lần/IP: mỗi case đặt `x-real-ip` riêng (`203.0.113.<n>`).
- Dữ liệu: email `it-<runId>-…@int.test`; `beforeAll` + `afterAll` xoá `User` có email `@int.test` (cascade `GameSession`, `UserRecord`).
- Env / dependency mới: không.

## Verify
```bash
cd .worktrees/lesson_l04_api_test/typing-adventure
pnpm --filter @typing-adventure/web test                         # unit, không int
DATABASE_URL=postgresql://x:y@127.0.0.1:1/none pnpm --filter @typing-adventure/web test   # vẫn pass
pnpm --filter @typing-adventure/web test:integration             # ≥ 4 pass
DATABASE_URL=postgresql://x:y@127.0.0.1:1/none pnpm --filter @typing-adventure/web test:integration  # exit ≠ 0, lỗi guard
```

## Tự review
1. Đoán được diff chưa? Có, 6 file. Mơ hồ: thư mục `__tests__` dưới `src/app/api` (Next coi `_` là private folder, không thành route); nếu `next build` phàn nàn thì chuyển sang `src/lib/__tests__` (ghi v2).
2. Interface nào người khác đang dùng? `vitest.config.ts` (script `test`, turbo `test`): chỉ thêm `exclude`, include giữ nguyên.
3. Rollback? Revert commit; không đổi route/schema.

## Lịch sử
- v1 2026-10-29 23:51: bản đầu, approved.

## Thực tế
