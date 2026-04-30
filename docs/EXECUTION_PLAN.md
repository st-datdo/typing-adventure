# Typing Adventure - Ke hoach thuc hien Fullstack

> Tài liệu chi tiết từng bước thực hiện, dựa trên FULLSTACK_ARCHITECTURE.md
> Ngày tạo: 2026-04-28

---

## Tổng quan

| Giai đoạn | Nội dung | Thời gian |
|-----------|----------|-----------|
| 1 | Nền tảng — Monorepo + Migration sang React | 2-3 tuần |
| 2 | Backend + Auth | 2 tuần |
| 3 | Leaderboard + Social | 1.5 tuần |
| 4 | Content Management | 1 tuần |
| 5 | Multiplayer | 2-3 tuần |
| 6 | Analytics & Admin | 1 tuần |
| **Tổng** | | **10-12 tuần** |

---

## GIAI ĐOẠN 1: NỀN TẢNG (2-3 tuần)

> Mục tiêu: Game chạy được trên React + TypeScript, cùng cấu trúc monorepo mới.
> Nguyên tắc: Game PHẢI hoạt động giống hệt phiên bản hiện tại trước khi chuyển sang giai đoạn 2.

### Sprint 1.1 — Setup & Core Migration (1 tuần)

#### Task 1.1.1: Init Monorepo

```bash
# Thao tác cụ thể
mkdir typing-adventure && cd typing-adventure
pnpm init
```

- [x] Tạo root `package.json` với `"private": true`
- [x] Tạo `pnpm-workspace.yaml`:
  ```yaml
  packages:
    - "apps/*"
    - "packages/*"
  ```
- [x] Tạo `turbo.json` với pipeline: build, dev, lint, test
- [x] Tạo `.env.example` (DATABASE_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, UPSTASH_REDIS_URL)
- [x] Tạo `docker-compose.yml` cho PostgreSQL + Redis local:
  ```yaml
  services:
    postgres:
      image: postgres:16-alpine
      ports: ["5432:5432"]
      environment:
        POSTGRES_DB: typing_adventure
        POSTGRES_USER: dev
        POSTGRES_PASSWORD: dev
      volumes: [postgres_data:/var/lib/postgresql/data]
    redis:
      image: redis:7-alpine
      ports: ["6379:6379"]
  volumes:
    postgres_data:
  ```
- [x] Tạo `.gitignore` (node_modules, .env, .next, .turbo, dist)
- [x] Verify: `pnpm install` thành công, `docker compose up -d` chạy được

**Deliverable:** Monorepo trống, chạy được pnpm, Docker PostgreSQL + Redis.

---

#### Task 1.1.2: Setup Next.js App

- [x] `mkdir -p apps/web && cd apps/web`
- [x] `pnpm create next-app . --typescript --tailwind --app --src-dir --import-alias "@/*"`
- [x] Cấu hình `tsconfig.json`: strict mode, paths alias
- [x] Cấu hình `tailwind.config.ts`:
  - Thêm 3 theme colors (dark/light/colorful) mapping từ CSS variables hiện tại trong `style.css:10-31`
  - Dark mode: `class` strategy
- [x] Xoá boilerplate Next.js mặc định (page.tsx, globals.css default content)
- [x] Tạo layout cơ bản `src/app/layout.tsx` với font setup
- [x] Tạo `src/app/page.tsx` placeholder: "Typing Adventure"
- [x] Verify: `pnpm dev` chạy, truy cập `localhost:3000` thấy placeholder

**Deliverable:** Next.js app trống chạy được tại `localhost:3000`.

---

#### Task 1.1.3: Extract `packages/game-engine`

Tách pure logic từ `app.js` sang TypeScript package. **Không thay đổi logic, chỉ chuyển ngôn ngữ.**

- [x] Tạo `packages/game-engine/package.json`:
  ```json
  {
    "name": "@typing-adventure/game-engine",
    "version": "0.1.0",
    "main": "src/index.ts",
    "types": "src/index.ts"
  }
  ```
- [x] Tạo `packages/game-engine/tsconfig.json`

**File cần tạo:**

- [x] `src/types.ts` — Định nghĩa tất cả types:
  ```typescript
  // Từ app.js state object (dòng ~400-450)
  export type Level = 'easy' | 'medium' | 'hard'
  export type SoundMode = 'default' | 'character' | 'word'
  export type GameMode = 'classic' | 'lesson' | 'timeAttack' | 'challenge'
  export type KeyboardCase = 'lower' | 'upper'
  export type Theme = 'dark' | 'light' | 'colorful'
  export type SpeechRate = 'slow' | 'normal' | 'fast'

  export interface GameState {
    text: string
    currentIndex: number
    startTime: number | null
    totalKeystrokes: number
    correctKeystrokes: number
    isFinished: boolean
    level: Level
    soundMode: SoundMode
    gameMode: GameMode
    wordBoundaries: number[]
    combo: number
    maxCombo: number
    score: number
    mistakeMap: Record<string, number>
    lives: number
    wordsCompleted: number
  }

  export interface GameResult {
    wpm: number
    cps: number
    accuracy: number
    score: number
    stars: number
    timeSeconds: number
    wordCount: number
    maxCombo: number
    mistakeMap: Record<string, number>
  }

  export interface Settings { ... }
  export interface UserRecord { ... }
  export interface HistoryEntry { ... }
  export interface Achievement { ... }
  ```

