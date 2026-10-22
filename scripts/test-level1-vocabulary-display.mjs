import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';
import { load } from './lib/load-typescript-data.mjs';

// Approved review and the release immediately before its implementation.
const baseline = '0508dafec03b083a6581614441a1fdebd19abebd';
const sha = value => createHash('sha256').update(value).digest('hex');
const material = fs.readFileSync('src/data/level1VocabularyDisplayCorrections.json', 'utf8').replace(/\r\n/g, '\n');
assert.equal(sha(material), 'e3692457c6add626e1e9b85c2998a53acb05644f58d8bb3e730abfd4c58efe7a', 'Keep the user-reviewed meanings and examples');
const entries = JSON.parse(material);
const { QUESTIONS } = load('src/data/questions.ts');
assert.equal(sha(JSON.stringify(QUESTIONS)), '8af479f03894bf6c225aabdc2e38bc56fadaa5d0259402a83fdf6f0f11482ca1', 'Every original question, saved translation, example and order stays unchanged');
const { getQuestionMeaning } = load('src/data/questionMeaning.ts');
const { getQuestionExample } = load('src/data/questionExamples.ts');
const { getLevel1VocabularyDisplay } = load('src/data/level1VocabularyDisplay.ts');
const originalModule = file => {
  const source = execFileSync('git', ['show', `${baseline}:${file}`], { encoding: 'utf8', maxBuffer: 8_000_000 });
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, { module, exports: module.exports, require: name => load(path.posix.join(path.posix.dirname(file), name)) });
  return module.exports;
};
const priorMeaning = originalModule('src/data/questionMeaning.ts').getQuestionMeaning;
const priorExample = originalModule('src/data/questionExamples.ts').getQuestionExample;
const identity = q => JSON.stringify([q.text, q.translation, q.exampleEn ?? '']);
const key = (course, level, q) => `${course}:${level}:${identity(q)}`;
const byKey = new Map(entries.map(e => [key(e.course, e.level, e), e]));
assert.equal(byKey.size, 615);
assert.equal(entries.filter(e => e.meaning).length, 348);
assert.equal(entries.filter(e => e.displayExampleEn).length, 308);
for (const entry of entries) {
  assert.equal(entry.level, 1);
  assert.notEqual(entry.course, 'Eiken2', 'Keep the already released Grade 2 review');
  assert.equal(QUESTIONS[entry.course][1].filter(q => identity(q) === identity(entry)).length, 1, 'Unique original identity');
  for (const meaning of [entry.meaning].filter(Boolean)) {
    assert.equal((meaning.match(/（/g) ?? []).length, (meaning.match(/）/g) ?? []).length);
  }
}
let checked = 0, changedMeanings = 0, changedExamples = 0;
for (const [course, levels] of Object.entries(QUESTIONS)) {
  for (const [level, questions] of Object.entries(levels)) {
    for (const question of questions) {
      const before = JSON.stringify(question), e = byKey.get(key(course, level, question));
      const oldMeaning = priorMeaning(question, course);
      const oldExample = priorExample(course, Number(level), question);
      const expectedMeaning = e?.meaning ?? oldMeaning, expectedExample = e?.displayExampleEn ?? oldExample;
      assert.equal(getQuestionMeaning(question, course), expectedMeaning, key(course, level, question));
      assert.equal(getQuestionExample(course, Number(level), question), expectedExample, key(course, level, question));
      const imported = JSON.parse(before);
      assert.equal(getQuestionMeaning(imported, course), expectedMeaning, 'Imported save copies keep their display');
      assert.equal(getQuestionExample(course, Number(level), imported), expectedExample);
      assert.equal(JSON.stringify(question), before, 'Display lookup must not mutate a saved question');
      assert.equal(getQuestionMeaning(question), priorMeaning(question), 'Course-less legacy lookup is unchanged');
      if (expectedMeaning !== oldMeaning) changedMeanings++;
      if (expectedExample !== oldExample) changedExamples++;
      if (e) {
        assert.equal(getLevel1VocabularyDisplay({ ...question, translation: question.translation + ' edited' }, course), undefined);
        assert.equal(getLevel1VocabularyDisplay({ ...question, exampleEn: (question.exampleEn ?? '') + ' edited' }, course), undefined);
        assert.equal(getLevel1VocabularyDisplay(question), undefined);
      }
      checked++;
    }
  }
}
assert.equal(checked, 7650);
assert.equal(changedMeanings, 348);
assert.equal(changedExamples, 308);
// Regression examples for missing core meanings, overly narrow labels and bad
// fallback sentences. The word is still the original grading/saved text.
for (const [course, text, meaning] of [
  ['Eiken5', 'about', '～について／およそ'],
  ['Eiken3', 'capital', '首都'],
  ['EikenPre1Part1', 'administer', '運営する／（薬などを）投与する'],
  ['Eiken1Part1', 'critical', '極めて重要な／危機的な／批判的な'],
]) {
  const q = QUESTIONS[course][1].find(q => q.text === text);
  assert.equal(getQuestionMeaning(q, course), meaning);
}
for (const [course, text, example] of [
  ['Eiken5', 'glad', 'I am glad to see you.'],
  ['Eiken4', 'because', 'I stayed home because it was rainy.'],
  ['EikenPre1Part2', 'simultaneous', 'The two events were simultaneous.'],
]) {
  const q = QUESTIONS[course][1].find(q => q.text === text);
  assert.equal(getQuestionExample(course, 1, q), example);
}
console.log(`PASS: ${checked} original questions and imported clones; exactly ${changedMeanings} meanings and ${changedExamples} examples changed; all other courses/levels and saved identities retained.`);
