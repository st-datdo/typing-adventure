# Chế độ Bé + Hồ sơ độ tuổi — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm hồ sơ độ tuổi (little/kid/big) và chế độ Bé 3–5 tuổi tự nói, tự chỉ phím, lượt ngắn có sticker và giới hạn ngày.

**Architecture:** Luật chơi chế độ Bé là module thuần trong `packages/game-engine` (nội dung, tạo lượt, máy trạng thái, giới hạn ngày, hồ sơ tuổi). Web thêm `little-store` (Zustand persist), hook giọng/âm thanh, bộ component `components/little/*`, màn chọn tuổi, và gating theo tuổi trong SideNav/StatsBar.

**Tech Stack:** TypeScript, Vitest, Next.js 15 App Router, React 19, Zustand 5, Web Audio API, Web Speech API, `next/font/google`.

**Spec:** `docs/superpowers/specs/2026-10-24-little-mode-design.md`

## Global Constraints

- Engine thuần TS: không React/DOM/Node, không `Math.random`/`Date.now` trực tiếp; `rng: () => number` và chuỗi ngày được truyền vào.
- Mọi logic engine mới có test Vitest trong `packages/game-engine/src/__tests__/`.
- Mọi key i18n mới có trong cả `packages/i18n/src/vi.ts` và `en.ts`.
- Không thêm dependency npm. Không đổi schema Prisma. Không thêm comment/Javadoc vào code.
- Chế độ Bé: không điểm, không đồng hồ, không mạng, không bảng xếp hạng, không âm thanh gắt.
- Chữ "thuộc" khi `firstTry >= 3`. Lượt = 3 chặng × 4 mục. Gợi ý: 4000ms → mức 1, 8000ms → mức 2. Giới hạn mặc định 2 lượt/ngày, chỉnh 1–5.
- Thứ tự học: `s a t p i n m d g o c k e u r h b f l j v w x y z q`.
- Không commit (quy định của chủ dự án: chỉ commit khi được yêu cầu). Làm trên nhánh `feat/little-mode`.

## Review Focus

- Bé đập nhiều phím cùng lúc / giữ phím (auto-repeat) → mỗi sự kiện chỉ xử lý một ký tự, giữ phím không làm hỏng tiến độ; phím sai chỉ "boing", không spam âm thanh chồng (âm `boing` bị chặn trong 250ms).
- Phím ngoài a–z (số, Enter, Space, phím chức năng, IME tiếng Việt Telex gõ ra ký tự có dấu) → bỏ qua, không tính sai. Test trong Task 3 với `'1'`, `' '`, `'á'`.
- Trình duyệt chưa cho phát âm thanh trước tương tác đầu tiên (autoplay policy) → lời chào ở màn Nhà chỉ nói sau khi bé chạm/bấm lần đầu; không lỗi console.
- Qua nửa đêm khi đang mở app / dữ liệu localStorage cũ hoặc hỏng → ngày mới reset lượt; store thiếu field dùng mặc định. Test ngày đổi trong Task 3.
- Đổi từ `kid` sang chế độ đang lưu là `timeAttack`/`challenge` → tự chuyển về `classic`, không kẹt ở mode bị ẩn (Task 5).

---

### Task 1: Nội dung chế độ Bé + hồ sơ tuổi (engine)

**Files:**
- Modify: `packages/game-engine/src/types.ts`
- Create: `packages/game-engine/src/little-content.ts`
- Create: `packages/game-engine/src/age.ts`
- Modify: `packages/game-engine/src/index.ts`
- Test: `packages/game-engine/src/__tests__/little-content.test.ts`

**Interfaces:**
- Produces (types.ts):
  - `type AgeGroup = 'little' | 'kid' | 'big'`
  - `interface AgeProfile { allowedModes: GameMode[]; showSpeedStats: boolean; social: boolean }`
  - `interface LetterCard { letter: string; word: string; emoji: string }`
  - `interface PictureWord { word: string; emoji: string }`
  - `type LittleItem = { kind: 'letter'; target: string; card: LetterCard } | { kind: 'word'; target: string; picture: PictureWord }`
  - `interface LittleSession { stages: LittleItem[][] }`
  - `type LetterProgress = Record<string, { seen: number; firstTry: number }>`
  - `interface DailyPlay { date: string; sessions: number; bonus: number }`
  - `Settings` thêm `ageGroup: AgeGroup | null`
