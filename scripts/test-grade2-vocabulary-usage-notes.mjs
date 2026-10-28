import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { load } from './lib/load-typescript-data.mjs';

const { QUESTIONS } = load('src/data/questions.ts');
const { getGrade2VocabularyUsageNote: note } = load('src/data/grade2VocabularyUsageNotes.ts');
const entries = JSON.parse(fs.readFileSync('src/data/grade2VocabularyUsageNotes.json', 'utf8'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
assert.equal(hash(QUESTIONS), '8af479f03894bf6c225aabdc2e38bc56fadaa5d0259402a83fdf6f0f11482ca1');
assert.equal(entries.length, 15);
const identity = q => JSON.stringify([q.text, q.translation, q.exampleEn ?? '']);
assert.equal(new Set(entries.map(identity)).size, entries.length);
const expected = new Map(entries.map(e => [identity(e), e.note]));
let matched = 0, checked = 0;
for (const [course, levels] of Object.entries(QUESTIONS)) for (const [level, questions] of Object.entries(levels)) {
  for (const q of questions) {
    const original = JSON.stringify(q);
    const expectedNote = course === 'Eiken2' && Number(level) === 1 ? expected.get(identity(q)) : undefined;
    assert.equal(note(course, Number(level), q), expectedNote);
    assert.equal(note(course, Number(level), JSON.parse(original)), expectedNote, 'Legacy identity survives import');
    assert.equal(JSON.stringify(q), original);
    if (expectedNote) matched++;
    checked++;
  }
}
assert.equal(checked, 7650); assert.equal(matched, 15);
for (const e of entries) {
  assert.ok(e.note.length <= 110 && !e.note.includes('\n'), 'A short, single-paragraph bridge');
  assert.equal(note('Eiken2', 2, e), undefined);
  assert.equal(note('EikenPre1Part1', 1, e), undefined);
  assert.equal(note('Eiken2', 1, { ...e, exampleEn: 'Different sense.' }), undefined);
  assert.equal(note('Eiken2', 1, { ...e, translation: e.translation + '別の問題' }), undefined);
}
const byWord = Object.fromEntries(entries.map(e => [e.text, e.note]));
assert.match(byWord.label, /ラベル.*レーベル/);
assert.match(byWord.digest, /名詞.*要約.*動詞.*消化する/);
assert.match(byWord.identity, /身元.*その人・集団らしさ/);
assert.match(byWord.initial, /名詞.*頭文字.*形容詞/);
assert.match(byWord.source, /source.*sauce/);
assert.match(byWord.classic, /classical music/);
// Explanations stay out of the prompt/answer/identity data paths.
for (const file of ['questions.ts', 'questionMeaning.ts', 'questionSynonyms.ts', 'translationBattlePrompts.ts']) {
  assert.ok(!fs.readFileSync('src/data/' + file, 'utf8').includes('grade2VocabularyUsageNotes'), file);
}
const app = fs.readFileSync('src/App.tsx', 'utf8');
assert.ok(app.includes('{showMeaning && usageNote && <p data-vocabulary-usage-note>'));
assert.equal((app.match(/data-vocabulary-usage-note/g) || []).length, 3, 'List, previous answer, active results only');
console.log('PASS: 549 Grade 2 words audited; 15 scoped usage notes, all 7,650 legacy identities untouched; no prompt, meaning, synonym or grading changes.');
