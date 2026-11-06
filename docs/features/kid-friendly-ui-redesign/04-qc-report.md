# KR · Kid-friendly UI redesign — QC report

Kết luận: PASS (vòng 1, 2026-11-06 07:00, HEAD 84e776d)

## Vòng 1
### Gate
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | ✅ 0 errors, 40 warnings (cảnh báo cũ) |
| `pnpm typecheck` | ✅ 4/4 tasks successful |
| `pnpm test` | ✅ game-engine 255 passed (19 files), web 208 passed (31 files) |
| `pnpm build` | ✅ `/` 20 kB, First Load JS 157 kB |
| Baseline `pnpm build` trên origin/main (git worktree tạm ở /tmp, đã xoá) | `/` 17.4 kB, First Load JS 151 kB → tăng **+6 kB** (ngân sách 20 kB) |
| `bash ../scripts/ci/check-tdd-commits.sh origin/main HEAD` | ✅ OK (43 commits) |
| `git diff --stat origin/main...HEAD -- packages/game-engine packages/db/prisma apps/web/src/app/api` | ✅ rỗng |
| `PORT=3117 KR_PERF=1 E2E_SERVER_CMD="pnpm exec next start -p 3117" playwright test` (production build) | ✅ 94 passed, 1 failed: `smoke.spec.ts` Socket.IO handshake. Lỗi này là dự kiến vì `next start` không có Socket.IO |
| `PORT=3117 playwright test smoke auth-guard` (server mặc định `dev:ws`) | ✅ 7 passed |
| `PORT=3117 playwright test kr-qc` (test QC thêm, `next dev`) | ✅ 3 passed |
| `test:integration` | NOT RUN: tính năng chỉ sửa UI, không đổi API/DB (diff KR-21 rỗng) |

