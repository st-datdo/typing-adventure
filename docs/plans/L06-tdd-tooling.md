# Plan: Spec template, test-writer/implementer, CI chặn `feat:` sửa test, vá guard

Trạng thái: approved
Lesson/PR: L06 · EX-1, EX-2, EX-3, EX-7

## Mục tiêu
- Feature mới bắt đầu từ `specs/<ID>/spec.md` (template ở `specs/_template.md`), đi qua `test:` đỏ → `feat:` xanh.
- 2 agent `test-writer` (chỉ ghi file test, cite ID) và `implementer` (không ghi file test).
- CI chặn commit `feat:` chạm file test (`scripts/ci/check-tdd-commits.sh`, chạy trong job `guard`, lấy script từ base nếu có).
- `guard-diff.sh` bảo vệ thêm `.github/workflows/*`, `.github/actions/*`, `turbo.json`, `.claude/settings*.json`, `.claude/agents/pr-reviewer.md` và `scripts` của mọi `package.json`; 4 self-test chạy trong job `checks` (BACKLOG #15, #18).

## Ngoài phạm vi
- Plan riêng cho 2 feature RL/WP: **không viết**. Quyết định: `specs/RL/spec.md` và `specs/WP/spec.md` có mục "File dự kiến" + "Ngoài phạm vi" + "Hành vi không đổi", đủ vai trò plan; commit `docs(spec)` trước `test:`.
- Không thêm required check mới vào ruleset (check TDD nằm trong job `guard` đã required). Không đổi ruleset (#16), không pin action theo SHA (#19), devcontainer lefthook (#17).
- Không gắn label `config-change-approved`, không push/mở PR tới khi người điều phối báo (sau khi #8 merge và rebase).
- Không chặn `fix:` sửa cả test và code: bug fix cần test hồi quy đi cùng bản sửa trong một commit nguyên tử; chỉ `feat:` mới có cặp `test:` đi trước.

## File thay đổi (dự đoán)
- `specs/_template.md` (thêm)
- `CLAUDE.md` (sửa, 1 dòng, ≤ 64)
- `.claude/agents/test-writer.md`, `.claude/agents/implementer.md` (thêm)
- `scripts/ci/check-tdd-commits.sh`, `scripts/ci/test-check-tdd-commits.sh` (thêm)
- `scripts/ci/guard-diff.sh`, `scripts/ci/test-guard-diff.sh` (sửa)
- `.github/workflows/ci.yml` (sửa: job `guard` thêm bước TDD, job `checks` thêm 4 self-test)

## Interface chạm tới
- `check-tdd-commits.sh <base> <head>`: `git rev-list --no-merges --reverse base..head`; subject khớp `^feat(\([^)]*\))?!?:` và có file (`git diff-tree --no-commit-id --name-only -r --no-renames`) khớp mẫu test → in `<sha12> <subject>: <file>`, exit 1. Mẫu test (giống `test-writer.md`): `*__tests__/*`, `*.test.ts`, `*.test.tsx`, `*.int.test.ts`, `*e2e/*.spec.ts`. Exit 2 khi sai tham số/ref.
- `ci.yml` `guard`: bước "Use guard scripts from base" lấy cả `guard-diff.sh` và `check-tdd-commits.sh` từ base (từng file; base chưa có → bản trong PR), bước mới `Check TDD commit order` chạy cho PR (`base.sha`..`head.sha`) và push (`before`..`sha`). Push đầu branch (`before` = 0000…) → script exit 2; chỉ chạy push trên `main` nên `before` luôn có.
- `ci.yml` `checks`: sau `pnpm install`, 4 bước `working-directory: .`: `bash .claude/hooks/test-hooks.sh`, `bash scripts/ci/test-guard-diff.sh`, `bash scripts/ci/test-check-tdd-commits.sh`, `bash scripts/lib/test-pg.sh`. Runner ubuntu có sẵn `jq`, `git`, `ps`; `test-pg.sh` dùng stub `psql` nên không cần psql thật; `test-hooks.sh` gọi prettier/eslint qua `pnpm exec` (sau install). Không cần `shellcheck` (không self-test nào gọi). Nếu thiếu tool lộ ra trên runner → cài có pin, ghi Lịch sử.
- `guard-diff.sh`: thêm mẫu `.github/workflows/*`, `.github/actions/*`, `turbo.json`, `*/turbo.json`, `.claude/settings*.json`, `.claude/agents/pr-reviewer.md`. Với mỗi `package.json`/`*/package.json` trong diff: `git show <merge-base>:f | jq -S .scripts` so với `<head>:f` (file không có → `null`), khác → protected. Thêm devDependency → không protected. Cần `jq` (runner có).
- Env / dependency mới: không.

## Verify
```bash
bash -n scripts/ci/*.sh && shellcheck scripts/ci/*.sh
bash scripts/ci/test-check-tdd-commits.sh            # ≥ 6 ca, exit 0
bash scripts/ci/check-tdd-commits.sh lesson/L05-enforcement HEAD   # exit 0
bash scripts/ci/test-guard-diff.sh                   # ≥ 20 ca, exit 0
bash .claude/hooks/test-hooks.sh && bash scripts/lib/test-pg.sh
wc -l CLAUDE.md                                      # ≤ 64
```

## Tự review
1. Đoán được diff chưa? Có. Mơ hồ: `test-hooks.sh` trên runner Linux có thể cần tool khác (vd `realpath`), chỉ biết khi CI chạy.
2. Interface nào người khác đang dùng? Job `guard` (required) đổi bước, tên job giữ nguyên nên ruleset không đổi. `guard-diff.sh` mới chỉ có hiệu lực sau merge (guard chạy bản của base).
3. Rollback? Revert commit; PR rollback cũng chạm config được bảo vệ → cần label.

## Lịch sử
- v1 2026-10-30 09:37: bản đầu, approved.

## Thực tế
<điền sau khi code>
