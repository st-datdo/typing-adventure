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
<điền sau khi đo>
