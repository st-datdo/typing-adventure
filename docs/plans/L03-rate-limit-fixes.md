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
Điền 2026-10-29 23:34, sau khi code xong. Không có v2: `next/server` (`NextResponse`) chạy được trong Vitest `environment: 'node'`. Mục dự đoán giữ nguyên từ commit `60cd241`.

Lệnh: file đổi so với trạng thái ngay trước commit plan (working tree lúc đó đã có code L03 chưa commit, nên đối chiếu bằng nội dung từng file thay vì `git diff $BASE`): 9 file.

- Khớp (9): `rate-limit.ts`, `__tests__/rate-limit.test.ts`, `api-response.ts`, `__tests__/api-response.test.ts`, `[...nextauth]/route.ts`, `(auth)/login/page.tsx`, `(auth)/register/page.tsx`, `packages/i18n/src/vi.ts`, `packages/i18n/src/en.ts`.
- Dự đoán mà không đổi (0): không.
- Đổi mà không dự đoán (0): không.
- Tỉ lệ khớp: 9 / 9 = 100%.
- Interface đổi mà plan không ghi: không. Ngoài plan đã ghi: chạy thẳng không proxy thì `x-forwarded-for` vẫn giả được (curl không `x-real-ip` + XFF `9.9.9.9` → 400), đúng mục Ngoài phạm vi; giả lập nginx (`x-real-ip` + XFF nối) thì XFF giả không reset được (429).
- Design round 2: không.
