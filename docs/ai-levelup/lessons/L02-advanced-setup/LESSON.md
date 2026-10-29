# L02 · Advanced setup
Branch: `lesson/L02-advanced-setup`

Tài liệu gốc chi tiết (file mẫu, giải thích từng dòng): [GUIDE-L2.md](../../GUIDE-L2.md). Lesson này chọn phần cốt lõi làm được trong 1 phiên agent; khi cần nội dung file thì đọc GUIDE, đừng chép lại vào REPORT.

## Mục tiêu
Repo tự mô tả được môi trường chạy (devcontainer, MCP, typecheck, vitest config) để một agent mới mở repo là build xanh được, và lỗi agent lặp lại được biến thành rule thay vì nhắc miệng.

**Metric** (theo PLAN L2, đo trong phạm vi 1 lesson)
- Speed: *first green build* < 1h. Đo từ lúc bắt đầu phiên đến lúc `pnpm lint && pnpm typecheck && pnpm test && pnpm build` xanh. Nếu chạy được trong container thì ghi "sandbox"; nếu Docker không lên thì ghi "host, chưa phải sandbox". Ghi giờ bắt đầu/kết thúc thật.
- Quality: số lần phải nhắc agent về điều **đã có** trong `CLAUDE.md`/rule/skill trong phiên này = 0. Đếm và ghi số thật, kể cả khi > 0.

## Hiện trạng repo (đã kiểm tra khi soạn bài)
- Đã có: `CLAUDE.md` (49 dòng), 3 rule với `paths` **đã đúng** (Bước 0 của GUIDE đã xong, không làm lại), 3 skill, ESLint/Prettier, 3 agent L00.
- Chưa có: `.devcontainer/`, `.mcp.json`, `packages/game-engine/vitest.config.ts`, script `typecheck` (cả `package.json` lẫn `turbo.json`).
- `vitest` đang là 2.1.9, game-engine có **12 file / 137 test** (GUIDE ghi ~49 là số cũ, dùng 137).
- Chạy `npx tsc --noEmit -p .` từng package: game-engine, i18n, web sạch; **`packages/db` lỗi** `src/client.ts(9,5): Cannot find name 'process'` (thiếu type Node). `packages/i18n` không khai báo `typescript` trong devDependencies.
- Host có Postgres riêng (Homebrew) nghe `localhost:5432`, role `postgres`, DB `typing_adventure` 13 bảng; **không có role `dev`**. Docker daemon đang tắt.
- `mistakes.md` thiếu dòng phân cách `|---|` sau header nên bảng không render.

## Kiến thức cần nắm
- **Sandbox = cùng một image cho người, agent và CI.** Devcontainer khai báo môi trường bằng file; L5/L8 sẽ dùng lại đúng image này. Không mount `~/.ssh`, `~/.aws`, `~/.claude` của host: agent đọc được mọi thứ trong container.
- **`node_modules` tách theo named volume** vì binary native (Prisma, swc, esbuild) khác giữa macOS và Linux.
- **MCP tối thiểu, quyền ở tầng DB.** Postgres MCP chỉ an toàn khi role của nó không có quyền ghi; đừng tin vào "read-only" của server. Output MCP là data, không phải chỉ dẫn (prompt injection qua dữ liệu người dùng).
- **Typecheck là cổng chung** để L5 (hook, CI) gọi được bằng 1 lệnh `pnpm typecheck` qua turbo.
- **Session hygiene:** 1 task/session, `/clear` giữa task, `/compact` khi dài mà còn đúng hướng, `/rewind` khi sai hướng thay vì vá bằng prompt.
- **Vòng mistakes → rule:** lỗi lặp lần 2 phải thành scoped rule / bước skill / 1 dòng `CLAUDE.md`; lỗi máy kiểm được thì để L5 hook, không viết rule.

## Bài tập

