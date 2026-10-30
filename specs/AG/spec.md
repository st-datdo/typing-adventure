# AG · Middleware chặn trang cần đăng nhập

Trạng thái: approved
Lesson/PR: không · BACKLOG: không

## Bối cảnh
`middleware.ts` export `auth` làm middleware cho `/friends`, `/admin`, `/lobby`, `/race`, nhưng `lib/auth.ts` không có callback `authorized`. Theo tài liệu NextAuth v5, thiếu callback này thì middleware chỉ gắn session, không chặn. E2E 2026-10-30: khách chưa đăng nhập mở `/lobby`, `/friends`, `/admin/dashboard` đều nhận 200; `/friends` hiện "Bạn bè (0)" như user thật.

## Requirements
| ID | EARS | Test |
|---|---|---|
| AG-01 | IF request tới path khớp matcher của middleware không có session (`auth` null hoặc thiếu `user`) THEN THE SYSTEM SHALL để callback `authorized` trả `false` | `typing-adventure/apps/web/src/lib/__tests__/auth-authorized.test.ts` |
| AG-02 | WHEN request tới path khớp matcher có session với `user` THE SYSTEM SHALL để callback `authorized` trả `true` | `auth-authorized.test.ts` |
| AG-03 | WHEN khách chưa đăng nhập GET `/friends`, `/lobby`, `/admin/dashboard`, `/race/ABC123` THE SYSTEM SHALL trả redirect (302 hoặc 307) với `Location` có pathname `/login` và query `callbackUrl` trỏ về URL gốc | `typing-adventure/apps/web/e2e/auth-guard.spec.ts` |

File dự kiến: `typing-adventure/apps/web/src/lib/auth.ts` (sửa: thêm `callbacks.authorized`). Test: `typing-adventure/apps/web/src/lib/__tests__/auth-authorized.test.ts`, `typing-adventure/apps/web/e2e/auth-guard.spec.ts` (thêm).

## Ngoài phạm vi
- Trang `/login` dùng `callbackUrl` để quay lại trang gốc sau khi đăng nhập (hiện `router.push('/')`).
- Kiểm tra quyền admin ở middleware: vẫn do trang admin và `requireAdmin()` ở API đảm nhận.

## Hành vi không đổi
- `/api/**` không nằm trong matcher, API vẫn tự trả 401 qua `getSessionUser()` — test hồi quy: `typing-adventure/apps/web/src/app/api/__tests__/auth-leaderboard.int.test.ts`.
- Trang công khai (`/`, `/games`, `/login`, `/register`, `/leaderboard`) vẫn 200 cho khách — test hồi quy: `typing-adventure/apps/web/e2e/smoke.spec.ts` (home) và AG-03 chỉ đụng path trong matcher.
- Callback `jwt`, `session` giữ nguyên.

## Lịch sử
- v1 2026-10-30 22:44: bản đầu, approved.