- [x] `src/words.ts` — Copy từ `app.js:207-304`:
  - `WORDS` object (easy/medium/hard arrays)
  - `generateLessonWords()` function
  - `generateChallengeWords()` function
  - `LESSONS` array (5 bài học)
  - Export tất cả với TypeScript types

- [x] `src/scoring.ts` — Copy từ `app.js:959-964` + scoring logic:
  - `calculateScore(correctChars, combo, accuracy)` → number
  - `calculateStars(accuracy, wpm, level)` → 1 | 2 | 3
  - `getAccuracyBonus(accuracy)` → number
  - `getComboMultiplier(combo)` → number

- [x] `src/achievements.ts` — Copy từ `app.js:375-395`:
  - `ACHIEVEMENTS` array (16 achievements definition)
  - `checkAchievements(records, sessionResult)` → string[] (newly unlocked IDs)

- [x] `src/keyboard.ts` — Copy từ `app.js:307-372`:
  - `KEYBOARD_ROWS` array
  - `KEY_FINGER_MAP` object (từ `app.js:2118-2125`)
  - `getFingerForKey(key)` → FingerInfo

- [x] `src/engine.ts` — Tách pure game logic:
  - `processKeypress(state, inputChar)` → `{ newState, isCorrect }`
  - `createInitialState(gameMode, level, text)` → GameState
  - `calculateResult(state)` → GameResult
  - `isGameFinished(state)` → boolean

- [x] `src/index.ts` — Re-export tất cả

- [x] **Unit tests** `src/__tests__/`:
  - `scoring.test.ts`: test calculateScore, calculateStars
  - `engine.test.ts`: test processKeypress (đúng/sai), createInitialState
  - `words.test.ts`: test WORDS có đủ data, generateLessonWords trả đúng ký tự
  - `achievements.test.ts`: test checkAchievements

- [x] Verify: `pnpm test` (Vitest) pass tất cả tests trong game-engine

**Deliverable:** Package `@typing-adventure/game-engine` hoàn chỉnh với tests.

---

#### Task 1.1.4: Extract `packages/i18n`

- [x] Tạo `packages/i18n/package.json`
- [x] Tạo `src/vi.ts` — Copy `LANG.vi` object từ `app.js:2-99` (190+ strings)
- [x] Tạo `src/en.ts` — Copy `LANG.en` object từ `app.js:102-192`
- [x] Tạo `src/index.ts` — Export cả hai + type `TranslationKey`
- [x] Verify: import được từ `apps/web`

**Deliverable:** Package `@typing-adventure/i18n` với 2 ngôn ngữ.

---

#### Task 1.1.5: Tạo Zustand Stores

Trong `apps/web/src/stores/`:

- [x] `game-store.ts`:
  ```typescript
  // Map từ state object trong app.js (~dòng 400-450)
  interface GameStore {
    // State
    gameState: GameState
    isPlaying: boolean
    // Actions
    startGame: (mode, level, text) => void
    handleKeypress: (char: string) => void
    resetGame: () => void
    finishGame: () => void
  }
  ```

- [x] `settings-store.ts`:
  ```typescript
  // Map từ settings trong app.js
  interface SettingsStore {
    theme: Theme
    keyboardCase: KeyboardCase
    soundMode: SoundMode
    soundEnabled: boolean
    speechRate: SpeechRate
    wordCount: number
    fingerGuide: boolean
    lang: 'vi' | 'en'
    playerName: string
    playerAvatar: string
    // Actions
    updateSetting: <K>(key: K, value) => void
    loadFromStorage: () => void
    saveToStorage: () => void
  }
  ```

- [x] `records-store.ts`: Best WPM/accuracy, total games, streak
- [x] Tích hợp localStorage persist (zustand/middleware) — giữ tương thích key cũ (`typingAdventure_settings`, `typingAdventure_records`)

- [x] Verify: stores hoạt động trong dev console

**Deliverable:** 3 Zustand stores với localStorage persist.

---

#### Task 1.1.6: Migrate Audio Engines

Trong `apps/web/src/lib/audio/`:

- [x] `sound-engine.ts` — Copy `SoundEngine` class từ `app.js:508-572`, thêm TypeScript types
- [x] `speech-engine.ts` — Copy `SpeechEngine` class từ `app.js:575-619`, thêm TypeScript types
- [x] Tạo hooks:
  - `src/hooks/useSound.ts` — Wrap SoundEngine, nhận soundEnabled từ settings store
  - `src/hooks/useSpeech.ts` — Wrap SpeechEngine, nhận speechRate từ settings store
- [x] Verify: âm thanh phát được khi gọi hook trong dev component

**Deliverable:** Audio engines chạy được trong React.

---

### Sprint 1.2 — React Components (1 tuần)

> Map từng section trong `index.html` sang React component.
> Mỗi component PHẢI render giống hệt phiên bản hiện tại.

#### Task 1.2.1: Game Components (core)

