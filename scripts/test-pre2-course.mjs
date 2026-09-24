import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { load } from './lib/load-typescript-data.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const { QUESTIONS } = load('src/data/questions.ts');
const { pre2Curriculum, getPre2CurriculumLimit } = load('src/data/questionSets/eiken/pre2.ts');
const { getQuestionGrammarPoint } = load('src/data/questionGrammarPoints.ts');
const { getQuestionMeaning } = load('src/data/questionMeaning.ts');
const meaningCorrections = JSON.parse(fs.readFileSync(new URL('../src/data/intermediateMeaningCorrections.json', import.meta.url), 'utf8'));
const { getQuestionExample } = load('src/data/questionExamples.ts');
const tuning = load('src/data/pre2Balance.ts');
const normalize = text => text.toLowerCase().replace(/[^a-z0-9]/g, '');
const lower = ['Eiken5','Eiken4','Eiken3'].flatMap(d => Object.values(QUESTIONS[d]).flat());
const audit = JSON.parse(fs.readFileSync(path.join(root, 'docs/pre2-source-selection.json'), 'utf8'));
assert.equal(audit.sourceCount, 1632);
assert.equal(audit.audit.length, 1632);
assert.equal(new Set(audit.audit.map(s => s.id)).size, 1632);
assert.deepEqual(Object.values(QUESTIONS.EikenPre2).map(qs => qs.length), [650,223,173]);
for (const file of ['grade5.json','grade4.json','gradepre1-part1.json','gradepre1-part2.json','grade3.ts','grade3Vocabulary.ts','grade3Phrases.ts','grade3Sentences.ts']) {
  const relative = 'src/data/questionSets/eiken/' + file;
  const before = execFileSync('git', ['show', '79d574e:' + relative], {cwd:root,encoding:'utf8'}).replaceAll('\r\n','\n');
  assert.equal(fs.readFileSync(path.join(root,relative),'utf8').replaceAll('\r\n','\n'), before, 'Existing course changed: '+file);
}
for (const row of audit.audit) {
  for (const answer of row.answers) {
    assert.ok(QUESTIONS.EikenPre2[answer.level].some(q => q.text === answer.text), row.text);
  }
}
assert.equal(audit.audit.filter(s => s.id <= 1100 && s.decision === 'selected').length, 650);
assert.equal(audit.audit.filter(s => s.decision === 'selected').length + audit.originalSentences, 1046);
for (const level of [1,2,3]) {
  const qs = QUESTIONS.EikenPre2[level];
  assert.equal(new Set(qs.map(q => normalize(q.text))).size, qs.length);
  assert.equal(new Set(qs.map(q => q.translation)).size, qs.length);
  const overlap = qs.filter(q => lower.some(l => normalize(l.text) === normalize(q.text)));
  // Certainly was a short response below; here it is learned as an adverb in a sentence.
  assert.deepEqual(Array.from(overlap, q => q.text), level === 1 ? ['certainly'] : []);
  for (const q of qs) {
    assert.ok(q.text && q.translation);
    assert.ok(/^[\x20-\x7e]+$/.test(q.text), q.text);
    assert.ok(!/\.\.\.|\bB\b|\bA (?:to|for|with|into)\b|～|〜/.test(q.text), 'Unexpanded placeholder: '+q.text);
    const meaningCorrection = meaningCorrections.find(c => c.course === 'EikenPre2' && c.level === level && c.text === q.text && c.translation === q.translation && (c.exampleEn ?? '') === (q.exampleEn ?? ''));
    assert.equal(getQuestionMeaning(q, 'EikenPre2'), meaningCorrection?.meaning ?? q.translation, 'unexpected meaning: ' + q.text);
    assert.ok(q.translation.length <= (level === 1 ? 22 : 38), q.text);
    if (level < 3) assert.ok(getQuestionExample('EikenPre2',level,q)?.length >= q.text.length, q.text);
    else {
      assert.ok(q.grammarPoint?.note && q.grammarPoint?.pattern, q.text);
      assert.deepEqual(getQuestionGrammarPoint('EikenPre2',3,{text:q.text}),q.grammarPoint);
    }
  }
  const entries = pre2Curriculum[level];
  for(let i=1;i<entries.length;i++) assert.ok(entries[i].band >= entries[i-1].band);
  for(const [stage,band] of [[0,1],[7,2],[14,3]]) {
    assert.equal(getPre2CurriculumLimit(level,stage),entries.filter(e=>e.band<=band).length);
    assert.ok(getPre2CurriculumLimit(level,stage) >= 20);
  }
  console.log('DATA L'+level+': '+qs.length+'; bands '+[0,7,14].map(s=>getPre2CurriculumLimit(level,s))+'; mean/max characters '+(qs.reduce((s,q)=>s+q.text.length,0)/qs.length).toFixed(1)+'/'+Math.max(...qs.map(q=>q.text.length)));
}
// Extract the actual App tuning functions so UI and actual battle math cannot drift.
const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
// Specific teaching notes must match the actual sentence, not only its broad category.
assert.equal(getQuestionGrammarPoint('EikenPre2', 3, { text: 'How come you are here?' }).pattern, 'How come + 主語 + 動詞?');
assert.equal(getQuestionGrammarPoint('EikenPre2', 3, { text: 'Please say hello to your family.' }).pattern, 'say hello to + 人');
const constRegion = app.slice(app.indexOf('const DEFAULT_BATTLE_QUESTION_LIMIT'), app.indexOf('const isEndlessChallengeInputMode'));
const functionRegion = app.slice(app.indexOf('const getBattleQuestionLimit'), app.indexOf('const getBattleStageIndices'));
const ctx = { ...tuning, DIFFICULTY_HP_MULTIPLIERS: { Eiken5: 1, Eiken4: 1, EikenPre2: 1, EikenPre1Part1: 1.35 },
  getBattleDamageMultiplier: (mode, input) => mode === 'guide' ? 0.3 : input === 'voice-text' ? 0.28 : 1 };
