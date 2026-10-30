# RG · Limiter đăng ký theo trusted proxy

Trạng thái: approved
Lesson/PR: L07 · EX-6 · BACKLOG: #21, #24 (phần cảnh báo)

## Bối cảnh
`POST /api/auth/register` vẫn lấy IP bằng `getClientIp`, tin `x-real-ip` vô điều kiện: client tự gửi header đó là có bucket mới, né được limit 5 lần/15 phút (#21). Login (RL) đã chuyển sang `getTrustedClientIp`, register là chỗ cuối còn dùng hàm cũ. Production quên đặt `TRUST_PROXY_HEADER` thì không ai biết (#24).

## Requirements
Cấu hình: `TRUST_PROXY_HEADER` như RL-01..03 (`parseTrustProxyHeader`, đọc mỗi request). Limit: 5 lần/15 phút theo IP, như hiện tại.

| ID | EARS | Test |
|---|---|---|
| RG-01 | WHERE `TRUST_PROXY_HEADER=x-real-ip` THE SYSTEM SHALL đếm register theo `x-real-ip` (trim): lần thứ 6 từ cùng IP → 429; request chỉ có `x-forwarded-for` (không có `x-real-ip`) không bị tính vào bucket của IP trong `x-forwarded-for` | `typing-adventure/apps/web/src/app/api/auth/register/__tests__/register-limit.test.ts` |
| RG-02 | WHERE `TRUST_PROXY_HEADER=x-forwarded-for` THE SYSTEM SHALL đếm theo phần tử cuối của `x-forwarded-for`; client thêm `x-real-ip` giả không đổi key (lần thứ 6 vẫn 429), IP khác có bucket riêng | `register-limit.test.ts` |
| RG-03 | IF IP client là `unknown` (biến không đặt/không hợp lệ, hoặc thiếu header được tin) THEN THE SYSTEM SHALL không áp limit theo IP và không tạo bucket `unknown` chung: 7 lần đăng ký liên tiếp đều tới bước validate/DB (không có 429) | `register-limit.test.ts` |
| RG-04 | IF `NODE_ENV=production` và `TRUST_PROXY_HEADER` parse ra `none` THEN THE SYSTEM SHALL gọi `console.warn` đúng **1 lần** mỗi process (chuỗi chứa `TRUST_PROXY_HEADER`), dù có nhiều request; không warn khi biến hợp lệ hoặc `NODE_ENV` khác `production` | `register-limit.test.ts` |
| RG-05 | THE SYSTEM SHALL không còn export `getClientIp` từ `lib/rate-limit.ts` (không còn caller) | `typing-adventure/apps/web/src/lib/__tests__/rate-limit.test.ts` |

**Vì sao RG-03 bỏ limit thay vì 1 bucket `unknown`:** khi không tin header nào, mọi request có cùng key `unknown`. Một bucket 5 lần/15 phút cho cả site nghĩa là 5 lượt đăng ký (của bất kỳ ai, kể cả kẻ phá) khoá đăng ký toàn site 15 phút. RL-06 chọn cách tương tự (bỏ trần theo IP khi `unknown`). Register không có khoá email nào có ý nghĩa (kẻ phá đổi email mỗi lần; email trùng đã bị 409), nên không thêm key email. Cái giá: khi chưa cấu hình, register không có limit. RG-04 làm cho cấu hình thiếu ở production lộ ra trong log.

File dự kiến: `typing-adventure/apps/web/src/app/api/auth/register/route.ts` (sửa), `typing-adventure/apps/web/src/lib/rate-limit.ts` (sửa: bỏ `getClientIp`, thêm `warnIfProxyUntrusted`). Test: `typing-adventure/apps/web/src/app/api/auth/register/__tests__/register-limit.test.ts` (thêm), `typing-adventure/apps/web/src/lib/__tests__/rate-limit.test.ts` (sửa: xoá test `getClientIp`, thêm RG-05).

## Ngoài phạm vi
- Store Redis cho limiter (#2, phần còn lại của #24), `TRUSTED_PROXY_HOPS`.
- Cảnh báo trong route credentials (RL không đổi code; flag cảnh báo dùng chung module nên request login không tự warn).
- CAPTCHA, xác thực email, limit theo email cho register.
- Sửa `.env.example`/`DEPLOY_AWS.md` (bảng cấu hình đã có trong spec RL).

## Hành vi không đổi
- Response khi bị limit: 429, header `Retry-After`, body `{ success: false, error: 'Too many requests' }` (không có `url`) — test hồi quy: `register-limit.test.ts` (RG-01).
- Validate Zod (400), email trùng (409), tạo user thành công (200 `{ success: true, data }`) — test hồi quy: `register-limit.test.ts` (prisma mock), `typing-adventure/apps/web/src/app/api/__tests__/auth-leaderboard.int.test.ts` (integration, cần DB).
- `createRateLimiter`, `parseTrustProxyHeader`, `getTrustedClientIp`, `normalizeEmail` giữ nguyên — test hồi quy: `rate-limit.test.ts` (phần `createRateLimiter` không sửa), `trusted-proxy.test.ts`, `credentials-limit.test.ts`.

## Lịch sử
- v1 2026-10-30 20:27: bản đầu, approved.
- v2 2026-10-30 20:29: `grep -rn getClientIp apps/web/src` sau `feat:` chỉ còn 2 dòng trong test RG-05 (`rate-limit.test.ts`: tên test và chuỗi `'getClientIp'` trong assertion). Giữ lại vì đó là test chặn hàm quay lại; code không còn định nghĩa hay caller nào.
