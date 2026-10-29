# L04 · Isolation — Báo cáo

Branch: `lesson/L04-isolation` (từ `main` = `origin/main` = `fd10ae7`) · PR: xem cuối báo cáo · Chấm: [GRADE.md](../../lessons/L04-isolation/GRADE.md) PASS

Phiên bắt đầu 23:44:20, xong code + verify 23:59:32. Baseline đầu phiên: `public."User"` = 12 dòng, `public` có 13 bảng, không có schema `wt_%`, `git worktree list` 1 dòng, `lsof -iTCP:3000-3010 -sTCP:LISTEN` rỗng.

## Điều đã học
- Worktree chỉ tách code. Thứ làm 2 task giẫm nhau nằm ngoài git: port, schema DB, `.env`, server đang chạy. Isolation thật = 3 lớp, và script phải dựng cả 3 trong 1 lệnh, nếu không sẽ có người quên 1 lớp.
- `PORT` phải nằm trong env của shell (`.wt-env`), không phải `.env`; `NEXTAUTH_URL`/`NEXT_PUBLIC_WS_URL` phải theo port đó. Playwright `reuseExistingServer: false` là lớp chặn cuối: chạy nhầm `PORT=3000` khi checkout chính đang chạy → `Error: http://localhost:3000 is already used`, không "mượn" server khác.
- Biến môi trường shell thắng `.env` (Prisma, `process.loadEnvFile`). Vì vậy `wt-new` chạy `db push` với `env -u DATABASE_URL`, còn test integration có guard schema ở `globalSetup`, chạy trước mọi kết nối DB.
- Dọn khó hơn tạo: kiểm toàn bộ điều kiện trước khi đụng gì, và "đã merge" phải định nghĩa rõ. Branch không có commit riêng (smoke tạo từ `HEAD`) là ancestor của mọi thứ phía sau nên bị coi là đã merge và bị xoá. Đúng theo luật, nhưng phải tạo commit riêng mới chứng minh được nhánh "giữ branch".
- Chạy song song chỉ thành bằng chứng khi có số đếm: 3 port khác nhau trong `lsof`, số dòng `User` của 3 schema trước/sau, `public` không đổi.

## Bài tập
| EX | Việc đã làm | File |
|---|---|---|
| EX-1 | Plan approved commit `f52ebb8` trước code `c25d065`. `wt-new.sh`: slug, `worktree add --relative-paths` (branch có sẵn thì dùng, chưa có thì `-b` từ `--base`), copy 3 `.env`, chọn port `3000+n` theo `lsof` + `.wt-env` của worktree khác, ghi `schema=wt_<slug>` (giữ tham số khác), `NEXTAUTH_URL`/`NEXT_PUBLIC_WS_URL`, `.wt-env`, install/generate/`db push`, tự kiểm `schema=` sau khi ghi. `wt-prune.sh`: kiểm hết trước (không tìm thấy, checkout chính, `main`, bẩn kể cả untracked, schema `public`/ngoài whitelist/lệch giữa 3 file hoặc với `.wt-env`, `--into` không tồn tại); drop schema bằng URL đã bỏ `schema=`; `worktree remove` không `--force`; branch: ancestor → `-d`, PR merged (gh) → `-D`, còn lại giữ + lý do; `--dry-run`. `.gitignore` gốc `.worktrees/`, `.wt-env` (script ghi thêm `.wt-env` vào `.git/info/exclude`). 1 dòng `CLAUDE.md` | `docs/plans/L04-worktree-scripts.md`, `scripts/wt-new.sh`, `scripts/wt-prune.sh`, `.gitignore`, `CLAUDE.md` |
| EX-2 | Trong worktree `.worktrees/lesson_l04_api_test` (port 3002, schema `wt_lesson_l04_api_test`), plan `fb79f38` trước code `39d2a96`. Unit loại `*.int.test.ts`; `test:integration` dùng `vitest.integration.config.ts` (nạp `apps/web/.env` bằng `process.loadEnvFile` vì `vite` không resolve được từ `apps/web` dưới pnpm strict), guard `globalSetup`; 6 test gọi thẳng `POST` register / `GET` leaderboard bằng `NextRequest` (`x-real-ip` riêng mỗi case, dọn email `@int.test` ở `beforeAll`/`afterAll`) | `docs/plans/L04-api-integration-test.md`, `apps/web/{package.json,vitest.config.ts,vitest.integration.config.ts}`, `apps/web/src/test/integration-global-setup.ts`, `apps/web/src/app/api/__tests__/auth-leaderboard.int.test.ts` |
| EX-3 | Trong worktree `.worktrees/lesson_l04_e2e` (port 3003, schema `wt_lesson_l04_e2e`), plan `5145a7e` trước code `5e1b542`. `@playwright/test@^1.64.1` devDep web; `playwright.config.ts` (thiếu `PORT` → throw; `baseURL` = `webServer.url` theo `PORT`; `pnpm dev:ws`; `reuseExistingServer: false`; chỉ chromium); `e2e/smoke.spec.ts` 3 test; script `test:e2e`; `typing-adventure/.gitignore` thêm `test-results/`, `playwright-report/` | `docs/plans/L04-e2e-skeleton.md`, `apps/web/{package.json,playwright.config.ts,e2e/smoke.spec.ts}`, `typing-adventure/.gitignore`, `typing-adventure/pnpm-lock.yaml` |
| EX-4 | 3 vòng A ‖ B khi `next dev` của checkout chính chạy trên 3000. Chạy 2 lượt: lượt 1 đúng lệnh bài (A không mở server nên `lsof` chỉ có 2 port), lượt 2 thêm `dev:ws` của worktree A trên 3002 để có 3 server cùng lúc. 12/12 lần xanh | log trong scratchpad, tóm tắt ở dưới |
| EX-5 | Điền `## Thực tế` cho 3 plan; `merge --no-ff` 2 branch task (conflict `apps/web/package.json` scripts, giữ cả 2); `wt-prune.sh <branch> --into lesson/L04-isolation` cho 2 branch (xoá branch vì là ancestor); 4 tình huống từ chối trên `wt/smoke` | 3 plan, merge `a633ac1`, `1727808` |

