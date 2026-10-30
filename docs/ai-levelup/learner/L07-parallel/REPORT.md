# L07 · Parallel · REPORT

## Điều đã học
- Song song chỉ nhanh khi task tách hẳn file: A (`apps/web`) và B (`packages/game-engine`) có 0 file chung → 0 xung đột, reviewer merge liền 2 PR không cần `update-branch`.
- Spec approved + draft PR mở ngay (24–26 s sau spec) biến PR thành bảng trạng thái; CI đỏ ở commit `test:` lúc còn draft là tín hiệu đúng, không phải sự cố.
- Scope hook là rào chắn rẻ: đọc dòng `File dự kiến:` của spec, chặn Edit ngoài danh sách; kiểm offline được bằng diff.
- Review theo đợt rút wait time 16m22s → 2–5 phút; WIP 3 (lead + 2 task) vẫn chưa làm reviewer thành nút cổ chai.
- Output dùng làm dữ liệu phải qua `rtk proxy` (lần 4 của lỗi này; lệnh mẫu AC-2 thiếu nó).

## EX-1 · Plan + khởi động song song
Plan `docs/plans/L07-parallel-tooling.md` (approved), commit `5d98eb1` (trước rebase `9ad6519`) 2026-10-30 20:23:08, trước mọi commit code.
Worktree từ main=432c693, đo `/usr/bin/time -p`:
- 20:23:17 `scripts/wt-new.sh l07/rg-register-limit --base main` → port 3001, schema wt_l07_rg_register_limit, pnpm 14.4 s, real 21.08, exit 0
- 20:23:42 `scripts/wt-new.sh l07/wm-moderation-v3 --base main` → port 3002, schema wt_l07_wm_moderation_v3, pnpm 4.1 s, real 8.65, exit 0
`.wt-scope` 20:23:55: A → specs/RG/spec.md, B → specs/WM/spec.md (untracked; xoá trước khi prune).
Prune sau merge: `scripts/wt-prune.sh <branch> --into origin/main` → A 5.84 s, B 5.07 s (worktree + schema + branch local).

### Bảng AC-1
Giờ +07. Draft/ready từ `gh`, mốc commit = author date từ `gh api …/pulls/N/commits`.

| task | branch | worktree | cách tạo | setup (s) | PR | spec approved | draft | test: | feat: | ready | merge |
|---|---|---|---|---|---|---|---|---|---|---|---|
| A | l07/rg-register-limit | .worktrees/l07_rg_register_limit (3001, wt_l07_rg_register_limit) | wt-new | 21.08 (prune 5.84) | #10 | 20:26:03 `d445572` | 20:26:26 (+24s) | 20:27:17 `8f55285` | 20:28:18 `f3600ca` | 20:32:04 | 20:36:44 `4df98c8` |
| B | l07/wm-moderation-v3 | .worktrees/l07_wm_moderation_v3 (3002, wt_l07_wm_moderation_v3) | wt-new | 8.65 (prune 5.07) | #11 | 20:26:32 `556d2e6` (v2 `fbc1059` 20:28:02) | 20:26:58 (+26s) | 20:28:09 `c88d94e` | 20:29:09 `6324b7a` | 20:35:10 | 20:37:18 `5590f0f` |

WIP tối đa: 3 (lead + A + B, 20:25–20:35).

## EX-6 · Task A (RG) — chi tiết: [task-A.md](task-A.md)
Spec RG 5 ID. Dòng đỏ đầu tiên: RG-01 `expected 429 to be 200`; RG-02 `expected 200 to be 429`; RG-03 `expected [200×5, 429, 429] to deeply equal [200×7]`; RG-04 `expected "warn" to be called 1 times, but got 0 times`; RG-05 `expected [ 'createRateLimiter', …(4) ] to not include 'getClientIp'`. Web 49/49, typecheck 4/4, lint 0 error/37 warning, `check-tdd-commits` OK, `guard-diff` OK không label. `getClientIp` chỉ còn trong test RG-05 (spec v2 ghi lý do).

## EX-7 · Task B (WM) — chi tiết: [task-B.md](task-B.md)
Spec WM 6 ID (v2 làm rõ WM-04 chỉ xét `\p{L}` vì U+0483/U+0489 là dấu thuộc Cyrillic). Test mới ở `moderation-v3.test.ts`, `moderation.test.ts` 0 dòng đổi. Engine 193/193, mutation toàn package 78.02 (`moderation.ts` 97.12%, 3 mutant tương đương), 11 ca GRADE L06 đều có test cite ID. Push commit đỏ bằng `LEFTHOOK=0` (pre-push chạy engine test).

