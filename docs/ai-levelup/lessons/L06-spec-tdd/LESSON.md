# L06 · Spec + TDD
Branch: `lesson/L06-spec-tdd` (stack trên `lesson/L05-enforcement` = PR #8, chờ label `config-change-approved` rồi merge). Khi #8 đã merge: `git rebase --onto origin/main lesson/L05-enforcement` (người điều phối làm) rồi mới mở PR L06 vào `main`. Trước đó mọi `git diff`/`git log` của lesson dùng `BASE=lesson/L05-enforcement`, không dùng `main`.

## Mục tiêu
Mỗi feature bắt đầu từ một **spec có ID** và đi qua đúng một vòng: test đỏ cite ID → code xanh. Máy kiểm được vòng đó (CI chặn commit `feat:` sửa test), và độ mạnh của test được đo bằng mutation score chứ không bằng coverage.

**Metric** (theo PLAN L6, đo trong lesson này)
- Quality: *criteria có test* = số ID EARS có ≥ 1 test cite ID / tổng ID, mục tiêu **100%** (đếm bằng `grep`, cách đếm ở AC-6). *Mutation score* `packages/game-engine` (phạm vi đã chọn ở EX-6): baseline và sau khi nâng, mục tiêu **> 70%**, kèm thời gian chạy.
- Speed: *QA round trip* mỗi feature = số lần quay lại sửa sau khi commit `feat:` (commit `fix:` cùng ID trước khi chấm, cộng FAIL ở GRADE), mục tiêu **≤ 1**. Ghi giờ `test:` → `feat:` mỗi spec (lấy từ `git log --format=%ci`).
- Process (giữ L03–L05): task multi-file có plan `approved` commit trước code; hook/CI của L05 vẫn xanh.

## Hiện trạng repo (đã kiểm khi soạn bài)
- Test: `game-engine` 137 test (Vitest, `src/__tests__/*.test.ts`). `apps/web`: unit `src/**/__tests__/*.test.ts` (`rate-limit`, `security-headers`, `api-response`), integration `*.int.test.ts` qua `pnpm --filter @typing-adventure/web test:integration`, chỉ chạy khi `DATABASE_URL` có đúng 1 `schema=wt_<slug>` (`src/test/integration-global-setup.ts`). Playwright `e2e/smoke.spec.ts` cần `PORT` từ `.wt-env`. Chưa có `specs/`, chưa có Stryker.
- `lib/rate-limit.ts`: `getClientIp` lấy `x-real-ip` trước, rồi phần tử **cuối** của `x-forwarded-for`. Route `api/auth/[...nextauth]` limit `/api/auth/callback/credentials` theo **IP**, 10 lần/15 phút (BACKLOG #1, #3). Body của callback là form-urlencoded (`email`, `password`).
- Word pack: model `WordPack` không có trạng thái duyệt; `POST/PUT /api/wordpacks` chỉ admin (`requireAdmin`), không lọc nội dung; `GET` public. Chưa có luồng "cộng đồng gửi pack".
- CI `ci.yml`: job `checks`, `gitleaks`, `guard` (guard lấy script từ base). `guard-diff.sh` bảo vệ `eslint.config.*`, `.prettierrc*`, `tsconfig*.json`, `lefthook.yml`, `.gitleaks.toml`, `.github/workflows/ci.yml`, `.github/rulesets/*`, `scripts/ci/*`, `.claude/hooks/*`. Ba bộ self-test `test-hooks.sh`, `test-guard-diff.sh`, `scripts/lib/test-pg.sh` **không** chạy trong CI.

## Kiến thức cần nắm
- **EARS** cho requirement kiểm được: `WHEN <sự kiện> THE SYSTEM SHALL <phản hồi>`, `WHILE <trạng thái>…`, `WHERE <cấu hình>…`, `IF <điều kiện xấu> THEN …`. Mỗi câu một hành vi, có ID (`RL-01`), đo được (số, status, chuỗi). ≤ 7 criteria/spec: nhiều hơn là spec quá to, tách ra. Mục **Ngoài phạm vi** và **Hành vi không đổi** chặn agent "tiện tay" sửa thêm và cho reviewer biết test hồi quy nào phải còn xanh.
- **Đỏ đúng lý do.** Commit `test:` chạy phải fail ở **assertion** (giá trị sai) hoặc ở **export còn thiếu đúng tên trong spec**. Fail vì lỗi cú pháp, sai đường dẫn import, thiếu env, DB không kết nối → đỏ sai lý do, test chưa chứng minh gì. Ghi lại dòng lỗi đầu tiên của từng ID.
- **Tách người viết test và người viết code.** Agent viết cả hai thường sửa test cho khớp code. `test-writer` chỉ được ghi file test; `implementer` không được ghi file test. Agent definition chỉ giới hạn được *tool*, không giới hạn được *path*, nên lớp chặn thật là CI: commit `feat:` chạm file test → fail.
- **Mutation testing.** Stryker sửa code (đổi `>` thành `>=`, `+` thành `-`, xoá câu lệnh…) rồi chạy test: mutant "sống" nghĩa là không test nào nhận ra. Score = killed / (killed + survived + no coverage). Coverage 100% vẫn có thể score thấp. Chạy tốn thời gian (mỗi mutant chạy lại test liên quan), nên chọn phạm vi và ghi thời gian thật.
- **Trusted proxy.** Header IP do client gửi được thì không đáng tin, trừ khi biết chắc proxy nào đứng trước app và proxy đó *ghi đè* (nginx `X-Real-IP $remote_addr`) hay *nối thêm* (ALB nối IP thật vào cuối `X-Forwarded-For`). Cấu hình phải nói rõ tin header nào; mặc định sai là lỗ hổng né rate limit.
- **Guard phải bảo vệ chính nó.** PR sửa được workflow khác, script `package.json`, `turbo.json`, hay `.claude/settings.json` là tắt được kiểm tra mà không cần label. Danh sách bảo vệ mới chỉ có hiệu lực **sau** khi merge (guard chạy script của base), nên PR này tự kiểm danh sách mới bằng test local.

## Bài tập

**EX-1 · Template spec + plan**
- `specs/_template.md` (gốc repo, ≤ 1 màn hình): `# <ID> · <tên>`, `Trạng thái: draft|approved`, `## Bối cảnh` (2–3 dòng), `## Requirements` (bảng `ID | EARS | Test`), `## Ngoài phạm vi`, `## Hành vi không đổi` (kèm test hồi quy đang có), `## Lịch sử` (giờ từ `date '+%F %H:%M'`).
- Plan (`docs/plans/_template.md`) cho task multi-file: tối thiểu `L06-tdd-tooling.md` (EX-2 + EX-3 + EX-7), `L06-mutation.md` (EX-6). Hai spec ở EX-4/EX-5 thay cho plan của feature (spec có mục "File dự kiến" thì không cần plan riêng; ghi quyết định này trong plan tooling).
- Thêm 1 dòng vào `CLAUDE.md` (phần Commands hoặc Conventions): feature mới bắt đầu từ `specs/<ID>/spec.md`, commit `test:` trước `feat:`. Giữ ≤ 64 dòng.

**EX-2 · Subagent `test-writer` và `implementer`**
`.claude/agents/test-writer.md`: đọc spec, chỉ tạo/sửa file test (`**/__tests__/**`, `*.test.ts`, `*.int.test.ts`, `e2e/*.spec.ts`), mỗi `it`/`test` bắt đầu bằng ID (`it('RL-02: …')`), chạy test và báo dòng đỏ của từng ID, không sửa code nguồn, commit `test(<scope>): <ID…>`. `.claude/agents/implementer.md`: đọc spec + test đỏ, sửa code nguồn tới khi xanh, **không** ghi file test (test sai → dừng, báo lại), commit `feat(<scope>): <ID…>`. Cả hai: `tools` tối thiểu, nhắc rule repo (không comment, chỉ ghi DB `wt_*`). Dùng 2 agent này thật ở EX-4/EX-5 và ghi trong REPORT agent nào làm commit nào.

**EX-3 · CI: commit `feat:` không sửa test**
`scripts/ci/check-tdd-commits.sh <base> <head>`: duyệt từng commit trong `base..head` (bỏ merge commit); subject khớp `^feat(\(...\))?!?:` mà chạm file test (cùng pattern ở EX-2) → in `sha subject: file` và exit 1. Test `scripts/ci/test-check-tdd-commits.sh` trong repo tạm (`git init` ở scratchpad), ≥ 6 ca: `feat:` chỉ sửa src (qua), `feat:` sửa `__tests__` (chặn), `feat(web):` sửa `e2e/x.spec.ts` (chặn), `test:` sửa test (qua), `fix:` sửa cả hai (qua, ghi lý do chọn), merge commit (bỏ qua). Gắn vào job `guard` của `ci.yml` theo cùng cách lấy script từ base (base chưa có thì dùng bản trong PR), để không phải thêm required check mới vào ruleset.

**EX-4 · Spec `RL` · rate limit đăng nhập theo IP + email, trusted proxy (BACKLOG #1, #3)**
`specs/RL/spec.md`, ≤ 7 criteria, ví dụ phạm vi (learner tự viết câu EARS và số):
- `WHERE` cấu hình trusted proxy (vd `TRUST_PROXY_HEADER=x-real-ip|x-forwarded-for` hoặc `TRUSTED_PROXY_HOPS=<n>`) → lấy IP từ đúng header/vị trí đó; header khác bị bỏ qua (client gửi `x-real-ip` giả khi cấu hình là XFF thì key không đổi). Spec phải ghi **mặc định khi không cấu hình** và lý do, cùng bảng "kiểu triển khai trong `typing-adventure/docs/DEPLOY_AWS.md` → giá trị cần đặt" (EC2 + nginx, ECS/App Runner + ALB).
- `WHEN` POST `/api/auth/callback/credentials` → key = IP + email đã chuẩn hoá (trim, lowercase); email thứ 2 cùng IP không bị khoá vì email thứ 1 đã hết lượt; có trần riêng theo IP (cao hơn) để chặn dò nhiều email. Body đọc từ `req.clone()` để `handlers.POST` vẫn nhận nguyên body.
- Ngoài phạm vi: store Redis (#2), limiter của `register`. Hành vi không đổi: response 429 + redirect `?error=RateLimited`, test `rate-limit.test.ts` hiện có.
Thứ tự commit: spec (`docs(spec): RL`) → `test(web): RL-01..RL-0n` (đỏ, `test-writer`) → `feat(web): RL-…` (`implementer`) → cập nhật `.env.example` + `DEPLOY_AWS.md` trong commit `feat:` hoặc `docs:`. Test route dùng `vi.mock('@/lib/auth')` cho `handlers`, không cần DB.

**EX-5 · Spec `WP` · kiểm duyệt nội dung word pack**
`specs/WP/spec.md`, ≤ 7 criteria. Phần lõi:
- `packages/game-engine/src/moderation.ts` (pure, export qua `index.ts`): hàm nhận danh sách từ + blocklist, trả từ được nhận và từ bị loại kèm lý do (`blocked`, `duplicate`, `too_long`, `invalid_chars` hoặc bộ lý do learner chọn). So khớp blocklist không phân biệt hoa thường và **không phân biệt dấu tiếng Việt** (spec phải nói rõ cách xử lý `đ/Đ`, vì NFD không tách `đ`). Blocklist mặc định nhỏ, từ nhẹ, đủ để test; test truyền blocklist riêng.
- `POST`/`PUT /api/wordpacks`: `IF` có từ bị loại `THEN` 400, `error` nêu số từ bị loại, không ghi DB; từ trùng/khoảng trắng được chuẩn hoá trước khi lưu. Test integration `*.int.test.ts` cite ID, chạy trên worktree có schema `wt_*` (`scripts/wt-new.sh`), `requireAdmin` mock bằng `vi.mock('@/lib/admin-guard')`.
- Ngoài phạm vi (ghi trong spec, làm ở Mở rộng): người dùng thường gửi pack, trạng thái `PENDING/APPROVED/REJECTED`, migration Prisma, UI duyệt.
Cùng thứ tự commit như EX-4; engine dùng skill `add-game-mode-logic` (test-first).

**EX-6 · Stryker cho `packages/game-engine`**
- Thêm `@stryker-mutator/core` + `@stryker-mutator/vitest-runner` (pin version, kiểm `peerDependencies` với vitest 2.1 bằng `pnpm view` trước khi cài), `packages/game-engine/stryker.config.json` (runner `vitest`, `mutate` loại `index.ts`, `types.ts`, `__tests__`), script `mutation` trong `packages/game-engine/package.json` (không sửa `package.json` gốc), ignore thư mục report/tmp.
- **Baseline**: chạy toàn bộ `src/**/*.ts` một lần, ghi score, số mutant, thời gian (`/usr/bin/time -p`). Nếu > 15 phút hoặc vượt ngân sách phiên: dừng, thu `mutate` về một tập con có lý do (ít nhất `scoring.ts`, `engine.ts`, `words.ts`, `moderation.ts`), chạy lại baseline trên tập đó và ghi cả hai con số.
- **Nâng > 70%** trên phạm vi đã chọn bằng test mới (commit `test(engine): …`; test diệt mutant của code cũ thì xanh ngay, ghi rõ là test đặc tả hành vi có sẵn, không cần ID). Không hạ score bằng cách thu hẹp `mutate` sau khi đã đo baseline, và không thêm `// Stryker disable` để né. Đặt `thresholds.break` = score cuối làm tròn xuống.
- Không đưa Stryker vào CI bắt buộc (ghi lý do + thời gian trong plan).

**EX-7 · Vá guard theo review PR #8 (BACKLOG #15, #18)**
- `guard-diff.sh`: thêm `.github/workflows/*`, `.github/actions/*`, `turbo.json`, `.claude/settings*.json`, `.claude/agents/pr-reviewer.md`; với mọi `package.json` bị sửa: so `jq -S .scripts` giữa base và head, khác → tính là config được bảo vệ (thêm devDependency thì không). Thêm ≥ 5 ca vào `test-guard-diff.sh` (workflow mới, `turbo.json`, `.claude/settings.json`, đổi `scripts.test`, chỉ thêm devDependency → qua).
- `ci.yml` job `checks`: sau `pnpm install`, chạy `bash .claude/hooks/test-hooks.sh`, `bash scripts/ci/test-guard-diff.sh`, `bash scripts/ci/test-check-tdd-commits.sh`, `bash scripts/lib/test-pg.sh`. Script nào cần tool không có trên runner (vd `shellcheck`, `psql` thật) thì dùng stub hoặc cài có pin; ghi trong plan.
- PR L06 chạm config được bảo vệ → `guard` đỏ cho tới khi **user** gắn label. Learner không gắn.

## Tiêu chí đạt
- **AC-1** (EX-1): `specs/_template.md` có đủ 6 mục; 2 plan `L06-*.md` `approved`, commit trước commit code của nó (`git log --reverse $BASE..HEAD`), có `## Thực tế`; giờ trong Lịch sử ≤ giờ commit plan. `wc -l CLAUDE.md` ≤ 64.
- **AC-2** (EX-2): 2 file agent có frontmatter `name/description/tools`; `test-writer.md` nêu rõ chỉ ghi file test + cite ID; `implementer.md` nêu rõ không ghi file test. REPORT có bảng `commit | agent | ID`.
- **AC-3** (EX-3): `bash scripts/ci/test-check-tdd-commits.sh` exit 0 với ≥ 6 ca; `bash scripts/ci/check-tdd-commits.sh $BASE HEAD` trên chính branch L06 exit 0; `ci.yml` job `guard` gọi script (lấy từ base nếu có).
- **AC-4** (EX-4): `specs/RL/spec.md` `approved`, ≤ 7 ID, có Ngoài phạm vi, Hành vi không đổi, bảng triển khai. Với mỗi ID có commit `test:` **trước** commit `feat:` của ID đó; REPORT dán dòng đỏ đầu tiên của từng ID ở commit `test:` (chạy bằng `git stash`/worktree tại commit đó) và chỉ ra vì sao là đúng lý do. Ở HEAD: `pnpm --filter @typing-adventure/web test` xanh, test cũ `rate-limit.test.ts` không bị sửa assertion (`git diff $BASE -- …` chỉ thêm). `DEPLOY_AWS.md` + `.env.example` có biến mới.
- **AC-5** (EX-5): `specs/WP/spec.md` như AC-4. `moderation.ts` không import React/DOM/Node. Engine test xanh; `test:integration` xanh trên schema `wt_*` (dán dòng `current_schema` từ test isolation), worktree đã prune. Thứ tự `test:` → `feat:` như AC-4.
- **AC-6** (metric criteria): với mỗi spec, `grep -oE '^\| (RL|WP)-[0-9]+' specs/<ID>/spec.md` và `grep -rhoE "(RL|WP)-[0-9]+" <file test>` cho cùng tập ID → **100%** (REPORT có lệnh và hai danh sách).
- **AC-7** (EX-6): `stryker.config.json` có trong repo; REPORT + `metrics.md` có baseline (phạm vi, mutant, score, thời gian) và số cuối **> 70%** trên cùng phạm vi; `thresholds.break` đặt; `grep -rn "Stryker disable" typing-adventure/packages` rỗng; `pnpm --filter @typing-adventure/game-engine exec stryker run` (người chấm chạy lại) ra score ≥ `break`.
- **AC-8** (EX-7): `test-guard-diff.sh` ≥ 20 ca, exit 0, có các ca mới ở EX-7; `ci.yml` có 4 bước self-test; trên PR L06 (hoặc draft): `checks` xanh, trong log thấy 4 self-test chạy; `guard` đỏ đúng lý do thiếu label (URL run trong REPORT).
- **AC-9**: checkout chính, qua `rtk proxy`: `pnpm lint` (warning ≤ baseline L05, 37), `pnpm typecheck`, `pnpm test`, `pnpm build` exit 0. Hook L05 vẫn xanh (`test-hooks.sh` exit 0). `public` không có thay đổi do lesson.

## Ràng buộc môi trường
- **DB:** integration test chỉ trên schema `wt_*` của worktree (`scripts/wt-new.sh` → `wt-prune.sh`). Không ghi `public`, không tạo bảng probe. Thử nghiệm quyền DB (nếu có) chỉ trên container dùng xong bỏ (`docker run --rm`, dừng bằng ID).
- **Config:** agent không sửa `.claude/settings*.json`, không gắn label `config-change-approved`. Hai agent mới chỉ nằm ở `.claude/agents/`; nếu Claude Code không cho gọi agent mới trong cùng phiên, ghi `chưa verify runtime` cho phần "gọi qua Agent tool" và làm theo đúng vai trò bằng tay, commit vẫn tách `test:`/`feat:`.
- **Stryker** chạy local, không đưa vào CI bắt buộc. Thời gian ghi bằng số đo thật.
- **Outward-facing** (ghi trong plan và REPORT): `pnpm add` (Stryker), push branch, mở draft PR **sau khi** #8 merge và branch đã rebase. Không force push trừ lần rebase đó (`--force-with-lease`, do người điều phối quyết), không đổi ruleset.
- Không switch branch ở checkout chính; integration/E2E chạy trong worktree.

## Nộp bài
`docs/ai-levelup/learner/L06-spec-tdd/REPORT.md` (từng EX: việc làm, lệnh + kết quả rút gọn, giờ thật; bảng `commit | agent | ID`; dòng đỏ của từng ID; baseline/cuối Stryker; URL run CI; phần `chưa verify runtime`), section L06 trong `learner/FEATURE_MAP.md` (mọi file trong `git diff --name-only $BASE...HEAD`), dòng L6 trong `metrics.md` (criteria có test %, mutation baseline → cuối + thời gian, QA round trip mỗi spec, giờ `test:`→`feat:`, plan khớp, plan trước code), `mistakes.md` nếu có lỗi lặp. Đề xuất trạng thái BACKLOG #1, #3, #15, #18 trong REPORT.

## Mở rộng (không bắt buộc)
- Spec `WP-C` cộng đồng gửi pack: enum trạng thái + migration (skill `prisma-change`), `GET` public chỉ trả `APPROVED`, admin duyệt/từ chối, tối đa N pack `PENDING` mỗi user.
- Spec `LB` + `FR`: test integration cho `GET /api/leaderboard`, `/api/leaderboard/friends`, `/api/friends` (gửi/nhận/chấp nhận/chặn tự kết bạn). Đây là test đặc tả hành vi đang có, nên `test:` xanh ngay; ghi rõ ngoại lệ "không có đỏ" trong spec.
- Playwright E2E classic mode (`e2e/classic.spec.ts`): vào chế độ classic, gõ hết 1 từ, thấy điểm/kết quả. Chạy trong worktree với `PORT` từ `.wt-env`.
- Chạy Stryker trên `apps/web/src/lib` (rate-limit, security-headers).
- Xem [BACKLOG.md](../BACKLOG.md), #16, #17, #19, #20 dành cho L07/L08.