(Đường dẫn `apps/web/...` là `typing-adventure/apps/web/...`.)

## Tiêu chí
| AC | Kết quả | Bằng chứng |
|---|---|---|
| AC-1 | Đạt | `bash -n scripts/wt-new.sh scripts/wt-prune.sh` → exit 0. Không có `shellcheck` → `brew install shellcheck` (1 lần) → `shellcheck scripts/wt-*.sh` exit 0, không cảnh báo. `git check-ignore -q .worktrees/x` → exit 0. `wc -l CLAUDE.md` → 62; dòng 23 `../scripts/wt-new.sh <branch> [--base <ref>] # isolated worktree .worktrees/<slug>, PORT 3000+n in ../.wt-env, DB schema wt_<slug>; clean up: ../scripts/wt-prune.sh <branch> --into <ref>`. `git log --reverse main..HEAD`: `f52ebb8 docs(plans): L04 worktree scripts plan (approved)` đứng trước `c25d065 feat(scripts): wt-new and wt-prune…` |
| AC-2 | Đạt | `grep -nE 'set -x\|cat .*\.env\|echo .*(DATABASE_URL\|SECRET)' scripts/wt-*.sh` → không dòng nào (exit 1). Lần đầu ra 1 dòng `echo "… (DATABASE_URL schema=…"`, đã đổi thành `printf "… db schema=%s …"` trước khi commit. Password đọc từ `.env` vào biến, không in: `grep -cF "$PW"` → `wt-new-api.log 0`, `wt-new-e2e.log 0`, `wt-new-smoke.log 0`. Log chỉ có path, port, schema; dòng Prisma `Datasource "db": PostgreSQL database "typing_adventure", schema "wt_lesson_l04_api_test" at "localhost:5432"` không có user/password |
| AC-3 | Đạt | Cả 2 worktree task: `grep -c 'schema=wt_'` ở `.env`, `apps/web/.env`, `packages/db/.env` = `1 1 1`; `.wt-env` = `PORT=3002 WT_SCHEMA=wt_lesson_l04_api_test` / `PORT=3003 WT_SCHEMA=wt_lesson_l04_e2e`; `NEXTAUTH_URL`, `NEXT_PUBLIC_WS_URL` = `http://localhost:3002` / `:3003` ở root + web; `pg_namespace` → `wt_lesson_l04_api_test`, `wt_lesson_l04_e2e`; `cat .git` → `gitdir: ../../.git/worktrees/lesson_l04_api_test` (tương đối, tương tự e2e); `git -C <wt> status --porcelain` rỗng. Các biến còn lại trong `.env` giống bản chính (`diff` sau khi lọc 3 biến → giống). Gọi lại `wt-new.sh wt/smoke` → `branch wt/smoke is already checked out in a worktree…; nothing changed`, exit 1; slug trùng (`WT/Smoke`) → `path already exists…; nothing changed`, exit 1 |
| AC-4 | Đạt | `/usr/bin/time -p`: `lesson/L04-api-test` real **15.11 s** (pnpm `reused 628, downloaded 0`, install 11.8 s); `lesson/L04-e2e` real **7.44 s** (install 3.4 s). Store ấm. `wt/smoke --no-install` real 0.29 s. Tải chromium-headless-shell 1248 + ffmpeg 1013 (Playwright 1.64.1) tính riêng: real 20.79 s |
| AC-5 | Đạt | Worktree A: `DATABASE_URL=postgresql://x:y@127.0.0.1:1/none pnpm --filter @typing-adventure/web test` → exit 0, 3 file 17 test (không có file `.int.`). Checkout chính sau merge, cùng URL sai: `pnpm test` → exit 0, game-engine 137 + web 17. `test:integration` → `Tests 6 passed (6)`. Với URL sai → exit 1, `Error: Integration tests refused: DATABASE_URL must contain schema=wt_<slug>…`, `Tests no tests`; với URL thật trỏ `public` (không `schema=`) → exit 1 cùng lỗi, log không chứa password (`grep -cF` → 0), `public."User"` vẫn 12 |
| AC-6 | Đạt | Worktree B: `set -a; . ../.wt-env; set +a; pnpm --filter @typing-adventure/web test:e2e` → `[WebServer] > Ready on http://localhost:3003`, `3 passed`. `grep -n reuseExistingServer apps/web/playwright.config.ts` → `23: reuseExistingServer: false,`. `env -u PORT npx playwright test --list` → `Error: PORT is not set…`, exit 1. `vitest list` (web) → 17 test đều ở `src/lib/__tests__/`, `grep -c e2e/` → 0 |
| AC-7 | Đạt | Xem EX-4: lượt 1 6/6 xanh, lượt 2 (3 server) 6/6 xanh. `lsof` lúc chạy có 3000, 3002, 3003. `"User"` trước/sau: `public` 12/12, `wt_lesson_l04_api_test` 0/0, `wt_lesson_l04_e2e` 0/0 (test tự dọn). Incident 0/3 |
| AC-8 | Đạt (xem ghi chú d) | Cuối: `git worktree list` 1 dòng (checkout chính); `count(*) from pg_namespace where nspname like 'wt_%'` → 0; `git branch` không còn `lesson/L04-api-test`, `lesson/L04-e2e`, `wt/smoke`; `git log lesson/L04-isolation` có `39d2a96`, `5e1b542`, `18c0ba1`, `3654723`; `public` 13 bảng trước/sau, `User` 12. (a)–(c) exit 1, kiểm sau đó không gì bị xoá. (d) là lệnh dọn thành công (exit 0), in lý do giữ branch |
| AC-9 | Đạt | 3 plan `approved`, mỗi plan commit riêng trước code trên branch của nó: `f52ebb8 → c25d065`, `fb79f38 → 39d2a96`, `5145a7e → 5e1b542`. Mỗi plan có `## Thực tế` từ `git diff --name-only <base>...<branch> -- . ':!docs/ai-levelup/'`: 5/5, 6/6, 6/6 = 100%, design round 2: không |
| AC-10 | Đạt | Checkout chính sau merge + `pnpm install --frozen-lockfile --prefer-offline`: `rtk proxy pnpm lint --force` 0 (`0 errors, 37 warnings`, bằng L03), `typecheck --force` 0 (`Tasks: 4 successful`), `test` 0 (137 + 17), `build --force` 0 (41 s cả 4). Chuỗi đúng lệnh AC `lint && typecheck && test && build` → exit 0. `git diff main -- typing-adventure/packages/game-engine \| wc -l` → 0. Dependency mới duy nhất: `+"@playwright/test": "^1.64.1"` trong devDependencies `apps/web`; `package.json` gốc và `packages/*` không đổi. `next build` không phàn nàn thư mục `src/app/api/__tests__` |

