# KR · Thiết kế lại giao diện thân thiện trẻ em — Tech plan

Trạng thái: approved
Nguồn: 01-requirements.md, 02-design.md

## Hướng tiếp cận
Chỉ đổi lớp trình bày của `apps/web`. Mọi thứ làm bằng CSS thuần, inline SVG và vài helper TS thuần, không thêm thư viện runtime nào.

1. **Token CSS 2 lớp.** Tạo file mới `styles/tokens.css`, import đầu tiên trong `globals.css`. File này khai báo `--kr-*` cho `:root, [data-theme="light"]`, rồi ghi đè cho `[data-theme="colorful"]` và `[data-theme="dark"]`. Trong `globals.css`, token cũ (`--ink`, `--surface*`, `--berry*`, `--sun*`, `--coral*`, `--leaf*`, `--overlay`, `--line`, `--scene`…) chuyển thành alias `var(--kr-*)`. Các màn chỉ đổi theme (KR-13) nhờ vậy tự nhận bảng màu mới.
   **Bẫy cần tránh:** custom property tham chiếu `var()` được tính tại phần tử khai báo nó. Selector `.little-root:not(.games-root)` hiện đang khai báo lại token (`globals.css:45-81`), nên khối alias **phải** đứng trong cùng danh sách selector `:root, [data-theme], .little-root:not(.games-root)`. Phần tử đó cũng khai báo lại nhóm `--kr-*` trung tính (bg/card/fg/fg-muted/edge/drop/overlay) theo light, giống hành vi cũ. Bỏ các giá trị cứng trong khối `[data-theme="dark"]` hiện tại. Thêm token `--kr-on-success` (light `#FFFFFF`, dark `#0F172A`) vì chữ trắng trên `#4ADE80` ở dark không đạt tương phản (design đang ghi `key--correct` dùng chữ trắng).
2. **Font.** Giữ `next/font/google` `Baloo_2`. Bỏ mảng `weight` để dùng bản variable 400–800 (Context7, Next 15.5: font variable không cần `weight`, tải lúc build và tự host, "No requests are sent to Google by the browser"). Như vậy có weight 400 cho thân bài mà không thêm file static. `--font-ui`, `--font-body` và `--font-heading` đều là `var(--font-kid), system-ui, sans-serif`. Không đụng CSP.
3. **SVG.**
   - Icon: inline, một map path `icons.ts` (dữ liệu thuần) cộng component `Icon.tsx` dùng `currentColor`.
   - Mascot: `OwlMascot.tsx` là inline SVG **không dùng hook** để dùng được cả trong `LoadingScreen` (không `'use client'`). Trạng thái loop và reduced-motion xử lý hoàn toàn bằng CSS.
   - Minh hoạ lớn (cảnh, thẻ tuổi, game, đồng hồ): file tĩnh trong `public/illustrations/`. Cảnh nền đặt qua CSS `background-image` theo `[data-theme]` (ảnh lỗi không lộ icon vỡ, E9). Ảnh trong thẻ dùng `<img alt="" width height>` để tránh CLS. Lý do chia như vậy: minh hoạ lớn không nằm trong First Load JS (KR-16), icon và cú thì cần đổi màu và trạng thái theo theme.
4. **Animation chỉ bằng CSS keyframes** trong `styles/motion.css`:
   - Stagger bằng `.kr-enter` + biến `--i`.
   - Một khối reduced-motion toàn cục (`animation-duration:.01ms!important; animation-iteration-count:1!important; transition-duration:.01ms!important`).
   - Tạm dừng loop bằng `.ta-screen[data-playing="true"] .kr-loop { animation-play-state: paused }`.
   - Hook `usePrefersReducedMotion` (dùng `useSyncExternalStore` + `matchMedia` `change`, E4) chỉ dùng để **không render** hạt/confetti.
5. **Combo milestone tách khỏi đường gõ.** Tạo store Zustand nhỏ `stores/combo-celebration-store.ts` (`{ milestone: {value,id} | null, celebrate, clear }`) với reducer thuần `lib/kr/combo-celebration.ts`.
   - `useGameEngine.handleKeypress` đã có `isMilestone` (`useGameEngine.ts:87`) nên gọi `celebrate(combo)` ngay ở đó. Lần set này nằm cùng event với `set` của game-store nên React batch, không thêm render.
   - Ba thành phần subscribe bằng selector: `ComboBurst`, `ComboAnnouncer` (live region luôn mount) và `GameOwl` (cú trên TopBar).
   - `GameEngine`, `WordDisplay` và `Keyboard` **không** subscribe, nên timer ẩn ở 1200ms chỉ re-render 3 component nhỏ.
   - Không đổi `game-store.ts` hay engine (KR-21).
6. **Confetti.** 24 `<span>` CSS. Bố cục sinh từ hàm thuần `lib/kr/confetti.ts` (PRNG có seed, không gọi `Math.random` lúc render, nên không lệch hydration). Component tự gỡ sau 2500ms và gỡ ngay khi `visibilitychange → hidden` (E12).
7. **ChoiceCards** theo pattern radiogroup với roving tabindex. Logic phím tách vào hàm thuần `lib/kr/choice-nav.ts`.
8. **Chiến lược test.** Vitest web hiện chạy env `node`, chỉ nhận `*.test.ts` (`apps/web/vitest.config.ts:9-11`), và chưa có jsdom hay testing-library.
   - Mở include thêm `*.test.tsx`, đặt `esbuild.jsx: 'automatic'` (tsconfig đang `jsx: preserve`).
   - Test component bằng `renderToStaticMarkup` của `react-dom/server`, chỉ kiểm markup tĩnh.
   - Hành vi tương tác: kiểm qua hàm thuần cộng Playwright e2e.
   - Không thêm jsdom. Thêm 1 devDependency là `@axe-core/playwright` cho KR-17.

**DQ1, đã chọn:** giữ nguyên giá trị 8 key `mode*`/`lessonAll`/`lv*` (còn emoji), và cũng không thêm key mới. ChoiceCards hiển thị qua helper thuần `plainLabel(t(lang, key))` để bỏ cụm ký hiệu ở đầu chuỗi. Lý do:
- KR-13 yêu cầu `/leaderboard` (dùng các key này ở `leaderboard/page.tsx:97-106`) giữ nguyên văn bản.
- KR-11 yêu cầu "nhãn i18n hiện có".
- Cách này thoả cả hai và không phải dịch trùng.

Đã loại "bỏ emoji trong vi/en" vì đổi văn bản leaderboard, vi phạm KR-13. Đã loại "8 key mới" vì trùng nội dung với key cũ và lệch KR-11.

**DQ2, đã chọn, phạm vi hẹp:** trong `GameEngine` bỏ qua `keydown` Space khi `navOpen === true` hoặc `e.target` nằm trong `.side-nav`. Đóng SideNav thì trả focus về input ẩn (E13). Logic đặt trong hàm thuần `lib/game-input.ts`. **Không** mở rộng sang các nút TopBar: nếu trẻ vừa bấm nút loa rồi gõ Space, Space vẫn phải vào ván như hiện tại. Không đổi luật game.

**DQ3:** giữ tên bài từ engine. **DQ4:** chấp nhận admin nhận clay qua `.ui-*`, chỉ kiểm tay để chắc không vỡ bố cục.

**Phương án đã loại:**
- **framer-motion/lottie:** thêm khoảng 30–50 KB gzip, vượt ngân sách +20 KB (KR-16), và có rAF/JS trên đường gõ (KR-15).
- **Bộ icon npm (Phosphor/Lucide):** thêm dependency trong khi chỉ cần khoảng 30 icon, inline vẫn nằm trong ngân sách.
- **Đổi tên token cũ ở mọi file CSS:** khoảng 120 vị trí, rủi ro sót. Alias đạt cùng kết quả.
- **Thêm `milestone` vào `game-store`:** làm `GameEngine` (đang subscribe cả store ở `GameEngine.tsx:41`) re-render thêm khi ẩn burst.
- **jsdom + @testing-library/react:** thêm 2–3 dependency và đổi env test toàn web. Cách SSR markup cộng hàm thuần cộng e2e đã đủ.