Trong `apps/web/src/components/game/`:

- [x] `WordDisplay.tsx` — Map từ `index.html:133-144` + `renderText()` trong app.js
  - Nhận `text`, `currentIndex`, `mistakeMap` từ game store
  - Render ký tự với class correct/wrong/active
  - Progress bar
  - Combo display + Lives display (challenge mode)

- [x] `Keyboard.tsx` — Map từ `buildKeyboard()` trong `app.js:716`
  - Nhận `KEYBOARD_ROWS` từ game-engine package
  - Highlight active key, flash correct/wrong
  - Finger color borders (toggle từ settings)
  - Chữ hoa/chữ thường từ settings store

- [x] `HandGuide.tsx` — Map từ `index.html:170-198`
  - SVG bàn tay trái + phải
  - Highlight ngón tay theo phím hiện tại (dùng `KEY_FINGER_MAP`)
  - Finger label text

- [x] `StatsBar.tsx` — Map từ `index.html:79-130`
  - 7 stat cards: Timer, CPS, WPM, Accuracy, Score, Best WPM, Streak
  - Tooltips
  - Real-time update từ game store

- [x] `ComboDisplay.tsx` — Tích hợp trong WordDisplay.tsx (combo counter + milestone effects)
- [x] `LivesDisplay.tsx` — Tích hợp trong WordDisplay.tsx (hiển thị mạng sống challenge mode)

- [x] Verify: render đúng giao diện, cùng data test

---

#### Task 1.2.2: Game Engine Hook

- [x] `src/hooks/useGameEngine.ts`:
  ```typescript
  // Kết nối game-engine package với React
  function useGameEngine() {
    const gameStore = useGameStore()
    const { playCorrect, playWrong } = useSound()
    const { speak } = useSpeech()

    const handleKeypress = useCallback((e: KeyboardEvent) => {
      // Gọi processKeypress() từ game-engine
      // Update game store
      // Play sound
      // Check finish
    }, [...])

    useEffect(() => {
      window.addEventListener('keydown', handleKeypress)
      return () => window.removeEventListener('keydown', handleKeypress)
    }, [handleKeypress])

    return { startGame, resetGame, gameState }
  }
  ```
- [x] `src/hooks/useTimer.ts` — Tích hợp trong useGameEngine.ts (setInterval update timer)
- [x] `src/hooks/useKeyboardInput.ts` — Tích hợp trong GameEngine.tsx (hidden input + keydown)

- [x] Verify: gõ phím → game state update → UI update → âm thanh phát

---

#### Task 1.2.3: CelebrationModal

- [x] `CelebrationModal.tsx` — Map từ `index.html:332-345` + `finishGame()` trong app.js:
  - Stars animation
  - Score display
  - Record comparison ("Kỷ lục mới!" / "Còn X WPM nữa...")
  - Mistake analysis (chữ hay sai nhất)
  - Action buttons: Chơi lại / Thử level khó hơn / Luyện chữ yếu
  - Confetti effect

- [x] Verify: hoàn thành game → modal hiện đúng data

---

#### Task 1.2.4: Layout Components

- [x] `SideNav.tsx` — Map từ `index.html:13-60`:
  - Language select
  - Game mode select (+ sub-selects cho lesson/timeAttack)
  - Level select
  - Sound mode select
  - Settings button + History button

- [x] `QuickActions.tsx` — Tích hợp trong SideNav.tsx:
  - Restart button
  - Sound toggle button

- [x] `Header.tsx` — Tích hợp trong GameEngine.tsx:
  - Title + subtitle
  - Profile greeting

- [x] `src/app/page.tsx` — Trang game chính, compose tất cả components (dùng GameEngine component)

- [x] Verify: layout giống phiên bản hiện tại trên desktop + mobile

---

#### Task 1.2.5: Settings & History Panels

- [ ] `SettingsPanel.tsx` — Map từ `index.html:243-316`:
  - Profile (name + avatar)
  - Achievements button
  - Theme selector
  - Keyboard case
  - Speech rate
  - Word count
  - Finger guide toggle

- [ ] `HistoryPanel.tsx` — Map từ `index.html:203-240`:
  - Streak banner
  - WPM chart (dùng Recharts thay SVG tự viết)
  - Trend indicator
  - Recent games table

- [ ] `AchievementGrid.tsx` — Map từ `index.html:319-329`:
  - 16 achievements grid
  - Locked/unlocked state
  - Unlock date

- [ ] `CustomTextModal.tsx` — Map từ `index.html:147-162`

- [ ] Verify: tất cả panels mở/đóng đúng, data hiển thị chính xác

---

### Sprint 1.3 — Theme & i18n (0.5 tuần)

#### Task 1.3.1: Tailwind Themes

- [x] Tạo 3 theme CSS trong `globals.css` + `game.css` (inline, không tách file riêng), mapping từ `style.css:10-80`:
  - dark (default `:root`): `--bg-primary: #0f0c29`, ...
  - light (`[data-theme="light"]`): `--bg-primary: #fffbeb`, ...
  - colorful (`[data-theme="colorful"]`): `--bg-primary: #1a0533`, ...
