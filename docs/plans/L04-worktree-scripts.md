# Plan: Worktree scripts (wt-new / wt-prune)

Trạng thái: approved
Lesson/PR: L04 · EX-1

## Mục tiêu
- `scripts/wt-new.sh <branch> [--base <ref>] [--no-install]` tạo 1 workspace cô lập trong < 2 phút: worktree `.worktrees/<slug>` (`--relative-paths`), port `3000+n` chưa ai giữ, schema Postgres `wt_<slug>` (đã `db push`), 3 file `.env` đã trỏ đúng port + schema, `<wt>/.wt-env` (`PORT`, `WT_SCHEMA`).
- `scripts/wt-prune.sh <branch|path> [--into <ref>] [--dry-run]` dọn bằng 1 lệnh: kiểm hết điều kiện trước, drop schema, `git worktree remove` (không `--force`), xoá branch chỉ khi đã merge.
- Không in secret: chỉ in tên biến, path, port, schema.

## Ngoài phạm vi
- `wt-list.sh`, `--seed`, pnpm store trong devcontainer (BACKLOG #6): mục Mở rộng.
- Container Postgres riêng mỗi worktree: dùng chung server `localhost:5432`, tách bằng schema.
- Windows/Linux đặc thù: script viết cho bash + macOS (`lsof`), không dùng flag GNU-only.

## File thay đổi (dự đoán)
- `docs/plans/L04-worktree-scripts.md` (thêm)
- `scripts/wt-new.sh` (thêm)
- `scripts/wt-prune.sh` (thêm)
- `.gitignore` (sửa: `.worktrees/`, `.wt-env`)
- `CLAUDE.md` (sửa: 1 dòng trong `## Commands`, tổng ≤ 63 dòng)

## Interface chạm tới
- CLI `wt-new.sh`: exit 2 sai cú pháp; exit 1 khi branch đã có worktree / path đã tồn tại / không có port trống / `.env` thiếu `DATABASE_URL`. Slug = branch lowercase, ký tự ngoài `[a-z0-9]` → `_`, cắt 60 ký tự; schema `wt_<slug>` phải khớp `^wt_[a-z0-9_]{1,60}$`. `WT_DIR` đổi thư mục gốc worktree (mặc định `<repo>/.worktrees`).
- Port: `n` nhỏ nhất 1..99, `p=3000+n` không có `lsof -iTCP:p -sTCP:LISTEN` và không nằm trong `.wt-env` của worktree khác.
- `.env`: `DATABASE_URL` giữ tham số khác, thay/thêm `schema=wt_<slug>` (cả 3 file); `NEXTAUTH_URL`, `NEXT_PUBLIC_WS_URL` = `http://localhost:<p>` (root + web), thay nếu có, thêm nếu chưa. Sửa bằng `awk` ra file tạm rồi `mv`, không in giá trị.
- Install: `pnpm install --frozen-lockfile --prefer-offline`, `db:generate`, `prisma db push --skip-generate` chạy với `env -u DATABASE_URL` để Prisma đọc `packages/db/.env` (không bị biến shell trỏ `public` ghi đè), sau khi kiểm lại file đó có `schema=wt_`.
- CLI `wt-prune.sh`: từ chối (exit 1, chưa đụng gì) khi: không tìm thấy worktree; path là checkout chính; branch `main`; `git status --porcelain --untracked-files=all` không rỗng; schema trong `DATABASE_URL` của bất kỳ file `.env` nào không khớp whitelist hoặc là `public`, hoặc 3 file lệch nhau. Drop: `psql -v ON_ERROR_STOP=1 -c 'DROP SCHEMA IF EXISTS "<schema>" CASCADE'` với URL đã bỏ `schema=` (và tham số chỉ Prisma hiểu). Branch: `merge-base --is-ancestor <branch> <into>` → `git branch -d`; không thì `gh pr list --head <branch> --state merged` có PR → `git branch -D`; còn lại giữ + in lý do. `--dry-run` chỉ in kế hoạch.
- Env / dependency mới: không (dùng `git`, `lsof`, `awk`, `psql`, `pnpm`, `gh` tuỳ chọn).

## Verify
```bash
bash -n scripts/wt-new.sh scripts/wt-prune.sh            # exit 0; shellcheck nếu có
git check-ignore -q .worktrees/x && echo ignored
/usr/bin/time -p scripts/wt-new.sh wt/smoke --no-install 2>&1 | tee /tmp/wt-new.log
cat .worktrees/wt_smoke/.git                              # gitdir: ../../.git/worktrees/...
for f in .env apps/web/.env packages/db/.env; do grep -c 'schema=wt_' .worktrees/wt_smoke/typing-adventure/$f; done   # 1 1 1
git -C .worktrees/wt_smoke status --porcelain             # rỗng
scripts/wt-new.sh wt/smoke --no-install                   # exit 1, worktree cũ còn nguyên
scripts/wt-prune.sh wt/smoke --dry-run                    # in kế hoạch, không đổi gì
grep -nE 'set -x|cat .*\.env|echo .*(DATABASE_URL|SECRET)' scripts/wt-*.sh   # không ra dòng nào
```

## Tự review
1. Đoán được diff chưa? Có, 5 file. Mơ hồ: `.wt-env` có cần thêm vào `info/exclude` hay chỉ `.gitignore` (branch tạo từ base cũ chưa có dòng ignore) → script ghi thêm vào `$(git rev-parse --git-common-dir)/info/exclude`, không thêm file.
2. Interface nào người khác đang dùng? Không có caller. `.env` của checkout chính chỉ được đọc (copy), không sửa. `server.ts` đã đọc `PORT` từ env shell.
3. Rollback? Revert commit script; worktree đã tạo dọn bằng `git worktree remove` + `DROP SCHEMA` tay.

## Lịch sử
- v1 2026-10-29 23:47: bản đầu, approved.

## Thực tế