## Hiện trạng code liên quan
- `typing-adventure/apps/web/src/app/layout.tsx:8-13` — Baloo_2 (`latin`,`vietnamese`, 4 weight tĩnh), `--font-kid`; `:20` `THEME_BOOT` (không đổi)
- `typing-adventure/apps/web/src/styles/globals.css:13-43` — token gốc; `:45-81` light/colorful + `.little-root:not(.games-root)` khai báo lại token; `:83-120` colorful/dark; `:130-136` body `--scene` + `background-attachment: fixed`
- `typing-adventure/apps/web/src/styles/ui.css:72-215` — `.ui-chip` (52px), `.ui-btn` (`--sm` 40px < 44), màu chữ cứng `#fff`/`#3b3355` trên nút màu; `:380-382` focus-visible; `:403` reduced-motion rải rác
- `typing-adventure/apps/web/src/styles/game.css:317-352` — `charPop`/`wordBurst`/`shake`; `:385-410` combo pill; `:919-938` `celebration-emoji` loop `bounce infinite`; `:1224-1231` reduced-motion 4 class
- `typing-adventure/apps/web/src/styles/little.css:918-926` — reduced-motion cho Little (giữ)
- `typing-adventure/apps/web/src/lib/security-headers.ts:44-45` — CSP `img-src 'self' data: blob:`, `font-src 'self' data:` (không đổi; test `lib/__tests__/security-headers.test.ts` giữ xanh)
- `typing-adventure/apps/web/src/app/page.tsx:26-32` — LoadingScreen → AgePicker/LittleMode/GameEngine
- `typing-adventure/apps/web/src/components/game/GameEngine.tsx:131-163` — `input` + `keydown` Space trên `document`, `preventDefault` kể cả khi SideNav mở (lỗi DQ2); `:237-241` click vùng trống → focus; `:258-315` TopBar emoji; `:41` `useGameStore()` cả store
- `typing-adventure/apps/web/src/hooks/useGameEngine.ts:79-99` — `handleKeypress` nhận `isMilestone` nhưng bỏ qua
- `typing-adventure/apps/web/src/stores/game-store.ts:56-74` — gọi `processKeypress` + `isComboMilestone` (không đổi)
- `typing-adventure/packages/game-engine/src/scoring.ts:5,32-37` — `COMBO_MILESTONES`; `calculateStars` trả 1–3 (không bao giờ 0)
- `typing-adventure/apps/web/src/components/game/StatsBar.tsx:46-54` — icon emoji
- `typing-adventure/apps/web/src/components/game/WordDisplay.tsx:99-110,136` — combo `x{n}`, mạng ❤️🖤, ✏️
- `typing-adventure/apps/web/src/components/game/CelebrationModal.tsx:32-42,53-56,71,112` — emoji kết quả, sao chuỗi, 🎮🔥❤️
- `typing-adventure/apps/web/src/components/layout/SideNav.tsx:12-17,109-169` — `<select>` mode/lesson/level; `:90-93` 🦉 ✕
- `typing-adventure/apps/web/src/components/age/AgePicker.tsx:8-12,26-38` — emoji thẻ tuổi, cờ, 🦉
- `typing-adventure/apps/web/src/components/little/Mascot.tsx:5,16-17` — `MascotMood` 4 giá trị, 🦉/💤; dùng ở `LittleHome:65`, `LittlePlay:195`, `LittleEnd:55`, `BalloonGame:139,168`, `PictureGame:169,177,215`
- `typing-adventure/apps/web/src/components/ui/TopBar.tsx:4-17` — `back.icon?: string`, mặc định 🏠/⬅️
- `typing-adventure/apps/web/src/components/ui/LoadingScreen.tsx:1-14` — server-compatible, `icon='🦉'`; caller truyền `icon="🏁"`/`"🎈"` (giữ)
- `typing-adventure/apps/web/src/components/games/Stars.tsx:5-13`, `GamesHub.tsx:15-18,36,53` — sao ký tự, emoji game
- `typing-adventure/packages/i18n/src/index.ts:7-9` — `TranslationKey = keyof typeof vi`; `Record<Lang, Record<TranslationKey,string>>` nên thiếu key ở `en.ts` là lỗi typecheck
- `typing-adventure/apps/web/src/stores/settings-store.ts:152-156` — persist `typingAdventure_settings`, `version: 1` (e2e seed theo format này)
- `typing-adventure/apps/web/vitest.config.ts:8-12` — env node, chỉ `*.test.ts`
- `typing-adventure/apps/web/playwright.config.ts:19-25` — webServer `pnpm dev:ws`, cần `PORT`
- `scripts/ci/check-tdd-commits.sh:17-22,30` — commit `feat:` không được đụng `__tests__/`, `*.test.ts(x)`, `e2e/*.spec.ts`
- `scripts/ci/guard-diff.sh:53-63` — `vitest.config.ts`/`playwright.config.ts` không bị bảo vệ; `package.json` chỉ bị bảo vệ khi đổi `scripts` (thêm devDependency thì không)
- Test mẫu để bắt chước: `typing-adventure/apps/web/src/lib/__tests__/security-headers.test.ts` (Vitest node), `typing-adventure/apps/web/e2e/smoke.spec.ts` (Playwright)

## File thay đổi
Hạ tầng test
- `typing-adventure/apps/web/vitest.config.ts` (sửa) — include `*.test.{ts,tsx}`, `esbuild.jsx: 'automatic'`
- `typing-adventure/apps/web/playwright.config.ts` (sửa) — `webServer.command` lấy từ `E2E_SERVER_CMD` (mặc định `pnpm dev:ws`) để đo KR-15 trên production build
- `typing-adventure/apps/web/package.json` (sửa) — devDependency `@axe-core/playwright` (không đổi `scripts`)
- `typing-adventure/pnpm-lock.yaml` (sửa)
- `typing-adventure/apps/web/e2e/helpers/kr.ts` (thêm) — seed localStorage, đọc văn bản cần gõ, đo animation/scroll/tap

i18n
- `typing-adventure/packages/i18n/src/vi.ts` (sửa) — 9 key mới
- `typing-adventure/packages/i18n/src/en.ts` (sửa) — 9 key mới

Style
- `typing-adventure/apps/web/src/styles/tokens.css` (thêm) — `--kr-*` 3 theme, clay, motion token
- `typing-adventure/apps/web/src/styles/motion.css` (thêm) — keyframes, `.kr-enter`, `.kr-loop`, reduced-motion toàn cục, pause khi `data-playing`
- `typing-adventure/apps/web/src/styles/decor.css` (thêm) — `SceneBackdrop` theo theme/breakpoint, combo burst, confetti, choice cards
- `typing-adventure/apps/web/src/styles/globals.css` (sửa) — import, alias token cũ → `--kr-*`, font token, body bỏ `background-attachment: fixed`
- `typing-adventure/apps/web/src/styles/ui.css` (sửa) — clay cho `.ui-btn/.ui-chip/.ui-card/.ui-modal/.ui-select/.ui-overlay`, press, focus ring, 44px, on-color token
- `typing-adventure/apps/web/src/styles/game.css` (sửa) — TopBar/StatsBar/WordDisplay/Keyboard/SideNav/Celebration style, bỏ `celebration-emoji`
- `typing-adventure/apps/web/src/styles/little.css` (sửa) — mascot SVG, `age-card`, clay chip/card
- `typing-adventure/apps/web/src/styles/little-world.css` (sửa) — games hub, `games-star`
- `typing-adventure/apps/web/src/styles/auth.css` (sửa) — chỉ thay màu cứng bằng token nếu lỗi tương phản
- `typing-adventure/apps/web/src/styles/social.css` (sửa) — như trên
- `typing-adventure/apps/web/src/styles/multiplayer.css` (sửa) — như trên, không thêm animation lên race
- `typing-adventure/apps/web/src/app/layout.tsx` (sửa) — Baloo_2 variable

Minh hoạ tĩnh (SVG tối ưu, không `<script>`, không href ngoài)
- `typing-adventure/apps/web/public/illustrations/scene-day-top.svg` (thêm)
- `typing-adventure/apps/web/public/illustrations/scene-day-bottom.svg` (thêm)
- `typing-adventure/apps/web/public/illustrations/scene-candy-top.svg` (thêm)
- `typing-adventure/apps/web/public/illustrations/scene-candy-bottom.svg` (thêm)
- `typing-adventure/apps/web/public/illustrations/scene-night-top.svg` (thêm)
- `typing-adventure/apps/web/public/illustrations/scene-night-bottom.svg` (thêm)
- `typing-adventure/apps/web/public/illustrations/age-little.svg` (thêm)
- `typing-adventure/apps/web/public/illustrations/age-kid.svg` (thêm)
- `typing-adventure/apps/web/public/illustrations/age-big.svg` (thêm)
- `typing-adventure/apps/web/public/illustrations/game-balloon.svg` (thêm)
- `typing-adventure/apps/web/public/illustrations/game-picture.svg` (thêm)
- `typing-adventure/apps/web/public/illustrations/result-clock.svg` (thêm)

Logic thuần (lib)
- `typing-adventure/apps/web/src/lib/kr/plain-label.ts` (thêm) — bỏ cụm ký hiệu đầu chuỗi (DQ1)
- `typing-adventure/apps/web/src/lib/kr/reduced-motion.ts` (thêm) — `createReducedMotionSource(matchMedia)` cho `useSyncExternalStore`
- `typing-adventure/apps/web/src/lib/kr/combo-celebration.ts` (thêm) — reducer mốc combo
- `typing-adventure/apps/web/src/lib/kr/choice-nav.ts` (thêm) — phím → index (roving radio)
- `typing-adventure/apps/web/src/lib/kr/result-celebration.ts` (thêm) — mood cú, showClock, showConfetti theo kết quả
- `typing-adventure/apps/web/src/lib/kr/confetti.ts` (thêm) — sinh 24 mảnh có seed, ràng buộc thời gian
- `typing-adventure/apps/web/src/lib/game-input.ts` (thêm) — `shouldCaptureSpace` (DQ2)

