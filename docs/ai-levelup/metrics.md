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
