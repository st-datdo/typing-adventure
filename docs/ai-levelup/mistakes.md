| Ngày | Lỗi agent | Lần thứ | Đã thành rule/skill? |
|---|---|---|---|
| 2026-10-14 | Rule game-engine/multiplayer sai paths → không nạp đúng file | 1 | Sửa paths; thêm bước verify rule nạp đúng |
| 2026-10-29 | Mở PR lesson thiếu LESSON/GRADE/REPORT/metrics | 1 | Checklist nộp bài trong `.claude/agents/learner.md` |
| 2026-10-29 | Quy ước "không comment/Javadoc" chỉ nằm ở `~/.claude/CLAUDE.md` cá nhân → mất hiệu lực trong devcontainer | 1 (phòng ngừa) | `CLAUDE.md` mục `## Conventions` |
| 2026-10-29 | `pnpm install` trong container tạo `.pnpm-store/` (954 MB) ngay trong workspace bind mount, suýt lọt vào git | 1 | `.gitignore` thêm `.pnpm-store/` |
| 2026-10-29 | `init-db/01-mcp-readonly.sql` không chạy vì volume `postgres_data` đã có từ 04/2026 → `mcp_ro` không tồn tại trong container | 1 | `CLAUDE.md` mục Gotchas (chạy tay bằng `psql -f`) |
| 2026-10-29 | Sửa `turbo.json` bằng `JSON.stringify` làm vỡ format mảng 1 dòng | 1 | Đã thành hook (L05): `.claude/hooks/format-lint.sh` (PostToolUse, `prettier --write` file `*.json` trong `typing-adventure/`) + Lefthook pre-commit `prettier --write` + `stage_fixed` |
| 2026-10-29 | Đo green build trong container bị turbo replay cache từ host (lint `cache hit`) → số đo ảo | 1 | ghi trong REPORT L02 (đo bằng `--force`); chưa thành rule vì mới lần 1 |
| 2026-10-29 | `pgrep -fl` (macOS) in cả env của process `next-server` → lộ 1 biến token phiên vào transcript | 1 | ghi REPORT L03; dùng `ps -o pid,ppid,comm` / `pgrep -f >/dev/null` |
| 2026-10-29 | Tắt server bằng `kill $(lsof -ti tcp:3000)` + `pkill` → bị auto-mode chặn vì có thể trúng process lạ | 1 | ghi REPORT L03; xác định PID bằng `lsof -sTCP:LISTEN` + `ps` rồi mới `kill` |
| 2026-10-29 | Ref `main` local cũ (`48535e5`) sau khi PR #5 merge → `git diff main` kéo cả diff L02 | 1 | dùng `BASE`/`origin/main`; chưa thành rule |
| 2026-10-29 | `rtk git log` ẩn merge commit → sau `commit --amend` tưởng HEAD bị lùi | 1 | ghi REPORT L04; xem graph/parent bằng `rtk proxy git log --format='%h %p %s'` |
| 2026-10-29 | Đọc bản tóm tắt của `rtk` ("All files formatted correctly") trong khi exit 1 | 1 | ghi REPORT L04; kiểm bằng `rtk proxy` + exit code |
| 2026-10-29 | Ghi giờ ước lượng vào mục Lịch sử của plan thay vì giờ thật (`date`) | 1 | ghi REPORT L04; giờ thật trong `## Thực tế` |
| 2026-10-29 | Smoke worktree không có commit riêng nên prune coi là đã merge, xoá branch, không chứng minh được nhánh "giữ branch" | 1 | ghi REPORT L04; dựng lại smoke có 1 commit |
| 2026-10-30 | Lại ghi giờ ước lượng vào Lịch sử plan (`L04-review-fixes.md` ghi 00:20, commit thật 00:16:56) | 2 | Đã thành rule: `docs/plans/_template.md` mục `## Lịch sử` ghi lệnh `date '+%F %H:%M'` chạy ngay trước khi commit plan (L05 EX-1) |
| 2026-10-30 | Kiểm "password không có trong argv" bằng `grep -cF $PW` khi DB dev có user = password → dương tính giả (khớp `-U`) | 1 | ghi REPORT L04; test bằng `.env` giả có password riêng + stub `psql` |
| 2026-10-30 | Xoá branch squash-merge chỉ theo tên branch của PR merged (review PR #7, blocking) | 1 | `wt-prune.sh` so `headRefOid` với tip, xoá bằng `update-ref` có old value |
| 2026-10-30 | Thử "role `mcp_ro` chặn ghi" bằng `SET default_transaction_read_only = off` + `CREATE TABLE` → tạo thật `public.mcp_probe` (vi phạm "chỉ ghi `wt_*`"); `DROP` sau đó bị auto-mode chặn, chờ user xoá | 1 | ghi REPORT L05; probe ghi chỉ trong `BEGIN … ROLLBACK` hoặc schema `wt_*`; phát hiện `PUBLIC` có `CREATE` trên `public` (PG14) |
| 2026-10-30 | Vi phạm thử "sửa `eslint.config.mjs`" chỉ thêm dòng trống → prettier `stage_fixed` gỡ, commit rỗng, guard báo OK | 1 | ghi REPORT L05; vi phạm thử phải là thay đổi có nghĩa |
| 2026-10-30 | `git diff \| git -C <worktree> apply` → `No valid patches in input`: hook rtk viết lại `git diff` thành bản rút gọn, không còn là patch | 3 (cùng gốc với 2 dòng rtk 2026-10-29: tóm tắt prettier, `git log` ẩn merge) | Đã thành rule: `.claude/agents/learner.md` — output dùng làm dữ liệu (pipe, patch, đếm, so sánh) chạy qua `rtk proxy` |
| 2026-10-30 | Test repo tạm (`git init` ở TMPDIR) đọc gitignore toàn cục của máy → `.claude/settings.local.json` không được `add -A`, ca test thành commit rỗng, guard báo OK | 1 | `test-guard-diff.sh`/`test-check-tdd-commits.sh` chạy git với `-c core.excludesFile=/dev/null` |
