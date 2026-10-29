# Plan: Sửa theo review PR #7 (squash-merge OID, psql không lộ URI)

Trạng thái: approved
Lesson/PR: L04 · PR #7 review (request changes)

## Mục tiêu
- BLOCKING: `wt-prune.sh` chỉ `git branch -D` khi tip của branch **bằng đúng** `headRefOid` của 1 PR đã merge vào `--into`; khớp tên mà khác OID (có commit sau khi squash merge) → giữ branch, in lý do.
- `psql` (cả `wt-new` lẫn `wt-prune`) không nhận URI có password trên argv: password qua `PGPASSWORD` (env), host/port/user/db qua `-h -p -U -d`; chạy với `env -u PGHOSTADDR -u PGSERVICE -u PGSERVICEFILE -u PGOPTIONS`, `psql -X`.
- Guard integration từ chối URL có nhiều hơn 1 tham số `schema=`.
- `wt-new` tạo file `.env` của worktree với mode 0600 ngay từ đầu (`install -m 600`), không qua bước `cp` rồi `chmod`.

## Ngoài phạm vi
- Thư viện shell dùng chung cho 2 script (cần `source` + chỉ thị shellcheck dạng comment): giữ 2 bản hàm giống nhau.
- `umask 077` cho cả script: sẽ làm mọi file checkout của worktree thành 0600; chỉ áp cho file env.

## File thay đổi (dự đoán)
- `docs/plans/L04-review-fixes.md` (thêm)
- `scripts/wt-prune.sh` (sửa)
- `scripts/wt-new.sh` (sửa)
- `typing-adventure/apps/web/src/test/integration-global-setup.ts` (sửa)

## Interface chạm tới
- `wt-prune.sh`: `gh pr list --head <branch> --base <into, bỏ tiền tố origin/> --state merged --json headRefOid --jq '.[].headRefOid'`; so với `git rev-parse refs/heads/<branch>`. Hook kiểm thử: biến `WT_PRUNE_TEST_MERGED_OIDS` (nếu được đặt, kể cả rỗng) thay cho kết quả `gh`, vẫn phải khớp OID chính xác mới xoá.
- Hàm `pg_fields` (awk: user, password, host, port, dbname, `sslmode`, `connect_timeout` từ `DATABASE_URL`), `urldecode` (`%XX`), `pg_exec <env-file> <sql>` trong cả 2 script. `sslmode`/`connect_timeout` → `PGSSLMODE`/`PGCONNECT_TIMEOUT`; tham số Prisma bị bỏ.
- Guard: đếm `[?&]schema=` = 1 và khớp `wt_[a-z0-9_]{1,60}`, ngược lại throw.
- Env / dependency mới: không (biến kiểm thử `WT_PRUNE_TEST_MERGED_OIDS` chỉ dùng khi test).

## Verify
```bash
bash -n scripts/wt-*.sh && shellcheck scripts/wt-*.sh
# OID: worktree wt/squash, commit X; WT_PRUNE_TEST_MERGED_OIDS=X --dry-run → force-delete; thêm commit Y → keep (tip khác merged head)
# argv: PATH có stub psql ghi "$@" → grep -cF <password> = 0, PGPASSWORD có đặt
# smoke thật: wt-new (kiểm schema) → db schema tạo tay → prune drop thật
DATABASE_URL='…?schema=wt_a&schema=public' pnpm --filter @typing-adventure/web test:integration   # refused
rtk proxy pnpm lint/typecheck/test/build
```

## Tự review
1. Đoán được diff chưa? Có, 4 file.
2. Interface nào người khác đang dùng? CLI 2 script (không đổi cú pháp); guard chỉ chặt hơn.
3. Rollback? Revert commit fix.

## Lịch sử
- v1 2026-10-30 00:20: bản đầu, approved.

## Thực tế
