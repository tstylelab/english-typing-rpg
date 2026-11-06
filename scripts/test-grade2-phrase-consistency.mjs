import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';
import { load } from './lib/load-typescript-data.mjs';
import { publishedData } from './lib/load-published-data.mjs';

const previous = publishedData('19449cc7f63d91e87b81823cfe4b2bf678306a58');
const { QUESTIONS } = load('src/data/questions.ts');
const plain = x => JSON.parse(JSON.stringify(x));
assert.deepEqual(plain(QUESTIONS), plain(previous('src/data/questions.ts').QUESTIONS), 'Every saved question, example, ordering and field is unchanged');
const reviews = JSON.parse(fs.readFileSync('src/data/grade2PhraseConsistencyReview.json', 'utf8'));
assert.equal(createHash('sha256').update(JSON.stringify(reviews)).digest('hex'), '20ed6323fa11a632c0b79d2ce4a7688b8f1b7d1d2dc7762b656574c215627721', 'Reviewed, bounded metadata');
assert.equal(reviews.length, 114);
const identity = q => JSON.stringify([q.text,q.translation,q.exampleEn ?? '']);
const expected = new Map(reviews.map(e => [identity(e),e]));
assert.equal(expected.size, 114);
const meaning = load('src/data/questionMeaning.ts').getQuestionMeaning;
const prompt = load('src/data/translationBattlePrompts.ts').getTranslationBattlePrompt;
const labels = load('src/data/questionSynonyms.ts').getQuestionSynonymLabels;
const raw = load('src/data/questionSynonyms.ts').getQuestionSynonyms;
const notes = load('src/data/vocabularyUsageNotes.ts').getVocabularyUsageNote;
const oldMeaning = previous('src/data/questionMeaning.ts').getQuestionMeaning;
const oldPrompt = previous('src/data/translationBattlePrompts.ts').getTranslationBattlePrompt;
const oldLabels = previous('src/data/questionSynonyms.ts').getQuestionSynonymLabels;
const oldNotes = previous('src/data/vocabularyUsageNotes.ts').getVocabularyUsageNote;
const review = load('src/data/grade2PhraseConsistencyReview.ts').getGrade2PhraseConsistencyReview;
let checked=0, target=0, hints=0, formerlyMissing=0;
for (const [course,levels] of Object.entries(QUESTIONS)) for (const [level,qs] of Object.entries(levels)) for (const q of qs) {
  const n=+level, before=JSON.stringify(q), current=prompt(q,course,n), old=oldPrompt(q,course,n);
  const e=course==='Eiken2'&&n===2 ? expected.get(identity(q)) : undefined;
  if (course==='Eiken2'&&n===2) {
    target++;
    assert.equal(Boolean(current?.alternatives.length),Boolean(old?.alternatives.length),'No new hint-bearing questions');
  }
  if (e) {
    hints++;
    assert.deepEqual(plain(current.alternatives),e.hints);
    assert.equal(meaning(q,course),e.meaning ?? oldMeaning(q,course));
    assert.equal(current.meaning,meaning(q,course));
    assert.deepEqual(plain(raw(course,n,q)),[...e.hints,...e.related].map(x=>x.text));
    assert.deepEqual(plain(labels(course,n,q)),[...e.hints,...e.related].map(x=>x.note?`${x.text}（${x.note}）`:x.text));
    for(const expression of current.alternatives) assert.ok(raw(course,n,q).includes(expression.text),'Every hint is available after answering');
    assert.equal(notes(course,n,q),e.usageNote ?? oldNotes(course,n,q));
    if (!oldLabels(course,n,q).length) formerlyMissing++;
    assert.deepEqual(plain(review(course,n,plain(q))),plain(review(course,n,q)),'Imported/saved clones resolve');
    for(const other of [['Eiken3',2],['Eiken2',1],['Eiken2',3]]) assert.equal(review(...other,q),undefined);
    assert.equal(review(course,n,{...q,translation:q.translation+' edited'}),undefined,'Exact sense matching');
    assert.ok(e.hints.length<=2&&e.related.length<=2);
    assert.equal(new Set(raw(course,n,q)).size,raw(course,n,q).length);
    assert.ok([...e.hints,...e.related].every(x=>x.note.length<=15));
  } else {
    assert.equal(meaning(q,course),oldMeaning(q,course));
    assert.deepEqual(plain(labels(course,n,q)),plain(oldLabels(course,n,q)));
    assert.equal(notes(course,n,q),oldNotes(course,n,q));
    assert.equal(JSON.stringify(current),JSON.stringify(old));
  }
  assert.equal(JSON.stringify(q),before);
  checked++;
}
assert.equal(checked,7934);assert.equal(target,203);assert.equal(hints,114);assert.equal(formerlyMissing,24);
const get = text => reviews.find(e=>e.text===text);
assert.equal(get('as long as').meaning,'〜する間はずっと／〜という条件で（後ろに文）');
assert.equal(get('as long as').hints[0].note,'条件の「〜する限り」');
assert.deepEqual(get('come across').hints.map(e=>e.text),['find by chance','run into']);
assert.ok(get('come across').hints[1].note.includes('人'));
assert.equal(get('speak out').hints[0].text,'speak up');
assert.equal(get('speak out').related[0].text,'voice an opinion');
assert.ok(get('speak out').usageNote.includes('大きな声'));
assert.ok(get('one by one').related[0].note.includes('順番は表さない'));
assert.ok(get('at any cost').related[0].note.includes('関連表現'));
// Compare real production declarations to the released source, not test replicas.
const protectedNames=['STORAGE_KEYS','normalizePlayerProfiles','normalizePlayerProfileData','getQuestionStatusKey','normalizeReviewQueue','normalizeSelectedQuestionKeysByScope','normalizeSavedSelectionLists','getBattleTuning','handleCorrectAnswer','handleBattleInputValue'];
const printer=ts.createPrinter({removeComments:true});
function declarations(source){const ast=ts.createSourceFile('App.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX), result=new Map();function visit(node){if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&protectedNames.includes(node.name.text))result.set(node.name.text,printer.printNode(ts.EmitHint.Unspecified,node,ast));ts.forEachChild(node,visit);}visit(ast);return result;}
const now=declarations(fs.readFileSync('src/App.tsx','utf8'));
const old=declarations(execFileSync('git',['show','19449cc:src/App.tsx'],{encoding:'utf8',maxBuffer:8000000}));
assert.equal(now.size,protectedNames.length);assert.deepEqual(now,old,'Saved data, battle balance and grading code unchanged');
console.log('PASS: all 203 Grade 2 phrases; all 114 hint/feedback links consistent; 24 missing feedbacks restored; all 7,934 identities and out-of-scope displays retained; 10 actual storage/grading functions unchanged.');