- Produces (little-content.ts): `LETTER_ORDER: string[]`, `LETTER_CARDS: Record<string, LetterCard>`, `PICTURE_WORDS: PictureWord[]`, `STICKERS: { emoji: string; name: string }[]` (30 mục), `PRAISE_COUNT = 6`, `MASTERY_FIRST_TRY = 3`, `ITEMS_PER_STAGE = 4`, `STAGE_COUNT = 3`, `HINT_LEVEL_1_MS = 4000`, `HINT_LEVEL_2_MS = 8000`, `DEFAULT_DAILY_LIMIT = 2`, `MIN_DAILY_LIMIT = 1`, `MAX_DAILY_LIMIT = 5`.
- Produces (age.ts): `AGE_PROFILES: Record<AgeGroup, AgeProfile>`, `isModeAllowed(age: AgeGroup | null, mode: GameMode): boolean` (null → true).

- [ ] **Step 1: Viết test fail** `little-content.test.ts`:
  - `LETTER_ORDER.join('') === 'satpinmdgockeurhbfljvwxyzq'` và có đủ 26 chữ khác nhau.
  - `Object.keys(LETTER_CARDS).sort()` = a..z; mỗi card `word` chứa `letter`; `LETTER_CARDS.b` = `{ letter: 'b', word: 'bear', emoji: '🐻' }`, `LETTER_CARDS.x.word === 'fox'`.
  - mọi `PICTURE_WORDS[i].word` dài 3, chỉ a–z, không trùng; có `cat`, `pin`, `ant`.
  - `STICKERS.length === 30`, emoji không trùng.
  - `AGE_PROFILES.kid` = `{ allowedModes: ['classic','lesson'], showSpeedStats: false, social: false }`; `AGE_PROFILES.big.allowedModes` gồm cả 4 mode, `social: true`; `AGE_PROFILES.little.allowedModes` rỗng.
  - `isModeAllowed('kid','timeAttack') === false`, `isModeAllowed(null,'challenge') === true`.
- [ ] **Step 2:** `pnpm --filter @typing-adventure/game-engine exec vitest run little-content` → FAIL (module không tồn tại).
- [ ] **Step 3:** Thêm type, viết `little-content.ts` (26 thẻ theo spec §5, danh sách từ ở spec §5), `age.ts`, export qua `index.ts`.
- [ ] **Step 4:** Chạy lại → PASS. Chạy cả bộ `pnpm test` → PASS.

### Task 2: Tạo lượt chơi (engine)

**Files:**
- Create: `packages/game-engine/src/little-session.ts`
- Modify: `packages/game-engine/src/index.ts`
- Test: `packages/game-engine/src/__tests__/little-session.test.ts`

**Interfaces:**
- Consumes: Task 1 types/constants.
- Produces: `getMasteredLetters(p: LetterProgress): string[]` (theo LETTER_ORDER), `getLearningLetters(p: LetterProgress): string[]` (≤2 chữ đầu tiên chưa thuộc), `buildLittleSession(p: LetterProgress, rng: () => number): LittleSession`.

Thuật toán (spec §6):
- `learning` = 2 chữ đầu LETTER_ORDER chưa thuộc. `review` = chữ đã thuộc hoặc `seen > 0`, trừ `learning`.
- Chặng 1: 4 mục chọn ngẫu nhiên từ `review`; `review` rỗng → từ `learning`.
- Chặng 2: mỗi chữ `learning` 2 lần (4 mục); có 1 chữ `learning` → 2 lần + 2 từ review (rỗng → chữ đó); 0 chữ `learning` → 4 từ mastered.
- Chặng 3: từ `PICTURE_WORDS` có mọi chữ thuộc mastered → 2 mục từ khác nhau + 2 mục chữ từ `learning ∪ review`; ít hơn 2 từ → 4 mục chữ trộn.
- Mỗi chặng xáo bằng `rng` rồi sửa cặp liền nhau trùng `target` (kể cả mục cuối chặng trước với mục đầu chặng sau) bằng hoán đổi với mục khác target gần nhất; không sửa được (toàn một target) thì giữ nguyên.

- [ ] **Step 1: Viết test fail** (`rng` cố định: `seq(...)` lặp mảng số, và `mulberry32(42)` viết trong test):
  - `buildLittleSession({}, rng)`: 3 chặng × 4 mục; mọi target ∈ {s,a}; chặng 2 có `s` ≥2 và `a` ≥2; không có mục `word`.
  - progress `{s,a,t,p,i,n,c}` firstTry 3: `getLearningLetters` = `['m','d']`; chặng 2 có `m` ≥2, `d` ≥2; chặng 3 có đúng 2 mục `word`, mọi chữ của chúng ∈ mastered, 2 từ khác nhau.
  - toàn bộ 26 chữ thuộc: không lỗi, 12 mục, có mục word.
  - Không hai mục liền nhau trùng target trên toàn lượt, chạy 200 seed khác nhau với progress `{s:3,a:3,t:3}`.
  - Cùng seed → cùng kết quả (deterministic).
  - progress `{ s: { seen: 2, firstTry: 1 } }`: `getMasteredLetters` = [] và `s` vẫn nằm trong `learning`.
