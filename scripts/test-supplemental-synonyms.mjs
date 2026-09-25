import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { load } from './lib/load-typescript-data.mjs';

const { QUESTIONS } = load('src/data/questions.ts');
const { getQuestionSynonyms } = load('src/data/questionSynonyms.ts');
const rows = load('src/data/supplementalQuestionSynonyms.json');
const key = (course, level, q) => JSON.stringify([course, level, q.text, q.translation]);
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const keys = new Set();
const all = Object.entries(QUESTIONS).flatMap(([course, levels]) => (
  Object.entries(levels).flatMap(([level, qs]) => qs.map(q => [course, +level, q]))
));

assert.equal(rows.length, 2377);
for (const row of rows) {
  const id = key(row.difficulty, row.level, row);
  assert.ok(!keys.has(id), `Duplicate: ${id}`);
  keys.add(id);
  assert.ok([1, 2].includes(row.level), `Sentence-level additions are out of scope: ${id}`);
  const matches = QUESTIONS[row.difficulty][row.level].filter(q => key(row.difficulty, row.level, q) === id);
  assert.equal(matches.length, 1, `Missing/ambiguous original question: ${id}`);
  assert.ok(row.synonyms.length >= 1 && row.synonyms.length <= 3, id);
  assert.equal(new Set(row.synonyms.map(s => s.toLowerCase())).size, row.synonyms.length, id);
  for (const synonym of row.synonyms) {
    assert.equal(synonym, synonym.trim(), id);
    assert.ok(synonym.length > 0 && synonym.length <= 24, `Truncated hint: ${id}: ${synonym}`);
    assert.notEqual(synonym.toLowerCase(), row.text.toLowerCase(), `Self synonym: ${id}`);
  }
  assert.deepEqual([...getQuestionSynonyms(row.difficulty, row.level, matches[0])], row.synonyms, id);
}

// Captured before the change (faca580): all question content/order/IDs and every
// untouched synonym result, including Level 3 and Conversation, must stay intact.
assert.equal(all.length, 7392);
assert.equal(digest(QUESTIONS), '5b1da603cfc491d9c8cb098534e23d690b9a2335f8378b44acc84a36a371be49');
const unchanged = all.filter(([c, l, q]) => !keys.has(key(c, l, q)))
  .map(([c, l, q]) => [c, l, q.text, q.translation, getQuestionSynonyms(c, l, q)]);
assert.equal(digest(unchanged), '1b63a91795e971299fe00db54770f56136866f83f636891259451eb9db955972');

const question = (course, level, text) => {
  const q = QUESTIONS[course][level].find(item => item.text === text);
  assert.ok(q, `${course}/${level}/${text}`);
  return q;
};
for (const [c, l, text, expected] of [
  ['Eiken3', 1, 'fix', 'repair'], ['Eiken3', 2, 'give me a hand', 'help me'],
  ['EikenPre2', 1, 'principal', 'head teacher'], ['EikenPre2', 1, 'lie', 'recline'],
  ['Eiken2', 1, 'object', 'thing'], ['Eiken2', 1, 'decline', 'decrease'],
  ['EikenPre1Part1', 1, 'beverage', 'drink'], ['EikenPre1Part2', 2, 'in charge of', 'responsible for'],
  ['Eiken1Part1', 1, 'stem', 'originate'], ['Eiken1Part1', 1, 'cast', 'performers'],
  ['Eiken1Part2', 1, 'agitate', 'stir'], ['Eiken1Part2', 2, 'let on', 'reveal'],
  ['Eiken5', 2, 'turn on', 'switch on'], ['Eiken4', 2, 'care for animals', 'look after animals'],
]) {
  assert.ok(getQuestionSynonyms(c, l, question(c, l, text)).includes(expected), `${c}/${text}`);
}

// The same spelling with another meaning must not borrow this course's hint,
// even when the real question already populated the result cache.
const fix = question('Eiken3', 1, 'fix');
assert.deepEqual([...getQuestionSynonyms('Eiken3', 1, { ...fix, translation: '固定する（別義）' })], []);
assert.deepEqual([...getQuestionSynonyms('Eiken3', 2, fix)], []);
assert.deepEqual([...getQuestionSynonyms('Conversation', 1, fix)], []);
assert.deepEqual([...getQuestionSynonyms('Eiken3', 1, { ...fix, synonyms: ['mend', 'mend'] })], ['mend']);
for (const [c, text] of [['EikenPre1Part1', 'protein'], ['EikenPre1Part2', 'hydrogen']]) {
  assert.deepEqual([...getQuestionSynonyms(c, 1, question(c, 1, text))], [], 'No forced category-word fillers');
}
const cached = getQuestionSynonyms('Eiken3', 1, fix);
assert.equal(getQuestionSynonyms('Eiken3', 1, fix), cached, 'Reuse cached array');

const start = performance.now();
for (let pass = 0; pass < 10; pass++) for (const [c, l, q] of all) getQuestionSynonyms(c, l, q);
console.log(`PASS: ${rows.length} additions; ${unchanged.length} unchanged results; ${all.length} source questions preserved.`);
console.log(`Cached lookup sample: ${all.length * 10} calls in ${(performance.now() - start).toFixed(1)} ms (diagnostic, not a performance guarantee).`);
for (const [c, levels] of Object.entries(QUESTIONS)) {
  if (c === 'Conversation') continue;
  console.log(c, [1, 2].map(l => `L${l}: ${levels[l].filter(q => getQuestionSynonyms(c, l, q).length).length}/${levels[l].length}`).join(', '));
}
