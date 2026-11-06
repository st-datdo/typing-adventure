# HF · Tay gợi ý hai bên bàn phím, lời khen chuỗi ra hai bên kèm pháo hoa — Tech plan

Trạng thái: approved
Nguồn: 01-requirements.md, 02-design.md

## Hướng tiếp cận
Thay đổi chỉ ở giao diện client, `apps/web`. Không đổi `packages/game-engine`, DB, API, i18n.

1. **Mật độ pháo hoa là một hàm thuần** `fireworkPlan(value)` trong `apps/web/src/lib/hf/fireworks.ts`, cạnh `lib/kr/combo-celebration.ts`. Hàm trả danh sách chùm của một bên đúng theo bảng ở 02-design: 5 → 1×6, 10 → 2×5, 20 → 2×8, 50 → 3×8. Đi kèm `mirrorBurst`, `fireworkNodeCount(value)` và `FIREWORK_MAX_NODES = 60`. Logic này thuần trình bày, không phải luật game, nên không đặt vào `game-engine`. Mốc vẫn lấy từ `COMBO_MILESTONES` và không đổi.
2. **`ComboBurstView` render hai `.combo-side` đối xứng**, mỗi bên gồm `ComboFireworks`, pill "x{mốc}" và lời khen.
   - Bỏ 8 `.combo-spark`.
   - Thêm prop `suppressed`. `GameEngine` truyền `showCelebration || panel !== 'none' || navOpen`.
   - Gốc `.combo-burst` vẫn giữ `key={milestone.id}`. Khi có mốc mới, cả cây remount, hạt cũ bị gỡ ngay (HF-08).
   - Hạt chỉ là `span` chạy CSS keyframes (`transform`/`opacity`). Không canvas, không thư viện.
3. **Bố cục.**
   - `GameEngine` bọc Keyboard + HandGuide trong `.kb-stage`. Khi `fingerGuide` bật thì thêm `.kb-stage--hands`.
   - Trong `@media (min-width: 1024px)`:
     - `.kb-stage--hands` là grid 3 cột × 2 hàng.
     - `.kb-stage--hands .hands-guide { display: contents }`. Nhờ vậy `.hand-left`, `.hand-right` và `.finger-label[data-side]` thành ô của grid.
     - `.main` nới lên 1240px.
     - `.word-stage` có `padding-inline: calc(var(--hf-gutter) + 12px)`.
   - Dưới 1024px giữ nguyên bố cục cũ (D1).
4. **HandGuide tách thành `HandGuideView`** nhận props (`expected`, `lang`, `fingerGuide`), giống mẫu `ComboBurstView` / `ComboAnnouncerView`, để test bằng `renderToStaticMarkup` mà không phụ thuộc store. Thêm `data-side` cho `.finger-label` (thumb → left, D8) và `aria-hidden="true"` cho 2 SVG.

Phương án đã loại:
- A. Canvas hoặc thư viện pháo hoa (`canvas-confetti`, `tsparticles`): thêm dependency và JS (HF-09 ≤ 10 KB), khó kiểm bounding box từng hạt trong e2e (HF-06), còn phải tự lo reduced motion.
- B. Đặt tay bằng `position: absolute` hai bên `.keyboard`: tay ra ngoài luồng layout, dễ gây cuộn ngang ở 1024px (E1) và đè `GuestBanner`. Grid đo được bề rộng thật, và `display: contents` giữ nguyên DOM HandGuide.
- C. Đặt `fireworkPlan` trong `packages/game-engine`: đây là trình bày, không phải luật chơi. Engine phải giữ phạm vi luật và không phụ thuộc UI.
- D. Render 2 `ComboBurst` riêng (trái/phải) trong `GameEngine`: phải nhân đôi timer `clear(id)`. Một gốc với 2 con thì gỡ cùng frame (HF-12).

Giả định cho các câu hỏi còn mở (theo 02-design D1–D8):
- Ngưỡng 1024px.
- Nhãn đối xứng hai bên.
- Màn hẹp: nhãn đè tạm lên StatsBar trong 1.2s.
- Chỉ 4 mốc.
- Tối đa 54 phần tử pháo hoa.
- `suppressed` có thêm `navOpen`. Lý do: SideNav mở thì không gõ được, và đổi chế độ thì `startTime = null` → `clear()`. Thêm vào chỉ để chắc chắn.