- [ ] **Step 2:** `vitest run little-session` → FAIL.
- [ ] **Step 3:** Viết `little-session.ts`, export.
- [ ] **Step 4:** → PASS.

### Task 3: Máy trạng thái, gợi ý, giới hạn ngày, sticker, lời khen (engine)

**Files:**
- Create: `packages/game-engine/src/little-state.ts`
- Modify: `packages/game-engine/src/index.ts`
- Test: `packages/game-engine/src/__tests__/little-state.test.ts`

**Interfaces:**
- Consumes: Task 1–2.
- Produces:
  - `type LittleOutcome = 'ignored' | 'wrong' | 'char' | 'item' | 'stage' | 'session'`
  - `interface LittleState { session: LittleSession; stageIndex: number; itemIndex: number; charIndex: number; charHadMistake: boolean; progress: LetterProgress; foundCount: number; finished: boolean }`
  - `createLittleState(session: LittleSession, progress: LetterProgress): LittleState`
  - `getCurrentItem(s: LittleState): LittleItem | null`, `getExpectedChar(s: LittleState): string | null`
  - `littleKeypress(s: LittleState, char: string): { state: LittleState; outcome: LittleOutcome }` — `char.toLowerCase()`; không phải `/^[a-z]$/` → `ignored`; finished → `ignored`; sai → `wrong`, `charHadMistake = true`; đúng → `progress[ch].seen += 1`, `firstTry += 1` nếu `!charHadMistake`, `foundCount += 1`, tiến chỉ số; outcome là mức cao nhất vừa hoàn thành.
  - `getHintLevel(idleMs: number): 0 | 1 | 2`
  - `canStartLittleSession(d: DailyPlay, today: string, limit: number): boolean`, `markLittleSessionStarted(d: DailyPlay, today: string): DailyPlay`, `grantBonusSession(d: DailyPlay, today: string): DailyPlay`, `sessionsLeftToday(d: DailyPlay, today: string, limit: number): number` — `d.date !== today` coi như `{ date: today, sessions: 0, bonus: 0 }`.
  - `nextSticker(collectedCount: number): { emoji: string; name: string }` = `STICKERS[collectedCount % STICKERS.length]`
  - `pickPraiseIndex(last: number | null, rng: () => number): number` ∈ [0, PRAISE_COUNT), ≠ last.
  - `clampDailyLimit(n: number): number` về [1,5], làm tròn.

- [ ] **Step 1: Viết test fail** với session dựng tay `{ stages: [[letter('b'), word('cat')], [letter('s')]] }`:
  - `'x'` → `wrong`, chỉ số không đổi; tiếp `'B'` → `item` (mục chữ 1 ký tự); `progress.b` = `{ seen: 1, firstTry: 0 }` (đã sai trước đó).
  - `'c'` → `char`, `'a'` → `char`, `'t'` → `stage`; `progress.c.firstTry === 1`.
  - `'s'` → `session`, `finished === true`, `foundCount === 5`; phím sau đó → `ignored`.
  - `'1'`, `' '`, `'á'`, `'Enter'` → `ignored`, state giữ nguyên tham chiếu giá trị.
  - `getHintLevel(3999) === 0`, `(4000) === 1`, `(7999) === 1`, `(8000) === 2`.
  - `canStartLittleSession({date:'2026-10-23',sessions:9,bonus:0},'2026-10-24',2) === true`; `{date:'2026-10-24',sessions:2,bonus:0}` limit 2 → false; bonus 1 → true.
  - `markLittleSessionStarted({date:'2026-10-23',sessions:2,bonus:3},'2026-10-24')` → `{date:'2026-10-24',sessions:1,bonus:0}`.
  - `grantBonusSession({date:'2026-10-24',sessions:2,bonus:0},'2026-10-24').bonus === 1`.
  - `sessionsLeftToday({date:'2026-10-24',sessions:1,bonus:0},'2026-10-24',2) === 1`.
  - `nextSticker(0)` = `STICKERS[0]`, `nextSticker(30)` = `STICKERS[0]`.
  - `pickPraiseIndex(2, () => 0.4)` ≠ 2; 100 lần với rng bất kỳ luôn trong [0,6).
  - `clampDailyLimit(0) === 1`, `(9) === 5`, `(2.6) === 3`.
