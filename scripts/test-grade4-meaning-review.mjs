import assert from 'node:assert/strict';
import fs from 'node:fs';
import { load } from './lib/load-typescript-data.mjs';

const { QUESTIONS } = load('src/data/questions.ts');
const { getQuestionMeaning } = load('src/data/questionMeaning.ts');
const corrections = JSON.parse(fs.readFileSync('src/data/grade4MeaningCorrections.json', 'utf8'));
const report = fs.readFileSync('docs/grade4-meaning-review-2026-09-24.md', 'utf8');
const identity = q => JSON.stringify([q.text, q.translation, q.exampleEn ?? '']);
const ids = new Set(corrections.map(identity));
assert.equal(ids.size, 157);
let otherQuestions = 0;
for (const [course, levels] of Object.entries(QUESTIONS)) {
  for (const [level, questions] of Object.entries(levels)) {
    for (const q of questions) {
      const before = JSON.stringify(q);
      if (course !== 'Eiken4') {
        assert.ok(!ids.has(identity(q)), `Grade 4 override leaks to ${course}: ${q.text}`);
        otherQuestions++;
      } else {
        const correction = corrections.find(c => identity(c) === identity(q));
        const expected = correction?.meaning ?? q.translation;
        assert.equal(getQuestionMeaning(q), expected);
        assert.equal(getQuestionMeaning(JSON.parse(before)), expected);
        if (correction) assert.equal(correction.level, Number(level));
      }
      assert.equal(JSON.stringify(q), before, 'saved question identity mutated');
    }
  }
}
let level = 0;
const counts = { 1: 0, 2: 0, 3: 0 };
const seen = new Set();
for (const line of report.split('\n')) {
  const heading = line.match(/^### Level ([123])/);
  if (heading) level = Number(heading[1]);
  if (!line.startsWith('| ') || line.startsWith('| 英語')) continue;
  const [text, before, after, reason] = line.split('|').slice(1, -1).map(s => s.trim());
  const q = QUESTIONS.Eiken4[level].find(q => q.text === text);
  assert.ok(q, `missing report question: ${text}`);
  assert.ok(!seen.has(text), `duplicate report row: ${text}`);
  seen.add(text);
  assert.equal(getQuestionMeaning(q), after, `report does not match UI: ${text}`);
  assert.notEqual(before, after);
  assert.ok(reason);
  assert.ok(after.length <= (level === 3 ? 35 : 22), `too long: ${text}`);
  counts[level]++;
}
assert.deepEqual(counts, { 1: 80, 2: 23, 3: 13 });
assert.deepEqual(Object.values(QUESTIONS.Eiken4).map(q => q.length), [441, 200, 200]);
console.log(`PASS: 116 documented changes, 841 Grade 4 questions, ${otherQuestions} other-course questions isolated, saved identities preserved.`);
