# Plan: Agent board, issue agent-ready + cổng, review theo rủi ro, agent.yml, siết guard

Trạng thái: approved
Lesson/PR: L08 · EX-1, EX-2, EX-3, EX-5, EX-6

## Mục tiêu
- Người điều phối và user mở `http://127.0.0.1:4317` thấy ngay task nào đang ở làn agent nào (lead, teacher, learner, test-writer, implementer, pr-reviewer, human), trạng thái gì, ở đó bao lâu; có timeline, thanh WIP + cảnh báo > 3, trạng thái kết nối SSE. Dữ liệu từ 1 file JSONL append-only (`tools/agent-board/`).
- Issue gắn `agent-ready` bởi owner mới qua cổng `ready-gate.sh` (owner, < 3 PR `agent/*`, đủ mục template); vai `issue-runner` có danh sách cấm rõ (EX-2).
- Review theo rủi ro tính bằng script theo path (`risk.sh`) + 1 dòng feature map tự sinh mỗi PR (`feature-map.sh`), `pr-reviewer.md` dùng cả hai (EX-3).
- `agent.yml` tĩnh, mọi `uses:` pin SHA 40 ký tự, Dependabot weekly (EX-5). Guard bảo vệ thêm agents/scripts/.github, CI chạy 4 self-test, guard-bash chặn gắn label/sửa label (EX-6).

## Ngoài phạm vi
- Không đụng `typing-adventure/` (playwright trong `apps/web` chỉ được chạy để chụp `board.png`, không sửa).
- Không thêm dependency, không `package.json` cho board. Không sửa `.claude/settings.json`, `.claude/settings.local.json`: chỉ sửa bản đề xuất `settings.hooks.json`, hook adapter chưa chạy thật.
- Không gắn label (`agent-ready`, `config-change-approved`), không thêm secret `ANTHROPIC_API_KEY`, không chạy `agent.yml` trên GitHub.
- EX-4 (code của 3 issue) và EX-7 (metric) không nằm trong plan này: issue có spec/plan riêng ở branch `agent/issue-<n>-<slug>`.
- Board không có auth: chỉ bind `127.0.0.1`, chặn `Host` lạ; không phục vụ qua mạng.

## File thay đổi (dự đoán)
- `docs/plans/L08-autonomous.md` (thêm)
- `tools/agent-board/board-state.mjs` (thêm)
- `tools/agent-board/log-path.mjs` (thêm)
- `tools/agent-board/emit.mjs` (thêm)
- `tools/agent-board/hook-adapter.mjs` (thêm)
- `tools/agent-board/summary.mjs` (thêm)
- `tools/agent-board/simulate.mjs` (thêm)
- `tools/agent-board/server.mjs` (thêm)
- `tools/agent-board/public/index.html` (thêm)
- `tools/agent-board/public/app.js` (thêm)
- `tools/agent-board/public/style.css` (thêm)
- `tools/agent-board/fixtures/l07.jsonl` (thêm)
- `tools/agent-board/test/board-state.test.mjs` (thêm)
- `tools/agent-board/test/emit.test.mjs` (thêm)
- `tools/agent-board/test/hook-adapter.test.mjs` (thêm)
- `tools/agent-board/test/server.test.mjs` (thêm)
- `.claude/hooks/settings.hooks.json` (sửa)
- `.gitignore` (sửa: thêm `.agent-board/`)
- `.github/ISSUE_TEMPLATE/agent-task.yml` (thêm)
- `scripts/agent/ready-gate.sh` (thêm)
- `scripts/agent/test-ready-gate.sh` (thêm)
- `.claude/agents/issue-runner.md` (thêm)
- `scripts/agent/risk.sh` (thêm)
- `scripts/agent/test-risk.sh` (thêm)
- `scripts/agent/feature-map.sh` (thêm)
- `.claude/agents/pr-reviewer.md` (sửa)
- `.github/workflows/agent.yml` (thêm)
- `.github/workflows/ci.yml` (sửa: pin SHA, 4 self-test)
- `.github/workflows/claude-pr-review.yml` (sửa: pin SHA)
- `.github/dependabot.yml` (thêm)
- `scripts/ci/guard-diff.sh` (sửa)
- `scripts/ci/test-guard-diff.sh` (sửa)
- `.claude/hooks/guard-bash.sh` (sửa)
- `.claude/hooks/test-hooks.sh` (sửa)
- `docs/ai-levelup/learner/L08-autonomous/` (thêm: REPORT.md do người điều phối ghi, `board.png`, `events.jsonl`, `feature-map-auto.md`)
- `docs/ai-levelup/learner/FEATURE_MAP.md`, `docs/ai-levelup/metrics.md`, `docs/ai-levelup/mistakes.md` (sửa; mistakes chỉ khi có lỗi lặp)

