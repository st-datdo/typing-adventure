# L07 · Parallel — Chấm điểm

Ngày chấm: 2026-10-30 · Branch: `lesson/L07-parallel` @ `5aee1f6`, đã rebase lên `origin/main` = `5590f0f` (gồm #10 `4df98c8`, #11 `5590f0f`) · PR lesson: chưa mở
Nguồn: [LESSON.md](LESSON.md), [REPORT.md](../../learner/L07-parallel/REPORT.md) (untracked), `task-A.md`, `task-B.md`, `rtk proxy git diff origin/main...HEAD` (14 file), `gh pr diff 10` (6 file), `gh pr diff 11` (5 file), plan `docs/plans/L07-parallel-tooling.md` (mục Thực tế sửa chưa commit).

Phạm vi chạy lại (qua `rtk proxy` khi output là dữ liệu): 2 bộ self-test, `lead-time.sh` trên #9/#10/#11, `shellcheck`, `jq`, `check-tdd-commits.sh` và `guard-diff.sh` trên dải commit gốc của #10, #11 (object còn local), check-run của 2 commit `test:`, `comm -12`, kiểm scope offline AC-2 tái hiện ở checkout chính bằng `CLAUDE_SCOPE_FILE`, `pnpm test/typecheck/lint/build`, `pnpm mutation`. Thêm ~70 ca phá hook trong repo tạm `mktemp -d`. Người chấm không in `.env`, không ghi DB, không gắn label.

| AC | Đạt/Chưa | Bằng chứng |
|---|---|---|
| AC-1 | Đạt | Plan `approved`, commit `5d98eb1` author 20:23:08, trước commit code đầu `2e2da9f`. REPORT có bảng đủ cột (task, branch, worktree, cách tạo `wt-new`, setup 21.08/8.65 s, PR, 6 mốc giờ). `gh pr view`: #10 `createdAt` 13:26:26Z, spec `d445572` 13:26:03Z (+23 s); #11 13:26:58Z, spec `556d2e6` 13:26:32Z (+26 s). Timeline có `ready_for_review` nên PR được mở ở dạng draft. WIP 3 |
| AC-2 | Đạt | `test-hooks.sh` exit 0, `cases: 93, passed: 93, leaks: 0` (23 ca guard-scope phủ đủ 8 ca bắt buộc). Tái hiện offline ở checkout chính: `CLAUDE_SCOPE_FILE=specs/RG/spec.md` trên 6 file của `gh pr diff 10 --name-only` → không có `OUT:`; `specs/WM/spec.md` trên 5 file của #11 → không có `OUT:`. Ca âm: RG + `packages/db/prisma/schema.prisma` → rc=2, kèm thông báo nêu scope và cách sửa; RG + `moderation.ts`, RG + `.claude/hooks/guard-bash.sh`, WM + `wordpacks/route.ts`, WM + `rate-limit.ts` → đều rc=2. Plan lesson làm scope trên diff lesson → rỗng |
| AC-3 | Đạt (banner: `chưa verify runtime`, chấp nhận theo LESSON) | 12 ca stub osascript xanh. `PATH=/usr/bin:/bin … notify.sh` → rc=0, stdout rỗng. Người chấm thử thêm: payload `x" & (do shell script "touch /tmp/pwn_l07") & "` qua stub là 1 argv sau `--`, không nằm trong `-e`; chạy với `osascript` thật → rc=0, `/tmp/pwn_l07` không được tạo. Message `-e\nline2\ttab` → 1 argv `-e line2 tab`. JSON hỏng, log ở `/dev/full/x`, cwd không tồn tại → rc=0, stdout rỗng |
| AC-4 | Đạt | `jq .` hợp lệ; có `guard-scope.sh` (PreToolUse `Edit\|Write\|MultiEdit`), `Notification`, `Stop`. `git diff origin/main -- .claude/settings.json .claude/settings.local.json` → 0 byte. `shellcheck 0.11.0` trên `.claude/hooks/*.sh scripts/metrics/*.sh` → exit 0, không cảnh báo |
| AC-5 | Đạt | `specs/RG/spec.md` `approved`, 5 ID, có Ngoài phạm vi, Hành vi không đổi, Lịch sử v1/v2, ghi rõ lý do bỏ bucket `unknown`. Thứ tự `d445572` spec → `8f55285` test → `f3600ca` feat. Check-run tại `8f55285`: `checks failure` (đỏ dự kiến khi còn draft). REPORT dán dòng đỏ cho RG-01..05. `grep -rn getClientIp apps/web/src` → chỉ 2 dòng trong test RG-05, spec v2 ghi lý do. `check-tdd-commits.sh 432c693 04c23c6` → OK (4 commit). `it('RG-` 11 ca, 5/5 ID có test. Web 49/49 |
| AC-6 | Đạt | `specs/WM/spec.md` `approved`, 6 ID, đủ mục, v2 ghi lý do sửa WM-04 trước commit `test:`. `specs/WP/spec.md:38` có dòng Lịch sử trỏ sang WM. 11 ca GRADE L06 nằm trong WM-06 (2 test). `git diff 432c693 origin/main -- …/moderation.test.ts \| wc -l` → 0. `grep -c '^import' moderation.ts` → 0. Engine 193/193. `pnpm mutation` chạy lại: `78.02 ≥ 75`, `moderation.ts` 97.12% (3 survived, khớp 3 mutant tương đương REPORT nêu ở dòng 32, 37, 46). Check-run tại `c88d94e`: `checks failure`. `check-tdd-commits.sh 432c693 cc7ce10` → OK (5 commit) |
| AC-7 | Đạt | `comm -12` diff `432c693...04c23c6` và `432c693...cc7ce10` → rỗng. `guard-diff.sh` không label → `OK` cho cả 2 dải. `gh pr checks 10`, `11`: `checks`, `gitleaks`, `guard`, `review` pass. Cả 2 không có label. Merge `13:36:44Z` và `13:37:18Z`, không có `update-branch`, 0 xung đột |
| AC-8 | Đạt | `test-lead-time.sh` → `cases: 8, passed: 8`, exit 0. `lead-time.sh 9 specs/RL/spec.md` → `lead=54m03s wait=16m22s`; WP → `lead=51m47s`. #10 → `lead=10m41s wait=4m40s`; #11 → `lead=10m46s wait=2m08s`. PR không tồn tại (#12) và spec không có trong PR → exit 1 kèm thông báo. `metrics.md` có 13 dòng L7 đủ các mục LESSON yêu cầu (trung vị 10m43.5s so với 52m55s, CFR 0/2, setup, WIP, xung đột, giờ đợt review) |
| AC-9 | Đạt (phần `public`: dựa theo REPORT) | Ở `5aee1f6`: `pnpm lint` → `0 errors, 37 warnings`; `pnpm typecheck` → `4 successful`; `pnpm test` → engine 193, web 49; `pnpm build` → exit 0. `git worktree list` → 1 dòng (checkout chính), không còn branch `l07/*` local. `public`: lúc chấm Postgres không chạy (`docker ps` rỗng), người chấm không tự đếm được. Diff 3 PR không có migration hay seed. Chấp nhận số REPORT ghi (14 bảng, `User` 12, 2 migration) |

## Nhận xét
- Bài làm tốt. Lead time trung vị 10m43.5s (mục tiêu ≤ 37m), CFR 0/2, 0 xung đột. Chọn 2 task ở 2 module tách hẳn nhau là quyết định đúng, `comm -12` rỗng chứng minh điều đó.
- Số liệu trong REPORT khớp số người chấm đo lại (lead/wait, số ca test, mutation, mốc draft). Cách ghi đúng: tách giờ máy (+07) và giờ GitHub (Z), lấy hash gốc qua `pulls/N/commits`.
- Spec WM v2 được sửa **trước** commit `test:`, có ghi lý do. Đây là cách xử lý đúng khi viết test mới phát hiện spec sai (U+0489 có Script=Cyrillic).
- Plan v2 nằm cùng commit `feat(hooks): notify` (`6c0f66d`), không phải commit riêng trước code. Lịch sử ghi 20:33, commit lúc 20:34:13, nên vẫn đúng ý "ghi Lịch sử trước khi đổi code". 5 commit hook có cùng author date 20:34:13 vì được tạo cùng lúc, nên REPORT không đo được giờ từng EX-2..EX-5.
- Lỗi của người dạy: lệnh mẫu ở AC-2 thiếu `rtk proxy`, làm learner gặp `OUT: --- Changes ---` giả (mistakes.md, lần 4). Từ L08, lệnh git dùng làm dữ liệu trong LESSON sẽ viết sẵn `rtk proxy`.

## Thử phá hook (không chặn PASS)
Thử trong repo tạm. Scope hook và guard-bash là rào chắn, không phải biên bảo mật (LESSON đã nói), nên các lỗ dưới đây đi vào BACKLOG.

| Hook | Ca | Kết quả |
|---|---|---|
| guard-scope | `specs/../db/x`, `<root>/../repo/db/x`, `app/src/../../db/x`, path tương đối `../db/x` từ cwd con, `//` và `./`, sửa `.wt-scope` | chặn/cho đúng |
| guard-scope | symlink ngoài repo trỏ vào thư mục trong repo, rồi ghi thẳng `link/schema.prisma` | chặn (rc=2) |
| guard-scope | **symlink + `..`**: `/tmp/out/s3 → <repo>/app/src`, ghi `/tmp/out/s3/../../db/schema.prisma`. Kernel trỏ vào `<repo>/db/schema.prisma` | **lọt** (rc=0): `norm_path` gộp `..` theo chữ trước khi giải symlink |
| guard-scope | **file symlink**: `app/src/a.ts` (có trong scope) là symlink tới `db/schema.prisma` | **lọt**: không giải symlink ở thành phần cuối |
| guard-scope | **chữ hoa**: viết hoa toàn bộ path (APFS không phân biệt hoa thường) | **lọt**: `pwd -P` giữ chữ hoa như đã gõ, nên path bị coi là ngoài repo. Viết hoa chỉ phần sau root → chặn (fail closed) |
| notify | AppleScript injection, `"`/`\`, message bắt đầu bằng `-`, xuống dòng/tab, JSON hỏng, log không ghi được | an toàn, rc=0, stdout rỗng |
| guard-bash | `bash -c` 1 và 2 cấp lồng, `sh -lc`, `-ec`, `-x -c`, `--norc -c`, `-c --`, `env`/`sudo`/`exec` + `sh -c`, `r''m`, `\rm`, `x=1 eval`, `command eval`, `find -delete`, `-exec(dir) [/bin/]rm`, `cat/head/less/bat .env*`, `< .env`, `cat "…/.env"` | chặn đúng; `cat .env.example`, `find -name`, `echo eval`, `git commit -m "eval"`, `sh -c 'pnpm test'` cho qua |
| guard-bash | **`cat .env*`**, `cat .en?`, `cat $(echo .env)` | **lọt**: so tên theo chữ, glob/command substitution chưa được bung. `cat .env*` là cách gõ tự nhiên nhất của đúng mẫu #20 |
| guard-bash | `bash -c $'rm -rf x'` (ANSI-C quote), `find . -exec sh -c "rm \$1" _ {} \;` | **lọt** |
| guard-bash | `grep . .env`, `sed -n p .env`, `tac .env`, `cp .env /tmp/e && cat /tmp/e`, `xargs rm`, `python3 -c 'shutil.rmtree'` | lọt (ngoài danh sách LESSON yêu cầu) |

## Kết luận: **PASS**
Mọi AC bắt buộc đạt. Banner macOS và việc hook chạy trong phiên A, B ghi `chưa verify runtime` đúng như LESSON cho phép. Phần `public` của AC-9 dựa theo REPORT vì lúc chấm DB đã tắt.

Không có việc bắt buộc phải sửa. Trước khi mở PR lesson:
1. Commit `REPORT.md`, `GRADE.md` và mục Thực tế của plan. Thêm dòng `GRADE.md` vào section L07 của `FEATURE_MAP.md`.
2. PR lesson chạm `.claude/hooks/*`, nên CI `guard` sẽ đỏ tới khi **user** gắn `config-change-approved`. Agent không gắn label.

Điểm không chặn đã ghi vào [BACKLOG.md](BACKLOG.md): #20 xong, #21 xong, #23 xong, #24 xong một phần. Mục mới: #27 (lỗ guard-bash còn lại), #28 (lỗ guard-scope: symlink, chữ hoa), #29 (homoglyph còn lại sau WM), #30 (bảo vệ `scripts/metrics/` và chạy `test-lead-time.sh` trong CI).
