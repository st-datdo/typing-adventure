# L07 · Parallel
Branch: `lesson/L07-parallel` (lead: tooling + tổng hợp). Task song song: `l07/rg-register-limit` (A), `l07/wm-moderation-v3` (B), mỗi task 1 worktree, 1 PR riêng vào `main`.

## Mục tiêu
Chạy 2 session agent cùng lúc trên 2 task có spec approved, ở 2 module không chạm nhau. Mỗi session có rào chắn (chỉ sửa file nằm trong spec). Khi session cần người thì có thông báo. Trạng thái xem được trên draft PR. Người review gom theo đợt thay vì bị gọi từng PR.

**Metric** (theo PLAN L7, đo trong lesson này)
- Speed: *lead time* = author date của commit đầu tiên đưa spec về `Trạng thái: approved` → `mergedAt`. L06 (PR #9, `gh api …/pulls/9/commits` + `gh pr view 9`): RL 02:40:18Z → 03:34:21Z = **54m03s**, WP 02:42:34Z → 03:34:21Z = **51m47s**, trung vị ≈ 52m55s. Mục tiêu: trung vị A, B **≤ 37m** (giảm 30%). *PR wait time* = `ready_for_review` → `merged`. L06: 03:17:59Z → 03:34:21Z = **16m22s**, chỉ ghi, không đặt target.
- Quality: *change failure rate* = số task có ≥ 1 lần sửa sau khi PR ready (reviewer chặn, CI đỏ sau ready, hoặc commit `fix:` sau merge) / số task. L06 = 1/2 (RL sửa sau review). Mục tiêu: **≤ 1/2**.
- Ghi thêm: thời gian setup mỗi worktree, WIP tối đa (số task đang làm cùng lúc), số xung đột merge, số lần session phải chờ người.

## Hiện trạng repo (đã kiểm khi soạn bài)
- `register/route.ts` vẫn gọi `getClientIp` (tin `x-real-ip` vô điều kiện), limit 5 lần/15 phút theo IP. Ngoài file này, `getClientIp` chỉ còn được gọi trong `rate-limit.test.ts` (BACKLOG #21). `rate-limit.ts` đã có `parseTrustProxyHeader`, `getTrustedClientIp`, `normalizeEmail`. Spec RL có 9 ID; register nằm trong mục Ngoài phạm vi của RL.
- `moderation.ts` (WP-03) tách token theo dấu cách, nên vẫn lọt các ca ghi ở BACKLOG #23.
- Hook L05: `guard-bash.sh`, `guard-read.sh`, `format-lint.sh`, `test-hooks.sh` (40 `run_case`), `settings.hooks.json` (bản đề xuất, user chưa gộp). Chưa có hook cho Notification/Stop, chưa có hook chặn edit ngoài scope.
- `guard-diff.sh` bảo vệ `.claude/hooks/*`, `scripts/ci/*`, `.github/**`, `.claude/settings*.json`. Không bảo vệ `scripts/metrics/`, `specs/`, `.claude/rules/`.
- `wt-new.sh` luôn kiểm schema bằng `psql`. Không có cờ bỏ DB: Postgres tắt thì script dừng trước khi tạo worktree.

## Kiến thức cần nắm
- **Song song chỉ nhanh khi task tách được.** Hai task cùng sửa một file (kể cả `FEATURE_MAP.md`, `metrics.md`) sẽ xung đột khi merge, và thời gian gỡ xung đột ăn hết phần lợi. Vì vậy chỉ nhận task đã có spec approved và có danh sách file rõ. Tài liệu chung do lead gộp, mỗi task ghi vào file riêng của nó.
- **Scope hook là rào chắn, không phải biên bảo mật.** Hook PreToolUse đọc danh sách "File dự kiến" của spec/plan đang active, và chặn Edit/Write ra ngoài danh sách đó. Mục đích là chặn agent "tiện tay" sửa thêm. Nó không chặn được `bash -c 'echo > file'`. Không có scope thì hook cho qua, để không làm hỏng phiên bình thường.
- **Thông báo phải an toàn và im lặng khi không dùng được.** Nội dung message do agent/tool sinh ra. Ghép chuỗi đó vào `osascript -e "display notification \"$msg\""` là mở đường cho AppleScript injection (`do shell script`). Phải truyền message làm **argv** (`on run argv`). Nếu không có `osascript` thì ghi log và exit 0. Hook Stop/Notification không được làm hỏng phiên.
- **Draft PR là bảng trạng thái.** Mở PR ngay sau commit spec, body có checklist (spec, test đỏ, feat, verify) và cập nhật bằng `gh pr edit`. Người điều phối nhìn `gh pr list` là biết task nào đang chờ ai. CI chạy sớm trên draft nên lỗi môi trường lộ ra ngay từ đầu.
- **Review theo đợt và giới hạn WIP.** Review một lần cho mọi PR đã ready, thay vì bị ngắt sau mỗi PR. Wait time tăng nghĩa là người review đang là nút cổ chai: giảm số task đang mở, đừng mở thêm.
- **Đo bằng dữ liệu có sẵn.** `git log`/`gh api` cho commit và timeline. PR squash-merge làm mất SHA trên `main`, nhưng commit gốc vẫn lấy được qua `gh api repos/{owner}/{repo}/pulls/<n>/commits`.

## Bài tập

**EX-1 · Plan + khởi động song song (lead)**
- `docs/plans/L07-parallel-tooling.md` (`approved`, commit trước code) cho EX-2..EX-5.
- Tạo 2 worktree từ `main`, đo bằng `/usr/bin/time -p`. Nếu `docker info` chạy được: `scripts/wt-new.sh l07/rg-register-limit --base main`. Nếu không: `git worktree add .worktrees/<slug> -b l07/<slug> main`, chép 3 file `.env` bằng `install -m 600` (không `cat`, không in nội dung), rồi `pnpm install --frozen-lockfile --prefer-offline`. Cả hai cách đều phải ghi `.wt-scope` (EX-2) vào gốc worktree.
- Mỗi task (A, B) chạy trong worktree của nó. Thứ tự: commit spec `approved` → push → `gh pr create --draft` (body: checklist + link spec) → `test:` đỏ → `feat:` → verify → `gh pr ready`. Ghi giờ từng mốc bằng `date '+%F %H:%M:%S'`.

**EX-2 · Hook `guard-scope.sh` (lead)**
`.claude/hooks/guard-scope.sh`, PreToolUse `Edit|Write|MultiEdit`, đọc JSON stdin (`tool_input.file_path`, `cwd`):
- Scope: lấy từ `CLAUDE_SCOPE_FILE` nếu có, không thì từ dòng đầu của file `.wt-scope` ở gốc repo của `cwd` (`git rev-parse --show-toplevel`, chạy đúng trong worktree). Giá trị là đường dẫn tới spec/plan. Không có scope → exit 0. Có scope mà file spec/plan không tồn tại → chặn (exit 2) và báo rõ.
- Danh sách cho phép: mọi path trong backtick nằm ở mục `## File thay đổi…` của plan, hoặc trên dòng `File dự kiến:`/`Test:` của spec. Hỗ trợ `*`/`**` và thư mục kết thúc bằng `/`. Path so sánh tương đối với gốc repo, sau khi đã bỏ `./` và `..` (dùng `realpath -m` hoặc tương đương; không cho `../` thoát ra ngoài).
- Luôn cho phép: chính file scope, `specs/**`, `docs/plans/**`, `docs/ai-levelup/**`, và path nằm ngoài gốc repo (scratchpad). Chặn: path trong repo nhưng không có trong danh sách. Thông báo chặn nêu file scope đang dùng và cách sửa (thêm file vào spec, ghi Lịch sử).
- Thêm `.wt-scope` vào `.gitignore` (cạnh `.wt-env`).

**EX-3 · Hook `notify.sh` cho Notification + Stop (lead)**
`.claude/hooks/notify.sh`: đọc `hook_event_name`, `message` (nếu có), `cwd`. Title có tên branch của `cwd`, ví dụ `Claude · l07/rg-register-limit · Stop`. Gửi thông báo bằng `osascript` theo dạng argv (`-e 'on run argv' … "$msg" "$title"`). Mọi lần gọi đều ghi thêm 1 dòng vào `${CLAUDE_NOTIFY_LOG:-$HOME/.claude/notify.log}` (giờ, event, branch, message đã cắt ≤ 200 ký tự). Không có `osascript` hoặc `jq` thì vẫn exit 0. Mọi lỗi đều exit 0, stdout rỗng (Stop hook không được trả JSON `decision`).

**EX-4 · Mở rộng `guard-bash.sh` (BACKLOG #20, lead)**
Chặn thêm: `find … -delete`, `find … -exec rm`, `eval`, `bash|sh|zsh -c '<chuỗi>'` khi chuỗi bên trong vi phạm luật hiện có (kiểm đệ quy 1 cấp), `cat|head|tail|less|more|bat <…>.env*` (vẫn cho `.env.example`). Cập nhật `settings.hooks.json`: thêm `guard-scope.sh` (PreToolUse `Edit|Write|MultiEdit`), `notify.sh` (`Notification`, `Stop`). Chỉ sửa bản đề xuất, **không** sửa `.claude/settings*.json`.

**EX-5 · Self-test hook**
Thêm ca vào `test-hooks.sh` (JSON giả lập qua stdin, repo tạm `git init` trong `mktemp -d`):
- `guard-scope`: ≥ 8 ca. Không có scope → 0; file có trong spec → 0; file glob khớp → 0; file ngoài danh sách → 2; `specs/x/spec.md`, `docs/ai-levelup/…` → 0; `../` thoát ra ngoài repo nhưng trỏ vào file trong repo không có trong danh sách → 2; scope trỏ file không tồn tại → 2; `CLAUDE_SCOPE_FILE` được ưu tiên hơn `.wt-scope`.
- `notify`: ≥ 4 ca, dùng stub `osascript` trên `PATH` để ghi argv ra file. Message có `"`, `\` và `do shell script "touch /tmp/pwn"` phải xuất hiện nguyên văn trong argv, không nằm trong chuỗi `-e`. `PATH` không có `osascript` → exit 0 và log có dòng mới. JSON hỏng → exit 0. Stdout luôn rỗng.
- `guard-bash` (#20): ≥ 8 ca, gồm 6 ca chặn và 2 ca cho qua (`cat .env.example`, `find . -name '*.ts'`).

**EX-6 · Task A `l07/rg-register-limit` (BACKLOG #21, một phần #24)**
Spec mới `specs/RG/spec.md` (≤ 6 ID), làm trong worktree A:
- `POST /api/auth/register` lấy IP bằng `getTrustedClientIp(headers, parseTrustProxyHeader(process.env.TRUST_PROXY_HEADER))`. Header không được tin không được đổi key. Spec phải nói rõ cách xử lý IP `unknown`: chỉ có một bucket 5 lần/15 phút cho **cả site** thì là tự khoá đăng ký (xem cách RL-06 đã làm).
- `IF NODE_ENV=production` mà `TRUST_PROXY_HEADER` trống, `THEN` log cảnh báo **một lần** cho mỗi process (không log mỗi request).
- Bỏ `getClientIp` khi không còn caller. Test của nó được xoá trong commit `test:`, không xoá trong `feat:`.
- File dự kiến (gợi ý): `apps/web/src/app/api/auth/register/route.ts`, `apps/web/src/lib/rate-limit.ts`, test trong `apps/web/src/app/api/auth/register/__tests__/` và `apps/web/src/lib/__tests__/`. Không chạm `packages/`, `.claude/`, `scripts/`.

**EX-7 · Task B `l07/wm-moderation-v3` (BACKLOG #23)**
Spec mới `specs/WM/spec.md` (≤ 6 ID). Thêm 1 dòng Lịch sử vào `specs/WP/spec.md`: WP-03 được thay bởi WM-xx. Làm trong worktree B, chỉ trong `packages/game-engine` + `specs/`:
- Tách token theo `[\s'-]+`. Khớp cụm nhiều từ theo dãy token liên tiếp ở bất kỳ vị trí nào (`thằng đồ ngốc` bị chặn). Khi gấp chữ, bỏ mọi `\p{M}` chứ không chỉ khoảng U+0300–U+036F. Từ chối từ trộn chữ Latin với Cyrillic/Greek bằng lý do mới (vd `mixed_script`). 11 ca người chấm thử ở GRADE L06 (5 chặn, 6 lọt) đều phải có test cite ID.
- Hành vi không đổi: WP-01..07 (trừ phần WP-03 đã thay) và `nguyen` không bị chặn bởi `ngu`. Test WP hiện có chỉ được thêm, không sửa assertion. API `wordpacks` không đổi code: lý do mới tự được đếm theo WP-05.

**EX-8 · Đo lead time + review theo đợt (lead)**
- `scripts/metrics/lead-time.sh <pr> <spec-path>`: đọc commit qua `gh api …/pulls/<pr>/commits`, tìm commit sớm nhất làm spec có `Trạng thái: approved` (đọc bằng `git show <sha>:<path>` nếu có object local, không thì `gh api …/contents/<path>?ref=<sha>`). Lấy `ready_for_review` cuối cùng và `merged` từ timeline. In `lead=<..> wait=<..>`. Self-test `scripts/metrics/test-lead-time.sh` dùng stub `gh` (≥ 3 ca, có ca chưa merge → exit 1 kèm thông báo).
- Chạy lại trên PR #9 ra đúng số L06 ở phần Metric (RL 54m03s, WP 51m47s, wait 16m22s).
- Review theo đợt: khi A và B đều ready, gọi reviewer **một lần** cho cả 2 PR. Ghi giờ bắt đầu và kết thúc. A, B merge trước, sau đó lead chạy `lead-time.sh` cho cả 2 PR, ghi `metrics.md`, gộp FEATURE_MAP rồi mới chuyển PR lesson sang ready.

## Tiêu chí đạt
- **AC-1** (EX-1): plan `approved`, commit trước commit code đầu tiên của lesson. REPORT có bảng `task | branch | worktree | cách tạo (wt-new/git worktree) | setup (s) | PR | giờ spec/draft/test/feat/ready/merge`. `gh pr view <A|B> --json isDraft,createdAt` khớp: draft được mở trong ≤ 10 phút sau commit spec. WIP tối đa ≤ 3.
- **AC-2** (EX-2, EX-5): `bash .claude/hooks/test-hooks.sh` exit 0, ≥ 60 ca, `leaks: 0`. Ở gốc mỗi worktree A, B (trước khi prune), với `.wt-scope` trỏ tới spec của task, lệnh sau phải in rỗng (mọi file trong diff đều nằm trong scope):
  `git diff --name-only main...HEAD | while read f; do jq -cn --arg p "$PWD/$f" --arg d "$PWD" '{tool_input:{file_path:$p},cwd:$d}' | <lesson>/.claude/hooks/guard-scope.sh >/dev/null 2>&1 || echo "OUT: $f"; done`
  Ca âm: ở worktree A, gọi hook với `file_path=$PWD/typing-adventure/packages/db/prisma/schema.prisma` → exit 2.
- **AC-3** (EX-3): stub test ở EX-5 xanh. `printf '{"hook_event_name":"Stop","cwd":"%s"}' "$PWD" | PATH=/usr/bin:/bin .claude/hooks/notify.sh; echo $?` → `0`, stdout rỗng. Chạy thật một lần trên macOS (thấy banner) → REPORT ghi `đã thấy`, nếu không chạy được thì ghi `chưa verify runtime`.
- **AC-4** (EX-4): `jq . .claude/hooks/settings.hooks.json` hợp lệ, có `guard-scope.sh`, `Notification`, `Stop`. `git diff main -- .claude/settings.json .claude/settings.local.json` rỗng. `shellcheck .claude/hooks/*.sh scripts/metrics/*.sh` sạch (nếu có `shellcheck`).
- **AC-5** (EX-6): `specs/RG/spec.md` `approved`, ≤ 6 ID, có Ngoài phạm vi, Hành vi không đổi, Lịch sử. Thứ tự spec → `test:` → `feat:`. REPORT dán dòng đỏ đầu tiên của từng ID. `grep -rn getClientIp typing-adventure/apps/web/src` rỗng (hoặc spec ghi lý do giữ lại). Ở HEAD của A: `pnpm --filter @typing-adventure/web test` xanh, `check-tdd-commits.sh main HEAD` exit 0. Criteria có test 100% (cách đếm như AC-6 L06).
- **AC-6** (EX-7): `specs/WM/spec.md` như AC-5. 11 ca của GRADE L06 đều có test cite ID. `git diff main -- typing-adventure/packages/game-engine/src/__tests__/moderation.test.ts` chỉ có dòng thêm. `moderation.ts` không có `import`. `pnpm --filter @typing-adventure/game-engine test` xanh. `pnpm mutation` ≥ `thresholds.break` (75), ghi score.
- **AC-7** (EX-6, EX-7 tách biệt): `comm -12 <(git diff --name-only main...l07/rg-register-limit | sort) <(git diff --name-only main...l07/wm-moderation-v3 | sort)` rỗng. `scripts/ci/guard-diff.sh main <branch>` exit 0 **không cần label** cho cả A và B. CI của 2 PR (`checks`, `gitleaks`, `guard`) xanh. Hai PR được merge mà không phải gỡ xung đột. Nếu có xung đột, REPORT ghi file, nguyên nhân và cách gỡ.
- **AC-8** (EX-8): `bash scripts/metrics/test-lead-time.sh` exit 0. `scripts/metrics/lead-time.sh 9 specs/RL/spec.md` ra `lead=54m03s wait=16m22s` (định dạng tuỳ chọn, số phải đúng). `metrics.md` có dòng L7 cho lead time A, B (kèm trung vị, so với 52m55s), wait time A, B, change failure rate, setup time, WIP, xung đột, giờ đợt review.
- **AC-9**: trên checkout lesson sau khi rebase lên `main` (đã có A, B), qua `rtk proxy`: `pnpm lint` (0 error, warning ≤ 37), `pnpm typecheck`, `pnpm test`, `pnpm build` exit 0. `git worktree list` chỉ còn checkout chính (A, B đã prune). `public` không bị đổi.

## Ràng buộc môi trường
- **DB/Docker:** nếu Docker tắt khi tạo worktree, dùng `git worktree add` + chép `.env`. Integration test DB (nếu task có) ghi `chưa verify runtime`. Unit test, typecheck, lint vẫn phải xanh. Prune bằng `git worktree remove` + `git branch -d`, hoặc bằng `scripts/wt-prune.sh` nếu worktree đó có schema.
- **Hook chưa bật thật:** agent không sửa `.claude/settings*.json`, nên trong lesson này `guard-scope`/`notify` **không** chạy trong phiên của A, B. Phần runtime ghi `chưa verify runtime`. Phần bắt buộc là self-test (AC-2, AC-3) và lệnh kiểm scope offline ở AC-2. User tự gộp `settings.hooks.json` sau.
- **Label:** PR lesson chạm `.claude/hooks/*` nên `guard` đỏ cho tới khi **user** gắn `config-change-approved`. Agent không gắn label. Task A, B không được chạm file bảo vệ (AC-7).
- **Tài liệu chung:** A, B **không** sửa `FEATURE_MAP.md`, `metrics.md`, `mistakes.md`, `BACKLOG.md`, `lessons/**`. Mỗi task ghi `docs/ai-levelup/learner/L07-parallel/task-<A|B>.md` trong branch của nó, lead gộp vào branch lesson.
- **Outward-facing:** push 3 branch, mở 3 PR (2 task + lesson), gọi reviewer. Không force push. Riêng lần rebase branch lesson thì dùng `--force-with-lease`, do người điều phối quyết.

## Nộp bài
`docs/ai-levelup/learner/L07-parallel/REPORT.md` (từng EX: việc làm, lệnh + kết quả rút gọn, giờ thật; bảng AC-1; dòng đỏ từng ID; URL 3 PR; output `lead-time.sh`; phần `chưa verify runtime`), `task-A.md`, `task-B.md`, section L07 trong `FEATURE_MAP.md` (đủ file trong diff của cả 3 PR), dòng L7 trong `metrics.md`, `mistakes.md` nếu có lỗi lặp. Đề xuất trạng thái BACKLOG #20, #21, #23, #24 (phần cảnh báo) trong REPORT.

## Mở rộng (không bắt buộc)
- Task C (chỉ mở khi A hoặc B đã merge và wait time ≤ 16m): BACKLOG #22 (rule trong `.claude/rules/game-engine.md` + test `await import()` cho `little-content.ts`), hoặc #4 CSP nonce (`middleware.ts`, phát `Report-Only` trước). Mỗi task C cần spec/plan riêng, worktree riêng, PR riêng.
- BACKLOG #25 (check TDD: `vitest*.config.ts`, `src/test/**` tính là file test, bảo vệ `.claude/agents/*.md`) trong PR lesson, vì chạm `scripts/ci/*`.
- BACKLOG #2 (limiter Redis sau interface `RateLimiter`, phần còn lại của #24), #16 (script so `.github/rulesets/main.json` với `gh api`, cần quyền admin của user).
- `lead-time.sh --all` in bảng cho mọi PR có `specs/**` trong diff.
