import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {load} from './lib/load-typescript-data.mjs';
import {withHistoricalReviewedQuestions} from './lib/historical-question-snapshot.mjs';
const audit=JSON.parse(fs.readFileSync('docs/pre2-level2-prompt-review-2026-10-18.json','utf8'));
const {QUESTIONS}=load('src/data/questions.ts');
const {getQuestionMeaning}=load('src/data/questionMeaning.ts');
const {getTranslationBattlePrompt}=load('src/data/translationBattlePrompts.ts');
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
assert.equal(hash(withHistoricalReviewedQuestions(QUESTIONS)),audit.questionsSha256,'Other scopes remain intact; the separately approved Pre-2 L3 curriculum has its own checks');
// Later, separately audited course reviews may change other prompt entries.
// Their scope is checked by test-sequential-prompt-reviews.mjs; keep this
// regression focused on the published Pre-2 questions and exact display data.
assert.equal(audit.rows.length,223);
assert.equal(audit.rows.filter(r=>r.changed).length,83);
for(const row of audit.rows){
 const q=QUESTIONS.EikenPre2[2].find(q=>q.text===row.text);assert.ok(q);
 assert.equal(q.translation,row.translation);assert.equal(q.exampleEn,row.exampleEn);
 assert.equal(getQuestionMeaning(q,'EikenPre2'),row.after.meaning);
 const p=getTranslationBattlePrompt(q,'EikenPre2',2);
 assert.deepEqual(p?.alternatives??[],row.after.alternatives);
 assert.deepEqual(p?.contrasts??[],row.after.contrasts);
 assert.equal(p?.formNote??'',row.after.formNote);
 // Stored question objects from an existing save resolve through the same adapter.
 assert.equal(getQuestionMeaning(JSON.parse(JSON.stringify(q)),'EikenPre2'),row.after.meaning);
}
const row=text=>audit.rows.find(r=>r.text===text).after;
assert.equal(row('catch up with').contrasts[0].text,'keep up with');
assert.equal(row('keep up with').contrasts[0].text,'catch up with');
assert.equal(row('be tired from').contrasts[0].text,'be tired of');
assert.equal(row('mean to').alternatives[0].text,'intend to');
assert.ok(row('after all').meaning.includes('予想・心配に反して'));
assert.ok(row('after all').meaning.includes('何と言っても'));
assert.ok(row('at most').meaning.includes('数量の上限'));
assert.deepEqual(row('no more than').alternatives.map(a=>a.text),['only','at most']);
console.log('PASS: 223 reviewed; 83 corrected; all source identities and published Pre-2 prompts preserved.');
