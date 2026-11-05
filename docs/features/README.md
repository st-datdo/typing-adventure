# docs/features

Mỗi tính năng chạy qua `/feature <mô tả>` có một thư mục `docs/features/<slug>/` trên branch `feature/<slug>`:

| File | Agent | Nội dung |
|---|---|---|
| `01-requirements.md` | `ba` | User stories, AC Given/When/Then có ID `<ID>-NN`, edge cases, câu hỏi còn mở |
| `02-design.md` | `designer` | Luồng UI/UX, màn hình, component, loading/empty/error, key i18n vi/en |
| `03-tech-plan.md` | `ptl` | Hướng tiếp cận, `## File thay đổi`, DB/API, rủi ro, task TDD có thứ tự |
| `04-qc-report.md` | `qc` | PASS/FAIL từng AC kèm bằng chứng, theo từng vòng |

Test trích AC ID (`<ID>-NN`) trong tên test giống quy ước `specs/<ID>/spec.md`. `03-tech-plan.md` dùng được làm `CLAUDE_SCOPE_FILE` cho `.claude/hooks/guard-scope.sh`.
