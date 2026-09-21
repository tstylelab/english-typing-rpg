import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const read = path => fs.readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const corrections = JSON.parse(read('src/data/pre1MeaningCorrections.json'));
const source = read('src/data/questionMeaning.ts').replace(
  "import corrections from './pre1MeaningCorrections.json';",
  `const corrections = ${JSON.stringify(corrections)};`,
);
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { getQuestionMeaning } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
const files = ['eiken/grade5', 'eiken/grade4', 'eiken/gradepre1-part1', 'eiken/gradepre1-part2', 'conversation/beginner'];
let audited = 0;
let changed = 0;
const matches = new Map(corrections.map(c => [c.text, 0]));
assert.equal(matches.size, corrections.length, 'duplicate override words');
for (const file of files) {
  const data = JSON.parse(read(`src/data/questionSets/${file}.json`));
  for (const [level, questions] of Object.entries(data.levels)) {
    for (const q of questions) {
      const before = JSON.stringify(q);
      const key = `${data.difficultyKey}:${level}:${q.text}:${q.translation}`;
      const meaning = getQuestionMeaning(q);
      const inScope = file.includes('gradepre1-part') && level === '1';
      if (inScope) audited++;
      if (meaning !== q.translation) {
        assert.ok(inScope, `unexpected change: ${key}`);
        changed++;
        matches.set(q.text, matches.get(q.text) + 1);
        assert.ok(meaning.length <= 60, `${q.text}: prompt too long`);
        // Saved queues and JSON export/import have plain objects, not library references.
        assert.equal(getQuestionMeaning(JSON.parse(before)), meaning);
      }
      assert.equal(JSON.stringify(q), before, 'must not mutate question or saved identity');
      assert.equal(`${data.difficultyKey}:${level}:${q.text}:${q.translation}`, key);
    }
  }
}
assert.equal(audited, 1446);
assert.equal(changed, corrections.length);
for (const [word, count] of matches) assert.equal(count, 1, `stale/ambiguous correction: ${word}`);
for (const word of ['demonstrate', 'shift', 'conventional', 'overall', 'notably', 'publicity']) {
  assert.ok(matches.get(word), `reported word missing: ${word}`);
}
assert.equal(getQuestionMeaning({ text: 'overall', translation: '別の意味' }), '別の意味');
const app = read('src/App.tsx');
for (const q of ['question', 'q', 'currentQuestion', 'gameState.currentQuestion', 'lastSolvedQuestion', 'log.question']) {
  assert.ok(!app.includes(`>{${q}.translation}<`), `old visible meaning: ${q}`);
}
assert.ok(app.includes('`${difficulty}:${level}:${question.text}:${question.translation}`'), 'legacy status key changed');
assert.ok(app.includes('text: getQuestionMeaning(question),'), 'autoplay speech not updated');
assert.ok(app.includes('meaning: question.translation,'), 'AI history grouping identity must stay unchanged');
console.log(`PASS: ${audited} Pre-1 Level 1 entries, ${changed} corrections; other courses/levels unchanged; legacy identities and saved-question round trips preserved.`);