- [ ] **Step 2:** `vitest run little-state` → FAIL.
- [ ] **Step 3:** Viết `little-state.ts`, export.
- [ ] **Step 4:** `pnpm test` → PASS.

### Task 4: Âm thanh và giọng đọc (web)

**Files:**
- Modify: `apps/web/src/lib/audio/sound-engine.ts`
- Modify: `apps/web/src/lib/audio/speech-engine.ts`

**Interfaces:**
- Produces: `SoundType` thêm `'pop' | 'boing' | 'sparkle' | 'fanfare' | 'sticker'`; `SoundEngine.playNote(letter: string): void` (a–z → thang ngũ cung C D E G A, 2 quãng tám từ C5, theo vị trí chữ trong bảng chữ cái mod 10); `'wrong'` đổi sang triangle 330→260Hz, gain 0.05, 0.15s.
- Produces: `SpeechEngine.hasVoice(lang: 'vi' | 'en'): boolean`; `SpeechEngine.speakSequence(parts: { text: string; lang: 'vi' | 'en' }[]): void` — `cancel()` rồi xếp hàng từng utterance với voice đúng ngôn ngữ (`vi-VN`/`en-US`), bỏ phần `vi` khi không có voice tiếng Việt; `speakLetter/speakWord` cũ giữ nguyên hành vi.

- [ ] **Step 1:** Thực hiện hai thay đổi trên. Voice chọn lại khi `voiceschanged`.
- [ ] **Step 2:** `npx tsc --noEmit -p apps/web` → không lỗi mới.

### Task 5: Hồ sơ tuổi trong settings, màn chọn tuổi, gating cho kid (web)

**Files:**
- Modify: `apps/web/src/stores/settings-store.ts` (thêm `ageGroup: AgeGroup | null` mặc định `null`, `setAgeGroup`, `loadFromServer` đọc `ageGroup`, `clearAll` giữ nguyên mặc định null)
- Modify: `apps/web/src/app/api/users/me/settings/route.ts` (`ageGroup: z.enum(['little','kid','big']).optional()`)
- Create: `apps/web/src/components/age/AgePicker.tsx`
- Modify: `apps/web/src/app/page.tsx` (chờ `_hydrated`; `ageGroup === null` → `AgePicker`; `'little'` → `LittleMode` (Task 6); còn lại → `GameEngine`)
- Modify: `apps/web/src/components/layout/SideNav.tsx` (lọc option mode theo `isModeAllowed`; ẩn 3 link xã hội khi `!AGE_PROFILES[age].social`)
- Modify: `apps/web/src/components/game/StatsBar.tsx` (ẩn `stat-cps`, `stat-wpm`, `stat-best` khi `showSpeedStats === false`)
- Modify: `apps/web/src/components/game/CelebrationModal.tsx` (ẩn dòng kỷ lục WPM và chỉ số WPM/CPS khi `showSpeedStats === false`)
- Modify: `apps/web/src/components/game/GameEngine.tsx` (khi mode hiện tại không được phép → `startGame('classic', …)`)
- Modify: `apps/web/src/components/settings/SettingsPanel.tsx` (nhóm "Độ tuổi" với select 3 giá trị)
- Modify: `packages/i18n/src/vi.ts`, `en.ts`: `agePickTitle, ageLittle, ageLittleDesc, ageKid, ageKidDesc, ageBig, ageBigDesc, ageLabel, ageDesc`
- Modify: `apps/web/src/app/layout.tsx` (Baloo 2 qua `next/font/google`, subsets `['latin','vietnamese']`, `variable: '--font-kid'`, gắn class vào `<html>`)

**Interfaces:**
- Consumes: `AGE_PROFILES`, `isModeAllowed`, `AgeGroup` (Task 1).
- Produces: `useSettingsStore` có `ageGroup`, `setAgeGroup(v: AgeGroup | null)`. `AgePicker` props `{ onPicked?: () => void }`.

- [ ] **Step 1:** Thực hiện các thay đổi. `AgePicker` dùng class `little-*` của Task 6 CSS (cùng font, cùng bảng màu).
- [ ] **Step 2:** `npx tsc --noEmit -p apps/web` và `pnpm lint` → 0 lỗi.

### Task 6: Chế độ Bé (web)

