# L04 · Isolation
Branch: `lesson/L04-isolation` (từ `main` fd10ae7, đã có L00, L02, L03)

## Mục tiêu
Mỗi task chạy trong **workspace riêng** (git worktree + port riêng + schema Postgres riêng), tạo bằng 1 lệnh trong < 2 phút và dọn bằng 1 lệnh an toàn. Hai task chạy song song không giẫm lên nhau.

**Metric** (theo PLAN L4, đo trong lesson này)
- Speed: thời gian `scripts/wt-new.sh` từ lúc gõ tới lúc in xong (đo bằng `/usr/bin/time -p`), cho cả 2 worktree. Mục tiêu < 120 s mỗi cái (pnpm store đã ấm). Ghi riêng lần đầu nếu phải tải gì.
- Quality: *incident do shared state* = số lần test của worktree này đỏ/đổi kết quả vì worktree kia (hoặc vì checkout chính) trong 3 vòng chạy đồng thời ở EX-4. Mục tiêu 0/3.
- Process (giữ từ L03): task multi-file có plan `approved` commit trước code: 3/3.

## Hiện trạng repo (đã kiểm tra khi soạn bài)
- Chưa có `scripts/`, chưa có worktree nào (`git worktree list` chỉ 1 dòng). git 2.51 (có `git worktree add --relative-paths`), có `psql` và `gh` trên host.
- 3 file env: `typing-adventure/.env` (`DATABASE_URL`, `NEXTAUTH_URL`…), `typing-adventure/apps/web/.env` (`DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`…), `typing-adventure/packages/db/.env` (`DATABASE_URL`). Chưa file nào có `PORT` hay `NEXT_PUBLIC_WS_URL`.
- `apps/web/server.ts` đọc `process.env.PORT` (mặc định 3000) và gắn Socket.IO **vào cùng HTTP server**, nên port WS = `PORT`; client nối theo `NEXT_PUBLIC_WS_URL` (rỗng = cùng origin).
- Prisma 6, datasource `env("DATABASE_URL")`, không dùng `@@schema`. pnpm store toàn cục `~/Library/pnpm/store/v3` (không có `.npmrc`).
- `apps/web` có Vitest (3 file unit trong `src/lib/__tests__/`, include `src/**/__tests__/**/*.test.ts`), chưa có test chạm DB, chưa có Playwright.
- `register` có limiter 5 lần/15 phút/IP (module-level `Map`); `leaderboard` GET dùng `$queryRaw` (SQL thô).

## Kiến thức cần nắm
- **Worktree = 1 thư mục làm việc + 1 branch, chung `.git`.** Rẻ hơn clone, nhưng mọi thứ *ngoài git* vẫn dùng chung nếu không tách: port, DB, `.env`, cookie trình duyệt, server đang chạy. Isolation thật = tách cả 3 lớp: code (worktree), mạng (port), dữ liệu (schema).
- **Chỗ đặt worktree.** Mặc định `.worktrees/<slug>` ở gốc repo, đưa `.worktrees/` vào `.gitignore`, tạo bằng `--relative-paths` để file `.git` của worktree không chứa đường dẫn tuyệt đối của host: devcontainer (L02) chỉ bind mount gốc repo, nên worktree nằm trong đó và trỏ tương đối thì mở được trong container. Cho phép đổi bằng `WT_DIR`. Không bao giờ mount riêng thư mục worktree (mất `.git` chung).
- **Schema Postgres theo branch.** `?schema=wt_<slug>` + `prisma db push` tạo bảng trong schema riêng, cùng server `localhost:5432`, không cần container mới. Prisma đặt `search_path` theo tham số này nên cả `$queryRaw` cũng đi đúng schema. `psql` **không hiểu** `?schema=` (báo lỗi URI): khi drop phải bỏ tham số này hoặc dùng `prisma db execute --url`. Tên schema phải qua whitelist `^wt_[a-z0-9_]{1,60}$` trước khi ghép vào SQL.
- **`PORT` trong `.env` không đổi port của Next.** Server HTTP khởi động trước khi Next nạp `.env`; `server.ts` đọc `process.env.PORT` lúc import. Port phải nằm trong biến môi trường của shell (vd file `<wt>/.wt-env` để `set -a; . ./.wt-env; set +a`). `NEXTAUTH_URL` và `NEXT_PUBLIC_WS_URL` thì phải theo port mới, nếu không redirect đăng nhập/socket sẽ chạy sang server của checkout khác: đó chính là incident shared state.
- **Dọn an toàn hơn tạo.** Prune phải từ chối khi: worktree bẩn (kể cả file untracked), đường dẫn là checkout chính, branch là `main`, schema không khớp whitelist hoặc là `public`. Repo này **squash merge**: branch đã merge qua PR *không* là ancestor của `main`, nên `git branch -d` từ chối; chỉ xoá khi là ancestor của base (`--into`, mặc định `main`) hoặc `gh pr list --head <branch> --state merged` trả về PR. Không chắc thì giữ branch và in lý do.
- **Không in secret.** Script sửa `.env` bằng `sed`/`awk` tại chỗ, không `cat`/`echo` giá trị, không `set -x`. Log chỉ in tên biến, port, tên schema.