## EX-4: chạy song song
Lệnh theo bài (log vào scratchpad thay vì `/tmp`). Checkout chính chạy `pnpm --filter @typing-adventure/web dev` trên 3000 (`curl /` → 200 trước và trong mỗi vòng).

| Lượt | Vòng | A `test:integration` | B `test:e2e` | Thời gian vòng |
|---|---|---|---|---|
| 1 (lệnh bài) | 1 | exit 0, 6 passed | exit 0, 3 passed, `Ready on http://localhost:3003` | 10 s |
| 1 | 2 | exit 0, 6 passed | exit 0, 3 passed | 8 s |
| 1 | 3 | exit 0, 6 passed | exit 0, 3 passed | 8 s |
| 2 (+ `dev:ws` của A trên 3002) | 1 | exit 0, 6 passed | exit 0, 3 passed | 10 s |
| 2 | 2 | exit 0, 6 passed | exit 0, 3 passed | 8 s |
| 2 | 3 | exit 0, 6 passed | exit 0, 3 passed | 9 s |

`lsof -nP -iTCP:3000-3010 -sTCP:LISTEN` lấy ngay khi 3003 lên (lượt 2, vòng 1):
```
node    50258 dat.do   13u  IPv6 …  TCP *:3000 (LISTEN)     # next dev checkout chính
node    50827 dat.do   39u  IPv6 …  TCP *:3002 (LISTEN)     # dev:ws worktree A
node    51025 dat.do   31u  IPv6 …  TCP *:3003 (LISTEN)     # dev:ws do Playwright bật, worktree B
during round: :3000 / -> 200
```
Lượt 1 chỉ có `*:3000` và `*:3003` (worktree A chỉ chạy test, không mở port), nên chạy thêm lượt 2 cho đủ 3 port. PID của 3003 đổi mỗi vòng (50408/50559/50698, 51025/51170/51313): Playwright bật server mới mỗi lần, không mượn.

