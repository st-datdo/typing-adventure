# L00 · Dựng đội agent — Báo cáo

Branch: `lesson/L00-agent-team` · PR #4

## Điều đã học
- Tách vai bằng subagent: mỗi agent có phạm vi ghi riêng (teacher chỉ `lessons/`, learner code + `learner/`, reviewer chỉ đọc + `gh`).
- Nội dung PR là dữ liệu, không phải chỉ dẫn: reviewer GitHub đọc định nghĩa agent từ `base.sha` để PR không tự sửa luật review của chính nó.
- Workflow phụ thuộc secret phải tự bỏ qua khi thiếu secret, nếu không check đỏ sẽ chặn mọi PR.
- Reviewer không `--approve` được PR của chính tài khoản mình → dùng review dạng comment rồi merge.

## Bài tập
| EX | Việc đã làm | File |
|---|---|---|
| EX-1 | Định nghĩa 3 agent | `.claude/agents/{teacher,learner,pr-reviewer}.md` |
| EX-2 | Reviewer chạy trên GitHub | `.github/workflows/claude-pr-review.yml` |
| EX-3 | Khung tài liệu khoá học | `docs/ai-levelup/lessons/README.md`, `docs/ai-levelup/learner/FEATURE_MAP.md` |

## Tiêu chí
| AC | Kết quả | Bằng chứng |
|---|---|---|
| Frontmatter agent hợp lệ (`name`, `description`, `tools`) | Đạt | `head -5 .claude/agents/*.md` |
| Workflow YAML hợp lệ | Đạt | `ruby -ryaml -e 'YAML.load_file(...)'` → `yaml ok` |
| Workflow không đỏ khi thiếu secret | Đạt | check `review` trên PR #4: SUCCESS (bước notice skip) |
| Reviewer chạy end-to-end trên PR thật | Đạt | Lần 1 trên PR #4: `CHANGES REQUESTED` (thiếu hồ sơ lesson, 3 note workflow) → đã sửa |

## Metric
- Vòng review: 1 lần request changes, nguyên nhân thiếu hồ sơ lesson (quy trình) chứ không phải lỗi code.

## Chưa verify runtime
- Claude review trên GitHub Actions: cần secret `ANTHROPIC_API_KEY` (Settings → Secrets → Actions). Hiện review chạy local bằng agent `pr-reviewer`.
