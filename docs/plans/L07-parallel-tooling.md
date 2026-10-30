# Plan: Hook scope + notify, mở rộng guard-bash, script lead-time

Trạng thái: approved
Lesson/PR: L07 · EX-2, EX-3, EX-4, EX-5, EX-8

## Mục tiêu
- Session agent trong worktree chỉ Edit/Write được file nằm trong spec/plan của nó (`.claude/hooks/guard-scope.sh`, scope từ `CLAUDE_SCOPE_FILE` hoặc `.wt-scope`).
- Khi session dừng hoặc cần người, có banner macOS kèm tên branch, gửi an toàn bằng argv, luôn ghi log (`.claude/hooks/notify.sh`).
- `guard-bash.sh` chặn thêm các đường vòng ở BACKLOG #20 (`find -delete`, `find -exec rm`, `eval`, `bash|sh|zsh -c` lồng 1 cấp, đọc `.env*` bằng pager).
- Đo lead time và PR wait time bằng `scripts/metrics/lead-time.sh <pr> <spec-path>`, ra đúng số L06 trên PR #9.

## Ngoài phạm vi
- Không sửa `.claude/settings.json`, `.claude/settings.local.json`: chỉ cập nhật bản đề xuất `settings.hooks.json`, user tự gộp. Vì vậy hook không chạy thật trong phiên A, B.
- Không gắn label `config-change-approved`. Không thêm `scripts/metrics/` vào `guard-diff.sh` và không thêm bước self-test lead-time vào `.github/workflows/ci.yml` (chạm `.github/**`, để lesson sau).
- Không đụng code của task A (`register/route.ts`, `rate-limit.ts`) và task B (`moderation.ts`): làm ở branch/worktree riêng.
- Scope hook không phải biên bảo mật: không cố chặn ghi file qua Bash.

## File thay đổi (dự đoán)
- `.claude/hooks/guard-scope.sh` (thêm)
- `.claude/hooks/notify.sh` (thêm)
- `.claude/hooks/guard-bash.sh` (sửa)
- `.claude/hooks/test-hooks.sh` (sửa)
- `.claude/hooks/settings.hooks.json` (sửa)
- `.gitignore` (sửa: thêm `.wt-scope`)
- `scripts/metrics/lead-time.sh` (thêm)
- `scripts/metrics/test-lead-time.sh` (thêm)
- `docs/plans/L07-parallel-tooling.md` (thêm)
- `docs/ai-levelup/learner/L07-parallel/REPORT.md`, `docs/ai-levelup/learner/L07-parallel/task-A.md`, `docs/ai-levelup/learner/L07-parallel/task-B.md` (thêm; task-A/B do task tạo, lead gộp)
- `docs/ai-levelup/learner/FEATURE_MAP.md`, `docs/ai-levelup/metrics.md`, `docs/ai-levelup/mistakes.md` (sửa; mistakes chỉ khi có lỗi lặp)

