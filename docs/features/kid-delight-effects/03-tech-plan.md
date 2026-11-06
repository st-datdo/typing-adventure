# FX · Hiệu ứng "đã mắt" cho trẻ: juice từng phím, combo leo thang, ít lặp lại — Tech plan

Trạng thái: approved
Nguồn: 01-requirements.md (FX-01..FX-20), 02-design.md, 00-research.md

## Hướng tiếp cận
Toàn bộ là client trong `apps/web`, cộng i18n và một trường settings. Không đổi luật game, không đổi `packages/game-engine`, không đổi Prisma.

1. **Logic thuần trong `apps/web/src/lib/fx/`**, không đặt trong `game-engine`.
   - Thang tầng, ma trận mức × nhóm hiệu ứng, bậc nốt, chọn biến thể chống lặp, ngân sách hạt, giới hạn nhấp nháy và bộ điều phối (reducer) đều là *trình bày*. Chúng không đổi điểm, combo hay kết quả. `COMBO_MILESTONES`/`isComboMilestone` giữ nguyên (FX-02).
   - Cùng lập luận với HF (phương án C bị loại) và tiền lệ `lib/kr/combo-celebration.ts`, `lib/hf/fireworks.ts`.
   - Vẫn theo luật thuần của `.claude/rules/game-engine.md`: không DOM, không timer, không gọi `Math.random` trực tiếp. RNG (`mulberry32(seed)`) và `now` được inject vào. Mọi hàm có test Vitest trong `apps/web/src/lib/__tests__/fx-*.test.ts`.
2. **Một reducer điều phối `fxStep(state, event, rng)`** (`lib/fx/director.ts`) và một Zustand store mỏng `stores/fx-store.ts`, giống mẫu `combo-celebration-store`.
   - Mỗi phím được engine chấm gọi đúng **một** `dispatch({ type: 'key', … })` từ `useGameEngine.handleKeypress`. Reducer trả về các "slot" hiệu ứng có `id`: `pop`, `sparks`, `word`, `label`, `confetti`, `runner`, `rain`, `fireworks`, `evolve`, `bubble`, `owl`. Ngoài ra có các trạng thái giữ `sky`, `accessory`, `superMode` và `meter.smokeId`.
   - Store hẹn `expire` theo bảng TTL. Component chỉ đọc slot, nên không có `setState` theo từng hạt.
3. **Suppress tính ngay lúc render**: `fxSuppressed = showCelebration || panel !== 'none' || navOpen || gameState.startTime === null || gameState.isFinished` trong `GameEngine`. Mọi lớp one-shot trả `null` khi suppressed, nên hiệu ứng bị gỡ cùng lần render với `CelebrationModal` (FX-18, không chờ `useEffect`). Store được `reset()` khi hết ván/ván mới. Khi suppressed, reducer không sinh one-shot mới.
4. **Hạt DOM dùng pool node imperative** (`lib/fx/dom-particles.ts`): một container `.fx-word-layer`, tối đa 60 node `.fx-p` dùng chung cho hạt phím, pháo giấy của từ và mưa sticker. Chỉ animate `transform`/`opacity` (FX-08, FX-17).
5. **Canvas: `canvas-confetti` (ISC), tải trễ.**
   - Tạo bằng `confetti.create(canvas, { resize: true, useWorker: false })` trên 2 canvas cố định: overlay L5 cho tầng 10 và backdrop L0 cho tầng 75+.
   - Controller `lib/fx/confetti.ts` chỉ cho **1** hiệu ứng canvas chạy cùng lúc: bắn mới thì gọi `reset()` cái cũ. Tổng hạt mỗi lần bắn ≤ 200. Khi `visibilitychange → hidden` thì `reset()`.
   - Module được prefetch bằng `requestIdleCallback(() => import('canvas-confetti'))` lúc mount `GameEngine`, nên không có request mạng sau phím đầu (FX-17). Nếu chưa tải xong lúc chạm tầng thì bỏ phần canvas, nhãn vẫn hiện (02-design Trạng thái).
   - Đã tra Context7 `/catdad/canvas-confetti`: `create`, `shapeFromPath({ path, matrix })` (cache kết quả), `reset`, `particleCount/angle/spread/gravity/ticks/origin/scalar/shapes`.
6. **Lớp nặng tải trễ bằng `next/dynamic(..., { ssr: false })`**: `TierRunner`, `FxBackdrop`, `TierConfetti` (sprite nhân vật/sticker). Loader được gọi sớm trong cùng idle callback để chunk có sẵn trước phím đầu. Mục tiêu: First Load JS `/` tăng ≤ 15 KB so với `8b09368` (FX-17). Đã tra Context7 Next.js: `dynamic(() => import(...), { ssr: false })` chỉ dùng trong Client Component, `GameEngine` đã là `'use client'`.
7. **Âm**: thêm `SoundEngine.playStep(step)` dùng `PENTATONIC[step]`, gain đỉnh 0.12, bằng `correct` (FX-09). Không dùng `playNote`, vì gain 0.14 vượt trần. `useGameEngine` chọn âm theo `soundCue(combo)`: tầng → âm tầng, còn lại → nốt. `wrong` giữ nguyên.
8. **Settings `effectsLevel: 'lots' | 'some' | 'few'`**, mặc định `lots`.
   - Guest: `persist` localStorage hiện có. Không cần tăng `version`, vì persist merge nông nên field thiếu sẽ lấy default.
   - User đăng nhập: `syncSettingsToDB` → `PUT /api/users/me/settings`. Thêm `effectsLevel: z.enum(EFFECTS_LEVELS).optional()` vào schema. **Bắt buộc**: schema đang `.passthrough()`, không khai báo thì `"max"` vẫn lọt vào DB, sai FX-14/E14.
   - `loadFromServer` đọc qua `parseEffectsLevel`.
   - Mức hiệu lực = `effectiveLevel(setting, prefersReducedMotion)`, reduced → `few` (FX-15).
9. **Flash limiter (FX-16)**: `flashGate(times, now)` cho tối đa 3 hiệu ứng đổi độ sáng (vào nhãn, pháo, mưa, trời) trong 1000ms. Gõ 30ms/phím có thể chạm 5→10→15→20 trong < 1s. Khi vượt ngưỡng, nhãn vẫn đổi chữ nhưng `animate: false` (hiện tĩnh), không bắn canvas/mưa. Chuyển động lặp chỉ dùng `transform`. Keyframe lặp có `opacity` phải có chu kỳ ≥ 334ms, có test đọc CSS.

Phương án đã loại:
- A. Đặt logic FX trong `packages/game-engine`: đó là trình bày, không phải luật chơi, và sẽ mở rộng type public của engine mà không có lợi cho server/multiplayer. Loại giống HF-C.
- B. Đổi `COMBO_MILESTONES` để có thêm tầng: làm đổi `ComboAnnouncer` và test KR/HF i18n, dồn thông báo cho trình đọc màn hình (Q2). Thang FX tách riêng.
- C. Làm tất cả bằng DOM, không canvas (giữ cách của HF): pháo hoa nền 4–6 chùm × 30–40 hạt (≤ 200) vượt trần 60 node DOM (FX-17). Pháo giấy 30+ hạt cộng hạt phím cũng chạm trần.
- D. `tsparticles` / `lottie-web` / Rive: nặng hơn nhiều (≥ 30 KB gz), khó giữ +15 KB, và ngoài phạm vi (mascot Rive/Lottie).
- E. `useWorker: true` của canvas-confetti: canvas chuyển sang worker thì không đọc trạng thái được, worker blob có thể hiện thành request `script` trong test FX-17. Với ≤ 200 hạt, main thread đủ nhẹ.
- F. Mỗi lớp hiệu ứng tự giữ state/timer riêng (như `ComboBurst`): khó bảo đảm "≤ 1 nhãn", "≤ 2 điểm chuyển động", gỡ cùng frame và chống lặp xuyên lớp. Một reducer kiểm được tất cả bằng unit test.

Giả định cho câu hỏi còn mở:
- Q1 có toggle, mặc định `lots`. Q2 thang riêng. Q3 gutter chỉ là nền. Q4 một bộ hình. Q5 dùng `canvas-confetti` tải trễ, trần +15 KB. Q6 không giọng đọc. Q7 1/6. Q8 mỗi +50. Q9 dùng lại âm có sẵn.
- **Âm tầng phát ở mọi mức** (kể cả `some`/`few`), vì FX-14 ghi "âm thanh FX-09: có" ở mọi mức. Tầng mà mức `some` bỏ chất liệu (15/40/75+) vẫn phát âm tầng. Nếu người dùng muốn tắt theo mức thì chỉ cần đổi `soundCue`.
- Tầng 3 ở mức `few`/reduced: đồng hồ đổi cấp `lit` và phát `pop`, không chuyển động.
- Owl desktop 48px, chữ "Typing Adventure" ẩn trực quan ≤ 480px, SVG do DEV vẽ (≤ 1.5 KB/hình), owl vẫy lặp mỗi 3s khi dừng (02-design câu hỏi a–d).
- `completedWord` của engine trả từ hai lần, ở ký tự cuối và ở dấu cách sau đó (`engine.ts:163-168`). FX-10/FX-11 chỉ kích hoạt khi `completedWord !== null && char !== ' '`, giống điều kiện `speakWord` (`useGameEngine.ts:104`).

## Hiện trạng code liên quan
- `typing-adventure/apps/web/src/hooks/useGameEngine.ts:42-44` — `clear()` celebration khi `startTime === null`; `:93-109` — `gameStore.handleKeypress` trả `{ isCorrect, completedWord, isMilestone }`, `finish()`/`celebrate()`, `playCorrect()`/`playWrong()`, `speakLetter/speakWord`. Đây là điểm dispatch FX duy nhất.
- `typing-adventure/packages/game-engine/src/engine.ts:118-141` — combo +1 khi đúng, `= 0` khi sai; `:163-168` `getCompletedWord` (trả 2 lần/từ); `:171-173` `isComboMilestone`.
- `typing-adventure/packages/game-engine/src/scoring.ts:5` — `COMBO_MILESTONES = [5,10,20,50]` (không đổi).
- `typing-adventure/apps/web/src/components/game/GameEngine.tsx:339-344` — `playing`, `data-playing`; `:391-395` — title TopBar `<GameOwl playing /> Typing Adventure`; `:447-450` — `.word-stage` + `<ComboBurst suppressed=… />`; `:461` CelebrationModal; `:522` `<ComboAnnouncer />`; `:47-48` `panel`, `navOpen`.
- `typing-adventure/apps/web/src/components/game/ComboBurst.tsx:13-66` — 2 `.combo-side` + `ComboFireworks`; container hẹn `clear(id)` sau `COMBO_BURST_MS`. **Đây là nơi duy nhất xoá `milestone`**, mà `ComboAnnouncer` cần. Khi bỏ ComboBurst phải chuyển timer sang `ComboAnnouncer`.
- `typing-adventure/apps/web/src/components/game/ComboAnnouncer.tsx:9-29` — `aria-live="polite"`, đọc `useComboCelebrationStore`.
- `typing-adventure/apps/web/src/lib/kr/combo-celebration.ts:4,26-45` — `COMBO_BURST_MS`, reducer, `praiseKey`. Giữ nguyên.
- `typing-adventure/apps/web/src/lib/hf/fireworks.ts` — bị xoá.
- `typing-adventure/apps/web/src/components/game/WordDisplay.tsx:20-27` — `justTypedIndex`; `:29-44` — `wordBurst` chỉ ở `soundMode='word'`; `:46-80` — `renderChar` (`char--pop`, `char--word-burst`); `:95-99` — pill `.combo-display` (bỏ); `:118-128` — `.word-display`; `:130-148` — `.word-foot`/`.progress-bar`.
- `typing-adventure/apps/web/src/components/game/GameOwl.tsx:6-15` — mood `happy`/`idle` theo `milestone`, `still` khi đang chơi.
- `typing-adventure/apps/web/src/components/mascot/OwlMascot.tsx:1-10` (8 mood), `:62,183,221` — `kr-loop` trên mắt/thân/zzz; `:198-270` — props `mood/size/still/className`.
- `typing-adventure/apps/web/src/styles/motion.css:18-21` — `[data-playing='true'] .kr-loop` paused (KR-16); `:54-56` wave chạy 2 lần; `:85-91` zzz + `.owl--still .kr-loop { animation: none }`; `:187-197` khối reduced-motion toàn cục.
- `typing-adventure/apps/web/src/lib/audio/sound-engine.ts:12` PENTATONIC; `:54-61` `playNote` gain 0.14; `:67-69` `correct` gain 0.12 (trần FX-09); `:81-106` `pop/boing/sparkle/fanfare/sticker` (gain ≤ 0.12).
- `typing-adventure/apps/web/src/hooks/useSound.ts:8-32` — `play(type)`, chưa có nốt theo bậc.
- `typing-adventure/apps/web/src/stores/settings-store.ts:8-59` state/DEFAULTS; `:61-66` `syncSettingsToDB` debounce 300ms; `:129-145` `loadFromServer`; `:151-171` persist `version: 1`, `partialize`.
- `typing-adventure/apps/web/src/app/api/users/me/settings/route.ts:7-18` — Zod `.passthrough()`; `:20-48` PUT merge JSON.
- `typing-adventure/packages/db/prisma/schema.prisma:26` — `settings Json @default("{}")`, không cần migration.
- `typing-adventure/apps/web/src/hooks/useProfileSync.ts:29-37` — gọi `loadFromServer` khi đăng nhập.
- `typing-adventure/apps/web/src/components/settings/SettingsPanel.tsx:76-89` — field "Giao diện" (chèn field Hiệu ứng ngay sau).
- `typing-adventure/apps/web/src/components/ui/ChoiceCards.tsx:14-20,44-49` — `columns?: 1 | 2`, `aria-labelledby`.
- `typing-adventure/apps/web/src/hooks/usePrefersReducedMotion.ts:19-22`.
- `typing-adventure/apps/web/src/styles/game.css:57-73` `.ta-head`/`.game-owl`; `:289-300` `.word-display-section` (relative); `:356-394` `charPop`/`wordBurst`; `:451-482` `.combo-display`; `:1397-1403` reduced-motion `.char--pop`.
- `typing-adventure/apps/web/src/styles/decor.css:83-245` `.word-stage`, `.combo-burst`, `.combo-side*`, `.fw-*`, keyframes `combo-pop/out`, `fw-rise/pop`; `:246-318` `.choice-cards*`; `:359-366` reduced-motion HF.
- `typing-adventure/apps/web/src/lib/security-headers.ts:42-48` — CSP `script-src 'self'`, `worker-src 'self' blob:` (chunk tải trễ là same-origin, hợp lệ).
- Test mẫu để bắt chước:
  - Pure: `apps/web/src/lib/__tests__/combo-celebration.test.ts`
  - Route: `apps/web/src/app/api/sessions/__tests__/sessions-plausibility.test.ts` (mock `@typing-adventure/db`, `@/lib/auth`, `vi.resetModules`)
  - Markup: `apps/web/src/components/game/__tests__/ComboBurst.test.tsx`, `game-chrome.test.tsx`, `mascot/__tests__/OwlMascot.test.tsx`, `ui/__tests__/ChoiceCards.test.tsx` (`renderToStaticMarkup`)
  - CSS: `styles/__tests__/kr-motion.test.ts` + `css-helpers.ts`
  - E2E: `e2e/helpers/kr.ts`, `e2e/helpers/hf.ts` (`startCustomText`, `repeatText`, `overlapReport`), `e2e/hf-perf.spec.ts` (CPU 4x, longtask, request), `e2e/hf-combo.spec.ts` (axe, theme × lang)