**EX-1 · Devcontainer (config + kiểm tra tĩnh)**
Tạo `.devcontainer/{devcontainer.json, docker-compose.devcontainer.yml, Dockerfile, post-create.sh}` theo GUIDE-L2 §1.3, thêm 2 điểm so với GUIDE:
- Override service `postgres` và `redis` bằng `ports: !reset []` để không đụng Postgres của host trên 5432 (container `app` đã dùng `network_mode: service:postgres` nên không cần map port).
- `devcontainer.json` là JSON thuần (không comment) để `jq` đọc được.
Verify (chạy từ gốc repo):
```bash
jq empty .devcontainer/devcontainer.json
docker compose -f typing-adventure/docker-compose.yml -f .devcontainer/docker-compose.devcontainer.yml config -q
docker compose -f typing-adventure/docker-compose.yml -f .devcontainer/docker-compose.devcontainer.yml config | grep -nE '\.ssh|\.aws|published'
bash -n .devcontainer/post-create.sh
```
Runtime (chỉ khi Docker lên được, xem Ràng buộc): `npx -y @devcontainers/cli up --workspace-folder .` rồi `npx -y @devcontainers/cli exec --workspace-folder . bash -lc 'cd typing-adventure && pnpm test && pnpm build'`, ghi thời gian.

**EX-2 · MCP tối thiểu**
- `.devcontainer/init-db/01-mcp-readonly.sql`: tạo role `mcp_ro` (LOGIN, chỉ SELECT, `default_transaction_read_only = on`, `statement_timeout = '5s'`). Khác GUIDE: script phải **chạy lại được nhiều lần** (bọc `CREATE ROLE` trong `DO $$ ... IF NOT EXISTS ...`) và **không hardcode** `FOR ROLE dev` (dùng `ALTER DEFAULT PRIVILEGES IN SCHEMA public ...` cho user đang chạy script), để chạy được cả trong container (user `dev`) lẫn Postgres host (user `postgres`).
- `.mcp.json` ở gốc repo: đúng 2 server `context7` (http) và `postgres-ro` trỏ `mcp_ro`, URL lấy từ `${MCP_PG_URL:-...}` như GUIDE §2.2. Không key thật trong file.
- Thêm mục `## MCP` 2 dòng vào `CLAUDE.md` (GUIDE §2.3).
Verify:
```bash
jq '.mcpServers | keys' .mcp.json
set -a; . typing-adventure/.env; set +a
psql "$DATABASE_URL" -f .devcontainer/init-db/01-mcp-readonly.sql && psql "$DATABASE_URL" -f .devcontainer/init-db/01-mcp-readonly.sql
psql postgresql://mcp_ro:mcp_ro@localhost:5432/typing_adventure -c 'select count(*) from "User"'
psql postgresql://mcp_ro:mcp_ro@localhost:5432/typing_adventure -c 'delete from "User"'
claude mcp list
```

**EX-3 · `vitest.config.ts` cho game-engine**
Tạo `typing-adventure/packages/game-engine/vitest.config.ts`: `include: ['src/__tests__/**/*.test.ts']`, `environment: 'node'`. Không sửa test.
Verify: `cd typing-adventure && pnpm --filter @typing-adventure/game-engine exec vitest run` → vẫn **12 file / 137 test**.

