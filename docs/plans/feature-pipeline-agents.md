# Plan: Pipeline multi-agent BA → Designer → PTL → DEV → QC → PR

Trạng thái: approved
Lesson/PR: không

## Mục tiêu
- `/feature <mô tả>` tạo branch `feature/<slug>`, chạy BA → Designer → PTL (tóm tắt sau mỗi bước), dừng chờ người duyệt, rồi DEV → QC (tối đa 3 vòng sửa), QC PASS thì push và mở PR link tới `docs/features/<slug>/`.
- 5 subagent có giới hạn ghi file bằng hook (không chỉ bằng lời dặn): BA/Designer/PTL chỉ ghi `docs/features/**`, QC chỉ ghi file test + `docs/features/**`.

## Ngoài phạm vi
- Không đổi các agent hiện có (implementer, test-writer, issue-runner, pr-reviewer, teacher, learner).
- Không tự merge PR, không tự gắn label.

## File thay đổi (dự đoán)
- `.claude/agents/ba.md` (thêm)
- `.claude/agents/designer.md` (thêm)
- `.claude/agents/ptl.md` (thêm)
- `.claude/agents/dev.md` (thêm)
- `.claude/agents/qc.md` (thêm)
- `.claude/commands/feature.md` (thêm)
- `.claude/hooks/role-scope.sh` (thêm)
- `.claude/hooks/guard-scope.sh` (sửa: luôn cho ghi `docs/features/**`)
- `.claude/hooks/test-hooks.sh` (sửa: case cho role-scope + docs/features)
- `docs/features/README.md` (thêm)
- `CLAUDE.md` (sửa)

## Interface chạm tới
- Hook: `role-scope.sh <docs|qc>` đọc JSON PreToolUse, exit 2 khi ghi ngoài phạm vi.
- Env / dependency mới: không.

## Verify
```bash
bash .claude/hooks/test-hooks.sh   # failed: 0
```

## Tự review
1. Đoán được diff chưa? có.
2. Interface nào người khác đang dùng? guard-scope.sh (settings.hooks.json, CI self-test).
3. Rollback thế nào? revert commit.

## Lịch sử
- v1 2026-11-05 22:50: bản đầu.
