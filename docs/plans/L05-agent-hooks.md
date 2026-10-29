# Plan: Agent hooks (format/lint sau khi sửa, chặn lệnh nguy hiểm, chặn đọc .env)

Trạng thái: approved
Lesson/PR: L05 · EX-2

## Mục tiêu
- Agent sửa file `.ts/.tsx/...` trong `typing-adventure/` → file được `prettier --write` ngay; file trong `apps/web` có lỗi eslint → hook exit 2 kèm tối đa 20 dòng lỗi để agent sửa tiếp.
- Agent chạy `rm -rf`, `git push --force` (mọi biến thể) hoặc lệnh Prisma ghi DB khi host DB không phải local → bị chặn trước khi chạy (exit 2, stderr nêu lý do, không in URL/host/password).
- Agent `Read` `.env` / `.env.*` (trừ `.env.example`) → bị chặn.
- Test được hoàn toàn bằng pipe JSON (`test-hooks.sh`, ≥ 20 ca, ≥ 5 ca cho qua); `settings.hooks.json` để user tự gộp.

## Ngoài phạm vi
- Sửa `.claude/settings.json` / `settings.local.json` (agent bị chặn, user tự bật). Activation trong phiên thật: `chưa verify runtime`.
- Chặn `cat/head/less .env` qua Bash, hook cho `Grep`: phần Mở rộng, không làm. Hook là rào chắn, không phải biên bảo mật.
- `--force-with-lease` / `--force-if-includes`: **cũng chặn**. Agent không có lý do viết lại lịch sử remote; user tự chạy tay khi cần.
- Host `postgres` (devcontainer): không thêm, vì `.devcontainer/docker-compose.devcontainer.yml` dùng `localhost`.

## File thay đổi (dự đoán)
- `.claude/hooks/format-lint.sh` (thêm)
- `.claude/hooks/guard-bash.sh` (thêm)
- `.claude/hooks/guard-read.sh` (thêm)
- `.claude/hooks/test-hooks.sh` (thêm)
- `.claude/hooks/settings.hooks.json` (thêm)

## Interface chạm tới
- Input: JSON stdin của Claude Code (`tool_name`, `tool_input.command` | `tool_input.file_path`, `cwd`), đọc bằng `jq`. Thiếu `jq` → guard exit 2 (fail closed), format-lint exit 1 (không chặn, báo user).
- `format-lint.sh`: gốc checkout = `git -C <dir file> rev-parse --show-toplevel`; chỉ xử lý file dưới `<root>/typing-adventure/` (bỏ `node_modules/`, `.next/`), đuôi `ts tsx js jsx mjs cjs css json`; prettier = `typing-adventure/node_modules/.bin/prettier`, eslint = `apps/web/node_modules/.bin/eslint --no-warn-ignored` (chạy trong `apps/web`) cho đuôi `ts tsx js jsx mjs` dưới `apps/web/`. Thiếu binary → exit 1 + 1 dòng stderr. Eslint error → exit 2; chỉ warning → exit 0.
- `guard-bash.sh`: tách lệnh thành đoạn theo `; & | && || ( ) newline`, mỗi đoạn tách từ. `rm` có cả cờ đệ quy (`r`/`R`/`--recursive`) và `f`/`--force` (gộp hoặc rời) → chặn. `git … push` có `-f`, cụm cờ ngắn chứa `f`, `--force*`, refspec `+…` → chặn. Đoạn chứa `prisma migrate|prisma db push|prisma db execute` hoặc `db:migrate|db:push` → lấy URL theo thứ tự: `--url` trong lệnh, `DATABASE_URL=` inline, `DATABASE_URL` trong env của hook, các `.env` (`typing-adventure/.env`, `apps/web/.env`, `packages/db/.env`) của checkout chứa `cwd`. Mỗi URL tìm được phải có host ∈ {`localhost`,`127.0.0.1`,`::1`} và không có `host=`/`hostaddr=` trong query; không tìm được URL nào → chặn.
- `guard-read.sh`: basename `.env` hoặc `.env.*` khác `.env.example` → exit 2.
- `settings.hooks.json`: `PreToolUse` matcher `Bash` → guard-bash, `Read` → guard-read; `PostToolUse` matcher `Edit|Write|MultiEdit` → format-lint; lệnh `"$CLAUDE_PROJECT_DIR"/.claude/hooks/<x>.sh`.
- Env / dependency mới: `jq` (đã có trên host).

## Verify
```bash
bash -n .claude/hooks/*.sh && shellcheck .claude/hooks/*.sh       # sạch
bash .claude/hooks/test-hooks.sh                                    # ≥20 PASS, ≥5 ca cho qua, exit 0
bash .claude/hooks/test-hooks.sh 2>&1 | grep -cE 'postgres(ql)?://|fakepw'   # 0
jq empty .claude/hooks/settings.hooks.json && jq -r '.hooks[][].matcher' .claude/hooks/settings.hooks.json
git diff main -- .claude/settings.json .claude/settings.local.json   # rỗng
/usr/bin/time -p .claude/hooks/format-lint.sh < <json 1 file .tsx>  # đo giây
```
Ca DB lạ dùng `.env` giả trong `mktemp -d` (repo git giả có `typing-adventure/packages/db/.env`), không đụng `.env` thật.

## Tự review
1. Đoán được diff chưa? Có, 5 file mới trong `.claude/hooks/`. Mơ hồ: test format-lint cần file thật trong `apps/web` (tạo `src/hooktest-<pid>.tsx` tạm, xoá bằng `trap`).
2. Interface nào người khác đang dùng? Chưa có caller; chỉ bật khi user gộp `settings.hooks.json`.
3. Rollback? User bỏ khối `hooks` khỏi settings; revert commit.

## Lịch sử
- v1 2026-10-30 00:32: bản đầu, approved.

## Thực tế
Điền 2026-10-30 00:51. Plan `bafa8d0` (00:32:46) trước code `961284d` (00:35:22). Không có v2.

Lệnh: `git diff --name-only main...lesson/L05-enforcement -- . ':!docs/ai-levelup/'`, lọc `.claude/hooks/`.

- Khớp (5): `format-lint.sh`, `guard-bash.sh`, `guard-read.sh`, `test-hooks.sh`, `settings.hooks.json`.
- Dự đoán mà không đổi (0): không.
- Đổi mà không dự đoán (0): không.
- Tỉ lệ khớp: 5 / 5 = 100%.
- Lệch nhỏ: `test-hooks.sh` có 36 ca (25 Bash, 5 Read, 6 format-lint); thêm ca "out of scope in ra rỗng". Tách đoạn lệnh bằng `${cmd//[;&|()]/$'\n'}` thay vì `tr` (shellcheck SC2020). `format-lint.sh` trên 1 file `.tsx` 47 dòng: 0.86–0.95 s.
- Design round 2: không.
