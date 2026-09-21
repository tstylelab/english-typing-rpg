import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const cache = new Map();
export function load(relative) {
  let file = path.resolve(root, relative);
  if (!path.extname(file)) file += '.ts';
  if (cache.has(file)) return cache.get(file).exports;
  if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
  const module = { exports: {} }; cache.set(file, module);
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(js, { module, exports: module.exports, require: name => load(path.resolve(path.dirname(file), name)) }, { filename: file });
  return module.exports;
}

const { QUESTIONS } = load('src/data/questions.ts');
const { grade3Curriculum, getGrade3CurriculumLimit } = load('src/data/questionSets/eiken/grade3.ts');
const { getQuestionGrammarPoint } = load('src/data/questionGrammarPoints.ts');
const { getQuestionMeaning } = load('src/data/questionMeaning.ts');
const { getQuestionExample } = load('src/data/questionExamples.ts');
const tuning = load('src/data/grade3Balance.ts');
const base = '91cff64';

// Existing course files, overrides and identifiers must be byte-for-byte unchanged.
for (const file of ['grade5', 'grade4', 'gradepre1-part1', 'gradepre1-part2']) {
  const relative = `src/data/questionSets/eiken/${file}.json`;
  assert.equal(fs.readFileSync(path.join(root, relative), 'utf8').replaceAll('\r\n', '\n'), execFileSync('git', ['show', `${base}:${relative}`], { cwd: root, encoding: 'utf8' }).replaceAll('\r\n', '\n'));
}
const lower = new Set([...QUESTIONS.Eiken5[1], ...QUESTIONS.Eiken4[1]].map(q => q.text.toLowerCase()));
assert.equal(QUESTIONS.Eiken3[1].filter(q => lower.has(q.text.toLowerCase())).length, 25);
assert.deepEqual(Object.values(QUESTIONS.Eiken3).map(q => q.length), [514, 183, 168]);
// Appending vocabulary must not change existing learning-record identities.
for (const filename of ['grade3Vocabulary.ts', 'grade3Phrases.ts', 'grade3Sentences.ts']) {
  const relative = `src/data/questionSets/eiken/${filename}`;
  const old = execFileSync('git', ['show', `2250e3d:${relative}`], { cwd: root, encoding: 'utf8' });
  const current = fs.readFileSync(path.join(root, relative), 'utf8').replaceAll('\r\n', '\n');
  for (const line of old.replaceAll('\r\n', '\n').split('\n').filter(line => /^[123]\|/.test(line))) {
    assert.ok(current.split('\n').includes(line), `Existing question changed: ${line}`);
  }
}
const audit = JSON.parse(fs.readFileSync(path.join(root, 'docs/grade3-source-selection.json'), 'utf8'));
assert.equal(audit.sourceCount, 1300);
assert.equal(audit.audit.filter(row => row.level === 1 && row.reason === 'new-vocabulary').length, 474);
assert.ok(audit.audit.filter(row => row.reason === 'new-vocabulary').every(row => row.decision === 'selected'));
for (const row of audit.audit) {
  for (const answer of row.answers) assert.ok(QUESTIONS.Eiken3[row.level].some(q => q.text === answer));
}
assert.equal(audit.originalSentences.length, 96);
for (const level of [1, 2, 3]) {
  const questions = QUESTIONS.Eiken3[level];
  assert.equal(new Set(questions.map(q => q.text.toLowerCase())).size, questions.length, 'duplicate answer');
  assert.equal(new Set(questions.map(q => q.translation)).size, questions.length, 'identical Japanese prompts');
  for (const q of questions) {
    assert.match(q.text, /^[\x20-\x7e]+$/, 'standard keyboard input only');
    assert.ok(!/[\[\]～]|\b[AB]\b/.test(q.text), `placeholder: ${q.text}`);
    assert.ok(q.translation.length <= (level === 1 ? 26 : 43), q.text + ': long meaning');
    assert.equal(getQuestionMeaning(q), q.translation, 'unintended legacy override');
    assert.ok(!q.text.endsWith(' '));
    if (level < 3) assert.ok(getQuestionExample('Eiken3', level, q)?.length >= q.text.length);
    if (level === 3) {
      assert.ok(q.grammarPoint?.note && q.grammarPoint?.pattern, q.text + ': missing grammar');
      // Saved review objects may have lost new optional fields.
      assert.deepEqual(getQuestionGrammarPoint('Eiken3', 3, { text: q.text }), q.grammarPoint);
    }
  }
  const entries = grade3Curriculum[level];
  for (let i = 1; i < entries.length; i++) assert.ok(entries[i].band >= entries[i - 1].band);
  for (const [stage, band] of [[0, 1], [7, 2], [14, 3]]) {
    const limit = getGrade3CurriculumLimit(level, stage);
    assert.equal(limit, entries.filter(e => e.band <= band).length);
    assert.ok(limit >= 20);
  }
  console.log(`PASS Level ${level}: ${questions.length} questions; bands ${[0, 7, 14].map(s => getGrade3CurriculumLimit(level, s))}; average/max characters ${Math.round(questions.reduce((n, q) => n + q.text.length, 0) / questions.length)}/${Math.max(...questions.map(q => q.text.length))}`);
}