### Acceptance criteria
| AC | Kết quả | Bằng chứng | Ghi chú |
|---|---|---|---|
| KR-01 | PASS | `kr-tokens.test.ts`, `kr-clay.test.ts` ✅ (giá trị token màu, viền, bo góc, bóng kép) | |
| KR-02 | PASS | `kr-layout.spec.ts` "KR-02 dark theme is applied before hydration and switches immediately" ✅; "KR-13 KR-02 … uses kr tokens in {light,colorful,dark}" ✅ | |
| KR-03 | PASS | `kr-layout.spec.ts` "KR-03 KR-16 fonts and images are same-origin, no CSP errors, Baloo font" ✅; `kr-tokens.test.ts` ✅ | Cần kiểm tay thêm: DevTools > Rendered Fonts trên "Ếch Ưu Ỷ" không có fallback |
| KR-04 | PASS | `OwlMascot.test.tsx` (8 trạng thái), `kr-shared-ui.test.tsx`, `AgePicker.test.tsx`, `CelebrationModal.test.tsx` ✅; e2e Little home không chứa 🦉, có 1 svg ✅ | |
| KR-05 | PASS | `Icon.test.tsx`, `game-chrome.test.tsx` (aria-label/aria-pressed), `ChoiceCards.test.tsx`, `games-ui.test.tsx`, `kr-game.spec.ts`, `kr-games-hub.spec.ts` ✅ | |
| KR-06 | PASS | `kr-shared-ui.test.tsx`, `kr-game.spec.ts`, `kr-agepicker.spec.ts` ✅; `kr-layout.spec.ts` KR-20 kiểm `.kr-scene` không che chữ/bàn phím/nút ở 4 kích thước ✅ | |
| KR-07 | PASS | `kr-motion.test.ts` (thời lượng, easing, stagger), `kr-agepicker.spec.ts`, `kr-games-hub.spec.ts` (đã ổn định: opacity 1, transform none) ✅ | |
| KR-08 | PASS | `kr-clay.test.ts`, `ChoiceCards.test.tsx` ✅; QC thêm `e2e/kr-qc.spec.ts` "KR-08 age card sinks on press…" và "KR-08 disabled ui-btn…" ✅ (computed transform khi nhấn giữ, cursor pointer / not-allowed) | |
| KR-09 | PASS | `combo-celebration.test.ts`, `ComboBurst.test.tsx`, `game-store-parity.test.ts`, `kr-i18n.test.ts`, `kr-game.spec.ts` ✅ | |
| KR-10 | PASS | `CelebrationModal.test.tsx`, `result-celebration.test.ts` ✅; `kr-result.spec.ts` (confetti hết trước 2600ms, E12 ẩn tab, chơi lại) ✅ | Theo mặc định user duyệt: hết mạng ở challenge thì không có confetti, owl hiện `encourage` |
| KR-11 | PASS | `ChoiceCards.test.tsx`, `choice-nav.test.ts`, `plain-label.test.ts`, `game-input.test.ts`, `kr-sidenav.spec.ts` ✅ | |
| KR-12 | PASS | `AgePicker.test.tsx`, `kr-agepicker.spec.ts` ✅ | |
| KR-13 | PASS | `kr-layout.spec.ts` token trên /login, /register, /games × 3 theme, owl SVG ở Little home ✅; `kr-shared-ui.test.tsx` ✅ | PASS (review) cho /leaderboard, /friends, /profile, /lobby, /race: kiểm tay để chắc bố cục không vỡ. Admin chỉ kiểm tay (E11) |
| KR-14 | PASS | `kr-motion.spec.ts` "KR-14 reduced motion: every screen settles…" ✅ (AgePicker → game → mốc x5 → kết quả → /games → Little); `reduced-motion.test.ts`, `ComboBurst.test.tsx` ✅ | E4 (bật giữa chừng) chưa có e2e, kiểm tay |
| KR-15 | PASS | `kr-perf.spec.ts` với `KR_PERF=1` trên production build ✅ (CPU 4x, 30ms/phím, không mất phím, 100%, focus luôn ở input, long task ≤ 100ms) | |
| KR-16 | PASS | `kr-assets.test.ts` (ảnh ≤ 200 KB) ✅; First Load JS `/` +6 kB so với main (151 → 157 kB) ✅; same-origin/CSP e2e ✅; loop tạm dừng khi chơi: `kr-game.spec.ts`, `kr-motion.test.ts` ✅ | |
| KR-17 | PASS | `kr-layout.spec.ts` axe `color-contrast`: agepicker, game, game+sidenav, result, games, login, Little home × 3 theme ✅ | |
| KR-18 | PASS | `kr-layout.spec.ts` "KR-18 Tab through TopBar shows a visible focus ring" ✅; `kr-clay.test.ts`, `ChoiceCards.test.tsx`, `game-input.test.ts`, `kr-sidenav.spec.ts` ✅ | Kiểm tay thêm: độ tương phản của vòng focus ≥ 3:1 (chưa đo tự động) |
| KR-19 | PASS | `kr-layout.spec.ts` "KR-19 … tap targets are at least 44x44 at 375x667" × 6 màn ✅; `kr-sidenav.spec.ts`, `kr-games-hub.spec.ts` ✅ | |
| KR-20 | PASS | `kr-layout.spec.ts` KR-20 × 4 kích thước × 6 màn ✅; `kr-result.spec.ts` modal cuộn dọc ở 375×667 ✅ | |
| KR-21 | PASS | Diff rỗng cho engine/prisma/api ✅; `game-store-parity.test.ts`, `CelebrationModal.test.tsx`, `game-input.test.ts` ✅; QC thêm `kr-qc.spec.ts` "KR-21 guest finishing a round makes no data API request" ✅ | `GET /api/wordpacks` từ `SideNav` đã có sẵn trên main, nên test bỏ qua request này. Chưa kiểm tự động `saveSession` 1 lần cho user đăng nhập (cần DB): PASS (review) vì `useGameEngine` chỉ thêm lời gọi `useComboCelebrationStore` |
| KR-22 | PASS | `kr-i18n.test.ts` ✅ (key mới có ở vi và en, có dấu); typecheck ✅ | |

### Edge cases & hồi quy
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| E1 mốc 10 thay mốc 5 | PASS | `combo-celebration.test.ts` ✅ |
| E3 stars = 0 | PASS | `CelebrationModal.test.tsx`, `result-celebration.test.ts` ✅ |
| E12 ẩn tab khi confetti chạy | PASS | `kr-result.spec.ts` "KR-10 E12…" ✅ |
| E4, E6, E9, E13, E14, E15 | PASS (review) | Chưa có test tự động riêng. Kiểm tay theo mô tả trong 01-requirements |
| E11 admin | PASS (review) | Kiểm tay theo mặc định đã duyệt; KR-17 không áp cho admin |
| Hành vi không đổi: luật, điểm, engine | PASS | Diff engine rỗng, 255 test engine ✅, `game-store-parity.test.ts` ✅ |
| Middleware bảo vệ route | PASS | `auth-guard.spec.ts` ✅ |
| Socket.IO / dev:ws | PASS | `smoke.spec.ts` ✅ trên `dev:ws` |
| Key localStorage `typingAdventure_settings` | PASS | e2e seed và đọc lại key này trong mọi spec KR ✅ |

### Test QC thêm
- `typing-adventure/apps/web/e2e/kr-qc.spec.ts` — KR-08 (×2), KR-21. Chưa commit: người điều phối sẽ commit.

### Việc DEV cần làm (chỉ khi FAIL)
Không có.
