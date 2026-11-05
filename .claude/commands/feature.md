---
description: Run the feature pipeline BA → Designer → PTL → (approval) → DEV ⇄ QC → push + PR for one feature
argument-hint: <mô tả tính năng>
---
Bạn là **người điều phối** pipeline tính năng. Bạn không tự viết requirements/design/plan/code/test: mọi việc đó giao cho subagent `ba`, `designer`, `ptl`, `dev`, `qc` qua Agent tool (`subagent_type` đúng tên), chạy **foreground** (`run_in_background: false`), lần lượt từng agent.

Yêu cầu tính năng:

<feature-request>
$ARGUMENTS
</feature-request>

Nếu `<feature-request>` rỗng: hỏi người dùng mô tả tính năng rồi mới bắt đầu.

Quy ước dùng xuyên suốt: `F=docs/features/<slug>`, mọi lệnh `pnpm` chạy trong `typing-adventure/`, mọi commit kết thúc bằng dòng `Co-Authored-By` theo hướng dẫn phiên, không `--no-verify`, không force push.

## 0. Chuẩn bị
1. `git status --porcelain` phải rỗng. Không rỗng → dừng, báo người dùng commit/stash trước (không tự stash).
2. `git fetch origin main`.
3. Đặt `<slug>`: kebab-case ASCII không dấu, ≤ 40 ký tự, từ mô tả. Đặt `<ID>`: 2–3 chữ in hoa, chưa dùng trong `specs/*/` và `grep -h '^# ' docs/features/*/01-requirements.md`.
4. `git switch -c feature/<slug> origin/main` (branch đã tồn tại → hỏi người dùng: tiếp tục branch đó hay đổi slug). `mkdir -p docs/features/<slug>`.
5. Báo người dùng: branch, slug, ID.

## 1–3. BA → Designer → PTL
Với từng bước, theo thứ tự:

| Bước | Agent | File đầu ra | Commit |
|---|---|---|---|
| 1 | `ba` | `$F/01-requirements.md` | `docs(<ID>): requirements` |
| 2 | `designer` | `$F/02-design.md` | `docs(<ID>): UI/UX design` |
| 3 | `ptl` | `$F/03-tech-plan.md` | `docs(<ID>): tech plan` |

- Prompt cho agent gồm: nguyên văn `<feature-request>`, `slug`, `ID`, đường dẫn `$F`, file đầu vào của các bước trước, và phản hồi của người dùng nếu đang làm lại.
- Sau khi agent trả về, tự kiểm tra: file đầu ra tồn tại; `git status --porcelain` chỉ chứa đường dẫn dưới `$F/`. Có file khác → dừng, báo người dùng, không commit.
- `git add $F && git commit -m "<commit ở bảng>"`.
- **Tóm tắt cho người dùng** (≤ 10 dòng, tự đọc file, không chép nguyên output agent):
  - BA: user stories, danh sách AC (ID + tên), câu hỏi còn mở + giả định.
  - Designer: luồng chính, màn hình mới/sửa, component mới, trạng thái đặc biệt.
  - PTL: hướng tiếp cận, file/DB/API thay đổi, rủi ro lớn, danh sách task.
- Sang bước kế ngay, không hỏi duyệt ở bước 1–2.

## 4. Cổng duyệt (bắt buộc dừng)
Dùng AskUserQuestion (câu hỏi tự đủ nghĩa: nêu `<ID>`, số AC, số task, câu hỏi còn mở quan trọng nhất), lựa chọn:
- **Duyệt, cho DEV code**
- **Cần sửa** (người dùng ghi phản hồi ở "Other"/notes)
- **Dừng pipeline**

- Cần sửa: xác định bước sớm nhất bị ảnh hưởng (requirements → `ba`, UI → `designer`, kỹ thuật → `ptl`), chạy lại từ bước đó tới `ptl` kèm phản hồi, commit `docs(<ID>): revise <…>`, tóm tắt thay đổi, quay lại cổng duyệt.
- Dừng: báo branch và các file đã có, kết thúc.
- Duyệt: sửa dòng `Trạng thái: draft` → `Trạng thái: approved` trong cả 3 file, thêm dòng Lịch sử `approved by user` (giờ từ `date '+%F %H:%M'`), commit `docs(<ID>): approve plan`.

