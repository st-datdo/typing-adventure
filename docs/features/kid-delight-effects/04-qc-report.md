# FX · Kid delight effects — QC report

Kết luận: FAIL (vòng 2, 2026-11-07 01:20, HEAD 581088a)

## Vòng 2
### Gate
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | ✅ 0 errors, 40 warnings (cũ) |
| `pnpm typecheck` | ✅ 4/4 tasks successful |
| `pnpm test` | ✅ engine 255 passed, web 353 passed (52 files) |
| `pnpm build` | ✅ `/` 22.4 kB, First Load JS 169 kB (+12 kB ≤ 15) |
| `bash ../scripts/ci/check-tdd-commits.sh origin/main HEAD` | ✅ OK (71 commits) |
| `PORT=3107 pnpm exec playwright test` (next dev, toàn bộ) | ⚠️ 162 passed, 1 failed `hf-layout.spec.ts:35` "HF-01 hands beside keyboard at 1280"; chạy riêng `hf-layout --repeat-each 3` ×2 → 36/36 + 36/36 xanh (flake do tải, không phải hồi quy) |
| `KR_PERF=1 E2E_SERVER_CMD="pnpm exec next start -p 3107" playwright test fx-qc-sound-perf fx-perf kr-perf --repeat-each 5` | ❌ 14/15, fail `fx-perf` |
| `KR_PERF=1 ... fx-qc-sound-perf fx-perf --repeat-each 5` ×2, `--repeat-each 6` ×4 | ❌ 4 lần fail / 6 lượt chạy (≈ 4/80 test): 1 lần ở `fx-qc-sound-perf` (âm bật), 3 lần ở `fx-perf` (âm tắt); tất cả fail ở `expect([...new Set(issues)]).toEqual([])` dòng 80, giá trị bắt được: `"particles 67"` |

Long task: không lần nào vượt 100ms, cả âm bật lẫn tắt (fix `SoundEngine.prepare()` có hiệu quả). Flake "issues" DEV thấy đã tái hiện được: số node `.fx-p` vượt trần 60.

### Acceptance criteria
| AC | Kết quả | Bằng chứng | Ghi chú |
|---|---|---|---|
| FX-01..FX-13, FX-15, FX-16, FX-18..FX-20 | PASS | Unit 353 + e2e 162 xanh, cùng các test như vòng 1 | Không đổi |
| FX-14 | PASS (review) | Như vòng 1 | Bước thủ công 2 trình duyệt vẫn cần chạy |
| FX-17 | FAIL | `e2e/fx-perf.spec.ts` "FX-17 a 110 key run…" và `e2e/fx-qc-sound-perf.spec.ts`, chạy lặp: `Received: ["particles 67"]` | Long task ≤ 100ms ✅ (âm bật/tắt), canvas ≤ 1 ✅, bundle ✅; trần 60 node DOM bị vượt ngắt quãng |

### Edge cases & hồi quy
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| E1 | FAIL (ngắt quãng) | Gõ nhanh, nhiều chùm chồng nhau → 67 node `.fx-p` |
| E9 (CPU 4x) | PASS về long task | Không lần nào > 100ms trong ~80 lượt |
| E4, E11, E12, E14 | PASS | Như vòng 1 |
| HF-01..04, KR-10/14/15/16/20, ComboAnnouncer | PASS | e2e xanh; HF-01 flake 1 lần lúc chạy toàn bộ, chạy riêng 6/6 xanh; `kr-perf` 5/5 |

### Test QC thêm
- Không thêm test mới. `e2e/fx-qc-sound-perf.spec.ts` (vòng 1) vẫn chưa commit theo yêu cầu điều phối.

