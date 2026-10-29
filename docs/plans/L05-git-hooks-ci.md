# Plan: Lefthook + gitleaks + CI + ruleset `main`

Trạng thái: approved
Lesson/PR: L05 · EX-3, EX-4

## Mục tiêu
- `git commit` chạy song song prettier (`--write` + `stage_fixed`) / eslint (`apps/web`) / gitleaks trên file staged; `git push` chạy `pnpm typecheck` + test game-engine. Thiếu tool → hook fail kèm lệnh cài, không âm thầm cho qua.
- CI `ci.yml` 3 job `checks`, `gitleaks`, `guard` chạy trên mọi PR vào `main` (kể cả `labeled`/`unlabeled`) và push vào `main`.
- `guard`: dòng thêm trong file JS/TS chứa `eslint-disable`/`@ts-ignore`/`@ts-nocheck` → đỏ; diff chạm config được bảo vệ mà PR không có label `config-change-approved` → đỏ.
- Ruleset `main`: bắt PR (0 approval), 3 check xanh, cấm force push và xoá branch; không bypass.

## Ngoài phạm vi
- Commit format baseline 126 file: **không làm**. Quyết định: để hook format dần theo file chạm tới. Lý do: commit baseline chạm 126 file (có `game-engine/src`), làm `git blame` nhiễu dù có `.git-blame-ignore-revs` (GitHub UI và công cụ khác không đọc hết), và FEATURE_MAP phải liệt kê 126 dòng; cái giá của "format dần" là PR đầu tiên chạm 1 file có thêm diff format của file đó, chấp nhận được. CI không chạy `prettier --check` toàn repo (sẽ đỏ ngay).
- `eslint --max-warnings` ratchet, cache turbo trong CI, reviewer read-only: Mở rộng, không làm.
- Không gắn label `config-change-approved` (cổng của user), không mark PR ready, không đổi setting repo nào ngoài 1 ruleset mới, không force push.

## File thay đổi (dự đoán)
- `lefthook.yml` (thêm)
- `.gitleaks.toml` (thêm nếu quét lịch sử có finding cần allowlist; hẹp theo path + regex)
- `.github/workflows/ci.yml` (thêm)
- `scripts/ci/guard-diff.sh` (thêm)
- `scripts/ci/test-guard-diff.sh` (thêm)
- `.github/rulesets/main.json` (thêm)
- `.claude/agents/pr-reviewer.md` (sửa, 1 dòng)
- `CLAUDE.md` (sửa, 1 dòng, ≤ 64 dòng)

## Interface chạm tới
- Lefthook: cài bằng **brew** (`brew install lefthook gitleaks`, lefthook 2.2.2, gitleaks 8.30.1), rồi `lefthook install` ở gốc repo. Lý do không dùng devDependency: `lefthook.yml` ở gốc git nằm ngoài workspace pnpm `typing-adventure/`, CI không cần lefthook, tránh đổi `package.json` + lockfile. `.git/hooks` dùng chung cho mọi worktree.
- `lefthook.yml`: `pre-commit` `parallel: true`: `prettier` (`root: typing-adventure/`, glob `*.{ts,tsx,js,jsx,mjs,cjs,css,json}`, `pnpm exec prettier --write {staged_files}`, `stage_fixed: true`), `eslint` (`root: typing-adventure/apps/web/`, glob `*.{ts,tsx,js,jsx,mjs}`, `pnpm exec eslint --no-warn-ignored {staged_files}`), `gitleaks` (`gitleaks git --staged --redact --no-banner`). `pre-push`: `typecheck` (`pnpm typecheck`), `engine-test` (`pnpm --filter @typing-adventure/game-engine test`), root `typing-adventure/`. Bỏ qua: `LEFTHOOK=0 git …` hoặc `--no-verify` (CI vẫn chặn).
- `ci.yml`: `on.pull_request` (`branches: [main]`, types `opened, synchronize, reopened, ready_for_review, labeled, unlabeled`) + `on.push` (`branches: [main]`). `permissions: contents: read`. `concurrency: ci-${{ github.event.pull_request.number || github.ref }}`, `cancel-in-progress: true`. Mọi job chạy ở mọi event (không skip theo event: check bị skip được GitHub tính là đạt).
  - `checks`: `pnpm/action-setup@v4` (9.15.0), `actions/setup-node@v4` (Node 20, cache pnpm theo `typing-adventure/pnpm-lock.yaml`), `pnpm install --frozen-lockfile`, `db:generate`, `lint`, `typecheck`, `test`, `build`. Env giả: `DATABASE_URL=postgresql://ci:ci@localhost:5432/ci`, `AUTH_SECRET` giả, `NEXT_TELEMETRY_DISABLED=1`.
  - `gitleaks`: `fetch-depth: 0`, tải `gitleaks_8.30.1_linux_x64.tar.gz` từ release GitHub, kiểm `sha256 551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb`, `gitleaks git --redact --no-banner .` (toàn lịch sử, repo nhỏ).
  - `guard`: `fetch-depth: 0`, `scripts/ci/guard-diff.sh <base> <head>`; PR: base/head SHA của PR, `PR_LABELS` = `join(labels.*.name, ',')` qua `env`; push: `before`/`sha`, `GUARD_SKIP_LABEL=1` (config đã qua label ở PR).