Số dòng `"User"` (chỉ đếm):
| Schema | Trước | Sau |
|---|---|---|
| `public` | 12 (13 bảng, `GameSession` 325) | 12 (13 bảng, `GameSession` 325) |
| `wt_lesson_l04_api_test` | 0 | 0 |
| `wt_lesson_l04_e2e` | 0 | 0 |

Đối chứng shared state: `PORT=3000 npx playwright test` trong worktree B khi checkout chính đang chạy → `Error: http://localhost:3000 is already used, make sure that nothing is running on the port/url or set reuseExistingServer:true in config.webServer.`, exit 1.

## EX-5: gộp và dọn
- `git merge --no-ff lesson/L04-api-test` → `a633ac1`, sạch. `git merge --no-ff lesson/L04-e2e` → conflict `typing-adventure/apps/web/package.json` (cả 2 branch thêm script sau `"test"`, plan e2e đã đoán ở Tự review), giữ cả `test:integration` và `test:e2e` → `1727808`.
- `wt-prune.sh lesson/L04-api-test --into lesson/L04-isolation` → `branch: … -> delete (… is an ancestor of lesson/L04-isolation)`, `dropped schema wt_lesson_l04_api_test`, `removed worktree …`, `Deleted branch lesson/L04-api-test (was 18c0ba1).`, exit 0. Tương tự `lesson/L04-e2e` (`was 3654723`).

