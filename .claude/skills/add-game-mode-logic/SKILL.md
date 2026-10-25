---
name: add-game-mode-logic
description: Use when adding or changing gameplay logic — a new game mode, scoring/combo/lives rule, word generation, or achievement — in packages/game-engine and wiring it into the web game store, UI and i18n. Test-first.
---
# Add game mode / gameplay logic

1. Đọc `packages/game-engine/src/types.ts`, `engine.ts` và test tương ứng trong `src/__tests__/` để hiểu `GameState`, `processKeypress`, `calculateResult`.
2. Viết test trước trong `src/__tests__/<area>.test.ts`. Chạy `pnpm --filter @typing-adventure/game-engine test`, test phải fail đúng lý do (thiếu behavior, không phải lỗi import).
3. Implement trong engine:
   - Type mới (vd thêm vào `GameMode`) đặt ở `types.ts`.
   - Logic là pure function, không dùng DOM/React/timer/`Math.random` trực tiếp; random và thời gian truyền vào qua tham số.
   - Hằng số (lives, duration…) export cùng module, không hardcode ở web.
4. Expose qua `packages/game-engine/src/index.ts` (type vào khối `export type`, hàm/hằng vào khối của module).
5. Chạy lại test engine → xanh.
6. Nối vào web:
   - `apps/web/src/stores/game-store.ts`: action/state mới gọi hàm engine, không lặp logic.
   - `apps/web/src/hooks/useGameEngine.ts` và `components/game/*` nếu UI cần hiển thị.
   - Mode mới: thêm `<option>` trong `components/layout/SideNav.tsx`.
   - Mode mới: cập nhật `z.enum([...])` trong `app/api/sessions/route.ts` và `app/api/leaderboard/route.ts`.
7. i18n: thêm key vào **cả** `packages/i18n/src/vi.ts` và `en.ts` (key đặt theo mẫu sẵn có, vd `modeXxx`, `tipXxx`). `TranslationKey` lấy từ `vi`, thiếu key bên `en` sẽ lỗi type.
8. Verify:
   - `pnpm test`
   - `pnpm --filter web build`
   - `pnpm dev` → chơi thử mode/logic mới trên trình duyệt, kiểm tra cả VI và EN.
