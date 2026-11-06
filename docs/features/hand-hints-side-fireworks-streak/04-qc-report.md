# HF · Tay gợi ý hai bên bàn phím, lời khen chuỗi ra hai bên kèm pháo hoa — QC report

Kết luận: PASS (vòng 1, 2026-11-06 16:05, HEAD 9925744)

## Vòng 1
### Gate
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | ✅ 0 errors, 40 warnings (có sẵn) |
| `pnpm typecheck` | ✅ 4/4 packages |
| `pnpm test` | ✅ game-engine 255 passed; web 235 passed (35 files) |
| `pnpm build` | ✅ route `/` 20.4 kB / First Load 157 kB (main: 20 kB / 157 kB, +0.4 KB) |
| `bash ../scripts/ci/check-tdd-commits.sh origin/main HEAD` | ✅ OK (18 commits) |
| `PORT=3137 playwright test hf-layout hf-combo kr-layout kr-game kr-motion` (dev:ws) | ✅ 99 passed |
| `PORT=3137 KR_PERF=1 E2E_SERVER_CMD="next start -p 3137" playwright test hf-perf kr-perf --repeat-each 3` (production build) | ✅ 6 passed |
| `PORT=3137 playwright test e2e/hf-qc.spec.ts` (QC thêm) | ✅ 3 passed |
| `test:integration` | NOT RUN: tính năng thuần client, không đổi API/DB |

### Acceptance criteria
| AC | Kết quả | Bằng chứng | Ghi chú |
|---|---|---|---|
| HF-01 | PASS | `e2e/hf-layout.spec.ts` "HF-01 hands beside keyboard at 1024/1280/1440" ✅; `src/styles/__tests__/hf-layout.test.ts` "HF-01 wide media" ✅ | `--hf-gutter` = `clamp(132px,10vw,180px)`, trong phương án dự phòng của plan |
| HF-02 | PASS | `HandGuide.test.tsx` "HF-02 …" (f/j/space, label side, i18n) ✅; `e2e/hf-layout.spec.ts` "HF-02 finger highlight and label (vi/en)" ✅ | |
| HF-03 | PASS | `e2e/hf-layout.spec.ts` "HF-03 narrow layout at 375/768" ✅; `hf-layout.test.ts` "HF-03 narrow unchanged" ✅ | |
| HF-04 | PASS | `e2e/hf-layout.spec.ts` "HF-04 finger guide off at 375/1024/1440", "HF-04 re-enable … without reload" ✅; `HandGuide.test.tsx` "HF-04" ✅ | |
| HF-05 | PASS | `e2e/hf-combo.spec.ts` "HF-05 HF-06 milestone 5 …" (1280) ✅; `e2e/hf-qc.spec.ts` "HF-05 HF-06 milestones 5 and 50 … at 1024/1440" ✅; `ComboBurst.test.tsx` "KR-09 HF-05", "HF-05 en praise" ✅ | Announcer "Chuỗi 5! Giỏi lắm!" được kiểm |
| HF-06 | PASS | `hf-combo.spec.ts` "HF-05 HF-06 …", "HF-06 no fireworks between milestones" ✅; `hf-fireworks.test.ts` "HF-06 left equals right", "HF-06 E6 non-milestone", "HF-06 finishes before burst clears" ✅; `hf-decor.test.ts` HF-06 ✅ | |
| HF-07 | PASS | `hf-fireworks.test.ts` "HF-07 density strictly increases", "HF-07 deterministic" ✅; `hf-combo.spec.ts` "HF-07 density per milestone" = [12, 20, 32, 48] ✅ | n(5)=12 ≥ 8, n(50)=48 ≤ 60 |
| HF-08 | PASS | `hf-combo.spec.ts` "HF-08 miss then 5 again" ✅ (max ≤ 60, mốc 5 lại = 12 hạt); `hf-fireworks.test.ts` "HF-08 cap" ✅ | |
| HF-09 | PASS | `hf-perf.spec.ts` "HF-09 …" với `KR_PERF=1` trên `next start`, 3/3 ✅; build +0.4 KB ≤ 10 KB | Long task chỉ có nghĩa trên production build; DEV báo 1 lần 125ms trước đó, QC chạy 3 lần không tái hiện |
| HF-10 | PASS | `hf-combo.spec.ts` "HF-10 reduced motion" ✅; `ComboBurst.test.tsx` "KR-14 HF-10" ✅; `hf-decor.test.ts` "HF-10 reduced motion" ✅; `kr-motion.spec.ts` ✅ | |
| HF-11 | PASS | `hf-combo.spec.ts` "HF-11 narrow 375/768", "HF-11 labels in viewport on narrow" ✅; `hf-fireworks.test.ts` "HF-06 HF-11 bursts stay inside" ✅ | |
| HF-12 | PASS | `hf-combo.spec.ts` "HF-12 finish removes effects", "HF-12 restart …" ✅; `hf-layout.spec.ts` "HF-12 panels suppress" ✅; `hf-qc.spec.ts` "HF-12 opening SideNav removes live celebration" ✅; `ComboBurst.test.tsx` "HF-12 suppressed renders nothing" ✅ | Hết giờ `timeAttack`/hết mạng `challenge`: PASS (review), cùng đường `celebration.finish()` khi `isFinished` (`apps/web/src/hooks/useGameEngine.ts:97`) và `suppressed={showCelebration …}` (`apps/web/src/components/game/GameEngine.tsx:449`) |
| HF-13 | PASS | `hf-combo.spec.ts` "HF-13 theme light/dark/colorful lang vi/en" (6 test: chuỗi đúng, không cắt, axe color-contrast 0 vi phạm, 0 request `/api/`) ✅ | User đăng nhập: PASS (review), ComboBurst/HandGuide chỉ đọc store client, không gọi API; không có key i18n mới |

### Edge cases & hồi quy
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| E1 1024px | PASS | hf-layout HF-01 @1024, hf-qc @1024 |
| E4/E5 miss, thay thế, ≤ 60 hạt | PASS | hf-combo HF-08, hf-fireworks "HF-08 cap" |
| E6 combo > 50 | PASS | hf-fireworks "HF-06 E6 non-milestone" |
| E7 mốc ở phím cuối | PASS | hf-combo "HF-12 finish removes effects" (10 ký tự) |
| E12 panel/nav mở | PASS | hf-layout "HF-12 panels suppress", hf-qc SideNav |
| KR-09/14/15/16/20 | PASS | kr-layout, kr-game, kr-motion (99 passed cùng HF), kr-perf production 3/3 |
| Luật game, `getFingerForKey`, i18n | PASS | game-engine 255 passed, web 235 passed |

### Test QC thêm
- `typing-adventure/apps/web/e2e/hf-qc.spec.ts` — HF-05, HF-06 (1024/1440, mốc 5 và 50), HF-12 (SideNav) — commit 9925744