4 tình huống trên `wt/smoke`. Để thấy schema có bị drop hay không, tạo trước `create schema if not exists wt_wt_smoke` (smoke `--no-install` không `db push`). Dòng `check:` in sau mỗi lệnh:
```
### (a) untracked file  (touch notes.txt)
?? notes.txt
wt-prune: REFUSED: worktree …/.worktrees/wt_smoke has uncommitted or untracked files
exit=1
  check: worktrees=2 smoke_dir=yes branch=1 wt_schemas=wt_wt_smoke public_tables=13
### (b) main checkout path
wt-prune: REFUSED: …/keyboad_with_sound is the main checkout
exit=1
  check: worktrees=2 smoke_dir=yes branch=1 wt_schemas=wt_wt_smoke public_tables=13
### (c) schema=public trong typing-adventure/.env của smoke
wt-prune: REFUSED: typing-adventure/.env points DATABASE_URL at schema public
exit=1
  check: worktrees=2 smoke_dir=yes branch=1 wt_schemas=wt_wt_smoke public_tables=13
### (d) dọn sạch, branch chưa merge  (smoke có 1 commit riêng)
  branch:   wt/smoke -> keep (wt/smoke is not merged into lesson/L04-isolation and has no merged PR)
wt-prune: dropped schema wt_wt_smoke
wt-prune: removed worktree …/.worktrees/wt_smoke
wt-prune: kept branch wt/smoke: wt/smoke is not merged into lesson/L04-isolation and has no merged PR
exit=0
  check: worktrees=1 smoke_dir=no branch=1 wt_schemas=- public_tables=13
git branch -D wt/smoke → ok
  check: worktrees=1 smoke_dir=no branch=0 wt_schemas=- public_tables=13
```
Ghi chú (d):
- Lần chạy (d) đầu tiên, `wt/smoke` của EX-1 chưa có commit riêng (`f52ebb8`, ancestor của `lesson/L04-isolation`), nên script coi là đã merge: `Deleted branch wt/smoke (was f52ebb8)`, rồi `git branch -D wt/smoke` tay báo `branch 'wt/smoke' not found`. Đúng theo luật "ancestor = đã merge" nhưng không chứng minh được nhánh giữ branch. Tạo lại `wt-new.sh wt/smoke --no-install` (port 3001, schema `wt_wt_smoke`), commit 1 file trong worktree, chạy lại (d) như trên.
- (d) là lệnh dọn thành công nên exit 0; phần "từ chối" ở đây là không xoá branch (in lý do, `branch=1` sau lệnh). Câu "mỗi cái exit ≠ 0" của AC-8 chỉ áp được cho (a)–(c). Thêm: `wt-prune.sh main` → `REFUSED: no worktree found for 'main'`, exit 1 (`main` không checkout ở worktree nào nên luật `branch is main` không có dịp chạy).
- `gh pr list --head wt/smoke --state merged` chạy được (chỉ đọc) và trả 0 PR, nên lý do in ra là "has no merged PR", không phải "gh unavailable".

## Metric
| Metric | Giá trị |
|---|---|
| `wt-new` worktree A (`lesson/L04-api-test`) | 15.11 s, store ấm (`reused 628, downloaded 0`) |
| `wt-new` worktree B (`lesson/L04-e2e`) | 7.44 s, store ấm |
| `wt-new --no-install` (smoke) | 0.29 s |
| Tải chromium Playwright 1.64.1 (riêng, không tính vào setup) | 20.79 s |
| Incident shared state | 0/3 (cả 2 lượt, 12/12 lần chạy xanh) |
| Plan khớp | worktree-scripts 5/5, api-integration-test 6/6, e2e-skeleton 6/6 (100%) |
| Plan approved trước code | 3/3 |
| Plan → code (giờ commit) | EX-1 23:45:51 → 23:48:07; EX-2 23:49:47 → 23:50:59; EX-3 23:51:58 → 23:53:39 |
| Tổng phiên đến hết verify | 23:44:20 → 23:59:32 (~15 phút) |
| Test mới | 6 integration + 3 e2e |

## Vấn đề gặp phải
- Lần thử `wt-new` đầu tiên lỡ chạy từ `/tmp` (ngoài checkout) và `tee` log ra 1 file ngoài repo. Script từ chối đúng (`not inside a git checkout`, exit 1); file log đã xoá. Sau đó chạy từ `typing-adventure/apps/web` để chứng minh chạy được từ thư mục con.
- `--dry-run` in sai dòng schema (`${schema:+…}${schema:-…}` nối cả 2 nhánh); sửa thành `if` trước khi commit script.
- `vite` không import được từ `apps/web` (pnpm strict, chỉ là dep của vitest) → dùng `process.loadEnvFile` của Node (đã ghi trong plan trước khi code).
- `npx prettier --check` qua `rtk` in "All files formatted correctly" nhưng exit 1; `rtk proxy` cho thấy 1 file test chưa format → `--write`. Tin exit code, không tin bản tóm tắt.
- `rtk git log` ẩn merge commit: sau `commit --amend` (làm sạch message merge còn dòng `# Conflicts:`) tưởng HEAD lùi về `7b58fb9`; `rtk proxy git log --format='%h %p %s'` cho thấy merge `1727808` đủ 2 parent.
- `pnpm test --force` lỗi `Unknown option: 'force'` (`test` là lệnh built-in của pnpm, không chuyển cờ cho turbo). Turbo `test` đã `cache: false` nên chạy `pnpm test` thường.
- Giờ trong mục Lịch sử của 3 plan là ước lượng lúc viết (lệch 1–2 phút so với giờ commit); giờ commit thật ghi trong `## Thực tế`, không sửa phần dự đoán.
- Lockfile: thêm `@playwright/test` làm hậu tố peer của `next`, `next-auth`, `@sentry/nextjs` đổi thành `(…)(@playwright/test@1.64.1)(…)` (`next` khai báo peer tuỳ chọn); gói mới chỉ có `@playwright/test`, `playwright`, `playwright-core`.
- Vài log tạm của guard ghi vào `/tmp` rồi xoá ngay; các log còn lại để trong scratchpad của phiên.