### Việc DEV cần làm (chỉ khi FAIL)
1. FX-17: trên `next start` CPU 4x, số node `.fx-p` đôi khi lên 67 (> trần 60), cả khi âm tắt. Nghi ngờ: sticker rain trong `apps/web/src/components/game/fx/FxBackdrop.tsx:81,100` dùng class `fx-p` và được cấp theo `liveParticleCount()` lúc render, nhưng không cộng vào `liveTotal` của `apps/web/src/lib/fx/dom-particles.ts:24,48`, nên spark/confetti phát sau đó (khi sticker còn sống ~1.5–1.9s) không tính sticker vào trần. Tái hiện: `pnpm build && cd apps/web && PORT=3107 KR_PERF=1 E2E_SERVER_CMD="pnpm exec next start -p 3107" pnpm exec playwright test e2e/fx-perf.spec.ts e2e/fx-qc-sound-perf.spec.ts --repeat-each 6` (lặp 2–3 lần, fail khoảng 1/20).

## Vòng 1
### Gate
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | ✅ 0 errors, 40 warnings (cũ) |
| `pnpm typecheck` | ✅ 4/4 tasks successful |
| `pnpm test` | ✅ engine 255 passed, web 352 passed (52 files) |
| `pnpm build` | ✅ compiled; `/` 22.4 kB, First Load JS 169 kB |
| `bash ../scripts/ci/check-tdd-commits.sh origin/main HEAD` | ✅ OK (66 commits) |
| `PORT=3107 pnpm --filter @typing-adventure/web test:e2e` (next dev) | ✅ 162 passed (6.7m) |
| `KR_PERF=1 E2E_SERVER_CMD="pnpm exec next start -p 3107" playwright test fx-perf kr-perf --repeat-each 3` | ✅ 6 passed (soundEnabled=false) |
| `KR_PERF=1 ... playwright test e2e/fx-qc-sound-perf.spec.ts --repeat-each 3` (QC, soundEnabled=true) | ❌ 3/3 failed: long task max 114 / 115 / 119 ms (> 100) |

### Acceptance criteria
| AC | Kết quả | Bằng chứng | Ghi chú |
|---|---|---|---|
| FX-01 | PASS | `fx-label.test.tsx`, `fx-css.test.ts`, `e2e/fx-combo.spec.ts` "FX-01 FX-03 label centered above text" ✅ | |
| FX-02 | PASS | `fx-tiers.test.ts` tierOf hits/misses/milestones, `fx-director.test.ts`, `fx-combo.spec.ts` "FX-02 no label at 3 or 6-9" ✅ | |
| FX-03 | PASS | `fx-combo.spec.ts` "FX-03 label centered at {width}px", "FX-03 E1 a new tier replaces the label at once"; `fx-store.test.ts` expire ✅ | |
| FX-04 | PASS | `fx-tiers.test.ts` materials/soundCue, `fx-layers.test.tsx`, `OwlMascot.test.tsx`, `fx-combo.spec.ts` "FX-04 tier materials 15 to 40…", `fx-owl.spec.ts` ✅ | |
| FX-05 | PASS | `fx-pick.test.ts` no repeat/determinism/jitter/pool sizes, `fx-i18n.test.ts`, `fx-combo.spec.ts` "FX-05 praise varies" ✅ | |
| FX-06 | PASS | `fx-meter.test.tsx`, `fx-tiers.test.ts` meterLevel, `fx-layout.spec.ts` ✅ | |
| FX-07 | PASS | `fx-combo.spec.ts` "FX-07 pop variety without moving neighbours", `fx-css.test.ts` ✅ | |
| FX-08 | PASS | `fx-combo.spec.ts` "FX-08 sparks start at the typed char…", "FX-08 level some has no sparks", `fx-budget.test.ts` ✅ | |
| FX-09 | PASS | `fx-sound.test.ts` pentatonic / gain ceiling / disabled, `fx-tiers.test.ts` noteStep ✅ | |
| FX-10 | PASS | `fx-combo.spec.ts` "FX-10 word effects vary and never cover the next char", `fx-director.test.ts` ✅ | |
| FX-11 | PASS | `fx-pick.test.ts` probability 600, `fx-owl.test.tsx`, `fx-owl.spec.ts`, `fx-layout.spec.ts` ✅ | |
| FX-12 | PASS | `fx-owl.test.ts`, `fx-director.test.ts`, `fx-store.test.ts` idle, `fx-owl.spec.ts` ✅ | |
| FX-13 | PASS | `fx-director.test.ts` miss ≥3/<3, `fx-meter.test.tsx`, `fx-combo.spec.ts` miss at 41 ✅ | |
| FX-14 | PASS (review) | `fx-levels.test.ts`, `settings-effects.test.ts` (route 200/400/401, store default/sync/loadFromServer/offline), `EffectsLevelField.test.tsx`, `fx-settings.spec.ts` ✅; `src/stores/settings-store.ts:149` sync, `:154` parse; `src/app/api/users/me/settings/route.ts:20` enum | Bước thủ công (chưa chạy trên DB thật): đăng nhập trình duyệt A, chọn "Ít", kiểm `PUT /api/users/me/settings` trả 200; đăng nhập cùng tài khoản ở trình duyệt B (profile sạch), mở SettingsPanel, mức hiện "Ít" |
| FX-15 | PASS | `fx-motion.spec.ts`, `fx-levels.test.ts` effectiveLevel, `fx-confetti.test.ts` reduced, `fx-css.test.ts` ✅ | |
| FX-16 | PASS | `fx-css.test.ts` chu kỳ ≥ 334ms / backdrop ≤ 0.6 / không flash, `fx-budget.test.ts` flashGate ✅ | |
| FX-17 | FAIL | `e2e/fx-qc-sound-perf.spec.ts` "FX-17 qc sound on…": `Expected: <= 100, Received: 114` (và 115, 119) | Với âm tắt `fx-perf` xanh 3/3. Bundle `/` 157 → 169 kB (+12 kB ≤ 15) ✅; canvas ≤1, hidden tab, không request ✅ |
| FX-18 | PASS | `fx-combo.spec.ts` "FX-18 finish, replay and settings clear every effect", `fx-store.test.ts`, `fx-layers.test.tsx` ✅ | |
| FX-19 | PASS | `fx-layout.spec.ts` (5 viewport × fingerGuide, elementFromPoint, no h-scroll, touch), `fx-css.test.ts` ✅ | |
| FX-20 | PASS | `fx-i18n.test.ts`, `fx-combo.spec.ts` "FX-20 tier 10 label in {theme} {lang}" (axe) , `fx-settings.spec.ts` ✅ | |