## Hiện trạng code liên quan
- `typing-adventure/apps/web/src/components/game/GameEngine.tsx:36,47-48` — `Panel` type, state `panel`, `navOpen`.
- `typing-adventure/apps/web/src/components/game/GameEngine.tsx:443-458` — `main`: StatsBar(1) → `.word-stage` WordDisplay + `<ComboBurst />`(2) → Keyboard(3) → HandGuide(4) → GuestBanner. Mỗi khối là `kr-enter` với `enter(i)`.
- `typing-adventure/apps/web/src/components/game/GameEngine.tsx:460,521` — `CelebrationModal` khi `showCelebration && result`, `<ComboAnnouncer />`.
- `typing-adventure/apps/web/src/components/game/ComboBurst.tsx:12-38` — `SPARKS` 8 hạt, `ComboBurstView({ milestone, lang, reducedMotion })`.
- `typing-adventure/apps/web/src/components/game/ComboBurst.tsx:40-54` — `ComboBurst` tự `clear(id)` sau `COMBO_BURST_MS`.
- `typing-adventure/apps/web/src/lib/kr/combo-celebration.ts:4,26-41` — `COMBO_BURST_MS = 1200`, reducer `nextCelebration`. Mốc mới thì `id` mới. Miss thì không đổi.
- `typing-adventure/apps/web/src/hooks/useGameEngine.ts:42-44,95-98` — `clear()` khi `startTime` về null; `finish()` / `celebrate(combo)` sau mỗi phím.
- `typing-adventure/apps/web/src/components/game/HandGuide.tsx:25-76` — đọc store, trả `null` khi `!fingerGuide`, `isActive`, `.finger-label.label--visible` giữa 2 SVG.
- `typing-adventure/apps/web/src/styles/game.css:172-180` — `.main` max-width 1000px, flex column.
- `typing-adventure/apps/web/src/styles/game.css:493-508` — `.keyboard-section`, `.keyboard` max-width 820px, padding 18px.
- `typing-adventure/apps/web/src/styles/game.css:633-651,716-735` — `.hands-guide`, `.hand-svg`, `.finger-label` (absolute giữa).
- `typing-adventure/apps/web/src/styles/game.css:1372-1382` — HandGuide ở mobile.
- `typing-adventure/apps/web/src/styles/decor.css:83-169,284-288` — `.word-stage`, `.combo-burst` (tâm, `translate(-50%,-50%)`), `.combo-spark`, keyframes `combo-pop/out/spark`, reduced-motion.
- `typing-adventure/apps/web/src/styles/motion.css` — khối universal reduced-motion (KR-14). Test `styles/__tests__/kr-motion.test.ts:92-103` cấm keyframes animate layout. HF cũng tuân luật này cho `decor.css`.
- Test mẫu để bắt chước:
  - `apps/web/src/components/game/__tests__/ComboBurst.test.tsx` (`renderToStaticMarkup`)
  - `apps/web/src/components/game/__tests__/game-chrome.test.tsx`
  - `apps/web/src/lib/__tests__/combo-celebration.test.ts`
  - `apps/web/src/styles/__tests__/kr-motion.test.ts` + `css-helpers.ts` (`readStyle`, `mediaBlock`, `ruleFor`, `keyframes`)
  - `apps/web/e2e/kr-game.spec.ts`, `kr-motion.spec.ts`, `kr-perf.spec.ts`, `kr-layout.spec.ts`, `e2e/helpers/kr.ts` (`seedSettings`, `textToType`, `typeText`, `runningAnimations`, `noHorizontalScroll`)

