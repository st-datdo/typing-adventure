# L03 · Plan-first — Chấm điểm

Ngày chấm: 2026-10-29 · Branch: `lesson/L03-plan-first` (đã rebase lên `main` 1d16cef sau khi PR #5 merge) · PR: chưa mở
Nguồn: [LESSON.md](LESSON.md), [REPORT.md](../../learner/L03-plan-first/REPORT.md), `git log main..HEAD` (2 commit plan) + `git diff main` + `git status -uall` (code chưa commit). `BASE` = `1d16cef` = `main`.

Phạm vi chạy lại: người chấm tự chạy toàn bộ test, chain build, 2 lần build có/không DSN, và curl trên **production** (`next start`) lẫn **`dev:ws`** (`tsx server.ts`). Server do người chấm bật đều tắt bằng PID cụ thể (42010; 42107 + con 42116), cuối cùng `lsof -iTCP:3000 -sTCP:LISTEN` rỗng. Không chạy `next dev` riêng (AC-5 đo lại trên production thay vì dev).

| AC | Đạt/Chưa | Bằng chứng |
|---|---|---|
| AC-1 | Đạt | `wc -l` → `_template.md` 34, `CLAUDE.md` 61; `grep -c '^## '` → 8 mục + `Trạng thái: draft`; `CLAUDE.md` Conventions có dòng plan-first; REPORT ghi `BASE=1d16cef…` |
| AC-2 | Đạt | `git log --reverse main..HEAD` → `96503e0 23:18:08 docs(plans): L03 rate-limit plan (approved)`, `d42800d 23:20:14 … security-headers plan (approved)`, mỗi commit chỉ chứa đúng 1 file plan; code đều chưa commit (sau plan). `git diff -U0 -- docs/plans/ \| grep -c '^-[^-]'` → 0: sau commit chỉ **thêm** mục Thực tế, mục dự đoán không bị sửa. Cả 2 plan `Trạng thái: approved` |
| AC-3 | Đạt | `rtk proxy pnpm --filter @typing-adventure/web test` → 2 file, `Tests 13 passed` (7 limiter: đủ limit, chặn limit+1, key độc lập, mở lại sau window, dọn key, 2 case IP); `pnpm test` → game-engine `137 passed`, web `13 passed`, `Tasks: 2 successful` |
| AC-4 | Đạt | 3 route import `@/lib/rate-limit`; `register/route.ts:18` `registerLimiter.check(...)` trước `:22` `req.json()`; sessions check sau `getSessionUser()`; `[...nextauth]` chỉ chặn path `/api/auth/callback/credentials`; 429 qua `tooManyRequests()` (`api-response.ts`, gọi `err(…, 429)` + `Retry-After`), không route nào tự `NextResponse.json` |
| AC-5 | Đạt | Production `next start`: register x6 → `400 400 400 400 400 429`; lần sau → `HTTP/1.1 429 Too Many Requests`, `retry-after: 900`, `{"success":false,"error":"Too many requests"}`; credentials x11 → `500 ×10 429` (500 là lỗi NextAuth khi thiếu CSRF/host ở production; learner đo ở dev ra `302 ×10 429`, đều đúng là lần 11 bị 429). Sessions: chỉ unit test, LESSON cho phép |
| AC-6 | Đạt | `rtk proxy git diff 1d16cef -- typing-adventure/packages/game-engine \| wc -l` → 0; lockfile +3 dòng importer `apps/web` (`vitest 2.1.9`); `package.json` web chỉ thêm `vitest ^2.1.0` + script `test` |
| AC-7 | Đạt | 6 test header pass. `dev:ws` `curl -sI /` → CSP có `'unsafe-eval'`, `connect-src 'self' ws:`, không HSTS. Production → đủ 6 header (CSP, nosniff, `DENY`, Referrer-Policy, Permissions-Policy, `Strict-Transport-Security: max-age=63072000; includeSubDomains`), `grep -ci unsafe-eval` → 0 |
| AC-8 | Đạt (console trình duyệt `chưa verify runtime`, được phép) | `dev:ws`: `/` → `200 OK`; `socket.io/?EIO=4&transport=polling` → `0{"sid":"9tMP…","upgrades":["websocket"]…`. `NEXT_PUBLIC_SENTRY_DSN=https://abc@o1.ingest.sentry.io/1 pnpm build --force` → exit 0, `routes-manifest.json` `connect-src 'self' https://o1.ingest.sentry.io` (không lộ key `abc`); build lại không DSN → exit 0, `connect-src 'self'` |
| AC-9 | Đạt | Qua `rtk proxy`: `lint` exit 0 (`0 errors, 37 warnings`), `typecheck --force` exit 0 (`4 successful`), `test` exit 0, `build --force` exit 0 (`Compiled successfully`) |
| AC-10 | Đạt | Người chấm chạy lại lệnh EX-4 → đúng 13 file như REPORT; chia 10/3 khớp danh sách dự đoán của 2 plan; 2 plan có mục Thực tế (3 nhóm, 100%, design round 2: không); `metrics.md` 5 dòng L3 |

**FEATURE_MAP:** section L03 có 24 dòng, phủ đủ 16 file sửa + 8 file mới trong `git status -uall` (kể cả `LESSON.md`, `README.md` của teacher, `.mcp.json`, `.devcontainer/Dockerfile`). Thiếu `lessons/L03-plan-first/GRADE.md` và `lessons/L02-advanced-setup/GRADE.md` (người chấm vừa sửa dòng PR); learner thêm khi commit.

## Nhận xét
- Kỷ luật plan-first làm đúng tinh thần: commit plan riêng trước code, mục dự đoán bất biến (kiểm bằng `grep '^-'` = 0), rủi ro lớn nhất (`next.config.ts` import TS) được ghi thành điều kiện dừng trước. Tỉ lệ khớp 100% và 0 design round 2 là số thật, người chấm tái lập được.
- Lưu ý khi đọc metric: 2 task nhỏ (13 file, mỗi plan viết ~1 phút) nên 100% chưa nói nhiều; L04+ cần plan cho task lớn hơn để metric có ý nghĩa.
- Thay đổi **ngoài plan**: `.mcp.json` và `.devcontainer/Dockerfile` (dọn nợ L02) được sửa không có plan, và lệnh EX-4 (do LESSON lọc `typing-adventure CLAUDE.md`) không bắt được chúng. Mỗi thay đổi chỉ 1 dòng, không phải task multi-file nên không vi phạm quy ước, nhưng nên ghi rõ trong REPORT là "ngoài 2 plan" và commit riêng. Bài học cho teacher: lệnh đối chiếu nên là `git diff --name-only $BASE` toàn repo trừ `docs/ai-levelup/`.
- Phát hiện khi chấm (không thuộc AC, không chặn PASS):
  1. **Bypass limiter bằng `x-forwarded-for`.** `getClientIp` lấy phần tử **đầu** của XFF, do client tự đặt. Đã thử: sau khi register bị 429, gửi kèm `x-forwarded-for: 9.9.9.9` → `400` (qua được). Kể cả sau nginx trong `docs/DEPLOY_AWS.md` (`$proxy_add_x_forwarded_for` **nối thêm** IP thật vào cuối) phần tử đầu vẫn do client quyết. Nên dùng `x-real-ip` (nginx set = `$remote_addr`) hoặc phần tử **cuối** XFF, ghi giả định proxy trong plan. LESSON có phần gợi ý chưa đủ rõ, lỗi một phần ở đề.
  2. **Đăng nhập bị 429 làm treo form.** `next-auth/react` `signIn(..., { redirect: false })` đọc `data.url` rồi `new URL(data.url)` (`react.js:174`); body 429 không có `url` → ném `TypeError`, `login/page.tsx` không `try/finally` nên nút kẹt `loading`, không hiện lỗi. Sửa: trả 429 cho credentials dưới dạng NextAuth hiểu được (JSON có `url` kèm `?error=…`) hoặc bọc `signIn` trong `try/finally` + thông báo "thử lại sau".
  3. `@modelcontextprotocol/server-postgres@0.6.2` đã deprecated: pin đúng, nhưng cần ứng viên thay thế ở lesson sau.

## Kết luận: PASS
Việc phải làm trước khi mở PR:
- Thêm vào section L03 của `FEATURE_MAP.md`: `lessons/L03-plan-first/GRADE.md` và `lessons/L02-advanced-setup/GRADE.md` (sửa dòng PR #5).
- Commit code theo plan (có thể 1 commit/plan), commit riêng phần pin `.mcp.json` + `Dockerfile`; PR body link 2 plan, LESSON, GRADE, REPORT.

Nên làm (follow-up, không chặn): sửa 2 phát hiện ở trên (XFF bypass, login treo khi 429) qua một plan mới `docs/plans/L03-fix-ratelimit-ip.md` để giữ đúng quy ước plan-first, hoặc đưa vào backlog L04.
