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
| L5 | Thời lượng CI (`gh run view`, createdAt→updatedAt) | — | 8 | 1m58s (run 40923821932), 1m56s (run 40924598948); `checks` 1m54s | 30/10/2026 |
| L5 | Ma trận lọt lớp (EX-5) | 6/6 đúng lớp | — | 6/6: (1)(2) agent hook, (3) pre-push, (4) pre-commit gitleaks, (5)(6) `guard-diff.sh`; (5) còn bị agent hook + pre-commit eslint chặn sớm hơn | 30/10/2026 |
| L5 | Gitleaks toàn lịch sử (49 commit) | 0 secret thật | — | 4 dương tính giả `generic-api-key` → 0 sau allowlist path+regex | 30/10/2026 |
| L5 | Plan khớp diff: agent-hooks / git-hooks-ci / script-fixes / mcp-postgres | ≥80% | 8 | 5/5, 8/9 (89%, v2 thêm `.gitignore`), 5/5, 1/1 | 30/10/2026 |
| L5 | Task multi-file có plan approved trước code | 4/4 | 8 | 4/4 (`bafa8d0` trước mọi commit code; v2 `9e49fb6` trước `71bceaa`) | 30/10/2026 |
| L5 | Comment cơ học (format/lint/type) của reviewer trên PR L05 | 0 | 8 | chưa đo (PR draft, chưa review) | 30/10/2026 |