## Bài tập

**EX-1 · `scripts/wt-new.sh` + `scripts/wt-prune.sh` (plan trước)**
Plan `docs/plans/L04-worktree-scripts.md` theo `_template.md`, commit riêng trước code. Script ở `scripts/` gốc repo, `bash`, `set -euo pipefail`, chạy được từ bất kỳ thư mục nào trong checkout chính.
- `wt-new.sh <branch> [--base <ref>] [--no-install]` (`--no-install` bỏ qua install/generate/push, dùng để thử prune nhanh): slug từ branch (thường hoá, ký tự lạ → `_`); `git worktree add --relative-paths` (branch có sẵn thì dùng, chưa có thì `-b` từ base, mặc định `HEAD`); copy 3 file `.env` từ checkout chính; chọn `n` nhỏ nhất ≥ 1 sao cho `PORT=3000+n` chưa có process listen (`lsof -iTCP:<p> -sTCP:LISTEN`) và chưa worktree nào khác giữ; ghi vào cả 3 file `DATABASE_URL` có `schema=wt_<slug>` (thay nếu đã có `schema=`, giữ các tham số khác); ghi `NEXTAUTH_URL`, `NEXT_PUBLIC_WS_URL` = `http://localhost:<PORT>` vào 2 file root + web; ghi `<wt>/.wt-env` (`PORT`, `WT_SCHEMA`); `pnpm install --frozen-lockfile --prefer-offline` trong `typing-adventure/`, `db:generate`, `prisma db push --skip-generate`; cuối cùng in path, port, schema, lệnh chạy dev. Gọi lại cùng branch: báo lỗi rõ, không phá worktree cũ.
- `wt-prune.sh <branch|path> [--into <ref>] [--dry-run]`: kiểm hết các điều kiện ở Kiến thức **trước** khi đụng gì; drop schema (`DROP SCHEMA IF EXISTS "<schema>" CASCADE`) với URL đã bỏ `schema=`; `git worktree remove` (không `--force`); xoá branch chỉ khi đã merge; `--dry-run` in kế hoạch, không làm gì.
- `.gitignore` gốc thêm `.worktrees/`; `.wt-env` không được bị git track (ignore trong worktree).
- 1 dòng `CLAUDE.md` mục Commands (không vượt 63 dòng): cách tạo/dọn worktree.
Verify:
```bash
bash -n scripts/wt-new.sh scripts/wt-prune.sh && shellcheck scripts/wt-*.sh   # shellcheck nếu có
/usr/bin/time -p scripts/wt-new.sh wt/smoke --no-install 2>&1 | tee /tmp/wt-new.log
git worktree list; psql "<URL không có schema=>" -Atc "select nspname from pg_namespace where nspname like 'wt_%'"
```

**EX-2 · Task A trong worktree 1: API integration test (plan trước, trong worktree)**
`scripts/wt-new.sh lesson/L04-api-test`, mở phiên agent/terminal trong worktree đó. Plan `docs/plans/L04-api-integration-test.md` commit trên branch task trước code.
- Tách 2 loại test: `pnpm --filter @typing-adventure/web test` vẫn chỉ chạy unit, **không cần DB** (loại `*.int.test.ts`); script mới `test:integration` dùng config riêng (vd `apps/web/vitest.integration.config.ts`) nạp `apps/web/.env` (vd `loadEnv` của Vite).
- Guard trong setup: thoát với lỗi rõ nếu `DATABASE_URL` không có `schema=wt_…` (không bao giờ ghi vào `public`).
- Test ≥ 4 case gọi thẳng handler (`POST` từ `@/app/api/auth/register/route`, `GET` từ `@/app/api/leaderboard/route`) bằng `NextRequest`: register hợp lệ → `success: true`; email trùng → 409; body sai → 400; leaderboard trả envelope `success` với dữ liệu do test tự tạo. Dọn dữ liệu của chính test (`beforeEach`/`afterAll`). Lưu ý limiter register 5 lần/IP: đặt `x-real-ip` khác nhau mỗi case hoặc giữ ≤ 5 lần.

