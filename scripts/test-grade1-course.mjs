import assert from 'node:assert/strict';
import fs from 'node:fs';
import { load } from './lib/load-typescript-data.mjs';

const { QUESTIONS } = load('src/data/questions.ts');
const { grade1VocabularyRows, grade1AdvancedVocabularyRows } = load('src/data/questionSets/eiken/grade1Vocabulary.ts');
const { grade1PhraseRows } = load('src/data/questionSets/eiken/grade1Phrases.ts');
const keys = ['Eiken1Part1', 'Eiken1Part2'];
const normalize = text => text.toLowerCase().replace(/[^a-z0-9]/g, '');
const seen = new Map();
for (const [difficulty, levels] of Object.entries(QUESTIONS)) {
  if (difficulty === 'Conversation') continue;
  for (const [level, questions] of Object.entries(levels)) for (const question of questions) {
    const key = normalize(question.text);
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key).push(`${difficulty}:${level}`);
  }
}
for (const key of keys) {
  const levels = QUESTIONS[key];
  assert.ok(levels[1].length >= 250 && levels[2].length >= 65 && levels[3].length >= 35, `${key}: incomplete level`);
  for (const [level, questions] of Object.entries(levels)) {
    const meanings = new Set();
    for (const question of questions) {
      assert.ok(question.text && question.translation && /[\u3040-\u30ff\u3400-\u9fff]/.test(question.translation), `${key}: untranslated ${question.text}`);
      assert.ok(!/[～<>]/.test(question.text), `${key}: unresolved placeholder ${question.text}`);
      assert.ok(!meanings.has(question.translation), `${key}: ambiguous duplicate cue ${question.translation}`);
      meanings.add(question.translation);
      assert.deepEqual(seen.get(normalize(question.text)), [`${key}:${level}`], `${key}: repeated answer ${question.text}`);
      if (Number(level) < 3) {
        assert.ok(question.exampleEn && question.exampleEn.length < 150, `${key}: missing example ${question.text}`);
      } else {
        assert.ok(question.grammarPoint?.label && question.grammarPoint?.note && question.text.length < 110, `${key}: sentence note/length ${question.text}`);
      }
    }
  }
}

// Optional source-ID audit. The user's attachment is deliberately not part of the shipped app.
if (process.argv[2]) {
  const sourceText = fs.readFileSync(process.argv[2], 'utf8');
  const source = new Map([...sourceText.matchAll(/^(\d+)\.\s+([^\r\n]+)/gm)].map(match => [Number(match[1]), match[2].trim()]));
  assert.equal(source.size, 2400, 'Unexpected source heading count');
  const vocabulary = `${grade1VocabularyRows}\n${grade1AdvancedVocabularyRows}`.split('\n').map(row => row.split('|'));
  for (const [, id, text] of vocabulary) assert.equal(text, source.get(Number(id)), `Source mismatch ${id}`);
  for (const [, id, text] of grade1PhraseRows.split('\n').map(row => row.split('|'))) {
    const original = source.get(Number(id));
    assert.ok(original && text.toLowerCase().startsWith(original.split(' ')[0].toLowerCase()), `Source phrase mismatch ${id}`);
  }
}
console.log(keys.map(key => `${key}: ${[1, 2, 3].map(level => QUESTIONS[key][level].length).join('/')}`).join('\n'));
console.log('Grade 1 content audit passed.');