## File thay đổi
- `typing-adventure/apps/web/package.json` (sửa) — `canvas-confetti` (dependencies), `@types/canvas-confetti` (devDependencies). Không đổi `scripts`.
- `typing-adventure/pnpm-lock.yaml` (sửa)
- `typing-adventure/apps/web/src/lib/fx/tiers.ts` (thêm) — `TIER_BASE`, `tierOf`, `nextTierInfo`, `meterLevel`, `noteStep`, `soundCue`, `TIER_MATERIALS`, `materialsFor`.
- `typing-adventure/apps/web/src/lib/fx/levels.ts` (thêm) — `EFFECTS_LEVELS`, `EffectsLevel`, `parseEffectsLevel`, `effectiveLevel`, `levelAllows`.
- `typing-adventure/apps/web/src/lib/fx/rng.ts` (thêm) — `mulberry32`, `jitter`.
- `typing-adventure/apps/web/src/lib/fx/pick.ts` (thêm) — `pickNonRepeating`, `windowFor`.
- `typing-adventure/apps/web/src/lib/fx/pools.ts` (thêm) — mọi pool (kiểu pop, hình hạt, kiểu từ, kiểu nhãn, nhân vật, trời, phụ kiện, siêu cấp, sticker, biến hình, pháo nền, key câu khen/owl/động viên).
- `typing-adventure/apps/web/src/lib/fx/budget.ts` (thêm) — `DOM_NODE_CAP`, `CANVAS_PARTICLE_CAP`, `allocateNodes`, `canvasBurstPlan`, `flashGate`.
- `typing-adventure/apps/web/src/lib/fx/director.ts` (thêm) — `FxState`, `FxEvent`, `INITIAL_FX`, `FX_TTL`, `fxStep`.
- `typing-adventure/apps/web/src/lib/fx/owl.ts` (thêm) — `OWL_PRIORITY`, `mergeOwlMood`, `idleMood`.
- `typing-adventure/apps/web/src/lib/fx/dom-particles.ts` (thêm) — pool node `.fx-p` ≤ 60 (DOM, không thuần).
- `typing-adventure/apps/web/src/lib/fx/confetti.ts` (thêm) — loader + controller canvas (1 hiệu ứng, reset khi ẩn tab).
- `typing-adventure/apps/web/src/lib/__tests__/fx-tiers.test.ts` (thêm)
- `typing-adventure/apps/web/src/lib/__tests__/fx-levels.test.ts` (thêm)
- `typing-adventure/apps/web/src/lib/__tests__/fx-pick.test.ts` (thêm)
- `typing-adventure/apps/web/src/lib/__tests__/fx-budget.test.ts` (thêm)
- `typing-adventure/apps/web/src/lib/__tests__/fx-director.test.ts` (thêm)
- `typing-adventure/apps/web/src/lib/__tests__/fx-owl.test.ts` (thêm)
- `typing-adventure/apps/web/src/lib/__tests__/fx-sound.test.ts` (thêm)
- `typing-adventure/apps/web/src/lib/__tests__/fx-i18n.test.ts` (thêm)
- `typing-adventure/apps/web/src/lib/__tests__/fx-confetti.test.ts` (thêm)
- `typing-adventure/apps/web/src/lib/hf/fireworks.ts` (xoá)
- `typing-adventure/apps/web/src/lib/__tests__/hf-fireworks.test.ts` (xoá)
- `typing-adventure/apps/web/src/lib/audio/sound-engine.ts` (sửa) — `playStep(step)`.
- `typing-adventure/apps/web/src/hooks/useSound.ts` (sửa) — `playStep`.
- `typing-adventure/apps/web/src/hooks/useGameEngine.ts` (sửa) — dispatch FX, `soundCue`, reset FX.
- `typing-adventure/apps/web/src/hooks/useOwlIdle.ts` (thêm) — hẹn 5s/15s, dừng khi suppressed/ẩn tab.
- `typing-adventure/apps/web/src/stores/fx-store.ts` (thêm)
- `typing-adventure/apps/web/src/stores/__tests__/fx-store.test.ts` (thêm)
- `typing-adventure/apps/web/src/stores/settings-store.ts` (sửa) — `effectsLevel`, `setEffectsLevel`, `loadFromServer`.
- `typing-adventure/apps/web/src/stores/__tests__/settings-effects.test.ts` (thêm)
- `typing-adventure/apps/web/src/app/api/users/me/settings/route.ts` (sửa) — `effectsLevel` enum.
- `typing-adventure/apps/web/src/app/api/users/me/settings/__tests__/settings-effects.test.ts` (thêm)
- `typing-adventure/apps/web/src/components/ui/ChoiceCards.tsx` (sửa) — `columns` 3, `describedBy`.
- `typing-adventure/apps/web/src/components/ui/__tests__/ChoiceCards.test.tsx` (sửa)
- `typing-adventure/apps/web/src/components/settings/EffectsLevelField.tsx` (thêm) — View theo props + container đọc store.
- `typing-adventure/apps/web/src/components/settings/__tests__/EffectsLevelField.test.tsx` (thêm)
- `typing-adventure/apps/web/src/components/settings/SettingsPanel.tsx` (sửa) — chèn `<EffectsLevelField />` sau field theme.
- `typing-adventure/apps/web/src/components/game/fx/OwlDock.tsx` (thêm)
- `typing-adventure/apps/web/src/components/game/fx/ComboMeter.tsx` (thêm)
- `typing-adventure/apps/web/src/components/game/fx/ComboLabel.tsx` (thêm)
- `typing-adventure/apps/web/src/components/game/fx/KeyParticles.tsx` (thêm)
- `typing-adventure/apps/web/src/components/game/fx/WordCompleteFx.tsx` (thêm)
- `typing-adventure/apps/web/src/components/game/fx/TierRunner.tsx` (thêm)
- `typing-adventure/apps/web/src/components/game/fx/FxBackdrop.tsx` (thêm) — trời, mưa sticker, canvas pháo nền.
- `typing-adventure/apps/web/src/components/game/fx/TierConfetti.tsx` (thêm)
- `typing-adventure/apps/web/src/components/game/fx/OwlBubble.tsx` (thêm)
- `typing-adventure/apps/web/src/components/game/fx/sprites.tsx` (thêm) — SVG hạt, sticker, nhân vật, phụ kiện, sao.
- `typing-adventure/apps/web/src/components/game/__tests__/fx-meter.test.tsx` (thêm)
- `typing-adventure/apps/web/src/components/game/__tests__/fx-label.test.tsx` (thêm)
- `typing-adventure/apps/web/src/components/game/__tests__/fx-word.test.tsx` (thêm)
- `typing-adventure/apps/web/src/components/game/__tests__/fx-owl.test.tsx` (thêm)
- `typing-adventure/apps/web/src/components/game/__tests__/fx-layers.test.tsx` (thêm)
- `typing-adventure/apps/web/src/components/game/__tests__/ComboAnnouncer.test.tsx` (thêm) — chuyển 1 case announcer từ ComboBurst.test.tsx.
- `typing-adventure/apps/web/src/components/game/ComboBurst.tsx` (xoá)
- `typing-adventure/apps/web/src/components/game/ComboFireworks.tsx` (xoá)
- `typing-adventure/apps/web/src/components/game/__tests__/ComboBurst.test.tsx` (xoá)
- `typing-adventure/apps/web/src/components/game/ComboAnnouncer.tsx` (sửa) — nhận timer `clear(id)` sau `COMBO_BURST_MS`.
- `typing-adventure/apps/web/src/components/game/GameEngine.tsx` (sửa)
- `typing-adventure/apps/web/src/components/game/WordDisplay.tsx` (sửa) — bỏ `.combo-display`, `data-i`, `data-pop`, `data-fx-super`, `.fx-word-layer`, `.fx-runner-track`, bỏ `wordBurst`.
- `typing-adventure/apps/web/src/components/game/__tests__/game-chrome.test.tsx` (sửa) — case KR-05 combo pill.
- `typing-adventure/apps/web/src/components/game/GameOwl.tsx` (sửa)
- `typing-adventure/apps/web/src/components/mascot/OwlMascot.tsx` (sửa) — `accessory`, `evolve`, `live`.
- `typing-adventure/apps/web/src/components/mascot/__tests__/OwlMascot.test.tsx` (sửa)
- `typing-adventure/apps/web/src/styles/fx.css` (thêm)
- `typing-adventure/apps/web/src/styles/globals.css` (sửa) — `@import './fx.css'` sau `game.css`.
- `typing-adventure/apps/web/src/styles/game.css` (sửa) — bỏ `.combo-display`, `charPop`, `wordBurst`, `.char--pop`/`.char--word-burst`; `.ta-head { z-index: 2 }`.
- `typing-adventure/apps/web/src/styles/decor.css` (sửa) — bỏ `.combo-burst`, `.combo-side*`, `.fw-*`, keyframes HF; thêm `.choice-cards--3`.
- `typing-adventure/apps/web/src/styles/__tests__/fx-css.test.ts` (thêm)
- `typing-adventure/apps/web/src/styles/__tests__/hf-decor.test.ts` (xoá)
- `typing-adventure/packages/i18n/src/vi.ts` (sửa) — 59 key `fx*`.
- `typing-adventure/packages/i18n/src/en.ts` (sửa) — 59 key `fx*`.
- `typing-adventure/apps/web/e2e/helpers/fx.ts` (thêm) — `topmostReport`, `sampleTopmost`, `fxCounts`, `typeTo`.
- `typing-adventure/apps/web/e2e/fx-combo.spec.ts` (thêm)
- `typing-adventure/apps/web/e2e/fx-layout.spec.ts` (thêm)
- `typing-adventure/apps/web/e2e/fx-owl.spec.ts` (thêm)
- `typing-adventure/apps/web/e2e/fx-settings.spec.ts` (thêm)
- `typing-adventure/apps/web/e2e/fx-motion.spec.ts` (thêm)
- `typing-adventure/apps/web/e2e/fx-perf.spec.ts` (thêm)
- `typing-adventure/apps/web/e2e/hf-combo.spec.ts` (xoá)
- `typing-adventure/apps/web/e2e/hf-qc.spec.ts` (xoá)
- `typing-adventure/apps/web/e2e/hf-perf.spec.ts` (xoá)
- `typing-adventure/apps/web/e2e/hf-layout.spec.ts` (sửa) — dòng 142 `.combo-burst` → `.fx-combo-label`.
- `typing-adventure/apps/web/e2e/kr-motion.spec.ts` (sửa) — dòng 22-23.
- `typing-adventure/apps/web/e2e/kr-game.spec.ts` (sửa) — KR-09 dòng 46-60.
- `docs/features/kid-delight-effects/**`