**EX-3 · Task B trong worktree 2: Playwright E2E skeleton (plan trước, trong worktree)**
`scripts/wt-new.sh lesson/L04-e2e`. Plan `docs/plans/L04-e2e-skeleton.md`.
- `@playwright/test` devDep `apps/web` (chỉ chromium), `apps/web/playwright.config.ts`: `baseURL` và `webServer.url` theo `process.env.PORT` (không có thì báo lỗi, không lặng lẽ dùng 3000), `webServer.command` chạy `dev:ws`, `reuseExistingServer: false` (nếu true sẽ "mượn" server của checkout khác = shared state).
- `apps/web/e2e/*.spec.ts` ≥ 3 test: trang `/` render; `GET /api/leaderboard` trả `success: true`; handshake `socket.io/?EIO=4&transport=polling` có `"sid"` trên đúng port. Script `test:e2e`. `.gitignore` thêm `test-results/`, `playwright-report/`. Vitest không được nhặt file `e2e/`.

**EX-4 · Chạy song song, chứng minh không dính nhau**
Từ checkout chính, khi `next dev` của checkout chính **đang chạy** trên 3000:
```bash
for i in 1 2 3; do
  (cd <wtA>/typing-adventure && pnpm --filter @typing-adventure/web test:integration) > /tmp/a$i.log 2>&1 &
  (cd <wtB>/typing-adventure && set -a && . ../.wt-env && set +a && pnpm --filter @typing-adventure/web test:e2e) > /tmp/b$i.log 2>&1 &
  wait; echo "round $i done"
done
```
Ghi vào REPORT: kết quả 6 lần chạy; `lsof -iTCP -sTCP:LISTEN` trong lúc chạy (3 port khác nhau); số dòng `"User"` trong `public`, `wt_lesson_l04_api_test`, `wt_lesson_l04_e2e` trước/sau (chỉ số đếm, không in dữ liệu); `public` không đổi.

**EX-5 · Gộp về và dọn**
Merge 2 branch task vào `lesson/L04-isolation` (`git merge --no-ff`), rồi `scripts/wt-prune.sh <branch> --into lesson/L04-isolation` cho cả 2 (branch bị xoá vì là ancestor). Chứng minh các nhánh từ chối bằng worktree `wt/smoke` của EX-1: (a) tạo 1 file untracked → prune từ chối, không gì bị xoá; (b) prune đường dẫn checkout chính → từ chối; (c) sửa `.env` của smoke thành `schema=public` → từ chối; (d) dọn sạch smoke (branch chưa merge → giữ branch, in lý do), rồi `git branch -D wt/smoke` bằng tay.

