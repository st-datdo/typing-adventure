# Plan: Rate limiting cho auth + sessions

Trạng thái: approved
Lesson/PR: L03 · EX-2

## Mục tiêu
- `POST /api/auth/register` 5 lần / 15 phút / IP, chặn trước `req.json()` (trước bcrypt cost 12).
- `POST /api/auth/callback/credentials` 10 lần / 15 phút / IP; các path NextAuth khác đi thẳng `handlers.POST`.
- `POST /api/sessions` 30 lần / phút / `user.id`, đặt sau `getSessionUser()`.
- Bị chặn: HTTP 429, body `{ success: false, error }` qua `api-response.ts`, header `Retry-After` (giây, làm tròn lên, ≥ 1).
- Vitest cho `apps/web`, ≥ 5 test limiter.

## Ngoài phạm vi
- Redis/Upstash, nhiều instance (in-memory: mỗi process 1 bộ đếm, mất khi restart).
- Rate limit trong `middleware.ts` (edge, không chung `Map`) và event Socket.IO.
- Proxy tin cậy: `x-forwarded-for` giả được nếu không đứng sau nginx (`docs/DEPLOY_AWS.md`).

## File thay đổi (dự đoán)
- `typing-adventure/apps/web/src/lib/rate-limit.ts` (thêm)
- `typing-adventure/apps/web/src/lib/api-response.ts` (sửa)
- `typing-adventure/apps/web/src/app/api/auth/register/route.ts` (sửa)
- `typing-adventure/apps/web/src/app/api/auth/[...nextauth]/route.ts` (sửa)
- `typing-adventure/apps/web/src/app/api/sessions/route.ts` (sửa)
- `typing-adventure/apps/web/src/lib/__tests__/rate-limit.test.ts` (thêm)
- `typing-adventure/apps/web/vitest.config.ts` (thêm)
- `typing-adventure/apps/web/package.json` (sửa)
- `typing-adventure/pnpm-lock.yaml` (sửa)
- `CLAUDE.md` (sửa: comment `pnpm test` không còn "only game-engine")

## Interface chạm tới
- `createRateLimiter({ limit, windowMs, now? }): { check(key: string): RateLimitResult; size(): number }` (fixed window, dọn key hết hạn mỗi lần `check` khi đã qua ≥ `windowMs` từ lần dọn trước).
- `RateLimitResult = { allowed: boolean; remaining: number; retryAfterMs: number }`.
- `getClientIp(headers: Headers): string`: phần tử đầu `x-forwarded-for` → `x-real-ip` → `'unknown'`.
- `tooManyRequests(retryAfterMs: number)` mới trong `api-response.ts`: `err('Too many requests', 429)` + `Retry-After`.
- `[...nextauth]/route.ts`: `GET` giữ nguyên, `POST` thành hàm bọc `handlers.POST`.
- HTTP: 429 mới trên 3 route. Env: không. Dependency mới: `vitest@^2.1.0` (devDependencies `apps/web`).

## Verify
```bash
cd typing-adventure && pnpm --filter @typing-adventure/web test   # ≥ 5 test pass
pnpm test                                                         # game-engine 137 + web
grep -l rate-limit apps/web/src/app/api/auth/register/route.ts 'apps/web/src/app/api/auth/[...nextauth]/route.ts' apps/web/src/app/api/sessions/route.ts
pnpm --filter @typing-adventure/web dev  # curl register x6 → 400 400 400 400 400 429; credentials lần 11 → 429
```

## Tự review
1. Đoán được diff chưa? Có, 10 file. Mơ hồ duy nhất: lockfile đổi bao nhiêu dòng.
2. Interface nào người khác đang dùng? `ok/err/unauthorized` (mọi route, chỉ thêm hàm, không đổi), `handlers` của NextAuth (`GET`/`POST` vẫn export cùng tên), client `signIn('credentials')` chỉ thấy thêm 429.
3. Rollback: revert commit code; plan và test độc lập.

## Lịch sử
- v1 2026-10-29 23:18: bản đầu, approved.

## Thực tế
Điền 2026-10-29 23:24, sau khi code xong. Không có v2; mục dự đoán giữ nguyên từ commit `96503e0`.

Lệnh (BASE `1d16cef`): `git diff --name-only $BASE -- typing-adventure CLAUDE.md` + `git ls-files --others --exclude-standard typing-adventure` ra 13 file; 10 file thuộc plan này, 3 file còn lại (`security-headers.ts`, test của nó, `next.config.ts`) thuộc `L03-security-headers.md`.

- Khớp (10): `rate-limit.ts`, `api-response.ts`, `register/route.ts`, `[...nextauth]/route.ts`, `sessions/route.ts`, `__tests__/rate-limit.test.ts`, `apps/web/vitest.config.ts`, `apps/web/package.json`, `pnpm-lock.yaml` (+3 dòng, chỉ importer `apps/web`), `CLAUDE.md` (dòng `pnpm test`; cùng file có dòng plan-first của EX-1).
- Dự đoán mà không đổi (0): không.
- Đổi mà không dự đoán (0): không.
- Tỉ lệ khớp: 10 / 10 = 100%.
- Interface đổi mà plan không ghi: export thêm 2 type `RateLimiterOptions`, `RateLimiter` (chỉ là kiểu của tham số/kết quả `createRateLimiter`, không caller ngoài). `package.json` thêm script `test` (plan ghi chung "sửa").
- Design round 2: không.
