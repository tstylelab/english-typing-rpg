import assert from 'node:assert/strict';
import fs from 'node:fs';
import { load } from './lib/load-typescript-data.mjs';

const { QUESTIONS } = load('src/data/questions.ts');
const { getQuestionMeaning } = load('src/data/questionMeaning.ts');
const corrections = JSON.parse(fs.readFileSync('src/data/intermediateMeaningCorrections.json', 'utf8'));
const additional = JSON.parse(fs.readFileSync('src/data/additionalMeaningCorrections.json', 'utf8'));
const report = fs.readFileSync('docs/meaning-context-review-2026-09-24.md', 'utf8');
const id = q => JSON.stringify([q.text, q.translation, q.exampleEn ?? '']);
const key = (course, q) => `${course}:${id(q)}`;
const expected = new Map(corrections.map(c => [key(c.course, c), c]));
assert.equal(expected.size, 292, 'duplicate or missing corrections');
const allExpected = new Map([...corrections, ...additional].map(c => [key(c.course, c), c]));
const matches = new Map([...expected.keys()].map(k => [k, 0]));
let tested = 0;
for (const [course, levels] of Object.entries(QUESTIONS)) {
  for (const [level, qs] of Object.entries(levels)) {
    for (const q of qs) {
      const before = JSON.stringify(q);
      const c = expected.get(key(course, q));
      const baseline = getQuestionMeaning(q);
      const actual = getQuestionMeaning(q, course);
      assert.equal(actual, allExpected.get(key(course, q))?.meaning ?? baseline, `${course}: ${q.text}`);
      assert.equal(getQuestionMeaning(JSON.parse(before), course), actual, 'saved question round trip');
      assert.equal(JSON.stringify(q), before, 'question identity mutated');
      if (c) {
        assert.equal(c.level, Number(level));
        assert.ok(actual.length <= (level === '1' ? 26 : level === '2' ? 38 : 55), `long meaning: ${q.text}`);
        assert.equal((actual.match(/（/g) ?? []).length, (actual.match(/）/g) ?? []).length);
        assert.ok(!/[()]/.test(actual), 'use full-width hint parentheses');
        assert.notEqual(actual, baseline);
        matches.set(key(course, q), matches.get(key(course, q)) + 1);
        // Each course uses only its own explicit overrides, even for shared questions.
        for (const other of Object.keys(QUESTIONS).filter(d => d !== course)) {
          assert.equal(getQuestionMeaning(q, other), allExpected.get(key(other, q))?.meaning ?? baseline, `leak: ${course} -> ${other}, ${q.text}`);
        }
      }
      tested++;
    }
  }
}
for (const [k, count] of matches) assert.equal(count, 1, `stale correction: ${k}`);
const courses = { '英検4級': 'Eiken4', '英検3級': 'Eiken3', '英検準2級': 'EikenPre2', '英検2級': 'Eiken2' };
const counts = { Eiken4: 0, Eiken3: 0, EikenPre2: 0, Eiken2: 0 };
let course;
const seen = new Set();
for (const line of report.split('\n')) {
  const heading = line.match(/^### (英検[^（]+)（/);
  if (heading) course = courses[heading[1]];
  if (!/^\| [123] \|/.test(line)) continue;
  const [level, text, before, after] = line.split('|').slice(1, -1).map(s => s.trim());
  const q = QUESTIONS[course][level].find(q => q.text === text);
  assert.ok(q, `report entry missing: ${text}`);
  assert.equal(getQuestionMeaning(q, course), after, `report mismatch: ${text}`);
  assert.notEqual(before, after);
  assert.ok(!seen.has(key(course, q)), `duplicate report: ${text}`);
  seen.add(key(course, q));
  counts[course]++;
}
assert.deepEqual(counts, { Eiken4: 47, Eiken3: 67, EikenPre2: 73, Eiken2: 152 });
assert.equal(getQuestionMeaning(QUESTIONS.Eiken4[2].find(q => q.text === 'get up'), 'Eiken4'), '（寝床から）起きる');
assert.deepEqual(Object.values(QUESTIONS.Eiken3).map(q => q.length), [514, 183, 168]);
assert.deepEqual(Object.values(QUESTIONS.EikenPre2).map(q => q.length), [650, 223, 173]);
assert.deepEqual(Object.values(QUESTIONS.Eiken2).map(q => q.length), [549, 203, 94]);
const app = fs.readFileSync('src/App.tsx', 'utf8');
for (const line of app.split('\n').filter(l => l.includes('getQuestionMeaning('))) {
  if (line.includes('speakBeginnerBattlePrompt')) continue; // standalone beginner material
  assert.ok(/getQuestionMeaning\([^,]+, (difficulty|gameState.selectedDifficulty|currentPlayer.difficulty)\)/.test(line), 'missing course context');
}
assert.ok(app.includes('difficulty={gameState.selectedDifficulty}'));
console.log(`PASS: ${tested} questions; 339 documented changes; scoped meanings, unchanged other courses, legacy identities and all UI call sites.`);