- [x] Cấu hình Tailwind extend colors sử dụng CSS variables
- [x] Theme switching logic: `document.documentElement.setAttribute('data-theme', theme)` trong GameEngine.tsx
- [x] Verify: chuyển theme → giao diện đổi mượt mà

#### Task 1.3.2: i18n Setup (dùng @typing-adventure/i18n trực tiếp thay vì next-intl)

- [x] Import translations từ `@typing-adventure/i18n` (dùng hàm `t()` và `tReplace()` trực tiếp)
- [x] Tất cả components dùng `t(lang, key)` thay vì hardcode text
- [x] Language switcher trong SideNav

- [x] Verify: chuyển ngôn ngữ → tất cả UI text đổi

#### Task 1.3.3: Responsive Layout

- [x] Responsive breakpoints giống hiện tại: 700px, 480px (trong game.css)
- [x] Mobile: ẩn bớt stats, keyboard nhỏ hơn
- [x] Hidden input cho mobile keyboard
- [ ] Verify: test trên Chrome DevTools mobile viewports

---

### Milestone 1: Kiểm tra toàn diện

- [ ] Tất cả 4 chế độ chơi hoạt động đúng
- [ ] Gõ phím → visual feedback + sound + score đúng
- [ ] Settings lưu/load localStorage
- [ ] History hiển thị đúng
- [ ] Achievements unlock đúng
- [ ] 3 themes hoạt động
- [ ] 2 ngôn ngữ hoạt động
- [ ] Responsive mobile/tablet/desktop
- [ ] **Performance: game engine 60fps, không lag khi gõ nhanh**
- [ ] Unit tests pass, coverage ≥ 80% cho game-engine package

---

## GIAI ĐOẠN 2: BACKEND + AUTH (2 tuần)

> Mục tiêu: Tài khoản người dùng, lưu dữ liệu lên cloud.
> Nguyên tắc: Offline-first — localStorage trước, sync server sau.

### Sprint 2.1 — Database & API (1 tuần)

#### Task 2.1.1: Setup Database Package

- [x] Tạo `packages/db/package.json`
- [x] `pnpm add prisma @prisma/client` trong packages/db
- [x] Copy Prisma schema từ `FULLSTACK_ARCHITECTURE.md` section 4.2:
  - User, GameSession, UserRecord, UserAchievement, Friendship, WordPack, RaceRoom, RaceResult
- [x] `npx prisma generate` (migrate cần database chạy — sẽ chạy khi `docker compose up`)
- [x] Tạo `src/client.ts` — singleton Prisma client
- [x] Tạo `prisma/seed.ts`:
  - Seed WORDS từ game-engine package vào WordPack table
  - Seed admin user
- [ ] `npx prisma db seed` (cần PostgreSQL chạy)
- [ ] Verify: `npx prisma studio` → thấy tables + seed data

**Deliverable:** Database schema chạy được, có seed data.

---

#### Task 2.1.2: API Routes — Sessions

Trong `apps/web/src/app/api/`:

- [x] `sessions/route.ts`:
  - `POST` — Lưu kết quả trận chơi
    - Validate body (Zod): gameMode, level, wpm, cps, accuracy, score, stars, timeSeconds, wordCount, maxCombo, mistakeMap
    - Tạo GameSession record
    - Update UserRecord (best WPM/accuracy, totalGames, totalWords, streak)
    - Trả về session + updated records
  - `GET` — Lịch sử trận chơi (phân trang)
    - Query params: `?page=1&limit=20`
    - Filter theo userId từ session

- [x] `sessions/stats/route.ts`:
  - `GET` — Thống kê tổng hợp
    - Best WPM/accuracy theo từng level
    - Total games, total words
    - Day streak
    - Trả về UserRecord

- [ ] Verify: test bằng cURL / Postman (cần database chạy)

---

#### Task 2.1.3: API Routes — Users & Achievements

- [x] `users/me/route.ts`:
  - `GET` — Profile hiện tại (name, avatar, settings, records)
  - `PUT` — Cập nhật profile (name, avatar) (Zod validated)

- [x] `users/me/settings/route.ts`:
  - `PUT` — Cập nhật settings JSON (Zod validated)

- [x] `users/[id]/route.ts`:
  - `GET` — Profile công khai (name, avatar, records, achievements)

- [x] `achievements/route.ts`:
  - `GET` — Tất cả achievements + trạng thái mở khóa

- [x] `achievements/check/route.ts`:
  - `POST` — Kiểm tra & mở khóa achievements mới
    - Nhận: current records + session result
    - Dùng `checkAchievements()` từ game-engine package
    - Tạo UserAchievement records
    - Trả về newly unlocked

- [x] Tất cả endpoints trả đúng format `{ success, data, meta? }` (qua `api-response.ts` helper)

---

#### Task 2.1.4: API Client trong Frontend

Trong `apps/web/src/lib/api/`:

- [x] `client.ts` — Fetch wrapper:
  ```typescript
  async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>>
  ```
  - Handle errors thống nhất
  - Parse JSON response

- [x] `sessions.ts`:
  - `saveSession(data)` → POST /api/sessions
  - `getHistory(page, limit)` → GET /api/sessions
  - `getStats()` → GET /api/sessions/stats

