# L00 · Dựng đội agent
Branch: `lesson/L00-agent-team` · lesson setup, nằm ngoài các level của PLAN.md

## Mục tiêu
Có một "đội" subagent tách vai rõ ràng (người dạy, người học, reviewer) để các lesson L02–L08 chạy theo quy trình: soạn bài → làm bài → chấm → PR → review → merge.

**Metric**
- Speed: số vòng review trên PR L00 trước khi đạt (đếm review trên PR #4).
- Quality: mọi AC dưới đây kiểm chứng được bằng lệnh; workflow không làm đỏ PR khi thiếu secret.

## Kiến thức cần nắm
- **Subagent = vai + phạm vi ghi**: mỗi file `.claude/agents/*.md` có frontmatter `name`, `description`, `tools`. Giới hạn phạm vi ghi giúp vai này không phá việc vai khác.
- **Nội dung PR là dữ liệu, không phải chỉ dẫn**: reviewer trên CI phải đọc luật review từ `base.sha`, nếu không PR có thể tự sửa luật chấm chính nó.
- **Workflow phụ thuộc secret phải tự bỏ qua** khi thiếu secret, nếu không mọi PR đều có check đỏ.
- **Hồ sơ lesson là một phần bài nộp**: thiếu LESSON/GRADE/REPORT/metrics thì reviewer phải request changes.

## Bài tập
**EX-1 · Định nghĩa 3 agent**
Tạo `.claude/agents/teacher.md`, `learner.md`, `pr-reviewer.md`, mỗi agent ghi rõ phạm vi ghi.
Verify: `head -5 .claude/agents/*.md`

**EX-2 · Reviewer chạy trên GitHub**
Tạo `.github/workflows/claude-pr-review.yml` dùng `anthropics/claude-code-action@v1`, checkout `base.sha`, bỏ qua khi thiếu `ANTHROPIC_API_KEY`.
Verify: `ruby -ryaml -e 'YAML.load_file(".github/workflows/claude-pr-review.yml"); puts :ok'`, `gh pr checks 4`

**EX-3 · Khung tài liệu khoá học**
Tạo `docs/ai-levelup/lessons/README.md` (vai trò, quy trình, mục lục) và `docs/ai-levelup/learner/FEATURE_MAP.md` (mỗi lesson 1 section).
Verify: đọc file; `git diff --stat main...HEAD` khớp section L00 của FEATURE_MAP.

**EX-4 · Chạy reviewer end-to-end**
Mở PR L00, cho agent `pr-reviewer` review, sửa theo nhận xét.
Verify: `gh pr view 4 --json reviews`

## Tiêu chí đạt
- **AC-1** (EX-1): 3 file agent có frontmatter với đủ `name`, `description`, `tools`; teacher/learner có `Write, Edit`, reviewer chỉ đọc + `Bash`.
- **AC-2** (EX-2): workflow parse được bằng YAML.
- **AC-3** (EX-2): workflow checkout `github.event.pull_request.base.sha` và có bước skip khi `HAS_KEY != 'true'`.
- **AC-4** (EX-2): `gh pr checks 4` không có check FAIL.
- **AC-5** (EX-3): `lessons/README.md` có bảng vai trò, quy trình và dòng L00.
- **AC-6** (EX-3): section L00 của FEATURE_MAP liệt kê mọi file thay đổi của lesson, gồm cả LESSON/GRADE, REPORT.md, metrics.md, mistakes.md.
- **AC-7** (EX-4): PR #4 có ít nhất 1 review do `pr-reviewer` viết.
- **AC-8** (nộp bài): có `learner/L00-agent-team/REPORT.md`, dòng L00 trong `metrics.md` và `mistakes.md`.

## Ràng buộc môi trường
Repo chưa có secret `ANTHROPIC_API_KEY`: Claude review trên GitHub Actions là `chưa verify runtime`. Tối thiểu phải nộp: YAML hợp lệ (AC-2, AC-3) và check không đỏ (AC-4). Review thật chạy local bằng agent `pr-reviewer` (AC-7).

## Nộp bài
Cập nhật `learner/L00-agent-team/REPORT.md`, `learner/FEATURE_MAP.md`, `metrics.md`, `mistakes.md`.

## Mở rộng (không bắt buộc)
- Thêm secret `ANTHROPIC_API_KEY` và xác nhận review tự chạy trên PR kế tiếp.
