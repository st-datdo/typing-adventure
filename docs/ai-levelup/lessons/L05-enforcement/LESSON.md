# L05 · Enforcement
Branch: `lesson/L05-enforcement` (từ `main` e193261, đã có L00, L02, L03, L04)

## Mục tiêu
Quy ước của repo được **máy** giữ chứ không phải reviewer nhắc: lỗi format/lint/type/secret bị chặn ở lớp sớm nhất (agent hook → git hook → CI), và `main` chỉ nhận code qua PR có CI xanh.

**Metric** (theo PLAN L5, đo trong lesson này)
- Quality: *ma trận lọt lớp* ở EX-5: 6 vi phạm cố ý, mỗi cái ghi lớp nào chặn. Mục tiêu: lint/type/secret **không** lọt tới CI (bị chặn ở agent hook hoặc git hook); `eslint-disable`/`@ts-ignore` mới và sửa config không label bị CI chặn. Sau review PR L05: số comment cơ học (format/lint/type) của reviewer = 0.
- Speed: thời gian `lefthook run pre-commit` (mục tiêu < 30 s) và `pre-push`, thời gian 1 lần PostToolUse hook trên 1 file, thời lượng run CI (lấy từ `gh run view`). Đo bằng `/usr/bin/time -p` hoặc số GitHub trả về, không ước lượng.
- Process (giữ L03): mỗi task multi-file có plan `approved` commit trước code.

