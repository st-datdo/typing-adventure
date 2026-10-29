# Plan: Playwright E2E skeleton theo PORT của worktree

Trạng thái: approved
Lesson/PR: L04 · EX-3 (branch `lesson/L04-e2e`, worktree `.worktrees/lesson_l04_e2e`)

## Mục tiêu
- `pnpm --filter @typing-adventure/web test:e2e` tự bật `dev:ws` trên đúng `PORT` của `.wt-env`, chạy ≥ 3 test chromium rồi tắt server.
- Không có `PORT` → config báo lỗi rõ (không lặng lẽ dùng 3000); `reuseExistingServer: false` để không "mượn" server của checkout khác.
- Vitest (`pnpm test`) không nhặt file `e2e/`.

## Ngoài phạm vi
- Luồng đăng nhập/race nhiều trình duyệt, visual snapshot, firefox/webkit, CI.
- Seed dữ liệu: leaderboard trên schema `wt_*` rỗng vẫn trả `success: true`.

## File thay đổi (dự đoán)
- `docs/plans/L04-e2e-skeleton.md` (thêm)
- `typing-adventure/apps/web/package.json` (sửa: devDep `@playwright/test`, script `test:e2e`)
- `typing-adventure/pnpm-lock.yaml` (sửa: chỉ importer `apps/web` + gói `@playwright/test`, `playwright`, `playwright-core`, `fsevents`)
- `typing-adventure/apps/web/playwright.config.ts` (thêm)
- `typing-adventure/apps/web/e2e/smoke.spec.ts` (thêm)
- `typing-adventure/.gitignore` (sửa: `test-results/`, `playwright-report/`)

## Interface chạm tới
- `playwright.config.ts`: `PORT` từ `process.env`, thiếu/không phải số → `throw`; `baseURL` = `webServer.url` = `http://localhost:${PORT}`; `webServer.command` = `pnpm dev:ws` (cwd `apps/web`, kế thừa env shell gồm `PORT`), `reuseExistingServer: false`, `timeout` 180 s; 1 project `chromium`, `workers: 1`, reporter `list`, `testDir: 'e2e'`.
- Spec: (1) `page.goto('/')` → status 200, `<title>` chứa `Typing Adventure`; (2) `request.get('/api/leaderboard')` → 200, `success: true`, `data` là mảng; (3) `request.get('/socket.io/?EIO=4&transport=polling')` → body có `"sid"`, URL phản hồi có `:${PORT}`.
- Dependency mới: `@playwright/test` (devDep `apps/web`, bản mới nhất 1.64.x), browser chromium tải vào cache chung `~/Library/Caches/ms-playwright` (không tính vào thời gian `wt-new`).
- Env: dùng `PORT` có sẵn (`.wt-env`), không thêm biến.

## Verify
```bash
cd .worktrees/lesson_l04_e2e/typing-adventure
set -a && . ../.wt-env && set +a && pnpm --filter @typing-adventure/web test:e2e     # 3 passed, "Ready on http://localhost:<PORT>"
env -u PORT pnpm --filter @typing-adventure/web exec playwright test --list            # lỗi PORT
grep -n reuseExistingServer apps/web/playwright.config.ts                              # false
pnpm --filter @typing-adventure/web exec vitest list | grep -c e2e/                    # 0
```

## Tự review
1. Đoán được diff chưa? Có, 6 file. Mơ hồ: số dòng lockfile; có cần `tsconfig` exclude `e2e/` không (không: type của `@playwright/test` có sẵn sau khi cài).
2. Interface nào người khác đang dùng? `package.json` scripts (`test`, `dev:ws` giữ nguyên); `.gitignore` chỉ thêm dòng. Branch `lesson/L04-api-test` cũng sửa `apps/web/package.json` (script) → có thể conflict khi merge, xử lý ở EX-5.
3. Rollback? Revert commit; gỡ devDep bằng `pnpm --filter @typing-adventure/web remove @playwright/test`.

## Lịch sử
- v1 2026-10-29 23:52: bản đầu, approved.

## Thực tế
