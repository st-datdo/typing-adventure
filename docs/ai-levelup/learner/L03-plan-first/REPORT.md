# L03 · Plan-first — Báo cáo

Branch: `lesson/L03-plan-first` · PR: xem cuối báo cáo · Chấm: [GRADE.md](../../lessons/L03-plan-first/GRADE.md) PASS

`BASE=1d16cef6627b7dad2e51c15af4dc58a6b6df8eea` (`git rev-parse HEAD` đầu phiên, 23:16:56). L02 (PR #5) đã merge nên `BASE` = `origin/main`. Lưu ý: ref `main` local đang cũ (`48535e5`), so sánh bằng `main` sẽ kéo cả diff L02 vào; mọi lệnh trong báo cáo dùng `BASE`.

## Điều đã học
- Plan chỉ có giá trị khi liệt kê được file trước khi code. Đọc 5 file (3 route, `api-response.ts`, `auth.ts`) là đủ để thấy 429 phải đi qua 1 helper mới trong `api-response.ts`, nên file đó vào danh sách ngay từ đầu thay vì thành "file lạ".
- Commit plan riêng trước khi code là bằng chứng rẻ nhất: thứ tự commit + mục dự đoán không đổi (diff plan sau đó chỉ có dòng `+`).
- Rủi ro lớn nhất của plan nên ghi thành điều kiện dừng (vd "nếu `next.config.ts` không import được TS thì ghi v2"). Lần này rủi ro không xảy ra, nên design round 2 = 0 là thật chứ không phải giấu.
- Rate limit phải ở route handler (Node), chặn trước `req.json()`/bcrypt; logic đếm là hàm thuần với đồng hồ inject, test không cần `sleep`.
- Header áp qua `headers()` được tính lúc build: `next build` bake CSP production (không `unsafe-eval`, có HSTS) vào `routes-manifest.json`, `next dev`/`dev:ws` tính theo dev.

## Bài tập
| EX | Việc đã làm | File |
|---|---|---|
| EX-1 | Template plan 34 dòng, 8 mục `##` + dòng `Trạng thái:`; 1 dòng plan-first trong `## Conventions` | `docs/plans/_template.md`, `CLAUDE.md` |
| EX-2 | Plan approved + commit `96503e0` trước code. Limiter fixed window in-memory, dọn key hết hạn, `getClientIp`; helper `tooManyRequests` (429 + `Retry-After`); áp vào register (trước `req.json()`), `[...nextauth]` POST chỉ path credentials, sessions (sau `getSessionUser()`); Vitest cho web (7 test limiter) | `docs/plans/L03-rate-limit.md`, `apps/web/src/lib/{rate-limit.ts,api-response.ts}`, 3 `route.ts`, `apps/web/src/lib/__tests__/rate-limit.test.ts`, `apps/web/{vitest.config.ts,package.json}`, `pnpm-lock.yaml`, `CLAUDE.md` |
| EX-3 | Plan approved + commit `d42800d` trước code. `buildSecurityHeaders` thuần (không alias `@/`), `headers()` trong `next.config.ts` cho `/:path*`, giữ nhánh `withSentryConfig`; `form-action 'self'` (lý do trong plan); 6 test | `docs/plans/L03-security-headers.md`, `apps/web/src/lib/security-headers.ts`, `apps/web/src/lib/__tests__/security-headers.test.ts`, `apps/web/next.config.ts` |
| EX-4 | Điền `## Thực tế` cho 2 plan từ lệnh git, 3 nhóm, tỉ lệ khớp, design round 2; dòng L3 trong `metrics.md` | 2 plan, `docs/ai-levelup/metrics.md` |
| Dọn nợ L02 | Pin `@modelcontextprotocol/server-postgres@0.6.2` (bản mới nhất trên npm, **package đã deprecated**: "Package no longer supported", modified 2026-09-17; vẫn pin đúng bản để `npx -y` không tự đổi); pin `@anthropic-ai/claude-code@2.1.312` (bản mới nhất lúc làm) | `.mcp.json`, `.devcontainer/Dockerfile` |

(Đường dẫn `apps/web/...` ở trên là `typing-adventure/apps/web/...`.)

## Tiêu chí
| AC | Kết quả | Bằng chứng |
|---|---|---|
| AC-1 | Đạt | `wc -l` → `34 docs/plans/_template.md`, `61 CLAUDE.md`; `grep -c '^## '` → 8 (Mục tiêu, Ngoài phạm vi, File thay đổi (dự đoán), Interface chạm tới, Verify, Tự review, Lịch sử, Thực tế) + dòng `Trạng thái: draft`; `CLAUDE.md:33` dòng plan-first trong `## Conventions`; BASE ghi ở đầu báo cáo |
| AC-2 | Đạt | `git log --reverse --format='%h %ad %s' --date=format:%T $BASE..HEAD` → `96503e0 23:18:08 docs(plans): L03 rate-limit plan (approved)`, `d42800d 23:20:14 docs(plans): L03 security-headers plan (approved)`; code chưa commit (người điều phối chỉ cho commit plan), mốc bắt đầu code: EX-2 23:18:13 (`pnpm add -D vitest`), EX-3 23:20:36. `shasum` lúc approve: rate-limit `7a1a786c…` (23:18:08), security-headers `18a82e51…` (23:20:14). Sau đó chỉ thêm mục `## Thực tế`: `git diff -U0 -- docs/plans/ \| grep '^-[^-]' \| wc -l` → 0 (không dòng nào bị sửa/xoá) |
| AC-3 | Đạt | (trước sửa) `pnpm --filter @typing-adventure/web test` → `rate-limit.test.ts (7 tests)`, `security-headers.test.ts (6 tests)`, `Tests 13 passed`; `pnpm test` → game-engine `Tests 137 passed (137)` + web `Tests 13 passed (13)`, `Tasks: 2 successful` |
| AC-4 | Đạt | 3 route import `@/lib/rate-limit`; register: `registerLimiter.check(...)` dòng 18, `req.json()` dòng 22; 429 qua `tooManyRequests()` trong `api-response.ts` (gọi `err(..., 429)` + `Retry-After`), route không có `NextResponse.json` |
| AC-5 | Đạt | `next dev`: vòng register → `400 400 400 400 400 429`; lần sau → `HTTP/1.1 429 Too Many Requests`, `retry-after: 900`, `{"success":false,"error":"Too many requests"}`; credentials x11 → `302 ×10 429`; `POST /api/auth/signin/google` sau đó vẫn 302 (path khác đi thẳng) |
| AC-6 | Đạt | `git diff $BASE -- typing-adventure/packages/game-engine \| wc -l` → 0; `apps/web/package.json` chỉ thêm `"test": "vitest run"` + devDep `"vitest": "^2.1.0"`; lockfile +3 dòng importer `apps/web` (`vitest 2.1.9`, cùng bản game-engine) |
| AC-7 | Đạt | Unit 6 test pass. `dev:ws` `curl -sI /` → CSP có `'unsafe-eval'` và `connect-src 'self' ws:`, không `Strict-Transport-Security`. `next start` → `Strict-Transport-Security: max-age=63072000; includeSubDomains`, `grep -ci unsafe-eval` → 0, đủ CSP, nosniff, `X-Frame-Options: DENY`, Referrer-Policy, Permissions-Policy, HSTS |
| AC-8 | Đạt (trừ console trình duyệt) | `dev:ws`: `HTTP/1.1 200 OK`; `socket.io/?EIO=4&transport=polling` → `0{"sid":"57XI8EK-…","upgrades":["websocket"],...`. Build DSN giả `https://abc@o1.ingest.sentry.io/1` → exit 0, `routes-manifest.json` có `connect-src 'self' https://o1.ingest.sentry.io`; build không DSN (`env \| grep -c NEXT_PUBLIC_SENTRY_DSN` → 0) → exit 0, `connect-src 'self'`. Console CSP: chưa verify runtime |
| AC-9 | Đạt | Từng lệnh qua `rtk proxy`, exit thật: `lint=0` (`0 errors, 37 warnings`), `typecheck=0` (`Tasks: 4 successful`), `test=0`, `build=0`; `lint/typecheck/build` chạy `--force` để không replay cache; tổng 44s |
| AC-10 | Đạt | 2 plan có `## Thực tế`: lệnh git, 3 nhóm, 10/10 và 3/3, design round 2: không; `metrics.md` 5 dòng L3 |

## Plan vs thực tế
| Plan | Dự đoán | Thật | Khớp | Dự đoán không đổi | Đổi không dự đoán | Tỉ lệ | Design round 2 |
|---|---|---|---|---|---|---|---|
| `L03-rate-limit.md` | 10 | 10 | 10 | 0 | 0 | 100% | không |
| `L03-security-headers.md` | 3 | 3 | 3 | 0 | 0 | 100% | không |

Lệnh EX-4 ra 13 file (8 tracked đổi + 5 untracked); chia theo plan như trên, không file nào nằm ngoài 2 plan. Interface lệch nhỏ không ghi trong plan: các type export phụ (`RateLimiterOptions`, `RateLimiter`, `SecurityHeaderOptions`, `HeaderEntry`). `CLAUDE.md` chứa cả dòng EX-1 lẫn dòng `pnpm test` của EX-2; tính vào plan rate-limit (đã dự đoán).

## Metric
| Metric | Giá trị |
|---|---|
| Plan approved trước code | 2/2 |
| Plan rate-limit: đọc + viết (gồm EX-1) | 23:16:56 → 23:18:08 (~1m10s) |
| Code rate-limit (gồm test, curl runtime, tắt server) | 23:18:13 → 23:19:42 (~1m30s) |
| Plan security-headers | 23:19:45 → 23:20:14 (~30s) |
| Code security-headers (gồm `dev:ws`, 2 lần build, `next start`, chain AC-9) | 23:20:36 → 23:23:00 (~2m25s) |
| Dọn nợ L02 (gồm `docker build` image devcontainer) | 23:23:00 → 23:23:40 |
| Plan fixes / code fixes | 23:32:11 → 23:32:50 (~40s) / 23:33:04 → 23:34:49 (~1m45s) |
| Test web mới | 17 (9 limiter, 6 header, 2 api-response) |

## Vấn đề gặp phải
- `kill $(lsof -ti tcp:3000)` + `pkill` bị auto-mode chặn (có thể trúng process không phải của mình). Cách xử lý: `lsof -nP -iTCP:3000 -sTCP:LISTEN` + `ps -o pid,ppid,comm` để xác định đúng cây process mình chạy rồi `kill <pid>`.
- `pgrep -fl` trên macOS in cả biến môi trường của `next-server`, lộ 1 biến token của phiên Claude Code vào transcript (không phải secret của repo, không chép lại ở đây). Từ đó dùng `pgrep -f ... >/dev/null` / `ps -o pid,ppid,comm`. Ghi vào `mistakes.md`.
- macOS không có `timeout`; chạy `docker build` trực tiếp.
- `next start` cảnh báo `"next start" does not work with "output: standalone"` nhưng vẫn `Ready` và trả đúng header, không cần chuyển sang `standalone/server.js`.
- `prettier --check` báo 5 file: 2 file mới (`security-headers.ts` + test) đã `--write`; `sessions/route.ts` và `next.config.ts` đã lệch prettier từ `BASE` (so `prettier --stdin-filepath` với bản `git show $BASE:`), không format lại để diff không lẫn dòng ngoài plan. Sau khi format: test 13 pass, `tsc` 0, lint 0 error.
- Vitest in cảnh báo "CJS build of Vite's Node API is deprecated" (web không có `"type": "module"`); không ảnh hưởng, giữ tên `vitest.config.ts` như plan.

## Dọn nợ L02
- `.mcp.json`: `@modelcontextprotocol/server-postgres@0.6.2`. `npm view` → `version = '0.6.2'`, `deprecated = 'Package no longer supported…'`. Package bị archive/deprecated nhưng vẫn cài được (tarball tồn tại); pin để không trôi. Nên tìm server thay thế ở lesson sau.
- `.devcontainer/Dockerfile`: `@anthropic-ai/claude-code@2.1.312`. Verify: `docker build -f .devcontainer/Dockerfile .devcontainer` ok, `docker run --rm <img> claude --version` → `2.1.312 (Claude Code)`; image tạm đã xoá.
- `jq empty .mcp.json` → ok. `postgres-ro` vẫn `Pending approval` nên chưa chạy thật server 0.6.2 qua Claude Code.

## Sửa sau chấm
GRADE PASS nhưng nêu 2 lỗi; sửa theo plan thứ 3 [`docs/plans/L03-rate-limit-fixes.md`](../../../plans/L03-rate-limit-fixes.md) (approved, commit riêng `60cd241` lúc 23:32:50 trước code 23:33:04; `shasum` lúc approve `3bd1f269…`).

| Lỗi | Sửa | File | Bằng chứng |
|---|---|---|---|
| Bypass limiter bằng `x-forwarded-for` (client đặt phần tử đầu) | `getClientIp`: `x-real-ip` → phần tử **cuối** XFF → `'unknown'`. Giả định proxy nginx `docs/DEPLOY_AWS.md` (`X-Real-IP $remote_addr`, XFF nối IP thật vào cuối) | `rate-limit.ts`, `__tests__/rate-limit.test.ts` (+3 case IP, có case hồi quy "không reset được bằng XFF giả") | `next dev`, giả lập nginx: `x-real-ip: 203.0.113.7` x6 → `400 ×5 429`; thêm `x-forwarded-for: 9.9.9.9, 203.0.113.7` → `429`; chỉ XFF nối `9.9.9.9, 203.0.113.7` → `429` |
| Login treo khi 429 (`signIn` gọi `new URL(data.url)` với body không có `url`) | `tooManyRequests(retryAfterMs, url?)`: credentials 429 trả thêm `url: <origin>/login?error=RateLimited` (vẫn envelope `success:false`); `login/page.tsx` bọc `try/catch/finally` (luôn tắt `loading`), `RateLimited`/429 → `t(lang, 'authRateLimited')`; `register/page.tsx` xử lý 429 của API register và của `signIn` tương tự | `api-response.ts`, `__tests__/api-response.test.ts` (2 case), `[...nextauth]/route.ts`, `(auth)/login/page.tsx`, `(auth)/register/page.tsx`, `packages/i18n/src/{vi,en}.ts` (key `authRateLimited`, `authConnectionError`) | credentials lần 11 → `HTTP/1.1 429`, `retry-after: 900`, `{"success":false,"error":"Too many requests","url":"http://localhost:3000/login?error=RateLimited"}`; chạy đúng phép tính của `next-auth/react` `signIn` (`new URL(data.url).searchParams.get("error")`) trên body đó → `RateLimited` (không ném) |

- Plan fixes: dự đoán 9, thật 9, khớp 9/9 = 100%, design round 2: không.
- Chain sau sửa (qua `rtk proxy`): `lint=0` (0 errors, 37 warnings), `typecheck --force=0` (4 task), `test=0` (game-engine 137, web 17: limiter 9, header 6, api-response 2), `build --force=0`, 30s.
- Giới hạn còn lại: nếu Node lộ thẳng ra Internet (không nginx), mọi header IP đều do client đặt: curl không `x-real-ip` + XFF `9.9.9.9` → 400. Đã ghi ở Ngoài phạm vi của plan; App Router không cho đọc socket remote address ở route handler.
- Lệnh EX-4 (`git diff --name-only $BASE -- typing-adventure CLAUDE.md` + untracked) nay ra 18 file: 13 file của 2 plan đầu + 5 file chỉ thuộc plan fixes (`api-response.test.ts`, `login/page.tsx`, `register/page.tsx`, `vi.ts`, `en.ts`); 4 file còn lại của plan fixes trùng file của plan rate-limit.
- Theo nhận xét GRADE: `.mcp.json` và `.devcontainer/Dockerfile` (dọn nợ L02) là thay đổi **ngoài 3 plan** (mỗi file 1 dòng, không phải task multi-file), commit riêng.

## Chưa verify runtime
- Console trình duyệt không có CSP violation (không có công cụ trình duyệt trong phiên): inline `THEME_BOOT`, font, audio `/voice/*.mp3`, Sentry Replay worker chỉ được suy ra từ policy.
- UI login/register khi 429 (chữ `authRateLimited`, nút thoát loading): chỉ kiểm bằng typecheck + body 429 + mô phỏng phép tính của `signIn`, chưa bấm trên trình duyệt.
- Giới hạn `POST /api/sessions` 30/phút/`user.id`: chỉ unit test limiter, chưa curl với cookie đăng nhập.
- `connect-src` với `NEXT_PUBLIC_WS_URL` khác origin: chỉ unit test, chưa chạy client Socket.IO thật qua domain riêng.
- MCP `postgres-ro` với bản pin 0.6.2 chưa được Claude Code khởi động (server còn `Pending approval`).
- Mở rộng (model thứ 2 review plan, CSP nonce, Report-Only, Redis limiter, key IP+email): không làm.

Server đã tắt: `next dev`, `dev:ws`, `next start` đều kill theo PID; cuối phiên `lsof -iTCP:3000 -sTCP:LISTEN` rỗng.

## Commit (nộp bài)
`git log --reverse --format='%h %ad %s' --date=format:%T $BASE..HEAD` (trước commit docs):
```
96503e0 23:18:08 docs(plans): L03 rate-limit plan (approved)
d42800d 23:20:14 docs(plans): L03 security-headers plan (approved)
60cd241 23:32:50 docs(plans): L03 rate-limit fixes plan (approved)
a11092d 23:36:11 docs: plan template and plan-first convention
9a026f8 23:36:11 feat(web): in-memory rate limit for register, credentials login and sessions
990b901 23:36:11 feat(web): security headers (CSP, HSTS in prod, nosniff, frame, referrer, permissions)
26c130d 23:36:11 fix(web): rate limit client IP spoofing and login hang on 429
bceef1a 23:36:11 chore(devcontainer): pin server-postgres 0.6.2 and claude-code 2.1.312
```
Commit `feat(web): in-memory rate limit` chứa bản **trước sửa** của 4 file chung với commit `fix(web)` (dựng lại bằng `git hash-object` + `update-index`, không dùng `add -p`), để diff của commit fix đúng phần sửa sau chấm. Commit EX-1 (template + `CLAUDE.md`) tách riêng trước code.
