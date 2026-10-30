| Level | Metric | Target | PR | Đo được | Ngày |
|---|---|---|---|---|---|
| L1 | First agent PR | ≤1 ngày | 2 | 10 phút | 13/10/2026 |
| L1 | Comment convention / PR | <1 | 2 | 0 | 13/10/2026 |
| L00 | Reviewer agent chạy end-to-end | 1 PR | 4 | 1 vòng request changes → merge | 29/10/2026 |
| L2 | First green build (`lint+typecheck+test+build`), host | <1h | — | ~2m40s (bắt đầu phiên 22:53 → xanh 22:55:38) | 29/10/2026 |
| L2 | First green build trong sandbox (devcontainer, `up` 118s + chain 64s) | <1h | — | ~4m45s (bắt đầu phiên 22:53 → xanh 22:57:46), image build không layer CACHED nhưng volume `postgres_data` có sẵn, chưa phải Rebuild Without Cache | 29/10/2026 |
| L2 | Số lần phải nhắc agent về điều đã có trong CLAUDE.md/rule/skill | 0 | — | 0 | 29/10/2026 |
| L2 | MCP giữ lại sau 1 tuần | — | — | context7: chưa dùng, postgres-ro: chưa dùng (cả 2 `Pending approval`) | 29/10/2026 |
| L3 | Plan khớp diff: `L03-rate-limit.md` | ≥80% | — | 10/10 = 100% | 29/10/2026 |
| L3 | Plan khớp diff: `L03-security-headers.md` | ≥80% | — | 3/3 = 100% | 29/10/2026 |
| L3 | Plan khớp diff: `L03-rate-limit-fixes.md` (sửa sau chấm) | ≥80% | — | 9/9 = 100% | 29/10/2026 |
| L3 | Design round 2 (plan đổi hướng sau khi code) | 0/2 | — | 0/2 (0/3 tính cả plan fixes) | 29/10/2026 |
| L3 | Task multi-file có plan approved trước code | 2/2 | — | 3/3 (commit `96503e0`, `d42800d`, `60cd241` trước code) | 29/10/2026 |
| L3 | Thời gian plan / code | — | — | rate-limit ~1m10s / ~1m30s; security-headers ~30s / ~2m25s; fixes ~40s / ~1m45s | 29/10/2026 |
| L4 | Setup time `wt-new` worktree A (`lesson/L04-api-test`), store ấm | <120s | — | 15.11 s (`/usr/bin/time -p`, `reused 628, downloaded 0`); chromium Playwright tải riêng 20.79 s | 29/10/2026 |
| L4 | Setup time `wt-new` worktree B (`lesson/L04-e2e`), store ấm | <120s | — | 7.44 s | 29/10/2026 |
| L4 | Incident do shared state (3 vòng A ‖ B, `next dev` chính chạy 3000) | 0/3 | — | 0/3 (6/6 xanh; lượt thêm có `dev:ws` A trên 3002: 6/6 xanh) | 29/10/2026 |
| L4 | Plan khớp diff: `L04-worktree-scripts.md` / `L04-api-integration-test.md` / `L04-e2e-skeleton.md` | ≥80% | — | 5/5, 6/6, 6/6 = 100% | 29/10/2026 |
| L4 | Task multi-file có plan approved trước code | 3/3 | — | 3/3 (`f52ebb8`, `fb79f38`, `5145a7e` trước code) | 29/10/2026 |
| L4 | `public` không đổi sau lesson | 0 thay đổi | — | `User` 12/12, 13 bảng/13 bảng | 29/10/2026 |
| L4 | Plan khớp diff: `L04-wt-hardening.md` (sửa sau chấm) | ≥80% | — | 3/3 = 100%; plan `abb516c` trước code `c35caf9` (4/4 plan trước code tính cả fix) | 30/10/2026 |
| L4 | Plan khớp diff: `L04-review-fixes.md` (sửa theo review PR #7) | ≥80% | 7 | 4/4 = 100%; plan `ce7424b` trước code `16b0697` (5/5 plan trước code) | 30/10/2026 |
| L5 | `lefthook run pre-commit` (1 file `.tsx` staged trong `apps/web`) | <30s | 8 | 3.25 s (gitleaks 0.03, prettier 0.72, eslint 3.19) | 30/10/2026 |
| L5 | `lefthook run pre-push --force` (typecheck + engine test) | — | 8 | 1.37 s turbo ấm; 4.20 s `TURBO_FORCE=true`; 6.95 s trong worktree EX-5 (đỏ đúng) | 30/10/2026 |
| L5 | PostToolUse `format-lint.sh` / 1 file `.tsx` | — | 8 | 0.86–0.95 s (3 lần) | 30/10/2026 |
| L5 | Thời lượng CI (`gh run view`, createdAt→updatedAt) | — | 8 | 1m58s (run 40923821932), 1m56s (40924598948), 1m18s (40925206012), 2m07s (40926187909); `checks` là job dài nhất | 30/10/2026 |
| L5 | Ma trận lọt lớp (EX-5) | 6/6 đúng lớp | — | 6/6: (1)(2) agent hook, (3) pre-push, (4) pre-commit gitleaks, (5)(6) `guard-diff.sh`; (5) còn bị agent hook + pre-commit eslint chặn sớm hơn | 30/10/2026 |
| L5 | Gitleaks toàn lịch sử (49 commit) | 0 secret thật | — | 4 dương tính giả `generic-api-key` → 0 sau allowlist path+regex | 30/10/2026 |
| L5 | Plan khớp diff: agent-hooks / git-hooks-ci / script-fixes / mcp-postgres | ≥80% | 8 | 5/5, 8/9 (89%, v2 thêm `.gitignore`), 5/5, 1/1 | 30/10/2026 |
| L5 | Task multi-file có plan approved trước code | 4/4 | 8 | 4/4 (`bafa8d0` trước mọi commit code; v2 `9e49fb6` trước `71bceaa`) | 30/10/2026 |
| L5 | Comment cơ học (format/lint/type) của reviewer trên PR L05 | 0 | 8 | chưa đo (PR draft, chưa review) | 30/10/2026 |
| L5 | Plan khớp diff: v2 sau chấm `L05-mcp-postgres.md` / `L05-agent-hooks.md` | ≥80% | 8 | 1/1, 2/2; plan `7f0c1f5` trước code `32753b3`, `f9d1652` | 30/10/2026 |
| L5 | `mcp_ro` tạo được bảng trong `public` sau `SET … off` | 0 | — | PG14 script cũ: tạo được; PG14 + PG16 script mới: `permission denied for schema public` (container dùng xong bỏ) | 30/10/2026 |
| L6 | Criteria có test (ID EARS có ≥ 1 test cite ID / tổng ID) | 100% | — | RL 7/7, WP 7/7 = 14/14 = 100% (`grep -oE '^\| (RL\|WP)-[0-9]+'` spec vs `grep -rhoE` file test) | 30/10/2026 |
| L6 | Mutation score `packages/game-engine` (15 file, 2204 mutant, cùng phạm vi) | >70% | — | baseline 65.47% (96.80 s) → 75.14% (97.20 s) → **77.59%** (94.71 s; lặp lại 99.15 s cùng 77.59%); `thresholds.break` 77 → 75 sau chấm (người chấm đo 77.54, lệch 1 mutant) | 30/10/2026 |
| L6 | QA round trip mỗi spec (commit `fix:` cùng ID sau `feat:` + FAIL ở GRADE) | ≤1 | — | RL 0, WP 0 (chưa chấm) | 30/10/2026 |
| L6 | Giờ `test:` → `feat:` | — | — | RL `9ea8dc3` 09:41:08 → `4710f0e` 09:41:59 = 51 s; WP `28897ba` 09:43:36 → `f1e0acd` 09:45:19 = 1m43s | 30/10/2026 |
| L6 | Plan khớp diff: `L06-tdd-tooling.md` / `L06-mutation.md` | ≥80% | — | 9/9, 5/5 = 100% | 30/10/2026 |
| L6 | Task multi-file có plan/spec approved trước code | 4/4 | — | 4/4: plan `f77e424` trước `0260e0c`…`9da1145`; spec RL `f45b286` trước `9ea8dc3`; spec WP `1c2dad2` (v2 `49b58f4`) trước `28897ba` | 30/10/2026 |
| L6 | `check-tdd-commits.sh` trên branch L06 | exit 0 | — | `OK (18 commits in main..HEAD)` trước commit docs | 30/10/2026 |
| L6 | Self-test chạy local + CI PR #9 (run 40996093424) | 4/4 xanh | 9 | `test-hooks` 41/41, `test-guard-diff` 28/28, `test-check-tdd-commits` 10/10, `test-pg` 9/9 | 30/10/2026 |
| L6 | Sửa sau review PR #9 (RL-08/09, lỗ email trùng) | — | 9 | spec `1c2779a` 10:21:49 → `test:` `6feddfd` 10:22:20 → `fix:` `c56ee59` 10:22:48 (`test:`→`fix:` 28 s); web 42/42; criteria có test RL 9/9, tổng 16/16 = 100% | 30/10/2026 |
| L6 | QA round trip sau review | ≤1 | 9 | RL 1 (`fix(web)` `c56ee59`, lỗi chặn của reviewer), WP 0 | 30/10/2026 |
| L7 | Lead time (commit spec `approved` → `mergedAt`, `scripts/metrics/lead-time.sh`) | trung vị ≤ 37m (L06 52m55s, −30%) | 10, 11 | A RG `d445572` 13:26:03Z → 13:36:44Z = **10m41s**; B WM `556d2e6` 13:26:32Z → 13:37:18Z = **10m46s**; trung vị **10m43.5s** = −79.7% so với 52m55s | 30/10/2026 |
| L7 | PR wait time (`ready_for_review` cuối → `merged`) | chỉ ghi (L06 16m22s) | 10, 11 | A 13:32:04Z → 13:36:44Z = 4m40s; B 13:35:10Z → 13:37:18Z = 2m08s | 30/10/2026 |
| L7 | Change failure rate (task có ≥ 1 lần sửa sau ready / số task) | ≤ 1/2 (L06 1/2) | 10, 11 | **0/2**: không commit nào sau `ready_for_review` (A: commit cuối `04c23c6` 13:29:04Z < ready 13:32:04Z; B: `cc7ce10` 13:32:31Z < 13:35:10Z); reviewer 0 blocking; CI sau ready xanh (`checks`/`gitleaks`/`guard`/`review`); 0 commit `fix:` trên `main` sau merge. CI đỏ duy nhất ở commit `test:` khi còn draft (A `8f55285`, B `c88d94e`), dự kiến | 30/10/2026 |
| L7 | Setup worktree (`wt-new.sh`, `/usr/bin/time -p` real) / prune (`wt-prune.sh`) | <120s | — | A 21.08 s / 5.84 s; B 8.65 s / 5.07 s; schema `wt_l07_*` đã drop (0 schema còn lại) | 30/10/2026 |
| L7 | WIP tối đa | ≤ 3 | — | 3 (lead + A + B, 20:25–20:35) | 30/10/2026 |
| L7 | Draft PR sau commit spec | ≤ 10 phút | 10, 11 | A `createdAt` 13:26:26Z (24 s); B 13:26:58Z (26 s) | 30/10/2026 |
| L7 | Xung đột merge / update-branch | 0 | 10, 11 | 0 / 0 (`comm -12` diff A, B rỗng; merge `4df98c8`, `5590f0f`) | 30/10/2026 |
| L7 | Đợt review (1 lần `pr-reviewer` cho cả #10, #11) | 1 đợt | 10, 11 | 20:35:49 → 20:37:22 = 1m33s, 0 blocking; review event #10 13:36:40Z, #11 13:37:15Z | 30/10/2026 |
| L7 | Số lần session chờ người | — | — | 0 (A, B không chạm file bảo vệ, không cần label) | 30/10/2026 |
| L7 | Self-test hook / lead-time | ≥ 60 ca, leaks 0 | — | `test-hooks.sh` 93/93, leaks 0; `test-lead-time.sh` 8/8; PR #9 RL `lead=54m03s wait=16m22s`, WP `lead=51m47s` | 30/10/2026 |
| L7 | Criteria có test / mutation | 100% / ≥ 75 | 10, 11 | RG 5/5, WM 6/6 = 11/11 = 100%; mutation engine 78.02% (`moderation.ts` 97.12%) | 30/10/2026 |
| L7 | Plan khớp diff `L07-parallel-tooling.md` | ≥ 80% | — | 15/15 = 100% (8 file code/script + plan + REPORT/task-A/task-B + FEATURE_MAP/metrics/mistakes; LESSON.md, lessons/README.md của teacher không tính) | 30/10/2026 |
| L7 | AC-9 trên checkout lesson (rebase lên `5590f0f`) | exit 0 | — | lint 0 error / 37 warning; typecheck 4/4; test engine 193/193, web 49/49; build exit 0; `git worktree list` 1 dòng; `public` 14 bảng (13 + `mcp_probe` còn từ L05), `User` 12, `_prisma_migrations` 2 | 30/10/2026 |