## File thay đổi
- `typing-adventure/apps/web/src/lib/hf/fireworks.ts` (thêm) — `fireworkPlan`, `mirrorBurst`, `fireworkNodeCount`, `FIREWORK_MAX_NODES`.
- `typing-adventure/apps/web/src/lib/__tests__/hf-fireworks.test.ts` (thêm)
- `typing-adventure/apps/web/src/components/game/ComboFireworks.tsx` (thêm) — render chùm + hạt từ plan.
- `typing-adventure/apps/web/src/components/game/ComboBurst.tsx` (sửa) — 2 `.combo-side`, `suppressed`, bỏ `SPARKS`.
- `typing-adventure/apps/web/src/components/game/__tests__/ComboBurst.test.tsx` (sửa) — thay assertion 8 `combo-spark` của KR-09.
- `typing-adventure/apps/web/src/components/game/HandGuide.tsx` (sửa) — `HandGuideView`, `fingerLabelSide`, `data-side`, `aria-hidden`.
- `typing-adventure/apps/web/src/components/game/__tests__/HandGuide.test.tsx` (thêm)
- `typing-adventure/apps/web/src/components/game/GameEngine.tsx` (sửa) — `.kb-stage`, truyền `suppressed`.
- `typing-adventure/apps/web/src/styles/decor.css` (sửa) — `.combo-burst` gốc, `.combo-side*`, `.fw-rocket`, `.fw-spark`, keyframes `fw-*`, reduced-motion; bỏ `.combo-spark`.
- `typing-adventure/apps/web/src/styles/game.css` (sửa) — `.kb-stage`, `@media (min-width: 1024px)` cho `.main`, `.kb-stage--hands`, `.hands-guide`, `.finger-label[data-side]`, `.word-stage`.
- `typing-adventure/apps/web/src/styles/__tests__/hf-decor.test.ts` (thêm)
- `typing-adventure/apps/web/src/styles/__tests__/hf-layout.test.ts` (thêm)
- `typing-adventure/apps/web/e2e/helpers/hf.ts` (thêm) — `rectsIntersect`, `overlapReport(page, effectSel, targetSels)`, `sampleOverlaps(page, ms, step)`, `startCustomText(page, text)`.
- `typing-adventure/apps/web/e2e/hf-layout.spec.ts` (thêm)
- `typing-adventure/apps/web/e2e/hf-combo.spec.ts` (thêm)
- `typing-adventure/apps/web/e2e/hf-perf.spec.ts` (thêm)
- `typing-adventure/apps/web/e2e/kr-motion.spec.ts` (sửa) — dòng 23: `.combo-spark` → `.fw-spark, .fw-rocket`.
- `docs/features/hand-hints-side-fireworks-streak/**`

## Thay đổi DB
Không.

## Thay đổi API / contract
| Method + route | Auth | Request (Zod) | Response `{success,data|error}` | Status lỗi |
|---|---|---|---|---|
| không | — | — | — | — |

- Socket.IO: không. Type public của game-engine: không. i18n key: không (tái dùng `comboPraise*`, `comboAnnounce`, `finger*`).
- Contract nội bộ mới, `apps/web`:
  - `fireworkPlan(value: number): Burst[]`, với `Burst = { x: number; y: number; delayMs: number; sparks: number }`, x/y tính theo %.
  - `mirrorBurst(b: Burst): Burst` → `{ ...b, x: 100 - b.x }`.
  - `fireworkNodeCount(value): number`, tính cả hai bên gồm tên lửa.
  - `FIREWORK_MAX_NODES = 60`.
  - Mốc không thuộc `COMBO_MILESTONES` → `[]`.
- `ComboBurstView` thêm prop `suppressed?: boolean`. `ComboBurst` thêm prop `suppressed?: boolean`.
- `HandGuideView({ expected: string | null, lang: Lang, fingerGuide: boolean })` và `fingerLabelSide(finger: Finger): 'left' | 'right'`. `HandGuide({ gameState })` giữ chữ ký cũ.

## Rủi ro
| Rủi ro | Khả năng | Ảnh hưởng | Giảm thiểu |
|---|---|---|---|
| Ở 1024px (clientWidth ~1009 khi có thanh cuộn dọc), grid `84 + 12 + 772 + 12 + 84` = 964px vượt nội dung `.main` (1009 − padding 40 = 969px). Sát mép, nên dễ cuộn ngang hoặc bóp phím (E1) | Trung bình | Fail HF-01, KR-20 | Cột bàn phím `minmax(772px, 820px)`. Trong `@media (min-width:1024px) and (max-width:1279px)` giảm `.main` padding-inline xuống 12px và `.keyboard` padding xuống 12px như 02-design. `hf-layout.spec` đo `scrollWidth` ở 1024 |
| Vùng chữ hẹp đi `2×(gutter+12)` → văn bản dài thêm dòng, ở 1280×720 bàn phím bị đẩy xuống quá `innerHeight` | Trung bình | Fail HF-01 (in viewport) | Bỏ khối HandGuide dưới bàn phím lấy lại ~140px. Nếu vẫn tràn, `--hf-gutter` min 132px (02-design Responsive). E2E đo ở 1280×720 |
| Thay test KR-09 "8 sparks" và đổi `.combo-spark` trong e2e KR-14 có thể bị coi là làm yếu test cũ | Chắc chắn | Review/QC nghi ngờ | Chỉ đổi trong commit `test(HF):` (không trong `feat:`). Body commit ghi "replaces KR-09 8-spark assertion per HF-06/HF-07 (02-design C-ComboBurst)". Assertion mới chặt hơn (n theo mốc, ≥ 8) |
| `display: contents` bỏ box của `.hands-guide`; `getBoundingClientRect` của `.hands-guide` = 0 | Thấp | Test cũ dựa vào box | Không test nào đo `.hands-guide` (đã grep). Test HF đo `.hand-left/.hand-right` |
| `container-type: size` + đơn vị `cq*` cho bán kính pháo hoa: `.combo-side` phải có kích thước cố định, không thì sụp chiều cao | Thấp | Hạt lệch, giao chữ | `.combo-side` có `top:0; bottom:0` (≥1024) hoặc `height:92px` (<1024). Hạt dùng `--fw-r: min(22cqw, 22cqh, 56px)`. Chrome đã hỗ trợ cq |
| Long task khi mount 54 span ở CPU 4x | Thấp | HF-09 | Tạo một lần theo `milestone.id`, `memo` ComboFireworks, chỉ animate compositor props. `hf-perf.spec` đo |
| Dependency mới | Không | — | Không thêm |