Hook / store
- `typing-adventure/apps/web/src/hooks/usePrefersReducedMotion.ts` (thêm)
- `typing-adventure/apps/web/src/stores/combo-celebration-store.ts` (thêm)
- `typing-adventure/apps/web/src/hooks/useGameEngine.ts` (sửa) — gọi `celebrate`/`clear`, không đổi giá trị trả về cũ

Component
- `typing-adventure/apps/web/src/components/ui/icons/icons.ts` (thêm)
- `typing-adventure/apps/web/src/components/ui/icons/Icon.tsx` (thêm)
- `typing-adventure/apps/web/src/components/mascot/OwlMascot.tsx` (thêm)
- `typing-adventure/apps/web/src/components/decor/SceneBackdrop.tsx` (thêm)
- `typing-adventure/apps/web/src/components/game/ComboBurst.tsx` (thêm)
- `typing-adventure/apps/web/src/components/game/ComboAnnouncer.tsx` (thêm)
- `typing-adventure/apps/web/src/components/game/GameOwl.tsx` (thêm)
- `typing-adventure/apps/web/src/components/ui/ChoiceCards.tsx` (thêm)
- `typing-adventure/apps/web/src/components/ui/Confetti.tsx` (thêm)
- `typing-adventure/apps/web/src/components/ui/TopBar.tsx` (sửa) — `back.icon?: ReactNode`, mặc định `Icon home/arrowLeft`
- `typing-adventure/apps/web/src/components/ui/LoadingScreen.tsx` (sửa) — `icon?: ReactNode`, mặc định `OwlMascot thinking`, `loadingText` sr-only khi không có label
- `typing-adventure/apps/web/src/components/little/Mascot.tsx` (sửa) — render `OwlMascot`, mở rộng `MascotMood`
- `typing-adventure/apps/web/src/components/age/AgePicker.tsx` (sửa)
- `typing-adventure/apps/web/src/components/game/GameEngine.tsx` (sửa)
- `typing-adventure/apps/web/src/components/game/StatsBar.tsx` (sửa)
- `typing-adventure/apps/web/src/components/game/WordDisplay.tsx` (sửa)
- `typing-adventure/apps/web/src/components/game/CelebrationModal.tsx` (sửa)
- `typing-adventure/apps/web/src/components/layout/SideNav.tsx` (sửa)
- `typing-adventure/apps/web/src/components/games/Stars.tsx` (sửa)
- `typing-adventure/apps/web/src/components/games/GamesHub.tsx` (sửa)

Test unit (Vitest)
- `typing-adventure/apps/web/src/lib/__tests__/kr-i18n.test.ts` (thêm)
- `typing-adventure/apps/web/src/styles/__tests__/kr-tokens.test.ts` (thêm)
- `typing-adventure/apps/web/src/styles/__tests__/kr-clay.test.ts` (thêm)
- `typing-adventure/apps/web/src/styles/__tests__/kr-motion.test.ts` (thêm)
- `typing-adventure/apps/web/src/lib/__tests__/kr-assets.test.ts` (thêm)
- `typing-adventure/apps/web/src/lib/__tests__/reduced-motion.test.ts` (thêm)
- `typing-adventure/apps/web/src/components/ui/icons/__tests__/Icon.test.tsx` (thêm)
- `typing-adventure/apps/web/src/components/mascot/__tests__/OwlMascot.test.tsx` (thêm)
- `typing-adventure/apps/web/src/components/__tests__/kr-shared-ui.test.tsx` (thêm)
- `typing-adventure/apps/web/src/components/age/__tests__/AgePicker.test.tsx` (thêm)
- `typing-adventure/apps/web/src/components/game/__tests__/game-chrome.test.tsx` (thêm)
- `typing-adventure/apps/web/src/lib/__tests__/game-input.test.ts` (thêm)
- `typing-adventure/apps/web/src/lib/__tests__/combo-celebration.test.ts` (thêm)
- `typing-adventure/apps/web/src/stores/__tests__/game-store-parity.test.ts` (thêm)
- `typing-adventure/apps/web/src/components/game/__tests__/ComboBurst.test.tsx` (thêm)
- `typing-adventure/apps/web/src/lib/__tests__/choice-nav.test.ts` (thêm)
- `typing-adventure/apps/web/src/lib/__tests__/plain-label.test.ts` (thêm)
- `typing-adventure/apps/web/src/components/ui/__tests__/ChoiceCards.test.tsx` (thêm)
- `typing-adventure/apps/web/src/lib/__tests__/result-celebration.test.ts` (thêm)
- `typing-adventure/apps/web/src/components/game/__tests__/CelebrationModal.test.tsx` (thêm)
- `typing-adventure/apps/web/src/components/games/__tests__/games-ui.test.tsx` (thêm)

Test e2e (Playwright)
- `typing-adventure/apps/web/e2e/kr-agepicker.spec.ts` (thêm)
- `typing-adventure/apps/web/e2e/kr-game.spec.ts` (thêm)
- `typing-adventure/apps/web/e2e/kr-sidenav.spec.ts` (thêm)
- `typing-adventure/apps/web/e2e/kr-result.spec.ts` (thêm)
- `typing-adventure/apps/web/e2e/kr-games-hub.spec.ts` (thêm)
- `typing-adventure/apps/web/e2e/kr-motion.spec.ts` (thêm)
- `typing-adventure/apps/web/e2e/kr-perf.spec.ts` (thêm)
- `typing-adventure/apps/web/e2e/kr-layout.spec.ts` (thêm)

Tài liệu
- `docs/features/kid-friendly-ui-redesign/**`

## Thay đổi DB
Không. `packages/db/prisma` không đổi, không migration, không seed.

## Thay đổi API / contract
| Method + route | Auth | Request (Zod) | Response `{success,data|error}` | Status lỗi |
|---|---|---|---|---|
| không | — | — | — | — |

- Socket.IO: không đổi. `packages/game-engine`: không đổi file nào.
- localStorage: không key mới. `typingAdventure_settings` và cấu trúc giữ nguyên. Store combo mới **không** persist.
- i18n, 9 key mới ở cả `vi.ts`/`en.ts`: `comboPraise5`, `comboPraise10`, `comboPraise20`, `comboPraise50`, `comboAnnounce` (`{0}` mốc, `{1}` lời khen), `starsLabel` (`{0}`), `livesLabel` (`{0}`), `gamesNew`, `loadingText`. **Không** đổi giá trị key cũ (DQ1).
- Prop component (nội bộ):
  - `TopBar.back.icon: string → ReactNode`
  - `LoadingScreen.icon: string → ReactNode`: caller cũ truyền chuỗi vẫn hợp lệ
  - `MascotMood` thêm `'cheer'|'encourage'|'sad'|'thinking'`
  - `Stars` thêm `size?`, `animate?`