## Bảng AC
| AC | Kết quả | Bằng chứng |
|---|---|---|
| AC-1 | đạt | Plan `5d98eb1` 20:23:08 trước commit code đầu `2e2da9f`. Draft sau spec 24 s và 26 s. WIP 3 |
| AC-2 | đạt | `test-hooks.sh` 93/93, leaks 0. Offline A: vòng lặp rỗng (6/6 file), ca âm `schema.prisma` rc=2. Offline B: không `OUT`, ca âm `wordpacks/route.ts` rc=2 |
| AC-3 | đạt (banner: chưa verify runtime) | Stub 12 ca xanh. `PATH=/usr/bin:/bin` rc=0, stdout rỗng. osascript rc=0 + dòng log |
| AC-4 | đạt | `jq .` hợp lệ, có guard-scope, Notification, Stop. `git diff main -- .claude/settings*.json` 0 byte. shellcheck exit 0 |
| AC-5 | đạt | RG 5 ID, spec → test → feat, criteria 5/5 |
| AC-6 | đạt | WM 6 ID, 11/11 ca, mutation 78.02 ≥ 75, 0 `import` |
| AC-7 | đạt | `comm -12` rỗng; `guard-diff` OK không label cho A, B; CI #10, #11 xanh 4/4; 0 xung đột |
| AC-8 | đạt | `test-lead-time.sh` 8/8; PR #9 RL `lead=54m03s wait=16m22s`, WP `51m47s`; `metrics.md` 13 dòng L7 |
| AC-9 | đạt | lint 0 error/37 warning, typecheck 4/4, test 193 + 49, build exit 0; worktree list 1 dòng; `public` 14 bảng (bảng 14 là `mcp_probe` từ L05), `User` 12, 2 migration |

## Metric
| Metric | Giá trị |
|---|---|
| Lead time A / B / trung vị | 10m41s / 10m46s / 10m43.5s (−79.7% so 52m55s, target ≤ 37m) |
| Wait time A / B | 4m40s / 2m08s (L06 16m22s) |
| Change failure rate | 0/2 (target ≤ 1/2, L06 1/2) |
| Setup / prune | A 21.08 s / 5.84 s, B 8.65 s / 5.07 s |
| WIP tối đa | 3 |
| Xung đột merge | 0 |
| Đợt review | 1 lần cho #10 + #11, 20:35:49 → 20:37:22 (1m33s), 0 blocking; #10 merge 20:36:44 trong đợt |
| Session chờ người | 0 |
| Plan khớp diff | 15/15 = 100% |

```
$ scripts/metrics/lead-time.sh 10 specs/RG/spec.md
spec approved in d445572f at 2026-10-30T13:26:03Z, ready 2026-10-30T13:32:04Z, merged 2026-10-30T13:36:44Z
lead=10m41s wait=4m40s
$ scripts/metrics/lead-time.sh 11 specs/WM/spec.md
spec approved in 556d2e68 at 2026-10-30T13:26:32Z, ready 2026-10-30T13:35:10Z, merged 2026-10-30T13:37:18Z
lead=10m46s wait=2m08s
```

## PR
- A: https://github.com/st-datdo/typing-adventure/pull/10
- B: https://github.com/st-datdo/typing-adventure/pull/11
- Lesson: (mở sau khi chấm)

## Đề xuất BACKLOG
- #20 xong ở PR lesson (chờ user gộp `settings.hooks.json`). #21 xong qua #10. #23 xong qua #11; phần còn lại thành mục mới (homoglyph toàn Cyrillic/Greek, confusables TR39, blocklist có dấu cho tiếng Việt một âm tiết). #24 xong phần cảnh báo register (RG-04); còn route credentials (RL v4) + Redis (#2).

## Vấn đề gặp phải
- Hook rtk rút gọn `git diff` trong vòng lặp scope → `OUT: --- Changes ---` giả; `wc -l <` ra 0. Chạy lại qua `rtk proxy` (mistakes.md, lần 4).
- osascript coi message bắt đầu bằng `-` là option → thêm `--`.
- Harness chặn subagent ghi file REPORT → người điều phối ghi nội dung learner trả về.

## Chưa verify runtime
- `guard-scope`/`notify` chưa chạy trong phiên A, B (settings chưa gộp); scope chỉ kiểm offline. Banner macOS chưa ai nhìn thấy.
- Integration test DB: `auth-leaderboard.int.test.ts` (A), `wordpacks` + `mixed_script` (B).
- CI `guard` của PR lesson đỏ tới khi user gắn `config-change-approved`.

