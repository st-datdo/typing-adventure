# Tổng kết đợt 1 · L00 → L06

Nguồn: [PLAN.md](../PLAN.md) · mục lục: [README.md](README.md) · mapping feature → file: [FEATURE_MAP.md](../learner/FEATURE_MAP.md) · metric: [metrics.md](../metrics.md) · lỗi lặp: [mistakes.md](../mistakes.md) · việc tồn: [BACKLOG.md](BACKLOG.md).
L07 (Parallel) và L08 (Autonomous) học ở đợt sau.

## Kết quả từng lesson
| Lesson | Kết quả chính | PR | Vòng sửa |
|---|---|---|---|
| L00 Dựng đội agent | `teacher`, `learner`, `pr-reviewer` + workflow Claude PR Review; khung tài liệu `lessons/`, `learner/` | #4 | 1 (thiếu hồ sơ lesson) |
| L01 Basic setup | CLAUDE.md, 3 rules, 3 skills, ESLint/Prettier (trước khoá) | #1, #3 | – |
| L02 Advanced setup | Devcontainer chạy thật, `.mcp.json` + role `mcp_ro`, vitest config, `typecheck` 4 package | #5 | 0 |
| L03 Plan-first | `docs/plans/_template.md`, rate limit (register/credentials/sessions), security headers CSP/HSTS | #6 | 1 (chấm: XFF spoofing, login treo khi 429) |
| L04 Isolation | `scripts/wt-new.sh`/`wt-prune.sh` (worktree + schema `wt_*` + port riêng), integration test, Playwright skeleton | #7 | 2 (chấm: an toàn script; review: xoá nhầm branch squash-merged) |
| L05 Enforcement | Hook agent (script + đề xuất settings), Lefthook + gitleaks, CI `checks/gitleaks/guard`, ruleset `main`, `scripts/lib/pg.sh`, MCP Toolbox | #8 | 1 (chấm: `mcp_ro` tạo được bảng → `REVOKE CREATE`) |
| L06 Spec + TDD | `specs/` EARS (RL 9 ID, WP 7 ID), `test:` trước `feat:`, `check-tdd-commits.sh`, Stryker 65.47% → 77.59%, guard bảo vệ thêm workflow/settings/scripts | #9 | 1 (review: lách limiter bằng 2 field `email`) |

## Bài học rút ra
- **Hai lớp kiểm tra bắt được lỗi khác nhau.** Teacher (chạy lại AC) bắt lỗi chức năng/an toàn script; reviewer (đọc diff + mã thư viện) bắt lỗi bảo mật tinh vi (squash-merge xoá nhầm branch, 2 field `email`). Cả 6 PR lesson có 0 comment "cơ học" (format/lint/type).
- **Plan/spec trước code hiệu quả.** Plan-vs-diff khớp 89–100%, 0 lần design round 2; mỗi spec có `test:` đỏ đúng lý do trước `feat:`.
- **Lỗi lặp → rule.** Ví dụ: giờ "Lịch sử" trong plan phải lấy từ `date` (L05), output dùng làm dữ liệu phải qua `rtk proxy` (L06).
- **Giới hạn quyền là có chủ ý.** Agent không tự sửa `.claude/settings*.json`, không tự gắn `config-change-approved`, không chạy lệnh in environment; việc này để người làm.

## Việc người dùng còn cần làm
1. Bật hook agent: gộp `.claude/hooks/settings.hooks.json` vào `.claude/settings.json`; approve MCP `postgres-ro`.
2. DB host: `drop table public.mcp_probe;` và chạy lại `.devcontainer/init-db/01-mcp-readonly.sql` (user `dev`).
3. Production: đặt `TRUST_PROXY_HEADER` (bắt buộc, xem `typing-adventure/docs/DEPLOY_AWS.md`).
4. Thêm secret `ANTHROPIC_API_KEY` nếu muốn Claude review chạy trên GitHub Actions.
5. Rotate session token Claude Code (lộ trong transcript subagent ở L03 do `pgrep -fl`).

## Chuyển sang đợt sau
- **L07 Parallel:** BACKLOG #2 (limiter Redis), #4 (CSP nonce), #16 (ruleset drift), #20 (guard-bash lách qua `bash -c`), #21–#25.
- **L08 Autonomous:** BACKLOG #19 (pin action theo SHA), workflow `claude-code-action` theo label `agent-ready`.
- Còn mở khác: #6 (pnpm store), #17 (lefthook/gitleaks trong devcontainer).
