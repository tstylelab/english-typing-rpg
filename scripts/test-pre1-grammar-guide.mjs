import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {load} from './lib/load-typescript-data.mjs';
const {QUESTIONS}=load('src/data/questions.ts');
const {grammarGuides,getGrammarCard,getGrammarGuideCourse}=load('src/data/grammarGuides.ts');
const {pre1GrammarCards,getPre1GrammarCard}=load('src/data/pre1GrammarGuide.ts');
const {pre1GrammarAssignments}=load('src/data/pre1GrammarAssignments.ts');
const {readGrammarBookmarks,toggleGrammarBookmark,grammarBookmarkKey}=load('src/grammarBookmarks.ts');
const {buildGrammarQuestion}=load('src/grammarAiPrompt.ts');
for(const file of ['src/data/questionSets/eiken/gradepre1-part1.json','src/data/questionSets/eiken/gradepre1-part2.json','src/data/pre1SentenceMeaningCorrections.json','src/App.tsx']) {
  // Autoplay/history changes were committed separately after the original material baseline.
  const baseline = file === 'src/App.tsx' ? '14d0826' : '4c6731c';
  assert.equal(readFileSync(file,'utf8').replace(/\r\n/g,'\n'),execFileSync('git',['show',baseline+':'+file],{encoding:'utf8',maxBuffer:16e6}).replace(/\r\n/g,'\n'),file+' unchanged');
}
for(const [course,count] of [['EikenPre1Part1',37],['EikenPre1Part2',40]]) {
  const guide=grammarGuides[course];const qs=QUESTIONS[course][3];
  assert.equal(qs.length,75);assert.equal(guide.cards.length,count);
  assert.equal(getGrammarGuideCourse(course.toLowerCase()),course);
  assert.deepEqual(Object.keys(pre1GrammarAssignments[course]).sort(),qs.map(q=>q.text).sort());
  for(const q of qs){
    assert.ok(getGrammarCard(course,3,q),q.text);
    for(const level of [1,2])assert.equal(getGrammarCard(course,level,q),undefined);
    assert.equal(getPre1GrammarCard('EikenPre2',3,q),undefined);
  }
  for(const c of guide.cards){
    assert.ok(qs.some(q=>getGrammarCard(course,3,q).id===c.id));
    assert.ok(guide.sections[c.section]);
    for(const key of ['title','subtitle','term','pattern','tip','more'])assert.ok(c[key]?.trim());
    assert.equal(c.examples.length,2);
    for(const pair of [...c.examples,...(c.compare||[]),...(c.chunks||[])])assert.ok(pair.length===2&&pair.every(v=>v.trim()));
  }
  assert.equal(new Set(guide.cards.map(c=>c.id)).size,guide.cards.length);
}
assert.ok(pre1GrammarCards.every(c=>Object.values(pre1GrammarAssignments).some(a=>Object.values(a).includes(c.id))),'No unused cards');
for(const [part,text,id] of [
  [1,'If I understand you correctly.','conditional-intro'],[1,'To put it another way.','rephrase-intro'],
  [1,'The way I see it.','stance-intro'],[1,'That must have been difficult.','modal-perfect'],
  [1,'You may have a point there.','possibility'],[1,"I hadn't thought of it that way.",'past-perfect'],
  [2,"That's not a bad idea.",'litotes'],[2,"That doesn't necessarily mean it's wrong.",'not-necessarily'],
  [2,"I'm not saying you're wrong.",'saying-negative'],[2,"I'm just being realistic.",'being'],
  [2,'Sounds about right.','sound-seem'],[2,"I wouldn't be surprised if that were true.",'hypothetical'],
  [2,"I don't know if that's fair.",'indirect-if'],[2,"I can see where you're coming from.",'viewpoint-understanding'],
  [2,"I get the point you're making.",'relative-object'],[2,'I can see that happening.','perception'],
])assert.equal(getGrammarCard('EikenPre1Part'+part,3,{text})?.id,id,text);
assert.ok(getGrammarCard('EikenPre1Part1',3,{text:'If I understand you correctly.'}).examples.every(([en])=>en.includes(',')));
assert.ok(getGrammarCard('EikenPre1Part2',3,{text:'Sounds about right.'}).more.includes('省いた'));
assert.equal(getGrammarCard('EikenPre1Part1',3,{text:'Sounds about right.'}),undefined,'Other part does not receive a made-up link');
const data=new Map();const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
for(const course of ['EikenPre1Part1','EikenPre1Part2'])toggleGrammarBookmark(storage,'one','what-clause',course);
toggleGrammarBookmark(storage,'one','what-clause','EikenPre1Part1');
assert.deepEqual(Array.from(readGrammarBookmarks(storage,'one','EikenPre1Part1')),[]);
assert.deepEqual(Array.from(readGrammarBookmarks(storage,'one','EikenPre1Part2')),['what-clause']);
assert.deepEqual(Array.from(readGrammarBookmarks(storage,'other','EikenPre1Part2')),[]);
data.set(grammarBookmarkKey('one','EikenPre1Part2'),'{broken');
assert.throws(()=>toggleGrammarBookmark(storage,'one','what-clause','EikenPre1Part2'));
assert.equal(data.get(grammarBookmarkKey('one','EikenPre1Part2')),'{broken');
for(const course of ['EikenPre1Part1','EikenPre1Part2']){
  const q=QUESTIONS[course][3][0];const guide=grammarGuides[course];
  const prompt=buildGrammarQuestion(guide.grade,getGrammarCard(course,3,q),q.text);
  assert.ok(prompt.includes('英検'+guide.grade+'に挑戦する学習者')&&prompt.includes('ゲームで出た文：'+q.text));
}
console.log('PASS: Pre-1 150 exact links, 37/40 cards, meaning and fragment distinctions, original material/gameplay, part/player isolation and AI context');