## Interface chạm tới
- `guard-scope.sh` (PreToolUse `Edit|Write|MultiEdit`): stdin JSON `tool_input.file_path`, `cwd`. Gốc repo = `git -C "$cwd" rev-parse --show-toplevel`. Scope = `$CLAUDE_SCOPE_FILE` nếu khác rỗng, không thì dòng đầu `<root>/.wt-scope`; path tương đối tính từ gốc repo. Không có scope → exit 0. Scope trỏ file không tồn tại → exit 2. Allowlist: path trong backtick ở mục `## File thay đổi…` (plan) hoặc dòng `File dự kiến:`/`Test:` (spec); `*` không qua `/`, `**` qua mọi cấp, kết thúc `/` = cả thư mục. Luôn cho phép: file scope, `specs/**`, `docs/plans/**`, `docs/ai-levelup/**`, path ngoài gốc repo. Chuẩn hoá path bằng hàm bash tự viết (macOS `realpath` không có `-m`): bỏ `.`, gộp `..`, không cho thoát lên trên `/`. Thông báo chặn ra stderr, nêu file scope và cách sửa (thêm file vào spec + Lịch sử).
- `notify.sh` (Notification, Stop): đọc `hook_event_name`, `message`, `cwd` bằng `jq` (thiếu `jq` → chỉ log thô rồi exit 0). Title `Claude · <branch> · <event>`. Gửi bằng `osascript -e 'on run argv' -e 'display notification (item 1 of argv) with title (item 2 of argv)' -e 'end run' "$msg" "$title"`. Log 1 dòng vào `${CLAUDE_NOTIFY_LOG:-$HOME/.claude/notify.log}`: giờ, event, branch, message cắt ≤ 200 ký tự, xoá xuống dòng. Mọi lỗi exit 0, stdout rỗng.
- `guard-bash.sh`: thêm luật `find … -delete`, `find … -exec(dir)? rm`, `eval`, `cat|head|tail|less|more|bat … .env*` (trừ `.env.example`); `bash|sh|zsh -c '<s>'` → tách `<s>` rồi kiểm lại bằng cùng bộ luật (1 cấp). Giữ exit 2 + stderr như hiện tại.
- `settings.hooks.json`: thêm PreToolUse `Edit|Write|MultiEdit` → `guard-scope.sh`; `Notification` và `Stop` → `notify.sh`.
- `lead-time.sh <pr> <spec-path>`: `gh api repos/{owner}/{repo}/pulls/<pr>/commits --paginate`, theo thứ tự, lấy commit đầu tiên mà nội dung spec (`git show sha:path` nếu `git cat-file -e`, không thì `gh api …/contents/<path>?ref=<sha>` base64) có `Trạng thái: approved`; mốc = `commit.author.date`. `gh api …/issues/<pr>/timeline --paginate`: `ready_for_review` cuối, `merged` (fallback `gh pr view --json mergedAt`). In `lead=XmYYs wait=XmYYs` (không có ready → `wait=n/a`). Chưa merge → stderr + exit 1. Sai tham số → exit 2. Cần `gh`, `jq`, `git`.
- `test-lead-time.sh`: stub `gh` trên `PATH` trả JSON cố định, ≥ 3 ca (bình thường, nhiều lần ready → lấy cuối, chưa merge → exit 1).
- Env / dependency mới: `CLAUDE_SCOPE_FILE`, `CLAUDE_NOTIFY_LOG` (tuỳ chọn). Không thêm package.

## Verify
```bash
bash -n .claude/hooks/*.sh scripts/metrics/*.sh
shellcheck .claude/hooks/*.sh scripts/metrics/*.sh          # sạch
bash .claude/hooks/test-hooks.sh                            # exit 0, >= 60 ca, leaks: 0
printf '{"hook_event_name":"Stop","cwd":"%s"}' "$PWD" | PATH=/usr/bin:/bin .claude/hooks/notify.sh; echo $?   # 0, stdout rỗng
jq . .claude/hooks/settings.hooks.json >/dev/null && grep -c 'guard-scope.sh\|Notification\|Stop' .claude/hooks/settings.hooks.json
git diff main -- .claude/settings.json .claude/settings.local.json   # rỗng
bash scripts/metrics/test-lead-time.sh                      # exit 0
scripts/metrics/lead-time.sh 9 specs/RL/spec.md             # lead=54m03s wait=16m22s
scripts/metrics/lead-time.sh 9 specs/WP/spec.md             # lead=51m47s wait=16m22s
```

## Tự review
1. Đoán được diff chưa? Có. Mơ hồ: số ca thêm vào `test-hooks.sh` (cần 40 → ≥ 60); parse `bash -c` có quote lồng chỉ xử lý chuỗi trong `'…'` hoặc `"…"` đơn giản.
2. Interface nào người khác đang dùng? `guard-bash.sh` đang được user bật qua settings: luật mới có thể chặn lệnh hợp lệ (vd `find -delete` trong script dọn dẹp), test cho qua `find . -name '*.ts'`, `cat .env.example`. `guard-scope`/`notify` chưa ai dùng.
3. Rollback thế nào? Revert commit; PR chạm `.claude/hooks/*` nên rollback cũng cần label `config-change-approved`.

## Lịch sử
- v1 2026-10-30 20:22: bản đầu, approved.
- v2 2026-10-30 20:33: `notify.sh` gọi `osascript … -e 'end run' -- "$msg" "$title"` (thêm `--`): thử thật `osascript -e … "-s"` báo `option requires an argument` exit 2, nên message bắt đầu bằng `-` sẽ bị hiểu là option. Branch lấy bằng `git symbolic-ref --short` (repo chưa có commit thì `rev-parse --abbrev-ref HEAD` lỗi). `guard-scope.sh` thiếu `jq` thì chặn (exit 2) như `guard-bash`/`guard-read`. `guard-bash.sh` tách segment thêm theo dấu backtick để bắt `` `eval …` ``. Không đổi danh sách file.

## Thực tế
