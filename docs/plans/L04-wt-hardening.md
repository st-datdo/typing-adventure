# Plan: Hardening wt-new / wt-prune sau chấm L04

Trạng thái: approved
Lesson/PR: L04 · sửa sau chấm (GRADE L04 nhận xét 1–4, BACKLOG #7–#9)

## Mục tiêu
- `wt-new.sh` từ chối khi schema `wt_<slug>` đã tồn tại trong DB (mồ côi hoặc trùng slug), trước khi tạo worktree.
- `wt-prune.sh` chỉ drop schema khi host DB là `localhost`/`127.0.0.1`/`::1`; host khác (kể cả tham số `host=`/`hostaddr=` trong query) → từ chối trước khi đụng gì, không kết nối.
- `wt-prune.sh` chạy `git worktree remove` (không `--force`) **trước** `DROP SCHEMA`; worktree `locked` → từ chối ngay ở bước kiểm; remove lỗi → schema còn nguyên.
- `wt-new.sh` ghi file tạm bằng `mktemp` ngoài worktree + `trap` xoá khi thoát; không còn `<file>.wt-tmp` trong cây.

## Ngoài phạm vi
- Cờ `--reuse-schema` (BACKLOG #7 gợi ý): chưa cần; muốn dùng lại thì drop tay hoặc prune worktree cũ.
- Hook L05 chặn `prisma` vào DB lạ; pnpm store devcontainer (#6).

## File thay đổi (dự đoán)
- `docs/plans/L04-wt-hardening.md` (thêm)
- `scripts/wt-new.sh` (sửa)
- `scripts/wt-prune.sh` (sửa)

## Interface chạm tới
- `wt-new.sh`: thêm lỗi exit 1 `schema <s> already exists …; nothing changed` và `cannot check schema … (psql failed)`; kiểm bằng `psql` với URL từ `packages/db/.env` của checkout chính đã bỏ `schema=`/tham số Prisma, `select 1 from pg_namespace where nspname = '<schema>'` (schema đã qua whitelist). Không in URL, `psql` 2>/dev/null.
- `wt-new.sh`: `set_db_schema`/`set_var` dùng `mktemp "${TMPDIR:-/tmp}/wt-env.XXXXXX"`, danh sách file tạm xoá trong `trap … EXIT`.
- `wt-prune.sh`: hàm `db_host_of` (bỏ `scheme://`, userinfo tới `@` cuối, IPv6 `[…]`, cắt ở `:`/`/`/`?`); từ chối nếu host ∉ {`localhost`,`127.0.0.1`,`::1`} hoặc query có `host=`/`hostaddr=`; áp cho cả 3 file `.env`. Từ chối nếu `git worktree list --porcelain` có `locked` cho worktree đó. Thứ tự thực thi: `worktree remove` → drop schema → branch. Drop lỗi sau khi đã remove → exit 1, in tên schema để drop tay.
- Env / dependency mới: không.

## Verify
```bash
bash -n scripts/wt-*.sh && shellcheck scripts/wt-*.sh
scripts/wt-new.sh wt/harden --no-install; psql … create schema wt_wt_harden   # tạo schema giả lập "đã có"
scripts/wt-prune.sh wt/harden --into lesson/L04-isolation   # remove → drop → giữ/xoá branch
psql … create schema wt_wt_harden; scripts/wt-new.sh wt/harden --no-install   # REFUSED already exists, không tạo worktree
# host lạ: worktree wt/fakehost, sửa 3 .env sang host db.example.invalid → prune REFUSED, không kết nối
# locked: git worktree lock → prune REFUSED, schema còn
ls .worktrees/*/typing-adventure/**/*.wt-tmp   # không có
```

## Tự review
1. Đoán được diff chưa? Có, 3 file. Mơ hồ: `wt-new --no-install` giờ cần DB để kiểm schema (trước đây không) → chấp nhận, ghi trong Thực tế.
2. Interface nào người khác đang dùng? CLI 2 script (CLAUDE.md dòng 23, không đổi cú pháp); không caller code.
3. Rollback? Revert commit fix.

## Lịch sử
- v1 2026-10-30 00:09: bản đầu, approved.

## Thực tế
Điền 2026-10-30 00:13, sau khi code xong. Không có v2; mục dự đoán giữ nguyên từ commit `abb516c` (00:09:54), code `c35caf9` (00:11:49).

Lệnh: `git diff --name-only 4dd3ba1...lesson/L04-isolation -- . ':!docs/ai-levelup/'` ra 3 file.

- Khớp (3): `docs/plans/L04-wt-hardening.md`, `scripts/wt-new.sh`, `scripts/wt-prune.sh`.
- Dự đoán mà không đổi (0): không.
- Đổi mà không dự đoán (0): không.
- Tỉ lệ khớp: 3 / 3 = 100%.
- Lệch nhỏ: `wt-new` thêm hàm `libpq_url` (cùng phép bỏ tham số như `wt-prune`); file tạm ghi đè bằng `cp` + `rm` thay vì `mv` để giữ quyền/inode file `.env`. `wt-new --no-install` giờ cần DB (đã nêu ở Tự review).
- Phát hiện khi verify: `git worktree remove` lỗi giữa chừng (thư mục cha read-only) đã xoá file và gỡ đăng ký worktree nhưng không xoá được thư mục; script vẫn giữ schema + branch như thiết kế, phần còn lại (thư mục rỗng) dọn tay.
- Design round 2: không.
