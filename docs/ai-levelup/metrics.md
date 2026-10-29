| Level | Metric | Target | PR | Đo được | Ngày |
|---|---|---|---|---|---|
| L1 | First agent PR | ≤1 ngày | 2 | 10 phút | 13/10/2026 |
| L1 | Comment convention / PR | <1 | 2 | 0 | 13/10/2026 |
| L00 | Reviewer agent chạy end-to-end | 1 PR | 4 | 1 vòng request changes → merge | 29/10/2026 |
| L2 | First green build (`lint+typecheck+test+build`), host | <1h | — | ~2m40s (bắt đầu phiên 22:53 → xanh 22:55:38) | 29/10/2026 |
| L2 | First green build trong sandbox (devcontainer, `up` 118s + chain 64s) | <1h | — | ~4m45s (bắt đầu phiên 22:53 → xanh 22:57:46), image build không layer CACHED nhưng volume `postgres_data` có sẵn, chưa phải Rebuild Without Cache | 29/10/2026 |
| L2 | Số lần phải nhắc agent về điều đã có trong CLAUDE.md/rule/skill | 0 | — | 0 | 29/10/2026 |
| L2 | MCP giữ lại sau 1 tuần | — | — | context7: chưa dùng, postgres-ro: chưa dùng (cả 2 `Pending approval`) | 29/10/2026 |
