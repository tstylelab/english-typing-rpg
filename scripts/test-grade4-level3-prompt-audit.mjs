import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { load } from './lib/load-typescript-data.mjs';

const { QUESTIONS } = load('src/data/questions.ts');
const { getQuestionMeaning } = load('src/data/questionMeaning.ts');
const corrections = JSON.parse(readFileSync('src/data/grade4MeaningCorrections.json', 'utf8'));
const report = readFileSync('docs/grade4-level3-prompt-audit-2026-10-02.md', 'utf8');
const questions = QUESTIONS.Eiken4[3];
const identity = question => JSON.stringify([
  question.text, question.translation, question.exampleEn ?? '',
]);

assert.equal(questions.length, 209);
assert.equal(new Set(questions.map(identity)).size, 209);
assert.equal(new Set(corrections.map(identity)).size, corrections.length, 'duplicate correction identity');

const rows = report.split('\n').filter(line => line.startsWith('| ') && !line.startsWith('| 英文'));
assert.equal(rows.length, 20, 'report must list every change');
const documented = new Set();
for (const row of rows) {
  const [text, before, after, reason] = row.split('|').slice(1, -1).map(value => value.trim());
  const question = questions.find(question => question.text === text);
  assert.ok(question, `report references an unknown question: ${text}`);
  assert.ok(!documented.has(text), `duplicate report entry: ${text}`);
  documented.add(text);
  assert.ok(before && after && reason && before !== after);
  assert.equal(corrections.find(entry => identity(entry) === identity(question))?.meaning, after);
  assert.equal(getQuestionMeaning(question, 'Eiken4'), after);
  assert.equal(getQuestionMeaning(JSON.parse(JSON.stringify(question)), 'Eiken4'), after,
    `saved question must resolve to the revised prompt: ${text}`);
}

for (const text of ['Anything else?', 'Please be kind to animals.', 'Why not?']) {
  assert.ok(documented.has(text), `missing screenshot example: ${text}`);
}

console.log('PASS: 209 Level 3 questions; 20 documented display changes; screenshot prompts and saved-question identities verified.');
