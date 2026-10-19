import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {load} from './lib/load-typescript-data.mjs';
const {QUESTIONS}=load('src/data/questions.ts');
const {grammarGuides,getGrammarCard,getGrammarGuideCourse}=load('src/data/grammarGuides.ts');
const {grade1GrammarCards}=load('src/data/grade1GrammarGuide.ts');
const oldAssignments=load('src/data/grade1GrammarAssignments.ts').grade1GrammarAssignments;
const newAssignments=load('src/data/grade1GrammarExpansionAssignments.json');
const grade1GrammarAssignments=Object.fromEntries(Object.keys(oldAssignments).map(c=>[c,{...oldAssignments[c],...newAssignments[c]}]));
const {readGrammarBookmarks,toggleGrammarBookmark}=load('src/grammarBookmarks.ts');
const {buildGrammarQuestion}=load('src/grammarAiPrompt.ts');
for(const file of ['src/data/questionSets/eiken/grade1Sentences.ts','src/App.tsx'])
  assert.equal(readFileSync(file,'utf8').replace(/\r\n/g,'\n'),execFileSync('git',['show',(file.endsWith('App.tsx')?'ba9f47d':'14d0826')+':'+file],{encoding:'utf8',maxBuffer:16e6}).replace(/\r\n/g,'\n'),'Question material/gameplay unchanged: '+file);
assert.equal(grade1GrammarCards.length,65);
for(const [course,count] of [['Eiken1Part1',37],['Eiken1Part2',41]]){
  const qs=QUESTIONS[course][3];const guide=grammarGuides[course];
  assert.equal(qs.length,100);assert.equal(guide.cards.length,count);
  assert.equal(getGrammarGuideCourse(course.toLowerCase()),course);
  assert.deepEqual(Object.keys(grade1GrammarAssignments[course]).sort(),Array.from(qs,q=>q.text).sort());
  for(const q of qs){
    assert.ok(getGrammarCard(course,3,q),q.text);
    for(const level of [1,2])assert.equal(getGrammarCard(course,level,q),undefined);
  }
  for(const c of guide.cards){
    assert.ok(qs.some(q=>getGrammarCard(course,3,q).id===c.id),'No unused card: '+c.id);
    assert.ok(guide.sections[c.section]);
    for(const key of ['title','subtitle','term','pattern','tip','more'])assert.ok(c[key]?.trim());
    assert.equal(c.examples.length,2);
    for(const pair of [...c.examples,...(c.compare||[]),...(c.chunks||[])])assert.ok(pair.length===2&&pair.every(v=>v.trim()));
  }
  assert.equal(new Set(guide.cards.map(c=>c.id)).size,count);
  const q=qs[0];const prompt=buildGrammarQuestion(guide.grade,getGrammarCard(course,3,q),q.text);
  assert.ok(prompt.includes('英検'+guide.grade+'に挑戦する学習者'));
  assert.ok(prompt.includes('ゲームで出た文：'+q.text));
}
for(const [part,text,id] of [
  [1,'The drought forced many families to leave the region.','force-to'],
  [1,'The closure left hundreds of workers without jobs.','leave-state'],
  [1,'The new rules led to a sharp drop in pollution.','lead-to'],
  [1,'Rural areas have fewer doctors than large cities.','quantity'],
  [1,'The new method uses less energy than the old one.','quantity'],
  [1,'If the evidence is weak, the case should be reconsidered.','condition'],
  [2,'The families whose homes were flooded received support.','whose'],
  [2,'The evidence that supported the claim was later discredited.','relative-subject'],
  [2,'Although both sides sought peace, neither would compromise.','neither-would'],
  [2,'The damage was far more severe than officials had expected.','comparison-past'],
  [2,'The inquiry revealed that officials had ignored warnings.','that-past-perfect'],
  [2,'The campaign helped dispel the stigma surrounding the illness.','help'],
  [2,'A loophole allowed the firm to avoid the restriction.','allow-to'],
  [2,'The potential harm outweighs the short-term benefit.','outweigh'],
  [2,'The minister was accused of withholding crucial information.','accused-of'],
])assert.equal(getGrammarCard('Eiken1Part'+part,3,{text})?.id,id,text);
assert.equal(getGrammarCard('Eiken1Part1',3,{text:'The families whose homes were flooded received support.'}),undefined,'No invented cross-part link');
assert.ok(grade1GrammarCards.every(c=>Object.values(grade1GrammarAssignments).some(a=>Object.values(a).includes(c.id))));
assert.ok(grade1GrammarCards.find(c=>c.id==='neither-would').tip.includes('意志'));
assert.ok(grade1GrammarCards.find(c=>c.id==='outweigh').tip.includes('thanは置かず'));
const data=new Map();const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
for(const c of ['Eiken1Part1','Eiken1Part2'])toggleGrammarBookmark(storage,'one','relative-subject',c);
toggleGrammarBookmark(storage,'one','relative-subject','Eiken1Part1');
assert.deepEqual(Array.from(readGrammarBookmarks(storage,'one','Eiken1Part1')),[]);
assert.deepEqual(Array.from(readGrammarBookmarks(storage,'one','Eiken1Part2')),['relative-subject']);
assert.deepEqual(Array.from(readGrammarBookmarks(storage,'other','Eiken1Part2')),[]);
console.log('PASS: Grade-1 200 exact links, 37/41 cards (65 unique topics), semantic distinctions, unchanged source/gameplay, bookmarks and AI context');