## Tasks

Luật TDD cho mọi task: commit `test(HF): …` chứa file test (đỏ khi chạy), rồi commit `feat(HF): …` chỉ chứa code, không chạm file `__tests__/`, `*.test.ts(x)`, `e2e/*.spec.ts` (CI `scripts/ci/check-tdd-commits.sh`). `e2e/helpers/hf.ts` cũng commit trong `test:`. Nếu sau `feat:` cần sửa test, làm commit `test:` mới, không gộp.

### T1 · Kế hoạch mật độ pháo hoa — AC: HF-06, HF-07, HF-08
- Test (viết trước, phải đỏ): `typing-adventure/apps/web/src/lib/__tests__/hf-fireworks.test.ts`
  - `HF-07 density strictly increases`: `fireworkNodeCount`/sparks: n(5)=12 < n(10)=20 < n(20)=32 < n(50)=48, n(5) ≥ 8.
  - `HF-07 deterministic`: 2 lần gọi `fireworkPlan(10)` cho kết quả `toEqual`.
  - `HF-06 left equals right`: tổng sparks của plan bằng tổng sparks của plan đã `mirrorBurst`; x mirror = 100 − x.
  - `HF-08 cap`: với mọi mốc, `fireworkNodeCount ≤ FIREWORK_MAX_NODES (60)`.
  - `HF-06 E6 non-milestone`: `fireworkPlan(7)`, `fireworkPlan(51)` → `[]`.
  - `HF-06 finishes before burst clears`: max(`delayMs`) + 250 + 600 ≤ `COMBO_BURST_MS` (1200).
  - `HF-06 HF-11 bursts stay inside`: mỗi chùm có 0 < x, y < 100, và x ± 22, y ± 22 vẫn trong [0,100], ứng với bán kính 22cq.
- Code: `typing-adventure/apps/web/src/lib/hf/fireworks.ts` — bảng hằng theo 02-design (vị trí 50/30, 28/58, 72/62; delay 150ms×k; sparks 6/5/8/8).
- Verify: `cd typing-adventure && pnpm --filter @typing-adventure/web exec vitest run hf-fireworks`
- Skill: không

### T2 · ComboBurst hai bên + ComboFireworks + suppressed — AC: HF-05, HF-06, HF-07, HF-10, HF-12
- Test (viết trước, phải đỏ): sửa `typing-adventure/apps/web/src/components/game/__tests__/ComboBurst.test.tsx`
  - Xoá case `KR-09 renders the milestone, praise and 8 sparks`. Thay bằng `KR-09 HF-05 renders two mirrored sides with milestone and praise`:
    - gốc `combo-burst` có `aria-hidden="true"`;
    - đúng 2 `combo-side` (`--left`, `--right`);
    - `x10` xuất hiện 2 lần, `Siêu quá!` 2 lần;
    - không còn `combo-spark`.
  - `HF-06 HF-07 spark count per milestone`: với 5/10/20/50 (`reducedMotion={false}`), đếm `class="fw-spark"` = 12/20/32/48, `fw-rocket` = 2/4/4/6. Số spark trong `--left` bằng số trong `--right`.
  - Sửa case KR-14 thành `KR-14 HF-10 reduced motion keeps both labels but no fireworks`: chứa `x5` 2 lần, không có `fw-spark`, `fw-rocket`, `combo-spark`.
  - `HF-05 en praise`: `lang="en"`, mốc 10 → chứa `Super!`.
  - `HF-12 suppressed renders nothing`: `suppressed` + milestone → `''`.
  - Giữ nguyên 2 case `renders nothing without a milestone` và `announcer is always mounted`.
