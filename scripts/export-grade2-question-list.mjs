import fs from 'node:fs';
import { load } from './lib/load-typescript-data.mjs';
const { QUESTIONS } = load('src/data/questions.ts');
const lines = ['# 英検2級 全問題一覧', '', '元資料の見出しから選んだ教材。和訳・例文・Level 3の英文はこのゲーム用に編集または新規作成。', ''];
for (const level of [1, 2, 3]) {
  lines.push(`## Level ${level}（${QUESTIONS.Eiken2[level].length}問）`, '');
  QUESTIONS.Eiken2[level].forEach((q, index) => {
    lines.push(`${index + 1}. **${q.text}** — ${q.translation}`);
    if (q.exampleEn) lines.push(`   - 例文: ${q.exampleEn}`);
    if (q.grammarPoint) lines.push(`   - 文法: ${q.grammarPoint.label}｜${q.grammarPoint.pattern}｜${q.grammarPoint.note}`);
  });
  lines.push('');
}
fs.writeFileSync(new URL('../docs/grade2-question-list.md', import.meta.url), lines.join('\n'));
console.log('Exported Grade 2 question list:', Object.values(QUESTIONS.Eiken2).reduce((sum, rows) => sum + rows.length, 0));
