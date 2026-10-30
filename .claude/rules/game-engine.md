---
paths:
  - "typing-adventure/packages/game-engine/**/*.ts"
---
# Game Engine
- Code phải là pure function và không phụ thuộc DOM, timer hay Math.random trực tiếp. Random và time được inject từ ngoài vào để test được.
- Mọi logic mới đều kèm test trong src/__tests__/.
- Đổi type public thì phải chạy build web để bắt chỗ hỏng.
- Module có khởi tạo cấp module (bảng dữ liệu + vòng lặp) phải có test nạp bằng `vi.resetModules()` + `await import()`, vì Stryker vitest runner báo Survived (không phải Killed) cho mutant làm module crash lúc import. Ví dụ: `src/__tests__/little-content-import.test.ts`.
