import assert from 'node:assert/strict';
import fs from 'node:fs';
import { load } from './lib/load-typescript-data.mjs';

const { QUESTIONS } = load('src/data/questions.ts');
const { grade2Curriculum, getGrade2CurriculumLimit } = load('src/data/questionSets/eiken/grade2.ts');
const { getQuestionGrammarPoint } = load('src/data/questionGrammarPoints.ts');
const { getQuestionMeaning } = load('src/data/questionMeaning.ts');
const balance = load('src/data/grade2Balance.ts');
const audit = JSON.parse(fs.readFileSync(new URL('../docs/grade2-source-selection.json', import.meta.url), 'utf8'));
const norm = text => text.toLowerCase().replace(/[^a-z0-9]/g, '');
const lower = new Set(['Eiken5', 'Eiken4', 'Eiken3', 'EikenPre2'].flatMap(key => Object.values(QUESTIONS[key]).flat()).map(q => norm(q.text)));
assert.equal(audit.sourceCount, 1738);
assert.deepEqual(audit.sourceKinds, { 単語編: 1300, 熟語編: 400, 英作文編: 38 });
assert.equal(Object.values(audit.decisionCounts).reduce((sum, count) => sum + count, 0), 1738);
assert.deepEqual(Object.values(QUESTIONS.Eiken2).map(qs => qs.length), [549, 203, 94]);
assert.equal(audit.decisionCounts['new-entry'], 314);
assert.equal(audit.decisionCounts['reused-existing-meaning'], 215);
assert.equal(audit.decisionCounts.concretized, 193);
assert.equal(audit.decisionCounts['expanded-writing-pattern'], 38);
for (const level of [1, 2, 3]) {
  const qs = QUESTIONS.Eiken2[level];
  assert.equal(new Set(qs.map(q => norm(q.text))).size, qs.length, `duplicate answer L${level}`);
  assert.equal(new Set(qs.map(q => q.translation)).size, qs.length, `ambiguous Japanese cue L${level}`);
  for (const q of qs) {
    assert.ok(!lower.has(norm(q.text)), `lower-course repeat: ${q.text}`);
    assert.ok(/^[\x20-\x7e]+$/.test(q.text), `non-typable answer: ${q.text}`);
    assert.ok(!/\.\.\.|～|〜|［|］|（|）|\bA\b.*\bB\b/.test(q.text), `placeholder: ${q.text}`);
    assert.ok(q.translation.length <= (level === 1 ? 22 : level === 2 ? 38 : 55), `long cue: ${q.text}`);
    assert.equal(getQuestionMeaning(q), q.translation, `legacy meaning override: ${q.text}`);
    if (level < 3) assert.ok(q.exampleEn && q.exampleEn.length >= q.text.length, `missing example: ${q.text}`);
    else assert.deepEqual(getQuestionGrammarPoint('Eiken2', level, { text: q.text }), q.grammarPoint);
  }
  const entries = grade2Curriculum[level];
  for (let i = 1; i < entries.length; i++) assert.ok(entries[i].band >= entries[i - 1].band);
  for (const [stage, band] of [[0, 1], [7, 2], [14, 3]]) {
    assert.equal(getGrade2CurriculumLimit(level, stage), entries.filter(row => row.band <= band).length);
    assert.ok(getGrade2CurriculumLimit(level, stage) >= 15, `insufficient opening pool L${level}`);
  }
}
for (const row of audit.selected.filter(row => row.answer)) {
  assert.ok(QUESTIONS.Eiken2[row.kind === '熟語編' ? 2 : 1].some(q => norm(q.text) === norm(row.answer)), `missing selected source: ${row.id}`);
}
// Translation-only battle must cue the meaning and part of speech used in the example.
const byAnswer = level => new Map(QUESTIONS.Eiken2[level].map(q => [q.text, q]));
const words = byAnswer(1);
assert.equal(words.get('classic').translation, '長く親しまれている名作');
assert.equal(words.get('criminal').translation, '犯罪を犯した人');
assert.equal(words.get('burst').translation, '風船などが破裂する');
const expressions = byAnswer(2);
assert.equal(expressions.get('consist of three parts').translation, '三つの部分から成る');
assert.equal(expressions.get('be made up of four teams').translation, '四つのチームで構成される');
assert.equal(byAnswer(3).get('In conclusion, the program is worth trying.').translation, '結論として、そのプログラムは試す価値があります。');
for (const boss of [0, 1, 2, 3, 4]) {
  assert.ok(balance.getGrade2QuestionLimit(1, boss) <= [10, 20, 30, 40, 50][boss]);
  assert.ok(balance.getGrade2BossHpMultiplier(2, boss) >= 1);
}
assert.equal(balance.getGrade2MissMultiplier(1, 1, 8), 0.5);
assert.ok(balance.getGrade2MissMultiplier(3, 1, 40) > 0.9);
console.log('Grade 2 course: 549 words, 203 phrases, 94 sentences; source and lower-course audits passed.');