- Code:
  - `typing-adventure/apps/web/src/components/game/ComboFireworks.tsx`:
    - `memo`, props `{ value, side }`;
    - mỗi chùm 1 `span.fw-burst` (style `--x`, `--y`, `--d`) chứa `span.fw-rocket` + N `span.fw-spark` (style `--a` = `i*360/N + k*20` deg, `--c` = màu token xoay vòng);
    - `aria-hidden`.
  - `typing-adventure/apps/web/src/components/game/ComboBurst.tsx`:
    - bỏ `SPARKS`;
    - render `div.combo-burst` > 2 × `div.combo-side.combo-side--{left|right}` (ComboFireworks khi `!reducedMotion`, pill, praise);
    - prop `suppressed` cho cả View và container. Container vẫn chạy timer `clear(id)` kể cả khi suppressed.
- Verify: `cd typing-adventure && pnpm --filter @typing-adventure/web exec vitest run ComboBurst && pnpm typecheck`
- Skill: không
- Ghi chú TDD: đây là test KR-09 hiện có bị đổi có chủ ý. Thay đổi nằm trong commit `test(HF): ComboBurst two sides + fireworks (replaces KR-09 8-spark assertion)` và commit này đỏ. `feat(HF): …` sau đó không chạm file test.

### T3 · CSS nhãn hai bên + pháo hoa + reduced motion — AC: HF-05, HF-06, HF-10, HF-11
- Test (viết trước, phải đỏ):
  - `typing-adventure/apps/web/src/styles/__tests__/hf-decor.test.ts` (dùng `css-helpers`, đọc `decor.css`):
    - `HF-05 HF-06 effect layers ignore pointer`: `.combo-burst`, `.combo-side`, `.fw-spark` có `pointer-events: none` (trực tiếp hoặc qua gốc).
    - `HF-06 keyframes fw-* only animate transform/opacity, iteration 1, no infinite`.
    - `HF-06 sparks fill both`: `.fw-spark` có `animation` chứa `both`, không `infinite`.
    - `HF-10 reduced motion`: `mediaBlock(decor, /prefers-reduced-motion:\s*reduce/)` có `.combo-side` `animation: none` và `.fw-burst`/`.fw-spark` `display: none`.
    - `HF-05 HF-11 side positions`:
      - `mediaBlock(/min-width:\s*1024px/)` có `.combo-side` `top: 0`, `bottom: 0`, `width: var(--hf-gutter)`;
      - ngoài media: `.combo-side` có `bottom: calc(100% + 4px)`, `height: 92px`, `container-type: size`.
    - `KR-09 no centered burst`: không còn selector `.combo-spark`, và keyframes `combo-pop` không chứa `translate(-50%, -50%)`.
  - `typing-adventure/apps/web/e2e/helpers/hf.ts` (thêm).
  - `typing-adventure/apps/web/e2e/hf-combo.spec.ts`. Dùng custom text 60 ký tự đúng qua `.btn-custom-text` → `.ta-textarea` → nút bắt đầu, viewport 1280×720 trừ khi ghi khác:
    - `HF-05 HF-06 milestone 5 shows two sides + fireworks without covering text or keys`:
      - `.combo-side` count 2, chứa `x5` và `Giỏi lắm!`;
      - lấy mẫu mỗi 100ms trong 1.3s: không giao `.word-display .char`, không giao `.key`;
      - `.fw-spark` trái = phải;
      - ≤ 2000ms thì `.fw-spark` count 0, ≤ 1500ms thì `.combo-burst` count 0;
      - focus ở `.hidden-input`;
      - announcer chứa `Chuỗi 5! Giỏi lắm!`.
    - `HF-06 no fireworks between milestones`: sau khi mốc 5 gỡ, gõ tới combo 9 → `.fw-spark` 0.
    - `HF-07 density per milestone`: gõ tới 5/10/20/50, ghi số `.fw-spark` ngay sau mỗi mốc → 12 < 20 < 32 < 48.
    - `HF-08 miss then 5 again`: tới 10, gõ sai 1 phím → không tăng `.fw-spark`, burst biến mất ≤ 1500ms từ mốc. Gõ đúng lại 5 → `.fw-spark` = 12. Polling `.fw-spark, .fw-rocket` luôn ≤ 60.
    - `HF-10 reduced motion` (`emulateMedia reduce`): mốc 5 và 10 → `.fw-spark, .fw-rocket` 0, nhãn hai bên có mặt. 500ms sau `runningAnimations` = 0. Burst gỡ ≤ 1500ms.
    - `HF-11 narrow` (375×667, 768×1024): mốc 5 và 50 → `noHorizontalScroll` suốt hiệu ứng, không giao chữ / phím (mẫu 100ms), nhãn trong viewport.
    - `HF-12 finish removes effects`: text dài đúng 10 ký tự, mốc 10 ở phím cuối → `.combo-burst` count 0 khi `.celebration-content` hiện. Mốc 5 rồi bấm Chơi lại → 0 ngay. Mở SettingsPanel thì không có `.combo-burst`.
    - `HF-13 themes/lang`: light/dark/colorful × vi/en, mốc 10 → text đúng (`Siêu quá!` / `Super!`), `.combo-burst-praise` có `scrollWidth ≤ clientWidth` (không cắt), axe `color-contrast` include `.combo-side` không vi phạm. Không có request `/api/` mới trong lúc gõ ở guest.
  - Sửa `typing-adventure/apps/web/e2e/kr-motion.spec.ts:23` → `page.locator('.fw-spark, .fw-rocket')` count 0.