## Tiêu chí đạt
- **AC-1** (EX-1): `bash -n` 2 script exit 0; shellcheck không có error (hoặc ghi "không có shellcheck"); `git check-ignore -q .worktrees/x` exit 0; `CLAUDE.md` ≤ 63 dòng có dòng worktree; plan `L04-worktree-scripts.md` `approved`, commit trước commit script trong `git log --reverse main..HEAD`.
- **AC-2** (EX-1, không lộ secret): `grep -nE 'set -x|cat .*\.env|echo .*(DATABASE_URL|SECRET)' scripts/wt-*.sh` không ra dòng nào; log `wt-new` không chứa password DB (người chấm kiểm bằng `grep -cF` với giá trị lấy từ `.env`, không in ra) → 0.
- **AC-3** (EX-1): sau `wt-new`, trong worktree: `grep -c 'schema=wt_' ` ở cả 3 file `.env` = 1; `NEXTAUTH_URL`/`NEXT_PUBLIC_WS_URL` cùng port với `.wt-env`; 2 worktree có 2 port khác nhau ≥ 3001 và 2 schema khác nhau tồn tại trong `pg_namespace`; `cat .git` của worktree là đường dẫn tương đối; `git -C <wt> status --porcelain` rỗng ngay sau khi tạo.
- **AC-4** (EX-1, metric speed): `metrics.md` có thời gian `wt-new` thật (giây, `/usr/bin/time`) cho 2 worktree task, có ghi store ấm/lạnh; < 120 s, nếu vượt thì ghi bước chậm nhất và lý do.
- **AC-5** (EX-2): `pnpm --filter @typing-adventure/web test` ở checkout có `DATABASE_URL` trỏ sai/không có DB vẫn pass (unit không cần DB); `test:integration` ≥ 4 test pass trong worktree; chạy với `DATABASE_URL` không có `schema=wt_` thì thoát lỗi trước khi chạm DB.
- **AC-6** (EX-3): `test:e2e` ≥ 3 test pass trong worktree, server lên đúng `PORT` của `.wt-env`; `grep -n 'reuseExistingServer' apps/web/playwright.config.ts` là `false`; `pnpm test` (Vitest) không chạy file trong `e2e/`.
- **AC-7** (EX-4, metric quality): 3 vòng đồng thời, 6/6 lần xanh, REPORT có log rút gọn + `lsof` 3 port + số đếm `"User"` trước/sau 3 schema; `public` không đổi; incident = 0 ghi vào `metrics.md`.
- **AC-8** (EX-5): `git worktree list` cuối cùng chỉ còn checkout chính; không còn schema `wt_%`; 2 branch task đã bị xoá, commit của chúng có trong `git log lesson/L04-isolation`; REPORT có output 4 tình huống từ chối (a)–(d), mỗi cái exit ≠ 0 và kiểm tra sau đó cho thấy không gì bị xoá; schema `public` còn nguyên (đếm bảng trước/sau bằng nhau).
- **AC-9** (giữ L03): 3 plan `approved`, commit trước code trên branch của chúng; mỗi plan có mục `## Thực tế` (danh sách file lấy bằng `git diff --name-only <base>...<branch>`, toàn repo trừ `docs/ai-levelup/`), tỉ lệ khớp ghi vào `metrics.md`.
- **AC-10**: ở checkout chính sau khi gộp: `rtk proxy pnpm lint && rtk proxy pnpm typecheck && rtk proxy pnpm test && rtk proxy pnpm build` exit 0; `git diff main -- typing-adventure/packages/game-engine` rỗng; dependency mới chỉ là `@playwright/test` (devDep `apps/web`).

## Ràng buộc môi trường
- Postgres host `localhost:5432`, thông tin trong `typing-adventure/.env`: **không in**. Không chạy `docker compose up` trong worktree (trùng cổng 5432/6379, project name khác): mọi worktree dùng chung server, tách bằng schema.
- `prisma db push` chỉ trên schema `wt_*`. Không `migrate reset`, không đụng `public` ngoài lệnh đếm `select count(*)`.
- Playwright cần tải chromium (~150 MB, cache `~/Library/Caches/ms-playwright` dùng chung giữa worktree): thời gian tải lần đầu **không** tính vào setup worktree, ghi riêng. Không tải được thì nộp config + spec + `playwright test --list` và ghi `chưa verify runtime` cho AC-6/AC-7 (phần B); phần A vẫn phải chạy thật.
- Tắt mọi server do mình bật bằng PID cụ thể; cuối phiên `lsof -iTCP:3000-3010 -sTCP:LISTEN` rỗng (trừ server có từ trước phiên, ghi rõ).
- Không có GitHub secret: không làm CI. `gh` chỉ dùng đọc (`gh pr list`); không có quyền thì nhánh squash-merge ghi `chưa verify runtime`.
- Không switch branch ở checkout chính: mọi task con làm trong worktree.

## Nộp bài
`docs/ai-levelup/learner/L04-isolation/REPORT.md` (từng EX: đã làm, lệnh + kết quả rút gọn, thời gian thật, `chưa verify runtime` nếu có), section L04 trong `learner/FEATURE_MAP.md` (mọi file, kể cả 3 plan và file teacher), dòng L4 trong `metrics.md` (setup time ×2, incident x/3, plan khớp ×3, plan trước code x/3), `mistakes.md` nếu có lỗi lặp. PR body link 3 plan.

## Mở rộng (không bắt buộc)
- So `claude -w` (worktree có sẵn của Claude Code) với `wt-new.sh`: nó tách được gì, thiếu gì (port, schema, env).
- Chuyển pnpm store của devcontainer ra named volume (BACKLOG #6), đo lại `wt-new` trong container.
- `wt-list.sh`: liệt kê worktree + port + schema + trạng thái merge; cảnh báo schema mồ côi (có schema `wt_*` mà không còn worktree).
- Seed tối thiểu tuỳ chọn `--seed` cho worktree cần dữ liệu mẫu.
- Xem các follow-up khác trong [BACKLOG.md](../BACKLOG.md).
