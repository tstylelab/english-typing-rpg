import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import ts from 'typescript';
import {load} from './lib/load-typescript-data.mjs';

const baseline='ab633b069d215f964d331751e77e02031c97c5e2';
const plain=value=>JSON.parse(JSON.stringify(value));
const normalize=value=>value.replace(/\r\n/g,'\n');
const priorFile=file=>execFileSync('git',['show',baseline+':'+file],{encoding:'utf8',maxBuffer:8_000_000});
const priorModule=file=>{
  const module={exports:{}};
  vm.runInNewContext(ts.transpileModule(priorFile(file),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,
    {module,exports:module.exports,require:name=>load(path.posix.join(path.posix.dirname(file),name))});
  return module.exports;
};
const {QUESTIONS}=load('src/data/questions.ts');
const {getTranslationBattlePrompt:prompt}=load('src/data/translationBattlePrompts.ts');
const {getQuestionMeaning:meaning}=load('src/data/questionMeaning.ts');
const {getGrade5Level3DisplayReview:review}=load('src/data/grade5Level3DisplayReview.ts');
const previous=priorModule('src/data/translationBattlePrompts.ts');
const expected=new Map();
expected.set('The library is quiet.',{alternatives:[{text:'silent',note:'物音がしないほど静かな'}]});
for(const text of ["Let's go home.","Let's play baseball.","Let's eat lunch.","Let's study together.","Let's play in the park.","Let's go to the zoo."]){
  const alternatives=[{text:'Shall we ...?',note:'一緒に〜しましょうか'}];
  if(text==="Let's eat lunch.")alternatives.push({text:'have lunch',note:'昼食を食べる'});
  expected.set(text,{alternatives});
}
expected.set('I like to swim.',{meaning:'私は泳ぐことが好きです。',formNote:'「〜すること」を to＋動詞のもとの形で表します。'});
for(const text of ['Where are you from?','Is she from Canada?'])expected.set(text,{formNote:'出身をたずねます。be動詞を使い、短縮しない形で。'});
expected.set('Are they in the classroom?',{formNote:'「どこにいるか」をたずねます。be動詞を主語の前に置きます。'});
for(const text of ['Does your brother play soccer?','Where does he live?','What does she want?','What time does she get up?','How does your brother go to school?','What does he do after school?'])expected.set(text,{
  formNote:'彼・彼女などの習慣や好みを尋ねる文です。does を使い、動詞はもとの形にします。'+(text==='What time does she get up?'?' 起きるのは、寝床から起きることです。':''),
});
const entries=JSON.parse(fs.readFileSync('src/data/grade5Level3DisplayReview.json','utf8'));
assert.equal(entries.length,17);assert.equal(expected.size,17);
for(const entry of entries){
  assert.deepEqual(entry.changes,expected.get(entry.text));
  assert.equal(QUESTIONS.Eiken5[3].filter(q=>q.text===entry.text&&q.translation===entry.translation&&(q.exampleEn??'')===entry.exampleEn).length,1);
  for(const [course,level,q]of [['Eiken4',3,entry],['Eiken5',1,entry],['Eiken5',2,entry],['Eiken5',3,{...entry,translation:'different'}],['Eiken5',3,{...entry,exampleEn:'different'}]])assert.equal(review(course,level,q),undefined);
}
assert.equal(createHash('sha256').update(JSON.stringify(QUESTIONS)).digest('hex'),'8af479f03894bf6c225aabdc2e38bc56fadaa5d0259402a83fdf6f0f11482ca1');
let checked=0,changed=0;
for(const[course,levels]of Object.entries(QUESTIONS))for(const[level,questions]of Object.entries(levels))for(const q of questions){
  const n=Number(level),before=JSON.stringify(q),old=previous.getTranslationBattlePrompt(q,course,n),change=course==='Eiken5'&&n===3?expected.get(q.text):undefined;
  const current=prompt(q,course,n);
  if(change){assert.ok(old);assert.deepEqual(plain(current),{...plain(old),...change},q.text);changed++;}
  else assert.deepEqual(plain(current??null),plain(old??null),'Other prompts unchanged: '+course+':'+level+':'+q.text);
  assert.deepEqual(plain(prompt(JSON.parse(before),course,n)??null),plain(current??null),'Saved/imported copies resolve');
  if(course==='Eiken5'&&n===3&&old)assert.equal(meaning(q,course),change?.meaning??old.meaning);
  assert.equal(JSON.stringify(q),before);checked++;
}
assert.equal(checked,7650);assert.equal(changed,17);
// Historical questions can still be reached through saved reviews.
const originalPrompts=JSON.parse(priorFile('src/data/translationBattlePrompts.json'));
for(const e of originalPrompts)if(!(e.course==='Eiken5'&&e.level===3&&expected.has(e.text)))assert.deepEqual(plain(prompt(e,e.course,e.level)),plain(previous.getTranslationBattlePrompt(e,e.course,e.level)));
const oldCards=plain(priorModule('src/data/grade5GrammarGuide.ts').grade5GrammarCards);
const newCards=plain(load('src/data/grade5GrammarGuide.ts').grade5GrammarCards);
assert.equal(oldCards.length,34);assert.deepEqual(newCards.map(c=>c.id),oldCards.map(c=>c.id));
for(let i=0;i<oldCards.length;i++){
  const old=oldCards[i],current=newCards[i];
  assert.deepEqual(current,old.id==='wh-does'?{...old,more:old.more.replace('How does your brother go to school?も、主語が一人なのでdoesを使います。','How does your brother go to school? の your brother は、he と同じように does を使います。')}:old);
}
for(const file of ['src/App.tsx','src/learningProgress.ts','src/data/questions.ts','src/data/questionMeaning.ts','src/data/translationBattlePrompts.json','src/data/grade5GrammarAssignments.ts','src/data/questionSets/eiken/grade5.json','src/data/questionSets/eiken/grade5Foundations.json','src/monsterProfiles.json'])assert.equal(normalize(fs.readFileSync(file,'utf8')),normalize(priorFile(file)),file+' unchanged');
console.log('PASS: exactly 17 Grade 5 Level 3 display reviews and one guide sentence; all 7,650 identities, other prompts, archived questions, 34 guide IDs, grading and progress retained.');
