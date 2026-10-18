import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {load} from './lib/load-typescript-data.mjs';
import {getPriorMeaning} from './lib/translation-prompt-baseline.mjs';

const dir='docs/grade5-level3-foundations-2026-10-19';
assert.ok(!fs.existsSync(dir+'/review.json'),'Do not overwrite a reviewed snapshot');
const {QUESTIONS}=load('src/data/questions.ts');
const {grade5GrammarAssignments:assignments}=load('src/data/grade5GrammarAssignments.ts');
const {getQuestionMeaning}=load('src/data/questionMeaning.ts');
const {getTranslationBattlePrompt}=load('src/data/translationBattlePrompts.ts');
const sha=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const old=QUESTIONS.Eiken5[3];assert.equal(old.length,221);
const sourceQuestionsSha256=sha(QUESTIONS);
const promptFile='src/data/translationBattlePrompts.json',prompts=JSON.parse(fs.readFileSync(promptFile,'utf8'));
const oldPromptsSha256=sha(prompts);
const beNegative='「〜です」の否定文を練習します。短縮しない形で。';
const verbNegative='ふだんのことを表す一般動詞の否定文。否定の部分は短縮形で。';
const whDoes='彼・彼女など、一人についての疑問文。疑問詞の後ろに疑問文を続け、動作の動詞はもとの形にします。';
const from='出身を「〜です」の文で表す練習です。短縮しない形で。';
// Each addition names a grammatical target in Japanese; no initials, letter counts or English patterns before answering.
const added=[
 ['I am not tired.','私は疲れていません。','negative',1,beNegative,'状態を伝える文を否定にする。'],
 ['She is not my teacher.','彼女は私の先生ではありません。','negative',1,beNegative,'人についての説明を否定にする。'],
 ['We are not hungry.','私たちはお腹が空いていません。','negative',1,beNegative,'複数の主語の状態を否定する。'],
 ['They are not in the classroom.','彼らは教室にいません。','negative',1,beNegative,'所在の否定にも同じ動詞の型を使う。'],
 ["I don't drink coffee.",'私はコーヒーを飲みません。','negative',1,verbNegative,'飲まない習慣を、好みの否定と区別する。'],
 ["He doesn't like apples.",'彼はりんごが好きではありません。','negative',1,verbNegative,'三人称単数の好みを否定する。'],
 ["She doesn't have a bike.",'彼女は自転車を持っていません。','negative',1,verbNegative,'三人称単数でも否定の後ろは動詞のもとの形。'],
 ["My brother doesn't play soccer.",'私の兄（弟）はサッカーをしません。','negative',1,verbNegative,'人を表す名詞の主語でも、否定の型を選ぶ。'],
 ['Do they study English?','彼らは英語を勉強しますか？','do-question',1,'ふだんのことを表す一般動詞の疑問文です。','複数の主語の一般動詞を質問にする。'],
 ['Does your brother play soccer?','あなたの兄（弟）はサッカーをしますか？','do-question',1,'一人についての一般動詞の疑問文。動作の動詞はもとの形にします。','名詞の主語でも三人称単数の疑問文を作る。'],
 ['Are they in the classroom?','彼らは教室にいますか？','be-question',1,'場所を表す「〜です」の動詞を、主語の前に出して尋ねます。','所在の肯定・否定・疑問を比べる。'],
 ['Where does he live?','彼はどこに住んでいますか？','wh-does',2,whDoes,'場所を尋ねる疑問詞と三人称単数の疑問文。'],
 ['What does she want?','彼女は何がほしいですか？','wh-does',2,whDoes,'ほしい物を尋ねる疑問詞と三人称単数の疑問文。'],
 ['What time does she get up?','彼女は何時に起きますか？','wh-does',2,whDoes+' 起きるのは、寝床から起きることです。','具体的な時刻を尋ね、起床する動作を伝える。'],
 ['How does your brother go to school?','あなたの兄（弟）はどうやって学校へ行きますか？','wh-does',2,whDoes,'交通手段を尋ねる疑問詞と名詞の主語。'],
 ['What does he do after school?','彼は放課後に何をしますか？','wh-does',2,whDoes,'疑問文を作る語と「する」という動作を表す語を両方置く。'],
 ['What time do you go to bed?','あなたは何時に寝床に入りますか？','wh',2,'具体的な時刻を尋ねます。眠りにつく時刻ではなく、寝床に入る時刻です。','就寝の動作と時刻の疑問文を組み合わせる。'],
 ['Why do you like cats?','あなたはなぜ猫が好きなのですか？','wh',2,'理由を尋ねる、一般動詞の疑問文です。','理由の疑問詞を、好みを尋ねる文に付ける。'],
 ['I am from Japan.','私は日本出身です。','from',1,from,'出身を伝える基本の型。'],
 ['Where are you from?','あなたはどこの出身ですか？','from',1,from,'出身地を場所の疑問詞で尋ねる。'],
 ['Is she from Canada?','彼女はカナダ出身ですか？','from',1,from,'出身を伝える文を疑問文にする。'],
 ['What are these?','これらは何ですか？','demonstratives',1,'近くにある複数の物について尋ねます。短縮しない形で。','これと、これらの数の違いを疑問文でも確認する。'],
 ['Whose shoes are these?','これらは誰の靴ですか？','wh',2,'持ち主を尋ねます。靴を先に言ってから「これら」を置く語順で練習します。','持ち主の疑問詞・名詞・複数形の語順。'],
 ['Is he playing soccer?','彼は今、サッカーをしていますか？','progressive',2,'今している動作を尋ねる進行形です。','三人称単数の進行形を疑問文にする。'],
 ['She is not watching TV.','彼女は今、テレビを見ていません。','progressive',2,'今の動作を否定する進行形です。短縮しない形で。','進行形の否定で、否定する語を置く位置。'],
 ['What is she reading?','彼女は今、何を読んでいますか？','progressive',2,'今している動作を尋ねる進行形です。','何をしているかという疑問と進行形を組み合わせる。'],
 ['He can swim.','彼は泳げます。','can',2,'泳ぐ能力があることを、能力を表す助動詞で伝えます。','能力を表す肯定文から疑問・否定につなげる。'],
 ['Can they play tennis?','彼らはテニスができますか？','can',2,'テニスをする能力があるかを、能力を表す助動詞で尋ねます。','複数の主語でも能力の疑問文の型は同じ。'],
].map(([text,translation,card,band,formNote,focus])=>({question:{text,translation},card,band,formNote,focus}));
assert.equal(added.length,28);
const advanced=new Set(old.filter(q=>['past','future'].includes(assignments[q.text])).map(q=>q.text));
for(const text of ['It is fun to play.','I am happy to see you.'])advanced.add(text);
assert.equal(advanced.size,21);
const basicCards=['subjects','word-types','be','word-order','demonstratives','contractions','from','verb','third','noun','articles','pronouns','negative','be-question','do-question','short-answers'];
const topicOrder=[...basicCards,'wh','wh-does','quantity','amounts','can','imperative','lets','progressive','place','modifiers','weather','conjunctions','there','to','permission','greetings'];
const bandOf=q=>{
 const card=assignments[q.text];
 if(card==='short-answers'&&/\bcan/.test(q.text))return 2;
 if(basicCards.includes(card))return 1;
 if(card==='wh'&&!/\bdo\b/.test(q.text))return 1;
 return ['there','to','permission','greetings'].includes(card)?3:2;
};
const current=old.filter(q=>!advanced.has(q.text)).map(q=>({question:q,card:assignments[q.text],band:bandOf(q),focus:'既存の基礎練習を保持。'}));
const runtime=[...current,...added].sort((a,b)=>a.band-b.band||topicOrder.indexOf(a.card)-topicOrder.indexOf(b.card));
assert.equal(runtime.length,228);assert.equal(new Set(runtime.map(e=>e.question.text)).size,228);
for(const e of added){assert.ok(!old.some(q=>q.text===e.question.text));assert.ok(!prompts.some(p=>p.course==='Eiken5'&&p.level===3&&p.text===e.question.text));prompts.push({course:'Eiken5',level:3,...e.question,previousMeaning:getPriorMeaning(e.question,'Eiken5'),meaning:e.question.translation,alternatives:[],contrasts:[],formNote:e.formNote,reason:'5級の基本文型の補強：'+e.focus});}
const existing=old.map((q,i)=>({number:i+1,...q,meaning:getQuestionMeaning(q,'Eiken5'),prompt:getTranslationBattlePrompt(q,'Eiken5',3)??null,card:assignments[q.text],status:advanced.has(q.text)?'reference':'keep',reason:advanced.has(q.text)?'発展寄りの型。通常出題から外し、以前の記録・解説参照を保持。':'英文・元和訳・保存キーを保持し、段階を整理。'}));
const newPromptMap=new Map(prompts.filter(p=>p.course==='Eiken5'&&p.level===3).map(p=>[p.text,p]));
const review={status:'local-implementation',baselineCommit:'386d421',date:'2026-10-19',sourceQuestionsSha256,sourcePromptsSha256:oldPromptsSha256,counts:{before:221,retained:200,reference:21,added:28,active:228},bands:[1,2,3].map(b=>runtime.filter(e=>e.band===b).length),sources:[['英検5級の位置付け','https://www.eiken.or.jp/eiken/exam/grade_5/'],['疑問・否定の型','https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/questions-negatives']],existing,active:runtime.map((e,i)=>({number:i+1,...e,origin:old.some(q=>q.text===e.question.text)?'keep':'add',meaning:newPromptMap.get(e.question.text)?.meaning??getQuestionMeaning(e.question,'Eiken5'),formNote:newPromptMap.get(e.question.text)?.formNote??''}))};
fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(dir+'/review.json',JSON.stringify(review,null,2)+'\n');
fs.writeFileSync('src/data/questionSets/eiken/grade5Foundations.json',JSON.stringify(runtime.map(({question,card,band})=>({question,card,band})),null,2)+'\n');
fs.writeFileSync('src/data/grade5FoundationAssignments.json',JSON.stringify(Object.fromEntries(added.map(e=>[e.question.text,e.card])),null,2)+'\n');
fs.writeFileSync(promptFile,JSON.stringify(prompts,null,2)+'\n');
console.log('Prepared',review.counts,'bands',review.bands);
