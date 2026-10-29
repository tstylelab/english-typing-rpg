import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import ts from 'typescript';
import { load } from './lib/load-typescript-data.mjs';

const baseline = '657ff1942a4c96ec62f1ad6a38a1e27dd6ea69f4';
const plain = value => JSON.parse(JSON.stringify(value));
const { QUESTIONS } = load('src/data/questions.ts');
const current = load('src/data/questionSynonyms.ts');
const { getGrade2PhraseSynonymReview: review } = load('src/data/grade2PhraseSynonymReview.ts');
const { getLevel2PhraseReview } = load('src/data/level2PhraseReview.ts');
const entries = JSON.parse(fs.readFileSync('src/data/grade2PhraseSynonymReview.json', 'utf8'));
const approved = {
  'in person': ['personally（本人が直接）', 'face to face（対面で）'],
  'on schedule': ['on time（時間どおりに）'],
  'in detail': ['thoroughly（徹底的に・十分に）'],
  'pass away': ['die（死ぬ・直接的な言い方）'],
  'manage to': ['succeed in（〜に成功する・動詞は-ing形）'],
  'be capable of': ['be able to（〜できる・後ろは動詞の原形）'],
};
assert.equal(entries.length, 6);
assert.equal(createHash('sha256').update(JSON.stringify(QUESTIONS)).digest('hex'),
  '8af479f03894bf6c225aabdc2e38bc56fadaa5d0259402a83fdf6f0f11482ca1');
const file = 'src/data/questionSynonyms.ts';
const source = execFileSync('git', ['show', `${baseline}:${file}`], { encoding: 'utf8' });
const module = { exports: {} };
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, { module, exports: module.exports, require: name => load(path.posix.join(path.posix.dirname(file), name)) });
const prior = module.exports;
let checked = 0, changed = 0;
for (const [course, levels] of Object.entries(QUESTIONS)) for (const [level, questions] of Object.entries(levels)) {
  for (const q of questions) {
    const n = Number(level), before = JSON.stringify(q), labels = plain(current.getQuestionSynonymLabels(course, n, q));
    if (course === 'Eiken2' && n === 2 && Object.hasOwn(approved, q.text)) {
      assert.deepEqual(labels, approved[q.text]);
      assert.deepEqual(plain(current.getQuestionSynonyms(course, n, q)), review(course, n, q).map(e => e.text));
      changed++;
    } else if (!getLevel2PhraseReview(course, n, q)) {
      assert.deepEqual(labels, plain(prior.getQuestionSynonymLabels(course, n, q)), 'No display leakage: ' + course + ':' + level + ':' + q.text);
      assert.deepEqual(plain(current.getQuestionSynonyms(course, n, q)), plain(prior.getQuestionSynonyms(course, n, q)));
    }
    assert.deepEqual(plain(current.getQuestionSynonymLabels(course, n, JSON.parse(before))), labels, 'Saved/imported copies resolve');
    assert.equal(current.getQuestionSynonymHeading(course, n, q), prior.getQuestionSynonymHeading(course, n, q));
    assert.equal(JSON.stringify(q), before, 'Never mutate a saved question');
    checked++;
  }
}
assert.equal(checked, 7650); assert.equal(changed, 6);
for (const e of entries) {
  assert.equal(QUESTIONS.Eiken2[2].filter(q => q.text === e.text && q.translation === e.translation && q.exampleEn === e.exampleEn).length, 1);
  assert.equal(review('Eiken2', 1, e), undefined);
  assert.equal(review('Eiken2', 3, e), undefined);
  assert.equal(review('Eiken3', 2, e), undefined);
  assert.equal(review('Eiken2', 2, { ...e, translation: e.translation + ' edited' }), undefined);
  assert.equal(review('Eiken2', 2, { ...e, exampleEn: e.exampleEn + ' edited' }), undefined);
  assert.ok(e.expressions.length <= 2);
}
const prompts = 'src/data/translationBattlePrompts.json';
assert.deepEqual(JSON.parse(fs.readFileSync(prompts, 'utf8')), JSON.parse(execFileSync('git', ['show', `${baseline}:${prompts}`], { encoding: 'utf8', maxBuffer: 8_000_000 })),
  'Before-answer prompts and hints remain unchanged');
console.log('PASS: exactly six approved Grade 2 Level 2 related-word displays; 7,650 original/imported identities, all other displays and before-answer hints retained.');
