# Lộ trình bài học AI-Driven Development

Nguồn: [PLAN.md](../PLAN.md). Project thực hành: `typing-adventure/`.
Kết quả của người học: [learner/](../learner/) · mapping feature → file: [FEATURE_MAP.md](../learner/FEATURE_MAP.md) · metric: [metrics.md](../metrics.md) · lỗi lặp: [mistakes.md](../mistakes.md).
Follow-up không chặn từ review: [BACKLOG.md](BACKLOG.md).

## Vai trò
| Vai | Định nghĩa | Ghi vào |
|---|---|---|
| Người dạy | [.claude/agents/teacher.md](../../../.claude/agents/teacher.md) | `docs/ai-levelup/lessons/` |
| Người học | [.claude/agents/learner.md](../../../.claude/agents/learner.md) | code + `docs/ai-levelup/learner/` |
| Reviewer | [.claude/agents/pr-reviewer.md](../../../.claude/agents/pr-reviewer.md) · CI: [claude-pr-review.yml](../../../.github/workflows/claude-pr-review.yml) | review + merge PR |

## Quy trình mỗi lesson
1. Tạo branch `lesson/LNN-<slug>` từ `main`.
2. Người dạy soạn `LNN-<slug>/LESSON.md`.
3. Người học làm bài, viết `learner/LNN-<slug>/REPORT.md`, cập nhật `FEATURE_MAP.md`, `metrics.md`.
4. Người dạy chấm `GRADE.md` (FAIL → người học sửa → chấm lại).
5. Người học commit, push, mở PR vào `main`.
6. Reviewer review; OK → squash merge, chưa OK → người học sửa.

## Mục lục
| Lesson | Level | Branch | PR | Trạng thái | Kết quả |
|---|---|---|---|---|---|
| L00 | Dựng đội agent | `lesson/L00-agent-team` | #4 | đã đạt | [GRADE](L00-agent-team/GRADE.md) |
| L01 | Basic setup | `chore/agent-init` | #1, #3 | đã đạt (trước khoá) | [GUIDE-W0-L1](../GUIDE-W0-L1.md) |
| L02 | Advanced setup | `lesson/L02-advanced-setup` | #5 | đã đạt | [GRADE](L02-advanced-setup/GRADE.md) |
| L03 | Plan-first | `lesson/L03-plan-first` | #6 | đã đạt | [GRADE](L03-plan-first/GRADE.md) |
| L04 | Isolation | `lesson/L04-isolation` | | đã đạt | [GRADE](L04-isolation/GRADE.md) |
| L05 | Enforcement | | | chưa học | |
| L06 | Spec + TDD | | | chưa học | |
| L07 | Parallel | | | chưa học | |
| L08 | Autonomous | | | chưa học | |
