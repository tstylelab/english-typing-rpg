// Read-only balance audit. Runs production HP and answer-damage code in an isolated VM.
// Uniform, seeded question samples are diagnostic scenarios, not real-player win rates.
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { load } from './lib/load-typescript-data.mjs';
import { loadBattleTuning } from './lib/load-battle-tuning.mjs';

// Historical pre-adjustment audit; keep it reproducible after balance changes.
const source = execFileSync('git', ['show', 'ce88ad9:src/App.tsx'], { encoding: 'utf8' });
const { QUESTIONS } = load('src/data/questions.ts');
function evaluator(app) {
  const ctx = loadBattleTuning(app);
  const ast = ts.createSourceFile('App.tsx', app, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const names = ['getSpeedMultiplier', 'getEikenLongTextGuideSpeedMultiplier', 'getEikenLongTextGuideDamageMultiplier', 'getPerfectClearDamageFloor'];
  const declarations = ast.statements.filter(s => ts.isVariableStatement(s) && s.declarationList.declarations.some(d => names.includes(d.name.getText(ast)))).map(s => s.getText(ast)).join('\n');
  const start = app.indexOf('const handleCorrectAnswer');
  const body = app.slice(app.indexOf('    const now = Date.now();', start), app.indexOf('    const willDefeatMonster', start));
  ctx.Date = { now: () => 1000000 };
  ctx.audioHintUsedRef = { current: false };
  vm.runInNewContext(ts.transpile(`${declarations}\nglobalThis.damage=(gameState, finalInput)=>{${body}; return finalDamage;};`, { target: ts.ScriptTarget.ES2022 }), ctx);
  return ctx;
}
const current = evaluator(source);
const beforeUi = evaluator(execFileSync('git', ['show', 'd81971d:src/App.tsx'], { encoding: 'utf8' }));
const scenarios = {
  clean: () => 0,
  oneTypo: () => 1,
  errors30pct: q => Math.ceil(q.text.length * .3),
  errorsEveryChar: q => q.text.length,
};
const rows = [];
let compared = 0;
for (const course of current.courses.filter(c => c.startsWith('Eiken'))) for (const level of [2, 3]) {
  const pool = QUESTIONS[course][level];
  for (const inputMode of ['text-only', 'voice-only']) for (const speed of [1, 2, 4.4]) {
    const stages = current.roster[level].challenge;
    for (let index = 0; index < stages.length; index++) {
      const bossStage = current.boss('challenge', inputMode, index, stages.length);
      const args = [course, level, 'challenge', inputMode, index, stages[index].baseHp, bossStage];
      const tuning = current.tune(...args);
      assert.deepEqual(JSON.stringify(tuning), JSON.stringify(beforeUi.tune(...args)), 'HP changed since pre-UI baseline');
      for (const [scenario, mistakes] of Object.entries(scenarios)) {
        const damages = pool.map(q => {
          const state = { selectedDifficulty: course, selectedLevel: level, mode: 'challenge', inputMode, bossStage, maxMonsterHp: tuning.monsterHp, maxQuestions: tuning.maxQuestions, missCount: mistakes(q), startTime: 1000000 - q.text.length / speed * 1000 };
          const damage = current.damage(state, q.text);
          assert.equal(damage, beforeUi.damage(state, q.text), 'Damage changed since pre-UI baseline');
          compared++;
          return damage;
        });
        let random = 1729, wins = 0, totalAnswers = 0;
        const trials = 200;
        for (let run = 0; run < trials; run++) {
          let hp = tuning.monsterHp, used = 0;
          while (used < tuning.maxQuestions && hp > 0) {
            random = (Math.imul(random, 1664525) + 1013904223) >>> 0;
            hp -= damages[random % damages.length];
            used++;
          }
          if (hp <= 0) { wins++; totalAnswers += used; }
        }
        rows.push({ course, level, inputMode, speed, stage: index + 1, bossStage, hp: tuning.monsterHp, maxQuestions: tuning.maxQuestions, scenario, wins, trials, averageAnswersOnWin: wins ? +(totalAnswers / wins).toFixed(2) : null });
      }
    }
  }
}
const report = { scope: 'All Eiken Level 2/3, translation/audio battle, all 23 enemies, current actual HP/damage functions; no storage or browser access', limitations: 'Uniform random sampling with replacement. Excludes per-user question filters, learning/review selection, hesitation before first key, audio hints and real input mistakes. Not an actual-user win rate.', compared, rows };
fs.writeFileSync('docs/long-text-balance-audit-2026-10-16.json', JSON.stringify(report, null, 2) + '\n');
console.log(`PASS: ${compared} damage comparisons and all HP settings match pre-UI d81971d. ${rows.length} simulated conditions.`);
for (const course of current.courses.filter(c => c.startsWith('Eiken'))) for (const level of [2, 3]) {
  const group = rows.filter(r => r.course === course && r.level === level && r.inputMode === 'text-only' && r.speed === 2);
  const summary = Object.fromEntries(Object.keys(scenarios).map(s => {
    const selected = group.filter(r => r.scenario === s);
    return [s, { ordinaryWinPct: +(selected.filter(r => !r.bossStage).reduce((n, r) => n + r.wins, 0) / (19 * 200) * 100).toFixed(1), bossWinPct: +(selected.filter(r => r.bossStage).reduce((n, r) => n + r.wins, 0) / (4 * 200) * 100).toFixed(1) }];
  }));
  console.log(course, level, JSON.stringify(summary));
}