## Thay đổi DB
Không có migration. `User.settings` là cột `Json @default("{}")` (`schema.prisma:26`). Route merge key mới `effectsLevel` vào JSON hiện có. User cũ không có key này thì `loadFromServer` không ghi đè, store dùng default `lots`. Không seed.

## Thay đổi API / contract
| Method + route | Auth | Request (Zod) | Response `{success,data|error}` | Status lỗi |
|---|---|---|---|---|
| `PUT /api/users/me/settings` (sửa) | `getSessionUser()`, null → `unauthorized()` | schema hiện có + `effectsLevel: z.enum(['lots','some','few']).optional()` (lấy từ `EFFECTS_LEVELS`), vẫn `.passthrough()` | `ok(settings)`, có `effectsLevel` sau merge | 400 `err(message)` khi `effectsLevel` ngoài enum (`"max"`, số, chuỗi dài); 401; 500 |

- Socket.IO: không. Type public game-engine: không. Prisma: không.
- i18n: thêm 59 key ở cả `vi.ts` và `en.ts`, đúng bảng 02-design:
  - `fxLabel`, `fxDesc`, `fxLots`, `fxSome`, `fxFew`, `fxLotsHint`, `fxSomeHint`, `fxFewHint`, `fxReducedNote`
  - `fxPraise1..24`, `fxOwlPraise1..20`, `fxOwlEncourage1..6`
  - Giữ `comboPraise5/10/20/50`, `comboAnnounce`.
- localStorage `typingAdventure_settings`: thêm `state.effectsLevel`, `version` giữ 1.
- Contract nội bộ (`apps/web/src/lib/fx`):
  - `tierOf(combo: number): number | null`: `[3,5,10,15,20,30,40,50,75,100]`, sau đó 150, 200… (mỗi +50).
  - `nextTierInfo(combo): { prev: number; next: number; progress: number }`
  - `meterLevel(combo): 'off' | 'lit' | 'hot' | 'super'` (0–2, 3–9, 10–29, ≥ 30)
  - `noteStep(combo) = min(floor(combo / 5), 9)`
  - `soundCue(combo): { kind: 'tier'; sound: SoundType } | { kind: 'note'; step: number }` (tầng 30 → note)
  - `materialsFor(tier, level): Material[]`, `Material = 'meterLit' | 'label' | 'cheer' | 'confetti' | 'runner' | 'sky' | 'accessory' | 'super' | 'rain' | 'evolve' | 'fireworks'`
  - `EFFECTS_LEVELS = ['lots','some','few'] as const`
  - `effectiveLevel(level, reduced) => reduced ? 'few' : level`
  - `levelAllows(level, group)` với `group ∈ 'pop' | 'sparks' | 'word' | 'owlPraise'`
  - `parseEffectsLevel(v: unknown): EffectsLevel | null`
  - `mulberry32(seed): () => number`; `jitter(base, rng, pct = 0.2, cap?)`
  - `pickNonRepeating<T>(pool: readonly T[], history: readonly T[], k: number, rng) => { item: T; history: T[] }`; `windowFor(n) = min(3, n - 1)`
  - `allocateNodes(alive, requested, cap = 60)`; `canvasBurstPlan(kind, rng): { bursts: { x; y; count; shape }[] }` với tổng `count ≤ 200`; `flashGate(times: number[], now, max = 3, windowMs = 1000) => { ok: boolean; times: number[] }`
  - `fxStep(state: FxState, event: FxEvent, rng: () => number): FxState` với
    `FxEvent = { type: 'key'; correct: boolean; combo: number; index: number; char: string; word: [number, number] | null; now: number } | { type: 'expire'; slot: FxSlot; id: number } | { type: 'idle'; mood: 'wave' | 'sleep' } | { type: 'level'; value: EffectsLevel } | { type: 'suppress'; value: boolean } | { type: 'reset' }`
  - `mergeOwlMood(cur, next)` theo ưu tiên `encourage > cheer > thinking > happy > wave = sleep > idle`; `idleMood(msSinceKey): 'wave' | 'sleep' | null` (≥ 5000 / ≥ 15000)
- `SoundEngine.playStep(step: number): void`; `useSound().playStep`.
- `OwlMascot` thêm props tuỳ chọn:
  - `accessory?: 'sunglasses' | 'party-hat' | 'crown' | 'headphones' | 'bowtie'`
  - `evolve?: 'phoenix' | 'star' | 'hero'`
  - `live?: boolean`: dùng class `fx-loop` thay `kr-loop` để vẫy/zzz chạy được khi `data-playing=true`.
  - Mặc định không đổi markup cũ.
- `ChoiceCards` thêm `columns?: 1 | 2 | 3`, `describedBy?: string`.
- DOM hook cho test/e2e:
  - `.fx-combo-label[data-tier][data-style]`
  - `.combo-meter[data-level][data-smoke]` (số trong `.combo-meter-num`)
  - `.char[data-i][data-pop]`
  - `.word-display[data-fx-super]`
  - `.ta-screen[data-fx-sky]`
  - `.fx-p` (mọi hạt DOM)
  - `.fx-runner[data-character]`
  - `.fx-word[data-kind]`
  - `.fx-owl-bubble[data-kind]`
  - `canvas.fx-canvas[data-active]`
  - `.game-owl[data-mood][data-accessory][data-evolve]`

## Rủi ro
| Rủi ro | Khả năng | Ảnh hưởng | Giảm thiểu |
|---|---|---|---|
| Ở CPU 4x, gõ 30ms/phím mà mỗi phím đều re-render nhiều lớp + hạt → long task > 100ms, mất phím (FX-17) | Trung bình | Fail FX-17 | Mỗi phím 1 `dispatch`. Selector Zustand theo slot (`useFxStore(s => s.label)`). Hạt qua pool DOM imperative, không React. `memo` cho các lớp. Canvas ≤ 200 hạt. `fx-perf.spec` đo trên `next start` như HF (dev server vốn đã đỏ long task, xem HF "Thực tế") |
| First Load JS `/` tăng > 15 KB (59 × 2 chuỗi i18n + SVG + logic) | Trung bình | Fail FX-17 | `TierRunner`/`FxBackdrop`/`TierConfetti` + `canvas-confetti` tải bằng `next/dynamic`/`import()`. Sprite runner/sticker nằm trong chunk trễ. Đo ở T18 so với `8b09368`. Vượt thì chuyển thêm `WordCompleteFx`/`OwlBubble` sang dynamic |
| Chunk tải trễ phát request sau phím đầu | Trung bình | Fail FX-17 "không request mạng" | Prefetch trong `requestIdleCallback` lúc mount `GameEngine` (fallback `setTimeout 300`). E2E chờ `networkidle` trước phím đầu như `hf-perf`. Chưa tải xong thì bỏ hiệu ứng canvas |
| Gõ nhanh chạm 4–5 tầng trong 1s → nhãn/pháo đổi độ sáng > 3 lần/s | Cao | Fail FX-16 | `flashGate` trong reducer: quá ngưỡng thì nhãn `animate: false`, không bắn canvas/mưa. Có test đơn vị + `fx-css.test` kiểm chu kỳ keyframe lặp ≥ 334ms |
| Xoá test HF (ComboBurst, hf-fireworks, hf-decor, hf-combo, hf-qc, hf-perf) bị coi là làm yếu test | Chắc chắn | Review/QC nghi ngờ, CI | Xoá trong commit `test(FX)` cùng lúc thêm test FX thay thế (đỏ). Body commit trích bảng "AC HF bị thay thế" (01-requirements:21-33). `feat(FX)` không chạm file test (`check-tdd-commits.sh`). Ma trận dưới ánh xạ HF-05..11 → test FX |
| Bỏ `ComboBurst` làm mất timer xoá `milestone` → announcer giữ câu cũ, owl kẹt | Cao nếu quên | ComboAnnouncer sai | T11 chuyển timer vào `ComboAnnouncer` (container), có test fake timers trong `ComboAnnouncer.test.tsx` |
| `.kr-loop` bị pause khi chơi (KR-16) nên owl vẫy/zzz đứng im giữa ván | Chắc chắn nếu dùng `kr-loop` | Fail FX-12 | `OwlMascot live` dùng `fx-loop`. `kr-game.spec` KR-16 vẫn kiểm mọi `.kr-loop` paused |
| `useEffect` reset FX chạy sau paint → còn hiệu ứng 1 frame trên `CelebrationModal` | Trung bình | Fail FX-18 | Suppress tính trong render (`fxSuppressed`), store `reset()` đồng bộ trong `handleKeypress` khi `after.isFinished` |
| `.passthrough()` cho `effectsLevel: "max"` lọt DB | Chắc chắn nếu không khai báo | Fail FX-14/E14 | Khai báo enum, test route 400 + `prisma.user.update` không được gọi |
| `getCompletedWord` trả từ 2 lần (ký tự cuối và dấu cách) | Chắc chắn | FX-10/11 kích hoạt đôi | Chỉ dispatch `word` khi `char !== ' '`; test director "space after word không sinh word fx" |
| `canvas-confetti` `origin` tính theo phần viewport, canvas phải phủ đúng viewport | Thấp | Pháo lệch chữ | Canvas `position: fixed; inset: 0`, `resize: true`. Origin = rect ký tự / `innerWidth`/`innerHeight`. Tầng 10: `angle 90 ± 35`, `gravity 0.6`, `ticks ~ 90` để tắt trước khi rơi về dòng chữ (FX-19) |
| axe có thể bỏ qua chữ nằm trong `aria-hidden` → FX-20 contrast "xanh giả" | Trung bình | Bỏ sót contrast | Màu chữ FX chỉ dùng cặp token `--kr-on-*`/`--kr-*` và `--kr-fg`/`--kr-card` đã có test trong `kr-tokens.test.ts`. `fx-css.test` kiểm `.fx-combo-label*`, `.fx-owl-bubble`, `.combo-meter` chỉ dùng các cặp đó |
| Dependency mới: `canvas-confetti` (ISC, ~4 KB gz, không phụ thuộc phụ) + `@types/canvas-confetti` (dev) | — | Bundle/supply chain | Lý do: Q5, FX-17 (≤ 200 hạt canvas). Thêm bằng `pnpm --filter @typing-adventure/web add`. `guard-diff.sh` chỉ chặn đổi `scripts` nên không cần label |
| Nhiều task UI cùng sửa `GameEngine.tsx`/`WordDisplay.tsx` → xung đột thứ tự | Trung bình | Task không tự xanh | Thứ tự cố định T10 → T17. Mỗi task chỉ mount lớp của nó |

## Tasks

Luật TDD cho mọi task (CI `scripts/ci/check-tdd-commits.sh`):
- Commit `test(FX): …` chứa file test mới/sửa/xoá, đỏ khi chạy. Sau đó commit `feat(FX): …` chỉ chứa code, không chạm `__tests__/`, `*.test.ts(x)`, `e2e/*.spec.ts`.
- `e2e/helpers/fx.ts` commit trong `test:`.
- Xoá test HF chỉ trong commit `test(FX)`. Body ghi "replaces HF-0x per 01-requirements 'AC HF bị thay thế'".
- Sau `feat:` mà cần sửa test thì làm commit `test:` mới.

Lệnh chung (từ `typing-adventure/`): `W="pnpm --filter @typing-adventure/web"`.

