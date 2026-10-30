# Plan: Stryker mutation testing cho `packages/game-engine`

Trạng thái: approved
Lesson/PR: L06 · EX-6

## Mục tiêu
- `pnpm --filter @typing-adventure/game-engine mutation` chạy Stryker (vitest runner) trên `src/**/*.ts` trừ `index.ts`, `types.ts`, `__tests__`.
- Đo baseline thật (phạm vi, số mutant, score, thời gian `/usr/bin/time -p`), nâng score > 70% trên cùng phạm vi bằng test mới, đặt `thresholds.break` = score cuối làm tròn xuống.

## Ngoài phạm vi
- Không đưa Stryker vào CI bắt buộc. Lý do: mỗi mutant chạy lại test liên quan, thời gian baseline (ghi ở Thực tế) lớn hơn nhiều lần toàn bộ job `checks` (~2 phút), và score dao động khi thêm file mới sẽ làm đỏ PR không liên quan. Chạy local trước khi merge thay đổi engine; có thể thêm workflow `workflow_dispatch`/lịch ở L08.
- Không dùng `// Stryker disable`, không thu hẹp `mutate` sau khi đo baseline (trừ quy tắc 15 phút của LESSON, ghi cả hai con số).
- Không chạy Stryker cho `apps/web` (Mở rộng).

## File thay đổi (dự đoán)
- `typing-adventure/packages/game-engine/package.json` (sửa: devDependencies + script `mutation`)
- `typing-adventure/pnpm-lock.yaml` (sửa)
- `typing-adventure/packages/game-engine/stryker.config.json` (thêm)
- `typing-adventure/.gitignore` (sửa: `.stryker-tmp/`, `reports/`)
- `typing-adventure/packages/game-engine/src/__tests__/*.test.ts` (sửa/thêm: test diệt mutant, commit `test(engine): …`)

## Interface chạm tới
- Dependency mới (outward-facing, `pnpm add`): `@stryker-mutator/core@9.6.1`, `@stryker-mutator/vitest-runner@9.6.1`, devDependency của `game-engine`, pin chính xác. Đã kiểm: `pnpm view @stryker-mutator/vitest-runner@9.6.1 peerDependencies` → `vitest >=2.0.0`, `@stryker-mutator/core 9.6.1`; repo dùng vitest 2.1.9. Chọn 9.6.1 thay vì 10.1.1 vì core 10 đòi `node >=22` còn repo `engines.node >=20` và CI Node 20.
- `stryker.config.json`: `testRunner: vitest`, `vitest.configFile: vitest.config.ts`, `mutate: ["src/**/*.ts", "!src/index.ts", "!src/types.ts", "!src/__tests__/**"]`, `reporters: ["clear-text", "progress", "html"]`, `htmlReporter.fileName: reports/mutation/index.html`, `coverageAnalysis: perTest`, `thresholds.break` đặt sau khi có số cuối.
- Script: `"mutation": "stryker run"` trong `packages/game-engine/package.json` (không sửa `package.json` gốc). Đổi `scripts` của package.json → guard EX-7 tính là config được bảo vệ (sau merge).
- Env: không.

## Verify
```bash
cd typing-adventure
/usr/bin/time -p pnpm --filter @typing-adventure/game-engine exec stryker run   # baseline, ghi score + mutant + real
/usr/bin/time -p pnpm --filter @typing-adventure/game-engine exec stryker run   # sau test mới, > 70%, ≥ break
grep -rn "Stryker disable" packages                                           # rỗng
pnpm --filter @typing-adventure/game-engine test
```

## Tự review
1. Đoán được diff chưa? Có. Mơ hồ: test nào cần thêm chỉ biết sau baseline (danh sách mutant sống).
2. Interface nào người khác đang dùng? Không; chỉ thêm devDependency và script.
3. Rollback? Revert commit, `pnpm install`.

## Lịch sử
- v1 2026-10-30 09:37: bản đầu, approved.

## Thực tế
Điền 2026-10-30 09:56. Plan `f77e424` (09:37:30) trước `pnpm add` (09:45) và commit `9da1145` (09:53:16, setup), `9fa7fb4` (09:55:09, `thresholds.break`). Config có trong working tree khi đo baseline (09:46), commit sau test diệt mutant: thứ tự commit `test(engine)` → `build(engine)` khác thứ tự làm.

| Lần | Phạm vi | Mutant | Killed + timeout | Survived | No cov | Score | `real` |
|---|---|---|---|---|---|---|---|
| Baseline | `src/**/*.ts` trừ `index.ts`, `types.ts`, `__tests__` (15 file) | 2204 | 1411 + 32 | 702 | 59 | **65.47%** | 96.80 s |
| Sau `f4221ce` (keyboard + engine setup) | như trên | 2204 | 1620 + 36 | 533 | 15 | 75.14% | 97.20 s |
| Sau `24543ea` (import keyboard trong test) | như trên | 2204 | 1674 + 36 | 479 | 15 | **77.59%** | 94.71 s |
| `pnpm mutation` với `break: 77` | như trên | 2204 | 1674 + 36 | 479 | 15 | 77.59% ≥ 77 | 99.15 s |

Baseline < 15 phút nên giữ toàn phạm vi, không thu hẹp. Concurrency 4 trên máy 11 core, `user` ~433 s.

- Khớp (5): `packages/game-engine/package.json`, `pnpm-lock.yaml`, `packages/game-engine/stryker.config.json`, `typing-adventure/.gitignore`, `src/__tests__/*.test.ts` (thêm `keyboard.test.ts`, `engine-setup.test.ts`). Tỉ lệ 5/5 = 100%.
- Phát hiện: mutant `ObjectLiteral` (`{ key, finger }` → `{}`) trong bảng `KEYBOARD_ROWS` làm vòng lặp cấp module ném lỗi lúc import. Vitest runner của Stryker coi file test lỗi lúc load là "không có test fail" → mutant **Survived** dù app sẽ crash. Import `../keyboard` bên trong từng test biến crash thành test fail → keyboard.ts 70.98% → 98.96%. Không dùng `// Stryker disable`.
- Không đưa vào CI: ~95–99 s mỗi lần cho 1 package, bằng ~80% thời lượng cả job `checks` L05 (~2 phút); score phụ thuộc test có random (`pickWords`), lệch vài mutant giữa các lần có thể làm đỏ PR không liên quan. 2 lần chạy cuối cho cùng 77.59%.
- Design round 2: không.
- Sau chấm: `thresholds.break` 77 → 75 (`b81c747`, BACKLOG #26). Người chấm đo 77.54 (1673 killed) so với 77.59 (1674): test dùng random của engine (`pickWords`) nên lệch ±1 mutant, `break` sát score sẽ đỏ ngẫu nhiên. 75 vẫn > 70.
