# L05 · Enforcement — Chấm điểm

Ngày chấm: 2026-10-30 · Branch: `lesson/L05-enforcement` @ `721b95d` (`main` = `e193261`) · PR: [#8](https://github.com/st-datdo/typing-adventure/pull/8) (draft, chưa có label)
Nguồn: [LESSON.md](LESSON.md), [REPORT.md](../../learner/L05-enforcement/REPORT.md), `git log main..HEAD` (11 commit), `git diff main...HEAD` (32 file).

Phạm vi chạy lại: người chấm tự chạy 3 bộ test (hooks, guard-diff, pg lib), `bash -n` và `shellcheck` cho 10 script, gitleaks toàn lịch sử, `lefthook run pre-commit` và `pre-push`, đọc ruleset qua API, xem `gh pr checks 8` cùng log job `guard`, rồi chạy cả chuỗi install/lint/typecheck/test/build bằng `rtk proxy` ở checkout chính. Người chấm cũng thử thêm 15 lệnh Bash **ngoài** bộ test của learner. Người chấm không đọc `.env`, không ghi vào DB, không switch branch, không gắn label.

| AC | Đạt/Chưa | Bằng chứng |
|---|---|---|
| AC-1 | Đạt | 4 plan `Trạng thái: approved`, cùng commit `bafa8d0` lúc 00:32:46, trước commit code đầu tiên `961284d` (00:35:22). Lịch sử ghi `v1 2026-10-30 00:32`, không muộn hơn giờ commit. Bản v2 của git-hooks-ci ghi `00:49` và được commit trong `9e49fb6` (00:49:25), trước `71bceaa`. Mỗi plan có đúng 1 mục `## Thực tế`. `_template.md:31-32` có `date '+%F %H:%M'`. `mistakes.md`: dòng lặp lần 2 đã chuyển sang "Đã thành rule" |
| AC-2 | Đạt (activation `chưa verify runtime — cần user bật`) | `bash -n` + `shellcheck` cả 4 hook → sạch. `test-hooks.sh` → `cases: 36, passed: 36, failed: 0, allow-cases passed: 12, leaks: 0`, exit 0. `settings.hooks.json` qua `jq empty`, có 3 matcher (`PreToolUse Bash`, `PreToolUse Read`, `PostToolUse Edit\|Write\|MultiEdit`). `git diff --quiet main -- .claude/settings.json .claude/settings.local.json` → 0. Thử thêm ngoài bộ test: `rm -Rf`, `command rm -rf`, `bash -c "rm -rf x"`, `/bin/rm -rf`, `sudo rm -rf`, `xargs rm -rf`, `git push origin +main`, `git -C . push --force` và `DATABASE_URL=…@db.example.com… prisma migrate deploy` đều bị chặn (exit 2), output không chứa host hay password. **Lọt:** `\rm -rf x` (exit 0), xem nhận xét |
| AC-3 | Đạt | Có `lefthook.yml` ở gốc; `.git/hooks/pre-commit` và `pre-push` có mặt. Người chấm chạy `lefthook run pre-commit --force --file apps/web/src/lib/rate-limit.ts` → **1.23 s** (gitleaks 0.03, prettier 0.42, eslint 1.16); `lefthook run pre-push --force` → **1.22 s** (turbo ấm). Learner đo 3.25 s / 1.37 s. `gitleaks git` 8.30.1 toàn lịch sử → `no leaks found`. Allowlist `.gitleaks.toml` hẹp: `AND` giữa 2 path và regex `^ach[A-Za-z0-9]+Desc$`. `wc -l CLAUDE.md` → 63 |
| AC-4 | Đạt | `ci.yml` có 3 job, `permissions: contents: read`, `concurrency`, trigger có `labeled`/`unlabeled`. `test-guard-diff.sh` → 15/15, exit 0. `gh pr checks 8` (run 40926611316, head `721b95d`): `checks` pass 1m56s, `gitleaks` pass 6s, `guard` **fail** với log `protected config changed without label config-change-approved` (`scripts/ci/guard-diff.sh`, `test-guard-diff.sh`), `review` skipping. Lần này `guard` dùng script **của base**, mà `main` chưa có script nên lấy bản trong PR. Label tồn tại; `pr-reviewer.md` có dòng không tự gắn label / trả `BLOCKED` |
| AC-5 | Đạt | `gh api …/rules/branches/main` trả về: `deletion`, `non_fast_forward`, `pull_request` (`required_approving_review_count: 0`), `required_status_checks` = `checks`, `gitleaks`, `guard` (integration 15368, không có `review`). JSON nằm ở `.github/rulesets/main.json`. `mergeStateStatus: BLOCKED` khi `guard` đỏ, đúng ý. REPORT ghi bảng lệnh outward-facing kèm giờ |
| AC-6 | Đạt | REPORT có bảng 6 vi phạm, đủ cột lớp/lệnh/exit. (1)(2) bị chặn ở agent hook; (3) ở pre-push; (4) ở pre-commit (gitleaks); (5)(6) ở `guard-diff.sh`, và (5) còn bị eslint `ban-ts-comment` chặn sớm hơn. `git worktree list` → 1 dòng, `git status` sạch. Người chấm không có chuỗi token giả nên không tự chạy lại `grep -cF`; tin log của learner (= 0) vì token chỉ nằm trong scratchpad và chưa có trong commit nào |
| AC-7 | Đạt | `scripts/lib/pg.sh` có `urldecode`/`pg_fields`/`pg_exec`. `grep -nE '^(urldecode\|pg_exec\|pg_fields)\(\)' scripts/wt-*.sh` → rỗng. `grep -rn WT_PRUNE_TEST scripts/` → rỗng. `test-pg.sh` → 9/9, exit 0 (argv của stub `psql` và của process cha không có password; `\n`/`%5C` decode đúng). `pg_exec` export `PGPASSWORD` trong subshell rồi `exec psql`. Learner có smoke tạo + prune worktree; người chấm không chạy lại vì tránh ghi DB |
| AC-8 | **Chưa** | Phần config đạt: `.mcp.json` không còn `server-postgres@0.6.2`, pin `@toolbox-sdk/server@1.15.0`, user mặc định `mcp_ro`, runtime MCP `chưa verify` (auto-mode chặn `npx`, chấp nhận được). **Phần chặn ghi không đạt.** Thí nghiệm của chính learner cho thấy `mcp_ro` tạo được bảng trong `public`: Postgres 14 trên host vẫn cho `PUBLIC` quyền `CREATE`, còn `default_transaction_read_only` thì phiên tự `SET … = off` được. Toolbox không có chế độ read-only và tool `execute_sql` của nó chạy SQL tuỳ ý, nên với server mới, role là **lớp chặn duy nhất**, và lớp này đang thủng với DDL |
| AC-9 | Đạt | Checkout chính, qua `rtk proxy`: `install --frozen-lockfile` 0; `lint --force` 0 (`0 errors, 37 warnings`, bằng baseline); `typecheck --force` `4 successful`; `test` 137 + 17 pass; `build --force` `Compiled successfully` (cảnh báo `global-error.tsx`/opentelemetry có từ trước). `git diff --quiet main -- typing-adventure/packages/game-engine/src` → 0; branch không đổi file nào trong `typing-adventure/` |

**FEATURE_MAP:** mọi file trong `git diff --name-only main...HEAD` đều có trong section L05. `metrics.md` có 9 dòng L5.

## Nhận xét
- **Sự cố `public.mcp_probe`.** Learner đã tạo 1 bảng rỗng trong `public` (owner `mcp_ro`), vi phạm luật "chỉ ghi DB trong `wt_*`". Learner tự khai trong REPORT và `mistakes.md`, và không cố lách lệnh `DROP` khi bị chặn: đó là cách xử lý đúng. Bảng không chứa dữ liệu nên không có thiệt hại, user sẽ tự drop. Bài học rút ra: muốn kiểm "ghi bị chặn" thì làm trên một Postgres dùng xong bỏ (`docker run --rm`), hoặc bọc trong `BEGIN … ROLLBACK` trên DB nháp, không làm trên DB dev dùng chung.
- **Vì sao bản sửa thuộc lesson này:** BACKLOG #5 giao cho L05 việc "kiểm lại 2 lớp chặn ghi". Việc kiểm đã tìm ra 1 lớp hỏng. Server mới bỏ mất lớp read-only của server cũ, nên nếu merge như hiện tại thì một agent dùng MCP có thể chạy DDL trên `public`. Bản sửa nhỏ: 1 dòng SQL cộng 1 lần verify trên container dùng xong bỏ. Devcontainer dùng `postgres:16-alpine`, bản này mặc định đã không cho `PUBLIC` `CREATE`, nên lỗ hổng chỉ có trên Postgres ≤ 14 của host. Dù vậy, script init vẫn phải tự đảm bảo điều đó, không dựa vào phiên bản.
- Làm tốt: `guard` chạy script lấy từ base, nên PR không tự nới luật của chính nó được. Nếu PR xoá hẳn job `guard` thì check bắt buộc không bao giờ báo, PR treo, và ruleset bịt nốt lỗ đó. Check marker chỉ xét dòng thêm trong file code. Hook fail closed và có test chống lộ secret (`leaks: 0`). gitleaks trong CI có kiểm sha256. Pre-commit nhanh hơn mục tiêu 30 s khoảng 10 lần.
- Không chặn PASS, đã thêm vào [BACKLOG](../BACKLOG.md) #14–#17:
  1. `guard-bash.sh` để lọt `\rm -rf` (dấu `\` đặt trước tên lệnh để bỏ qua alias). Các dạng `"rm" -rf`, `r''m -rf` cũng nên có ca test.
  2. Danh sách config được bảo vệ chưa có `.claude/settings.json`, nơi hook sẽ được bật, nên một PR có thể tắt hook mà không cần label. Danh sách cũng chưa có các workflow khác trong `.github/workflows/` và chưa có thay đổi script `lint`/`typecheck` trong `package.json`.
  3. Ruleset: GitHub tự bật `require_extra_approval_for_unattributed_changes: true`. Cần kiểm lúc reviewer merge PR #8 xem nó có chặn auto-merge không. `allowed_merge_methods` đang cho cả 3 kiểu, trong khi repo chỉ squash.
  4. Devcontainer chưa có lefthook và gitleaks (learner cài bằng brew trên host), nên commit trong container sẽ fail ở bước gitleaks.
- Comment cơ học của reviewer trên PR L05 chưa đo được vì PR còn draft. Đo khi review.

## Kết luận lần 1: FAIL (cần sửa 1 điểm, phần còn lại đạt). Xem "Chấm lại sau sửa" bên dưới: PASS
Việc phải làm:
1. **Plan trước:** thêm v2 vào `docs/plans/L05-mcp-postgres.md` (giờ lấy từ `date '+%F %H:%M'`), commit trước khi sửa SQL.
2. `.devcontainer/init-db/01-mcp-readonly.sql`: thêm `REVOKE CREATE ON SCHEMA public FROM PUBLIC;`. Lệnh này idempotent và không có tác dụng trên Postgres 15+. Không cấp lại `CREATE` cho `mcp_ro`.
3. **Verify trên container dùng xong bỏ, không đụng DB host:** `docker run --rm -e POSTGRES_DB=typing_adventure … postgres:14-alpine`, nạp script, tạo 1 bảng mẫu, rồi đăng nhập `mcp_ro` và chạy `SET default_transaction_read_only = off; CREATE TABLE public.x(i int);` → phải ra `permission denied for schema public`. `SELECT` trên bảng mẫu vẫn chạy được. Lặp lại trên `postgres:16-alpine` để chứng minh script chạy được trên cả hai phiên bản. Dừng container bằng ID cụ thể.
4. Cập nhật REPORT (AC-8 + log rút gọn), `## Thực tế` của plan, FEATURE_MAP, `metrics.md` nếu cần. Ghi vào mục "Cần user làm": trên DB host, user chạy lại `psql -f .devcontainer/init-db/01-mcp-readonly.sql` bằng user `dev`, và `drop table public.mcp_probe;`.
5. Push; CI phải vẫn `checks`/`gitleaks` xanh. Sau đó người chấm chấm lại AC-8.

Không bắt buộc nhưng nên làm cùng lượt nếu còn thời gian: BACKLOG #14 (`\rm`).

## Chấm lại sau sửa (2026-10-30, head `6423e2e`)
Commit sửa: `7f0c1f5` (01:05:44, plan v2 cho `L05-mcp-postgres.md` và `L05-agent-hooks.md`) → `32753b3` (01:06:57, SQL) → `f9d1652` (01:06:58, hook) → `6423e2e` (docs). Plan v2 ghi `01:05`, commit trước code. Mỗi plan có thêm đoạn Thực tế cho v2.

| AC | Đạt/Chưa | Bằng chứng (người chấm tự chạy) |
|---|---|---|
| AC-8 | Đạt | `.devcontainer/init-db/01-mcp-readonly.sql:9` có `REVOKE CREATE ON SCHEMA public FROM PUBLIC;`. Người chấm dựng 3 container dùng xong bỏ (`docker run --rm -d`, chỉ dùng `docker exec`, dừng bằng ID, **không** đụng DB host). Mỗi container: tạo bảng `sample` 2 dòng, nạp script, rồi đăng nhập `mcp_ro` qua TCP. **Đối chứng** `postgres:14-alpine` (14.24) với script cũ `721b95d`: `SET default_transaction_read_only = off; CREATE TABLE public.x` → **thành công** (tái hiện đúng lỗi). `postgres:14-alpine` với script mới → `ERROR: permission denied for schema public`. `postgres:16-alpine` (16.10) với script mới → cùng lỗi đó, nạp script exit 0. Cả 3 container: `select count(*) from sample` → `2`; `INSERT` → `permission denied for table sample`. Sau khi dừng, `docker ps -q` → 0 |
| AC-2 (BACKLOG #14) | Đạt | `guard-bash.sh` bỏ `\` khỏi từng token trước khi so. `test-hooks.sh` → `cases: 41, passed: 41, failed: 0, allow-cases passed: 12, leaks: 0`, exit 0; `shellcheck` sạch. Người chấm thử thêm ngoài bộ test: `\rm -rf`, `"rm" -rf`, `r''m -rf`, `r\m -rf`, `env rm -rf`, `nice rm -rf`, `git push origin \+main` → exit 2. Các lệnh vẫn phải cho qua: `git push origin lesson/x`, `rm notes.txt`, `printf 'a\\nb'` → exit 0 |
| CI | Như lần đầu | `gh pr checks 8` (run 40927906598, head `6423e2e`): `checks` pass 1m13s, `gitleaks` pass 6s, `guard` fail chỉ vì thiếu label `config-change-approved` (đúng thiết kế), `review` skipping. `mergeStateStatus: BLOCKED`, draft, chưa có label |

Các AC khác không đổi so với lần chấm đầu: diff sửa chỉ chạm `guard-bash.sh` (+1 dòng), `test-hooks.sh` (+5 ca), file SQL (+1 dòng) và docs.

### Kết luận sau chấm lại: PASS
Learner phải làm trước khi đánh dấu PR ready: commit `GRADE.md`, `README.md`, `BACKLOG.md` (#5 và #14 → đã xong).
User phải làm:
1. Gắn label `config-change-approved` cho PR #8, để `guard` xanh.
2. Trên DB host: `drop table public.mcp_probe;` và chạy lại `psql -f .devcontainer/init-db/01-mcp-readonly.sql` bằng user `dev`.
3. Gộp `.claude/hooks/settings.hooks.json` vào `.claude/settings.json`, approve server `postgres-ro`.

Reviewer phải làm khi merge: kiểm BACKLOG #16 (`require_extra_approval_for_unattributed_changes`), và đo số comment cơ học (metric L5).