### T1 · Thang tầng, cấp đồng hồ, bậc nốt, âm tầng — AC: FX-02, FX-04, FX-06, FX-09
- Test (viết trước, phải đỏ): `typing-adventure/apps/web/src/lib/__tests__/fx-tiers.test.ts`
  - `FX-02 tierOf hits`: 3,5,10,15,20,30,40,50,75,100,150,200,250 → chính nó.
  - `FX-02 tierOf misses`: 0,1,2,4,6,7,8,9,51,101,149,151 → `null`.
  - `FX-02 milestones untouched`: `COMBO_MILESTONES` vẫn `[5,10,20,50]`.
  - `FX-06 meterLevel` tại các biên 0/2/3/9/10/29/30/500.
  - `FX-06 nextTierInfo(7)` = `{ prev: 5, next: 10, progress: 0.4 }`; `(0)` → prev 0, next 3; `(120)` → 100/150.
  - `FX-09 noteStep`: 1–4 → 0, 5 → 1, 9 → 1, 44 → 8, 45 → 9, 300 → 9.
  - `FX-04 FX-09 soundCue`: 3 pop, 5/10 sparkle, 15 boing, 20 fanfare, 30 → note bậc 6, 40 sticker, 50/75/100/150 fanfare, 7 → note bậc 1.
  - `FX-04 materialsFor(t,'lots')` đúng bảng 02-design (3 meterLit; 5 label+cheer; 10 +confetti; 15 +runner; 20 +sky+accessory; 30 +super; 40 +rain; 50 +evolve; 75/100/150 +fireworks).
- Code: `typing-adventure/apps/web/src/lib/fx/tiers.ts` (bảng hằng + hàm). Import `SoundType` từ `lib/audio/sound-engine` (chỉ type).
- Verify: `cd typing-adventure && pnpm --filter @typing-adventure/web exec vitest run fx-tiers`
- Skill: không

### T2 · Mức hiệu ứng thuần — AC: FX-14, FX-15
- Test (viết trước, phải đỏ): `typing-adventure/apps/web/src/lib/__tests__/fx-levels.test.ts`
  - `FX-14 parseEffectsLevel`: `'lots'|'some'|'few'` → chính nó; `'max'`, `3`, `null`, `'x'.repeat(500)` → `null`.
  - `FX-14 levelAllows` theo bảng: pop (lots, some), sparks (chỉ lots), word (lots, some), owlPraise (lots, some).
  - `FX-14 materialsFor(t,'some')`: 15/30/40/75/100 chỉ còn `label` + `cheer`; 3/5/10/20/50 đủ.
  - `FX-14 materialsFor(t,'few')`: 3 → `['meterLit']`; ≥ 5 → `['label']` (nhãn tĩnh, không `cheer`/canvas).
  - `FX-15 effectiveLevel('lots', true)` = `few`; `('some', false)` = `some`.
- Code: `typing-adventure/apps/web/src/lib/fx/levels.ts`. `materialsFor` ở `tiers.ts` nhận `level`.
- Verify: `cd typing-adventure && pnpm --filter @typing-adventure/web exec vitest run fx-levels fx-tiers`
- Skill: không

### T3 · Chuỗi i18n FX — AC: FX-05, FX-11, FX-12, FX-14, FX-20
- Test (viết trước, phải đỏ): `typing-adventure/apps/web/src/lib/__tests__/fx-i18n.test.ts`
  - `FX-20 every fx key exists non-empty in vi and en`: 9 key settings + `fxPraise1..24` + `fxOwlPraise1..20` + `fxOwlEncourage1..6`.
  - `FX-05 pool sizes`: praise ≥ 20, owl praise ≥ 20, encourage ≥ 5, mỗi ngôn ngữ; không trùng chuỗi trong một pool.
  - `FX-14 labels`: `vi.fxLabel === 'Hiệu ứng'`, `en.fxLabel === 'Effects'`, `fxLots/fxSome/fxFew` = `Nhiều/Vừa/Ít` và `Lots/Some/Few`.
  - `FX-12 encourage example`: `vi.fxOwlEncourage1 === 'Không sao, lại nào!'`, `en === 'No worries, try again!'`.
  - `FX-20 vi diacritics`: ≥ 80% câu `fxPraise*`/`fxOwlPraise*` khớp `/[À-ỹ]/`.
  - `FX-20 length`: mọi câu pool ≤ 32 ký tự (vừa 2 dòng ở 240px theo 02-design).
  - Giữ `comboPraise*` không đổi: `vi.comboPraise10 === 'Siêu quá!'`.
- Code: `typing-adventure/packages/i18n/src/vi.ts`, `typing-adventure/packages/i18n/src/en.ts` — 59 key đúng bảng 02-design.
- Verify: `cd typing-adventure && pnpm --filter @typing-adventure/web exec vitest run fx-i18n kr-i18n && pnpm typecheck`
- Skill: không

### T4 · RNG có seed, chọn chống lặp, pool biến thể — AC: FX-05, FX-07, FX-08, FX-10, FX-11
- Test (viết trước, phải đỏ): `typing-adventure/apps/web/src/lib/__tests__/fx-pick.test.ts`
  - `FX-05 no repeat within k`: với n ∈ {4, 6, 24}, k = `windowFor(n)` (= 3) và k = 5 cho pool câu khen. Chọn 100 lần: phần tử không xuất hiện lại trong k lần gần nhất.
  - `FX-05 determinism`: cùng seed → cùng chuỗi 100 phần tử; seed 1 vs seed 2 → khác.
  - `FX-05 jitter`: `jitter(36, rng)` luôn trong [28.8, 43.2]; có `cap` thì ≤ cap; 10 lần có ≥ 2 giá trị khác nhau.
  - `FX-05 FX-07 FX-08 FX-10 pool sizes`:
    - `POP_KINDS` ≥ 4 (6)
    - `PARTICLE_SHAPES` ≥ 4 (6)
    - `WORD_FX_KINDS` ≥ 4 (6)
    - `LABEL_STYLES` ≥ 2 (4)
    - `RUNNERS` ≥ 3
    - `ACCESSORIES` ≥ 3
    - `SKY_VARIANTS`, `SUPER_VARIANTS`, `EVOLVE_VARIANTS`, `FIREWORK_KINDS` ≥ 2
    - `PRAISE_KEYS` ≥ 20, `OWL_PRAISE_KEYS` ≥ 20, `OWL_ENCOURAGE_KEYS` ≥ 5
    - Mọi key pool là `TranslationKey` có trong `vi`.
  - `FX-11 probability`: `mulberry32(42)`, 600 lần `rng() < 1/6` → đếm trong [70, 130].
- Code: `typing-adventure/apps/web/src/lib/fx/rng.ts`, `typing-adventure/apps/web/src/lib/fx/pick.ts`, `typing-adventure/apps/web/src/lib/fx/pools.ts`. `pickNonRepeating` lọc các phần tử trong `history.slice(-k)` rồi chọn bằng `rng`, trả history mới cắt còn tối đa 8.
- Verify: `cd typing-adventure && pnpm --filter @typing-adventure/web exec vitest run fx-pick`
- Skill: không

### T5 · Ngân sách hạt, kế hoạch canvas, giới hạn nhấp nháy — AC: FX-08, FX-16, FX-17
- Test (viết trước, phải đỏ): `typing-adventure/apps/web/src/lib/__tests__/fx-budget.test.ts`
  - `FX-08 FX-17 allocateNodes`: `(0,5)` → 5; `(58,5)` → 2; `(60,5)` → 0; không bao giờ âm.
  - `FX-17 canvasBurstPlan('confetti')`: tổng 30..40 (≥ 30) và ≤ 200, với 50 seed.
  - `FX-17 canvasBurstPlan` pháo nền (`peony|heart|star|ring`): 4–6 chùm, tổng ≤ 200, mọi `x,y` trong [0,1], `y ≤ 0.45` (40% trên).
  - `FX-16 flashGate`: 3 lần trong 1000ms → ok; lần 4 trong cửa sổ → `ok: false`; sau 1000ms → ok lại; `times` chỉ giữ trong cửa sổ.
- Code: `typing-adventure/apps/web/src/lib/fx/budget.ts`.
- Verify: `cd typing-adventure && pnpm --filter @typing-adventure/web exec vitest run fx-budget`
- Skill: không

### T6 · Reducer điều phối + logic mood owl — AC: FX-02, FX-03, FX-04, FX-05, FX-07, FX-08, FX-10, FX-11, FX-12, FX-13, FX-14, FX-15, FX-16, FX-18
- Test (viết trước, phải đỏ):
  - `typing-adventure/apps/web/src/lib/__tests__/fx-owl.test.ts`
    - `FX-12 mergeOwlMood` theo đúng thứ tự ưu tiên.
    - `FX-12 idleMood`: 4999 → null, 5000 → wave, 14999 → wave, 15000 → sleep.
  - `typing-adventure/apps/web/src/lib/__tests__/fx-director.test.ts`. Helper `run(level, keys[])` mô phỏng chuỗi phím từ text cố định, `rng = mulberry32(7)`.
    - `FX-02 label once per tier`: gõ đúng 1..100 → `label` đổi `id` đúng ở 5,10,15,20,30,40,50,75,100 (9 lần); ở 3 không có label; 6–9 không đổi.
    - `FX-02 restart after miss`: tới 12, sai, rồi 5 đúng → label tầng 5 với id mới.
    - `FX-03 single label`: chạm 10 khi label 5 còn sống → state chỉ có 1 `label` (tier 10).
    - `FX-05 praise no immediate repeat`: chạm tầng 5 năm lần (sai xen giữa) → không 2 lần liền cùng `praise`; pool chống lặp 5.
    - `FX-05 param variety`: 10 lần chạm tầng 10 (seed cố định) → ≥ 2 bộ `{ tilt, rise }` khác nhau.
    - `FX-07 pop`: 20 phím đúng (lots) → `pop.kind` không trùng liền kề; level `few` → `pop === null`.
    - `FX-08 sparks`: lots + ký tự thường → `sparks.count` 3..5; char `' '` → không sparks; `some`/`few` → không sparks.
    - `FX-10 word fx`: `word` chỉ khi `word !== null && char !== ' '`; kiểu không trùng liền kề; `few` → null.
    - `FX-11 owl praise`: 600 từ mô phỏng (lots, không label) → số `bubble.kind === 'praise'` trong [70, 130]; label đang sống → không bubble; `few` → 0.
    - `FX-12 events`: tầng ≥ 5 → `owl.mood = 'cheer'`; 1 sai → `thinking`; 3 sai liền → `encourage` + `bubble.kind = 'encourage'`; `idle sleep` rồi key → `happy`; không bao giờ `sad`.
    - `FX-13 miss with combo ≥ 3` → `meter.smokeId` tăng, `sky`/`accessory`/`superMode` = null, không slot one-shot mới; combo < 3 → smokeId không đổi.
    - `FX-04 held`: 20 → `sky` & `accessory` có; 30 → `superMode`; 50 → `evolve` + vẫn có accessory; mức `some` tầng 15/30/40/75 → không runner/super/rain/fireworks nhưng có label.
    - `FX-15 few`: label có `animate: false`, `style: 'bubble'`; không confetti/runner/rain/fireworks/evolve.
    - `FX-16 flash gate`: tầng 5,10,15,20 trong 600ms (`now` inject) → label thứ 4 có `animate: false`, không `fireworks`/`confetti`/`rain` mới.
    - `FX-18 suppress/reset`: `suppress true` rồi chạm tầng → không slot one-shot mới; `reset` → bằng `INITIAL_FX` (trừ `seq`/`history`).
    - `FX-03 expire`: `expire` id cũ không xoá label mới (giống `combo-celebration`).
- Code:
  - `typing-adventure/apps/web/src/lib/fx/owl.ts`
  - `typing-adventure/apps/web/src/lib/fx/director.ts`:
    - `FX_TTL` = { label 900 (tĩnh 800), pop 400, word 700, confetti 1000, runner 2200, rain 2500, fireworks 2500, evolve 1600, bubble 1400, owl theo mood: cheer 1200, thinking 800, happy 800/1000, encourage 1400 }.
    - Nếu reducer > ~150 dòng thì tách `director-tier.ts` (vẫn thuộc task này, cùng test).
- Verify: `cd typing-adventure && pnpm --filter @typing-adventure/web exec vitest run fx-director fx-owl`
- Skill: không

