import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import ts from 'typescript';
import { load } from './lib/load-typescript-data.mjs';

const { QUESTIONS } = load('src/data/questions.ts');
const { getQuestionMeaning } = load('src/data/questionMeaning.ts');
const { getTranslationBattlePrompt } = load('src/data/translationBattlePrompts.ts');
const { getQuestionSynonyms, getQuestionSynonymLabels, getQuestionSynonymHeading } = load('src/data/questionSynonyms.ts');
const { getGrade2VocabularySynonymReview } = load('src/data/grade2VocabularySynonymReview.ts');
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const json = value => JSON.parse(JSON.stringify(value));
const meanings = {
  examine: '詳しく調べる・検査する／診察する', procedure: '決まった手順・手続き',
  panel: '討論・審査などを行う一団／板・操作盤', privacy: '私生活の秘密・干渉されない権利',
};
const rows = [];
for (const [course, levels] of Object.entries(QUESTIONS)) for (const [level, questions] of Object.entries(levels)) {
  for (const question of questions) rows.push({ course, level: Number(level), question,
    meaning: getQuestionMeaning(question, course), synonyms: getQuestionSynonyms(course, Number(level), question),
    prompt: getTranslationBattlePrompt(question, course, Number(level)) });
}
const target = row => row.course === 'Eiken2' && row.level === 1;
assert.equal(rows.length, 7650);
assert.equal(hash(QUESTIONS), '8af479f03894bf6c225aabdc2e38bc56fadaa5d0259402a83fdf6f0f11482ca1',
  'All question text, legacy translations, examples, fields and ordering stay unchanged');
assert.equal(hash(rows.filter(row => !target(row))), '5da20687b64d6c699ee58e25f2971d1f543e1c3d1646873a688cdbc834568b08',
  'Every other course/level keeps its meanings, synonyms and translation prompts');
const grade2 = rows.filter(target);
assert.equal(grade2.length, 549);
assert.equal(hash(grade2.filter(row => !Object.hasOwn(meanings, row.question.text)).map(row => [row.question, row.meaning])),
  '2e8f7f69d4a78057f9f580fe28f48224f1917f99f65848e588398ab1fdaf9c5a', 'Only four approved Japanese glosses change');
const hints = grade2.filter(row => row.prompt?.alternatives.length);
assert.equal(hints.length, 89, 'Do not add before-answer hints to every word');
assert.equal(hash(hints.map(row => row.question.text).sort()), '2ae4e7c83b27f52ae1a5e992566dd194e399630131a6f62491e4ff176391c67c');
for (const row of hints) {
  assert.deepEqual(json(row.synonyms), row.prompt.alternatives.map(expression => expression.text));
  assert.deepEqual(json(getQuestionSynonymLabels('Eiken2', 1, row.question)),
    row.prompt.alternatives.map(({ text, note }) => `${text}（${note}）`), 'Same expression and note before/after: ' + row.question.text);
  assert.equal(getQuestionSynonymHeading('Eiken2', 1, row.question), '類義語');
}
for (const row of grade2) {
  const before = JSON.stringify(row.question), clone = JSON.parse(before);
  assert.equal(getQuestionMeaning(clone, 'Eiken2'), row.meaning, 'Imported legacy identity still resolves');
  assert.deepEqual(json(getQuestionSynonymLabels('Eiken2', 1, clone)), json(getQuestionSynonymLabels('Eiken2', 1, row.question)));
  assert.ok(getQuestionSynonymLabels('Eiken2', 1, row.question).length <= 2, 'Keep reading load short');
  assert.equal(JSON.stringify(row.question), before, 'Display adapters do not mutate a question');
}
const reviews = JSON.parse(fs.readFileSync('src/data/grade2VocabularySynonymReview.json', 'utf8'));
assert.equal(reviews.length, 42);
for (const review of reviews) {
  const matches = grade2.filter(row => row.question.text === review.text && row.question.translation === review.translation && row.question.exampleEn === review.exampleEn);
  assert.equal(matches.length, 1, 'Exact legacy identity for every review');
  assert.ok(review.expressions.length <= 2);
  for (const expression of review.expressions) {
    assert.ok(expression.text.length <= 24 && expression.note.length > 0 && expression.note.length <= 24);
    assert.notEqual(expression.text, review.text);
  }
  for (const [course, level, question] of [['Eiken3', 1, review], ['Eiken2', 2, review], ['Eiken2', 1, { ...review, exampleEn: 'Different original example.' }]]) {
    assert.equal(getGrade2VocabularySynonymReview(course, level, question), undefined, 'No cross-course/sense leakage');
  }
}
const word = text => grade2.find(row => row.question.text === text);
for (const [text, meaning] of Object.entries(meanings)) assert.equal(word(text).meaning, meaning);
assert.deepEqual(json(word('correctly').synonyms), ['accurately']);
assert.deepEqual(json(word('interfere').synonyms), ['get in the way']);
assert.ok(getQuestionSynonymLabels('Eiken2', 1, word('process').question)[0].includes('決まった手順の意味'));
for (const text of ['roommate', 'container', 'traveler']) assert.deepEqual(json(word(text).synonyms), [], 'No forced difficult/unnatural filler');
assert.ok(!hints.some(row => row.prompt.alternatives.some(expression => expression.text === 'galvanize')));
for (const [text, note] of [['determine', '事実を突き止める意味'], ['current', '形容詞・現在の意味'], ['object', '名詞・物体の意味'], ['argument', '口論の意味']]) {
  assert.ok(getQuestionSynonymLabels('Eiken2', 1, word(text).question)[0].includes(note));
}
assert.ok(word('determine').meaning.includes('決定する'), 'Retain useful major meanings');
for (const row of rows.filter(row => !target(row))) assert.deepEqual(json(getQuestionSynonymLabels(row.course, row.level, row.question)), json(row.synonyms));

// The user deferred alternate-answer grading: protect the actual typing, damage,
// question-selection and learning-update functions from this display-only change.
const source = fs.readFileSync('src/App.tsx', 'utf8');
const ast = ts.createSourceFile('App.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const printer = ts.createPrinter({ removeComments: true });
const protectedHashes = {
  startGame: '39dbb15a55805966cc323e18a8d56a5d70cd38021199474445cc6861cac415fe',
  advanceGame: '3597b73d9062fe6f2322cff8606406408b614ad7fdde4bfd45a7d971896b3f8a',
  handleCorrectAnswer: '618f65e96ff7bed8e97c5f14a839a2d69560bc4b18bb7fd796b21e07cca3becd',
  handleBattleInputValue: 'e4c4f80b5a0be03ff93efe9a4e94f83f823de7ecb8389222fde85d18d7399bd3',
};
const checked = new Set();
function visit(node) {
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && Object.hasOwn(protectedHashes, node.name.text)) {
    assert.equal(createHash('sha256').update(printer.printNode(ts.EmitHint.Unspecified, node, ast)).digest('hex'), protectedHashes[node.name.text], node.name.text + ' unchanged');
    checked.add(node.name.text);
  }
  ts.forEachChild(node, visit);
}
visit(ast);
assert.equal(checked.size, 4);
console.log('PASS: 7,650 legacy questions; 549 Grade 2 words; 4 gloss changes; 42 scoped reviews; all 89 before/after hints match; grading, learning and other courses unchanged.');