## Chưa verify runtime
- Chạy script trong devcontainer (mount gốc repo, `--relative-paths`): mới kiểm `.git` của worktree là đường dẫn tương đối, chưa mở worktree trong container.
- Nhánh xoá branch squash-merge (`gh pr list --state merged` có PR → `git branch -D`): `gh` chạy được nhưng không có PR merged nào với head là branch thử, nên chỉ chạy nhánh "0 PR".
- Luật `branch is main` của `wt-prune`: chưa có worktree nào checkout `main` để thử (không switch branch ở checkout chính).
- E2E trang `/` chỉ kiểm status + title, chưa kiểm console/hydration.
- Mở rộng (`claude -w`, pnpm store named volume, `wt-list.sh`, `--seed`): không làm.

Dọn cuối phiên: `next dev` của checkout chính (PID 50258 + cây cha pnpm 50251/50232/50225) và `dev:ws` của worktree A (PID 50827 + 50821/50802/50795) kill theo PID; `lsof -iTCP:3000-3010 -sTCP:LISTEN` rỗng; không còn schema `wt_%`; `.worktrees/` rỗng. `shellcheck` cài qua Homebrew vẫn giữ trên host.

## Commit
`git log --reverse --format='%h %ad %s' --date=format:%T main..HEAD` (trước commit docs):
```
f4c1797 23:45:24 docs(lessons): L04 isolation lesson and review backlog
f52ebb8 23:45:51 docs(plans): L04 worktree scripts plan (approved)
c25d065 23:48:07 feat(scripts): wt-new and wt-prune for isolated worktrees
fb79f38 23:49:47 docs(plans): L04 API integration test plan (approved)            [lesson/L04-api-test]
39d2a96 23:50:59 test(web): API integration tests on per-worktree Postgres schema [lesson/L04-api-test]
5145a7e 23:51:58 docs(plans): L04 e2e skeleton plan (approved)                    [lesson/L04-e2e]
5e1b542 23:53:39 test(web): Playwright e2e skeleton bound to worktree PORT        [lesson/L04-e2e]
18c0ba1 23:56:32 docs(plans): fill Thực tế for lesson_l04_api_test                [lesson/L04-api-test]
3654723 23:56:32 docs(plans): fill Thực tế for lesson_l04_e2e                     [lesson/L04-e2e]
7b58fb9 23:56:43 docs(plans): fill Thực tế for worktree scripts plan
a633ac1 23:56:43 Merge branch 'lesson/L04-api-test' into lesson/L04-isolation
1727808 23:56:52 Merge branch 'lesson/L04-e2e' into lesson/L04-isolation (conflict package.json: giữ cả 2 script)
```