### T7 · Âm nốt theo bậc — AC: FX-09
- Test (viết trước, phải đỏ): `typing-adventure/apps/web/src/lib/__tests__/fx-sound.test.ts`. Dùng `FakeAudioContext` (stub `createOscillator`/`createGain`, ghi lại mọi giá trị `exponentialRampToValueAtTime` của gain).
  - `FX-09 playStep uses pentatonic`: `playStep(0)` → tần số 523.25; `playStep(9)` → 1760; `playStep(12)` → kẹp về 9.
  - `FX-09 gain ceiling`: gain đỉnh của `playStep(n)` và của `pop`, `boing`, `sparkle`, `fanfare`, `sticker` đều ≤ gain đỉnh của `correct` (0.12).
  - `FX-09 disabled`: `enabled = false` → không tạo oscillator.
- Code:
  - `typing-adventure/apps/web/src/lib/audio/sound-engine.ts` — `playStep(step)`: triangle 0.25s gain 0.12 + sine ×2 gain 0.03.
  - `typing-adventure/apps/web/src/hooks/useSound.ts` — `playStep`.
- Verify: `cd typing-adventure && pnpm --filter @typing-adventure/web exec vitest run fx-sound`
- Skill: không

### T8 · Setting `effectsLevel`: store + API — AC: FX-14
- Test (viết trước, phải đỏ):
  - `typing-adventure/apps/web/src/app/api/users/me/settings/__tests__/settings-effects.test.ts` (mẫu `sessions-plausibility.test.ts`; mock `prisma.user.findUnique/update`, `getSessionUser`):
    - `FX-14 accepts each level`: PUT `{ effectsLevel: 'some' }` → 200, `success: true`, `update` nhận `settings.effectsLevel === 'some'` merge với settings cũ.
    - `FX-14 E14 rejects`: `'max'`, `3`, `'x'.repeat(500)` → 400, `{ success: false, error }`, `update` không được gọi.
    - `FX-14 401` khi không có user.
  - `typing-adventure/apps/web/src/stores/__tests__/settings-effects.test.ts` (mock `@/lib/api/users`, stub `globalThis.localStorage` bằng Map trước `await import`):
    - `FX-14 default lots`.
    - `FX-14 setEffectsLevel logged-in` → `updateSettings({ effectsLevel })` sau debounce (fake timers 300ms); guest → không gọi API.
    - `FX-14 loadFromServer restores` `effectsLevel: 'few'`; giá trị lạ `'max'` → giữ giá trị hiện tại.
    - `FX-14 persist`: `partialize` chứa `effectsLevel`.
    - `FX-14 E13 offline`: `updateSettings` reject → state vẫn là mức mới, không throw.
- Code:
  - `typing-adventure/apps/web/src/app/api/users/me/settings/route.ts` — `effectsLevel: z.enum(EFFECTS_LEVELS).optional()`.
  - `typing-adventure/apps/web/src/stores/settings-store.ts`:
    - state `effectsLevel: EffectsLevel`, DEFAULTS `'lots'`;
    - `setEffectsLevel` → `syncSettingsToDB({ effectsLevel })`;
    - `loadFromServer` dùng `parseEffectsLevel`;
    - `syncSettingsToDB` bắt lỗi (`updateSettings(data)?.catch?.(() => {})`) nếu hiện chưa bắt.
- Verify: `cd typing-adventure && pnpm --filter @typing-adventure/web exec vitest run settings-effects && pnpm typecheck`
- Skill: add-api-route (quy ước Zod/`ok`/`err`/guard khi sửa route)

### T9 · Field "Hiệu ứng" trong SettingsPanel — AC: FX-14, FX-15, FX-20
- Test (viết trước, phải đỏ):
  - Sửa `typing-adventure/apps/web/src/components/ui/__tests__/ChoiceCards.test.tsx`: thêm `FX-14 columns 3 and describedBy` (class `choice-cards--3`, `aria-describedby="…"` trên radiogroup). Giữ các case cũ.
  - `typing-adventure/apps/web/src/components/settings/__tests__/EffectsLevelField.test.tsx` (`EffectsLevelFieldView` theo props `{ lang, value, reduced, onChange }`):
    - `FX-14 vi labels`: tiêu đề "Hiệu ứng", 3 radio "Nhiều/Vừa/Ít", radio `lots` `aria-checked="true"`, hint `fxLotsHint`.
    - `FX-14 en labels`: "Effects", "Lots/Some/Few".
    - `FX-15 reduced note`: `reduced` → có `role="note"` chứa `fxReducedNote`; không reduced → không có.
    - `FX-14 hint follows value`: `value="few"` → chứa `fxFewHint`, `aria-describedby` trỏ tới id của hint.
- Code:
  - `typing-adventure/apps/web/src/components/ui/ChoiceCards.tsx` — `columns?: 1 | 2 | 3`, `describedBy`.
  - `typing-adventure/apps/web/src/styles/decor.css` — `.choice-cards--3 { grid-template-columns: repeat(3, 1fr) }`.
  - `typing-adventure/apps/web/src/components/settings/EffectsLevelField.tsx` — View + container (`useSettingsStore`, `usePrefersReducedMotion`), icon `rainbow`/`sparkle`/`star`.
  - `typing-adventure/apps/web/src/components/settings/SettingsPanel.tsx` — chèn sau field theme (dòng 89).
- Verify: `cd typing-adventure && pnpm --filter @typing-adventure/web exec vitest run ChoiceCards EffectsLevelField`
- Skill: không

### T10 · Store FX + nối vào `useGameEngine` (chưa có UI mới) — AC: FX-04, FX-09, FX-14, FX-18
- Test (viết trước, phải đỏ): `typing-adventure/apps/web/src/stores/__tests__/fx-store.test.ts` (fake timers, `vi.resetModules`):
  - `FX-03 expire schedule`: `key` chạm tầng 5 → `label` có; sau 900ms → null; label mới ở 500ms → label cũ không xoá label mới.
  - `FX-18 reset clears all slots and held state synchronously`.
  - `FX-14 level change` → `dispatch({ type: 'level' })` ảnh hưởng phím sau (few → không pop).
  - `FX-12 idle` → `owl.mood` wave/sleep; key sau sleep → happy rồi idle sau 800ms.
- Code:
  - `typing-adventure/apps/web/src/stores/fx-store.ts`:
    - `create` + `dispatch(event)` gọi `fxStep` với `rng` module (`mulberry32(Date.now())`, inject được qua `__setRng` cho test);
    - so slot trước/sau để `setTimeout(expire, FX_TTL)`;
    - `reset()` huỷ mọi timer.
  - `typing-adventure/apps/web/src/hooks/useGameEngine.ts`:
    - sau `gameStore.handleKeypress` lấy `after`; nếu `after.isFinished` → `useFxStore.getState().reset()`, ngược lại `dispatch({ type: 'key', correct: isCorrect, combo: after.combo, index: before.currentIndex, char, word: completedWord && char !== ' ' ? range : null, now: Date.now() })`;
    - âm: `isCorrect` → `soundCue(after.combo)` → `play(sound)` hoặc `playStep(step)`, thay `playCorrect()`;
    - `startTime === null` → `useFxStore.getState().reset()` (cùng effect dòng 42-44);
    - đồng bộ `level`: `effectiveLevel(settings.effectsLevel, reduced)` qua `useEffect` → `dispatch({ type: 'level' })`.
- Verify: `cd typing-adventure && pnpm --filter @typing-adventure/web exec vitest run fx-store && pnpm --filter @typing-adventure/web exec vitest run && pnpm typecheck`
- Skill: không

### T11 · Đồng hồ combo + OwlDock, bỏ pill `.combo-display`, chuyển timer announcer — AC: FX-06, FX-13, FX-18
- Test (viết trước, phải đỏ):
  - `typing-adventure/apps/web/src/components/game/__tests__/fx-meter.test.tsx` (`ComboMeterView` theo props):
    - `FX-06 shows combo and level`: combo 0/3/12/31 → `.combo-meter-num` = số, `data-level` = off/lit/hot/super, `aria-hidden="true"`, có svg `flame`, vạch tiến độ `style` `--fx-progress` đúng `nextTierInfo`.
    - `FX-13 smoke`: `smoke` → `data-smoke="true"`, có 3 `.combo-meter-smoke`.
    - `FX-18 finished` → số 0 (container nhận `combo = isFinished ? 0 : combo`).
  - Sửa `typing-adventure/apps/web/src/components/game/__tests__/game-chrome.test.tsx`: thay case `KR-05 WordDisplay combo pill…` bằng `FX-06 WordDisplay no longer renders the combo pill (moved to ComboMeter)`, `html` không chứa `combo-display`. Case lives/pencil giữ nguyên.
  - `typing-adventure/apps/web/src/components/game/__tests__/ComboAnnouncer.test.tsx`:
    - chuyển nguyên case `KR-09 announcer is always mounted as a polite live region` từ `ComboBurst.test.tsx` (giữ text "Chuỗi 10! Siêu quá!");
    - thêm `KR-09 container clears the milestone after COMBO_BURST_MS` (fake timers, gọi `useComboCelebrationStore.getState().celebrate(5)`, render effect qua `act` không có DOM → kiểm bằng hàm `scheduleClear` export từ ComboAnnouncer).
  - Commit body: "KR-05 combo pill assertion replaced by FX-06 per 02-design S1 (pill moved next to owl)".
- Code:
  - `typing-adventure/apps/web/src/components/game/fx/ComboMeter.tsx` — View + container (combo từ prop, `smokeId` từ fx-store; `data-smoke` bật 500ms theo `smokeId`).
  - `typing-adventure/apps/web/src/components/game/fx/OwlDock.tsx` — `[GameOwl][ComboMeter][OwlBubble slot]` + `<span className="ta-title-text">Typing Adventure</span>`.
  - `typing-adventure/apps/web/src/components/game/GameEngine.tsx:391-395` — title dùng `<OwlDock playing combo suppressed />`; thêm biến `fxSuppressed`.
  - `typing-adventure/apps/web/src/components/game/WordDisplay.tsx:95-99` — bỏ pill.
  - `typing-adventure/apps/web/src/components/game/ComboAnnouncer.tsx` — `useEffect` timer `clear(id)` sau `COMBO_BURST_MS`, export `scheduleClear`.
  - `typing-adventure/apps/web/src/styles/game.css` — bỏ `.combo-display` (451-482, giữ `.lives-display`), `.ta-head { z-index: 2 }`, `.owl-dock`, `.ta-title-text` ẩn trực quan ≤ 480px.
  - `typing-adventure/apps/web/src/styles/fx.css` (tạo) + `typing-adventure/apps/web/src/styles/globals.css` (`@import './fx.css'`) — `.combo-meter*`, 4 cấp, khói 500ms, lửa đung đưa (transform, 900–1200ms, class `fx-loop`).
  - Ghi chú: ComboBurst vẫn còn ở task này, nên tồn tại 2 timer `clear`. Vô hại vì `clear(id)` idempotent; T12 xoá ComboBurst.
- Verify: `cd typing-adventure && pnpm --filter @typing-adventure/web exec vitest run fx-meter game-chrome ComboAnnouncer && pnpm typecheck`
- Skill: không