vm.runInNewContext(ts.transpile(constRegion + functionRegion + '\nglobalThis.tune=getBattleTuning;', { target: ts.ScriptTarget.ES2022 }), ctx);
for (const level of [2, 3]) {
  for (const mode of ['guide', 'challenge']) {
    let previous = 0;
    for (let stage = 0; stage < 23; stage++) {
      const boss = stage < 19 ? 0 : stage - 18;
      const data = ctx.tune('EikenPre2', level, mode, mode === 'guide' ? 'voice-text' : 'text-only', stage, 9999, boss);
      assert.ok(data.monsterHp >= previous);
      previous = data.monsterHp;
      assert.ok(data.maxQuestions <= (level === 2 ? 28 : 24));
    }
  }
  assert.ok(tuning.getPre2MissMultiplier(level, 1, 30) >= 0.95);
  assert.ok(tuning.getPre2MissMultiplier(level, 8, 30) < 0.85);
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
      const { monsterHp, maxQuestions } = ctx.tune('EikenPre2', level, mode, input, stage, 9999, bossStage);
      const pool = QUESTIONS.EikenPre2[level].slice(0, input === 'voice-text' ? getPre2CurriculumLimit(level, stage) : undefined);
      let wins = 0;
      for (let trial = 0; trial < 300; trial++) {
        let sum = 0;
        for (let i = 0; i < maxQuestions; i++) {
          const q = pool[Math.floor(random() * pool.length)];
          sum += ctx.damage({ selectedDifficulty: 'EikenPre2', selectedLevel: level, mode, inputMode: input, bossStage, maxMonsterHp: monsterHp, maxQuestions, missCount: i % 2 }, q.text.length, 1);
        }
        if (sum >= monsterHp) wins++;
      }
      results.push(`${stage + 1}: HP${monsterHp}/${maxQuestions}問 ${Math.round(wins / 3)}%`);
      if (input === 'voice-text') assert.ok(wins >= 285, 'learning: half the answers with 1 typo should remain attainable');
    }
    console.log(`BALANCE L${level} ${mode}/${input} (1 char/sec, half with one typo): ${results.join('; ')}`);
  }
}
console.log('PASS Pre-2 data, grammar, curriculum, legacy courses and actual battle tuning');
// Level 1 deliberately retains the shared word-battle HP curve, not sentence tuning.
const curveRegion = app.slice(app.indexOf('const TWENTY_STAGE_HP_CURVES'), app.indexOf('const EXTRA_MONSTER_TYPES'));
vm.runInNewContext(ts.transpile(curveRegion + '\nglobalThis.curves=TWENTY_STAGE_HP_CURVES;', { target: ts.ScriptTarget.ES2022 }), ctx);
for (const [mode, input] of [['guide','voice-text'],['challenge','voice-text'],['challenge','voice-only'],['challenge','text-only']]) {
  const records = [];
  for (const stage of [0,18,19,22]) {
    if (stage === 22 && input === 'voice-text') continue;
    const curve = ctx.curves[1][input === 'voice-text' ? 'guide' : 'challenge'];
    const base = curve[Math.min(stage, curve.length - 1)];
    const bossStage = stage < 19 ? 0 : stage - 18;
    const {monsterHp,maxQuestions} = ctx.tune('EikenPre2',1,mode,input,stage,base,bossStage);
    assert.equal(monsterHp, Math.round(base*tuning.getPre2BossHpMultiplier(1,bossStage)));
    const pool = QUESTIONS.EikenPre2[1].slice(0,input === 'voice-text' ? getPre2CurriculumLimit(1,stage) : undefined);
    let total = 0;
    for (const q of pool) total += ctx.damage({ selectedDifficulty:'EikenPre2',selectedLevel:1,mode,inputMode:input,bossStage,maxMonsterHp:monsterHp,maxQuestions,missCount:0 },q.text.length,2);
    records.push(`${stage+1}: HP${monsterHp}, ${maxQuestions} questions, expected clean damage ${Math.round(total/pool.length*maxQuestions)}`);
  }
  console.log(`WORD L1 ${mode}/${input}, 2 chars/sec: ${records.join('; ')}`);
}
// Secret bosses are intentionally stronger, but must remain attainable with practice.
for (const level of [2, 3]) {
  const { monsterHp, maxQuestions } = ctx.tune('EikenPre2', level, 'challenge', 'text-only', 22, 9999, 4);
  const pool = QUESTIONS.EikenPre2[level];
  const meanDamage = pool.reduce((sum, q) => sum + ctx.damage({ selectedDifficulty: 'EikenPre2', selectedLevel: level, mode: 'challenge', inputMode: 'text-only', bossStage: 4, maxMonsterHp: monsterHp, maxQuestions, missCount: 1 }, q.text.length, 2), 0) / pool.length;
  assert.ok(meanDamage * maxQuestions > monsterHp, 'secret boss must remain attainable at 2 chars/sec even with a typo per answer');
  console.log(`SECRET L${level}: HP ${monsterHp}; expected damage ${Math.round(meanDamage * maxQuestions)} at 2 chars/sec, 1 typo per answer`);
}