## Interface chạm tới
- `board-state.mjs` (thuần, không I/O): `STATUSES`, `LANES`, `ACTIVE`, `parseLine(line) → event | null` (null khi JSON hỏng, không phải object, thiếu `ts|task|agent|status`, `ts` không parse được, status lạ, dòng > 2048 byte; `title`/`note`/`branch` cắt ≤ 200 ký tự; agent lạ giữ nguyên tên nhưng `lane = 'other'`; `pr` số nguyên dương hoặc bỏ). `reduce(events, now) → { tasks: {id: {task, agent, lane, status, title, branch, pr, since, history[], durations{status: ms}}}, wip: {agent: n}, active, warnings[], timeline[30 mới nhất] }`; sắp ổn định theo `ts`; WIP đếm task có status ngoài `queued|merged|failed`; `warnings` có `{type:'wip_limit', active, limit:3}` khi active > 3. `summary(events) → { tasks: [{task, intervened, rework, merged}], noIntervention: {ok,total,rate}, noRework: {ok,total,rate} }`.
- `log-path.mjs`: `logPath(env, cwd)` = `AGENT_BOARD_LOG` nếu có, không thì `dirname(abs(git rev-parse --git-common-dir))/.agent-board/events.jsonl` (mọi worktree chung 1 file).
- `emit.mjs --task --agent --status [--title --branch --pr --note]`: dựng event `ts` ISO hiện tại, validate bằng `parseLine`, `appendFileSync` 1 dòng (tạo thư mục), sai → stderr + exit 2.
- `hook-adapter.mjs`: stdin ≤ 1 MB; PreToolUse `Agent|Task` → `running` (agent = `tool_input.subagent_type`), `SubagentStop` → `lead/assigned`, `Notification` → `human/waiting_human`, `Stop` → `lead` (status `assigned`). Task: `#<n>` hoặc `L08-EX<k>` ở đầu `tool_input.description`, không có → `session-<8 ký tự session_id>`. Không ghi `prompt`. Luôn exit 0, stdout rỗng.
- `summary.mjs <file>`: in bảng task + 2 tỉ lệ.
- `server.mjs [--port 4317] [--simulate] [--replay <file>] [--speed <x>]`, export `createBoardServer({port, logFile, simulate, replay, speed})`. HTTP: `GET /` → `index.html`, `/app.js`, `/style.css`, `/state` (JSON reduce), `/events` (SSE: `event: state` lúc kết nối + mỗi lần đổi, `: ping` 15 s). Host khác `127.0.0.1:<port>|localhost:<port>` → 403; route khác → 404; method khác GET → 405. Mọi response có `Content-Security-Policy: default-src 'self'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`. Theo dõi log bằng `fs.watchFile` + đọc từ offset (chỉ phần mới).
- `simulate.mjs`: `scenario()` → danh sách `{at, event}` cho ≥ 4 task chồng lấn theo pipeline L08.
- `public/*`: lưới làn agent × cột status, chỉ `createElement`/`textContent`; nhãn chữ trên mọi trạng thái (không chỉ màu); dark/light theo `prefers-color-scheme`; responsive (màn hẹp → danh sách theo làn).
- `settings.hooks.json`: PreToolUse `Agent|Task` + `SubagentStop` → adapter; `Notification`/`Stop` thêm adapter cạnh `notify.sh`.
- `ready-gate.sh <issue>`, `risk.sh` (stdin path), `feature-map.sh <pr>`: exit/stdout như LESSON EX-2, EX-3.
- Env / dependency mới: `AGENT_BOARD_LOG` (tuỳ chọn). Không thêm package.

