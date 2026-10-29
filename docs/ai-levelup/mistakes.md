| Ngày | Lỗi agent | Lần thứ | Đã thành rule/skill? |
|---|---|---|---|
| 2026-10-14 | Rule game-engine/multiplayer sai paths → không nạp đúng file | 1 | Sửa paths; thêm bước verify rule nạp đúng |
| 2026-10-29 | Mở PR lesson thiếu LESSON/GRADE/REPORT/metrics | 1 | Checklist nộp bài trong `.claude/agents/learner.md` |
| 2026-10-29 | Quy ước "không comment/Javadoc" chỉ nằm ở `~/.claude/CLAUDE.md` cá nhân → mất hiệu lực trong devcontainer | 1 (phòng ngừa) | `CLAUDE.md` mục `## Conventions` |
| 2026-10-29 | `pnpm install` trong container tạo `.pnpm-store/` (954 MB) ngay trong workspace bind mount, suýt lọt vào git | 1 | `.gitignore` thêm `.pnpm-store/` |
| 2026-10-29 | `init-db/01-mcp-readonly.sql` không chạy vì volume `postgres_data` đã có từ 04/2026 → `mcp_ro` không tồn tại trong container | 1 | `CLAUDE.md` mục Gotchas (chạy tay bằng `psql -f`) |
| 2026-10-29 | Sửa `turbo.json` bằng `JSON.stringify` làm vỡ format mảng 1 dòng | 1 | chờ L5 hook (`prettier --check`) |
| 2026-10-29 | Đo green build trong container bị turbo replay cache từ host (lint `cache hit`) → số đo ảo | 1 | ghi trong REPORT L02 (đo bằng `--force`); chưa thành rule vì mới lần 1 |
| 2026-10-29 | `pgrep -fl` (macOS) in cả env của process `next-server` → lộ 1 biến token phiên vào transcript | 1 | ghi REPORT L03; dùng `ps -o pid,ppid,comm` / `pgrep -f >/dev/null` |
| 2026-10-29 | Tắt server bằng `kill $(lsof -ti tcp:3000)` + `pkill` → bị auto-mode chặn vì có thể trúng process lạ | 1 | ghi REPORT L03; xác định PID bằng `lsof -sTCP:LISTEN` + `ps` rồi mới `kill` |
| 2026-10-29 | Ref `main` local cũ (`48535e5`) sau khi PR #5 merge → `git diff main` kéo cả diff L02 | 1 | dùng `BASE`/`origin/main`; chưa thành rule |
