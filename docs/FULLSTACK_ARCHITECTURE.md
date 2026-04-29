# Typing Adventure - Fullstack Architecture Plan

> Tai lieu ky thuat xay dung he thong Backend + Frontend cho du an Typing Adventure
> Ngay tao: 2026-04-28

---

## Muc luc

1. [Phan tich hien trang](#1-phan-tich-hien-trang)
2. [Lua chon Tech Stack](#2-lua-chon-tech-stack)
3. [Kien truc he thong](#3-kien-truc-he-thong)
4. [Database Schema](#4-database-schema)
5. [API Design](#5-api-design)
6. [Authentication Flow](#6-authentication-flow)
7. [Chien luoc Migration](#7-chien-luoc-migration)
8. [Tinh nang moi](#8-tinh-nang-moi)
9. [Cau truc du an (Monorepo)](#9-cau-truc-du-an-monorepo)
10. [Lo trinh phat trien](#10-lo-trinh-phat-trien)
11. [Bao mat & Performance](#11-bao-mat--performance)

---

## 1. Phan tich hien trang

### 1.1 Tong quan

| Thuoc tinh        | Chi tiet                                                    |
| ----------------- | ----------------------------------------------------------- |
| **Loai**          | Ung dung luyen go phim (Typing Practice Game)               |
| **Cong nghe**     | Vanilla HTML + CSS + JavaScript (khong framework)           |
| **Kich thuoc**    | ~145KB tong code (3 file chinh)                             |
| **Phu thuoc**     | Khong co thu vien ben ngoai                                 |
| **Luu tru**       | localStorage (5 key: settings, history, records, achievements, profile) |
| **Ngon ngu**      | Song ngu Tieng Viet / English (190+ chuoi dich)             |

### 1.2 Cac file chinh

```
keyboad_with_sound/
  index.html    (~350 dong)   - HTML markup toan bo giao dien
  app.js        (~2200 dong)  - Toan bo logic: game engine, audio, i18n, UI
  style.css     (~2150 dong)  - Styling, 3 theme, responsive, animations
```

### 1.3 Tinh nang da co

**4 che do choi:**
- Classic - Go tu theo danh sach
- Lesson - Luyen tung hang phim (Home Row, Top Row, Bottom Row...)
- Time Attack - Dua toc do (30s / 60s / 120s)
- Challenge - 3 mang song, mat mang khi sai nhieu

**3 muc do kho:** Easy / Medium / Hard

**He thong am thanh:**
- SoundEngine (Web Audio API) - Am hieu khi go dung/sai
- SpeechEngine (Web Speech API) - Doc chu cai / doc tu

**Gamification:**
- 16 thanh tich (achievements)
- He thong combo + nhan diem
- Xep hang sao (1-3 sao)
- Day streak (chuoi ngay lien tuc)

**Giao dien:**
- Ban phim QWERTY voi huong dan 9 ngon tay (mau sac)
- SVG ban tay huong dan
- 3 theme: Dark / Light / Colorful
- Responsive (mobile/tablet/desktop)
- 20+ animation CSS

**Du lieu theo doi:**
- WPM, CPS, Accuracy, Score, Combo
- Lich su 100 tran gan nhat voi bieu do SVG
- Profile (ten + avatar emoji)
- De xuat do kho tu dong (adaptive difficulty)

### 1.4 Han che cua phien ban hien tai

| Van de                         | Giai phap fullstack                    |
| ------------------------------ | -------------------------------------- |
| Du lieu mat khi xoa browser    | Luu tren server (PostgreSQL)           |
| Khong co tai khoan nguoi dung  | Auth system (dang ky / dang nhap)      |
| Khong co bang xep hang         | Leaderboard toan cau                   |
| Khong the choi cung ban be     | Multiplayer typing race                |
| Noi dung tu co dinh            | Quan ly word packs (Admin CMS)         |
| Khong theo doi lop hoc         | Teacher dashboard                      |
| Code lon trong 1 file JS       | Tach module, component-based           |

---

## 2. Lua chon Tech Stack

### 2.1 Bang tong hop

| Thanh phan        | Cong nghe              | Ly do                                             |
| ----------------- | ---------------------- | ------------------------------------------------- |
| **Frontend**      | Next.js 14+ (App Router) | SSR cho SEO, CSR cho game, API Routes tich hop   |
| **UI Library**    | React + TypeScript     | Ecosystem lon, type safety, de tuyen nguoi        |
| **Styling**       | Tailwind CSS           | Nhanh, responsive, theme tot                      |
| **State**         | Zustand                | Nhe, API don gian, tuong tu state object hien tai |
| **Backend (v1)**  | Next.js API Routes     | Khong can server rieng, deploy Vercel don gian    |
| **Backend (v2)**  | NestJS                 | WebSocket cho multiplayer, module architecture    |
| **Database**      | PostgreSQL + Prisma    | Relational phu hop, Prisma auto-gen types         |
| **Auth**          | NextAuth.js (Auth.js v5) | Tich hop Next.js, OAuth + Credentials           |
| **Real-time**     | Socket.IO              | Multiplayer typing race                           |
| **Cache**         | Upstash Redis          | Leaderboard cache, rate limiting                  |
| **i18n**          | next-intl              | Tich hop Next.js, ho tro vi/en                    |
| **Chart**         | Recharts               | React-native, thay the SVG chart tu viet          |
| **Deploy**        | Vercel + Railway       | Vercel (frontend), Railway (PostgreSQL)           |
| **Testing**       | Vitest + Playwright    | Unit tests + E2E tests                            |

### 2.2 Giai thich lua chon

**Tai sao Next.js ma khong phai Vite+React?**
- API Routes tich hop = khong can setup backend rieng giai doan dau
- SSR cho trang Landing, Leaderboard, Profile (tot cho SEO)
- Deploy Vercel zero-config
- i18n routing co san

**Tai sao PostgreSQL ma khong phai MongoDB?**
- Du lieu co cau truc ro: users -> sessions -> achievements -> leaderboards
- Quan he nhieu (relational) phu hop hon document store
- Van co JSON column cho settings linh hoat
- Full-text search cho word packs

**Tai sao Zustand ma khong phai Redux?**
- API tuong tu `state` object hien tai trong app.js
- Khong boilerplate, nhe, nhanh
- Perfect cho game state can update lien tuc

**Tai sao Tailwind CSS?**
- Chuyen tu CSS custom properties hien tai sang Tailwind tokens de dang
- Dark mode / theming tich hop san
- Responsive utilities nhanh

---

## 3. Kien truc he thong

### 3.1 So do tong quan

```
+------------------+          +------------------------+
|   Browser Client |          |      Vercel Edge       |
|                  |   HTTPS  |                        |
|  Next.js App     | <------> |  Next.js API Routes    |
|  (React + TS)    |          |  (REST API)            |
|                  |          |                        |
|  - Game Engine   |          |  - Auth (NextAuth)     |
|  - Sound Engine  |          |  - CRUD Operations     |
|  - Keyboard UI   |          |  - Leaderboard Logic   |
|  - i18n          |          |  - Achievement Check   |
+------------------+          +----------+-------------+
                                         |
                              +----------+-------------+
                              |                        |
                    +---------+------+    +------------+-------+
                    |  PostgreSQL    |    |  Upstash Redis     |
                    |  (Railway)     |    |  (Cache + Rate     |
                    |                |    |   Limiting)        |
                    |  - Users       |    +--------------------+
                    |  - Sessions    |
                    |  - Records     |
                    |  - Achievements|
                    |  - WordPacks   |
                    |  - Friendships |
                    +----------------+

--- Giai doan sau (Multiplayer) ---

+------------------+          +------------------------+
|   Browser Client |   WSS    |  NestJS Server         |
|                  | <------> |  (Railway/Render)      |
|  Socket.IO Client|          |  - WebSocket Gateway   |
|                  |          |  - Race Room Manager   |
|  - Race UI       |          |  - Anti-cheat          |
|  - Progress Bar  |          |  - Real-time Sync      |
+------------------+          +------------------------+
```

### 3.2 Frontend Architecture - Component Tree

```
src/
  app/                              # Next.js App Router
    (auth)/
      login/page.tsx                # Trang dang nhap
      register/page.tsx             # Trang dang ky
      layout.tsx
    (game)/
      play/page.tsx                 # Trang game chinh (CSR)
      practice/page.tsx             # Luyen ky tu yeu
      layout.tsx
    (social)/
      leaderboard/page.tsx          # Bang xep hang (SSR)
      profile/[id]/page.tsx         # Profile cong khai (SSR)
      friends/page.tsx              # Danh sach ban be
    (multiplayer)/
      lobby/page.tsx                # Phong cho
      race/[roomId]/page.tsx        # Phong dua
    admin/
      dashboard/page.tsx            # Thong ke
      words/page.tsx                # Quan ly word packs
      users/page.tsx                # Quan ly users
    layout.tsx                      # Root layout
    page.tsx                        # Landing page (SSR)

  components/
    game/
      GameEngine.tsx                # Core game logic (tu handleKey, finishGame)
      WordDisplay.tsx               # Hien thi tu voi highlight ky tu
      Keyboard.tsx                  # Ban phim QWERTY visualization
      HandGuide.tsx                 # SVG ban tay + huong dan ngon tay
      StatsBar.tsx                  # WPM, CPS, Accuracy, Score, Timer
      ComboDisplay.tsx              # Bo dem combo + milestones
      LivesDisplay.tsx              # Mang song (Challenge mode)
      CelebrationModal.tsx          # Man ket qua cuoi game
    ui/
      Button.tsx
      Select.tsx
      Modal.tsx
      Toggle.tsx
      Tooltip.tsx
      StarRating.tsx
    layout/
      Navbar.tsx
      SideNav.tsx
      QuickActions.tsx
    settings/
      SettingsPanel.tsx
      ProfileSection.tsx
      ThemeSelector.tsx
    history/
      HistoryPanel.tsx
      WpmChart.tsx                  # Bieu do WPM (Recharts)
      TrendIndicator.tsx
    achievements/
      AchievementGrid.tsx
      AchievementPopup.tsx
    multiplayer/
      RaceTrack.tsx
      PlayerList.tsx
      CountdownTimer.tsx

  lib/
    game/
      engine.ts                     # Pure game logic (khong DOM)
      words.ts                      # Tu vung + generators
      scoring.ts                    # Tinh diem, sao, combo
      achievements.ts               # Dinh nghia + kiem tra thanh tich
      keyboard-layout.ts            # KEYBOARD_ROWS + finger mapping
    audio/
      sound-engine.ts               # SoundEngine class (giu nguyen)
      speech-engine.ts              # SpeechEngine class (giu nguyen)
    i18n/
      translations.ts               # LANG object (giu nguyen noi dung)
    api/
      client.ts                     # API client (fetch wrapper)
      auth.ts                       # Auth API calls
      sessions.ts                   # Game session API
      leaderboard.ts                # Leaderboard API

  stores/
    game-store.ts                   # Zustand - game state
    settings-store.ts               # Zustand - settings
    auth-store.ts                   # Zustand - auth state

  hooks/
    useGameEngine.ts                # Hook bao game logic
    useKeyboardInput.ts             # Xu ly su kien ban phim
    useSound.ts                     # Sound engine hook
    useTimer.ts                     # Timer logic
    useLocalStorage.ts              # Offline fallback

  styles/
    themes/
      dark.css
      light.css
      colorful.css
```

### 3.3 Backend Architecture - Service Layers

```
Next.js API Routes (giai doan 1-3):

  src/app/api/
    auth/
      [...nextauth]/route.ts        # NextAuth handler
      register/route.ts             # POST - dang ky
    users/
      me/route.ts                   # GET/PUT - profile cua minh
      me/settings/route.ts          # PUT - cap nhat settings
      [id]/route.ts                 # GET - profile cong khai
    sessions/
      route.ts                      # GET (lich su) / POST (luu game)
      stats/route.ts                # GET - thong ke tong hop
    achievements/
      route.ts                      # GET - danh sach + trang thai
      check/route.ts                # POST - kiem tra & mo khoa
    leaderboard/
      route.ts                      # GET - bang xep hang (filter)
      friends/route.ts              # GET - xep hang ban be
    friends/
      route.ts                      # GET (danh sach) / POST (gui loi moi)
      [id]/route.ts                 # PUT (chap nhan) / DELETE (xoa)
    wordpacks/
      route.ts                      # GET (danh sach) / POST (tao - admin)
      [id]/route.ts                 # PUT / DELETE (admin)

--- NestJS (giai doan 4+ cho multiplayer) ---

  src/
    modules/
      auth/                         # Guards, JWT strategy
      users/                        # User CRUD
      sessions/                     # Game session service
      achievements/                 # Achievement logic
      leaderboard/                  # Leaderboard queries
      friends/                      # Friend system
      wordpacks/                    # Content management
      multiplayer/                  # WebSocket gateway
        multiplayer.gateway.ts      # Socket.IO events
        race-room.service.ts        # Room state machine
        anti-cheat.service.ts       # Server-side validation
    common/
      guards/                       # Auth guard, Admin guard
      interceptors/                 # Logging, Transform
      pipes/                        # Validation pipe
```

---

## 4. Database Schema

### 4.1 Entity Relationship

```
User (1) -----> (*) GameSession
User (1) -----> (1) UserRecord
User (1) -----> (*) UserAchievement
User (1) -----> (*) Friendship (initiator)
User (1) -----> (*) Friendship (receiver)
User (1) -----> (*) RaceResult
RaceRoom (1) --> (*) RaceResult
```

### 4.2 Prisma Schema

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// USER
// ============================================
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  passwordHash    String?                        // null khi dung OAuth
  name            String?
  avatar          String    @default("🧒")
  role            Role      @default(USER)

  // OAuth
  provider          String?                      // "google", "github"
  providerAccountId String?

  // Settings (JSON linh hoat)
  settings        Json      @default("{}")
  // Bao gom: theme, keyboardCase, soundMode, soundEnabled,
  //          speechRate, wordCount, fingerGuide, lang

  // Relations
  sessions          GameSession[]
  achievements      UserAchievement[]
  records           UserRecord?
  friendsInitiated  Friendship[]   @relation("FriendInitiator")
  friendsReceived   Friendship[]   @relation("FriendReceiver")
  raceResults       RaceResult[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([email])
}

enum Role {
  USER
  ADMIN
}

// ============================================
// GAME SESSION - Moi tran choi
// ============================================
model GameSession {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Boi canh game
  gameMode      String                           // "classic", "lesson", "timeAttack", "challenge"
  level         String                           // "easy", "medium", "hard"
  lessonIndex   Int?                             // Chi cho lesson mode

  // Ket qua
  wpm           Int
  cps           Float
  accuracy      Int                              // 0-100
  score         Int
  stars         Int                              // 1-3

  // Chi tiet
  timeSeconds   Float
  wordCount     Int
  maxCombo      Int       @default(0)
  mistakeMap    Json      @default("{}")          // { "q": 3, "z": 2 }
  textContent   String?                          // Noi dung da go (cho replay)

  createdAt     DateTime  @default(now())

  @@index([userId, createdAt(sort: Desc)])
  @@index([gameMode, level])
  @@index([wpm(sort: Desc)])                     // Cho leaderboard
}

// ============================================
// USER RECORD - Ky luc ca nhan
// ============================================
model UserRecord {
  id            String    @id @default(cuid())
  userId        String    @unique
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Best scores theo level (JSON)
  bestWpm       Json      @default("{\"easy\": 0, \"medium\": 0, \"hard\": 0}")
  bestAccuracy  Json      @default("{\"easy\": 0, \"medium\": 0, \"hard\": 0}")
  bestScore     Json      @default("{\"easy\": 0, \"medium\": 0, \"hard\": 0}")

  totalGames    Int       @default(0)
  totalWords    Int       @default(0)
  dayStreak     Int       @default(0)
  maxDayStreak  Int       @default(0)
  lastPlayDate  DateTime?

  updatedAt     DateTime  @updatedAt
}

// ============================================
// ACHIEVEMENTS - Thanh tich da mo khoa
// ============================================
model UserAchievement {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  achievementId   String                         // "first_game", "wpm_40", etc.
  unlockedAt      DateTime  @default(now())

  @@unique([userId, achievementId])
  @@index([userId])
}

// ============================================
// FRIENDSHIP - He thong ban be
// ============================================
model Friendship {
  id            String        @id @default(cuid())
  initiatorId   String
  initiator     User          @relation("FriendInitiator", fields: [initiatorId], references: [id])
  receiverId    String
  receiver      User          @relation("FriendReceiver", fields: [receiverId], references: [id])
  status        FriendStatus  @default(PENDING)

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@unique([initiatorId, receiverId])
  @@index([receiverId, status])
}

enum FriendStatus {
  PENDING
  ACCEPTED
  BLOCKED
}

// ============================================
// WORD PACKS - Bo tu vung
// ============================================
model WordPack {
  id            String    @id @default(cuid())
  name          String
  description   String?
  language      String    @default("en")
  level         String                           // "easy", "medium", "hard"
  words         String[]                         // Mang cac tu
  category      String?                          // "animals", "food", "school"
  isDefault     Boolean   @default(false)
  createdBy     String?                          // Admin userId

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([language, level])
}

// ============================================
// MULTIPLAYER - Phong dua (giai doan sau)
// ============================================
model RaceRoom {
  id            String      @id @default(cuid())
  code          String      @unique              // Ma phong 6 ky tu
  text          String                           // Van ban de go
  level         String
  maxPlayers    Int         @default(4)
  status        RaceStatus  @default(WAITING)
  results       RaceResult[]

  createdAt     DateTime    @default(now())
  startedAt     DateTime?
  endedAt       DateTime?
}

enum RaceStatus {
  WAITING
  COUNTDOWN
  RACING
  FINISHED
}

model RaceResult {
  id            String    @id @default(cuid())
  roomId        String
  room          RaceRoom  @relation(fields: [roomId], references: [id], onDelete: Cascade)
  userId        String
  user          User      @relation(fields: [userId], references: [id])

  wpm           Int
  accuracy      Int
  position      Int                              // Thu hang (1st, 2nd...)
  finishTime    Float?                           // Giay de hoan thanh (null = DNF)

  createdAt     DateTime  @default(now())

  @@unique([roomId, userId])
}
```

---

## 5. API Design

### 5.1 REST API Endpoints

```
# ============ AUTH ============
POST   /api/auth/register           # Dang ky (email + password)
POST   /api/auth/login              # Dang nhap
POST   /api/auth/[provider]         # OAuth (Google, GitHub)
GET    /api/auth/me                 # Thong tin user hien tai
POST   /api/auth/logout             # Dang xuat
POST   /api/auth/migrate            # Sync localStorage -> server (guest -> account)

# ============ USER ============
GET    /api/users/:id               # Profile cong khai
PUT    /api/users/me                # Cap nhat profile (ten, avatar)
PUT    /api/users/me/settings       # Cap nhat settings

# ============ GAME SESSION ============
POST   /api/sessions                # Luu ket qua tran choi
GET    /api/sessions                # Lich su cua minh (phan trang)
GET    /api/sessions/stats          # Thong ke tong hop (best WPM, streak...)

# ============ ACHIEVEMENTS ============
GET    /api/achievements            # Tat ca thanh tich + trang thai mo khoa
POST   /api/achievements/check      # Kiem tra & mo khoa thanh tich moi

# ============ LEADERBOARD ============
GET    /api/leaderboard             # Bang xep hang toan cau
       ?mode=classic                # Filter: game mode
       &level=medium                # Filter: muc do
       &period=weekly               # Filter: all / weekly / daily
       &limit=50&offset=0           # Phan trang
GET    /api/leaderboard/friends     # Xep hang chi ban be

# ============ FRIENDS ============
GET    /api/friends                 # Danh sach ban be
POST   /api/friends/request         # Gui loi moi ket ban
PUT    /api/friends/:id/accept      # Chap nhan loi moi
DELETE /api/friends/:id             # Xoa ban / tu choi

# ============ WORD PACKS ============
GET    /api/wordpacks               # Danh sach bo tu
POST   /api/wordpacks               # Tao bo tu (admin only)
PUT    /api/wordpacks/:id           # Sua bo tu (admin only)
DELETE /api/wordpacks/:id           # Xoa bo tu (admin only)

# ============ MULTIPLAYER (WebSocket) ============
WS     /ws/race                     # Tham gia / tao phong dua
       event: create_room           # Tao phong moi
       event: join_room             # Tham gia phong
       event: player_ready          # San sang
       event: race_start            # Bat dau (countdown 3-2-1)
       event: progress_update       # Cap nhat tien do real-time
       event: race_finish           # Hoan thanh
       event: room_closed           # Phong dong
```

### 5.2 Response Format

```json
// Thanh cong
{
  "success": true,
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}

// Loi
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email da ton tai"
  }
}
```

---

## 6. Authentication Flow

### 6.1 Guest Mode (khong can dang nhap)

```
1. Nguoi dung mo app -> choi ngay
2. Du lieu luu localStorage nhu hien tai
3. Hien nut "Dang nhap de luu tien bo cua ban"
4. Khi dang ky/dang nhap:
   POST /api/auth/migrate { localHistory, localRecords, localAchievements }
   -> Server merge du lieu localStorage vao account
   -> Xoa localStorage cu
```

### 6.2 Dang ky Email

```
POST /api/auth/register
Body: { email, password, name, avatar }

Server:
  1. Validate email format + password strength
  2. Hash password (bcrypt, saltRounds=12)
  3. Tao User + UserRecord
  4. Tao JWT token
  5. Set HTTP-only cookie (bao mat hon localStorage)
  6. Tra ve user info
```

### 6.3 OAuth (Google)

```
1. Client click "Dang nhap voi Google"
2. Redirect -> Google OAuth consent screen
3. Google callback -> /api/auth/callback/google
4. Server: Tim user theo providerAccountId
   - Neu co: dang nhap
   - Neu chua: tao user moi
5. Set JWT cookie
6. Redirect ve app
```

### 6.4 Session Management

```
- JWT luu trong HTTP-only cookie (bao mat)
- Access token: het han sau 1 gio
- Refresh token: het han sau 7 ngay
- Refresh token rotation (moi lan refresh tao token moi)
- API middleware verify JWT truoc moi request
```

---

## 7. Chien luoc Migration

### 7.1 Code GIU NGUYEN (chi can copy + chuyen sang TypeScript)

| Module                | Vi tri hien tai   | Ly do giu                          |
| --------------------- | ----------------- | ---------------------------------- |
| SoundEngine class     | app.js:508-572    | Pure Web Audio API, khong phu thuoc DOM |
| SpeechEngine class    | app.js:575-619    | Pure Web Speech API                |
| KEYBOARD_ROWS layout  | app.js:307-372    | Data structure, framework-agnostic |
| WORDS object          | app.js:207-227    | Chuyen sang DB nhung giu lam seed  |
| ACHIEVEMENTS dinh nghia | app.js:375-395  | Logic + data, chi thay storage     |
| LANG i18n object      | app.js:1-192      | Giu noi dung, chuyen sang next-intl |
| KEY_FINGER_MAP        | app.js:2118-2125  | Data mapping                       |
| Score/Star calculation | app.js:959-964   | Pure functions                     |
| Word generators       | app.js:262-304    | generateLessonWords, generateChallengeWords |

### 7.2 Code CAN VIET LAI

| Module                  | Ly do                                      |
| ----------------------- | ------------------------------------------ |
| Storage object          | Thay localStorage -> API calls + Zustand   |
| DOM manipulation        | Chuyen sang React components               |
| Event listeners         | React event handlers + custom hooks        |
| applyLanguage()         | Dung next-intl thay vi manual DOM update   |
| Theme switching         | Tailwind dark mode / CSS variables         |
| Celebration/History UI  | React Modal components                     |
| SVG Chart               | Recharts (hoac giu SVG custom)             |
| CSS toan bo             | Tailwind CSS + CSS Modules                 |

### 7.3 Buoc migration cu the

```
Buoc 1: Extract pure logic
  - Tach game engine logic ra khoi DOM code
  - Tao lib/game/engine.ts voi pure functions:
    processKeypress(), calculateScore(), checkAchievements()
  - Tao lib/game/words.ts, lib/audio/sound-engine.ts, speech-engine.ts

Buoc 2: React components mirror cau truc HTML hien tai
  - index.html: SideNav -> Header -> Main -> Modals
  - Moi section = 1 React component
  - Game state -> Zustand store

Buoc 3: Data layer (Offline-first)
  - Ghi localStorage TRUOC, sync len server SAU (background)
  - Neu khong co mang: fallback localStorage
  - Quan trong cho hoc sinh o vung internet khong on dinh
```

---

## 8. Tinh nang moi

### 8.1 User Registration / Login
- Email + password (cho phu huynh / giao vien)
- Google OAuth (cho hoc sinh co Google Classroom)
- Guest mode (choi ngay khong can dang nhap)
- Migration wizard: guest dang ky -> import du lieu localStorage

### 8.2 Cloud Save / Sync
- Offline-first: luu localStorage truoc, sync khi co mang
- Conflict resolution: server wins (latest timestamp)
- UI indicator: "Da luu" / "Dang dong bo..."

### 8.3 Global Leaderboard
- Xep hang theo: WPM, Score, Accuracy
- Filter: All time / Weekly / Daily
- Filter: Game mode + Level
- An danh tre em: chi hien 3 ky tu dau ten + ***

### 8.4 Friend System
- Tim ban qua username hoac invite link
- Leaderboard rieng giua nhom ban be
- Thach dau typing race

### 8.5 Multiplayer Typing Race
- Phong choi 2-4 nguoi
- Real-time progress bar cua moi nguoi choi
- Countdown 3-2-1 truoc khi bat dau
- Ket qua: xep hang, WPM, accuracy
- Public rooms + Private rooms (ma 6 ky tu)

### 8.6 Content Management (Word Packs)
- Admin dashboard quan ly bo tu vung
- Phan loai theo chu de: dong vat, do an, truong hoc, khoa hoc...
- Giao vien tao bo tu rieng cho lop
- Import/export CSV

### 8.7 Admin Dashboard
- Thong ke: so nguoi dung, sessions/ngay, WPM trung binh
- Quan ly users: ban, reset password
- Quan ly word packs
- Bao cao noi dung

### 8.8 Teacher Dashboard (Classroom)
- Tao lop hoc, them hoc sinh
- Theo doi tien bo tung hoc sinh
- Giao bai tap (word pack + muc do)
- Xem thong ke lop: WPM trung binh, accuracy, phan bo

### 8.9 Analytics
- Heatmap: phim nao hay sai nhat (toan he thong)
- User retention: DAU / WAU / MAU
- Game completion rate
- Drop-off analysis

---

## 9. Cau truc du an (Monorepo)

### 9.1 Layout

```
typing-adventure/
  package.json                     # Root package.json
  pnpm-workspace.yaml              # pnpm workspaces config
  turbo.json                       # Turborepo (optional, tang toc build)
  .env.example                     # Mau bien moi truong
  docker-compose.yml               # PostgreSQL + Redis local
  README.md

  apps/
    web/                           # Next.js frontend + API Routes
      package.json
      next.config.ts
      tsconfig.json
      tailwind.config.ts
      src/
        app/                       # Pages (App Router)
        components/                # React components
        hooks/                     # Custom hooks
        stores/                    # Zustand stores
        styles/                    # CSS
        lib/                       # Utilities, API client
      public/

    api/                           # NestJS backend (giai doan 4+)
      package.json                 # Chi can khi lam multiplayer
      tsconfig.json
      src/
        modules/                   # Feature modules
        common/                    # Shared (guards, pipes...)
        main.ts

  packages/
    game-engine/                   # Shared game logic (pure TypeScript)
      package.json
      src/
        engine.ts                  # Core game state machine
        words.ts                   # Tu vung + generators
        scoring.ts                 # Tinh diem, sao, combo
        achievements.ts            # Thanh tich
        keyboard.ts                # Keyboard layout data
        types.ts                   # Shared types

    i18n/                          # Shared translations
      package.json
      src/
        vi.ts                      # Tieng Viet
        en.ts                      # English

    db/                            # Prisma schema + client
      package.json
      prisma/
        schema.prisma
        migrations/
        seed.ts                    # Seed data (word packs mac dinh)
      src/
        client.ts
```

### 9.2 Ly do chon Monorepo

- `packages/game-engine` dung chung cho frontend VA backend (validate score server-side)
- `packages/db` chia se Prisma client
- `packages/i18n` chia se translations
- Turborepo cache giup build nhanh
- 1 repo duy nhat de quan ly

---

## 10. Lo trinh phat trien

### GIAI DOAN 1: NEN TANG (2-3 tuan)
> Muc tieu: Game chay duoc tren React, cung cau truc moi

**Sprint 1.1 - Setup & Core Migration (1 tuan)**
- [ ] Init monorepo (pnpm + Turborepo)
- [ ] Setup Next.js app (TypeScript + Tailwind CSS)
- [ ] Extract `packages/game-engine`: words, scoring, keyboard, achievements, types
- [ ] Extract `packages/i18n`: vi.ts, en.ts
- [ ] Tao Zustand stores: game-store, settings-store
- [ ] Migrate SoundEngine va SpeechEngine sang `lib/audio/`

**Sprint 1.2 - React Components (1 tuan)**
- [ ] GameEngine.tsx + useGameEngine hook
- [ ] WordDisplay.tsx (tu renderText)
- [ ] Keyboard.tsx (tu buildKeyboard)
- [ ] HandGuide.tsx (SVG hands)
- [ ] StatsBar.tsx (WPM, CPS, Accuracy, Score, Timer)
- [ ] CelebrationModal.tsx (tu finishGame UI)
- [ ] SideNav.tsx + SettingsPanel.tsx

**Sprint 1.3 - Theme & i18n (0.5 tuan)**
- [ ] Tailwind themes (dark/light/colorful)
- [ ] next-intl setup
- [ ] Responsive layout

### GIAI DOAN 2: BACKEND + AUTH (2 tuan)
> Muc tieu: Tai khoan nguoi dung, luu du lieu len cloud

**Sprint 2.1 - Database & API (1 tuan)**
- [ ] Setup PostgreSQL (Docker local + Railway production)
- [ ] Prisma schema + migrations
- [ ] API Routes: /api/sessions, /api/users, /api/achievements
- [ ] API client trong frontend

**Sprint 2.2 - Authentication (1 tuan)**
- [ ] NextAuth.js: Credentials + Google OAuth
- [ ] Trang Login / Register
- [ ] Guest mode (localStorage fallback)
- [ ] Guest-to-Account migration
- [ ] Protected routes middleware

### GIAI DOAN 3: LEADERBOARD + SOCIAL (1.5 tuan)
> Muc tieu: Tinh nang xa hoi, tang tuong tac

**Sprint 3.1 - Leaderboard (0.5 tuan)**
- [ ] API leaderboard (phan trang, filter)
- [ ] Trang leaderboard (SSR)
- [ ] Filters: mode, level, timeframe

**Sprint 3.2 - Profile & History (0.5 tuan)**
- [ ] Trang profile cong khai
- [ ] History voi bieu do WPM (Recharts)
- [ ] Achievement showcase

**Sprint 3.3 - Friends (0.5 tuan)**
- [ ] Friend request API
- [ ] Friends leaderboard
- [ ] Activity feed

### GIAI DOAN 4: CONTENT MANAGEMENT (1 tuan)
> Muc tieu: Mo rong noi dung, quan ly tu vung

- [ ] WordPack model + CRUD API
- [ ] Seed default word packs
- [ ] Admin dashboard (basic)
- [ ] Frontend: chon word pack khi choi
- [ ] Community word packs (giao vien tao)

### GIAI DOAN 5: MULTIPLAYER (2-3 tuan)
> Muc tieu: Dua go phim real-time

**Sprint 5.1 - Backend WebSocket (1 tuan)**
- [ ] NestJS setup (hoac Socket.IO voi Next.js)
- [ ] WebSocket gateway: room management
- [ ] Race state machine: WAITING -> COUNTDOWN -> RACING -> FINISHED
- [ ] Anti-cheat: server-side validation

**Sprint 5.2 - Frontend Multiplayer (1 tuan)**
- [ ] Lobby UI
- [ ] Race UI: real-time progress bars
- [ ] Countdown animation
- [ ] Results screen

**Sprint 5.3 - Polish (0.5-1 tuan)**
- [ ] Reconnection handling
- [ ] Spectator mode
- [ ] Race history

### GIAI DOAN 6: ANALYTICS & ADMIN (1 tuan)
> Muc tieu: Quan ly he thong, theo doi

- [ ] Admin dashboard: user stats, DAU, word packs
- [ ] Teacher view: tien bo hoc sinh
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring

### Tong thoi gian uoc tinh: 10-12 tuan

```
Giai doan 1: NEN TANG              |████████████|          2-3 tuan
Giai doan 2: BACKEND + AUTH        |████████|              2 tuan
Giai doan 3: LEADERBOARD + SOCIAL  |██████|                1.5 tuan
Giai doan 4: CONTENT MANAGEMENT    |████|                  1 tuan
Giai doan 5: MULTIPLAYER           |████████████|          2-3 tuan
Giai doan 6: ANALYTICS & ADMIN     |████|                  1 tuan
```

---

## 11. Bao mat & Performance

### 11.1 Bao mat

**Bao ve tre em:**
- Khong hien email day du tren leaderboard (chi 3 ky tu dau + ***)
- Rate limiting tren API (chong spam/abuse)
- Content moderation cho community word packs
- COPPA compliance neu target US children

**Bao mat chung:**
- Input sanitization (XSS prevention)
- SQL injection prevention (Prisma parameterized queries)
- CSRF protection (NextAuth tich hop)
- HTTP-only cookies cho JWT
- Rate limiting (Upstash Redis)
- Helmet headers (CSP, HSTS, X-Frame-Options)

**Anti-cheat (Multiplayer):**
- Server-side validation: so sanh WPM voi text server gui
- Phat hien input bat thuong (WPM > 200 = flag)
- Replay verification

### 11.2 Performance

**Frontend:**
- Game engine PHAI chay 60fps
- Lazy load multiplayer module
- Next.js Image optimization
- Code splitting theo route

**Backend:**
- API caching: Redis cho leaderboard (TTL 5 phut)
- Database indexing (da dinh nghia trong schema)
- Connection pooling (Prisma)
- Pagination cho tat ca list endpoints

**Offline Support:**
- Service Worker cho PWA
- localStorage lam first-level cache
- Background sync khi co mang
- IndexedDB cho du lieu lon

### 11.3 Testing

| Loai test          | Cong cu                | Pham vi                              |
| ------------------ | ---------------------- | ------------------------------------ |
| Unit tests         | Vitest                 | game-engine package, scoring, words  |
| Component tests    | React Testing Library  | Components chinh (game, UI)          |
| API tests          | Vitest + supertest     | Tat ca API endpoints                 |
| E2E tests          | Playwright             | Dang nhap -> choi -> leaderboard     |

---

## Phu luc: So sanh truoc va sau

| Khia canh      | Hien tai (Vanilla)          | Fullstack (Moi)                      |
| -------------- | --------------------------- | ------------------------------------ |
| Frontend       | 1 file HTML + 1 file JS    | Next.js + React + TypeScript         |
| Backend        | Khong co                    | Next.js API / NestJS                 |
| Database       | localStorage               | PostgreSQL + Redis                   |
| Auth           | Khong co                    | NextAuth (email + OAuth)             |
| Deploy         | Static file                 | Vercel + Railway                     |
| i18n           | Manual DOM update           | next-intl (tu dong)                  |
| State          | Global object               | Zustand stores                       |
| Styling        | 1 file CSS                  | Tailwind CSS + CSS Modules           |
| Testing        | Khong co                    | Vitest + Playwright                  |
| Multiplayer    | Khong co                    | Socket.IO real-time                  |
| Leaderboard    | Khong co                    | Global + Friends ranking             |
| Content        | Hardcode trong JS           | WordPack CMS (admin)                 |
| Analytics      | Khong co                    | Dashboard + Teacher view             |

---

> Tai lieu nay la co so de bat dau xay dung. Moi giai doan co the dieu chinh tuy theo tien do thuc te.