**Files:**
- Create: `apps/web/src/stores/little-store.ts` — persist key `typingAdventure_little`; state `{ progress: LetterProgress; stickers: string[]; daily: DailyPlay; dailyLimit: number; lastPraise: number | null }`; actions `commitProgress(p)`, `addSticker(): {emoji,name}`, `startSession(today)`, `grantBonus(today)`, `setDailyLimit(n)` (qua `clampDailyLimit`), `setLastPraise(i)`, `resetProgress()`; `merge` của persist trải mặc định trước dữ liệu lưu.
- Create: `apps/web/src/lib/little/today.ts` — `localToday(): string` = `new Date().toLocaleDateString('en-CA')`.
- Create: `apps/web/src/hooks/useLittleVoice.ts` — `{ prompt(item), praise(i), letter(ch), word(w), stickerName(name), hello(), sleep(), done(n), sound(type), note(ch), hasViVoice }`; lời dẫn theo `settings.lang`, chữ/từ luôn `en`; tôn trọng `soundEnabled`; chặn `boing` lặp trong 250ms.
- Create: `apps/web/src/components/little/LittleMode.tsx` — điều hướng màn `'home' | 'play' | 'end' | 'album' | 'parent'`.
- Create: `apps/web/src/components/little/LittleHome.tsx`, `LittlePlay.tsx`, `LittleEnd.tsx`, `LittleAlbum.tsx`, `ParentGate.tsx` (giữ 3000ms, vòng tiến độ, thả sớm thì hủy), `ParentPanel.tsx`, `BigKeyboard.tsx` (3 hàng a–z theo `KEYBOARD_ROWS`, phím đích `--target`, mức gợi ý 2 hiện 👇), `Mascot.tsx` (cú 🦉 + bong bóng, trạng thái `idle | happy | sleep`), `Burst.tsx` (emoji bay lên khi đúng).
- Create: `apps/web/src/styles/little.css`; import trong `globals.css`.
- Modify: `packages/i18n/src/vi.ts`, `en.ts`: `littleHello, littleFindLetter, littleTypeWord, littleDone, littleSleep, littleNewSticker, littlePlay, littlePlayMore, littleAlbum, littleAlbumTitle, littleHome, littleParent, littleHold, praise0..praise5, parentTitle, parentLetters, parentLegend, parentToday, parentTotal, parentLimit, parentBonus, parentAge, parentSound, parentVoiceTest, parentReset, parentResetConfirm, parentClose, parentNoViVoice`.

**Interfaces:**
- Consumes: Task 1–5.
- Luồng `LittlePlay`: mount → `startSession(today)`, `buildLittleSession(progress, Math.random)`, `createLittleState`; `prompt(item)` khi đổi mục; lắng nghe `keydown` (bỏ qua `e.repeat`, bỏ qua khi có phím Ctrl/Meta/Alt) và chạm `BigKeyboard`; outcome `wrong` → `boing`; `char` → `note`+`pop`+đọc chữ+Burst; `item` → thêm `sparkle`+lời khen (mục từ: đọc cả từ); `stage` → `sparkle`; `session` → `commitProgress`, `fanfare`, chuyển `end`. Bộ đếm idle reset mỗi phím; mức 1 → nói lại prompt một lần; mức 2 → hiện 👇.
- `LittleEnd`: `addSticker()` một lần (ref guard), sticker bay vào hàng album, `done(foundCount)`; còn lượt → nút "Chơi lượt nữa"; hết → `sleep()` + nút sau `ParentGate`.
- `LittleHome`: hết lượt → cú ngủ, ẩn ▶. Lời chào nói sau tương tác đầu tiên.

- [ ] **Step 1:** Viết store, hook, component, CSS, i18n.
- [ ] **Step 2:** `npx tsc --noEmit -p apps/web`, `pnpm lint` → 0 lỗi; `pnpm test` → PASS.

### Task 7: Kiểm tra toàn bộ

- [ ] **Step 1:** `pnpm test`, `npx tsc --noEmit -p apps/web`, `pnpm lint`, `pnpm build` → đều qua.
- [ ] **Step 2:** `pnpm dev`, dùng Playwright (chromium cache có sẵn) chụp: màn chọn tuổi, Nhà, Chơi (mức gợi ý 0 và 2), Kết thúc, Album, Góc bố mẹ, chế độ kid (không WPM, chỉ 2 mode). Kiểm tra console không lỗi.
- [ ] **Step 3:** Đưa ảnh chụp vào visual companion, viết báo cáo.