- [x] `users.ts`:
  - `getProfile()` → GET /api/users/me
  - `updateProfile(data)` → PUT /api/users/me
  - `updateSettings(data)` → PUT /api/users/me/settings

- [x] `achievements.ts`:
  - `getAchievements()` → GET /api/achievements
  - `checkAchievementsApi(data)` → POST /api/achievements/check

- [x] Tích hợp vào game flow:
  - Khi `finishGame()` → GameEngine.tsx gọi `saveSession()` (nếu đã đăng nhập)
  - **Offline fallback**: nếu API fail → lưu localStorage (zustand persist), hiện SyncIndicator "Offline"

- [ ] Verify: chơi game → data lưu lên PostgreSQL (cần database chạy)

---

### Sprint 2.2 — Authentication (1 tuần)

#### Task 2.2.1: NextAuth.js Setup

- [x] `pnpm add next-auth@beta @auth/prisma-adapter` trong apps/web
- [x] Tạo `src/app/api/auth/[...nextauth]/route.ts`:
  - PrismaAdapter
  - Credentials provider (email + password + bcrypt)
  - Google OAuth provider
  - JWT strategy
  - Session callbacks (jwt → id, session → user.id)

- [x] Tạo `src/lib/auth.ts` — Auth config + helper `getSessionUser()`
- [x] Tạo middleware `src/middleware.ts` — Protected routes (/profile, /friends)

- [ ] Verify: NextAuth chạy, `/api/auth/session` trả session (cần database)

---

#### Task 2.2.2: Trang Login / Register

- [x] `src/app/(auth)/login/page.tsx`:
  - Form email + password
  - Nút "Đăng nhập với Google"
  - Link "Chưa có tài khoản? Đăng ký"
  - Error messages
  - Giao diện phù hợp trẻ em (emoji, màu sắc) + auth.css

- [x] `src/app/(auth)/register/page.tsx`:
  - Form: name, email, password, avatar (16 emoji picker)
  - Validate: email format, password strength (≥ 6 ký tự)
  - Tự đăng nhập sau đăng ký (signIn credentials)

- [x] `src/app/api/auth/register/route.ts`:
  - Validate input (Zod)
  - Hash password (bcrypt, saltRounds=12)
  - Tạo User + UserRecord
  - Trả về user info

- [ ] Verify: đăng ký → đăng nhập → thấy profile (cần database)

---

#### Task 2.2.3: Guest Mode + Migration

- [x] Guest mode:
  - Mặc định vào app → chơi ngay (không cần đăng nhập)
  - Dữ liệu lưu localStorage như hiện tại (zustand persist)
  - GuestBanner component: "Đăng nhập để lưu tiến bộ của bạn!" (ẩn được)

- [x] Guest-to-Account migration:
  - `src/app/api/auth/migrate/route.ts`:
    - `POST` — Nhận localStorage data: history, records, achievements
    - Merge vào account: giữ giá trị tốt hơn (best WPM = max)
  - MigrateDialog component: sau đăng nhập detect localStorage data → hiện dialog → gọi API → xóa localStorage

- [ ] Verify: chơi guest → đăng ký → dữ liệu cũ xuất hiện trong account (cần database)

---

#### Task 2.2.4: Auth UI Integration

- [x] Header: hiện avatar + tên + nút "Đăng xuất" nếu đã đăng nhập (trong GameEngine.tsx)
- [x] Sync indicator: SyncIndicator component — "Đã lưu ☁️" / "Đang đồng bộ..." / "Offline 📴"
- [x] Protected routes: middleware.ts → /profile, /friends redirect nếu chưa đăng nhập
- [x] Public routes: / (play), /leaderboard → cho phép guest

- [ ] Verify: flow đăng nhập/đăng xuất mượt mà (cần database)

---

### Milestone 2: Kiểm tra toàn diện

- [ ] Đăng ký email + Google OAuth hoạt động
- [ ] Guest mode chơi được không cần đăng nhập
- [ ] Guest → Account migration thành công
- [ ] Chơi game → kết quả lưu PostgreSQL
- [ ] Offline fallback hoạt động (tắt mạng → vẫn chơi được)
- [ ] Settings sync giữa localStorage ↔ server
- [ ] API trả đúng format, có validation, có error handling
- [ ] Không lộ password/secret trong response

---

## GIAI ĐOẠN 3: LEADERBOARD + SOCIAL (1.5 tuần)

### Sprint 3.1 — Leaderboard (0.5 tuần)

#### Task 3.1.1: Leaderboard API

- [x] `api/leaderboard/route.ts`:
  - `GET` — Bảng xếp hạng toàn cầu
  - Query params: `?mode=classic&level=medium&period=weekly&limit=50&offset=0`
  - Period: `all` / `weekly` / `daily`
  - Trả về: rank, name (ẩn: 3 ký tự đầu + ***), avatar, wpm, accuracy, score
  - Cache Redis: TTL 5 phút

- [x] `api/leaderboard/friends/route.ts`:
  - `GET` — Xếp hạng bạn bè
  - Chỉ hiện users trong friendship list

- [ ] Verify: API trả đúng data, cache hoạt động

---