- Code: `typing-adventure/apps/web/src/styles/decor.css`:
  - `.combo-burst` thành lớp phủ `position:absolute; inset:0; pointer-events:none; z-index:5` (không animation);
  - `.combo-side` (+ `--left/--right`) theo vị trí <1024 và `@media (min-width:1024px)`, `container-type:size`, `overflow:hidden`, flex column center, animation `combo-pop` / `combo-out` bỏ `translate(-50%,-50%)`;
  - pill/praise cỡ màn rộng/hẹp, `white-space: normal`, viền `--kr-fun` cho praise;
  - `.fw-burst` absolute tại `--x/--y`, `.fw-rocket` (`fw-rise` 250ms), `.fw-spark` (`fw-pop` 600ms delay `calc(var(--d) + 250ms)`, `both`) bay `rotate(var(--a)) translateY(calc(-1 * var(--fw-r)))`;
  - xoá `.combo-spark` + `@keyframes combo-spark`;
  - reduced-motion: `.combo-side { animation: none }`, `.fw-burst { display: none }`.
  - `.word-stage` padding-inline ≥1024px đặt ở T5 (game.css). T3 chỉ định nghĩa `--hf-gutter: clamp(140px, 13vw, 180px)` trên `.word-stage`.
- Verify: `cd typing-adventure && pnpm --filter @typing-adventure/web exec vitest run hf-decor kr-motion && pnpm --filter @typing-adventure/web exec vitest run`. E2E `hf-combo` chỉ xanh hết sau T5 (cần lề `--hf-gutter`). Ở T3 chạy `kr-motion.spec.ts`, `kr-game.spec.ts`.
- Skill: không

### T4 · HandGuideView + nhãn ngón theo bên — AC: HF-02, HF-04
- Test (viết trước, phải đỏ): `typing-adventure/apps/web/src/components/game/__tests__/HandGuide.test.tsx`
  - `HF-02 f highlights left index only`: `HandGuideView expected="f" lang="vi" fingerGuide` → đúng 1 `finger--active`, trên `id="finger-left-index"`; `.finger-label` có `data-side="left"` và text = `t('vi','fingerLeftIndex')`.
  - `HF-02 j highlights right index, label right` (lang `en`, text = `t('en','fingerRightIndex')`).
  - `HF-02 space highlights both thumbs, label left` (D8): 2 `finger--active` trên `finger-thumb-left` / `finger-thumb-right`.
  - `HF-02 fingerLabelSide` cho đủ 9 `Finger`.
  - `HF-04 fingerGuide false renders nothing`: `''`.
  - `HF-02 svgs are decorative`: 2 `<svg` có `aria-hidden="true"`.
  - `HF-02 no expected char → no label`.
- Code: `typing-adventure/apps/web/src/components/game/HandGuide.tsx`:
  - export `fingerLabelSide` và `HandGuideView` (toàn bộ markup cũ + `data-side` + `aria-hidden`);
  - `HandGuide` đọc store, tính `expected` rồi render View.
  - Không đổi id, class ngón.
- Verify: `cd typing-adventure && pnpm --filter @typing-adventure/web exec vitest run HandGuide`
- Skill: không

