# RC · Cảnh báo proxy cho route credentials + trần 254 ký tự cho key email

Trạng thái: approved (issue #15)
Lesson/PR: L08 · issue #15 · BACKLOG: #24 (phần còn lại)

## Bối cảnh
RG-04 chỉ cảnh báo thiếu `TRUST_PROXY_HEADER` khi có request register; production chỉ có lượt đăng nhập thì log im lặng dù limit theo IP đang tắt (#24). Route credentials kiểm độ dài email **sau** `normalizeEmail` (trim + lowercase) trong khi RL-09 nói "sau trim": `toLowerCase` có thể làm chuỗi dài ra (`'İ'` → 2 code unit), nên email hợp lệ theo RL-09 bị 400, và độ dài key limiter phụ thuộc vào kiểm tra đó thay vì một hàm lấy key có trần riêng.

## Requirements
Cấu hình: `TRUST_PROXY_HEADER` như RL-01..03 (`parseTrustProxyHeader`). Trần: 254 ký tự (code unit UTF-16, `String.length`), như RL-09.

| ID | EARS | Test |
|---|---|---|
| RC-01 | IF `NODE_ENV=production` và `TRUST_PROXY_HEADER` parse ra `none` (không đặt hoặc không hợp lệ) THEN POST `/api/auth/callback/credentials` SHALL gọi `console.warn` đúng **1 lần** mỗi process (chuỗi chứa `TRUST_PROXY_HEADER`) qua `warnIfProxyUntrusted`, dù có nhiều request (3 request → 1 lần warn) | `typing-adventure/apps/web/src/app/api/auth/[...nextauth]/__tests__/credentials-rc.test.ts` |
| RC-02 | WHEN `TRUST_PROXY_HEADER` hợp lệ (`x-real-ip`/`x-forwarded-for`) hoặc `NODE_ENV` khác `production` THE SYSTEM SHALL không gọi `console.warn` từ route credentials | `credentials-rc.test.ts` |
| RC-03 | WHEN register (RG-04) và credentials cùng chạy trong một process với cấu hình thiếu THE SYSTEM SHALL warn tổng cộng đúng 1 lần (dùng chung cờ của `warnIfProxyUntrusted`, không thêm cờ thứ hai) | `credentials-rc.test.ts` |
| RC-04 | THE SYSTEM SHALL export từ `lib/rate-limit.ts` hàm `limiterEmailKey(email: unknown): string` = `normalizeEmail(email)` cắt còn 254 ký tự đầu: chuỗi ≤ 254 sau chuẩn hoá giữ nguyên, chuỗi dài hơn → đúng 254 ký tự đầu, giá trị không phải chuỗi → `''` | `typing-adventure/apps/web/src/lib/__tests__/rate-limit-rc.test.ts` |
| RC-05 | WHEN POST credentials có email dài ≤ 254 sau trim nhưng > 254 sau `normalizeEmail` (vd `'a'.repeat(200) + 'İ'.repeat(54)`, sau lowercase dài 308) THE SYSTEM SHALL không trả 400, đếm theo key `IP + limiterEmailKey(email)`: hai email như vậy có cùng 254 ký tự đầu sau chuẩn hoá chung bucket (tổng lần thứ 11 → 429), và request được chuyển cho `handlers.POST` | `credentials-rc.test.ts` |

File dự kiến: `typing-adventure/apps/web/src/lib/rate-limit.ts` (sửa: thêm `limiterEmailKey`), `typing-adventure/apps/web/src/app/api/auth/[...nextauth]/route.ts` (sửa: gọi `warnIfProxyUntrusted`, kiểm RL-09 theo độ dài sau trim, key dùng `limiterEmailKey`). Test: `typing-adventure/apps/web/src/lib/__tests__/rate-limit-rc.test.ts` (thêm), `typing-adventure/apps/web/src/app/api/auth/[...nextauth]/__tests__/credentials-rc.test.ts` (thêm). Spec: `specs/RC/spec.md` (thêm).

## Ngoài phạm vi
- Store Redis cho limiter (#2).
- Giới hạn số key/bucket khi IP là `unknown`.
- Cắt theo grapheme/code point (trần đo bằng `String.length`, có thể cắt giữa cặp surrogate; key chỉ dùng để đếm).
- Sửa `.env.example`, `DEPLOY_AWS.md`, route register.

## Hành vi không đổi
- RL-01..RL-09: IP tin cậy, key `IP + email`, 10 lần/key, 30 lần/IP đã biết, bỏ trần IP khi `unknown`, chuyển nguyên request, luật đọc email theo `content-type`, 400 cho nhiều `email`/JSON không phải chuỗi/body hỏng, **email sau trim > 254 → 400 trước limiter, không gọi `handlers.POST`, không tạo bucket** — test hồi quy: `typing-adventure/apps/web/src/lib/__tests__/trusted-proxy.test.ts`, `typing-adventure/apps/web/src/app/api/auth/[...nextauth]/__tests__/credentials-limit.test.ts` (không sửa).
- RG-01..RG-05: limit register, warn 1 lần/process, không export `getClientIp` — test hồi quy: `typing-adventure/apps/web/src/app/api/auth/register/__tests__/register-limit.test.ts`, `typing-adventure/apps/web/src/lib/__tests__/rate-limit.test.ts` (không sửa).
- `normalizeEmail`, `createRateLimiter`, `parseTrustProxyHeader`, `getTrustedClientIp`, `warnIfProxyUntrusted` giữ nguyên chữ ký và hành vi.

## Lịch sử
- v1 2026-10-30 21:27: bản đầu, approved (issue #15). Issue yêu cầu vừa "cắt còn 254 sau `normalizeEmail`" vừa "RL-09 không đổi" (RL-09 từ chối email > 254 sau trim). Hai ý khớp nhau khi: RL-09 kiểm độ dài **sau trim** (đúng chữ của RL-09), còn trần 254 áp lên key **sau** `normalizeEmail` (RC-04/RC-05), phủ ca lowercase làm chuỗi dài ra mà code hiện tại trả 400. RG ghi "cảnh báo trong route credentials" là ngoài phạm vi; RC đưa nó vào phạm vi, RG-04 không đổi.
