# Plan: Sửa rate limit sau chấm (XFF bypass, login treo khi 429)

Trạng thái: approved
Lesson/PR: L03 · sửa theo GRADE (phát hiện 1, 2)

## Mục tiêu
- Không reset được bộ đếm bằng `x-forwarded-for` tự đặt: `getClientIp` lấy `x-real-ip` trước, không có thì phần tử **cuối** XFF, không có nữa thì `'unknown'`.
- Đăng nhập bị 429 không treo form: `signIn(..., { redirect: false })` nhận `{ error: 'RateLimited', status: 429 }` thay vì ném `TypeError`; trang login/register hiện câu báo thân thiện (i18n vi + en), nút luôn thoát `loading`.
- Test hồi quy cho cả hai.

## Ngoài phạm vi
- Danh sách proxy tin cậy / số hop cấu hình được. Giả định: chạy sau nginx của `docs/DEPLOY_AWS.md` (`X-Real-IP $remote_addr`, XFF nối IP thật vào cuối). Lộ thẳng Node ra Internet thì mọi header đều giả được: ghi trong REPORT.
- Dịch các chuỗi tiếng Việt cứng sẵn có khác trên 2 trang auth.

## File thay đổi (dự đoán)
- `typing-adventure/apps/web/src/lib/rate-limit.ts` (sửa)
- `typing-adventure/apps/web/src/lib/__tests__/rate-limit.test.ts` (sửa)
- `typing-adventure/apps/web/src/lib/api-response.ts` (sửa)
- `typing-adventure/apps/web/src/lib/__tests__/api-response.test.ts` (thêm)
- `typing-adventure/apps/web/src/app/api/auth/[...nextauth]/route.ts` (sửa)
- `typing-adventure/apps/web/src/app/(auth)/login/page.tsx` (sửa)
- `typing-adventure/apps/web/src/app/(auth)/register/page.tsx` (sửa)
- `typing-adventure/packages/i18n/src/vi.ts` (sửa)
- `typing-adventure/packages/i18n/src/en.ts` (sửa)

## Interface chạm tới
- `getClientIp(headers: Headers): string`: chữ ký giữ nguyên, đổi thứ tự ưu tiên.
- `tooManyRequests(retryAfterMs: number, url?: string)`: thêm tham số tuỳ chọn; có `url` thì body `{ success: false, error, url }` (vẫn đúng envelope, thêm trường cho NextAuth client). Caller cũ (register, sessions) không đổi.
- `POST /api/auth/callback/credentials` 429: body có `url = <origin>/login?error=RateLimited` (khớp `pages.signIn`; `redirect: true` cũng về trang login).
- i18n key mới: `authRateLimited`, `authConnectionError` (vi + en). Env / dependency mới: không.

## Verify
```bash
cd typing-adventure && pnpm --filter @typing-adventure/web test   # case XFF giả bị bỏ qua, tooManyRequests có url
pnpm --filter @typing-adventure/web dev   # register x6 → 429; thêm -H 'x-forwarded-for: 9.9.9.9' vẫn 429
# credentials x11: lần 11 → 429, body có "url":".../login?error=RateLimited"
rtk proxy pnpm lint; rtk proxy pnpm typecheck --force; rtk proxy pnpm test; rtk proxy pnpm build --force
```

## Tự review
1. Đoán được diff chưa? Có, 9 file. `next/server` chạy được trong Vitest node hay không là rủi ro nhỏ cho test `api-response`; nếu không chạy được thì ghi v2 trước khi đổi cách test.
2. Interface nào người khác đang dùng? `getClientIp` (register, `[...nextauth]`), `tooManyRequests` (3 route), `signIn` client ở 2 trang auth.
3. Rollback: revert commit sửa; plan và 2 commit code L03 độc lập.

## Lịch sử
- v1 2026-10-29 23:32: bản đầu, approved.

## Thực tế