## Sửa sau chấm
GRADE PASS, nêu 4 điểm an toàn của script (BACKLOG #7–#9). Sửa theo plan thứ 4 [`docs/plans/L04-wt-hardening.md`](../../../plans/L04-wt-hardening.md): approved, commit riêng `abb516c` (00:09:54) trước code `c35caf9` (00:11:49). Thực tế 3/3 = 100%, design round 2: không.

| Điểm | Sửa | Bằng chứng (smoke) |
|---|---|---|
| 1. `wt-new` không kiểm schema đã có | Trước khi tạo worktree: `psql` (URL của checkout chính, bỏ `schema=`, stderr nuốt) `select 1 from pg_namespace where nspname='<schema>'`; có → `REFUSED … already exists (orphan or slug collision) …; nothing changed`; `psql` lỗi → từ chối | Tạo `wt/harden`, `create schema wt_wt_harden`; `WT_DIR=<scratchpad>/wtalt wt-new.sh WT/Harden` (cùng slug, khác path/branch) → exit 1, không tạo thư mục, không tạo branch `WT/Harden`. Schema mồ côi `wt_wt_orphan` → `wt-new.sh wt/orphan` exit 1 |
| 2. `wt-prune` drop theo host bất kỳ | `db_host_of` (bỏ scheme, userinfo, `[…]` IPv6, port/path/query) cho cả 3 `.env`; chỉ `localhost`/`127.0.0.1`/`::1`; query có `host=`/`hostaddr=` → từ chối. Kiểm trước mọi hành động, kể cả `--dry-run` | Worktree bỏ đi `wt/fakehost`, sửa 3 `.env` sang `@db.example.invalid:5432` → `REFUSED: … host 'db.example.invalid' is not localhost/127.0.0.1/::1`, exit 1, không kết nối (từ chối trước `psql`). `?…&host=db.example.invalid` → `host '<query host=db.example.invalid>'` exit 1. `[::1]` và `127.0.0.1` → `--dry-run` qua kiểm, exit 0. Trả về `localhost` rồi prune thật → ok |
| 3. Drop trước `worktree remove` | Thứ tự mới: kiểm (thêm: worktree `locked` → từ chối) → `git worktree remove` (không `--force`; lỗi → `REFUSED … schema and branch kept`) → drop schema (lỗi → exit 1, in tên schema để drop tay, giữ branch) → branch | `git worktree lock` → `REFUSED … is locked`, exit 1, schema còn. Prune thường in `removed worktree` rồi mới `dropped schema`. Mô phỏng remove lỗi (`chmod 555 .worktrees`): `error: failed to delete …: Permission denied` → `REFUSED: git worktree remove failed; schema wt_wt_rmfail and branch kept`, exit 1, schema còn |
| 4. File tạm `.wt-tmp` trong cây | `mktemp "${TMPDIR:-/tmp}/wt-env.XXXXXX"` (mode 600), danh sách xoá trong `trap … EXIT`; ghi lại bằng `cp` + `rm` | Sau `wt-new`: `find .worktrees -name '*.wt-tmp'` → 0; số file `wt-env.*` trong `$TMPDIR` trước/sau bằng nhau |

Phát hiện khi verify điểm 3: `git worktree remove` lỗi giữa chừng đã xoá file và gỡ đăng ký worktree, chỉ còn thư mục rỗng (không xoá được vì cha read-only). Script vẫn giữ schema + branch đúng thiết kế; phần còn lại dọn tay (`rmdir`, `drop schema wt_wt_rmfail`, `git branch -D wt/rmfail`). Tức là "remove lỗi" không đảm bảo worktree còn nguyên, chỉ đảm bảo schema chưa bị drop.

Kiểm khác: `bash -n` 0, `shellcheck scripts/wt-*.sh` 0, grep AC-2 không dòng nào. Chuỗi qua `rtk proxy` ở checkout chính: `lint --force` 0 (0 errors, 37 warnings), `typecheck --force` 0 (4 task), `test` 0 (137 + 17), `build --force` 0, 31 s; `git diff main -- typing-adventure/packages/game-engine` rỗng. Cuối: `git worktree list` 1 dòng, `.worktrees/` rỗng, 0 schema `wt_%`, `public."User"` 12, 13 bảng, `lsof -iTCP:3000-3010 -sTCP:LISTEN` rỗng. BACKLOG #7–#9 chuyển `đã xong` (chỉ sửa cột trạng thái, được orchestrator cho phép).

Chưa verify runtime (sửa sau chấm): `wt-new --no-install` giờ cần Postgres để kiểm schema (không còn chạy được khi DB tắt); nhánh `psql` lỗi khi drop sau khi đã remove chỉ kiểm bằng đọc code.

Commit sửa sau chấm:
```
abb516c 00:09:54 docs(plans): L04 wt-hardening plan (approved)
c35caf9 00:11:49 fix(scripts): harden wt-new/wt-prune after L04 review
```
