# L00 · Dựng đội agent — Chấm điểm

Ngày chấm: 2026-10-29 · Branch: `lesson/L00-agent-team` · PR #4
Nguồn: [LESSON.md](LESSON.md), [REPORT.md](../../learner/L00-agent-team/REPORT.md), `git diff main...HEAD` + working tree.

| AC | Đạt/Chưa | Bằng chứng |
|---|---|---|
| AC-1 | Đạt | `head -5 .claude/agents/*.md`: cả 3 có `name`/`description`/`tools`; teacher, learner `tools: Read, Grep, Glob, Bash, Write, Edit`; pr-reviewer `tools: Read, Grep, Glob, Bash` |
| AC-2 | Đạt | `ruby -ryaml -e 'YAML.load_file(".github/workflows/claude-pr-review.yml"); puts :ok'` → `ok` |
| AC-3 | Đạt | `claude-pr-review.yml:35` `ref: ${{ github.event.pull_request.base.sha }}`; `:29` `if: env.HAS_KEY != 'true'` → notice skip |
| AC-4 | Đạt | `gh pr checks 4` → Passed 1, Failed 0 |
| AC-5 | Đạt | `lessons/README.md`: bảng Vai trò, Quy trình 6 bước, dòng L00 `#4` |
| AC-6 | Đạt | FEATURE_MAP section L00 liệt kê 3 agent, workflow, README, FEATURE_MAP, `lessons/L00-agent-team/{LESSON,GRADE}.md`, `REPORT.md`, `metrics.md`, `mistakes.md`; khớp `git diff --stat main...HEAD` (6 file) + thay đổi chưa commit |
| AC-7 | Đạt | `gh pr view 4 --json reviews` → 1 review `COMMENTED`, nội dung `## CHANGES REQUESTED` (thiếu hồ sơ lesson) |
| AC-8 | Đạt | `learner/L00-agent-team/REPORT.md` tồn tại; `metrics.md:5` dòng L00; `mistakes.md` thêm dòng 2026-10-29 "Mở PR lesson thiếu LESSON/GRADE/REPORT/metrics" |

## Nhận xét
- Tách vai và phạm vi ghi rõ ràng; workflow đọc luật review từ `base.sha` là điểm tốt về an toàn.
- Vòng review đầu bị request changes vì thiếu hồ sơ lesson (lỗi quy trình), đã được ghi vào `mistakes.md` và checklist của learner.
- Claude review trên Actions vẫn `chưa verify runtime` (thiếu secret `ANTHROPIC_API_KEY`), được LESSON cho phép.
- Lưu ý: các bản sửa sau review (workflow, FEATURE_MAP, README, metrics, mistakes, REPORT, LESSON, GRADE) đang **chưa commit**. Cần commit + push lên PR #4 trước khi reviewer chạy lại.

## Kết luận: PASS
Việc còn lại (không chặn PASS): commit và push các thay đổi chưa commit lên PR #4, rồi cho `pr-reviewer` review lại.
