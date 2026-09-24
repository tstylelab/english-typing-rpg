import assert from 'node:assert/strict';
import fs from 'node:fs';
import { load } from './lib/load-typescript-data.mjs';

const { QUESTIONS } = load('src/data/questions.ts');
const { getQuestionMeaning } = load('src/data/questionMeaning.ts');
const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const additional = read('src/data/additionalMeaningCorrections.json');
const intermediate = read('src/data/intermediateMeaningCorrections.json');
const key = (course, q) => JSON.stringify([course, q.text, q.translation, q.exampleEn ?? '']);
const all = new Map([...intermediate, ...additional].map(c => [key(c.course, c), c]));
assert.equal(all.size, intermediate.length + additional.length, 'duplicate scoped override');
const counts = Object.fromEntries(['Eiken5', 'EikenPre1Part1', 'EikenPre1Part2', 'Eiken1Part1', 'Eiken1Part2'].map(c => [c, 0]));
const report = fs.readFileSync('docs/additional-meaning-context-review-2026-09-24.md', 'utf8');
assert.equal(report.split('\n').filter(l => /^\| [123] \|/.test(l)).length, additional.length);
for (const c of additional) {
  const qs = QUESTIONS[c.course][c.level].filter(q => key(c.course, q) === key(c.course, c));
  assert.equal(qs.length, 1, 'stale/ambiguous override: ' + c.text);
  const q = qs[0];
  const legacy = getQuestionMeaning(q);
  const original = JSON.stringify(q);
  assert.notEqual(c.meaning, legacy);
  assert.equal(getQuestionMeaning(q, c.course), c.meaning);
  assert.equal(getQuestionMeaning(JSON.parse(original), c.course), c.meaning);
  assert.equal(JSON.stringify(q), original, 'saved identity mutated');
  assert.ok(c.meaning.length <= 60, c.text);
  assert.ok(!/[()]/.test(c.meaning));
  assert.equal((c.meaning.match(/（/g) ?? []).length, (c.meaning.match(/）/g) ?? []).length);
  assert.ok(c.meaning.replace(/（[^）]*）/g, '').trim().length > 0, 'meaning must not be entirely a hint');
  assert.ok(report.includes(`| ${c.level} | ${c.text} | ${legacy} | ${c.meaning} |`));
  for (const other of Object.keys(QUESTIONS)) {
    assert.equal(getQuestionMeaning(q, other), all.get(key(other, q))?.meaning ?? legacy, 'cross-course leak');
  }
  counts[c.course]++;
}
assert.deepEqual(counts, { Eiken5: 18, EikenPre1Part1: 119, EikenPre1Part2: 221, Eiken1Part1: 68, Eiken1Part2: 87 });
assert.equal(Object.keys(counts).reduce((n, c) => n + Object.values(QUESTIONS[c]).flat().length, 0), 3578);
assert.equal(Object.values(QUESTIONS).flatMap(l => Object.values(l).flat()).length, 7392);
console.log('PASS: 513 documented additional corrections; scoped meanings, saved identities, complete counts and usable hint text.');
