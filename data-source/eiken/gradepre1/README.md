This folder stores source material and working files for Eiken Pre-1 data migration.

Files:
- `eiken_pre1_filtered_sorted.txt`: raw imported word list from the user's desktop.
- `gradepre1_master.csv`: working master sheet generated from the raw list and current app JSON.

Workflow:
1. Keep raw imports here unchanged.
2. Use `sourceText` as the original phrase and `text` as the game-safe phrase shown in the app.
3. Only rows with `status=ready` are imported into the app JSON.
4. Edit `gradepre1_master.csv` to fill `level`, `part`, `translation`, `exampleJa`, and `exampleEn`. `part` is fixed to `1` or `2` so later additions do not move existing questions between courses.
5. Generate the combined legacy JSON and the two app-facing `gradepre1-part1.json` / `gradepre1-part2.json` files from the completed master sheet.

Commands:
- `node scripts/apply-pre1-batch.mjs data-source/eiken/gradepre1/batches/<batch-file>.json`
- `node scripts/build-pre1-master.mjs`
- `node scripts/assign-pre1-parts.mjs`
- `node scripts/build-pre1-json-from-master.mjs`
- `node scripts/validate-pre1-master.mjs`
- `node scripts/validate-pre1-split.mjs`
