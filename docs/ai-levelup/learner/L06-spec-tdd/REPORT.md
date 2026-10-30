# L06 · Spec + TDD — Báo cáo

Branch: `lesson/L06-spec-tdd`, rebase lên `main` = `b5377bc` (PR #8 đã merge, người điều phối rebase). `BASE=main` (`b5377bc`) cho mọi diff/log; hash trong báo cáo là hash sau rebase. Rebase đặt lại committer date mọi commit thành 10:01:42, nên giờ commit dưới đây là **author date** (`git log --format='%h %ai'`), giữ giờ gốc. Chấm: [GRADE.md](../../lessons/L06-spec-tdd/GRADE.md) PASS. Giờ là giờ máy (`date`, `%ai`, `/usr/bin/time -p`). Phiên bắt đầu 09:35:02, commit code cuối 09:55:09.

## Điều đã học
- Spec có ID biến "xong chưa" thành phép đếm: 14 ID, 14 ID có test cite, `grep` hai phía ra cùng tập. Viết spec trước cũng lộ ra lỗ trong yêu cầu trước khi có code: blocklist mặc định chưa ghim (test integration phải đoán nội dung), và gấp bỏ dấu làm `ngu` chặn luôn `ngủ`/`ngũ`. Cả hai sửa ở spec v2 trước commit `test:`.
- "Đỏ đúng lý do" cần thiết kế import: test gọi `moderateWords` qua `../index` (module có sẵn) nên đỏ là `moderateWords is not a function`. Import `../moderation` (chưa có file) sẽ đỏ vì sai đường dẫn. Không phải ID nào cũng đỏ được: RL-07 (body nguyên vẹn) là test bảo toàn, xanh ngay ở commit `test:`. Ghi ngoại lệ đó trong spec, không bịa ra một test đỏ.
- Tách vai test-writer / implementer chỉ có răng khi máy kiểm: agent definition giới hạn được tool, không giới hạn được path. `check-tdd-commits.sh` đọc từng commit `feat:` và đỏ nếu chạm file test.
- Mutation score đo được thứ coverage bỏ sót. `keyboard.ts` có 0% (193 mutant) dù app dùng nó mỗi phím. Có một bẫy của chính công cụ: mutant làm module crash lúc import được vitest runner báo **Survived**, vì file test lỗi lúc load không sinh "test fail". Import module bên trong test thì crash thành test fail.
- Mặc định an toàn của trusted proxy có cái giá: không tin header thì IP là `unknown`, gộp mọi người vào 1 bucket sẽ tự khoá cả site. Vì vậy spec bỏ trần IP khi `unknown` (RL-06) và chỉ giữ limit theo email.

## Bài tập
| EX | Việc đã làm | File |
|---|---|---|
| EX-1 | Template spec 6 mục (25 dòng). 2 plan `approved` commit riêng `f77e424` (09:37:30), Lịch sử `v1 2026-10-30 09:37` lấy từ `date`. Quyết định ghi trong plan tooling: spec RL/WP có "File dự kiến", không viết plan feature riêng. 1 dòng `CLAUDE.md` (64 dòng) | `specs/_template.md`, `docs/plans/L06-*.md`, `CLAUDE.md` |
| EX-2 | `test-writer.md` (chỉ ghi `**/__tests__/**`, `*.test.ts(x)`, `*.int.test.ts`, `e2e/*.spec.ts`, mỗi `it` bắt đầu bằng ID, phân loại dòng đỏ) và `implementer.md` (cấm ghi file test, test sai thì dừng và báo). `tools: Read, Grep, Glob, Bash, Write, Edit` (cần Write/Edit để ghi test/code, Bash để chạy test + commit) | `.claude/agents/test-writer.md`, `.claude/agents/implementer.md` |
| EX-3 | `check-tdd-commits.sh` + test 10 ca; job `guard` lấy script từ base (base chưa có thì bản trong PR), bước TDD `if: ${{ !cancelled() }}` | `scripts/ci/check-tdd-commits.sh`, `scripts/ci/test-check-tdd-commits.sh`, `.github/workflows/ci.yml` |
| EX-4 | Spec RL (7 ID) → test đỏ → feat; `.env.example` + `DEPLOY_AWS.md` trong commit `feat:` | `specs/RL/spec.md`, `apps/web/src/lib/rate-limit.ts`, `apps/web/src/app/api/auth/[...nextauth]/route.ts`, 2 file test, `.env.example`, `docs/DEPLOY_AWS.md` |
| EX-5 | Spec WP (7 ID) → test đỏ (unit + integration) → feat; integration chạy trong worktree `wt/l06-wp` schema `wt_wt_l06_wp`, đã prune | `specs/WP/spec.md`, `packages/game-engine/src/moderation.ts`, `index.ts`, 2 route wordpacks, 2 file test |
| EX-6 | Stryker 9.6.1 (core + vitest-runner), baseline 65.47% → 77.59% trên cùng 2204 mutant, `break: 77` | `packages/game-engine/{package.json,stryker.config.json}`, `pnpm-lock.yaml`, `.gitignore`, `keyboard.test.ts`, `engine-setup.test.ts` |
| EX-7 | `guard-diff.sh` bảo vệ thêm workflows/actions/turbo/settings/pr-reviewer + so `.scripts` của mọi `package.json`; +13 ca (28 tổng); 4 self-test trong job `checks` | `scripts/ci/guard-diff.sh`, `scripts/ci/test-guard-diff.sh`, `.github/workflows/ci.yml` |
| ngoài EX | Lỗi rtk lặp lần 3 → rule trong `learner.md` | `.claude/agents/learner.md`, `docs/ai-levelup/mistakes.md` |

## Tiêu chí
| AC | Kết quả | Bằng chứng |
|---|---|---|
| AC-1 | Đạt | `specs/_template.md`: `# <ID> · <tên>`, `Trạng thái`, `## Bối cảnh`, `## Requirements` (bảng `ID \| EARS \| Test`), `## Ngoài phạm vi`, `## Hành vi không đổi`, `## Lịch sử`. `git log --reverse $BASE..HEAD`: `f77e424 09:37:30 docs(plans)` trước mọi commit code (`0260e0c` 09:37:35 … `9da1145` 09:53:16). Lịch sử plan `09:37` ≤ `09:37:30`; spec RL v1 `09:40` ≤ `f45b286` 09:40:18, v2 `09:41` ≤ `d716e9c` 09:41:18; WP v1 `09:42` ≤ `1c2dad2` 09:42:34, v2 `09:43` ≤ `49b58f4` 09:43:28. Cả 2 plan có `## Thực tế` (9/9, 5/5). `wc -l CLAUDE.md` → **64** |
| AC-2 | Đạt (gọi qua Agent tool: `chưa verify runtime`) | 2 file có `name`/`description`/`tools`. `test-writer.md`: "Chỉ được ghi file test", "Mỗi `it`/`test` bắt đầu bằng ID". `implementer.md`: "Không được ghi file test", "Test sai … → dừng, báo lại". Bảng `commit \| agent \| ID` ở dưới |
| AC-3 | Đạt | `bash scripts/ci/test-check-tdd-commits.sh` → `cases: 10, passed: 10, failed: 0`, exit 0. `bash scripts/ci/check-tdd-commits.sh main HEAD` → `check-tdd-commits: OK (18 commits in main..HEAD)` (trước commit docs cuối). `ci.yml` job `guard`: vòng `for s in guard-diff.sh check-tdd-commits.sh` lấy từ `$BASE` nếu `git cat-file -e`, bước `Check TDD commit order`. CI PR #9 run [40996093424](https://github.com/st-datdo/typing-adventure/actions/runs/40996093424): bước TDD success, `check-tdd-commits: OK (21 commits in b5377bc..16493e3)` (base chưa có script nên dùng bản trong PR) |
| AC-4 | Đạt | Spec `approved`, 7 ID, có Ngoài phạm vi, Hành vi không đổi, bảng triển khai 4 dòng. `test:` `9ea8dc3` (09:41:08) trước `feat:` `4710f0e` (09:41:59) cho RL-01..07. Dòng đỏ ở bảng dưới (chạy lại tại `9ea8dc3` bằng `git checkout --detach` trong worktree). HEAD: `pnpm --filter @typing-adventure/web test` → `Test Files 5 passed, Tests 35 passed`. `git diff --quiet $BASE -- …/rate-limit.test.ts` → exit 0 (không đổi dòng nào). `grep -c TRUST_PROXY_HEADER .env.example` → 1; `DEPLOY_AWS.md` có biến ở EC2 `.env`, ECS task def, App Runner, checklist và mục "Rate limit và IP client" |
| AC-5 | Đạt | Spec WP `approved`, 7 ID. `moderation.ts`: `grep -c '^import'` → 0 (không React/DOM/Node). `test:` `28897ba` (09:43:36) trước `feat:` `f1e0acd` (09:45:19). Engine: `Test Files 15 passed, Tests 177 passed`. Integration trong worktree: `Tests 12 passed (12)` (6 WP + 6 cũ), test isolation `✓ … runs against the worktree schema, not public`; truy vấn Prisma với `.env` của worktree: `current_schema = wt_wt_l06_wp`. Prune: `wt-prune: removed worktree …`, `dropped schema wt_wt_l06_wp`, `Deleted branch wt/l06-wp`; sau đó `git worktree list` 1 dòng, `count(*) … like 'wt\_%'` → 0 |
| AC-6 | Đạt, 100% | Xem mục "Criteria có test" |
| AC-7 | Đạt | `stryker.config.json` trong repo; baseline 65.47% / 2204 mutant / 96.80 s; cuối **77.59%** / 2204 / 94.71 s; `thresholds.break: 77`, hạ còn **75** sau chấm (`b81c747`, người chấm đo 77.54, lệch 1 mutant do test dùng random); `grep -rn "Stryker disable" typing-adventure/packages` → rỗng (exit 1); `pnpm mutation` → `Final mutation score of 77.59 is greater than or equal to break threshold 77` |
| AC-8 | Đạt (local + CI) | `bash scripts/ci/test-guard-diff.sh` → `cases: 28, passed: 28, failed: 0` (13 ca mới). `ci.yml` job `checks` có 4 bước `Self-test agent hooks / guard-diff / check-tdd-commits / pg lib` sau `pnpm install`. Chạy local cả 4: 41/41, 28/28, 10/10, 9/9. CI PR [#9](https://github.com/st-datdo/typing-adventure/pull/9), run [40996093424](https://github.com/st-datdo/typing-adventure/actions/runs/40996093424) trên `16493e3`: `checks` **pass** (1m27s), log có 4 bước success với `cases: 41, passed: 41 … leaks: 0`, `cases: 28, passed: 28`, `cases: 10, passed: 10`, `cases: 9, passed: 9`; `gitleaks` pass; `guard` **fail** chỉ ở bước `Guard pull request diff`: `using scripts/ci/guard-diff.sh from base b5377bc…`, `guard-diff: FAIL: protected config changed without label config-change-approved` + `ci.yml`, 4 file `scripts/ci/*` (bản L05 của base chưa kiểm `package.json` scripts nên không có dòng đó; không có dòng marker). Bước `Check TDD commit order` success. Guard local trên branch: `guard-diff.sh $BASE HEAD` → `FAIL: protected config changed without label` + `ci.yml`, 4 file `scripts/ci/*`, `game-engine/package.json (scripts changed)` |
| AC-9 | Đạt | `typing-adventure/`, `rtk proxy pnpm <x> --force`: lint exit 0 `0 errors, 37 warnings` (= baseline 37), 3.96 s; typecheck exit 0 `4 successful`, 5.29 s; build exit 0, 27.40 s. `pnpm test` (task `cache: false`; `pnpm test --force` bị pnpm từ chối cờ) exit 0: engine 177, web 35. `test-hooks.sh` → `cases: 41, passed: 41, … leaks: 0`. `git diff --quiet $BASE -- typing-adventure/packages/db` → exit 0; integration chỉ ghi `wt_wt_l06_wp`, schema đã drop |

## Commit theo vai
Agent tool trong phiên này không có type `test-writer`/`implementer` (file mới tạo trong cùng phiên, danh sách type không nạp lại), nên người học làm đúng từng vai bằng tay: commit `test:` chỉ chạm file test, commit `feat:` không chạm file test. `check-tdd-commits.sh` xác nhận. Gọi agent thật: `chưa verify runtime`.

| Commit | Giờ | Vai | ID | File |
|---|---|---|---|---|
| `22df9cc` docs(lessons) | 09:35:21 | (teacher, người học commit hộ) | — | LESSON, BACKLOG, README |
| `f77e424` docs(plans) | 09:37:30 | learner | — | 2 plan |
| `0260e0c` docs(spec) template | 09:37:35 | learner | — | `specs/_template.md`, `CLAUDE.md` |
| `9a4a927` chore(agents) | 09:37:57 | learner | — | 2 agent |
| `2aa86f9` ci(guard) TDD check | 09:38:46 | learner | — | `check-tdd-commits.sh` + test, `ci.yml` |
| `3fa4438` ci(guard) protect + self-test | 09:39:50 | learner | — | `guard-diff.sh` + test, `ci.yml`, test TDD (`core.excludesFile`) |
| `f45b286` docs(spec) RL | 09:40:18 | learner | RL-01..07 | `specs/RL/spec.md` |
| `9ea8dc3` test(web) | 09:41:08 | **test-writer** | RL-01..07 | `trusted-proxy.test.ts`, `credentials-limit.test.ts` |
| `d716e9c` docs(spec) RL v2 | 09:41:18 | learner | RL-07 | ghi chú test bảo toàn |
| `4710f0e` feat(web) | 09:41:59 | **implementer** | RL-01..07 | `rate-limit.ts`, route nextauth, `.env.example`, `DEPLOY_AWS.md` |
| `1c2dad2` docs(spec) WP | 09:42:34 | learner | WP-01..07 | `specs/WP/spec.md` |
| `49b58f4` docs(spec) WP v2 | 09:43:28 | learner | WP-03 | ghim blocklist |
| `28897ba` test(engine,web) | 09:43:36 | **test-writer** | WP-01..07 | `moderation.test.ts`, `wordpacks-moderation.int.test.ts` |
| `f1e0acd` feat(engine,web) | 09:45:19 | **implementer** | WP-01..07 | `moderation.ts`, `index.ts`, 2 route wordpacks |
| `f4221ce` test(engine) | 09:49:15 | **test-writer** (không ID, đặc tả hành vi có sẵn) | — | `keyboard.test.ts`, `engine-setup.test.ts` |
| `24543ea` test(engine) | 09:51:28 | **test-writer** (không ID) | — | `keyboard.test.ts` import trong test |
| `9da1145` build(engine) | 09:53:16 | learner | — | Stryker deps, config, script, lockfile, `.gitignore` |
| `9fa7fb4` chore(engine) | 09:55:09 | learner | — | `thresholds.break` 77, sửa `$schema` |
| `33aae60` docs(learner) | 10:00:58 | learner | — | REPORT, FEATURE_MAP, metrics, mistakes, `learner.md`, Thực tế 2 plan |
| `b81c747` chore(engine) | sau chấm | learner | — | `thresholds.break` 77 → 75 (BACKLOG #26) |
| (commit docs sau chấm) | sau chấm | learner | — | GRADE/README/BACKLOG của teacher, hash sau rebase, URL run CI |

## Dòng đỏ đầu tiên từng ID
RL chạy lại tại `9ea8dc3` (`git -C .worktrees/wt_l06_wp checkout --detach 9ea8dc3`, `vitest run trusted-proxy credentials-limit` → `Tests 11 failed | 7 passed (18)`). WP chạy tại `28897ba` (engine `Tests 18 failed (18)`; integration `Tests 4 failed | 2 passed (6)` trên `wt_wt_l06_wp`).

| ID | Dòng đỏ đầu tiên | Vì sao đúng lý do |
|---|---|---|
| RL-01 | `TypeError: parseTrustProxyHeader is not a function` | Export đúng tên trong spec chưa có; module `../rate-limit` import được |
| RL-02 | `TypeError: parseTrustProxyHeader is not a function` | như trên |
| RL-03 | `TypeError: parseTrustProxyHeader is not a function` | như trên |
| RL-04 | `AssertionError: expected 429 to be 200` (email thứ 2 cùng IP) | Route cũ đếm theo IP: email 2 dùng chung bucket đã hết 10 lượt |
| RL-05 | `AssertionError: expected [ 200, 200, 200, 200, 200, 200, …(24) ] to deeply equal [ 200, …(24) ]` | Lần thứ 11 (email khác) bị 429 vì limit cũ 10/IP, spec cho 30 |
| RL-06 | `AssertionError: expected [ 200, …(29) ] to deeply equal [ 200, …(29) ]` | Không cấu hình mà code cũ vẫn tin `x-real-ip`, gộp 35 email vào trần 10 |
| RL-07 | không đỏ (xanh ngay) | Test bảo toàn: route cũ đã chuyển nguyên request. Ngoại lệ ghi ở spec RL v2; test bắt được nếu `feat:` đọc body trên `req` thay vì `req.clone()` |
| WP-01 | `TypeError: moderateWords is not a function` | Export chưa có; import qua `../index` (có sẵn) |
| WP-02 | `TypeError: moderateWords is not a function`; ca `MAX_WORD_LENGTH`: `expected undefined to be 30` | Export chưa có |
| WP-03 | `TypeError: moderateWords is not a function`; ca default: `Cannot read properties of undefined (reading 'length')` (`DEFAULT_BLOCKLIST` undefined) | Export chưa có |
| WP-04 | `TypeError: moderateWords is not a function` | Export chưa có |
| WP-05 | `AssertionError: expected 200 to be 400` | Route cũ lưu cả `Stupid`, `dog1` |
| WP-06 | `AssertionError: expected [ Array(4) ] to deeply equal [ 'cat', 'ice cream', 'dog' ]` | Route cũ lưu nguyên, không chuẩn hoá/bỏ trùng |
| WP-07 | `AssertionError: expected 200 to be 400`; ca hợp lệ: `expected [ ' star ', 'STAR', 'sky  blue' ] to deeply equal [ 'star', 'sky blue' ]` | PUT cũ không lọc |

Không ID nào đỏ vì cú pháp, sai đường dẫn import, env hay DB: test isolation `current_schema` xanh ở cả commit đỏ.

## Criteria có test (AC-6)
```bash
grep -oE '^\| (RL|WP)-[0-9]+' specs/RL/spec.md | sed 's/| //' | sort -u
# RL-01 RL-02 RL-03 RL-04 RL-05 RL-06 RL-07
grep -rhoE "(RL|WP)-[0-9]+" typing-adventure/apps/web/src/lib/__tests__/trusted-proxy.test.ts \
  "typing-adventure/apps/web/src/app/api/auth/[...nextauth]/__tests__/credentials-limit.test.ts" | sort -u
# RL-01 RL-02 RL-03 RL-04 RL-05 RL-06 RL-07
grep -oE '^\| (RL|WP)-[0-9]+' specs/WP/spec.md | sed 's/| //' | sort -u
# WP-01 WP-02 WP-03 WP-04 WP-05 WP-06 WP-07
grep -rhoE "(RL|WP)-[0-9]+" typing-adventure/packages/game-engine/src/__tests__/moderation.test.ts \
  typing-adventure/apps/web/src/app/api/__tests__/wordpacks-moderation.int.test.ts | sort -u
# WP-01 WP-02 WP-03 WP-04 WP-05 WP-06 WP-07
```
RL 7/7, WP 7/7 → **14/14 = 100%**.

## EX-4: thiết kế RL
- `TRUST_PROXY_HEADER` đọc mỗi request; `parseTrustProxyHeader` trim + lowercase, lạ → `none`. Mặc định `none`: lý do và bảng triển khai trong spec và `DEPLOY_AWS.md` (EC2 + nginx → `x-real-ip`; ECS + ALB, App Runner → `x-forwarded-for`; dev → không đặt).
- Route: IP khác `unknown` → trần 30/15' theo IP (kiểm trước, bị chặn thì không tiêu lượt của email); rồi key `ip|email` 10/15'. Email đọc từ `req.clone().formData()`, lỗi → `''`.
- `getClientIp` cũ giữ nguyên cho `register` (ngoài phạm vi), nên `rate-limit.test.ts` không đổi. Limiter của `register` vẫn tin `x-real-ip`: đề xuất mục BACKLOG mới (dưới).

## EX-5: thiết kế WP
- Thứ tự lý do: `invalid_chars` (rỗng, hoặc ký tự ngoài `\p{L}\p{M}`, dấu cách, `'`, `-`) → `too_long` (> 30 code point sau NFC) → `blocked` → `duplicate`.
- Gấp: `đ/Đ → d` **trước** NFD (NFD không tách `đ`), bỏ `U+0300–U+036F`, lowercase. Khớp cả từ hoặc token, không khớp chuỗi con (`nguyen` qua dù có `ngu`).
- Trùng: so lowercase, **giữ dấu** (`ma`/`mà`/`má` là 3 từ). Route coi `duplicate` là chuẩn hoá (bỏ đi rồi lưu), chỉ 400 khi có lý do khác: khớp câu "từ trùng/khoảng trắng được chuẩn hoá trước khi lưu" của LESSON.
- Va chạm khi bỏ dấu (spec v2): `ngu` chặn `ngủ` (ngủ), `ngũ` (năm); `đần` chặn `đàn`, `dân`. Danh sách mặc định chỉ có `stupid`, `idiot`, `dumb`, `đồ ngốc`. Blocklist tiếng Việt thật cần so có dấu hoặc theo cụm.

## EX-6: Stryker
| Lần | Mutant | Killed + timeout | Survived | No cov | Score | `real` |
|---|---|---|---|---|---|---|
| Baseline (toàn `src/**/*.ts` trừ `index.ts`, `types.ts`, `__tests__`) | 2204 | 1411 + 32 | 702 | 59 | **65.47%** | 96.80 s |
| Sau `f4221ce` | 2204 | 1620 + 36 | 533 | 15 | 75.14% | 97.20 s |
| Sau `24543ea` | 2204 | 1674 + 36 | 479 | 15 | **77.59%** | 94.71 s |
| `pnpm mutation`, `break: 77` | 2204 | 1674 + 36 | 479 | 15 | 77.59% | 99.15 s |

- Baseline 96.80 s < 15 phút nên giữ toàn phạm vi. Theo file: `keyboard.ts` 0% → 98.96%, `engine.ts` 45.45% → 73.33%, `words.ts` 71.98% → 86.47%, `moderation.ts` 93.33% (4 mutant sống: regex/biên tương đương).
- Phiên bản: `pnpm view @stryker-mutator/vitest-runner@9.6.1 peerDependencies` → `vitest >=2.0.0`, `@stryker-mutator/core 9.6.1`; repo có `vitest@2.1.9`. Không chọn 10.1.1 vì `@stryker-mutator/core@10.1.1` `engines.node >=22`, repo/CI Node 20.
- Test mới là đặc tả hành vi có sẵn, không ID, xanh ngay: layout ngón tay chuẩn từng hàng, nhãn/class phím rộng, `getFingerForKey` (hoa/thường, space, phím lạ); `createInitialState` theo mode (số từ, nguồn từ, custom words thắng lesson/challenge, lesson không có từ khớp thì lấy mọi danh sách, index lạ → lesson 0), state ban đầu đầy đủ, `createStateFromCustomText`. Test dùng random của engine nên chạy 5 lần liên tiếp (`Tests 22 passed` × 5) để chắc không chập chờn.
- Bẫy công cụ: mutant `{ key, finger } → {}` ở `KEYBOARD_ROWS` làm vòng lặp cấp module ném lỗi khi import. Vitest runner không có test nào fail, nên báo Survived ("Ran all tests for this mutant"). Chuyển `import('../keyboard')` vào trong từng test: +54 killed.
- Không vào CI bắt buộc: ~95–99 s mỗi lần (bằng ~80% cả job `checks`), score phụ thuộc test có random. Lý do trong plan.

## EX-7: guard
- Mẫu mới: `.github/workflows/*`, `.github/actions/*`, `turbo.json`, `*/turbo.json`, `.claude/settings*.json`, `.claude/agents/pr-reviewer.md`. `package.json`/`*/package.json`: `jq -S '.scripts // null'` ở merge-base và head (file không có → `null`, JSON hỏng → `unreadable`), khác → `<file> (scripts changed)`. Thiếu `jq` → exit 2 (fail closed).
- 13 ca mới: workflow mới (1), sửa workflow khác `ci.yml` (1), composite action (1), `turbo.json` lồng (1), `.claude/settings.json` (1), `.claude/settings.local.json` (1), `pr-reviewer.md` (1), agent khác không bảo vệ (0), đổi `scripts.test` không label (1) / có label (0), chỉ thêm devDependency + đổi thứ tự khoá (0), package lồng thêm script (1), package mới không scripts (0).
- Danh sách mới chỉ có hiệu lực sau merge (job `guard` chạy script của base). PR L06 tự kiểm bằng test local; trên PR, `guard` sẽ đỏ vì bản L05 đã bảo vệ `ci.yml`, `scripts/ci/*`.

## Metric
- Criteria có test: 14/14 = 100%.
- Mutation: 65.47% → 77.59% (2204 mutant), 94.71–99.15 s mỗi lần.
- QA round trip: RL 0, WP 0 (không có commit `fix:` sau `feat:`; chưa chấm).
- `test:` → `feat:`: RL 51 s, WP 1m43s.
- Plan khớp: 9/9, 5/5. Plan/spec trước code: 4/4.
- `wt-new.sh wt/l06-wp`: real 8.73 s.

## Vấn đề và cách xử lý
- `git diff | git -C <wt> apply` → `No valid patches`: hook rtk viết lại output `git diff`. Dùng `rtk proxy git diff > patch`. Lần thứ 3 rtk làm hỏng output dùng làm dữ liệu → rule trong `learner.md`, dòng trong `mistakes.md`.
- Ca `.claude/settings.local.json` của `test-guard-diff.sh` ra exit 0: gitignore toàn cục của máy bỏ qua file đó trong repo tạm, commit rỗng. Sửa: git trong test chạy với `-c core.excludesFile=/dev/null` (cả `test-check-tdd-commits.sh`).
- `shellcheck` SC2221/SC2222: `*.int.test.ts` thừa vì `*.test.ts` đã khớp. Bỏ mẫu thừa.
- Test lesson ban đầu giả định "Home Row chỉ ra từ hàng giữa": sai, vì không từ nào trong `WORDS` khớp nên engine lấy mọi danh sách. Đổi sang đặc tả đúng hành vi (Top Row có `top` → từ sinh từ ký tự hàng trên; Home Row → mọi danh sách).
- `pnpm test --force` lỗi `Unknown option: 'force'` (pnpm nuốt `test`); `pnpm test` đủ vì task `test` có `cache: false`.

## Lệnh outward-facing
| Giờ | Lệnh | Kết quả |
|---|---|---|
| 09:45 | `pnpm --filter @typing-adventure/game-engine add -D --save-exact @stryker-mutator/core@9.6.1 @stryker-mutator/vitest-runner@9.6.1` | `+99` package, 7.38 s |
| 09:43 / 09:45 | `scripts/wt-new.sh wt/l06-wp` / `scripts/wt-prune.sh wt/l06-wp --into lesson/L06-spec-tdd` | tạo + drop `wt_wt_l06_wp` |
| sau chấm | `git push -u origin lesson/L06-spec-tdd` (sau rebase của người điều phối, không `--force`) | `[new branch]` |
| sau chấm | `gh pr create --draft --base main --head lesson/L06-spec-tdd --title "L06: Spec + TDD"` | https://github.com/st-datdo/typing-adventure/pull/9 |
| sau chấm | `gh pr checks 9 --watch`, rồi `gh pr ready 9` | checks/gitleaks pass, guard fail (thiếu label). Không gắn label |

## Đề xuất trạng thái BACKLOG
- #1 → `đã xong` (L06 `4710f0e`): trusted proxy theo `TRUST_PROXY_HEADER`, mặc định không tin header. Còn lại: limiter `register` vẫn dùng `getClientIp` cũ.
- #3 → `đã xong` (L06 `4710f0e`): key IP + email, trần IP 30.
- #15 → `đã xong sau khi merge` (L06 `3fa4438`): có hiệu lực khi `main` có `guard-diff.sh` mới.
- #18 → `đã xong, chờ CI chạy thật` (L06 `3fa4438`).
- Mục mới đề xuất: `POST /api/auth/register` chuyển sang `getTrustedClientIp` (cùng biến), làm khi spec hoá limiter register.
- Mục mới đề xuất: vitest runner của Stryker báo Survived cho mutant làm module crash lúc import; module có bảng dữ liệu + vòng lặp cấp module nên được test bằng import động.

## Chưa verify runtime
- Gọi `test-writer`/`implementer` qua Agent tool: type không có trong phiên, vai trò làm tay (commit tách `test:`/`feat:`, `check-tdd-commits.sh` OK).
- (Đã verify sau chấm) CI PR #9: 4 self-test chạy được trên runner Ubuntu không cần tool thêm, `pnpm install --frozen-lockfile` với lockfile mới trên Node 20 xanh, bước TDD xanh, `guard` đỏ chỉ vì thiếu label. Không cần commit `fix(ci):`.
- Hành vi header của nginx/ALB/App Runner thật: theo tài liệu và cấu hình nginx trong `DEPLOY_AWS.md`, chưa deploy.
- Danh sách bảo vệ mới của `guard-diff.sh` trên PR thật: chỉ có hiệu lực sau merge.
