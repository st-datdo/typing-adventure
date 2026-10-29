# Plan: Security headers

Trạng thái: approved
Lesson/PR: L03 · EX-3

## Mục tiêu
- Mọi response (`source: '/:path*'`) có CSP, HSTS (chỉ production), `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.
- CSP cho phép đúng thứ app dùng: inline `THEME_BOOT`, font tự host, `/voice/*.mp3`, Socket.IO (`NEXT_PUBLIC_WS_URL` hoặc cùng origin), Sentry ingest + Replay worker khi có DSN.
- Dev giữ `'unsafe-eval'` (React Refresh) và `ws:` (HMR); production bỏ cả hai.

## Ngoài phạm vi
- CSP nonce qua middleware (bỏ `'unsafe-inline'`), `Report-Only` + `report-to`.
- Header riêng cho handshake Socket.IO (không phải HTML, CSP không ảnh hưởng).

## File thay đổi (dự đoán)
- `typing-adventure/apps/web/src/lib/security-headers.ts` (thêm)
- `typing-adventure/apps/web/src/lib/__tests__/security-headers.test.ts` (thêm)
- `typing-adventure/apps/web/next.config.ts` (sửa)

## Interface chạm tới
- `buildSecurityHeaders({ isDev, wsUrl?, sentryDsn? }): { key: string; value: string }[]`, không dùng alias `@/`, không import Next.
- CSP: `default-src 'self'`; `script-src 'self' 'unsafe-inline'` (+`'unsafe-eval'` dev); `style-src 'self' 'unsafe-inline'`; `img-src 'self' data: blob:`; `font-src 'self' data:`; `media-src 'self'`; `connect-src 'self'` + origin http(s) và ws(s) của `wsUrl` + origin ingest từ DSN (`new URL(dsn).origin`) + `ws:` dev; `worker-src 'self' blob:`; `object-src 'none'`; `base-uri 'self'`; `frame-ancestors 'none'`; `form-action 'self'`.
- `form-action 'self'`: có. Form login/register submit bằng JS (`signIn` của `next-auth/react` gọi `fetch` rồi `window.location` sang Google), không có `<form action>` trỏ ra ngoài, nên `'self'` không chặn OAuth mà vẫn chặn form bị chèn gửi ra domain lạ.
- HSTS: `max-age=63072000; includeSubDomains` chỉ khi `!isDev`. `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- `next.config.ts`: thêm `async headers()` vào `nextConfig`, `isDev = NODE_ENV !== 'production'`; nhánh `withSentryConfig` giữ nguyên. Env mới: không. Dependency mới: không.

## Verify
```bash
cd typing-adventure && pnpm --filter @typing-adventure/web test
pnpm --filter @typing-adventure/web dev:ws   # curl -sI / → CSP có unsafe-eval, không HSTS; socket.io polling có "sid"
pnpm build && pnpm --filter @typing-adventure/web start   # curl -sI / → có HSTS, không unsafe-eval
NEXT_PUBLIC_SENTRY_DSN=https://abc@o1.ingest.sentry.io/1 pnpm build   # không lỗi
```

## Tự review
1. Đoán được diff chưa? Có, 3 file. Rủi ro: `next.config.ts` không import được file `.ts` tương đối; nếu vậy dừng, ghi v2 rồi mới đổi cách.
2. Interface nào người khác đang dùng? `next.config.ts` (build, `server.ts` qua `next({ dev })`, Dockerfile standalone); `withSentryConfig` bọc cùng object nên `headers()` đi theo.
3. Rollback: revert commit; header là cấu hình thuần, không đổi dữ liệu.

## Lịch sử
- v1 2026-10-29 23:20: bản đầu, approved.

## Thực tế