## Rủi ro
| Rủi ro | Khả năng | Ảnh hưởng | Giảm thiểu |
|---|---|---|---|
| Alias `var()` tính tại phần tử khai báo, nên Little (`.little-root` khai báo lại token) hoặc dark không nhận màu mới | Cao | Sai màu cả loạt màn KR-13 | Khối alias đặt cùng danh sách selector với nơi khai báo `--kr-*` (gồm `.little-root:not(.games-root)`). `kr-tokens.test.ts` kiểm danh sách selector. e2e đổi theme kiểm `getComputedStyle` |
| Màu chữ cứng `#fff`/`#3b3355` trong `ui.css`/`game.css` trên nền alias mới bị thiếu tương phản (ví dụ chữ trắng trên `--kr-primary` dark `#60A5FA` chỉ ≈2.5:1; chữ trắng trên `--kr-success` dark) | Cao | Vi phạm KR-17 | Dùng token `--kr-on-*` (thêm `--kr-on-success`). `kr-clay.test.ts` cấm `color: #fff` trong các khối `.ui-btn--*`. axe e2e chạy trên 3 theme |
| Hiệu ứng làm chậm hoặc mất phím trên máy yếu (KR-15) | Trung bình | Kết quả luyện tập sai | Burst chỉ set store 1 lần mỗi mốc. Chỉ animate `transform`/`opacity`. Không `backdrop-filter` mới. Bỏ `background-attachment: fixed`. `GameEngine` không subscribe store combo. `kr-perf.spec.ts` throttle CPU 4x |
| Đo long task ở `next dev` (Playwright mặc định chạy `pnpm dev:ws`) cho số liệu nhiễu, test dễ chập chờn | Cao | KR-15 flaky | Luôn assert đúng/đủ phím. Assert long task ≤ 100ms chỉ khi `KR_PERF=1` với `E2E_SERVER_CMD="pnpm build && pnpm start:ws"` (QC chạy, ghi vào `04-qc-report.md`) |
| CLS do font và ảnh | Trung bình | Trải nghiệm giật | next/font `adjustFontFallback` mặc định. `<img>` có `width`/`height`. Cảnh là lớp `position: fixed` không chiếm layout |
| Ngân sách First Load JS `/` +20 KB (icon + cú + component mới) | Trung bình | Vi phạm KR-16 | Icon là path string trong 1 map. Cú vẽ thân chung + nhóm theo mood. Minh hoạ lớn để ở `public/`. Đo `next build` trên `main` và nhánh, ghi vào QC report. Vượt ngân sách thì tách `Confetti`/`ComboBurst` bằng `next/dynamic` |
| CSP chặn tài nguyên | Thấp | Ảnh/font hỏng | Mọi tài sản cùng origin. Font next/font tự host. `kr-assets.test.ts` cấm `http(s)://` ngoài namespace `xmlns`. `kr-layout.spec.ts` lắng nghe console lỗi CSP và request khác origin |
| Test component SSR: Zustand v5 trả `getInitialState()` khi render server, nên `setState` trước khi render không có tác dụng | Cao | Test sai hoặc không kiểm được nhánh theo store | Component test chỉ kiểm nhánh theo props. Nhánh theo store (tuổi, lang) kiểm qua hàm thuần hoặc e2e |
| Cấu hình JSX của Vitest (`jsx: preserve`) làm `.tsx` lỗi "React is not defined" | Trung bình | T0 đỏ | `esbuild: { jsx: 'automatic' }` trong `vitest.config.ts`. T0 có test smoke render 1 component có sẵn (`LoadingScreen`) để chứng minh |
| Reduced-motion toàn cục `.01ms` làm `animationend` bắn ngay | Thấp | Hành vi lệch | Grep: hiện không có `onAnimationEnd`/`animationend`. Timer combo/confetti dùng `setTimeout` chứ không dựa vào sự kiện animation |
| Space fix đổi hành vi ngoài SideNav | Thấp | Trẻ gõ Space không vào ván | Phạm vi hẹp (`navOpen` hoặc target trong `.side-nav`). Unit test giữ case "focus trên nút TopBar → vẫn capture" |
| Confetti khi thua: engine luôn trả `stars ≥ 1` (`scoring.ts:32-37`), nên hết mạng ở challenge vẫn có sao. E3 ("stars=0, ví dụ hết mạng") không xảy ra với engine hiện tại | Chắc chắn | Lệch kỳ vọng BA | Giả định: `showConfetti = stars ≥ 1 && !(challenge && lives ≤ 0)`, cú `encourage`. Hỏi người dùng (câu hỏi 1) |
| Admin nhận clay qua `.ui-*` | Trung bình | Lệch giao diện admin | DQ4 chấp nhận. Kiểm tay `/admin/dashboard`, `/admin/users` ở 1024px, không cuộn ngang, không chữ mất tương phản |
| Thêm devDependency `@axe-core/playwright` | — | Lockfile đổi | Chỉ dev, không vào bundle, không đổi `scripts`, nên guard-diff không đòi label. Không cài được thì KR-17 dựa vào unit test tương phản token cộng kiểm tay |

## Tasks
Quy ước cho **mọi** task:
- Commit 1 là `test(KR): …`: chỉ thêm hoặc sửa file test (và helper e2e nếu cần). Test phải **đỏ**, mỗi test trích ID AC trong tên `it('KR-09 …')`.
- Commit 2 là `feat(KR): …` (hoặc `style(KR)`/`chore(KR)`): **không** đụng `__tests__/`, `*.test.ts(x)`, `e2e/*.spec.ts` (`scripts/ci/check-tdd-commits.sh`).
- Sau commit 2 thì `pnpm test` + `pnpm typecheck` xanh.
- e2e không chạy trong CI, nên được phép đỏ đến task của nó. DEV chạy e2e liên quan trước khi đóng task.
- File `.svg` không tính vào giới hạn ~150 dòng diff.
- Không thêm comment vào code.

### T0 · Hạ tầng test — AC: (nền cho mọi AC)
- Test (viết trước, phải đỏ): `typing-adventure/apps/web/src/components/__tests__/kr-shared-ui.test.tsx`: case `render harness` dùng `renderToStaticMarkup(<LoadingScreen label="x" />)` chứa `role="status"`. Đỏ vì `.tsx` chưa được include.
- Code (`chore(KR): …`):
  - `vitest.config.ts`: include `src/**/__tests__/**/*.test.{ts,tsx}`, `esbuild: { jsx: 'automatic' }`
  - `playwright.config.ts`: `command: process.env.E2E_SERVER_CMD ?? 'pnpm dev:ws'`
  - `pnpm --filter @typing-adventure/web add -D @axe-core/playwright`
  - thêm `e2e/helpers/kr.ts`:
    - `seedSettings(page, partialState)`: `addInitScript` ghi `{state, version:1}`
    - `textToType(page)`: ghép `.word-display .char`, ` ` → space
    - `runningAnimations(page)`
    - `noHorizontalScroll(page)`
    - `tapTargetsUnder44(page, selector)`
- Verify: `cd typing-adventure && pnpm --filter @typing-adventure/web test && pnpm typecheck`
- Skill: không

### T1 · Chuỗi i18n mới — AC: KR-22 (phục vụ KR-09, KR-10, KR-04)
- Test: `apps/web/src/lib/__tests__/kr-i18n.test.ts`:
  - KR-22: 9 key tồn tại, không rỗng ở cả `vi` và `en`
  - với mỗi `COMBO_MILESTONES` có `comboPraise{n}`
  - `tReplace(…'comboAnnounce', 10, 'x')` thay đủ `{0}`/`{1}`
  - `starsLabel`/`livesLabel` chứa `{0}`
  - vi `comboPraise10` có dấu (`/[À-ỹ]/`)
  - 8 key `mode*`/`lv*`/`lessonAll` **giữ nguyên** giá trị hiện tại (DQ1, KR-13)
- Code: `packages/i18n/src/vi.ts`, `en.ts`: thêm 9 key theo bảng ở 02-design (không đổi 8 key cũ).
- Verify: `pnpm --filter @typing-adventure/web exec vitest run kr-i18n && pnpm typecheck`
- Skill: không

### T2 · Token màu, alias, font — AC: KR-01, KR-02, KR-03, KR-17
- Test: `apps/web/src/styles/__tests__/kr-tokens.test.ts`. Dùng `fs` đọc `tokens.css`/`globals.css`, parse khối selector bằng regex đơn giản.
  - KR-01: light `--kr-bg #EFF6FF`, `--kr-card #FFFFFF`, `--kr-fg #0F172A`, `--kr-fg-muted #475569`, `--kr-primary #2563EB`, `--kr-play #F59E0B`, `--kr-fun #EC4899`, `--kr-danger #DC2626`.
  - KR-02: `colorful` và `dark` định nghĩa đủ mọi token màu mà light có.
  - KR-17: hàm WCAG luminance tự viết trong file test. Kiểm các cặp theo từng theme: fg/card, fg/bg, fg-muted/card, fg-muted/bg, fg-muted/card-soft ≥ 4.5; on-primary/primary, on-play/play, on-fun/fun, on-danger/danger, on-success/success ≥ 4.5; success/card, danger/card ≥ 4.5; ring/bg ≥ 3.
  - KR-03: `--font-ui` không chứa `Comic Sans`/`Nunito`, có `var(--font-kid)`.
  - Alias: selector khối alias có `.little-root:not(.games-root)`. `body` không còn `background-attachment: fixed`.
- Code:
  - `styles/tokens.css` (mới): token màu, clay (`--kr-shadow-*`, `--kr-border-w`), radius, motion, `--kr-on-success`.
  - `globals.css`: `@import './tokens.css'` đứng đầu (trước các import khác). Alias token cũ (`--ink: var(--kr-fg)`, `--ink-dim: var(--kr-fg-muted)`, `--surface: var(--kr-card)`, `--surface-2: var(--kr-card-soft)`, `--surface-edge: var(--kr-drop)`, `--line: var(--kr-edge)`, `--berry/-deep: var(--kr-primary/-deep)`, `--sun/-deep: var(--kr-play/-deep)`, `--coral: var(--kr-danger)`, `--leaf: var(--kr-success)`, `--overlay: var(--kr-overlay)`, `--color-*`, `--key-*`). `--scene: var(--kr-bg)`. Xoá giá trị cứng trong khối dark. Font token.
  - `app/layout.tsx`: `Baloo_2({ subsets: ['latin','vietnamese'], variable: '--font-kid', display: 'swap' })` (bỏ `weight`, dùng variable).
- Verify: `pnpm --filter @typing-adventure/web exec vitest run kr-tokens && pnpm typecheck && pnpm build`
- Skill: không