### T12 · Nhãn tầng căn giữa thay ComboBurst hai bên (xoá HF-05..11) — AC: FX-01, FX-03, FX-05, FX-15, FX-18, FX-20
- Test (viết trước, phải đỏ). Một commit `test(FX): centered tier label replaces HF two-side burst (replaces HF-05/06/07/08/09/10/11)`:
  - Xoá `typing-adventure/apps/web/src/components/game/__tests__/ComboBurst.test.tsx` (case announcer đã chuyển ở T11).
  - Xoá `typing-adventure/apps/web/src/lib/__tests__/hf-fireworks.test.ts`, `typing-adventure/apps/web/src/styles/__tests__/hf-decor.test.ts`.
  - Xoá `typing-adventure/apps/web/e2e/hf-combo.spec.ts`, `typing-adventure/apps/web/e2e/hf-qc.spec.ts`, `typing-adventure/apps/web/e2e/hf-perf.spec.ts`. `fx-perf.spec.ts` ở T18 thay hf-perf.
  - `typing-adventure/apps/web/src/components/game/__tests__/fx-label.test.tsx` (`ComboLabelView`):
    - `FX-03` tier 10 → đúng 1 `.fx-combo-label`, chứa `x10` và câu `t(lang, praise)`, `aria-hidden="true"`, `data-tier="10"`, `data-style` thuộc `LABEL_STYLES`.
    - `FX-01` markup không chứa `combo-side`, `fw-spark`, `fw-rocket`.
    - `FX-15` `animate={false}` → class `fx-combo-label--static`.
    - `FX-18` `suppressed` → `''`; label null → `''`.
    - `FX-20` `lang="en"` → câu en.
    - Band màu: 5/10 → `--band-play`, 15/20/30 → `--band-fun`, 40/50 → `--band-primary`, ≥ 75 → `--band-rainbow`.
  - `typing-adventure/apps/web/src/styles/__tests__/fx-css.test.ts` (tạo; các task sau bổ sung case):
    - `FX-01` `decor.css` không còn selector `.combo-burst`, `.combo-side`, `.fw-spark`, `.fw-rocket`, keyframes `fw-pop`/`fw-rise`.
    - `FX-03 FX-19` `.fx-combo-label` có `pointer-events: none`, `position: absolute`, `left: 50%`, `bottom` chứa `calc(100% - 12px)`.
    - `FX-03` keyframes `fx-label-*` chỉ `transform`/`opacity`, tổng `animation` ≤ 900ms, không `infinite`.
    - `FX-15` trong `@media (prefers-reduced-motion: reduce)` của `fx.css` có `.fx-combo-label { animation: none }`.
  - `typing-adventure/apps/web/e2e/helpers/fx.ts` (thêm):
    - `fxCounts(page)` (số `.fx-combo-label`, `.fx-p`, `canvas.fx-canvas[data-active="true"]`, `.fx-runner`);
    - `topmostReport(page)`: `elementFromPoint` tại tâm `.char--active`, mọi `.key`, `.hand-left`, `.hand-right`; trả danh sách phần tử FX đè lên;
    - `sampleTopmost(page, ms, step)`;
    - `typeTo(page, text, from, to, delay)`.
  - `typing-adventure/apps/web/e2e/fx-combo.spec.ts` (custom text `repeatText(120)`, 1280×720, `soundEnabled: false`):
    - `FX-01 FX-03 label centered above text`: chạm 5 → đúng 1 `.fx-combo-label`, chứa `x5`; `|labelCenterX − wordDisplayCenterX| ≤ 24`; `label.bottom ≤ firstChar.top`; không còn `.combo-side`; focus ở `.hidden-input`; ≤ 900ms (đo từ phím) thì count 0 hoặc opacity 0; announcer chứa `Chuỗi 5! Giỏi lắm!`.
    - `FX-02 no label at 3 or 6–9`.
    - `FX-03 E1 replacement`: gõ 5→10 liên tục 30ms → không bao giờ thấy 2 `.fx-combo-label` (poll 20ms).
    - `FX-05 praise varies`: chạm tầng 5 năm lần (sai xen giữa) → 5 câu, không 2 câu liền trùng.
    - `FX-18 finish`: text 10 ký tự, phím cuối là tầng 10 → khi `.celebration-content` hiện thì `fxCounts` = 0; Chơi lại → 0; mở Settings giữa nhãn → 0.
    - `FX-20 theme × lang`: light/dark/colorful × vi/en ở tầng 10 → câu đúng ngôn ngữ, `scrollWidth ≤ clientWidth` cho `.fx-combo-label-praise`; axe `color-contrast` include `.fx-combo-label` không vi phạm; guest không có request `/api/` trong lúc gõ.
    - Viewport 375/768/1024/1440: tâm lệch ≤ 24, `label.bottom ≤ firstChar.top`.
  - Sửa `typing-adventure/apps/web/e2e/kr-motion.spec.ts:22-23` → `.fx-combo-label` chứa `x5`; `.fx-p, canvas.fx-canvas[data-active="true"]` count 0.
  - Sửa `typing-adventure/apps/web/e2e/kr-game.spec.ts:49-59` → `.fx-combo-label` (giữ owl `happy` tới T14), `waitForTimeout(1000)`.
  - Sửa `typing-adventure/apps/web/e2e/hf-layout.spec.ts:142` → `.fx-combo-label`.
- Code:
  - `typing-adventure/apps/web/src/components/game/fx/ComboLabel.tsx` — View + container đọc `useFxStore(s => s.label)` và `lang`, `key={label.id}`.
  - `typing-adventure/apps/web/src/components/game/GameEngine.tsx:449` — thay `<ComboBurst …/>` bằng `<ComboLabel suppressed={fxSuppressed} />`.
  - Xoá `typing-adventure/apps/web/src/components/game/ComboBurst.tsx`, `ComboFireworks.tsx`, `typing-adventure/apps/web/src/lib/hf/fireworks.ts`.
  - `typing-adventure/apps/web/src/styles/decor.css` — xoá dòng 88-245 phần `.combo-burst`/`.combo-side`/`.fw-*`/keyframes HF và khối reduced-motion 360-366. Giữ `.word-stage` + `--hf-gutter`.
  - `typing-adventure/apps/web/src/styles/fx.css` — `.fx-combo-label*`, 4 kiểu, band, keyframes vào 220 / giữ 420 / ra 220, `--static`, reduced.
- Verify:
  - `cd typing-adventure && pnpm --filter @typing-adventure/web exec vitest run && pnpm typecheck`
  - `set -a && . ../.wt-env && set +a && pnpm --filter @typing-adventure/web exec playwright test e2e/fx-combo.spec.ts e2e/kr-motion.spec.ts e2e/kr-game.spec.ts e2e/hf-layout.spec.ts` (`dev:ws`)
- Skill: không

### T13 · Pop ký tự, hạt từng phím, hoàn thành từ — AC: FX-07, FX-08, FX-10, FX-15, FX-19
- Test (viết trước, phải đỏ):
  - `typing-adventure/apps/web/src/components/game/__tests__/fx-word.test.tsx`:
    - `FX-07` `WordDisplay` với `pop={{ index: 2, kind: 'hop', id: 1 }}` → `.char[data-i="2"]` có `data-pop="hop"`; mọi `.char` có `data-i`; không còn `char--pop`/`char--word-burst`.
    - `FX-10` `WordCompleteFxView` mỗi kind trong `WORD_FX_KINDS` render `.fx-word[data-kind]`, `aria-hidden`, `pointer-events` qua class.
    - `FX-04` `data-fx-super` có khi truyền `superMode`.
  - `typing-adventure/apps/web/src/styles/__tests__/fx-css.test.ts` (bổ sung):
    - `FX-07` có 6 selector `.char[data-pop="…"]`; mỗi keyframes `fx-pop-*` chỉ `transform`/`opacity`/`color`, duration ≤ 400ms.
    - `FX-08` `.fx-p` có `pointer-events: none`; keyframes `fx-spark` ≤ 600ms, không `infinite`.
    - `FX-10` keyframes `fx-word-*` ≤ 700ms.
    - `FX-15` reduced block có `.char[data-pop]`, `.fx-p`, `.fx-word` `animation: none`/`display: none`.
    - `KR-15` mọi keyframes `fx.css` không animate layout (dùng lại kiểm của `kr-motion.test.ts:92-103` cho `fx.css`).
  - `typing-adventure/apps/web/e2e/fx-combo.spec.ts` (bổ sung):
    - `FX-07 pop variety`: 20 phím đúng (lots), đọc `data-pop` sau mỗi phím → ≥ 4 kiểu, không trùng liền. Đo `getBoundingClientRect` của 3 ký tự kế tiếp trước/sau pop: không đổi (±0.5px).
    - `FX-08 sparks from char`: lots → sau 1 phím có 3–5 `.fx-p`, tâm mỗi hạt lúc t≈30ms nằm trong rect ký tự ±8px; poll suốt 40 phím `.fx-p` ≤ 60; ≤ 600ms sau phím cuối = 0. Phím cách → không tăng `.fx-p`. `seedSettings({ effectsLevel: 'some' })` → 0 `.fx-p`.
    - `FX-10 word fx`: hoàn thành 6 từ → `.fx-word[data-kind]` không trùng liền; trong lúc chạy, `elementFromPoint(tâm .char--active)` là chính ký tự đó.
- Code:
  - `typing-adventure/apps/web/src/components/game/WordDisplay.tsx` — thêm props `pop`, `superMode`; `data-i`, `data-pop`; bỏ `justTypedIndex`/`wordBurst`; thêm `<div className="fx-word-layer" aria-hidden>` chứa `<KeyParticles/>` + `<WordCompleteFx/>`, và `<div className="fx-runner-track" aria-hidden>` trong `.word-foot`.
  - `typing-adventure/apps/web/src/lib/fx/dom-particles.ts` — `createParticlePool(container, cap = 60)`, `emit(rect, shapes, count, rng)` dùng `allocateNodes`, Web Animations API (`el.animate`, `fill: 'none'`, `onfinish` trả node về pool).
  - `typing-adventure/apps/web/src/components/game/fx/KeyParticles.tsx` — subscribe `sparks`, tìm `[data-i]`, gọi pool; bỏ qua khi `suppressed`.
  - `typing-adventure/apps/web/src/components/game/fx/WordCompleteFx.tsx` — 6 kiểu theo 02-design; `confetti-pop` đi qua pool.
  - `typing-adventure/apps/web/src/components/game/fx/sprites.tsx` — 6 hình hạt + `check` stamp + sao (nhân vật/sticker/phụ kiện thêm ở T15/T14).
  - `typing-adventure/apps/web/src/components/game/GameEngine.tsx` — truyền `pop`/`superMode` từ store vào `WordDisplay`.
  - `typing-adventure/apps/web/src/styles/game.css` — xoá `.char--pop`, `charPop`, `.char--word-burst`, `wordBurst` (356-394) và dòng 1399-1400.
  - `typing-adventure/apps/web/src/styles/fx.css` — `.char[data-pop=…]`, `.fx-word-layer`, `.fx-p`, `.fx-word*`, `.word-display[data-fx-super]` (T15 dùng).
- Verify:
  - `cd typing-adventure && pnpm --filter @typing-adventure/web exec vitest run fx-word fx-css kr-motion game-chrome`
  - `set -a && . ../.wt-env && set +a && pnpm --filter @typing-adventure/web exec playwright test e2e/fx-combo.spec.ts`
- Skill: không

### T14 · Owl phản ứng, phụ kiện, biến hình, bong bóng, idle 5s/15s — AC: FX-04, FX-11, FX-12, FX-15, FX-18
- Test (viết trước, phải đỏ):
  - Sửa `typing-adventure/apps/web/src/components/mascot/__tests__/OwlMascot.test.tsx`. Giữ mọi case cũ, thêm:
    - `FX-04 accessory` mỗi giá trị → `data-accessory` + `<g class="owl-acc owl-acc--…">`;
    - `FX-04 evolve` → `data-evolve` + `.owl-evolve--…`;
    - `FX-12 live` → `sleep`/`idle` dùng `fx-loop`, không `kr-loop`; không `live` → markup như cũ (`kr-loop`).
  - `typing-adventure/apps/web/src/components/game/__tests__/fx-owl.test.tsx`:
    - `GameOwlView` nhận `mood`/`accessory`/`evolve` → `.game-owl[data-mood]`, size 48 (`width="48"` hoặc class `owl-dock .owl`);
    - `OwlBubbleView` → `.fx-owl-bubble[data-kind]`, `aria-hidden`, text theo `lang`; `suppressed` → `''`.
  - `typing-adventure/apps/web/e2e/fx-owl.spec.ts` (`page.clock.install()` trước `goto`):
    - `FX-12 cheer at tier 5` → `.game-owl[data-mood=cheer]`, ≤ 1300ms về `idle`.
    - `FX-12 miss` → `thinking`, không bao giờ `sad`, poll 1s.
    - `FX-12 3 misses` → `encourage` + `.fx-owl-bubble[data-kind=encourage]` chứa câu thuộc pool vi.
    - `FX-12 idle`: gõ 1 phím, `clock.fastForward(5000)` → `wave`; `fastForward(10000)` → `sleep`; gõ phím → `happy` rồi `idle` ≤ 900ms.
    - `FX-12 no idle timers` khi chưa gõ phím, khi Settings mở, khi `.celebration-content` hiện: `fastForward(16000)` → không `sleep`.
    - `FX-11 bubble` (lots): hoàn thành 30 từ → thấy ≥ 1 bubble `praise` (xác suất không thấy ≈ (5/6)^30 ≈ 0.4%; xác suất 1/6 chính xác đã kiểm bằng seed ở unit T4/T6); bubble ≤ 1500ms; `rectsIntersect` với `.word-display .char`, `.key`, `.hand-left/right` = false. `effectsLevel: 'few'` → 0 bubble praise. Không thêm hook seed vào code production.
    - `FX-04` tầng 20 → `data-accessory` có; sai → mất trong ≤ 600ms. Tầng 50 → `data-evolve` có trong ≤ 2000ms rồi mất, accessory còn.
    - `KR-16` vẫn pass: `kr-game.spec` không đổi phần KR-16.
  - Sửa `typing-adventure/apps/web/e2e/kr-game.spec.ts` KR-09: `data-mood` `happy` → `cheer`.
