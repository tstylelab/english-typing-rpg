import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { load } from './lib/load-typescript-data.mjs';
import { loadBattleDamage } from './lib/load-battle-damage.mjs';

const baselineRevision = 'ce88ad99560f3bf48df0d10dd5fe942102edcdae';
const source = fs.readFileSync('src/App.tsx', 'utf8');
const previousSource = execFileSync('git', ['show', `${baselineRevision}:src/App.tsx`], { encoding: 'utf8' });
const current = loadBattleDamage(source), previous = loadBattleDamage(previousSource);
const { QUESTIONS } = load('src/data/questions.ts');
const courses = current.courses.filter(c => c.startsWith('Eiken'));
const isScoped = (c, l, m, i) => c.startsWith('Eiken') && [2, 3].includes(l) && m === 'challenge' && ['text-only', 'voice-only'].includes(i);
const state = (course, level, input, boss, tuning, length, speed, misses, mode = 'challenge') => ({
  selectedDifficulty: course, selectedLevel: level, mode, inputMode: input, bossStage: boss,
  maxMonsterHp: tuning.monsterHp, maxQuestions: tuning.maxQuestions,
  missCount: misses, startTime: 1000000 - length / speed * 1000,
});
const scenarios = { clean: () => 0, oneTypo: () => 1, errors10pct: l => Math.floor(l * .1), errors30pct: l => Math.ceil(l * .3), errorsEveryChar: l => l };
let stagesChecked = 0, damageChecks = 0, outsideChecks = 0;
const rows = [], poolRows = [];
assert.equal(JSON.stringify(current.roster), JSON.stringify(previous.roster), 'Monster identities and base data must remain intact');

for (const course of courses) for (const level of [2, 3]) for (const input of ['text-only', 'voice-only']) {
  const monsters = current.roster[level].challenge;
  const lengths = [...new Set(QUESTIONS[course][level].map(q => q.text.length))];
  assert.equal(monsters.length, 23);
  for (let index = 0; index < monsters.length; index++) {
    const boss = current.boss('challenge', input, index, monsters.length);
    const args = [course, level, 'challenge', input, index, monsters[index].baseHp, boss];
    const tuning = current.tune(...args), before = previous.tune(...args);
    const grade5 = previous.tune('Eiken5', ...args.slice(1));
    const mean = c => QUESTIONS[c][level].reduce((sum, q) => sum + q.text.length, 0) / QUESTIONS[c][level].length;
    const expectedLimit = Math.max(boss ? 8 : 4, Math.ceil(grade5.maxQuestions * Math.min(1, Math.sqrt(mean('Eiken5') / mean(course)))));
    assert.equal(tuning.maxQuestions, expectedLimit, 'Length correction must use shipped curriculum means');
    assert.equal(tuning.monsterHp, Math.round(grade5.monsterHp * expectedLimit / grade5.maxQuestions), 'Preserve Grade 5 required damage per answer');
    if (course === 'Eiken5') {
      assert.equal(tuning.monsterHp, grade5.monsterHp);
      assert.equal(tuning.maxQuestions, grade5.maxQuestions);
    }
    stagesChecked++;
    for (const length of lengths) for (const speed of [.25, 1, 2, 4, 8]) for (const [scenario, mistakes] of Object.entries(scenarios)) {
      const misses = mistakes(length);
      const s = state(course, level, input, boss, tuning, length, speed, misses);
      const damage = current.damage(s, 'a'.repeat(length));
      // Independent numerical specification, including integer rounding in the app.
      const rate = misses / Math.max(1, length);
      const bonus = Math.min(.1, Math.max(0, (speed - 1) / 30)) * Math.max(0, 1 - 4 * rate);
      const expected = Math.floor((level === 2 ? 225 : 200) * Math.max(.2, 1 - rate) * (1 + bonus) + 1e-9);
      assert.equal(damage, expected, `${course}/${level}/${input}/${index}/${length}/${speed}/${scenario}`);
      const wins = damage * tuning.maxQuestions >= tuning.monsterHp;
      if (scenario === 'clean' || scenario === 'errors10pct') assert.ok(wins, 'Careful slow input must reach every enemy');
      if (scenario === 'errorsEveryChar') assert.ok(!wins, 'Repeated substantial mistakes must not beat any enemy');
      if (scenario === 'errors30pct' && index >= 10) assert.ok(!wins, '30% mistakes must not beat later normal enemies or bosses, even fast');
      current.audioHintUsedRef.current = true;
      assert.equal(current.damage(s, 'a'.repeat(length)), Math.floor(Math.floor((level === 2 ? 225 : 200) * Math.max(.2, 1 - rate) + 1e-9) * .5));
      current.audioHintUsedRef.current = false;
      damageChecks += 2;
    }
    const sampleLength = level === 2 ? 10 : 20;
    const sample = Object.fromEntries([0, sampleLength / 10, sampleLength * .3].map(misses => {
      const dmg = current.damage(state(course, level, input, boss, tuning, sampleLength, 1, misses), 'a'.repeat(sampleLength));
      return [misses, { damage: dmg, answersRequired: Math.ceil(tuning.monsterHp / dmg), canWin: dmg * tuning.maxQuestions >= tuning.monsterHp }];
    }));
    rows.push({ course, level, input, stage: index + 1, boss, before, after: tuning, sampleLength, sample });
    // Same seeded question sequences before/after, sampled from real curriculum text.
    // Diagnostic only: not the app's personalized learning/review queue or actual-user win rates.
    for (const speed of [1, 2, 4]) for (const [scenario, mistakes] of Object.entries(scenarios)) {
      const pool = QUESTIONS[course][level];
      const values = [previous, current].map((engine, version) => pool.map(q => engine.damage(
        state(course, level, input, boss, version ? tuning : before, q.text.length, speed, mistakes(q.text.length)), q.text)));
      const result = [before, tuning].map((settings, version) => {
        let seed = 1729, wins = 0, answers = 0;
        for (let run = 0; run < 200; run++) {
          let total = 0, used = 0;
          // Generate the full, fixed-length sequence, so both versions see identical trials.
          for (let turn = 0; turn < Math.max(before.maxQuestions, tuning.maxQuestions); turn++) {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            if (turn < settings.maxQuestions && total < settings.monsterHp) { total += values[version][seed % pool.length]; used++; }
          }
          if (total >= settings.monsterHp) { wins++; answers += used; }
        }
        return { wins, trials: 200, meanAnswersOnWin: wins ? +(answers / wins).toFixed(2) : null };
      });
      poolRows.push({ course, level, input, stage: index + 1, speed, scenario, before: result[0], after: result[1] });
    }
  }
}