### T3 · Clay cho thành phần dùng chung, nhấn, focus, 44px — AC: KR-01, KR-08, KR-18, KR-19
- Test: `apps/web/src/styles/__tests__/kr-clay.test.ts` (đọc `ui.css`):
  - KR-01: `.ui-btn`, `.ui-chip`, `.ui-card`, `.ui-modal` có `border` dùng `var(--kr-border-w)` hoặc 3–4px, `border-radius` 16–32px hoặc pill, `box-shadow` dùng `--kr-shadow-*`.
  - KR-08: `:active` có `transform` translateY 2–4px hoặc scale .92–.97, `transition` ≤ 200ms. `:disabled` có `cursor: not-allowed` và `transform: none`. `.ui-btn`/`.ui-chip` có `cursor: pointer`.
  - KR-18: `:focus-visible` có `outline: 3px solid var(--kr-ring)` và `outline-offset` ≥ 3px.
  - KR-19: `.ui-btn--sm` `min-height` ≥ 44px.
  - KR-17: không còn `color: #fff`/`#3b3355` trong các khối `.ui-btn--*`.
- Code:
  - `styles/ui.css`: viền, bóng clay, press chung (`:active` và `.is-pressed`), `@media (hover:hover)` cho hover-lift, focus ring chung cho `a, button, select, input, [role=radio], [tabindex]`.
  - Giữ `.hidden-input` không bị outline (KR-18 "không đổi hành vi focus").
- Verify: `pnpm --filter @typing-adventure/web exec vitest run kr-clay && pnpm lint`
- Skill: không

### T4 · Motion system và reduced-motion — AC: KR-07, KR-14, KR-16
- Test:
  - `apps/web/src/styles/__tests__/kr-motion.test.ts`:
    - KR-14: `motion.css` có `@media (prefers-reduced-motion: reduce)` với `*, *::before, *::after` gồm `animation-duration: .01ms !important`, `animation-iteration-count: 1 !important`, `transition-duration: .01ms !important`.
    - KR-07: keyframes `kr-pop-in` chỉ dùng `opacity`/`transform`, khung cuối là `opacity: 1; transform: none`. `.kr-enter` dùng `animation-delay: calc(var(--i) * var(--kr-stagger))`, `--kr-stagger` trong 40–120ms, `--kr-dur-enter` trong 300–450ms, easing back-out.
    - KR-16: có rule `[data-playing="true"] .kr-loop` → `animation-play-state: paused`.
    - Không keyframes nào trong `motion.css` animate `width|height|top|left|margin`.
  - `apps/web/src/lib/__tests__/reduced-motion.test.ts`: dùng `matchMedia` giả.
    - KR-14: `getSnapshot` trả `matches`.
    - E4: bắn `change` thì gọi callback và snapshot mới.
    - `unsubscribe` gỡ listener.
    - Không có `matchMedia` (SSR) thì trả `false`.
- Code: `styles/motion.css` (mới, import trong `globals.css`), `lib/kr/reduced-motion.ts`, `hooks/usePrefersReducedMotion.ts`. Xoá `celebration-emoji` loop `bounce infinite` khỏi `game.css:919-938` khi T13 thay emoji (ở T4 chỉ thêm, chưa xoá).
- Verify: `pnpm --filter @typing-adventure/web exec vitest run kr-motion reduced-motion`
- Skill: không

### T5 · Icon SVG và OwlMascot — AC: KR-04, KR-05
- Test:
  - `apps/web/src/components/ui/icons/__tests__/Icon.test.tsx`:
    - KR-05: mọi `IconName` trong `ICONS` render `<svg` có `aria-hidden="true"`, `focusable="false"`, `stroke="currentColor"` hoặc `fill="currentColor"`.
    - Có `title` thì không `aria-hidden` và có `<title>`.
    - Có đủ tên: `menu, close, logout, restart, soundOn, soundOff, home, arrowLeft, globe, clock, bolt, rocket, target, coin, crown, flame, heart, heartOutline, pencil, keyCap, book, stopwatch, shield, arrowUp, arrowDown, arrowsUpDown, rainbow, hillSmall, hillDouble, mountainFlag, check, gamepad, sparkle, star`.
    - Không chuỗi nào trong markup khớp `\p{Extended_Pictographic}`.
  - `apps/web/src/components/mascot/__tests__/OwlMascot.test.tsx`:
    - KR-04: mỗi mood trong `idle, wave, happy, cheer, encourage, sad, thinking, sleep` render `<svg` có `aria-hidden="true"`, `data-mood=<mood>`, không có `🦉`.
    - `still` thêm class `owl--still`. Mood idle/sleep có class `kr-loop` trên nhóm loop.
    - `size` sm/md/lg → `width` 40/96/140.
- Code: `components/ui/icons/icons.ts`, `Icon.tsx`, `components/mascot/OwlMascot.tsx` (không hook, không `'use client'`), keyframes `owl-*` trong `motion.css`.
- Verify: `pnpm --filter @typing-adventure/web exec vitest run Icon OwlMascot && pnpm typecheck`
- Skill: không

### T6 · Minh hoạ tĩnh và SceneBackdrop — AC: KR-06, KR-16, KR-02
- Test:
  - `apps/web/src/lib/__tests__/kr-assets.test.ts`:
    - KR-16: 12 file trong `public/illustrations/` tồn tại. Mỗi `scene-*` ≤ 18 KB, `age-*`/`game-*` ≤ 8 KB, `result-clock` ≤ 6 KB. Tổng (`scene-day-top` + `scene-day-bottom` + 3 `age-*`) ≤ 200 KB.
    - Không có `<script`, `on\w+=`, `href="http`/`xlink:href="http`.
    - Chỉ `http://www.w3.org` trong `xmlns`.
  - Trong `kr-shared-ui.test.tsx`, KR-06: `SceneBackdrop` render các `div` `aria-hidden="true"`, class `kr-scene kr-scene--<variant>`, không phần tử focusable (`tabindex`, `button`, `a`).
  - `decor.css` (đọc bằng fs) có `pointer-events: none` cho `.kr-scene`, có ảnh theo `[data-theme="dark"]`/`[data-theme="colorful"]` (KR-02), và `@media (max-width: 767px)` ẩn lớp top.
- Code: 12 SVG, `components/decor/SceneBackdrop.tsx`, `styles/decor.css` (phần scene, `cloud-drift`/`twinkle` gắn class `kr-loop`).
- Verify: `pnpm --filter @typing-adventure/web exec vitest run kr-assets kr-shared-ui`
- Skill: không

### T7 · Thành phần dùng chung: Mascot Little, LoadingScreen, TopBar — AC: KR-04, KR-05, KR-13
- Test: `apps/web/src/components/__tests__/kr-shared-ui.test.tsx` (bổ sung):
  - KR-04: `Mascot` với mọi mood render `data-mood`, không có `🦉`/`💤`, có children thì bong bóng giữ `role="status"`.
  - KR-05: `LoadingScreen` mặc định chứa `<svg`, không có `🦉`, có `role="status"`. `LoadingScreen icon="🏁"` vẫn hiện `🏁` (caller cũ).
  - KR-05: `TopBar back={{href:'/',label:'Home'}}` render `<svg` trong link, `aria-label="Home"`, không có `🏠`.
- Code: `little/Mascot.tsx`, `ui/LoadingScreen.tsx`, `ui/TopBar.tsx`, `little.css` (cỡ `.little-mascot` cho SVG, bỏ `.little-zzz` emoji).
- Verify: `pnpm --filter @typing-adventure/web exec vitest run kr-shared-ui && pnpm typecheck`
- Skill: không

### T8 · AgePicker — AC: KR-12, KR-04, KR-05, KR-06, KR-07
- Test:
  - `apps/web/src/components/age/__tests__/AgePicker.test.tsx`:
    - KR-12: 3 `<button` thẻ tuổi, mỗi thẻ có `<img src="/illustrations/age-{little|kid|big}.svg" alt=""` với `width`/`height`.
    - Có `data-mood="wave"`.
    - Không còn `🐣🐥🦅🦉🇬🇧🇻🇳`.
    - Bong bóng `role="status"`.
    - Các khối có `kr-enter` với `--i` 0..6.
  - `apps/web/e2e/kr-agepicker.spec.ts`:
    - KR-12: seed rỗng → bấm thẻ "6–8" → `localStorage.typingAdventure_settings.state.ageGroup === 'kid'` và thấy `.ta-screen`. Bấm thẻ 3–5 → thấy `.little-root` của LittleMode.
    - Nút ngôn ngữ đổi chữ.
    - KR-07: sau 1000ms mọi `.kr-enter` có `opacity === '1'` và `transform === 'none'`.
    - KR-06 (≥768): có `.kr-scene` với `pointer-events: none`.
- Code: `age/AgePicker.tsx`, `little.css` (`.age-card` clay, mobile dọc), thêm `SceneBackdrop variant="picker"`.
- Verify: `pnpm --filter @typing-adventure/web exec vitest run AgePicker`, rồi `set -a && . ../.wt-env && set +a && pnpm --filter @typing-adventure/web exec playwright test kr-agepicker`
- Skill: không