## EX-2 · Hook guard-scope.sh (commit 2e2da9f)
- `.claude/hooks/guard-scope.sh` (PreToolUse Edit|Write|MultiEdit). Scope = `CLAUDE_SCOPE_FILE` nếu khác rỗng, không thì dòng đầu `<git toplevel của cwd>/.wt-scope`. Không có scope → 0; file scope không tồn tại → 2; thiếu `jq` → 2.
- Allowlist: backtick trong `## File thay đổi…` (plan) hoặc dòng `File dự kiến:`/`Test:` (spec); `*` không qua `/`, `**` mọi cấp, entry thư mục → cả cây; `[ ] . ( )` literal (`[...nextauth]` khớp đúng).
- Chuẩn hoá path bằng hàm bash `norm_path` + `cd -P` tổ tiên tồn tại sâu nhất (macOS `realpath` không có `-m`; `/var` → `/private/var`).
- Luôn cho phép: file scope, `specs/**`, `docs/plans/**`, `docs/ai-levelup/**`, path ngoài repo. `.gitignore` thêm `.wt-scope`.
- Kiểm offline AC-2 trên worktree A (người điều phối chạy, `rtk proxy git diff --name-only main...HEAD` → hook): 6/6 file trong scope, vòng lặp in rỗng. Ca âm `typing-adventure/packages/db/prisma/schema.prisma` → `guard-scope: BLOCKED: … outside the scope of specs/RG/spec.md …`, rc=2.
- Lưu ý: không dùng `rtk proxy` thì hook rtk biến `git diff` thành `--- Changes ---` → vòng lặp báo `OUT: --- Changes ---` giả.

## EX-3 · Hook notify.sh (commit 6c0f66d)
- Đọc `hook_event_name`, `message`, `cwd` bằng jq (tách bằng \x1f để giữ field rỗng); thiếu jq → event `no-jq`; JSON hỏng → `invalid-input`.
- `osascript -e 'on run argv' -e 'display notification (item 1 of argv) with title (item 2 of argv)' -e 'end run' -- "$msg" "$title"`; title `Claude · <branch> · <event>`. Thêm `--` vì message bắt đầu bằng `-s` làm osascript exit 2 (Lịch sử v2 của plan).
- Log `${CLAUDE_NOTIFY_LOG:-$HOME/.claude/notify.log}` 1 dòng ≤ 200 ký tự; `trap 'exit 0' EXIT`, stdout/stderr → /dev/null.
- Runtime 20:31:35: `PATH=/usr/bin:/bin … notify.sh` → rc=0, stdout rỗng (log `no-jq`); PATH đầy đủ → log `2026-10-30 20:31:36  Stop  lesson/L07-parallel  Session stopped, waiting for you`, osascript rc=0. Banner: chưa xác nhận bằng mắt.

## EX-4 · guard-bash.sh, BACKLOG #20 (commit 86b7538)
- Chặn thêm: `find … -delete`, `find … -exec|-execdir|-ok|-okdir rm`, `eval` ở vị trí lệnh, `cat|head|tail|less|more|bat` trên `.env`/`.env.*` (cho `.env.example`, cả `< .env`), `bash|sh|zsh|dash|ksh -c '<s>'` → kiểm lại `<s>` 1 cấp. Tách segment thêm theo backtick.
- `settings.hooks.json` (đề xuất): PreToolUse `Edit|Write|MultiEdit` → guard-scope.sh; `Notification`, `Stop` → notify.sh. `.claude/settings*.json` không đổi.

## EX-5 · Self-test (commit 6298902)
`bash .claude/hooks/test-hooks.sh` → `cases: 93, passed: 93, failed: 0, allow-cases passed: 28, leaks: 0` (40 → 93): guard-scope 23, notify 12 (stub osascript: payload `do shell script "touch /tmp/pwn"` nguyên văn trong argv, không trong `-e`), guard-bash +17 (13 chặn, 4 cho qua).

## EX-8 · lead-time.sh, phần script (commit 6b9a834)
- `scripts/metrics/lead-time.sh <pr> <spec-path>`: commits qua `gh api --paginate`, commit đầu có `^Trạng thái: approved` (`git show` hoặc contents API), timeline `ready_for_review` cuối + `merged`. Chưa merge → exit 1; sai tham số/thiếu tool → exit 2.
- `bash scripts/metrics/test-lead-time.sh` → 8/8 (stub gh).
- PR #9: RL `lead=54m03s wait=16m22s`, WP `lead=51m47s wait=16m22s` (khớp L06; cả khi chạy ngoài repo qua contents API).

## Verify chung phần lead
shellcheck hooks + metrics exit 0; `jq . settings.hooks.json` OK; `git diff main -- .claude/settings.json .claude/settings.local.json` 0 byte; `test-guard-diff.sh` 28/28; `check-tdd-commits.sh main HEAD` OK. EX-2..EX-5 + EX-8: 20:25:32 → 20:34:17 (≈ 9 phút), chạy song song với A, B.