### T5 · Bố cục `.kb-stage` + tay hai bên + lề khen + wiring suppressed — AC: HF-01, HF-03, HF-04, HF-05, HF-11, HF-12
- Test (viết trước, phải đỏ):
  - `typing-adventure/apps/web/src/styles/__tests__/hf-layout.test.ts` (đọc `game.css`):
    - `HF-01 wide media`: `mediaBlock(game, /min-width:\s*1024px/)` có `.main` `max-width: 1240px`, `.kb-stage--hands` `display: grid` với `grid-template-columns` chứa `minmax(84px, 160px)` và `minmax(772px, 820px)`, `.kb-stage--hands .hands-guide` `display: contents`, `.finger-label[data-side="left"]` / `[data-side="right"]` đặt `grid-column` 1 / 3, `.hand-svg` `pointer-events: none`.
    - `HF-05 text gutter`: trong media có `.word-stage` `padding-inline` chứa `var(--hf-gutter)`.
    - `HF-03 narrow unchanged`: ngoài media, `.main` `max-width: 1000px`. Khối `@media (max-width: 640px)` vẫn có `.hands-guide` / `.hand-svg`.
    - `HF-04`: `.keyboard` `max-width: 820px` không đổi.
  - `typing-adventure/apps/web/e2e/hf-layout.spec.ts`:
    - `HF-01` ở 1024×768, 1280×720, 1440×900, chờ 900ms:
      - `hand-left.right ≤ keyboard.left`, `hand-right.left ≥ keyboard.right`;
      - giao dọc với `.keyboard`;
      - ở 1280/1440 khi `scrollY=0`, `bottom ≤ innerHeight` cho 2 tay và `.keyboard`;
      - `noHorizontalScroll`;
      - tay không giao `.key` nào.
    - `HF-02`: custom text `fj ` → trước mỗi phím kiểm `#finger-left-index.finger--active`, rồi `#finger-right-index`, rồi 2 thumb. `.finger-label` visible, trong viewport, không giao `.key` và `.word-display .char`. Chạy cả `vi` và `en`.
    - `HF-03` ở 375×667, 768×1024: `noHorizontalScroll`; `.keyboard.width` ≥ giá trị baseline hằng số đo trên `main` trước khi sửa, so `keyboard.width / main.clientWidth` với tỉ lệ cũ; 2 tay visible, không giao `.key` / `.word-display`; ngón tô đúng với `f`.
    - `HF-04` `seedSettings({ fingerGuide: false })` ở 375/1024/1440: `.hand-svg` count 0, `.keyboard` có `keyboard--hide-fingers`, `|keyboardCenterX − mainCenterX| ≤ 2`, `.keyboard` width = min(820, khả dụng). Bật lại qua SettingsPanel → `.hand-left` visible và không reload.
    - `HF-12 panels suppress`: mở SettingsPanel → `.combo-burst` count 0.
- Code:
  - `typing-adventure/apps/web/src/components/game/GameEngine.tsx:451-456`: thay 2 `kr-enter` bằng `<div className={`kr-enter kb-stage${settings.fingerGuide ? ' kb-stage--hands' : ''}`} style={enter(3)}>` chứa Keyboard + HandGuide. Dòng 449: `<ComboBurst suppressed={showCelebration || panel !== 'none' || navOpen} />`.
  - `typing-adventure/apps/web/src/styles/game.css`:
    - `.kb-stage { display:flex; flex-direction:column; gap:16px }`;
    - `@media (min-width:1024px)`:
      - `.main { max-width:1240px }`;
      - `.kb-stage--hands { display:grid; grid-template-columns: minmax(84px,160px) minmax(772px,820px) minmax(84px,160px); grid-template-rows: auto auto; column-gap:12px; justify-content:center }`;
      - `.kb-stage--hands .keyboard-section { grid-column:2; grid-row:1 / span 2 }`;
      - `.kb-stage--hands .hands-guide { display:contents }`;
      - `.hand-left { grid-column:1; grid-row:1; align-self:end; width:100%; pointer-events:none }`, `.hand-right` cột 3;
      - `.finger-label` static, `grid-row:2`, `white-space:normal`, `text-align:center`, `min-height` 2 dòng, `[data-side=left|right]` → cột 1/3;
      - `.word-stage { padding-inline: calc(var(--hf-gutter) + 12px) }`.
    - `@media (min-width:1024px) and (max-width:1279px)`: `.main` padding-inline 12px, `.kb-stage--hands .keyboard` padding 12px.
  - Phải kiểm `Keyboard.tsx` có bọc `.keyboard-section` (selector grid dựa vào đó). Nếu không có, đặt selector theo `.keyboard`.
- Verify:
  - `cd typing-adventure && pnpm --filter @typing-adventure/web exec vitest run hf-layout && pnpm typecheck`
  - `set -a && . ../.wt-env && set +a && pnpm --filter @typing-adventure/web exec playwright test e2e/hf-layout.spec.ts e2e/hf-combo.spec.ts e2e/kr-layout.spec.ts e2e/kr-game.spec.ts e2e/kr-motion.spec.ts`
- Skill: không

