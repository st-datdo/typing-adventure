---
paths:
  - "typing-adventure/packages/game-engine/**/*.ts"
---
# Game Engine
- Code phải là pure function và không phụ thuộc DOM, timer hay Math.random trực tiếp. Random và time được inject từ ngoài vào để test được.
- Mọi logic mới đều kèm test trong src/__tests__/.
- Đổi type public thì phải chạy build web để bắt chỗ hỏng.