- Code:
  - `typing-adventure/apps/web/src/components/mascot/OwlMascot.tsx` — props `accessory`, `evolve`, `live`, `data-*`; SVG phụ kiện/biến hình lấy từ `components/game/fx/sprites.tsx` (export `OwlAccessory`, `OwlEvolve`) hoặc nội tuyến ≤ 1.5 KB/hình.
  - `typing-adventure/apps/web/src/components/game/GameOwl.tsx` — đọc `useFxStore(s => s.owl/accessory/evolve)`, `size` qua CSS 48px, `live={playing}`, `still` chỉ khi `playing && mood === 'idle'`; export `GameOwlView`.
  - `typing-adventure/apps/web/src/hooks/useOwlIdle.ts` — chạy khi `playing && !suppressed && document.visibilityState === 'visible'`; timeout 5000/15000 từ `lastKeyAt`; `dispatch({ type: 'idle', mood })`.
  - `typing-adventure/apps/web/src/components/game/fx/OwlBubble.tsx` — neo dưới `.owl-dock`, gỡ khi có label.
  - `typing-adventure/apps/web/src/components/game/fx/OwlDock.tsx` — mount `OwlBubble`, `useOwlIdle`.
  - `typing-adventure/apps/web/src/styles/motion.css` không đổi.
  - `typing-adventure/apps/web/src/styles/fx.css`:
    - `.owl-dock .owl` 48px (≤ 640px 40px);
    - `.fx-loop` cho wave (600ms × 2 mỗi 3s) và zzz 2.4s, không bị `kr-loop` pause;
    - `.owl-acc` rơi 300ms;
    - `.owl-evolve` 1600ms, chỉ `scale`;
    - `.fx-owl-bubble`;
    - reduced: `animation: none` cho owl body/acc/evolve/bubble.
  - `typing-adventure/apps/web/src/styles/__tests__/fx-css.test.ts` (case do test commit bổ sung ở trên):
    - `FX-16` `.fx-loop` có opacity thì chu kỳ ≥ 334ms;
    - `FX-12` `.fx-loop` không nằm trong selector pause `[data-playing="true"]`.
- Verify:
  - `cd typing-adventure && pnpm --filter @typing-adventure/web exec vitest run OwlMascot fx-owl fx-css`
  - `set -a && . ../.wt-env && set +a && pnpm --filter @typing-adventure/web exec playwright test e2e/fx-owl.spec.ts e2e/kr-game.spec.ts`
- Skill: không

### T15 · Chất liệu tầng DOM: nhân vật chạy, trời thức dậy, siêu cấp, mưa sticker — AC: FX-04, FX-13, FX-14, FX-16, FX-19
- Test (viết trước, phải đỏ):
  - `typing-adventure/apps/web/src/components/game/__tests__/fx-layers.test.tsx`:
    - `TierRunnerView` mỗi `RUNNERS` → `.fx-runner[data-character]`, `aria-hidden`, có `--fx-dir`;
    - `FxBackdropView` `sky="rainbow"` → `.fx-sky--rainbow`;
    - `rain` 18 → 18 `.fx-p.fx-sticker`; khi truyền `alive=50` thì chỉ 10 (`allocateNodes`);
    - `suppressed` → không runner/rain (sky giữ);
    - root `.fx-backdrop` `aria-hidden`.
  - `typing-adventure/apps/web/src/styles/__tests__/fx-css.test.ts` (bổ sung):
    - `FX-16 FX-01` `.fx-backdrop` có `position: fixed`, `z-index: 0`, `opacity ≤ 0.6`, `pointer-events: none`;
    - `.fx-runner-track` `overflow: hidden`;
    - keyframes `fx-run` ≤ 2500ms;
    - `fx-rain` ≤ 2200ms + delay ≤ 300ms;
    - `fx-sky-*` một lần ≤ 1000ms, không `infinite`;
    - `[data-fx-super]` không có `animation` lặp;
    - không màu `--kr-danger` trong `fx.css`;
    - reduced block ẩn `.fx-runner`, `.fx-sticker`.
  - `typing-adventure/apps/web/e2e/fx-combo.spec.ts` (bổ sung, lots, 1280×720):
    - tầng 15 → 1 `.fx-runner`, mất ≤ 2500ms;
    - 20 → `.ta-screen[data-fx-sky]`;
    - 30 → `.word-display[data-fx-super]`;
    - 40 → `.fx-sticker` > 0 và mất ≤ 2500ms;
    - sai ở 41 → `data-fx-sky`/`data-fx-super` mất ≤ 600ms, `.combo-meter[data-smoke=true]`, không `.fx-combo-label` mới;
    - `effectsLevel: 'some'` → tầng 15/40 không runner/sticker nhưng có nhãn;
    - E4: sai khi runner đang chạy → runner chạy nốt, không runner mới.
- Code:
  - `typing-adventure/apps/web/src/components/game/fx/TierRunner.tsx` (dynamic).
  - `typing-adventure/apps/web/src/components/game/fx/FxBackdrop.tsx` (dynamic) — sky + rain (canvas pháo nền thêm ở T16).
  - `typing-adventure/apps/web/src/components/game/fx/sprites.tsx` — 5 nhân vật, 7 sticker.
  - `typing-adventure/apps/web/src/components/game/GameEngine.tsx`:
    - `data-fx-sky` trên `.ta-screen`;
    - mount `<FxBackdrop/>` trước `.ta-head`;
    - `TierRunner` trong `.fx-runner-track` (qua `WordDisplay` slot hoặc portal);
    - `next/dynamic(..., { ssr: false })` + prefetch idle.
  - `typing-adventure/apps/web/src/styles/fx.css` — các lớp trên. Trời ≥ 768px dùng `.kr-scene--top` `filter: saturate(1.25)` transition 800ms; < 768px viền gradient `.word-display-section::before` `scaleX`.
- Verify:
  - `cd typing-adventure && pnpm --filter @typing-adventure/web exec vitest run fx-layers fx-css`
  - `set -a && . ../.wt-env && set +a && pnpm --filter @typing-adventure/web exec playwright test e2e/fx-combo.spec.ts`
- Skill: không

### T16 · Canvas: pháo giấy tầng 10, pháo hoa nền 75/100/150 (`canvas-confetti`) — AC: FX-04, FX-15, FX-16, FX-17, FX-19
- Test (viết trước, phải đỏ):
  - `typing-adventure/apps/web/src/lib/__tests__/fx-confetti.test.ts` (controller nhận `loader` inject, trả fake `create` ghi lại lời gọi):
    - `FX-17 single active`: `fire('confetti')` rồi `fire('fireworks')` → instance confetti được `reset()` trước; `active` chỉ 1.
    - `FX-17 particle cap`: tổng `particleCount` mỗi lần `fire` ≤ 200.
    - `FX-17 hidden tab`: gọi handler `visibilitychange` với `hidden` → `reset()` mọi instance, `fire` khi hidden → no-op.
    - `FX-15 reduced/few` → `fire` no-op.
    - `loader not ready` → `fire` trả `false`, không throw.
    - `FX-19 confetti options`: `angle` trong 55..125, `gravity ≤ 0.8`, `ticks ≤ 100`, origin = tâm ký tự / viewport.
  - `typing-adventure/apps/web/e2e/fx-combo.spec.ts` (bổ sung):
    - tầng 10 (lots) → `canvas.fx-canvas[data-active=true]` count 1;
    - 75 → vẫn ≤ 1 active (poll 50ms trong 3s);
    - `page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))` với `visibilityState` giả `hidden` (defineProperty) → active 0;
    - `effectsLevel: 'some'` tầng 75 → không active.
- Code:
  - `cd typing-adventure && pnpm --filter @typing-adventure/web add canvas-confetti && pnpm --filter @typing-adventure/web add -D @types/canvas-confetti`
  - `typing-adventure/apps/web/src/lib/fx/confetti.ts`:
    - `createCanvasController({ loader, doc })`;
    - `prefetch()`;
    - `attach(kind, canvas)` → `confetti.create(canvas, { resize: true, useWorker: false })`;
    - `fire(kind, plan, origin)`;
    - `reset()`;
    - shape cache bằng `shapeFromPath` với matrix tính sẵn.
  - `typing-adventure/apps/web/src/components/game/fx/TierConfetti.tsx` (dynamic, canvas `position: fixed; inset: 0; z-index: 50`, `data-active`).
  - `typing-adventure/apps/web/src/components/game/fx/FxBackdrop.tsx` — canvas pháo nền trong `.fx-backdrop`.
  - `typing-adventure/apps/web/src/components/game/GameEngine.tsx` — `useEffect` mount: `requestIdleCallback` → `controller.prefetch()` + gọi loader của các `dynamic` (T15/T16).
- Verify:
  - `cd typing-adventure && pnpm --filter @typing-adventure/web exec vitest run fx-confetti && pnpm typecheck && pnpm build`
  - `set -a && . ../.wt-env && set +a && pnpm --filter @typing-adventure/web exec playwright test e2e/fx-combo.spec.ts`
- Skill: không

### T17 · Cài đặt mức + reduced motion + an toàn nhấp nháy, end-to-end — AC: FX-14, FX-15, FX-16, FX-20
- Test (viết trước; dự kiến phần lớn xanh sau T9–T16, là test hồi quy. Phần đỏ thì sửa trong `feat(FX)` chỉ chạm code):
  - `typing-adventure/apps/web/e2e/fx-settings.spec.ts`:
    - `FX-14` mở Settings → field "Hiệu ứng" sau "Giao diện", `lots` checked mặc định;
    - phím mũi tên đổi sang `some` → đóng panel, gõ 10 phím → không `.fx-p`;
    - reload → vẫn `some` (`readSettings`);
    - `en` → "Effects / Lots / Some / Few";
    - guest đổi mức không phát request `/api/users/me/settings`;
    - user đăng nhập (sync, 400, offline E13) chỉ phủ bằng unit T8, vì e2e chưa có hạ tầng đăng nhập.
  - `typing-adventure/apps/web/e2e/fx-motion.spec.ts` (`emulateMedia({ reducedMotion: 'reduce' })`, `effectsLevel: 'lots'`):
    - `FX-15` gõ tới 50 + sai + hoàn thành từ → `.fx-p` 0, canvas active 0, `.fx-runner` 0, `.fx-sticker` 0; nhãn tầng có `--static`, mất ≤ 900ms;
    - 500ms sau mỗi sự kiện `runningAnimations` = 0;
    - owl `data-mood` đổi được;
    - Settings hiện `role=note` `fxReducedNote`.
  - `typing-adventure/apps/web/src/styles/__tests__/fx-css.test.ts` (bổ sung):
    - `FX-16` với mọi keyframes trong `fx.css`: nếu có `opacity` hoặc `filter` và rule dùng nó có `infinite`/iteration > 1 thì duration ≥ 334ms;
    - không selector nào trong `fx.css` vừa phủ toàn màn (`inset: 0` + `position: fixed`) vừa animate `opacity`/`filter` ngoài `.fx-backdrop` (opacity tĩnh ≤ 0.6).
- Code: chỉnh `fx.css`/component nếu test đỏ.
- Verify: `set -a && . ../.wt-env && set +a && pnpm --filter @typing-adventure/web exec playwright test e2e/fx-settings.spec.ts e2e/fx-motion.spec.ts e2e/kr-motion.spec.ts && pnpm --filter @typing-adventure/web exec vitest run fx-css`
- Skill: không