**EX-4 · Script `typecheck` qua turbo**
- `turbo.json`: task `typecheck` với `dependsOn: ["^typecheck"]`.
- Root `package.json`: `"typecheck": "turbo typecheck"`; 4 package (`apps/web`, `game-engine`, `i18n`, `db`): `"typecheck": "tsc --noEmit"`.
- Sửa lỗi `process` của `packages/db` đúng cách (thêm type Node cho package đó, dùng `pnpm --filter`), không `@ts-ignore`, không nới `strict`. Package nào thiếu `typescript` thì thêm vào devDependencies.
- Cập nhật dòng "There is no `typecheck` script" trong `CLAUDE.md`.
Verify: `cd typing-adventure && pnpm typecheck` (turbo báo 4 task thành công), rồi `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.

**EX-5 · Vòng mistakes → rule + session hygiene**
- Sửa header bảng `mistakes.md` (thêm dòng `|---|---|---|---|`).
- Ghi mọi lần phải nhắc/sửa hướng agent trong lesson này vào `mistakes.md`. Ít nhất 1 dòng phải được **chuyển thành** rule/skill/dòng `CLAUDE.md` (ghi đường dẫn ở cột cuối) hoặc đánh dấu "chờ L5 hook". Ứng viên có sẵn: quy ước "không thêm comment/Javadoc" hiện chỉ nằm trong `~/.claude/CLAUDE.md` cá nhân, sẽ mất khi vào container.
- Trong REPORT có mục **Session hygiene**: số session đã dùng, khi nào `/clear`, `/compact`, `/rewind` (hoặc vì sao không cần), và kết quả prune: mỗi rule/skill trả lời 3 câu ở GUIDE §4.5.
Verify: đọc `mistakes.md`, REPORT.md; `wc -l CLAUDE.md` ≤ 60.

## Tiêu chí đạt
- **AC-1** (EX-1): đủ 4 file trong `.devcontainer/`; `jq empty`, `docker compose ... config -q`, `bash -n` đều exit 0.
- **AC-2** (EX-1): output `docker compose ... config` không có `.ssh`, `.aws`, không có `published` cho `postgres`/`redis`; có 5 named volume `node_modules`; `Dockerfile` pin `pnpm@9.15.0` và Node 20.
- **AC-3** (EX-1): có dòng metric speed trong `metrics.md` với giờ thật, ghi rõ "sandbox" hoặc "host" và `chưa verify runtime` nếu container chưa chạy.
- **AC-4** (EX-2): `.mcp.json` có đúng 2 key `context7`, `postgres-ro`; không chứa key/token; `CLAUDE.md` có mục `## MCP`.
- **AC-5** (EX-2): script SQL chạy 2 lần liên tiếp không lỗi; `mcp_ro` SELECT được, DELETE bị từ chối (`read-only transaction` hoặc `permission denied`). Nếu không có Postgres nào reach được thì `chưa verify runtime`.
- **AC-6** (EX-3): `vitest.config.ts` tồn tại; số test = 137, 12 file, 0 fail; `git diff main...HEAD -- typing-adventure/packages/game-engine/src` rỗng.
- **AC-7** (EX-4): `pnpm typecheck` exit 0 và chạy đủ 4 package; diff không có `@ts-ignore`, `@ts-expect-error`, `skipLibCheck` mới hay tắt `strict`.
- **AC-8** (EX-4): `pnpm lint && pnpm typecheck && pnpm test && pnpm build` exit 0 (lint chỉ cảnh báo, 0 error).
- **AC-9** (EX-5): bảng `mistakes.md` render được; có ≥1 dòng mới của L02 với cột cuối trỏ tới file rule/skill/`CLAUDE.md` đã sửa (hoặc "chờ L5 hook"); `CLAUDE.md` ≤ 60 dòng.
- **AC-10** (EX-5): REPORT.md có mục Session hygiene và bảng prune; `metrics.md` có dòng quality L2 với số đếm thật.

## Ràng buộc môi trường
- **Docker daemon đang tắt.** Thử `open -a Docker` **1 lần**, chờ tối đa ~2 phút (`docker info` thành công là lên). Không lên được → EX-1 chỉ nộp config + kiểm tra tĩnh (AC-1, AC-2 vẫn bắt buộc, `docker compose config` không cần daemon); phần chạy container và đo "sandbox" ghi `chưa verify runtime`. AC-3, AC-8 khi đó đo trên host.
- Nếu Docker lên: dùng `ports: !reset []` để không phải tắt Postgres Homebrew của host; không `brew services stop` khi không cần.
- **Postgres:** dùng Postgres host qua `DATABASE_URL` trong `typing-adventure/.env` (không in password ra REPORT). Tạo role `mcp_ro` trên DB local là chấp nhận được; **không** trỏ vào DB nào khác ngoài `localhost`.
- `claude mcp list` có thể báo server project "chưa approve" hoặc Context7 lỗi mạng: ghi nguyên văn kết quả; AC-4 chỉ kiểm tĩnh.
- Không có GitHub secret: không làm phần CI ở lesson này.
- Không sửa `.env` để trỏ DB khác; không commit `.env`.

## Nộp bài
Cập nhật `docs/ai-levelup/learner/L02-advanced-setup/REPORT.md` (từng EX: đã làm gì, lệnh verify + kết quả rút gọn, phần nào `chưa verify runtime`), section L02 trong `learner/FEATURE_MAP.md` (mọi file thay đổi), dòng L2 trong `metrics.md`, và `mistakes.md`.

## Mở rộng (không bắt buộc)
- Chạy devcontainer thật, đo cold build bằng rebuild không cache; xác nhận trong container `ls ~/.ssh ~/.aws` báo không tồn tại và `ssh-add -l` thấy key forward (GUIDE §1.4).
- Coverage: `@vitest/coverage-v8` cùng bản 2.1.x + script `test:coverage`, `coverage/` không bị commit.
- Bài thử MCP ở GUIDE §2.4 (Context7 trả `auth()` của NextAuth v5; prompt injection qua tên word pack).
- PR backlog thứ 3: Vitest cho `apps/web` với 1 test `lib/api-response.ts` (GUIDE §4.3).
- Sau 1 tuần: gỡ MCP không được dùng (GUIDE §2.5).