## Verify
```bash
node --test tools/agent-board/test/*.test.mjs                       # exit 0
git diff --name-only lesson/L07-parallel...HEAD -- typing-adventure  # rỗng
grep -rnE 'innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(|new Function' tools/agent-board  # rỗng
jq . .claude/hooks/settings.hooks.json && grep -c 'hook-adapter.mjs\|SubagentStop' .claude/hooks/settings.hooks.json
git diff lesson/L07-parallel -- .claude/settings.json .claude/settings.local.json   # rỗng
node tools/agent-board/server.mjs --port 4317 --simulate &  # curl /, /events, Host lạ 403, lsof chỉ 127.0.0.1, kill PID
node tools/agent-board/server.mjs --port 4317 --replay tools/agent-board/fixtures/l07.jsonl --speed 600 &  # /state 3 task merged
bash scripts/agent/test-ready-gate.sh && bash scripts/agent/test-risk.sh && shellcheck scripts/agent/*.sh
bash scripts/ci/test-guard-diff.sh && bash .claude/hooks/test-hooks.sh
docker run --rm -v "$PWD":/repo -w /repo rhysd/actionlint:1.7.7
```

## Tự review
1. Đoán được diff chưa? Có cho EX-1. Mơ hồ: `simulate.mjs` có thể gộp vào `server.mjs`; số ca test của `test-hooks.sh`/`test-guard-diff.sh` tuỳ luật EX-6.
2. Interface nào người khác đang dùng? `pr-reviewer.md`, `guard-diff.sh`, `guard-bash.sh`, `ci.yml` đang chạy thật: luật mới có thể làm đỏ PR lesson (cần label) và chặn lệnh `gh` hợp lệ. Board mới, chưa ai dùng; `emit.mjs` sẽ được người điều phối gọi cho EX-2..EX-7.
3. Rollback thế nào? Revert commit theo EX; board chỉ cần xoá `tools/agent-board/` + `.agent-board/`. Commit chạm file bảo vệ cần label khi revert.

## Lịch sử
- v1 2026-10-30 20:57: bản đầu, approved.
- v2 2026-10-30 21:15: làm rõ interface EX-2, EX-3 trước khi code, không thêm file. `ready-gate.sh` luôn xét đủ 3 điều kiện và in `gate[k] ... PASS|FAIL` cho từng điều kiện rồi mới exit 0/1 (2 = sai tham số), không có biến môi trường/cờ nào bỏ qua điều kiện; owner lấy từ `gh repo view --json owner`; danh sách mục bắt buộc viết cứng trong script, `test-ready-gate.sh` kiểm khớp với `label:` của template; mục có giá trị `_No response_` hoặc rỗng tính là thiếu; body chỉ đi qua `jq`/`awk` từ stdin, không `eval`. `feature-map.sh <pr>` chọn spec `specs/*/spec.md` có status `added` trong PR (không có thì spec đầu tiên trong diff), ID = hàng `| XX-NN |` của spec, "có test cite" = ID xuất hiện ở dòng thêm của file test trong diff; deviation = file ngoài `File dự kiến`/`Test:` của spec, trừ `specs/**`, `docs/plans/**`, `docs/ai-levelup/learner/**` (tài liệu task, PR #11 có `task-B.md`, `specs/WP`). `test-risk.sh` có thêm ca stub `gh` cho `feature-map.sh`.

## Thực tế
- EX-1 (2026-10-30 21:13): 16/16 file dự đoán của EX-1 khớp (14 file `tools/agent-board/**`, `settings.hooks.json`, `.gitignore`), 0 file ngoài dự đoán, thêm `docs/ai-levelup/learner/L08-autonomous/board.png`. Không có design round 2. 38 test `node --test`. Sửa sau screenshot đầu: id task không bị cắt (badge xuống dòng), làn trống ẩn trên màn hẹp.
- EX-2, EX-3, EX-5, EX-6: <điền sau>