#### Task 3.1.2: Leaderboard Page (SSR)

- [x] `src/app/(social)/leaderboard/page.tsx`:
  - Server-side render cho SEO
  - Bảng xếp hạng: #rank, avatar, tên, WPM, accuracy
  - Filters: mode dropdown, level dropdown, period tabs (All / Weekly / Daily)
  - Highlight vị trí của user hiện tại
  - Tab: "Toàn cầu" / "Bạn bè"
  - Pagination

- [ ] Verify: trang load nhanh (SSR), filter hoạt động

---

### Sprint 3.2 — Profile & History (0.5 tuần)

#### Task 3.2.1: Public Profile Page

- [x] `src/app/(social)/profile/[id]/page.tsx`:
  - Avatar + tên
  - Best records (WPM, accuracy theo level)
  - Total games, total words, max streak
  - Achievement showcase (chỉ unlocked)
  - WPM chart (CSS bars) — 20 games gần nhất
  - Nút "Kết bạn" (nếu chưa là bạn)

- [ ] Verify: profile hiển thị đúng data, achievements render đẹp

---

### Sprint 3.3 — Friends (0.5 tuần)

#### Task 3.3.1: Friends API

- [x] `api/friends/route.ts`:
  - `GET` — Danh sách bạn bè (accepted)
  - `POST` — Gửi lời mời kết bạn (body: receiverId hoặc email)

- [x] `api/friends/[id]/route.ts`:
  - `PUT` — Chấp nhận lời mời
  - `DELETE` — Xóa bạn / từ chối lời mời

- [x] `api/friends/requests/route.ts`:
  - `GET` — Danh sách lời mời đang chờ (sent + received)

---

#### Task 3.3.2: Friends Page

- [x] `src/app/(social)/friends/page.tsx`:
  - Tab: "Bạn bè" / "Lời mời" / "Tìm bạn"
  - Danh sách bạn: avatar, tên, best WPM, last active
  - Lời mời: nút Chấp nhận / Từ chối
  - Tìm bạn: search by name/email
  - Nút "Thách đấu" (link đến multiplayer — giai đoạn 5)

- [ ] Verify: kết bạn flow hoàn chỉnh

---

### Milestone 3: Kiểm tra

- [ ] Leaderboard hiển thị đúng, filter + pagination hoạt động
- [ ] Tên trẻ em ẩn danh trên leaderboard (3 ký tự + ***)
- [ ] Profile page SSR, load nhanh
- [ ] Friend request → accept → thấy trong bạn bè
- [ ] Friends leaderboard chỉ hiện bạn bè

---

## GIAI ĐOẠN 4: CONTENT MANAGEMENT (1 tuần)

#### Task 4.1: WordPack CRUD API

- [ ] `api/wordpacks/route.ts`:
  - `GET` — Danh sách bộ từ (filter: language, level, category)
  - `POST` — Tạo bộ từ mới (admin/teacher only)

- [ ] `api/wordpacks/[id]/route.ts`:
  - `GET` — Chi tiết 1 bộ từ
  - `PUT` — Sửa (admin/teacher only)
  - `DELETE` — Xóa (admin only)

- [ ] Admin guard middleware: kiểm tra `role === 'ADMIN'`

---

#### Task 4.2: Seed Default Word Packs

- [ ] Cập nhật `prisma/seed.ts`:
  - Seed 3 default packs (easy/medium/hard) từ WORDS trong game-engine
  - Seed thêm 3 packs theo chủ đề: Animals, Food, School
  - Mỗi pack: 50-100 từ, có category tag

---

#### Task 4.3: Admin Dashboard (Basic)

- [ ] `src/app/admin/layout.tsx` — Admin layout với sidebar
- [ ] `src/app/admin/dashboard/page.tsx`:
  - Thống kê: tổng users, sessions hôm nay, WPM trung bình
  - Charts: sessions/ngày (7 ngày gần nhất), user growth

- [ ] `src/app/admin/words/page.tsx`:
  - Bảng danh sách word packs
  - CRUD: tạo / sửa / xóa
  - Import CSV
  - Preview: xem trước danh sách từ

- [ ] `src/app/admin/users/page.tsx`:
  - Bảng danh sách users (phân trang)
  - Actions: xem profile, ban/unban

---

#### Task 4.4: Frontend — Chọn Word Pack khi chơi

- [ ] Thêm vào SideNav: dropdown "Bộ từ" (bên cạnh Level select)
  - Default: "Mặc định" (dùng WORDS từ game-engine)
  - Danh sách word packs từ API
  - Filter theo level hiện tại

- [ ] Game engine: nhận words từ selected pack thay vì hardcode

---

### Milestone 4: Kiểm tra

- [ ] Admin dashboard hiển thị thống kê đúng
- [ ] CRUD word packs hoạt động
- [ ] Chọn word pack → game dùng từ đó
- [ ] Non-admin không truy cập được /admin

---

## GIAI ĐOẠN 5: MULTIPLAYER (2-3 tuần)

### Sprint 5.1 — Backend WebSocket (1 tuần)

#### Task 5.1.1: WebSocket Server Setup

Quyết định: dùng NestJS riêng (nếu cần scale) hoặc Socket.IO với Next.js custom server.