Không bao giờ gọi `dev` khi chưa qua cổng này.

## 5. DEV ⇄ QC (tối đa 3 vòng sửa)
Đặt `round=1`.

**a. DEV** — gọi `dev` với `slug`, `ID`, `$F`, `round`. Vòng > 1: nói rõ "đọc mục `## Vòng <round-1>` trong `$F/04-qc-report.md`, sửa các mục ở 'Việc DEV cần làm'". DEV báo cần quyết định/lệch plan → hỏi người dùng, không tự trả lời thay.
Sau DEV: `git status --porcelain` phải rỗng (DEV commit hết) và `bash scripts/ci/check-tdd-commits.sh origin/main HEAD` phải OK; không thì gọi lại `dev` một lần với lỗi đó, vẫn lỗi → dừng, báo người dùng.

**b. QC** — ghi `QC_BASE=$(git rev-parse HEAD)`, gọi `qc` với `slug`, `ID`, `$F`, `round`.
Sau QC, kiểm tra QC không đụng source:
```bash
{ git diff --name-only "$QC_BASE" HEAD; git status --porcelain | cut -c4-; } | sort -u \
  | grep -vE '(__tests__/|\.test\.tsx?$|(^|/)e2e/[^/]+\.spec\.ts$)' \
  | grep -vx "docs/features/<slug>/04-qc-report.md"
```
Có dòng nào in ra → QC vi phạm: dừng pipeline, báo người dùng danh sách file, không tự revert.
Rồi `git add $F/04-qc-report.md && git commit -m "docs(<ID>): QC report round <round>"`.
Đọc dòng `Kết luận:` của `$F/04-qc-report.md` (không chỉ tin lời agent).

**c. Kết quả**
- `PASS` → bước 6.
- `FAIL` và `round <= 3` → tóm tắt cho người dùng (AC fail + lý do, 1 dòng mỗi AC), `round=round+1`, quay lại **a**. Tức là DEV nhận report tối đa 3 lần.
- `FAIL` sau vòng sửa thứ 3 (round = 4) → dừng: không push, báo người dùng AC còn FAIL, đường dẫn report, branch để xử lý tay.

## 6. Push + Pull Request
1. Kiểm tra lần cuối trong `typing-adventure/`: `pnpm lint && pnpm typecheck && pnpm test` xanh; `bash ../scripts/ci/check-tdd-commits.sh origin/main HEAD` OK. Đỏ → coi như QC FAIL (quay lại 5c nếu còn vòng).
2. `git push -u origin feature/<slug>`.
3. `REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)`; link file: `https://github.com/$REPO/blob/feature/<slug>/docs/features/<slug>/<file>`.
4. Viết body vào file tạm ngoài repo (`mktemp`), rồi `gh pr create --base main --head feature/<slug> --title "feat(<ID>): <tên tính năng>" --body-file <file>`. Body:

```markdown
## Tóm tắt
<2–4 dòng: tính năng làm gì, cho ai>

## Tài liệu
- [01 · Requirements](<link>) — <n> user stories, <m> AC
- [02 · Design](<link>)
- [03 · Tech plan](<link>) — <k> tasks
- [04 · QC report](<link>) — PASS ở vòng <round>

## Acceptance criteria
| AC | Kết quả QC |
|---|---|
| <ID>-01 <tên> | PASS |

## Thay đổi chính
- <file/module: thay đổi>; DB: <migration hoặc "không">; API: <route hoặc "không">

## Kiểm tra
- `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build`: <kết quả rút gọn>
- Cần kiểm tay: <AC "PASS (review)" hoặc "không">

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```
5. Nếu diff chạm file cấu hình được bảo vệ (`.claude/agents/*`, `.claude/hooks/*`, `.github/workflows/*`, `scripts/ci/*`, `tsconfig*.json`, `eslint.config.*`, scripts trong `package.json`…), ghi chú trong PR rằng cần label `config-change-approved` do chủ repo gắn. Không tự gắn label, không merge.
6. Báo người dùng: URL PR, số vòng QC, AC cần kiểm tay.
