# Backlog follow-up từ review

Các điểm **không chặn** PASS/merge, gom từ GRADE và review PR. Lesson nào nhận thì chuyển trạng thái `đã nhận` + link plan/PR; xong thì `đã xong`.

| # | Vấn đề | Nguồn | Hướng sửa | Lesson có thể nhận | Trạng thái |
|---|---|---|---|---|---|
| 1 | `getClientIp` tin `x-real-ip` vô điều kiện. Sau ALB/App Runner (không có nginx đặt header) client tự gửi `x-real-ip` để né limiter | Review PR #6 (L03) | Cấu hình trusted proxy (vd `TRUSTED_PROXY_HOPS` hoặc `TRUST_PROXY_HEADER`), mặc định không tin header nào; test cho từng kiểu triển khai trong `docs/DEPLOY_AWS.md` | L06 (spec EARS + test trước) | mở |
| 2 | Limiter in-memory: mỗi instance một bộ đếm, mất khi restart | GRADE L03, plan `L03-rate-limit.md` | Store Redis/Upstash (đã có `UPSTASH_REDIS_*` trong `.env.example`) sau interface hiện tại, giữ in-memory cho dev/test | L07 (task song song, module tách biệt) | mở |
| 3 | Limit đăng nhập theo IP: cả lớp học sau 1 NAT dùng chung 10 lần/15 phút, dễ khoá nhầm | Review PR #6 (L03) | Key theo IP + email (đã chuẩn hoá), có thể thêm trần riêng theo IP cao hơn | L06 (cùng spec với #1) | mở |
| 4 | CSP `script-src 'unsafe-inline'` (vì inline script `THEME_BOOT`) | GRADE L03, LESSON L03 Mở rộng | Nonce qua middleware hoặc hash cố định của script, phát `Report-Only` trước rồi mới enforce | L07 | mở |
| 5 | `@modelcontextprotocol/server-postgres@0.6.2` đã deprecated (pin trong `.mcp.json`) | GRADE L03 | Chọn server Postgres MCP còn bảo trì, giữ role `mcp_ro`; kiểm lại 2 lớp chặn ghi | L05 (config/tooling, qua review `config-change-approved`) | mở |
| 6 | `.pnpm-store/` sinh trong bind mount của devcontainer, chỉ được che bằng `.gitignore` | GRADE L02 | Named volume cho pnpm store trong `.devcontainer/docker-compose.devcontainer.yml` (`store-dir`), để worktree trong container cũng dùng chung store | L04 (Mở rộng) | mở |
| 7 | `wt-new.sh` không kiểm schema `wt_<slug>` đã tồn tại (mồ côi hoặc trùng slug khi `WT_DIR` khác/branch dài bị cắt) → dùng lại dữ liệu cũ, prune 1 worktree drop schema của worktree kia | GRADE L04 | Từ chối khi schema đã có, thêm `--reuse-schema` | L07 (trước khi chạy 2–3 session song song) | đã xong (L04 sửa sau chấm: [plan](../../plans/L04-wt-hardening.md), commit `c35caf9`) |
| 8 | `wt-prune.sh` drop schema theo host trong `.env` của worktree, không giới hạn localhost | GRADE L04 | Chỉ cho `localhost`/`127.0.0.1`; cùng luật với hook chặn `prisma` vào DB lạ | L05 | đã xong (L04 sửa sau chấm: [plan](../../plans/L04-wt-hardening.md), commit `c35caf9`) |
| 9 | `wt-prune.sh` drop schema trước `git worktree remove` (worktree `locked` → mất schema, còn worktree); file tạm `.env.wt-tmp` chứa secret nằm trong cây, không ignore | GRADE L04 | Remove trước rồi drop (hoặc kiểm `locked`); `mktemp` ngoài cây + `trap` | L05 | đã xong (L04 sửa sau chấm: [plan](../../plans/L04-wt-hardening.md), commit `c35caf9`) |