### T9 · Khung màn chơi: TopBar, StatsBar, WordDisplay, cảnh, data-playing — AC: KR-05, KR-06, KR-07, KR-16, KR-01
- Test:
  - `apps/web/src/components/game/__tests__/game-chrome.test.tsx`. Props `gameState` lấy từ `createInitialState('challenge','easy',5)` với `combo: 7, lives: 2`.
    - KR-05: `StatsBar` không có `⏳⚡🚀🎯💰👑🔥`, số `<svg` bằng số thẻ.
    - `WordDisplay`: combo pill có `<svg` + `x7`. Mạng: 2 icon heart đầy + 1 viền trong phần tử có `aria-label` (theo `livesLabel`), không có `❤️🖤`. Nút tự nhập có `<svg`, không `✏️`.
  - `apps/web/e2e/kr-game.spec.ts` (seed `ageGroup:'kid'`):
    - KR-05: 4 nút TopBar giữ `aria-label` (`navMenu`/`tipRestart`/`tipSound` theo vi). Nút âm thanh đổi `aria-pressed` và đổi icon (`data-icon` soundOn/soundOff). Không còn `🦉` trong `h1`. Title trang vẫn chứa "Typing Adventure".
    - KR-06: click toạ độ một phần tử `.kr-scene` (vùng lề) → `document.activeElement` là `.hidden-input`.
    - KR-16: `.ta-screen[data-playing]` là `false` trước khi gõ, `true` sau phím đầu, `false` khi xong. Khi `true`, mọi `.kr-loop` có `animationPlayState === 'paused'`.
- Code:
  - `GameEngine.tsx`: icon SVG, `title={<><GameOwl/> Typing Adventure</>}`, `data-playing`, `<SceneBackdrop variant="game"/>` trong `.ta-screen`, `kr-enter` cho 5 khối.
  - `StatsBar.tsx`, `WordDisplay.tsx`, `game.css` (char state có gạch chân, `.char` `padding-top:.12em` + `transform-origin: 50% 100%` cho E14, keyboard key on-colors).
  - `GameOwl.tsx` bản đầu chỉ `idle`/`still`.
- Verify: `pnpm --filter @typing-adventure/web exec vitest run game-chrome && pnpm typecheck`, rồi `playwright test kr-game`
- Skill: không

### T10 · Sửa Space khi SideNav mở (DQ2) — AC: KR-11 (tiền đề), KR-18, E13
- Test: `apps/web/src/lib/__tests__/game-input.test.ts` cho `shouldCaptureSpace({ key, panelOpen, navOpen, isFinished, targetInSideNav })`:
  - KR-11: `navOpen` → false.
  - `targetInSideNav` → false.
  - Panel mở → false.
  - `isFinished` → false.
  - Key khác `' '` → false.
  - KR-21: trường hợp thường (focus input ẩn hoặc nút TopBar, nav đóng) → true.
- Code:
  - `lib/game-input.ts`.
  - `GameEngine.tsx` handleKeydown dùng predicate. Thêm `navOpen` vào deps. `closeNav` gọi `setNavOpen(false)` rồi `focusInput()`.
  - `SideNav.tsx` focus nút Đóng khi `open` chuyển sang true.
- Verify: `pnpm --filter @typing-adventure/web exec vitest run game-input`
- Skill: không

### T11 · Ăn mừng mốc combo — AC: KR-09, KR-15, KR-21, E1, E2
- Test:
  - `apps/web/src/lib/__tests__/combo-celebration.test.ts`, reducer `nextCelebration(prev, event)`:
    - KR-09: `{type:'hit', combo:5}` → `{value:5,id:1}`. Mốc 10 khi đang hiện 5 → thay ngay, `id` tăng (E1).
    - `{type:'clear', id}` chỉ xoá khi trùng id. Miss không đổi state (không kéo dài).
    - `{type:'finish'}` → null (E2).
    - Về 0 rồi hit 5 lại → `id` mới.
    - `praiseKey(10) === 'comboPraise10'`.
    - Hằng `COMBO_BURST_MS ≤ 1500`.
  - `apps/web/src/stores/__tests__/game-store-parity.test.ts`:
    - KR-21: gõ cùng chuỗi phím (có sai) qua `useGameStore.getState().handleKeypress`, và song song gõ qua `processKeypress` của engine. `gameState.score/combo/maxCombo/correctKeystrokes/totalKeystrokes/mistakeMap` trùng nhau.
    - `isMilestone` true đúng ở combo 5, 10.
  - `apps/web/src/components/game/__tests__/ComboBurst.test.tsx`:
    - KR-09: props `milestone={value:10,id:3}`, `lang='vi'`, `reducedMotion=false` → chứa `x10`, `Siêu quá!`, class `combo-burst` và `aria-hidden="true"`, 8 phần tử `.combo-spark`.
    - `reducedMotion=true` → 0 spark nhưng vẫn có nhãn (KR-14).
    - `milestone=null` → rỗng.
    - `ComboAnnouncer` luôn render `aria-live="polite"` + `sr-only`.
  - `apps/web/e2e/kr-game.spec.ts` (bổ sung):
    - KR-09: gõ đúng 5 ký tự → `.combo-burst` hiện chữ `x5`, live region chứa lời khen, `activeElement` vẫn là input ẩn, `pointer-events: none`. Sau 1500ms không còn `.combo-burst`.
    - `GameOwl` `data-mood="happy"` trong lúc burst.
- Code:
  - `lib/kr/combo-celebration.ts`, `stores/combo-celebration-store.ts`.
  - `useGameEngine.ts`: sau `gameStore.handleKeypress`, nếu `isMilestone` thì `celebrate(newCombo)` (đọc `useGameStore.getState().gameState.combo`). Nếu ván kết thúc thì `finish()`. `resetGame`/`startGame` gọi qua effect trên `gameState.startTime === null` → `clear`.
  - `ComboBurst.tsx` (subscribe selector, `setTimeout` theo `id`), `ComboAnnouncer.tsx`, `GameOwl.tsx` (mood theo store, `still` theo `isPlaying`).
  - `GameEngine.tsx` mount ComboBurst trong khu vực `.word-display-section` qua `WordDisplay` slot hoặc wrapper `position: relative`.
  - `decor.css` keyframes `combo-pop/out/spark`, `z-index: 5`.
- Verify: `pnpm --filter @typing-adventure/web exec vitest run combo-celebration game-store-parity ComboBurst`, rồi `playwright test kr-game`
- Skill: không

### T12 · ChoiceCards và SideNav — AC: KR-11, KR-05, KR-08, KR-19
- Test:
  - `apps/web/src/lib/__tests__/plain-label.test.ts`:
    - KR-11: `plainLabel('🎮 Cổ điển') === 'Cổ điển'`, `'🌈 All' → 'All'`.
    - Chuỗi không có ký hiệu đầu thì giữ nguyên (`'Home Row'`).
    - Không cắt chữ có dấu đầu (`'Ếch'`).
  - `apps/web/src/lib/__tests__/choice-nav.test.ts`:
    - KR-11: `nextIndex(key, current, count)`: ArrowRight/Down +1 vòng, ArrowLeft/Up −1 vòng, Home 0, End count−1, phím khác null.
    - `allowedModes('kid')` = classic, lesson. `allowedModes('big')` = 4 mode (dùng `isModeAllowed`).
  - `apps/web/src/components/ui/__tests__/ChoiceCards.test.tsx`:
    - KR-11: `role="radiogroup"` + `aria-labelledby`. Mỗi option `role="radio"`, đúng 1 cái `aria-checked="true"` với `tabindex="0"`, còn lại `tabindex="-1"`.
    - Thẻ chọn có phần tử `.choice-check` chứa `<svg`. Mỗi thẻ có icon `<svg`.
  - `apps/web/e2e/kr-sidenav.spec.ts` (seed `ageGroup:'big'`):
    - KR-11: mở menu → focus ở nút Đóng. Tab tới nhóm chế độ, ArrowRight → `aria-checked` chuyển sang "Bài học" và nhóm bài học xuất hiện. Tab vào nhóm bài, Space chọn "Tất cả".
    - Đóng nav: số `.char--correct` = 0 (Space không lọt vào ván), focus về input ẩn (E13).
    - Chọn cấp "Khó" → `localStorage…state.level === 'hard'`.
    - Seed `kid` → chỉ 2 thẻ chế độ.
    - KR-19: mọi thẻ ≥ 44×44 ở 375px.
- Code:
  - `lib/kr/plain-label.ts`, `lib/kr/choice-nav.ts`, `components/ui/ChoiceCards.tsx`.
  - `SideNav.tsx`: 3 nhóm thẻ thay 3 `<select>`, giữ 4 select. Tiêu đề dùng `OwlMascot sm`, nút đóng `Icon close`. Gọi `onModeChange`/`onLessonChange(i)`/`onLevelChange` y như cũ, chọn lại thẻ đang chọn thì no-op.
  - `decor.css` (choice cards, `check-pop`).
