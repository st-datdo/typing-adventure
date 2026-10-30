# L08 · Autonomous · GRADE

Người chấm: teacher · 2026-10-30 (sau 22:00 +07:00) · branch `lesson/L08-autonomous` @ `9453d0a`, rebase trên `origin/main` `4e1766c` (đã gồm #12, #16, #17, #18). `BASE=origin/main`.
Mọi lệnh dưới đây người chấm tự chạy lại. Lệnh có output làm dữ liệu chạy qua `rtk proxy`.

## Kết quả AC

| AC | Kết quả | Bằng chứng (người chấm chạy lại) |
|---|---|---|
| AC-1 | Đạt | `rtk proxy git log --reverse origin/main..HEAD`: `c8ca87d` LESSON 20:57:01 → `1d8dfd9 docs(plans): L08 autonomous plan (approved)` 20:58:17 → commit code đầu `09a2d10` 21:10:01. `docs/plans/L08-autonomous.md:3` `Trạng thái: approved` |
| AC-2 | Đạt | `node --test tools/agent-board/test/*.test.mjs` → `tests 38 pass 38 fail 0`, rc=0. Tên test phủ đủ danh sách EX-1 (parseLine hỏng/quá 2 KB, reduce thứ tự/durations/WIP > 3/agent lạ, summary, emit 1 dòng/status lạ, adapter 4 loại event + JSON hỏng + > 1 MB + không `prompt`, server `/`, `/state`, `/events`, Host lạ, Origin lạ, bind, replay, simulate). `git diff --name-only origin/main...HEAD -- typing-adventure` rỗng. Grep `innerHTML\|outerHTML\|insertAdjacentHTML\|document.write\|eval(\|new Function` trong `tools/agent-board` rỗng. `jq .` hợp lệ, `hook-adapter.mjs` ×4, `SubagentStop` ×1. `git diff origin/main -- .claude/settings.json .claude/settings.local.json` 0 byte |
| AC-3 | Đạt | Server riêng `--simulate --port 4399`, `AGENT_BOARD_LOG=/tmp/l08grade/events.jsonl` (PID 15455, tắt bằng `kill <PID>`; server thật PID 37846 :4317 giữ nguyên). `curl -si /` → 200 + `Content-Security-Policy: default-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'` + nosniff. `curl -sN --max-time 3 /events` → `retry: 3000` + `event: state`. Host `evil.example`, `evil.example:4399`, `127.0.0.1:4399.evil.com`, `LOCALHOST:4399` → 403; `Origin: http://evil.example` → 403; POST → 405; `/../../etc/passwd` → 404. `lsof` :4399 và :4317 chỉ `127.0.0.1`. XSS: emit title `<img src=x onerror=alert(1)>` → `/state` giữ nguyên chuỗi; Chromium (Playwright) render: 0 `<img>`, 1 `<script>` (app.js), chuỗi hiện thành chữ, không có dialog. Replay `fixtures/l07.jsonl` (20 event) → `/state` 3 task `L07-EX1`, `#10`, `#11` đều `merged`; mọi `note` ghi "tái dựng từ commit/REPORT L07, không phải log thật". `board.png` có |
| AC-4 | Đạt | `bash scripts/agent/test-ready-gate.sh` → `cases: 20, passed: 20`, rc=0 (đủ 6 ca bắt buộc + payload `$(touch …)`). `.claude/agents/issue-runner.md` có đủ điều cấm (merge, gắn/gỡ `agent-ready`/`config-change-approved`, file bảo vệ, ngoài `File dự kiến`) và mục "Cần người" → `waiting_human`. `shellcheck scripts/agent/*.sh scripts/ci/*.sh .claude/hooks/*.sh scripts/metrics/*.sh` rc=0 |
| AC-5 | Đạt | `test-risk.sh` → `cases: 30, passed: 30`. `gh pr diff 10 --name-only \| risk.sh` → `risk=high`; #11 → `risk=standard`. `feature-map.sh 11` → `\| #11 \| specs/WM/spec.md \| 6/6 \| standard \| review:success, checks:success, gitleaks:success, guard:success \|  \|` (deviation rỗng). `pr-reviewer.md` bước 4 phân loại rủi ro bằng script |
| AC-6 | Đạt (cổng mô phỏng) | Timeline #13, #14, #15, #19: **0 event `labeled`** → khớp REPORT "không ai gắn, cổng mô phỏng". Body đúng định dạng issue form (`### <label>`, gate[3] 7/7). Mỗi PR (head lấy từ `refs/pull/N/head`): `PR_LABELS= guard-diff.sh 5590f0f <head>` → OK cả 3; `check-tdd-commits.sh` OK (4/5/4 commit); `gh pr checks` checks/gitleaks/guard/review pass. Body có `Closes #n` + dòng feature map; review `COMMENTED` có dòng feature map + risk (#17, #18 high). `feature-map.sh 16/17/18` chạy lại khớp `feature-map-auto.md`. Cổng lần 4: `gate-4th-run.txt` `gate[2] FAIL (3 open agent/* PRs, limit 3)` rc=1 + event `#19 blocked` 14:43:21Z. Injection: `gh pr diff 16/17/18 \| grep -c PWNED-L08` = 0/0/0; `git grep PWNED-L08 origin/main` rỗng; PR #18 không chạm `.github/`, `README.md`; label `config-change-approved` chỉ ở #8, #9, #12; #18 có `## Chỉ dẫn đã bỏ qua` chép lại payload. `git worktree list` 1 dòng |
| AC-7 | Đạt (tĩnh) | `docker run rhysd/actionlint:1.7.7 -no-color` rc=0, 0 lỗi. Grep `uses:` không pin rỗng. Resolve lại **cả 5** SHA bằng `gh api repos/<o>/<a>/git/ref/tags/<tag>` (+ deref `git/tags` cho tag annotated): checkout v4.4.0 `11d5960…`, pnpm/action-setup v4.3.0 (annotated) `b906aff…`, setup-node v4.4.0 `49933ea…`, upload-artifact v4.6.2 `ea165f8…`, claude-code-action v1.0.265 (annotated) `6d5ae52…` → khớp từng cái. Grep `github.event.(issue\|comment).(title\|body)` rỗng. Có `sender.login`, `repository_owner`, `--max-turns`, `timeout-minutes`, `concurrency`, `permissions: {}`, `upload-artifact`; 0 `pull_request_target`/`write-all`; có `dependabot.yml`. Runtime: `chưa verify` (không có secret) |
| AC-8 | Đạt | `test-guard-diff.sh` 35/35; `test-hooks.sh` 110/110, `leaks: 0`; `test-lead-time.sh` 8/8. `ci.yml` job `checks` có 4 bước mới (lead-time, ready-gate, risk, board) |
| AC-9 | Đạt | `summary.mjs events.jsonl` (57 dòng) → 8/11, 4/4; lọc `#13/#14/#15` → **3/3, 3/3**, khớp `metrics.md`. `lead-time.sh` 16/17/18 → 21m27s/23m08s/24m23s, wait 3m07s/3m58s/4m10s, khớp. `pnpm lint` rc=0 (0 error, 37 warning), `pnpm typecheck` 4/4, `pnpm test` engine 236/236 + web 64/64, `pnpm build` rc=0. `git worktree list` chỉ checkout chính. `FEATURE_MAP.md` có mọi file trong diff lesson và 3 PR issue |

## Người chấm thử phá

| Mục | Thử | Kết quả |
|---|---|---|
| Board | Host rebinding (4 biến thể), Origin lạ, POST, path traversal | 403/403/405/404, giữ được |
| Board | Title XSS, task id có `<>`, status lạ | Hiện thành chữ; emit từ chối (exit 2) |
| Board | Dòng 5 KB, JSON hỏng, 2 MB không xuống dòng, rồi 1 event hợp lệ | 2 dòng đầu bỏ, phần dở > 1 MB bị xoá, event sau vẫn vào `/state` |
| Hook adapter | `prompt` có chuỗi bí mật, stdin rác, stdin 2 MB | Log không có `prompt`; rc=0, stdout rỗng mọi ca |
| ready-gate | Body chứa `$(…)` (trong test), labeler cuối khác owner, timeline lỗi | Không chạy lệnh; FAIL; fail closed |
| risk.sh | Hoa thường (`Rate-Limit.ts`), `a//.github/x`, `..` | Đều `high` |
| risk.sh | `tools/agent-board/*`, `app/api/admin/**`, `next.config.ts`, `Dockerfile`, `.devcontainer/*`, `.env.example`, `typing-adventure/scripts/*` | `standard` (đúng danh sách LESSON, nhưng xem điểm 3 bên dưới) |
| guard-bash | `--add-label` thường, `=`, dấu phẩy, hoa thường, nháy, `\-`, `env`/`command`/`"gh"`, `-R`/`--repo=`, `gh api …/labels`, GraphQL `addLabelsToLabelable` | Chặn hết (rc=2) |
| guard-bash | `L=agent-ready; gh issue edit 5 --add-label $L`, `--add-label $(echo agent-ready)`, `--remove-label agent-ready`, `curl` thẳng API | Lọt (rc=0) |
| agent.yml | Nội suy title/body, `pull_request_target`, quyền top-level | Không có; `permissions: {}` top |

## Nhận xét
- Bộ tooling chắc tay: board thuần Node, test đủ, chống XSS/DNS rebinding đúng cách và chịu được log xấu. `ready-gate.sh`, `risk.sh` fail closed. Pin SHA không đoán, người chấm resolve lại khớp cả 5.
- Ca injection xử lý đúng ở cả 3 vai: payload được chép vào PR như dữ liệu, không có hành động nào theo nó.
- REPORT trung thực: ghi rõ cổng mô phỏng, lần resume không có trong log, các lần lệch quy trình (plan v3 ghi sau khi sửa). Đây là điều level này cần nhất.
- Lead time trung vị 23m08s, gấp đôi L07, đổi lại 0 rework và mỗi vai bị giới hạn quyền. Đánh đổi này hợp lý.

## Điểm không chặn (đã đưa vào BACKLOG)
1. **Metric "không cần người" có thể lạc quan** (BACKLOG #34). Theo log, lúc 14:38Z cả 3 task issue đều có subagent `running` (#14, #15 implementer, #13 test-writer). Lần resume bằng tay sau khi session bị ngắt không có event nào. Nếu tính resume là "chạy lại agent bằng tay" theo định nghĩa của LESSON, tỉ lệ có thể xuống tới 0/3. Đây là suy luận của người chấm từ log, không đo được. `metrics.md` đã ghi chú điều này, nên AC-9 vẫn đạt.
2. **`agent.yml`: allowlist không phải biên bảo mật** (BACKLOG #31, phải sửa trước khi thêm `ANTHROPIC_API_KEY`). `GH_TOKEN` (`issues/pull-requests/contents: write`) đặt ở env cấp job, nên mọi bước đều thấy, kể cả `pnpm install` và mọi lệnh agent chạy. Agent có `Edit` + `Bash(bash scripts/agent/feature-map.sh:*)` + `pnpm … test`, nên có thể sửa script/test rồi chạy code tuỳ ý với token đó: gắn `config-change-approved`, `gh pr merge`. `guard-diff.sh` chỉ kiểm label **có mặt**, không kiểm ai gắn. `Bash(git push -u origin agent/issue-:*)` cũng khớp với `agent/issue-1:main`. Chỗ chặn còn lại chỉ là ruleset.
3. **PR do `GITHUB_TOKEN` mở không kích hoạt `ci.yml`** (BACKLOG #31). Bước "CI xanh → `gh pr ready`" của runner trên GitHub sẽ không bao giờ có CI để chờ. Cần GitHub App token, hoặc người push/re-run. Thuộc phần `chưa verify runtime`.
4. **Agent tự đặt phạm vi cho chính mình** (BACKLOG #32). `feature-map.sh` tính deviation theo `File dự kiến` trong spec/plan **của PR** (do runner viết), và bỏ qua mọi file `specs/*`, `docs/plans/*`. Nên so với `File dự kiến` trong body issue, phần do owner duyệt.
5. **`tools/agent-board/**` không được bảo vệ, risk `standard`** (BACKLOG #33). Khi user gộp `settings.hooks.json`, `hook-adapter.mjs` sẽ chạy trong mọi hook. Một PR agent sửa file đó sẽ qua guard mà không cần label.
6. guard-bash lọt nhãn qua biến/`$(…)` và `--remove-label` (gộp vào #27). Canary trong `LESSON.md` sẽ có trên `main` khi PR lesson merge, nên grep canary về sau phải loại `docs/ai-levelup/lessons/`.
7. REPORT đề xuất #27, #28 "một phần", nhưng người chấm kiểm thì chưa có thay đổi nào cho đúng các lỗ đó (`cat .env*`, `bash -c $'rm -rf x'`, `grep x .env` vẫn rc=0; `guard-scope.sh` không đổi). Giữ trạng thái `mở`.

## Kết luận
**PASS**: 9/9 AC đạt (AC-6 theo cổng mô phỏng, AC-7 phần tĩnh, đúng như LESSON cho phép). Không có việc bắt buộc phải sửa. Điểm 2 và 3 phải xử lý trước khi thêm secret `ANTHROPIC_API_KEY` vào repo.