### T6 · Hiệu năng và bundle — AC: HF-09
- Test: `typing-adventure/apps/web/e2e/hf-perf.spec.ts`
  - Theo mẫu `kr-perf.spec.ts`: custom text 60 ký tự, CPU 4x, `typeText(..., 30)`, poll mỗi 100ms `.fw-spark, .fw-rocket` ≤ 60 và focus.
  - Sau cùng: `.char--correct` = độ dài, `.celebration-content` chứa `100%`. Đọc `maxCombo ≥ 50` từ màn kết quả, hoặc kiểm đã thấy `x50` trong `.combo-burst` khi poll.
  - Long task ≤ 100ms (bật theo `KR_PERF=1` như KR-15).
  - Không có request `image|font|media|script` mới sau khi trang ổn định.
  - Test này dự kiến xanh ngay sau T5, là test hồi quy. Commit `test(HF): perf regression for fireworks`, không có `feat:` đi kèm. Nếu đỏ thì sửa trong `feat(HF): perf …` chỉ chạm code.
- Code: không (trừ khi test đỏ).
- Verify:
  - `set -a && . ../.wt-env && set +a && KR_PERF=1 pnpm --filter @typing-adventure/web exec playwright test e2e/hf-perf.spec.ts`
  - `pnpm build` rồi so First Load JS route `/` với `main` (manual: `git stash`/checkout `main`, chạy `pnpm build`, ghi số; về nhánh, build lại; chênh ≤ 10 KB, ghi vào 04-qc-report).
- Skill: không

## Ma trận AC → Task → Test
| AC | Task | Test |
|---|---|---|
| HF-01 | T5 | `hf-layout.test.ts` (HF-01 wide media); `e2e/hf-layout.spec.ts` HF-01 ×3 viewport |
| HF-02 | T4, T5 | `HandGuide.test.tsx` (f/j/space, label side, i18n vi/en); `e2e/hf-layout.spec.ts` HF-02 |
| HF-03 | T5 | `hf-layout.test.ts` HF-03; `e2e/hf-layout.spec.ts` HF-03 (375, 768) |
| HF-04 | T4, T5 | `HandGuide.test.tsx` HF-04; `hf-layout.test.ts` HF-04; `e2e/hf-layout.spec.ts` HF-04 (+ bật lại) |
| HF-05 | T2, T3, T5 | `ComboBurst.test.tsx` HF-05; `hf-decor.test.ts` HF-05; `hf-layout.test.ts` gutter; `e2e/hf-combo.spec.ts` HF-05 |
| HF-06 | T1, T2, T3 | `hf-fireworks.test.ts` HF-06; `ComboBurst.test.tsx` HF-06; `hf-decor.test.ts` HF-06; `e2e/hf-combo.spec.ts` HF-05/HF-06 |
| HF-07 | T1, T2 | `hf-fireworks.test.ts` HF-07; `ComboBurst.test.tsx` spark count; `e2e/hf-combo.spec.ts` HF-07 |
| HF-08 | T1 | `hf-fireworks.test.ts` cap; `combo-celebration.test.ts` (hiện có: miss không kéo dài, mốc mới thay thế); `e2e/hf-combo.spec.ts` HF-08 |
| HF-09 | T6 | `e2e/hf-perf.spec.ts`; manual: so First Load JS `/` của `pnpm build` với `main` |
| HF-10 | T2, T3 | `ComboBurst.test.tsx` HF-10; `hf-decor.test.ts` HF-10; `e2e/hf-combo.spec.ts` HF-10; `e2e/kr-motion.spec.ts` (sửa) |
| HF-11 | T1, T3 | `hf-fireworks.test.ts` bursts stay inside; `hf-decor.test.ts` side positions; `e2e/hf-combo.spec.ts` HF-11 |
| HF-12 | T2, T5 | `ComboBurst.test.tsx` suppressed; `e2e/hf-combo.spec.ts` HF-12; `e2e/hf-layout.spec.ts` panels suppress |
| HF-13 | T3 | `e2e/hf-combo.spec.ts` HF-13 (theme × lang, axe, no `/api/`); không key i18n mới nên `kr-i18n.test.ts` hiện có vẫn phủ |

## Verify toàn bộ
```bash
cd typing-adventure && pnpm lint && pnpm typecheck && pnpm test && pnpm build
set -a && . ../.wt-env && set +a && pnpm --filter @typing-adventure/web test:e2e
bash ../scripts/ci/check-tdd-commits.sh main HEAD
```

## Lịch sử
- v1 2026-11-06 11:00: bản đầu.
- 2026-11-06 15:45: approved by user.