## Hiện trạng repo (đã kiểm khi soạn bài)
- Chưa có `.claude/settings.json` (chỉ `settings.local.json`), chưa có `.claude/hooks/`, chưa có Lefthook/gitleaks (`which` không thấy), `.git/hooks` chỉ có `*.sample`. Có `jq`, `shellcheck`, `gh` (admin `st-datdo`), `uv`, Docker.
- `.github/workflows/` chỉ có `claude-pr-review.yml` (job `review`, bỏ qua khi thiếu `ANTHROPIC_API_KEY`). Chưa có CI build/test. Repo **public**, chưa có ruleset nào (`gh api repos/{owner}/{repo}/rulesets` → 0). Label chỉ có bộ mặc định.
- Scripts `typing-adventure/package.json`: `build`, `lint`, `typecheck`, `test`, `format` (đều qua turbo). Lint: 0 error / 37 warning. Không có `postinstall` chạy `prisma generate`.
- `prettier --check "**/*.{ts,tsx,css,json}"` trong `typing-adventure/` → **126 file chưa đúng format**. Hook "prettier file vừa sửa" sẽ format lại cả file đó.
- `.mcp.json` còn pin `@modelcontextprotocol/server-postgres@0.6.2` (deprecated, BACKLOG #5).
- `scripts/wt-new.sh` và `scripts/wt-prune.sh` có 2 bản `urldecode`/`pg_fields`/`pg_exec` giống nhau; `pg_exec` truyền `PGPASSWORD=…` làm **tham số của `env`** (lộ trong `ps`); `urldecode` dùng `printf '%b'` nên `\n`, `\t`… trong password bị diễn giải; `wt-prune.sh:216` đọc `WT_PRUNE_TEST_MERGED_OIDS` (cửa test nằm trong script chạy thật).

## Kiến thức cần nắm
- **4 lớp, mỗi lớp một việc.** Agent hook (ngay khi agent sửa/chạy lệnh, phản hồi tức thì cho agent) → git hook (trước commit/push, nhanh, chỉ file staged) → CI (nguồn sự thật, không bỏ qua được bằng `--no-verify`) → ruleset (không merge được nếu CI đỏ, không force push). Lớp trước làm vòng sửa ngắn; lớp sau là chốt chặn thật. Hook chỉ là rào chắn, không phải biên bảo mật: agent vẫn có thể `cat .env` qua Bash nếu chỉ chặn tool Read.
- **Hợp đồng hook của Claude Code.** Hook nhận JSON trên stdin (`tool_name`, `tool_input.command` / `tool_input.file_path`, `cwd`). PreToolUse thoát **exit 2** → lệnh bị chặn, stderr được đưa lại cho agent (hoặc in JSON `permissionDecision: "deny"`). PostToolUse exit 2 → báo lỗi cho agent sửa tiếp. Script đặt trong repo, gọi qua `"$CLAUDE_PROJECT_DIR"/.claude/hooks/…`. Test được hoàn toàn bằng `echo '<json>' | script; echo $?`, không cần bật hook.
- **Fail closed, không in secret.** Hook chặn `prisma migrate` vào DB lạ phải tự đọc `DATABASE_URL` (inline trong lệnh, nếu không có thì từ `.env` của checkout đang đứng), chỉ so host, không in URL. Không đọc được host → chặn. Hook Read `.env*` cho qua `.env.example`.
- **Git hook phải nhanh và chỉ chạm file staged.** Lefthook đặt ở gốc git (`lefthook.yml`), lệnh chạy trong `typing-adventure/` bằng `root:`. `{staged_files}` + `stage_fixed: true` cho prettier. `.git/hooks` dùng chung cho mọi worktree (L04). `gitleaks git --staged` (bản mới) / `gitleaks protect --staged` (bản cũ). Thiếu tool thì hook phải báo rõ, không âm thầm cho qua.
- **CI là máy sạch.** Không có `.env` thật, không có Prisma client sinh sẵn: phải `db:generate` trước typecheck/build và cấp env giả (`DATABASE_URL`, `AUTH_SECRET`) cho build. `permissions: contents: read`, `concurrency` hủy run cũ. Check "không thêm `eslint-disable`/`@ts-ignore`" phải xét **dòng thêm** trong `git diff base...head`, không phải toàn repo. Check label cần trigger `labeled`/`unlabeled`. Logic đặt trong script (`scripts/ci/*.sh`) để test được ở local bằng diff mẫu.
- **Ruleset và tên check.** Required status check khớp theo **tên job**; khai báo tên chưa từng chạy thì PR treo mãi. Không require job `review` (nó bỏ qua khi thiếu key). User muốn reviewer agent **tự merge** PR OK, nên ruleset bắt PR + check xanh + cấm force push/xoá branch, nhưng `required_approving_review_count: 0`. Không có bypass actor → mọi thay đổi vào `main`, kể cả docs, đều qua PR. Label `config-change-approved` là cổng của **người**: agent (learner, reviewer) không tự gắn.

## Bài tập

**EX-1 · Plan + rule giờ thật trong plan**
Viết plan (từ `docs/plans/_template.md`) cho các task multi-file của lesson, tối thiểu: `L05-agent-hooks.md`, `L05-git-hooks-ci.md` (Lefthook + CI + ruleset, có mục outward-facing: cài gì, push gì, tạo label/ruleset gì), `L05-script-fixes.md`. Mỗi plan `approved` và commit trước code. Trong cùng commit đầu, sửa mục `## Lịch sử` của `_template.md`: giờ lấy từ `date '+%F %H:%M'` chạy ngay trước khi commit plan (lỗi lặp lần 2 trong `mistakes.md`), cập nhật cột "Đã thành rule" của dòng đó.

**EX-2 · Agent hooks (script + test, chưa bật)**
Tạo `.claude/hooks/`:
- `format-lint.sh` (PostToolUse `Edit|Write|MultiEdit`): file trong `typing-adventure/` có đuôi prettier hỗ trợ → `prettier --write`; file trong `apps/web` đuôi `ts/tsx/js/mjs` → `eslint` file đó; lỗi eslint → exit 2 kèm vài dòng lỗi. File ngoài phạm vi → exit 0 im lặng.
- `guard-bash.sh` (PreToolUse `Bash`): chặn `rm -rf` (mọi biến thể `-rf`/`-fr`/`-r -f`/`--recursive --force`), `git push` có `--force`/`-f`/refspec `+…` (ghi rõ quyết định với `--force-with-lease`), và `prisma migrate|db push|migrate reset|db execute` hoặc `db:migrate|db:push` khi host DB không thuộc `localhost`/`127.0.0.1`/`::1` (thêm `postgres` nếu muốn hỗ trợ devcontainer, ghi lý do).
- `guard-read.sh` (PreToolUse `Read`): chặn `file_path` có basename `.env` hoặc `.env.*`, trừ `.env.example`.
- `test-hooks.sh`: chạy ≥ 20 ca bằng cách pipe JSON, in `PASS/FAIL` từng ca, exit ≠ 0 nếu có ca sai. Có cả ca phải **cho qua** (vd `git push origin lesson/x`, `rm file.txt`, `pnpm --filter @typing-adventure/db db:migrate` với `.env` localhost, Read `.env.example`) và ca DB lạ dùng `.env` **giả** trong thư mục tạm (không đụng `.env` thật).
- `settings.hooks.json`: đoạn `{"hooks": {...}}` đề xuất để user tự gộp vào `.claude/settings.json`.

Không sửa `.claude/settings*.json` (auto-mode chặn agent tự sửa cấu hình của mình, không tìm cách lách). Verify: `bash -n`, `shellcheck`, `bash .claude/hooks/test-hooks.sh`, `jq empty .claude/hooks/settings.hooks.json`, đo thời gian `format-lint.sh` trên 1 file `.tsx`.

**EX-3 · Lefthook + gitleaks**
Cài Lefthook (devDependency trong `typing-adventure/` hoặc brew, chọn và ghi lý do trong plan) và gitleaks (brew). `lefthook.yml` ở gốc repo:
- `pre-commit` (song song): prettier `--write` file staged + `stage_fixed`, eslint file staged của `apps/web`, gitleaks file staged.
- `pre-push`: `pnpm typecheck`, `pnpm --filter @typing-adventure/game-engine test`.
Quyết định cho 126 file chưa format (một commit format riêng có `.git-blame-ignore-revs` và verify typecheck/test/build không đổi, **hoặc** để hook format dần theo file chạm tới) và ghi vào plan. Chạy `gitleaks` một lần trên toàn lịch sử git ở local, ghi số finding; allowlist (`.gitleaks.toml`) chỉ được hẹp theo path + regex, mỗi mục có lý do trong REPORT. Thêm 1 dòng lệnh vào `CLAUDE.md` (hook cài thế nào, bỏ qua bằng gì), giữ ≤ 64 dòng.
Verify: `lefthook run pre-commit` với 1 file staged (đo giờ), `lefthook run pre-push` (đo giờ), `ls .git/hooks/pre-commit .git/hooks/pre-push`.

**EX-4 · CI + ruleset**
- `.github/workflows/ci.yml`, trigger `pull_request` vào `main` (gồm `labeled`, `unlabeled`) và `push` vào `main`. Job tối thiểu: `checks` (pnpm 9.15.0, Node 20, `install --frozen-lockfile`, `db:generate`, lint, typecheck, test, build), `gitleaks`, `guard`. `permissions: contents: read`, có `concurrency`.
- `scripts/ci/guard-diff.sh <base> <head>`: fail khi dòng **thêm** chứa `eslint-disable`, `@ts-ignore`, `@ts-nocheck`; fail khi diff chạm danh sách config được bảo vệ (`eslint.config.*`, `.prettierrc*`, `tsconfig*.json`, `lefthook.yml`, `.gitleaks.toml`, `.github/workflows/ci.yml`, `scripts/ci/**`, `.claude/hooks/**`) mà PR không có label `config-change-approved` (truyền label qua env). Test bằng diff/commit mẫu trong repo tạm (`git init` trong scratchpad), ≥ 6 ca.
- Tạo label `config-change-approved` bằng `gh label create`. Thêm vào `.claude/agents/pr-reviewer.md` 1 dòng: không tự gắn label này; PR chạm config được bảo vệ mà chưa có label → `BLOCKED`.
- Mở **draft PR** sớm để CI chạy thật (draft thì job `review` bỏ qua và reviewer không merge). PR L05 tự chạm config được bảo vệ, nên lần đầu `guard` phải **đỏ đúng lý do**: ghi URL run. Label do người điều phối/user gắn, learner không tự gắn. `checks` và `gitleaks` phải xanh.
- Khi 3 job đã từng chạy: tạo ruleset `main` bằng `gh api -X POST repos/st-datdo/typing-adventure/rulesets` (JSON lưu trong plan hoặc `.github/rulesets/main.json`): target `~DEFAULT_BRANCH`, `enforcement: active`, rule `pull_request` (`required_approving_review_count: 0`), `required_status_checks` (đúng 3 tên job, không có `review`), `non_fast_forward`, `deletion`. Verify **không phá hoại**: `gh api repos/st-datdo/typing-adventure/rules/branches/main` liệt kê đủ rule. Không thử force push lên `main`.

**EX-5 · Ma trận lọt lớp (metric quality)**
Trên 1 branch/worktree nháp (không push), gây 6 vi phạm, mỗi cái riêng: (1) file `.ts` sai format, (2) lỗi eslint, (3) lỗi type, (4) chuỗi giả dạng token sinh ngẫu nhiên (chỉ stage local, không bao giờ commit/push), (5) thêm `// @ts-ignore`, (6) sửa `eslint.config.mjs`. Với (1)–(4): chạy hook agent tương ứng (pipe JSON) và/hoặc `git commit`/`lefthook run`, ghi lớp chặn. Với (5)–(6): chạy `scripts/ci/guard-diff.sh` local và ghi kết quả. Bảng trong REPORT: vi phạm | lớp chặn | lệnh | exit code. Dọn sạch, xoá branch nháp.

**EX-6 · Nợ script từ PR #7**
Gom `urldecode`/`pg_fields`/`pg_exec` vào `scripts/lib/pg.sh` (source từ 2 script). Sửa: password vào env của `psql` mà không xuất hiện trong argv của process nào (`export` trong subshell); `urldecode` giữ nguyên `\` có sẵn trong chuỗi; bỏ `WT_PRUNE_TEST_MERGED_OIDS`, thay bằng stub `gh` trên `PATH` khi test. Verify: `bash -n` + `shellcheck` 3 file; stub `psql` in argv của chính nó → không có password; password giả chứa `\n` và `%5C` decode đúng từng byte (so `od -c`); smoke `wt-new` + `wt-prune` một worktree thật vẫn chạy.

**EX-7 · Thay MCP postgres deprecated (BACKLOG #5)**
Chọn server Postgres MCP còn bảo trì (ghi nguồn, phiên bản, ngày phát hành gần nhất, cách chạy: npx/uvx/docker), pin phiên bản trong `.mcp.json`, vẫn dùng role `mcp_ro`, bật chế độ read-only của server nếu có. Verify: `jq empty .mcp.json`; `claude mcp list` thấy server; 1 `SELECT` được, 1 câu ghi bị chặn (ít nhất bởi role). Không chạy được trong phiên → nộp config + kiểm tra role bằng `psql` và ghi `chưa verify runtime`.

## Tiêu chí đạt
- **AC-1** (EX-1): ≥ 3 plan `L05-*.md` `approved`, mỗi plan commit trước commit code của nó (`git log --reverse main..HEAD`), có `## Thực tế` + tỉ lệ khớp trong `metrics.md`. `_template.md` có lệnh `date '+%F %H:%M'` ở mục Lịch sử; giờ trong Lịch sử các plan L05 không muộn hơn giờ commit của plan đó (`git log -1 --format=%ci -- <plan>`).
- **AC-2** (EX-2): `bash -n` + `shellcheck .claude/hooks/*.sh` sạch; `bash .claude/hooks/test-hooks.sh` exit 0 với ≥ 20 ca, có ≥ 5 ca cho qua; output hook chặn không chứa URL/password (`grep` trên output); `jq empty settings.hooks.json` exit 0, matcher đúng 3 hook. `git diff main -- .claude/settings.json .claude/settings.local.json` rỗng. REPORT ghi activation `chưa verify runtime — cần user bật`.
- **AC-3** (EX-3): `lefthook.yml` ở gốc repo; `.git/hooks/pre-commit`, `pre-push` do Lefthook sinh; `lefthook run pre-commit` < 30 s với ≥ 1 file staged, số giây và giờ `pre-push` ghi trong `metrics.md`; kết quả gitleaks toàn lịch sử (số finding, allowlist nếu có) trong REPORT; `CLAUDE.md` ≤ 64 dòng.
- **AC-4** (EX-4): `ci.yml` có 3 job, `permissions: contents: read`; `scripts/ci/guard-diff.sh` có test ≥ 6 ca exit 0; trên draft PR: `checks` và `gitleaks` xanh, `guard` đỏ khi chưa có label (URL run trong REPORT). Label `config-change-approved` tồn tại; `pr-reviewer.md` có dòng không tự gắn label.
- **AC-5** (EX-4): `gh api repos/st-datdo/typing-adventure/rules/branches/main` có `pull_request` (approvals 0), `required_status_checks` gồm đúng 3 job CI, `non_fast_forward`, `deletion`; JSON ruleset nằm trong repo; REPORT ghi lệnh outward-facing đã chạy.
- **AC-6** (EX-5): bảng 6 vi phạm đủ cột; (1)–(4) bị chặn trước CI; (5)–(6) bị `guard-diff.sh` chặn; `git status` sạch, branch nháp đã xoá; chuỗi giả không có trong `git log -p --all` (`grep -c` = 0).
- **AC-7** (EX-6): `scripts/lib/pg.sh` tồn tại, 2 script không còn định nghĩa `pg_exec`/`urldecode`; `grep -n WT_PRUNE_TEST scripts/` rỗng; stub `psql` argv không chứa password; test decode `\n` / `%5C` đúng; smoke tạo + prune 1 worktree exit 0, không còn schema `wt_%`.
- **AC-8** (EX-7): `.mcp.json` không còn `server-postgres@0.6.2`, phiên bản được pin; role vẫn `mcp_ro`; REPORT có kết quả SELECT/ghi bị chặn hoặc `chưa verify runtime` + kiểm tra role bằng `psql`. BACKLOG #5 trong REPORT đề xuất chuyển `đã xong`.
- **AC-9**: ở checkout chính `rtk proxy pnpm lint && rtk proxy pnpm typecheck && rtk proxy pnpm test && rtk proxy pnpm build` exit 0; lint không tăng warning (≤ 37, trừ khi có commit format baseline thì ghi số mới); `git diff main -- typing-adventure/packages/game-engine/src` rỗng hoặc chỉ là format baseline.

## Ràng buộc môi trường
- **Agent hooks:** agent không được sửa `.claude/settings*.json`. Nộp script + test pipe JSON + `settings.hooks.json`; phần "hook chạy thật trong phiên Claude Code" là `chưa verify runtime — cần user bật`. Không lách bằng cách khác (sửa qua Bash, đổi `CLAUDE_CONFIG_DIR`…).
- **Outward-facing** (phải có trong plan và REPORT): `brew install`, push branch, mở draft PR, `gh label create`, tạo ruleset. Không `--force` push, không xoá/sửa ruleset khác, không gắn label `config-change-approved`, không đổi setting repo ngoài ruleset này.
- Repo public: không push secret thật hay giả. `.env` không in, không `cat`; hook test dùng `.env` giả trong scratchpad.
- Không switch branch ở checkout chính; EX-5 và smoke EX-6 làm trong worktree (`scripts/wt-new.sh`), dọn bằng `wt-prune.sh`.
- Tắt mọi server mình bật bằng PID cụ thể.

## Nộp bài
`docs/ai-levelup/learner/L05-enforcement/REPORT.md` (từng EX: làm gì, lệnh + kết quả rút gọn, giờ thật, URL run CI, `chưa verify runtime` nếu có), section L05 trong `learner/FEATURE_MAP.md` (mọi file, kể cả plan và file teacher), dòng L5 trong `metrics.md` (pre-commit s, pre-push s, hook s/file, CI phút, ma trận x/6 chặn đúng lớp, plan khớp, plan trước code), `mistakes.md` (dòng lặp lần 2 → đã thành rule; dòng `turbo.json` "chờ L5 hook" → cập nhật). PR body link plan, LESSON, GRADE, REPORT và ghi rõ PR cần label `config-change-approved` từ user.

## Mở rộng (không bắt buộc)
- Hook Bash chặn cả `cat|less|head … .env`, hook cho `Grep` vào `.env*`.
- Ratchet warning: `eslint --max-warnings <số hiện tại>` trong CI, giảm dần.
- Reviewer read-only `.claude/agents/reviewer.md` (tools Read/Grep/Glob, chỉ comment blocking) chạy trước khi tự review (PLAN L5 mục 5).
- Cache turbo/pnpm trong CI, đo lại thời lượng.
- Xem [BACKLOG.md](../BACKLOG.md).