**Option A: NestJS (khuyến nghị cho scale)**

- [ ] Tạo `apps/api/` — NestJS project
  ```bash
  cd apps && pnpm dlx @nestjs/cli new api --strict --package-manager pnpm
  ```
- [ ] Install: `@nestjs/websockets @nestjs/platform-socket.io socket.io`
- [ ] Tạo `src/modules/multiplayer/multiplayer.gateway.ts`
- [ ] Tạo `src/modules/multiplayer/multiplayer.module.ts`
- [ ] Auth guard cho WebSocket (verify JWT)

**Option B: Socket.IO với Next.js (đơn giản hơn)**

- [ ] Custom server `apps/web/server.ts` với Socket.IO attach

---

#### Task 5.1.2: Race Room Manager

- [ ] `race-room.service.ts`:
  - State machine: `WAITING → COUNTDOWN → RACING → FINISHED`
  - `createRoom(hostUserId, level)` → room code (6 ký tự)
  - `joinRoom(code, userId)` → room state
  - `playerReady(roomId, userId)` → check tất cả ready → bắt đầu countdown
  - `startRace(roomId)` → gửi text + start signal
  - `updateProgress(roomId, userId, currentIndex)` → broadcast progress
  - `playerFinish(roomId, userId, result)` → tính rank
  - `closeRoom(roomId)` → cleanup

- [ ] Room settings:
  - Max players: 2-4
  - Auto-close sau 5 phút không hoạt động
  - Auto-close sau khi tất cả finish

- [ ] Lưu RaceRoom + RaceResult vào database khi race kết thúc

---

#### Task 5.1.3: Anti-cheat

- [ ] `anti-cheat.service.ts`:
  - Server gửi text → client phải gõ đúng text đó
  - Validate progress: currentIndex chỉ tăng, không nhảy
  - WPM cap: flag nếu > 200 WPM
  - Timing validation: khoảng cách giữa keystroke hợp lý (> 20ms)
  - Nếu phát hiện cheat → kick khỏi room + flag account

---

#### Task 5.1.4: WebSocket Events

```
Client → Server:
  create_room   { level: string }               → room_created { roomId, code }
  join_room     { code: string }                 → room_joined { room state }
  player_ready  { roomId: string }               → ready_status { readyPlayers }
  progress      { roomId, currentIndex, wpm }    → (broadcast)
  finish        { roomId, result: GameResult }   → (broadcast)
  leave_room    { roomId }                       → (broadcast)

Server → Client:
  room_created    { roomId, code, text }
  room_joined     { room state, players }
  player_joined   { userId, name, avatar }
  player_left     { userId }
  ready_status    { readyPlayers[] }
  countdown       { seconds: 3, 2, 1 }
  race_start      { text, startTime }
  progress_update { userId, currentIndex, wpm, accuracy }
  player_finished { userId, result, rank }
  race_end        { results: RaceResult[], winners }
  error           { code, message }
```

- [ ] Implement tất cả events
- [ ] Verify: 2 clients connect → tạo room → join → race → finish

---

### Sprint 5.2 — Frontend Multiplayer (1 tuần)

#### Task 5.2.1: Lobby UI

- [ ] `src/app/(multiplayer)/lobby/page.tsx`:
  - Hai nút lớn: "Tạo phòng" / "Tham gia phòng"
  - Tạo phòng: chọn level → nhận code 6 ký tự → hiện QR code / copy link
  - Tham gia: nhập code 6 ký tự
  - Public rooms list (optional): hiện phòng đang chờ

- [ ] Socket.IO client setup:
  ```typescript
  // src/lib/socket.ts
  import { io } from 'socket.io-client'
  export const socket = io(process.env.NEXT_PUBLIC_WS_URL, { autoConnect: false })
  ```

- [ ] `src/hooks/useMultiplayer.ts` — Hook quản lý socket connection + room state

---

#### Task 5.2.2: Race UI

- [ ] `src/app/(multiplayer)/race/[roomId]/page.tsx`:
  - Waiting state: danh sách players + nút "Sẵn sàng"
  - Countdown: 3... 2... 1... GO! (animation lớn)
  - Racing state:
    - Word display (giống game thường)
    - Progress bars cho mỗi player (tên, avatar, % hoàn thành, WPM)
    - Keyboard highlight
  - Finished state: bảng kết quả
    - Xếp hạng: 🥇🥈🥉
    - WPM, accuracy, thời gian từng người
    - Nút: "Chơi lại" / "Về lobby"

- [ ] `src/components/multiplayer/RaceTrack.tsx`:
  - Progress bar dạng "đường đua" cho mỗi player
  - Avatar di chuyển theo progress
  - Real-time update

- [ ] `src/components/multiplayer/PlayerList.tsx`:
  - Avatar + tên + trạng thái (ready/typing/finished)

- [ ] `src/components/multiplayer/CountdownTimer.tsx`:
  - 3-2-1-GO animation full screen

---

### Sprint 5.3 — Polish (0.5-1 tuần)

- [ ] Reconnection handling:
  - Mất kết nối → auto reconnect 3 lần
  - Nếu reconnect thành công → resume race
  - Nếu fail → hiện "Mất kết nối" + nút "Về lobby"

