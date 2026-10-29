# Plan: Nợ script từ PR #7 (`scripts/lib/pg.sh`)

Trạng thái: approved
Lesson/PR: L05 · EX-6 (BACKLOG #10–#13)

## Mục tiêu
- `urldecode` / `pg_fields` / `pg_exec` chỉ còn 1 bản trong `scripts/lib/pg.sh`, `wt-new.sh` và `wt-prune.sh` `source` nó.
- Password không xuất hiện trong argv của process nào: `pg_exec` chạy `psql` trong subshell có `export PGPASSWORD` (giá trị lấy bằng hàm shell, không qua `env`).
- `urldecode` giữ nguyên `\` có sẵn (nhân đôi `\` trước khi đổi `%` → `\x`), `%5C` → `\`.
- Bỏ `WT_PRUNE_TEST_MERGED_OIDS`; nhánh squash-merge test bằng stub `gh` trên `PATH`.

## Ngoài phạm vi
- `db_host_of`, `schema_of` (chỉ `wt-prune` dùng) giữ trong `wt-prune.sh`. Hook `guard-bash.sh` có parser host riêng (tự chứa, không phụ thuộc `scripts/`).
- Password kết thúc bằng `%0A` (newline cuối bị `$(…)` cắt): giới hạn đã biết, ghi REPORT.

## File thay đổi (dự đoán)
- `scripts/lib/pg.sh` (thêm)
- `scripts/lib/test-pg.sh` (thêm: stub `psql` in argv, kiểm byte `od -c`)
- `scripts/wt-new.sh` (sửa)
- `scripts/wt-prune.sh` (sửa)
- `.shellcheckrc` (thêm: `source-path=SCRIPTDIR`, `external-sources=true`, để `shellcheck` theo được `source` mà không cần comment chỉ thị trong code)

## Interface chạm tới
- `scripts/lib/pg.sh`: `urldecode <s>`, `pg_fields <env-file>` (7 dòng: user, pw, host, port, db, sslmode, connect_timeout), `pg_exec <env-file> <sql>` (exit ≠ 0 khi thiếu host/db hoặc psql lỗi). Không `set -e` / không chạy gì khi `source`.
- 2 script: `. "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/pg.sh"`. CLI không đổi.
- `wt-prune.sh`: `gh` lỗi/không có → như cũ ("gh unavailable"); không còn biến test.
- Env / dependency mới: không.

## Verify
```bash
bash -n scripts/lib/pg.sh scripts/wt-*.sh && shellcheck scripts/lib/*.sh scripts/wt-*.sh
grep -nE '^(urldecode|pg_exec|pg_fields)\(\)' scripts/wt-*.sh   # rỗng
grep -rn WT_PRUNE_TEST scripts/                                   # rỗng
bash scripts/lib/test-pg.sh   # stub psql: argv không chứa password; PGPASSWORD đúng byte (\n giữ 2 ký tự, %5C → \) so od -c
scripts/wt-new.sh wt/l05-smoke --no-install ; commit 1 file ; PATH=<stub gh trả headRefOid = tip>:$PATH scripts/wt-prune.sh wt/l05-smoke  # exit 0, force-delete
psql … "select count(*) from pg_namespace where nspname like 'wt\_%'"   # 0
```

## Tự review
1. Đoán được diff chưa? Có, 5 file. Mơ hồ: smoke `--no-install` không tạo schema → tạo `wt_wt_l05_smoke` bằng `pg_exec` trước khi prune để thấy drop thật.
2. Interface nào người khác đang dùng? CLI 2 script (`CLAUDE.md` dòng 23) không đổi.
3. Rollback? Revert commit.

## Lịch sử
- v1 2026-10-30 00:32: bản đầu, approved.

## Thực tế