- Verify: `pnpm --filter @typing-adventure/web exec vitest run plain-label choice-nav ChoiceCards`, rồi `playwright test kr-sidenav`
- Skill: không

### T13 · Màn kết quả: Stars, Confetti, CelebrationModal — AC: KR-10, KR-04, KR-14, KR-21, E3, E12
- Test:
  - `apps/web/src/lib/__tests__/result-celebration.test.ts`:
    - KR-10: `resultCelebration({mode, lives, stars})`:
      - challenge & lives 0 → `{mood:'encourage', clock:false, confetti:false}` (giả định E3)
      - timeAttack & stars ≥ 1 → `happy` + clock + confetti
      - timeAttack & stars 0 → `thinking`, không confetti
      - stars 3 → `cheer`; 1–2 → `happy`; 0 → `encourage`, không confetti
    - `confettiPieces(24, seed)`: 24 mảnh, cùng seed thì cùng kết quả, mọi `delay ≤ 300`, `duration` trong 1600–2000, `delay + duration ≤ 2500`. `CONFETTI_LIFETIME_MS ≤ 2500`.
    - `starDelays(3) = [300, 520, 740]` (khoảng cách 150–300ms).
  - `apps/web/src/components/games/__tests__/games-ui.test.tsx`:
    - KR-10: `Stars n=2 size="lg" animate` → `role="img"`, `aria-label` theo `starsLabel`, 3 `<svg`, 2 có class `star--on`, 1 `star--off` (nét đứt).
    - `animate` gắn `animation-delay` theo `starDelays`.
  - `apps/web/src/components/game/__tests__/CelebrationModal.test.tsx` (store mặc định: lang vi, ageGroup null, nên showSpeed true):
    - KR-21/KR-10: với `result` cố định thì hiển thị đúng điểm `toLocaleString`, thời gian, CPS, WPM, `%`, `x{maxCombo}`.
    - mode lesson hiện tên bài. Challenge hiện mạng bằng svg heart + `aria-label`. timeAttack hiện `wordsCompleted` + `<img src="/illustrations/result-clock.svg" alt=""`.
    - Tiêu đề đúng `celExcellent`/`celOutOfLives`/`celTimeUp`. Nút Chơi lại luôn có. Thử cấp chỉ khi `stars===3 && level !== 'hard'`. Luyện phím yếu chỉ khi có lỗi.
    - KR-04: `data-mood` đúng theo `resultCelebration`, không có `🥳😵⏰★☆🎮🔥❤️`.
    - Dialog có `tabindex="-1"`.
  - `apps/web/e2e/kr-result.spec.ts`:
    - KR-10: gõ hết văn bản → modal mở, focus ở dialog (không phải nút Chơi lại). `.confetti-piece` xuất hiện rồi biến mất trước 2600ms.
    - `document.visibilityState` giả `hidden` (dispatch `visibilitychange` sau khi override) → confetti gỡ ngay (E12).
    - Bấm Chơi lại → ván mới.
    - KR-20: ở 375×667 modal cuộn dọc được.
- Code:
  - `lib/kr/result-celebration.ts`, `lib/kr/confetti.ts`, `components/ui/Confetti.tsx`, `games/Stars.tsx`.
  - `CelebrationModal.tsx`: mascot, clock, Stars lg animate, Confetti, icon `gamepad`/`flame`/`heart`, `tabIndex={-1}` + focus dialog khi mount, `kr-enter` theo thứ tự design.
  - `game.css`: xoá `.celebration-emoji`, thêm `record-shine`, `max-height: calc(100dvh - 24px)`.
- Verify: `pnpm --filter @typing-adventure/web exec vitest run result-celebration games-ui CelebrationModal`, rồi `playwright test kr-result`
- Skill: không

### T14 · Games hub — AC: KR-05, KR-06, KR-07, KR-19
- Test:
  - `apps/web/src/components/games/__tests__/games-ui.test.tsx` (bổ sung), KR-05:
    - `GamesHub` render `<img src="/illustrations/game-balloon.svg" alt=""` và `game-picture.svg`. Không có `🎈🖼️🎮✨`.
    - Huy hiệu mới dùng `gamesNew` (`Mới!`) + svg sparkle.
    - Có `SceneBackdrop` và `kr-enter`.
  - `apps/web/e2e/kr-games-hub.spec.ts`:
    - KR-07: mở `/games`, sau 1000ms `.kr-enter` có opacity 1.
    - KR-19: thẻ và nút back ≥ 44px ở 375.
    - Bấm thẻ balloon thì mở game.
- Code: `games/GamesHub.tsx`, `little-world.css`.
- Verify: `pnpm --filter @typing-adventure/web exec vitest run games-ui`, rồi `playwright test kr-games-hub`
- Skill: không

### T15 · Màn chỉ đổi theme — AC: KR-13, KR-02, KR-17
- Test: `apps/web/e2e/kr-layout.spec.ts` (phần theme):
  - KR-13: mở `/login`, `/register`, `/games`, và Little (seed `ageGroup:'little'`) ở 3 theme. `body` có `background-color` = `--kr-bg` của theme, không có `🦉` trong `.little-mascot`.
  - KR-17: axe `color-contrast` 0 vi phạm trên `/login` và Little home.
  - `/race/[roomId]`: không áp (cần server, kiểm tay).
- Code: `little.css`, `little-world.css`, `auth.css`, `social.css`, `multiplayer.css`: thay màu cứng gây lỗi tương phản bằng `--kr-*`. Không đổi bố cục, không thêm animation trên `.mp-*` progress.
- Verify: `playwright test kr-layout`. Kiểm tay `/leaderboard`, `/friends`, `/profile/[id]`, `/lobby`, `/race/[roomId]`, `/admin/dashboard` (E11).
- Skill: không

### T16 · e2e cắt ngang và chốt — AC: KR-02, KR-03, KR-14, KR-15, KR-16, KR-17, KR-18, KR-19, KR-20
- Test:
  - `apps/web/e2e/kr-motion.spec.ts`: KR-14 với `emulateMedia({reducedMotion:'reduce'})`.
    - Theo thứ tự: AgePicker → chọn kid → gõ 5 ký tự (mốc combo) → gõ hết → modal → `/games` → seed little và mở `/`.
    - Mỗi bước chờ 500ms rồi `runningAnimations(page) === 0`.
    - Nhãn `x5`, sao `role=img`, nhãn kỷ lục vẫn hiện. Không có `.confetti-piece`/`.combo-spark`.
  - `apps/web/e2e/kr-perf.spec.ts`: KR-15.
    - CDP `Emulation.setCPUThrottlingRate {rate:4}`, gõ `textToType` với `delay: 30`.
    - Modal mở, hiện `100%` độ chính xác, số ký tự đúng bằng độ dài văn bản (đếm `.char--correct` trước khi modal phủ, hoặc qua `wordsCompleted`). `activeElement` luôn là input ẩn (poll mỗi 200ms).
    - `PerformanceObserver('longtask')` qua `addInitScript`: max ≤ 100ms, chỉ assert khi `KR_PERF=1`.
  - `apps/web/e2e/kr-layout.spec.ts` (bổ sung):
    - KR-20: 375/768/1024/1440 × (AgePicker, game, game + SideNav mở, modal kết quả, `/games`, `/login`): `scrollWidth <= clientWidth`. `.word-display`, `.keyboard`, nút chính nằm trong viewport và không bị `.kr-scene` đè (`elementFromPoint` tâm phần tử không thuộc `.kr-scene`).
    - KR-19: 375×667 mọi `button, a, [role=radio], select` hiển thị trên các màn trong phạm vi (trừ `.key`) ≥ 44×44.
    - KR-18: Tab qua các nút TopBar, `outlineWidth ≥ 2px`.
    - KR-02: seed `theme:'dark'` → `html[data-theme=dark]` trước khi hydrate (đọc trong `domcontentloaded`). Đổi theme trong Settings → `data-theme` đổi ngay.
    - KR-03/KR-16: mọi request font/ảnh cùng origin. Console không có `Content Security Policy`. `getComputedStyle(body).fontFamily` chứa `Baloo`.
    - KR-17: axe `color-contrast` trên AgePicker, game, SideNav mở, modal kết quả, `/games` × 3 theme.
- Code: chỉ `feat(KR): fix …` nếu test đỏ. Sửa CSS/component tương ứng, không sửa test.
- Verify:
  - `set -a && . ../.wt-env && set +a && pnpm --filter @typing-adventure/web test:e2e`
  - `KR_PERF=1 E2E_SERVER_CMD="pnpm build && pnpm start:ws" pnpm --filter @typing-adventure/web exec playwright test kr-perf`
  - So First Load JS của `/` trong output `pnpm build` trên `main` và trên nhánh (KR-16), ghi số vào QC report.