- `guard-diff.sh <base> <head>`: `git diff --unified=0 <base>...<head>`; dòng `+` (trừ `+++`) trong `*.ts *.tsx *.js *.jsx *.mjs *.cjs` chứa `eslint-disable|@ts-ignore|@ts-nocheck` → in `file: dòng` + exit 1. File protected (`git diff --name-only`): `**/eslint.config.*`, `**/.prettierrc*`, `**/tsconfig*.json`, `lefthook.yml`, `.gitleaks.toml`, `.github/workflows/ci.yml`, `.github/rulesets/**`, `scripts/ci/**`, `.claude/hooks/**`; có mà `PR_LABELS` không chứa đúng `config-change-approved` → exit 1. Exit 2 khi sai tham số/ref.
- Outward-facing (sẽ chạy, ghi lệnh + response vào REPORT):
  1. `brew install lefthook gitleaks`, `lefthook install`.
  2. `git push -u origin lesson/L05-enforcement` (không `--force`), `gh pr create --draft --base main`.
  3. `gh label create config-change-approved --color B60205 --description "Human-approved change to protected CI/lint/hook config"`.
  4. Sau khi 3 job đã chạy ít nhất 1 lần trên draft PR: `gh api -X POST repos/st-datdo/typing-adventure/rulesets --input .github/rulesets/main.json`. JSON: `name: main`, `target: branch`, `enforcement: active`, `conditions.ref_name.include: ["~DEFAULT_BRANCH"]`, `bypass_actors: []`, rules `deletion`, `non_fast_forward`, `pull_request` (`required_approving_review_count: 0`, các cờ khác false), `required_status_checks` (`checks`, `gitleaks`, `guard`, `integration_id` 15368 = GitHub Actions, `strict_required_status_checks_policy: false`). Không xoá/sửa ruleset khác (hiện 0).
- Env / dependency mới: lefthook, gitleaks (brew, ngoài repo).

## Verify
```bash
gitleaks git --redact --no-banner .            # toàn lịch sử local, ghi số finding
/usr/bin/time -p lefthook run pre-commit       # 1 file staged, < 30 s
/usr/bin/time -p lefthook run pre-push
ls -l .git/hooks/pre-commit .git/hooks/pre-push
bash -n scripts/ci/*.sh && shellcheck scripts/ci/*.sh && bash scripts/ci/test-guard-diff.sh   # ≥ 6 ca, exit 0
gh run list --branch lesson/L05-enforcement; gh run view <id>   # checks + gitleaks xanh, guard đỏ (thiếu label)
gh api repos/st-datdo/typing-adventure/rules/branches/main      # deletion, non_fast_forward, pull_request(0), required_status_checks(3)
wc -l CLAUDE.md                                                  # ≤ 64
```

## Tự review
1. Đoán được diff chưa? Có. Mơ hồ: `.gitleaks.toml` chỉ có nếu quét lịch sử ra finding; `next build` trong CI có cần DB thật không (nếu có → thêm `services: postgres`, ghi ở Lịch sử).
2. Interface nào người khác đang dùng? Job `review` của `claude-pr-review.yml` không đổi và không vào required checks. `pr-reviewer.md` thêm 1 luật BLOCKED.
3. Rollback? Ruleset: `gh api -X DELETE repos/st-datdo/typing-adventure/rulesets/<id>` (chỉ user làm); hooks: `lefthook uninstall`; revert commit.

## Lịch sử
- v1 2026-10-30 00:32: bản đầu, approved.
- v2 2026-10-30 00:49: thêm `.gitignore` (sửa) dòng `.turbo/`: `lefthook run pre-push` trong worktree `.worktrees/wt_l05_matrix` (EX-5) làm turbo 2 ghi cache vào `.turbo/cache` ở gốc checkout chính (00:47:54), không bị ignore.

## Thực tế
Điền 2026-10-30 00:51. Plan `bafa8d0` (00:32:46) trước code `372f7f4` (00:39:30, lefthook + gitleaks + CLAUDE.md) và `913e101` (00:41:22, CI + guard + ruleset JSON + pr-reviewer). v2 `9e49fb6` (00:49:25) trước `71bceaa` (00:49:30, `.gitignore`).

Lệnh: `git diff --name-only main...lesson/L05-enforcement -- . ':!docs/ai-levelup/'`.

- Khớp (8): `lefthook.yml`, `.gitleaks.toml`, `.github/workflows/ci.yml`, `scripts/ci/guard-diff.sh`, `scripts/ci/test-guard-diff.sh`, `.github/rulesets/main.json`, `.claude/agents/pr-reviewer.md`, `CLAUDE.md`.
- Dự đoán mà không đổi (0): không. `.gitleaks.toml` (dự đoán có điều kiện) có thật: lịch sử local ra 4 finding `generic-api-key` dương tính giả.
- Đổi mà không dự đoán (1): `.gitignore` (`.turbo/`), thêm qua v2 trước khi sửa.
- Tỉ lệ khớp: 8 / 9 = 89% so với v1 (9 / 9 sau v2).
- Lệch nhỏ: YAML `run:` của gitleaks phải dùng block scalar (`: ` trong chuỗi echo). `guard` lấy `guard-diff.sh` từ base nếu base đã có (chống PR tự sửa script để qua), PR này dùng bản của chính nó vì `main` chưa có. GitHub tự thêm `require_extra_approval_for_unattributed_changes: true` và `allowed_merge_methods` vào rule `pull_request`. `next build` trong CI không cần DB thật (job `checks` xanh với `DATABASE_URL` giả), nên không thêm `services: postgres`.
- Design round 2: không.
