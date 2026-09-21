import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const read = path => fs.readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const corrections = JSON.parse(read('src/data/pre1MeaningCorrections.json'));
const sentenceCorrections = JSON.parse(read('src/data/pre1SentenceMeaningCorrections.json'));
const grade5Corrections = JSON.parse(read('src/data/grade5MeaningCorrections.json'));
const grade4Corrections = JSON.parse(read('src/data/grade4MeaningCorrections.json'));
const allCorrections = [...corrections, ...sentenceCorrections, ...grade5Corrections, ...grade4Corrections];
const source = read('src/data/questionMeaning.ts').replace(
  "import corrections from './pre1MeaningCorrections.json';",
  `const corrections = ${JSON.stringify(corrections)};`,
).replace("import sentenceCorrections from './pre1SentenceMeaningCorrections.json';", `const sentenceCorrections = ${JSON.stringify(sentenceCorrections)};`);
const resolved = source.replace("import grade5Corrections from './grade5MeaningCorrections.json';", `const grade5Corrections = ${JSON.stringify(grade5Corrections)};`);
const resolvedAll = resolved.replace("import grade4Corrections from './grade4MeaningCorrections.json';", `const grade4Corrections = ${JSON.stringify(grade4Corrections)};`);
const compiled = ts.transpileModule(resolvedAll, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { getQuestionMeaning } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
const files = ['eiken/grade5', 'eiken/grade4', 'eiken/gradepre1-part1', 'eiken/gradepre1-part2', 'conversation/beginner'];
let audited = 0;
let changed = 0;
const identity = q => JSON.stringify([q.text, q.translation, q.exampleEn ?? '']);
const matches = new Map(allCorrections.map(c => [identity(c), 0]));
assert.equal(matches.size, allCorrections.length, 'duplicate override words');
const changesByLevel = { 1: 0, 2: 0, 3: 0 };
const grade5Changes = { 1: 0, 2: 0, 3: 0 };
const grade4Changes = { 1: 0, 2: 0, 3: 0 };
for (const file of files) {
  const data = JSON.parse(read(`src/data/questionSets/${file}.json`));
  for (const [level, questions] of Object.entries(data.levels)) {
    for (const q of questions) {
      const before = JSON.stringify(q);
      const key = `${data.difficultyKey}:${level}:${q.text}:${q.translation}`;
      const meaning = getQuestionMeaning(q);
      const isGrade5 = file === 'eiken/grade5';
      const isGrade4 = file === 'eiken/grade4';
      const inScope = file.includes('gradepre1-part') || isGrade5 || isGrade4;
      if (inScope) audited++;
      if (meaning !== q.translation) {
        assert.ok(inScope, `unexpected change: ${key}`);
        changed++;
        (isGrade5 ? grade5Changes : isGrade4 ? grade4Changes : changesByLevel)[level]++;
        if (isGrade4) {
          const correction = grade4Corrections.find(c => identity(c) === identity(q));
          assert.equal(String(correction?.level), level);
          assert.ok(meaning.length <= (level === '3' ? 35 : 22), `${q.text}: grade 4 prompt too long`);
        } else if (isGrade5) {
          const correction = grade5Corrections.find(c => identity(c) === identity(q));
          assert.equal(String(correction?.level), level);
          assert.ok(meaning.length <= (level === '3' ? 30 : 22), `${q.text}: grade 5 prompt too long`);
        } else if (level !== '1') {
          const correction = sentenceCorrections.find(c => c.text === q.text);
          assert.equal(String(correction.level), level);
          assert.ok(file.endsWith(`part${correction.part}`));
        }
        matches.set(identity(q), matches.get(identity(q)) + 1);
        assert.ok(meaning.length <= 60, `${q.text}: prompt too long`);
        // Saved queues and JSON export/import have plain objects, not library references.
        assert.equal(getQuestionMeaning(JSON.parse(before)), meaning);
      }
      assert.equal(JSON.stringify(q), before, 'must not mutate question or saved identity');
      assert.equal(`${data.difficultyKey}:${level}:${q.text}:${q.translation}`, key);
    }
  }
}
assert.equal(audited, 3653);
assert.deepEqual(grade4Changes, { 1: 21, 2: 12, 3: 15 });
assert.deepEqual(grade5Changes, { 1: 14, 2: 15, 3: 11 });
assert.deepEqual(changesByLevel, { 1: 85, 2: 82, 3: 40 });
assert.equal(changed, allCorrections.length);
for (const [word, count] of matches) assert.equal(count, 1, `stale/ambiguous correction: ${word}`);
for (const word of ['demonstrate', 'shift', 'conventional', 'overall', 'notably', 'publicity']) {
  assert.ok(corrections.some(c => c.text === word && matches.get(identity(c))), `reported word missing: ${word}`);
}
assert.equal(getQuestionMeaning({ text: 'overall', translation: '別の意味' }), '別の意味');
const app = read('src/App.tsx');
for (const q of ['question', 'q', 'currentQuestion', 'gameState.currentQuestion', 'lastSolvedQuestion', 'log.question']) {
  assert.ok(!app.includes(`>{${q}.translation}<`), `old visible meaning: ${q}`);
}
assert.ok(app.includes('`${difficulty}:${level}:${question.text}:${question.translation}`'), 'legacy status key changed');
assert.ok(app.includes('text: getQuestionMeaning(question),'), 'autoplay speech not updated');
assert.ok(app.includes('meaning: question.translation,'), 'AI history grouping identity must stay unchanged');
console.log(`PASS: ${audited} Eiken entries, ${changed} corrections (Pre-1 ${JSON.stringify(changesByLevel)}, Grade 5 ${JSON.stringify(grade5Changes)}, Grade 4 ${JSON.stringify(grade4Changes)}); other courses unchanged; legacy identities and saved-question round trips preserved.`);