### T18 · Không che, không cuộn ngang, hiệu năng, bundle — AC: FX-06, FX-11, FX-17, FX-19
- Test:
  - `typing-adventure/apps/web/e2e/fx-layout.spec.ts`. Với 375×667, 768×1024, 1024×768, 1280×720, 1440×900 × `fingerGuide` bật/tắt, lots, `repeatText(110)`:
    - gõ tới 100 (delay 30);
    - `sampleTopmost` mỗi 100ms → `[]`;
    - `noHorizontalScroll` mọi mẫu;
    - mọi phần tử `[class*="fx-"], .combo-meter` có `pointer-events: none`;
    - `.combo-meter` không giao `.word-display .char`, `.key`, `.hand-left/right`; số `.combo-meter-num` = số `.char--correct` liên tiếp kể từ lỗi cuối;
    - 375px: bấm `.key` ảo trong lúc nhãn/hạt chạy vẫn tăng `.char--correct` (E11).
  - `typing-adventure/apps/web/e2e/fx-perf.spec.ts` (thay hf-perf, mẫu `hf-perf.spec.ts`):
    - 1280×720, lots, `repeatText(110)`, chờ `networkidle`, sau đó ghi mọi request (mọi `resourceType`, trừ `/api/` của user đã đăng nhập; guest thì tất cả);
    - CPU 4x, `typeText(…, 30)`;
    - poll 100ms: `.fx-p ≤ 60`, `.fx-combo-label ≤ 1`, `canvas.fx-canvas[data-active=true] ≤ 1`, focus ở input ẩn;
    - kết thúc: `.char--correct` = 110, màn kết quả chứa `100%`, đã thấy `x100`;
    - `requests` = `[]`;
    - `KR_PERF=1` → long task ≤ 100ms.
- Code: không, trừ khi test đỏ. Sửa trong `feat(FX): perf …`.
- Verify:
  - `set -a && . ../.wt-env && set +a && pnpm --filter @typing-adventure/web exec playwright test e2e/fx-layout.spec.ts`
  - `pnpm build && KR_PERF=1 pnpm --filter @typing-adventure/web exec playwright test e2e/fx-perf.spec.ts --repeat-each 3` (trên `next start`, giống HF "Thực tế")
  - manual (FX-17 bundle):
    1. `git worktree add /tmp/fx-base 8b09368 && cd /tmp/fx-base/typing-adventure && pnpm install && pnpm build`, ghi First Load JS `/`.
    2. Về nhánh, `pnpm build`.
    3. Chênh ≤ 15 KB, ghi vào `04-qc-report.md`.
- Skill: không

## Ma trận AC → Task → Test
| AC | Task | Test |
|---|---|---|
| FX-01 | T12 | `fx-label.test.tsx` FX-01; `fx-css.test.ts` FX-01; `e2e/fx-combo.spec.ts` FX-01 (1 nhãn, không `.combo-side`) |
| FX-02 | T1, T6 | `fx-tiers.test.ts` tierOf hits/misses + milestones; `fx-director.test.ts` label once per tier, restart after miss; `e2e/fx-combo.spec.ts` no label at 3/6–9 |
| FX-03 | T6, T10, T12 | `fx-director.test.ts` single label/expire; `fx-store.test.ts` expire; `fx-label.test.tsx`; `fx-css.test.ts` ≤ 900ms; `e2e/fx-combo.spec.ts` căn giữa ≤ 24px, trên dòng chữ, E1 |
| FX-04 | T1, T6, T14, T15, T16 | `fx-tiers.test.ts` materials/soundCue; `fx-director.test.ts` held; `OwlMascot.test.tsx` accessory/evolve; `fx-layers.test.tsx`; `e2e/fx-combo.spec.ts` tầng 10/15/20/30/40/75; `e2e/fx-owl.spec.ts` 20/50 |
| FX-05 | T3, T4, T6 | `fx-pick.test.ts` no repeat/determinism/jitter/pool sizes; `fx-i18n.test.ts` pool sizes; `fx-director.test.ts` praise/param variety; `e2e/fx-combo.spec.ts` praise varies |
| FX-06 | T1, T11, T18 | `fx-tiers.test.ts` meterLevel/nextTierInfo; `fx-meter.test.tsx`; `game-chrome.test.tsx` (pill bỏ); `e2e/fx-layout.spec.ts` meter không giao + số khớp |
| FX-07 | T4, T6, T13 | `fx-director.test.ts` pop; `fx-word.test.tsx` data-pop; `fx-css.test.ts` ≤ 400ms, chỉ transform/opacity/color; `e2e/fx-combo.spec.ts` pop variety + rect không đổi |
| FX-08 | T5, T6, T13 | `fx-budget.test.ts` allocateNodes; `fx-director.test.ts` sparks; `fx-css.test.ts` `.fx-p`; `e2e/fx-combo.spec.ts` sparks from char, ≤ 60, space, level some |
| FX-09 | T1, T7, T10 | `fx-tiers.test.ts` noteStep/soundCue; `fx-sound.test.ts` pentatonic, gain ceiling, disabled |
| FX-10 | T4, T6, T13 | `fx-director.test.ts` word fx (không kích hoạt ở dấu cách); `fx-word.test.tsx`; `e2e/fx-combo.spec.ts` word fx + elementFromPoint |
| FX-11 | T4, T6, T14, T18 | `fx-pick.test.ts` probability 600; `fx-director.test.ts` owl praise; `fx-owl.test.tsx` bubble; `e2e/fx-owl.spec.ts` bubble không giao, few → 0 |
| FX-12 | T3, T6, T14 | `fx-owl.test.ts`; `fx-director.test.ts` events; `fx-store.test.ts` idle; `OwlMascot.test.tsx` live; `e2e/fx-owl.spec.ts` cheer/thinking/encourage/wave/sleep/wake/no timers |
| FX-13 | T6, T11, T15 | `fx-director.test.ts` miss ≥ 3 / < 3; `fx-meter.test.tsx` smoke; `e2e/fx-combo.spec.ts` sai ở 41 |
| FX-14 | T2, T3, T8, T9, T10, T17 | `fx-levels.test.ts`; `fx-i18n.test.ts` labels; `settings-effects.test.ts` (route: 200/400/401); `stores/__tests__/settings-effects.test.ts` (default, sync, loadFromServer, offline); `ChoiceCards.test.tsx`; `EffectsLevelField.test.tsx`; `e2e/fx-settings.spec.ts`; manual: đăng nhập, đổi mức, đăng nhập trình duyệt khác → mức khôi phục |
| FX-15 | T2, T6, T12, T13, T14, T16, T17 | `fx-levels.test.ts` effectiveLevel; `fx-director.test.ts` few; `fx-confetti.test.ts` reduced; `fx-css.test.ts` reduced blocks; `EffectsLevelField.test.tsx` note; `e2e/fx-motion.spec.ts`; `e2e/kr-motion.spec.ts` |
| FX-16 | T5, T6, T15, T17 | `fx-budget.test.ts` flashGate; `fx-director.test.ts` flash gate; `fx-css.test.ts` chu kỳ ≥ 334ms, backdrop ≤ 0.6, không `--kr-danger`, không overlay flash |
| FX-17 | T5, T16, T18 | `fx-budget.test.ts` canvas ≤ 200; `fx-confetti.test.ts` single active/cap/hidden; `e2e/fx-combo.spec.ts` canvas ≤ 1, hidden; `e2e/fx-perf.spec.ts`; manual: First Load JS `/` ≤ +15 KB so với `8b09368` |
| FX-18 | T6, T10, T11, T12 | `fx-director.test.ts` suppress/reset; `fx-store.test.ts` reset; `fx-meter.test.tsx` finished → 0; `fx-label.test.tsx` suppressed; `e2e/fx-combo.spec.ts` FX-18 finish/replay/settings; `e2e/fx-owl.spec.ts` no idle timers |
| FX-19 | T13, T15, T16, T18 | `fx-css.test.ts` pointer-events/overflow; `fx-confetti.test.ts` confetti options; `e2e/fx-layout.spec.ts` (5 viewport × fingerGuide, elementFromPoint, no h-scroll, touch) |
| FX-20 | T3, T9, T12 | `fx-i18n.test.ts`; `EffectsLevelField.test.tsx` vi/en; `e2e/fx-combo.spec.ts` theme × lang + axe + không `/api/`; `e2e/fx-settings.spec.ts` en |
| HF-05..HF-11 (bị thay) | T12 | Xoá `ComboBurst.test.tsx`, `hf-fireworks.test.ts`, `hf-decor.test.ts`, `hf-combo.spec.ts`, `hf-qc.spec.ts`, `hf-perf.spec.ts`. Thay bằng FX-01/03/04/13/15/17/19 ở trên |
| HF-01..HF-04, HF-12, HF-13 (giữ) | T12 | `hf-layout.spec.ts` (sửa selector dòng 142), `hf-layout.test.ts`, `HandGuide.test.tsx` không đổi |
| KR-09, KR-14, KR-16 (giữ) | T11, T12, T14 | `ComboAnnouncer.test.tsx` (case chuyển sang); `kr-motion.spec.ts`, `kr-game.spec.ts` (sửa selector/mood); `OwlMascot.test.tsx` kr-loop giữ |

## Verify toàn bộ
```bash
cd typing-adventure && pnpm lint && pnpm typecheck && pnpm test && pnpm build
set -a && . ../.wt-env && set +a && pnpm --filter @typing-adventure/web test:e2e
KR_PERF=1 pnpm --filter @typing-adventure/web exec playwright test e2e/fx-perf.spec.ts
bash ../scripts/ci/check-tdd-commits.sh main HEAD
```

## Lịch sử
- v1 2026-11-06 18:45: bản đầu.
- 2026-11-06 23:34: approved by user

## Thực tế
- File đã sửa khớp `## File thay đổi`. `git diff origin/main` còn thêm `HandGuide.tsx`, `HandGuide.test.tsx`, `hf-layout.test.ts`, `e2e/helpers/hf.ts`: đó là commit HF có sẵn trên nhánh nền (HF chưa vào `origin/main`), FX không sửa. Các file HF bị thay (`ComboFireworks.tsx`, `lib/hf/fireworks.ts`, `hf-*.spec.ts`, `hf-fireworks.test.ts`, `hf-decor.test.ts`) được thêm rồi xoá ngay trong nhánh nên không hiện trong diff.
- T15: `TierRunner` gắn qua prop `runnerSlot` của `WordDisplay` (không dùng portal). Mưa sticker kéo dài từ lúc tạo DOM tới lúc gỡ khoảng 2.85s khi TTL 2500, nên e2e "mất ≤ 2500ms" đỏ. Đã hạ `FX_TTL.rain` 2500 → 2200, mỗi sticker rơi 1500–1900ms + trễ ≤ 300ms (vẫn khớp `fx-css` ≤ 2200 + 300). E2E sửa riêng trong commit `test(FX)`: chỉ đếm `.fx-p--spark` ở mức `some` (pháo giấy DOM `confetti-pop` của mức `some` là hợp lệ), chờ 700ms trước phím 40 để `flashGate` không chặn mưa.
- T16: `lib/fx/confetti.ts` có thêm `setLevel`, `setColors`, `active()`, `dispose()`, `schedule`/`rng` inject. `data-active` do controller set trực tiếp trên canvas (không re-render React), tắt sau `CANVAS_LIFE_MS` (confetti 1000, fireworks 2400). Màu đọc từ `--kr-play/fun/primary/success` của canvas. Prefetch: `whenIdle` gọi `import('./fx/TierConfetti')` rồi `prefetchCanvas()`. `shapeFromPath` được cache theo tên hình, không truyền matrix tính sẵn (matrix cần `DOMMatrix`, chỉ có ở trình duyệt).
- T17: test hồi quy xanh ngay, không cần `feat`.
- T18: `fx-layout` đỏ vì `.owl-body.fx-loop`/`.owl-eyes.fx-loop` (T14) chưa có `pointer-events: none` → thêm `.fx-loop { pointer-events: none }`. `KR_PERF=1` trên `next start` đỏ (118–123ms ở `fx-perf` lẫn `kr-perf`) ở phím đầu: profile CPU cho thấy ~65ms là `new AudioContext()` trong `SoundEngine.init()`, được gọi kể cả khi tắt âm (có từ trước FX, FX đẩy tổng qua ngưỡng). Sửa `useSound`: bỏ qua `init()` khi `!enabled`. Sau sửa `fx-perf` + `kr-perf` 6/6 pass (`--repeat-each 3`). Với âm bật, phím đầu vẫn tốn chi phí tạo `AudioContext` như trước.
- E11 (375px, bấm phím ảo): `.key--highlight` có animation nên `locator.click()` chờ "stable" mãi; test dùng `page.mouse.click` tại tâm phím (vẫn hit-test qua mọi lớp FX).
- Bundle (FX-17): First Load JS `/` 157 kB ở `8b09368` → 169 kB ở HEAD, +12 kB ≤ 15 KB.
- Verify: `pnpm lint` 0 error (40 warning cũ), `pnpm typecheck` 4/4, `pnpm test` engine 255 + web 352 pass, `pnpm build` OK, e2e toàn bộ 162/162 trên `next dev` (PORT=3107, không có `.wt-env`), `KR_PERF=1` `fx-perf`/`kr-perf` 6/6 trên `next start`, `check-tdd-commits` OK.