- Skill: không

## Ma trận AC → Task → Test
| AC | Task | Test |
|---|---|---|
| KR-01 | T2, T3, T9 | unit `styles/__tests__/kr-tokens.test.ts`, `kr-clay.test.ts`; manual: so màu và viền với 02-design trên `/` |
| KR-02 | T2, T6, T15, T16 | unit `kr-tokens.test.ts` (đủ token 3 theme), `kr-shared-ui.test.tsx` (decor theo theme); e2e `kr-layout.spec.ts` (boot theme, đổi theme ngay) |
| KR-03 | T2, T16 | unit `kr-tokens.test.ts` (font token); e2e `kr-layout.spec.ts` (fontFamily, request cùng origin); manual: DevTools > Rendered Fonts trên "Luyện gõ phím, Tuyệt vời, Chơi lại, Ếch, Ưu, Ỷ" |
| KR-04 | T5, T7, T8, T11, T13 | unit `OwlMascot.test.tsx`, `kr-shared-ui.test.tsx`, `AgePicker.test.tsx`, `CelebrationModal.test.tsx`; e2e `kr-game.spec.ts` (mood happy) |
| KR-05 | T5, T7, T9, T12, T14 | unit `Icon.test.tsx`, `kr-shared-ui.test.tsx`, `game-chrome.test.tsx`, `ChoiceCards.test.tsx`, `games-ui.test.tsx`; e2e `kr-game.spec.ts` (aria-label, aria-pressed) |
| KR-06 | T6, T8, T9, T14 | unit `kr-shared-ui.test.tsx` (aria-hidden, không focusable); e2e `kr-game.spec.ts` (click cảnh → focus input), `kr-agepicker.spec.ts`; manual: cảnh ở 768/1440 không che |
| KR-07 | T4, T8, T9, T13, T14 | unit `kr-motion.test.ts`; e2e `kr-agepicker.spec.ts`, `kr-games-hub.spec.ts` (opacity 1 sau 1000ms); manual: xem stagger/back-out |
| KR-08 | T3 | unit `kr-clay.test.ts`; manual: nhấn chuột/Enter/Space trên nút, thẻ, nút disabled |
| KR-09 | T1, T11 | unit `combo-celebration.test.ts`, `ComboBurst.test.tsx`, `kr-i18n.test.ts`; e2e `kr-game.spec.ts` |
| KR-10 | T13 | unit `result-celebration.test.ts`, `games-ui.test.tsx`, `CelebrationModal.test.tsx`; e2e `kr-result.spec.ts` |
| KR-11 | T10, T12 | unit `game-input.test.ts`, `plain-label.test.ts`, `choice-nav.test.ts`, `ChoiceCards.test.tsx`; e2e `kr-sidenav.spec.ts` |
| KR-12 | T8 | unit `AgePicker.test.tsx`; e2e `kr-agepicker.spec.ts` |
| KR-13 | T2, T7, T15 | unit `kr-i18n.test.ts` (key leaderboard giữ nguyên), `kr-shared-ui.test.tsx`; e2e `kr-layout.spec.ts`; manual: `/leaderboard`, `/friends`, `/profile/[id]`, `/lobby`, `/race/[roomId]` (race không có animation mới trên tiến độ) |
| KR-14 | T4, T11, T13, T16 | unit `kr-motion.test.ts`, `reduced-motion.test.ts`, `ComboBurst.test.tsx`; e2e `kr-motion.spec.ts`; manual: bật Reduce motion của OS khi app đang mở (E4) |
| KR-15 | T11, T16 | unit `game-store-parity.test.ts`; e2e `kr-perf.spec.ts` (long task chỉ assert khi `KR_PERF=1` trên production build) |
| KR-16 | T4, T6, T9, T16 | unit `kr-assets.test.ts`, `kr-motion.test.ts`; e2e `kr-game.spec.ts` (loop paused), `kr-layout.spec.ts` (cùng origin, CSP); manual: so First Load JS của `/` với `main` (≤ +20 KB) |
| KR-17 | T2, T3, T15, T16 | unit `kr-tokens.test.ts` (WCAG theo token), `kr-clay.test.ts`; e2e `kr-layout.spec.ts` (axe `color-contrast`, 3 theme) |
| KR-18 | T3, T10, T16 | unit `kr-clay.test.ts`; e2e `kr-layout.spec.ts`, `kr-sidenav.spec.ts` (focus khi đóng nav); manual: Tab toàn màn ở dark |
| KR-19 | T3, T12, T14, T16 | unit `kr-clay.test.ts`; e2e `kr-layout.spec.ts`, `kr-sidenav.spec.ts`, `kr-games-hub.spec.ts` |
| KR-20 | T13, T16 | e2e `kr-layout.spec.ts`, `kr-result.spec.ts`; manual: zoom 200% ở 1440 (E15), chuỗi dài `en` (E6) |
| KR-21 | T1, T10, T11, T13 | unit `game-store-parity.test.ts`, `game-input.test.ts`, `CelebrationModal.test.tsx`, test hiện có `packages/game-engine/src/__tests__/*`; manual: `git diff main -- typing-adventure/packages/game-engine typing-adventure/packages/db/prisma typing-adventure/apps/web/src/app/api` rỗng; Network: user đăng nhập gọi `POST /api/sessions` đúng 1 lần mỗi ván, guest không có request API mới |
| KR-22 | T1 | unit `kr-i18n.test.ts`; typecheck (`en.ts` thiếu key thì lỗi) |

Tổng hợp cách kiểm:
- **Unit (Vitest):** KR-01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 14, 16, 17, 18, 19, 21, 22 (phần token, markup, logic thuần).
- **Playwright e2e:** KR-02, 03, 04, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20.
- **Manual:** KR-01 (nhìn), 03 (Rendered Fonts), 07 (cảm giác back-out), 08, 13 (màn cần server/social/race), 14 (E4), 16 (First Load JS), 18 (dark), 20 (E6/E15), 21 (diff rỗng, đếm request), E11 admin.

## Verify toàn bộ
```bash
cd typing-adventure && pnpm lint && pnpm typecheck && pnpm test && pnpm build
set -a && . ../.wt-env && set +a && pnpm --filter @typing-adventure/web test:e2e
KR_PERF=1 E2E_SERVER_CMD="pnpm build && pnpm start:ws" pnpm --filter @typing-adventure/web exec playwright test kr-perf
git diff --stat main -- packages/game-engine packages/db/prisma apps/web/src/app/api   # phải rỗng (KR-21)
bash ../scripts/ci/check-tdd-commits.sh main HEAD
```

## Lịch sử
- v1 2026-11-05 11:30: bản đầu.
- 2026-11-05 23:48: approved by user.

## Thực tế
- File sửa đúng danh sách `## File thay đổi`, không thêm file ngoài plan. `useGameEngine.ts` gọi `celebrate`/`finish`/`clear` qua `useComboCelebrationStore.getState()`; `game-store.ts` và `packages/game-engine` không đổi (diff KR-21 rỗng).
- Lệch nhỏ so với dự đoán:
  - `.kr-enter` dùng fill `backwards` thay vì `both`: với `both` Chrome giữ `transform: matrix(1,0,0,1,0,0)` sau khi xong, e2e KR-07 đòi `none`. Có cặp `test(KR)`/`fix(KR)` riêng.
  - Khối reduced-motion toàn cục thêm `animation-delay: 0s !important` và `transition-delay: 0s !important`; `.combo-burst` tắt animation khi reduce (burst hiện tĩnh 1200ms rồi gỡ). Lý do: animation đang ở pha delay vẫn tính `running` (KR-14).
  - Rule tạm dừng loop dùng `animation-play-state: paused !important` vì shorthand `animation` của `.owl--idle` ghi đè cùng độ ưu tiên (KR-16).
  - `ComboBurst`/`ComboAnnouncer` tách bản thuần `ComboBurstView`/`ComboAnnouncerView` (test SSR theo props) và bản nối store.
  - `LoadingScreen` thêm prop tuỳ chọn `lang` (mặc định `vi`) cho chữ sr-only `loadingText`, vì component không dùng hook.
  - `game-store-parity.test.ts` và `kr-layout.spec.ts` phần theme (T15) xanh ngay khi viết: là test giữ hành vi/kết quả của T2, T7; T15 không cần code.
  - T16 sửa thêm vùng chạm 44px cho `.guest-banner a`, `.guest-banner-close`, `.auth-link a` (`auth.css`) và `.btn-custom-text` (`game.css`).
- Verify: `pnpm lint` 0 error (40 warning cũ + 1 `no-img-element` theo plan dùng `<img>`), `pnpm typecheck` 4/4, `pnpm test` engine 255 + web 208 pass, `pnpm build` OK (`/` First Load JS 157 kB, chưa so với `main`), e2e 95/95 pass trên `next dev` (PORT=3117), `check-tdd-commits` OK. Chưa chạy `KR_PERF=1` trên production build.