### Edge cases & hồi quy
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| E1 | PASS | `fx-combo.spec.ts` "FX-03 E1…", "FX-17 tier 75 keeps at most one active canvas" |
| E4 | PASS | `fx-combo.spec.ts` "FX-04 E4 a miss while the runner runs…" |
| E9 (CPU 4x) | FAIL khi âm bật | `fx-qc-sound-perf.spec.ts` long task 114–119ms |
| E11 | PASS | `fx-layout.spec.ts` touch |
| E12 | PASS | `fx-combo.spec.ts` "FX-17 a hidden tab stops every canvas", `fx-owl.spec.ts` no timers |
| E14 | PASS | `settings-effects.test.ts` route 400 |
| HF-01..04, KR-10/14/15/16/20, ComboAnnouncer | PASS | `hf-layout.spec.ts`, `kr-*.spec.ts`, `ComboAnnouncer.test.tsx` trong 162 e2e + 352 unit xanh; `kr-perf` 3/3 (âm tắt) |

### Test QC thêm
- `typing-adventure/apps/web/e2e/fx-qc-sound-perf.spec.ts` — FX-17 (bản `fx-perf` với `soundEnabled: true`, mặc định của store `src/stores/settings-store.ts:65`) — chưa commit (theo yêu cầu điều phối)

### Việc DEV cần làm (chỉ khi FAIL)
1. FX-17: với `soundEnabled: true` (giá trị mặc định), lượt gõ 110 phím ở CPU 4x trên `next start` có long task 114–119ms (> 100). DEV đã xác định nguyên nhân là `new AudioContext()` trong `SoundEngine.init()` chạy ở phím đầu (`useSound`); fix 395a1fa chỉ áp dụng khi âm tắt. Tái hiện: `pnpm build && cd apps/web && PORT=3107 KR_PERF=1 E2E_SERVER_CMD="pnpm exec next start -p 3107" pnpm exec playwright test e2e/fx-qc-sound-perf.spec.ts --repeat-each 3`.