// The same error proportion yields the same damage across longer answer lengths.
for (const level of [2, 3]) for (const speed of [.25, 1, 2, 4, 8]) for (const rate of [0, .1, .3, .5, 1]) {
  const damages = [10, 20, 40, 60, 100].map(length => current.damage(state('Eiken2', level, 'text-only', 0,
    { monsterHp: 1000, maxQuestions: 8 }, length, speed, length * rate), 'a'.repeat(length)));
  assert.equal(new Set(damages).size, 1, 'Longer answers must not receive more raw attack power');
}

// Check actual HP and damage everywhere outside the approved scope against the release.
for (const course of current.courses) for (const level of [1, 2, 3]) for (const mode of ['guide', 'challenge', 'weakness'])
for (const input of ['voice-text', 'voice-only', 'text-only']) for (let index = 0; index < 23; index++) {
  if (isScoped(course, level, mode, input)) continue;
  const boss = index < 19 ? 0 : index - 18;
  const args = [course, level, mode, input, index, 4900, boss];
  const tuning = current.tune(...args);
  assert.equal(JSON.stringify(tuning), JSON.stringify(previous.tune(...args)));
  for (const length of [5, 20, 80]) for (const speed of [.5, 2, 5]) for (const misses of [0, 1, 6, 80]) for (const hint of [false, true]) {
    current.audioHintUsedRef.current = previous.audioHintUsedRef.current = hint;
    const s = state(course, level, input, boss, tuning, length, speed, misses, mode);
    assert.equal(current.damage(s, 'a'.repeat(length)), previous.damage(s, 'a'.repeat(length)), JSON.stringify({ args, length, speed, misses, hint }));
    outsideChecks++;
  }
}
current.audioHintUsedRef.current = previous.audioHintUsedRef.current = false;
// Learning and saved data updates after damage calculation must stay byte-identical.
const learningTail = app => app.slice(app.indexOf('    const willDefeatMonster', app.indexOf('const handleCorrectAnswer')), app.indexOf('const handleBattleInputValue', app.indexOf('const handleCorrectAnswer'))).replace(/\r\n/g, '\n');
assert.equal(learningTail(source), learningTail(previousSource));

const report = { baselineRevision, stagesChecked, damageChecks, outsideChecks,
  method: 'Actual App.tsx HP and damage calculation in an isolated VM. No browser or user storage access.',
  limitations: 'Seeded uniform samples with replacement, not real-player win rates. Does not simulate personal review selection, reading difficulty or time before typing. Miss ratios use input text length including spaces. Tests cover integer rounding, hints and slow input.',
  courses: courses.map(course => ({ course, levels: [2, 3].map(level => {
    const lengths = QUESTIONS[course][level].map(q => q.text.length);
    return { level, questions: lengths.length, minLength: Math.min(...lengths), maxLength: Math.max(...lengths), meanLength: +(lengths.reduce((a, b) => a + b, 0) / lengths.length).toFixed(2) };
  }) })), rows, poolRows };
if (process.argv.includes('--write-report')) fs.writeFileSync('docs/long-text-balance-2026-10-16.json', JSON.stringify(report, null, 2) + '\n');
console.log(`PASS: ${stagesChecked} stage configurations; ${damageChecks} real-handler damage/hint checks; ${outsideChecks} unchanged out-of-scope calculations; ${poolRows.length} paired simulation conditions.`);
for (const level of [2, 3]) console.log(JSON.stringify(rows.filter(r => r.course === 'Eiken5' && r.level === level && r.input === 'text-only' && [1, 10, 19, 20, 23].includes(r.stage)), null, 2));
