# L03 · Plan-first
Branch: `lesson/L03-plan-first` (stack trên `lesson/L02-advanced-setup`, PR #5 chưa merge: coi L02 là đã xong)

## Mục tiêu
Task nhiều file thì **viết plan trước, code sau**: đọc code ở chế độ chỉ đọc, ghi plan ngắn, tự review (đoán trước được diff không?), rồi mới sửa code. Đổi hướng giữa chừng thì **sửa plan trước**, không âm thầm code lệch.

**Metric** (theo PLAN L3, đo trong 1 lesson, 2 bài code EX-2, EX-3)
- Quality 1: *plan khớp diff* = số file đoán đúng / số file trong hợp (dự đoán ∪ thực tế), tính riêng từng plan. Mục tiêu ≥ 80%.
- Quality 2: *design round 2* = số plan phải đổi hướng sau khi đã bắt đầu code (ghi trong mục Lịch sử của plan). Mục tiêu 0/2 (PLAN: < 10% PR).
- Process: task multi-file có plan `approved` trước khi code = 2/2 (100%).
- Ghi thêm thời gian viết plan và thời gian code của từng bài (giờ thật).

## Hiện trạng repo (đã kiểm tra khi soạn bài)
- Chưa có `docs/plans/`. `CLAUDE.md` đang 60 dòng, mục `## Conventions` ở dòng 29.
- **Chưa có rate limiting** ở đâu cả (grep `rate.?limit` không ra). `.env.example` có `UPSTASH_REDIS_*` nhưng Redis chưa được nối, nên lesson này dùng limiter **in-memory**.
- **Chưa có security header** nào: `apps/web/next.config.ts` chỉ có `output: 'standalone'`, `transpilePackages`, bọc `withSentryConfig` khi có `NEXT_PUBLIC_SENTRY_DSN`. `middleware.ts` là `auth` của NextAuth với `matcher` chỉ 4 route (`/friends`, `/admin`, `/lobby`, `/race`).
- Route cần chặn: `app/api/auth/register/route.ts` (POST, bcrypt cost 12 → đắt CPU), `app/api/auth/[...nextauth]/route.ts` (`export const { GET, POST } = handlers`, đăng nhập Credentials đi qua `POST /api/auth/callback/credentials`), `app/api/sessions/route.ts` (POST ghi `gameSession` + `userRecord`).
- Những thứ CSP phải cho phép: `app/layout.tsx` có **inline script** `THEME_BOOT` (`dangerouslySetInnerHTML`); font qua `next/font/google` (tự host lúc build → `'self'`); audio `/voice/*.mp3` cùng origin; Socket.IO qua `NEXT_PUBLIC_WS_URL` (rỗng = cùng origin); Sentry Replay cần `worker-src blob:` khi bật. Không có `getUserMedia`, không có ảnh ngoài.
- `apps/web` **chưa có Vitest**; chỉ `packages/game-engine` có (vitest 2.1.9, 12 file / 137 test).

## Kiến thức cần nắm
- **Plan là hợp đồng nhỏ, không phải tài liệu thiết kế.** ≤ 1 màn hình: mục tiêu, file đổi, interface chạm tới, cách verify. Nếu không liệt kê được file trước khi code thì chưa hiểu đủ để code: đọc thêm, đừng đoán.
- **Plan mode = giai đoạn read-only.** Chỉ Read/Grep/Glob/chạy lệnh đọc. Không Edit/Write vào code cho tới khi plan được lưu và đánh dấu `approved`. Plan lưu trong repo để đính kèm PR và để reviewer đối chiếu diff.
- **Đổi hướng = sửa plan trước.** Gặp điều plan không lường (vd `next.config.ts` không import được file TS) → dừng, ghi `v2` + lý do vào mục Lịch sử, rồi code tiếp. Đó là 1 lần *design round 2*; đếm thật, không giấu.
- **Rate limit đặt ở route handler (Node runtime), không ở middleware.** Middleware chạy edge runtime, `Map` ở đó không dùng chung với route handler; middleware hiện cũng chỉ match 4 trang. In-memory = mỗi instance một bộ đếm, mất khi restart: chấp nhận được cho 1 instance, ghi rõ giới hạn. Chặn **trước** việc đắt (parse body, bcrypt, Prisma). Logic đếm tách thành hàm thuần, đồng hồ inject được để test không cần `sleep`. Key: IP từ `x-forwarded-for` (giả được nếu không có proxy tin cậy, xem `docs/DEPLOY_AWS.md` nginx set header này) hoặc `user.id` khi đã đăng nhập.
- **Security header qua `headers()` trong `next.config.ts`** áp cho mọi route, kể cả khi chạy `server.ts` (Socket.IO đi qua cùng HTTP server nhưng không phải trang HTML, CSP không ảnh hưởng handshake). CSP nonce cần middleware match mọi route và ép render động: để vào Mở rộng. Dev cần `'unsafe-eval'` (React Refresh) và `ws:` (HMR); production thì không. **HSTS chỉ bật ở production**: gửi HSTS trên `localhost` làm trình duyệt nhớ ép HTTPS.
- `game-engine` phải giữ thuần (không React/DOM/Node): limiter và header builder thuộc `apps/web/src/lib/`, không đặt trong `packages/game-engine`.

## Bài tập

**EX-1 · Template plan + quy ước**
- Đầu phiên ghi `BASE=$(git rev-parse HEAD)` vào REPORT (mọi so sánh diff dùng BASE này, không dùng `main` vì branch đang stack trên L02).
- Tạo `docs/plans/_template.md` (ở gốc repo, ≤ 40 dòng) với các mục: `## Mục tiêu`, `## Ngoài phạm vi`, `## File thay đổi (dự đoán)` (mỗi dòng: đường dẫn + thêm/sửa), `## Interface chạm tới` (chữ ký hàm export, HTTP status/header, env, dependency mới), `## Verify` (lệnh cụ thể), `## Tự review` (3 câu: đoán được diff chưa? interface nào người khác đang dùng? rollback thế nào?), `Trạng thái: draft|approved`, `## Lịch sử` (v1, v2 + lý do), `## Thực tế` (điền sau khi code).
- Thêm 1 dòng vào `CLAUDE.md` mục `## Conventions`: task multi-file phải có plan `docs/plans/<slug>.md` (theo `_template.md`) trước khi sửa code.
Verify: `wc -l docs/plans/_template.md CLAUDE.md`; `grep -c '^## ' docs/plans/_template.md`.

**EX-2 · Rate limiting cho auth + sessions (plan trước)**
1. Read-only: đọc 3 route ở trên, `lib/api-response.ts`, `lib/auth.ts`. Viết `docs/plans/L03-rate-limit.md`, tự review, đặt `approved`. **Lưu bằng chứng plan-first**: commit riêng plan (`docs(plans): ...`) trước khi sửa code; nếu người điều phối không cho commit sớm thì ghi `date` + `shasum docs/plans/L03-rate-limit.md` vào REPORT ngay lúc approve. Sau đó **không sửa** mục File thay đổi (dự đoán) nữa.
2. Code (yêu cầu tối thiểu, chi tiết interface do plan quyết):
   - `apps/web/src/lib/rate-limit.ts`: limiter in-memory (fixed hoặc sliding window), `limit`/`windowMs` cấu hình được, đồng hồ inject được, trả về `allowed` + thời gian chờ; có dọn key hết hạn để `Map` không phình mãi; hàm lấy IP client từ header.
   - Áp vào: `POST /api/auth/register` 5 lần / 15 phút / IP, chặn **trước** `req.json()`; `POST` của `[...nextauth]` khi path là `/api/auth/callback/credentials` 10 lần / 15 phút / IP (bọc `handlers.POST`, các path khác đi thẳng); `POST /api/sessions` 30 lần / phút / `user.id` (sau `getSessionUser()`).
   - Bị chặn → HTTP 429, body đúng envelope `{ success: false, error }` của `api-response.ts`, có header `Retry-After` (giây).
   - Vitest cho `apps/web`: `pnpm --filter @typing-adventure/web add -D vitest@^2.1.0` (cùng bản game-engine), script `test: vitest run`, `apps/web/vitest.config.ts` (`environment: 'node'`, include `src/**/__tests__/**/*.test.ts`, alias `@` → `src` nếu test cần). Test `src/lib/__tests__/rate-limit.test.ts` ≥ 5 case: cho qua đủ `limit`, chặn lần `limit+1` với thời gian chờ > 0, key độc lập, hết window thì mở lại, key hết hạn bị dọn, lấy IP (có/không `x-forwarded-for`).
Verify:
```bash
cd typing-adventure && pnpm --filter @typing-adventure/web test
pnpm --filter @typing-adventure/web dev   # terminal khác, chờ Ready
for i in 1 2 3 4 5 6; do curl -s -o /dev/null -w '%{http_code} ' -X POST localhost:3000/api/auth/register -H 'content-type: application/json' -d '{}'; done
curl -si -X POST localhost:3000/api/auth/register -H 'content-type: application/json' -d '{}' | grep -iE '^HTTP|retry-after|"error"'
for i in $(seq 1 11); do curl -s -o /dev/null -w '%{http_code} ' -X POST localhost:3000/api/auth/callback/credentials; done
```
Body `{}` không hợp lệ nên không tạo user, không cần dữ liệu DB.

**EX-3 · Security headers (plan trước)**
1. Read-only + `docs/plans/L03-security-headers.md` + bằng chứng plan-first như EX-2.
2. Code:
   - `apps/web/src/lib/security-headers.ts`: hàm thuần nhận `{ isDev, wsUrl?, sentryDsn? }`, trả mảng `{ key, value }`. Không dùng alias `@/` trong file này (config không resolve `paths`).
   - `next.config.ts`: `async headers()` áp cho `source: '/:path*'`, giữ nguyên nhánh `withSentryConfig`. Nếu `next.config.ts` không import được file TS này thì **sửa plan trước** (v2) rồi chọn cách khác.
   - Header bắt buộc: `Content-Security-Policy` (`default-src 'self'`, `script-src 'self' 'unsafe-inline'` + `'unsafe-eval'` chỉ dev, `style-src 'self' 'unsafe-inline'`, `img-src 'self' data: blob:`, `font-src 'self' data:`, `connect-src 'self'` + origin ws/wss của `wsUrl` + origin ingest Sentry khi có DSN + `ws:` khi dev, `worker-src 'self' blob:`, `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`), `Strict-Transport-Security` (chỉ production), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` tắt camera/microphone/geolocation. `form-action` có hay không và vì sao (Google OAuth): quyết trong plan.
   - Test `src/lib/__tests__/security-headers.test.ts`: dev có `'unsafe-eval'`, không HSTS; prod có HSTS, không `'unsafe-eval'`; `wsUrl`/DSN xuất hiện đúng origin trong `connect-src`; không DSN thì không có domain Sentry.
Verify:
```bash
cd typing-adventure && pnpm --filter @typing-adventure/web test
pnpm --filter @typing-adventure/web dev:ws      # Next + Socket.IO; dừng lại sau khi đo
curl -sI localhost:3000/ | grep -iE '^HTTP|content-security|strict-transport|x-frame|nosniff|referrer|permissions'
curl -s 'localhost:3000/socket.io/?EIO=4&transport=polling' | head -c 80   # phải thấy "sid"
pnpm build && pnpm --filter @typing-adventure/web start   # production, rồi curl -sI lại: có HSTS, không unsafe-eval
```

**EX-4 · Đối chiếu plan với diff thật**
Với mỗi plan, điền mục `## Thực tế`:
- Danh sách file thật: `git diff --name-only $BASE -- typing-adventure CLAUDE.md` + `git ls-files --others --exclude-standard typing-adventure` (bỏ `docs/ai-levelup/`).
- 3 nhóm: khớp / dự đoán mà không đổi / đổi mà không dự đoán (mỗi file lạ kèm 1 câu vì sao). Tỉ lệ khớp = khớp / (khớp + 2 nhóm còn lại).
- Interface đổi mà plan không ghi; design round 2: có/không + lý do (trỏ mục Lịch sử).
Ghi 2 tỉ lệ khớp, số design round 2, số plan approved trước code vào `metrics.md`.

## Tiêu chí đạt
- **AC-1** (EX-1): `docs/plans/_template.md` ≤ 40 dòng, có đủ các mục Mục tiêu, File thay đổi, Interface, Verify, Tự review, Lịch sử, Thực tế và dòng `Trạng thái:`; `CLAUDE.md` có dòng plan-first trong `## Conventions`, tổng ≤ 62 dòng; REPORT ghi `BASE`.
- **AC-2** (EX-2, EX-3): có `docs/plans/L03-rate-limit.md` và `docs/plans/L03-security-headers.md`, theo template, `Trạng thái: approved`; bằng chứng plan có **trước** code: commit plan đứng trước commit code trong `git log --reverse $BASE..HEAD`, hoặc REPORT có `date` + `shasum` mà `shasum` hiện tại của plan khớp (khi chỉ mục Thực tế/Lịch sử được thêm sau thì ghi rõ và so mục dự đoán).
- **AC-3** (EX-2): `pnpm --filter @typing-adventure/web test` pass, ≥ 5 test cho limiter; `pnpm test` chạy cả game-engine (137) lẫn web.
- **AC-4** (EX-2): 3 route dùng limiter (grep `rate-limit` trong 3 file); ở `register` lời gọi limiter đứng trước `req.json()`; 429 trả qua `api-response.ts` (không `NextResponse.json` tự viết trong route) và có `Retry-After`.
- **AC-5** (EX-2, runtime): vòng curl register in `400 400 400 400 400 429`; lần gọi sau có `HTTP/1.1 429`, `retry-after:`, `"success":false`; lần thứ 11 vào `/api/auth/callback/credentials` trả 429. Giới hạn `/api/sessions` chỉ cần unit test; chạy runtime (cần cookie đăng nhập) là tuỳ chọn.
- **AC-6** (EX-2, EX-3): `git diff $BASE -- typing-adventure/packages/game-engine` rỗng; dependency mới duy nhất là `vitest` trong devDependencies của `apps/web` (lockfile chỉ đổi theo).
- **AC-7** (EX-3): test header pass với các case nêu ở EX-3; dev `curl -sI /` có CSP chứa `unsafe-eval`, không có `strict-transport-security`; production (`next start`) có HSTS, CSP không chứa `unsafe-eval`; đủ 6 header bắt buộc.
- **AC-8** (EX-3, không làm vỡ): khi chạy `dev:ws`, `/` trả 200 và handshake Socket.IO trả JSON có `"sid"`; `pnpm build` không lỗi cả khi export `NEXT_PUBLIC_SENTRY_DSN` giả (`https://abc@o1.ingest.sentry.io/1`) lẫn khi không có. Kiểm tra console trình duyệt không có CSP violation: làm nếu có công cụ trình duyệt, không thì ghi `chưa verify runtime`.
- **AC-9**: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` exit 0 (lint 0 error). Lấy exit code thật bằng `rtk proxy <lệnh>` (hook RTK có thể báo exit sai, xem GRADE L02).
- **AC-10** (EX-4): cả 2 plan có mục `## Thực tế` với 3 nhóm file lấy từ lệnh git ở EX-4 (người chấm chạy lại phải ra cùng danh sách), tỉ lệ khớp, design round 2 có/không; `metrics.md` có các dòng L3: tỉ lệ khớp từng plan, số design round 2, plan approved trước code x/2, thời gian plan/code.

## Ràng buộc môi trường
- Docker daemon đang chạy, Postgres host `localhost:5432` có sẵn: không cần Docker cho lesson này. Không trỏ `DATABASE_URL` sang DB khác, không in secret.
- Mỗi lần chỉ chạy **1** server trên cổng 3000 (`dev`, `dev:ws` hoặc `start`); tắt hẳn trước khi chạy cái khác, không để process treo sau phiên. Bộ đếm in-memory reset khi restart server: muốn đo lại AC-5 thì restart.
- `next start` với `output: 'standalone'` có thể in cảnh báo; vẫn chạy được cho mục đích curl header. Lỗi thì dùng `node apps/web/.next/standalone/apps/web/server.js` và ghi lại.
- Không có GitHub secret: không làm phần CI. Không có trình duyệt thì phần console CSP ghi `chưa verify runtime` (AC-8 vẫn đạt nếu phần curl/build đạt).

## Nộp bài
Cập nhật `docs/ai-levelup/learner/L03-plan-first/REPORT.md` (BASE, từng EX: đã làm gì, lệnh verify + kết quả rút gọn, `chưa verify runtime`; mục **Plan vs thực tế** tóm 2 plan), section L03 trong `learner/FEATURE_MAP.md` (mọi file thay đổi, kể cả `docs/plans/*`), các dòng L3 trong `metrics.md`, `mistakes.md` nếu có lỗi lặp. PR phải link 2 plan trong body.

## Mở rộng (không bắt buộc)
- **Model thứ 2 review plan** trước khi `approved`: đưa plan (chỉ plan, không đưa kết luận của mình) cho model khác (vd subagent `model: sonnet`, hoặc `claude -p --model <khác>`), ghi các điểm nó bắt được và điểm mình nhận/không nhận vào mục Lịch sử. Đếm xem review có giảm design round 2 không.
- CSP dùng nonce qua middleware (bỏ `'unsafe-inline'` cho script), đánh giá giá cấu hình render động.
- Phát hành CSP dạng `Content-Security-Policy-Report-Only` trước, kèm `report-to`, rồi mới enforce.
- Limiter dùng Redis/Upstash cho nhiều instance; rate limit cả event Socket.IO (`join`, `progress`) trong `lib/multiplayer/`.
- Key đăng nhập theo IP + email (chống dò 1 tài khoản từ nhiều IP).