// Extract the actual App tuning functions so UI and actual battle math cannot drift.
const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
const constRegion = app.slice(app.indexOf('const DEFAULT_BATTLE_QUESTION_LIMIT'), app.indexOf('const isEndlessChallengeInputMode'));
const functionRegion = app.slice(app.indexOf('const getBattleQuestionLimit'), app.indexOf('const getBattleStageIndices'));
const ctx = { ...tuning, DIFFICULTY_HP_MULTIPLIERS: { Eiken5: 1, Eiken4: 1, Eiken3: 1, EikenPre1Part1: 1.35 },
  getBattleDamageMultiplier: (mode, input) => mode === 'guide' ? 0.3 : input === 'voice-text' ? 0.28 : 1 };
vm.runInNewContext(ts.transpile(constRegion + functionRegion + '\nglobalThis.tune=getBattleTuning;', { target: ts.ScriptTarget.ES2022 }), ctx);
for (const level of [2, 3]) {
  for (const mode of ['guide', 'challenge']) {
    let previous = 0;
    for (let stage = 0; stage < 23; stage++) {
      const boss = stage < 19 ? 0 : stage - 18;
      const data = ctx.tune('Eiken3', level, mode, mode === 'guide' ? 'voice-text' : 'text-only', stage, 9999, boss);
      assert.ok(data.monsterHp >= previous);
      previous = data.monsterHp;
      assert.ok(data.maxQuestions <= (level === 2 ? 28 : 24));
    }
  }
  assert.ok(tuning.getGrade3MissMultiplier(level, 1, 30) >= 0.95);
  assert.ok(tuning.getGrade3MissMultiplier(level, 8, 30) < 0.85);
}
// Grade 4 tuning is still the original: no extra course-specific adjustment.
assert.equal(ctx.tune('Eiken4', 3, 'challenge', 'text-only', 19, 4900, 1).monsterHp, 9800);
assert.equal(ctx.tune('Eiken4', 3, 'challenge', 'text-only', 19, 4900, 1).maxQuestions, 20);

// Use the exact damage body from App, at 1 character/sec, with deterministic draws.
const start = app.indexOf('    const isGrade3LongTextLearning =');
const end = app.indexOf('    const willDefeatMonster', start);
const damageBody = app.slice(start, end);
const speedBody = app.slice(app.indexOf('const getSpeedMultiplier ='), app.indexOf('const getMonsterBattleDialogue ='));
const floorBody = app.slice(app.indexOf('const getPerfectClearDamageFloor ='), app.indexOf('const getBossIntroLabel ='));
vm.runInNewContext(ts.transpile(speedBody + floorBody + `\nglobalThis.damage=(gameState,charCount,charsPerSec)=>{const baseDamage=charCount*10;${damageBody}\nreturn finalDamage;};`, { target: ts.ScriptTarget.ES2022 }), ctx);
let seed = 190921;
const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
for (const level of [2, 3]) {
  for (const [mode, input] of [['guide', 'voice-text'], ['challenge', 'voice-text'], ['challenge', 'voice-only'], ['challenge', 'text-only']]) {
    const results = [];
    for (const stage of [0, 18, 19, 22]) {
      if (stage === 22 && input === 'voice-text') continue;
      const bossStage = stage < 19 ? 0 : stage - 18;
      const { monsterHp, maxQuestions } = ctx.tune('Eiken3', level, mode, input, stage, 9999, bossStage);
      const pool = QUESTIONS.Eiken3[level].slice(0, input === 'voice-text' ? getGrade3CurriculumLimit(level, stage) : undefined);
      let wins = 0;
      for (let trial = 0; trial < 300; trial++) {
        let sum = 0;
        for (let i = 0; i < maxQuestions; i++) {
          const q = pool[Math.floor(random() * pool.length)];
          sum += ctx.damage({ selectedDifficulty: 'Eiken3', selectedLevel: level, mode, inputMode: input, bossStage, maxMonsterHp: monsterHp, maxQuestions, missCount: i % 2 }, q.text.length, 1);
        }
        if (sum >= monsterHp) wins++;
      }
      results.push(`${stage + 1}: HP${monsterHp}/${maxQuestions}問 ${Math.round(wins / 3)}%`);
      if (input === 'voice-text') assert.ok(wins >= 285, 'learning: half the answers with 1 typo should remain attainable');
    }
    console.log(`BALANCE L${level} ${mode}/${input} (1 char/sec, half with one typo): ${results.join('; ')}`);
  }
}
console.log('PASS Grade 3 data, grammar, curriculum, legacy courses and actual battle tuning');
// Secret bosses are intentionally stronger, but must remain attainable with practice.
for (const level of [2, 3]) {
  const { monsterHp, maxQuestions } = ctx.tune('Eiken3', level, 'challenge', 'text-only', 22, 9999, 4);
  const pool = QUESTIONS.Eiken3[level];
  const meanDamage = pool.reduce((sum, q) => sum + ctx.damage({ selectedDifficulty: 'Eiken3', selectedLevel: level, mode: 'challenge', inputMode: 'text-only', bossStage: 4, maxMonsterHp: monsterHp, maxQuestions, missCount: 1 }, q.text.length, 2), 0) / pool.length;
  assert.ok(meanDamage * maxQuestions > monsterHp, 'secret boss must remain attainable at 2 chars/sec even with a typo per answer');
  console.log(`SECRET L${level}: HP ${monsterHp}; expected damage ${Math.round(meanDamage * maxQuestions)} at 2 chars/sec, 1 typo per answer`);
}