- [ ] Edge cases:
  - Host rời phòng → chuyển host cho người khác
  - Tất cả rời → auto close room
  - 1 người finish, người khác chưa → timeout 60s → kết thúc race
  - Player disconnect giữa race → đánh dấu DNF

- [ ] Spectator mode (optional):
  - Join room dạng spectator
  - Xem progress không gõ

- [ ] Race history:
  - Hiện lịch sử race trong profile
  - Win/loss record

---

### Milestone 5: Kiểm tra

- [ ] Tạo phòng → chia sẻ code → bạn join được
- [ ] 2-4 người đua → progress bars real-time
- [ ] Anti-cheat hoạt động: không thể gian lận WPM
- [ ] Disconnect → reconnect mượt
- [ ] Kết quả race lưu vào database
- [ ] Load test: 10 phòng đồng thời

---

## GIAI ĐOẠN 6: ANALYTICS & ADMIN (1 tuần)

#### Task 6.1: Admin Dashboard Nâng Cao

- [ ] Cập nhật `src/app/admin/dashboard/page.tsx`:
  - DAU / WAU / MAU charts
  - Sessions per day (30 ngày)
  - Average WPM trend
  - User registration trend
  - Top word packs (most played)
  - Active race rooms

---

#### Task 6.2: Teacher Dashboard

- [ ] `src/app/admin/classroom/page.tsx`:
  - Tạo lớp học (tên, mô tả)
  - Thêm học sinh (bằng email hoặc invite link)
  - Danh sách học sinh: avatar, tên, total games, best WPM, last active

- [ ] `src/app/admin/classroom/[id]/page.tsx`:
  - Tiến bộ từng học sinh: WPM chart, accuracy trend
  - Thống kê lớp: WPM trung bình, phân bố accuracy, chữ hay sai nhất
  - Giao bài tập: chọn word pack + level + deadline
  - Export report CSV

---

#### Task 6.3: Error Tracking & Monitoring

- [ ] Tích hợp Sentry:
  - `pnpm add @sentry/nextjs` trong apps/web
  - Cấu hình `sentry.client.config.ts` + `sentry.server.config.ts`
  - Source maps upload
  - Error boundaries trong React components

- [ ] Performance monitoring:
  - Vercel Analytics (tự động với Vercel deploy)
  - Custom metrics: game load time, keypress latency, API response time

---

#### Task 6.4: Heatmap phím sai (toàn hệ thống)

- [ ] API: aggregate `mistakeMap` từ tất cả GameSessions
  - `GET /api/analytics/mistake-heatmap?period=weekly`
  - Trả về: `{ "q": 1234, "z": 987, ... }`

- [ ] Admin dashboard: hiện heatmap trên keyboard layout
  - Phím sai nhiều → đỏ đậm
  - Phím sai ít → xanh nhạt

---

### Milestone 6: Kiểm tra

- [ ] Admin dashboard hiện đúng DAU/WAU/MAU
- [ ] Teacher tạo lớp → thêm học sinh → xem tiến bộ
- [ ] Sentry bắt errors trong production
- [ ] Mistake heatmap hiển thị chính xác

---

## Checklist bảo mật (áp dụng xuyên suốt)

- [ ] Không hardcode secrets — dùng `.env` + secret manager
- [ ] Input validation: Zod schema cho tất cả API body
- [ ] SQL injection: Prisma parameterized queries (mặc định)
- [ ] XSS: React auto-escape + không dùng `dangerouslySetInnerHTML`
- [ ] CSRF: NextAuth tích hợp
- [ ] Rate limiting: Upstash Redis trên tất cả API endpoints
- [ ] HTTP-only cookies cho JWT
- [ ] Helmet headers: CSP, HSTS, X-Frame-Options
- [ ] Ẩn danh trẻ em trên leaderboard
- [ ] Content moderation cho community word packs
- [ ] Anti-cheat multiplayer: server-side validation

---

## Checklist deploy

- [ ] Vercel: deploy `apps/web` (frontend + API routes)
- [ ] Railway: PostgreSQL production
- [ ] Upstash: Redis production
- [ ] Railway/Render: NestJS WebSocket server (giai đoạn 5)
- [ ] Environment variables set trên tất cả platforms
- [ ] Domain custom (nếu có)
- [ ] SSL certificates (tự động với Vercel + Railway)
- [ ] CI/CD: GitHub Actions → run tests → deploy on merge to main

---

## Testing strategy

| Loại | Công cụ | Phạm vi | Coverage |
|------|---------|---------|----------|
| Unit | Vitest | game-engine, scoring, words, achievements | ≥ 80% |
| Component | React Testing Library | Game UI, forms, modals | ≥ 70% |
| API | Vitest + supertest | Tất cả endpoints | ≥ 80% |
| E2E | Playwright | Đăng nhập → chơi → leaderboard → multiplayer | Critical paths |

---

> Tài liệu này là kế hoạch thực hiện chi tiết. Mỗi task có thể điều chỉnh tùy theo tiến độ thực tế. Luôn hoàn thành milestone kiểm tra trước khi sang giai đoạn tiếp theo.
