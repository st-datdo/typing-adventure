# RL · Rate limit đăng nhập theo IP + email, trusted proxy

Trạng thái: approved
Lesson/PR: L06 · EX-4 · BACKLOG: #1, #3

## Bối cảnh
`getClientIp` tin `x-real-ip` vô điều kiện, nên sau ALB/App Runner client tự gửi header đó để né limiter (#1). Limit đăng nhập chỉ theo IP (10 lần/15 phút), nên cả lớp học sau 1 NAT khoá nhau (#3).

## Requirements
Cấu hình: biến môi trường `TRUST_PROXY_HEADER` (`x-real-ip` | `x-forwarded-for`), đọc mỗi request. Cửa sổ của mọi limit: 15 phút.

| ID | EARS | Test |
|---|---|---|
| RL-01 | WHERE `TRUST_PROXY_HEADER=x-real-ip` THE SYSTEM SHALL lấy IP client = `x-real-ip` đã trim, bỏ qua `x-forwarded-for` (thiếu `x-real-ip` → `unknown`) | `apps/web/src/lib/__tests__/trusted-proxy.test.ts` |
| RL-02 | WHERE `TRUST_PROXY_HEADER=x-forwarded-for` THE SYSTEM SHALL lấy IP client = phần tử **cuối** của `x-forwarded-for` (trim), bỏ qua `x-real-ip`: client gửi `x-real-ip` giả thì key không đổi | `trusted-proxy.test.ts` |
| RL-03 | WHERE `TRUST_PROXY_HEADER` không đặt hoặc có giá trị khác hai giá trị trên (so sánh sau trim + lowercase) THE SYSTEM SHALL không tin header nào, IP client = `unknown` | `trusted-proxy.test.ts` |
| RL-04 | WHEN có POST `/api/auth/callback/credentials` THE SYSTEM SHALL đếm theo key `IP + email đã chuẩn hoá` (trim, lowercase; thiếu email → chuỗi rỗng), cho 10 lần/key; lần thứ 11 → 429, body `url` = `<origin>/login?error=RateLimited`; email khác cùng IP vẫn qua; `" Ana@X.io "` và `ana@x.io` chung key | `apps/web/src/app/api/auth/[...nextauth]/__tests__/credentials-limit.test.ts` |
| RL-05 | WHEN một IP đã biết (khác `unknown`) gửi 30 lần POST credentials (mọi email) trong cửa sổ THE SYSTEM SHALL trả 429 cho lần thứ 31 kể cả với email mới | `credentials-limit.test.ts` |
| RL-06 | IF IP client là `unknown` THEN THE SYSTEM SHALL bỏ trần theo IP (không gộp mọi người dùng vào 1 bucket), chỉ áp key IP + email: 35 lần với 35 email khác nhau đều tới `handlers.POST` | `credentials-limit.test.ts` |
| RL-07 | WHEN request qua limiter THE SYSTEM SHALL chuyển nguyên request cho `handlers.POST`: handler đọc được `email` và `password` từ form body; POST tới path `/api/auth/*` khác (vd `/api/auth/signout`) không bị đếm | `credentials-limit.test.ts` |

**Mặc định khi không cấu hình: không tin header nào** (RL-03). Lý do: header IP do client gửi được; tin mặc định = ai cũng né được limiter (#1). Cái giá: IP luôn `unknown`, nên chỉ còn limit theo email (vẫn chặn dò mật khẩu 1 tài khoản, RL-06 tránh khoá cả site). Production phải đặt biến theo bảng:

| Kiểu triển khai (`typing-adventure/docs/DEPLOY_AWS.md`) | Proxy trước app | `TRUST_PROXY_HEADER` |
|---|---|---|
| Cách 1: EC2 + nginx (`proxy_set_header X-Real-IP $remote_addr`) | nginx **ghi đè** `X-Real-IP` | `x-real-ip` |
| Cách 2: ECS Fargate + ALB | ALB **nối** IP thật vào cuối `X-Forwarded-For`, không đặt `X-Real-IP` | `x-forwarded-for` |
| Cách 3: App Runner | Envoy của App Runner nối IP vào cuối `X-Forwarded-For` | `x-forwarded-for` |
| Dev local (`pnpm dev`, không proxy) | không | không đặt |

Có thêm 1 tầng proxy nối XFF (vd CloudFront → ALB) thì phần tử cuối là IP của tầng đó: ngoài phạm vi, cần `TRUSTED_PROXY_HOPS` sau này.

File dự kiến: `typing-adventure/apps/web/src/lib/rate-limit.ts` (sửa: thêm `parseTrustProxyHeader`, `getTrustedClientIp`, `normalizeEmail`), `typing-adventure/apps/web/src/app/api/auth/[...nextauth]/route.ts` (sửa), `typing-adventure/.env.example` (sửa), `typing-adventure/docs/DEPLOY_AWS.md` (sửa). Test: `typing-adventure/apps/web/src/lib/__tests__/trusted-proxy.test.ts`, `typing-adventure/apps/web/src/app/api/auth/[...nextauth]/__tests__/credentials-limit.test.ts` (thêm).

## Ngoài phạm vi
- Store Redis/Upstash cho limiter (#2), limiter của `POST /api/auth/register` (vẫn dùng `getClientIp` cũ), `TRUSTED_PROXY_HOPS` cho nhiều tầng proxy.
- Khoá tài khoản lâu dài, CAPTCHA, thông báo email.

## Hành vi không đổi
- Response khi bị limit: status 429, header `Retry-After`, body `{ success: false, error: 'Too many requests', url: '<origin>/login?error=RateLimited' }` — test hồi quy: `credentials-limit.test.ts` (RL-04) dùng `tooManyRequests` sẵn có.
- `createRateLimiter` và `getClientIp` (dùng ở `register`) giữ nguyên hành vi — test hồi quy: `apps/web/src/lib/__tests__/rate-limit.test.ts` (không sửa, `git diff` chỉ được thêm).
- `GET /api/auth/*` đi thẳng `handlers.GET`.

## Lịch sử
- v1 2026-10-30 09:40: bản đầu, approved.
- v2 2026-10-30 09:41: RL-07 là test bảo toàn (route hiện tại đã chuyển nguyên request, không đếm path khác), xanh ngay ở commit `test:`; nó chặn hỏng body khi `feat:` thêm bước đọc email từ `req.clone()`. Ca "thiếu email" đặt dưới RL-04 (key email rỗng).
