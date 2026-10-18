import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {load} from './lib/load-typescript-data.mjs';
import {getPriorMeaning} from './lib/translation-prompt-baseline.mjs';

const dir='docs/grade4-level3-foundations-2026-10-19';
assert.ok(!fs.existsSync(dir+'/review.json'),'Do not overwrite a reviewed snapshot');
const {QUESTIONS}=load('src/data/questions.ts');
const {grade4GrammarAssignments:assignments}=load('src/data/grade4GrammarAssignments.ts');
const {getQuestionMeaning}=load('src/data/questionMeaning.ts');
const {getTranslationBattlePrompt}=load('src/data/translationBattlePrompts.ts');
const old=QUESTIONS.Eiken4[3];assert.equal(old.length,209);
const sha=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const promptFile='src/data/translationBattlePrompts.json';
const prompts=JSON.parse(fs.readFileSync(promptFile,'utf8'));
const sourcePromptsSha256=sha(prompts);
const p=(label,note,pattern)=>({label,note,pattern});
const pastNote='一般動詞の過去の否定文。否定の部分は短縮しない形で、動作の動詞はもとの形にします。';
const pastPoint=p('一般動詞の過去の否定','did notの後ろは動詞の原形です。過去形を重ねません。','主語 + did not + 動詞の原形');
const purposeNote='何をしたかを先に述べ、目的を不定詞で続けます。';
const purposePoint=p('目的の不定詞','to＋動詞の原形で、先に述べた行動の目的を伝えます。','主語 + 動詞 + 場所など + to + 動詞の原形');
const becauseNote='結果を先に述べ、理由を表す接続詞の後ろに文を続けます。短縮しない形で。';
const becausePoint=p('理由をつなぐ','becauseの後ろに理由となる主語と動詞を続けます。','結果の文 + because + 理由の文');
const ifNote='条件の節を先に置きます。未来の条件でも、その節の動詞は現在形にします。短縮しない形で。';
const ifPoint=p('条件をつなぐ','ifが未来の条件を表す節では現在形を使い、その結果を後ろに続けます。','If + 主語 + 現在形, 結果の文');
const afterNote='何をするか・したかを先に述べ、その後に「〜した後で」を表す接続詞と文を続けます。短縮しない形で。';
const afterPoint=p('時をつなぐ','afterの後ろに名詞だけでなく文を続け、何が済んだ後かを説明します。未来の時を表す節は現在形です。','文 + after + 主語 + 動詞');
const tooNote='「〜すぎる」を表す副詞、形容詞、「私には」の順に続けます。短縮しない形で。';
const tooPoint=p('程度を表すtoo','too＋形容詞で「〜すぎる」。for meを添えて、だれにとってそうなのかを示します。','主語 + be動詞 + too + 形容詞 + for 人');
const added=[
 ['I did not play tennis yesterday.','私は昨日テニスをしませんでした。','past-verb',1,pastNote,pastPoint],
 ['She did not buy that bag.','彼女はあのかばんを買いませんでした。','past-verb',1,pastNote,pastPoint],
 ['We did not go to school yesterday.','私たちは昨日学校へ行きませんでした。','past-verb',1,pastNote,pastPoint],
 ['Did he study English last night?','彼は昨夜英語を勉強しましたか？','past-verb',1,'一般動詞の過去の疑問文。主語の前に過去の疑問を作る語を置き、勉強する動詞はもとの形にします。',p('一般動詞の過去の疑問','didを主語の前に置き、studyは過去形にしません。','Did + 主語 + 動詞の原形?')],
 ['I went to the library to study.','私は勉強するために図書館へ行きました。','to-purpose',2,purposeNote,purposePoint],
 ['She got up early to make breakfast.','彼女は朝食を作るために早く起きました。','to-purpose',2,purposeNote+' 起きるのは寝床から起きることです。',purposePoint],
 ['We went to the park to play soccer.','私たちはサッカーをするために公園へ行きました。','to-purpose',2,purposeNote,purposePoint],
 ['I was late because I missed the bus.','私はバスに乗り遅れたので遅刻しました。','connectors',2,becauseNote,becausePoint],
 ['She is happy because she passed the test.','彼女はその試験に合格したのでうれしいです。','connectors',2,becauseNote,becausePoint],
 ['If it is sunny, we will play outside.','もし晴れたら、私たちは外で遊びます。','connectors',2,ifNote,p('条件と未来','ifの節はisのまま。結果を表す節でwillを使います。','If + 主語 + 現在形, 主語 + will + 動詞の原形')],
 ['If you are tired, you should rest.','もし疲れているなら、あなたは休んだほうがよいです。','connectors',2,ifNote+' 結果の節は助言を表す助動詞で。',ifPoint],
 ['I will call you after I finish my homework.','私は自分の宿題を終えたら、あなたに電話します。','connectors',2,afterNote,afterPoint],
 ['She went home after she finished her work.','彼女は自分の仕事を終えた後で帰宅しました。','connectors',2,afterNote,afterPoint],
 ['This bag is too heavy for me.','このかばんは私には重すぎます。','too',2,tooNote,tooPoint],
 ['These shoes are too small for me.','これらの靴は私には小さすぎます。','too',2,tooNote,tooPoint],
 ['My bike is as new as yours.','私の自転車はあなたのと同じくらい新しいです。','as',1,'同等比較を使い、「あなたの自転車」は所有を表す代名詞で。自転車は短い呼び方を使います。',p('同等比較','newをasとasではさみます。yoursはyour bikeを表します。','as + 形容詞の原級 + as')],
 ['This test is not as easy as that one.','この試験はあの試験ほど簡単ではありません。','as',1,'同等比較を否定する形で。あの試験は、同じ名詞の繰り返しを避ける代名詞で表します。短縮しない形で。',p('同等比較の否定','not as … asで比較します。that oneのoneはtestの繰り返しを避ける語です。','not as + 形容詞の原級 + as')],
 ['You should not eat too much.','あなたは食べすぎないほうがよいです。','should',1,'助言を表す助動詞を否定し、食べる動詞、量が多すぎる表現と続けます。短縮しない形で。',p('助言の否定','should notは「しないほうがよい」。禁止のmust notとは強さが違います。','主語 + should not + 動詞の原形')],
 ['You should not stay up late.','あなたは夜更かしをしないほうがよいです。','should',1,'助言を表す助動詞を否定します。寝ないで起きていることを表す熟語で夜更かしを伝えます。短縮しない形で。',p('助言の否定','should notの後ろにstay up late（夜更かしする）を続けます。','主語 + should not + 動詞の原形')],
 ['This book is better than that one.','この本はあの本よりよいです。','comparison',1,'「よい」の比較級で。あの本は、同じ名詞の繰り返しを避ける代名詞で表します。短縮しない形で。',p('不規則な比較級','goodの比較級はbetterです。more goodやgooderにはしません。','better + than + 比べる相手')],
 ['They were not watching TV then.','彼らはそのときテレビを見ていませんでした。','past-progressive',1,'そのとき進行中だった動作を否定します。短縮しない形で。',p('過去進行形の否定','複数の主語なのでwereを使い、not＋watchingと続けます。','主語 + were not + 動詞ing')],
 ['Is she going to visit Kyoto tomorrow?','彼女は明日京都を訪ねる予定ですか？','future-going',1,'前から決めていた予定を、進行形に似た未来の構文で尋ねます。',p('予定の疑問文','be going toの疑問文では、be動詞を主語の前に出します。','Is + she + going to + 動詞の原形?')],
].map(([text,translation,card,band,formNote,grammarPoint])=>({question:{text,translation,grammarPoint},card,band,formNote}));
assert.equal(added.length,22);
// Two more contrasts make a previously one-off pattern usable in both tenses.
added.push(
 {question:{text:'He did not come to the party.',translation:'彼はそのパーティーに来ませんでした。',grammarPoint:pastPoint},card:'past-verb',band:1,formNote:pastNote},
 {question:{text:'This shirt is too big for me.',translation:'このシャツは私には大きすぎます。',grammarPoint:p('too＋形容詞','too bigで「大きすぎる」、for meで「私には」と、基準になる人を伝えます。','be動詞 + too + 形容詞 + for 人')},card:'too',band:2,formNote:'「〜すぎる」を表す副詞、形容詞、「私には」の順に続けます。短縮しない形で。'},
);
assert.equal(added.length,24);
for(const e of added){assert.ok(!old.some(q=>q.text===e.question.text),e.question.text);assert.ok(e.question.text.length<=45);}

// These are practice constraints, not claims that the other natural English is wrong.
const permissionNote='上の別表現も自然な英語です。この問題では、そこに表示した助動詞以外の形で、許可を求める練習をします。';
const requestNote='上の別表現も自然な英語です。この問題では、そこに表示した助動詞以外の形で、丁寧に依頼する練習をします。';
const updated={
 'May I use your dictionary?':{alternatives:[['Can I','許可を求める別の形'],['Could I','丁寧に許可を求める別の形']],formNote:permissionNote},
 'May I ask you a question?':{alternatives:[['Can I','許可を求める別の形'],['Could I','丁寧に許可を求める別の形']],formNote:permissionNote},
 'Could I borrow your umbrella today?':{alternatives:[['Can I','許可を求める別の形'],['May I','丁寧に許可を求める別の形']],formNote:permissionNote},
 'Can I have some more water?':{alternatives:[['May I have','丁寧に求める別の形'],['Could I have','丁寧に求める別の形']],formNote:permissionNote},
 'Could you open the door?':{alternatives:[['Can you','依頼する別の形'],['Would you','丁寧に依頼する別の形']],formNote:requestNote},
 'Could you show me your textbook?':{alternatives:[['Can you','依頼する別の形'],['Would you','丁寧に依頼する別の形']],formNote:requestNote},
 'Can you lend me some money?':{alternatives:[['Could you','丁寧に依頼する別の形'],['Would you','丁寧に依頼する別の形']],formNote:requestNote},
 'There is nobody in the room.':{formNote:'存在を表す文で、だれもいないことを伝えます。上の別表現とは別の代名詞で練習します。別表現も意味は同じです。短縮しない形で。'},
 'There was no one at the bus stop.':{formNote:'過去の存在を表す文で、だれもいなかったことを伝えます。上の別表現とは別の代名詞で練習します。別表現も意味は同じです。短縮しない形で。'},
 'Nobody in my family likes coffee.':{formNote:'「だれも〜ない」を表す代名詞を主語にします。上の別表現とは別の代名詞で練習します。別表現も意味は同じです。'},
 'Everyone in my class likes music.':{formNote:'「みんな」を表す代名詞を主語にします。上の別表現とは別の代名詞で練習します。どちらも動詞は単数扱いです。'},
 'Do you know anyone in London?':{formNote:'「だれか」を表す代名詞で尋ねます。上の別表現とは別の代名詞で練習します。別表現も自然です。'},
 'Does anyone know the answer?':{formNote:'「だれか」を表す代名詞で尋ねます。上の別表現とは別の代名詞で練習します。別表現も自然です。'},
};
const changed=[];
for(const [text,update] of Object.entries(updated)){
 const q=old.find(q=>q.text===text);assert.ok(q);let entry=prompts.find(e=>e.course==='Eiken4'&&e.level===3&&e.text===text);
 const before=entry?structuredClone(entry):null;
 if(!entry){entry={course:'Eiken4',level:3,...q,previousMeaning:getPriorMeaning(q,'Eiken4'),meaning:getQuestionMeaning(q,'Eiken4'),alternatives:[],contrasts:[],formNote:'',reason:''};prompts.push(entry);}
 Object.assign(entry,update,{reason:'和訳だけでは同じ意味の別表現も成立するため、今回は表示された別表現以外の構文を練習することを明示。別表現を誤りとは扱わない。'});
 if(update.alternatives)entry.alternatives=update.alternatives.map(([text,note])=>({text,note}));
 changed.push({question:q,before,after:structuredClone(entry)});
}
for(const e of added)prompts.push({course:'Eiken4',level:3,...e.question,previousMeaning:e.question.translation,meaning:e.question.translation,alternatives:[],contrasts:[],formNote:e.formNote,reason:'4級の不足する文型の補強。日本語で文法上の条件を示し、正解の綴りは出さない。'});
const band1=['foundation','questions','noun-phrases','present-progressive','past-be','past-verb','past-progressive','future-will','future-going','there','can','must','should','imperative','comparison','superlative','as'];
const band2=['to-noun','to-purpose','to-reason','gerund','something','connectors','too'];
const topicOrder=[...band1,...band2,'permission','requests','offer','opinion','give','tell-to','how-to','it-to','take-time','conversation'];
const runtime=[...old.map(question=>({question,card:assignments[question.text],band:band1.includes(assignments[question.text])?1:band2.includes(assignments[question.text])?2:3})),...added]
 .sort((a,b)=>a.band-b.band||topicOrder.indexOf(a.card)-topicOrder.indexOf(b.card));
assert.equal(runtime.length,233);assert.equal(new Set(runtime.map(e=>e.question.text)).size,233);
const report={status:'local-implementation',date:'2026-10-19',baselineCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceQuestionsSha256:sha(QUESTIONS),sourcePromptsSha256,counts:{before:209,retained:209,removed:0,added:24,active:233,promptChanges:changed.length},bands:[1,2,3].map(b=>runtime.filter(e=>e.band<=b).length),changed,active:runtime.map((e,i)=>({number:i+1,...e,origin:old.some(q=>q.text===e.question.text)?'keep':'add',meaning:prompts.find(p=>p.course==='Eiken4'&&p.level===3&&p.text===e.question.text)?.meaning??getQuestionMeaning(e.question,'Eiken4'),formNote:prompts.find(p=>p.course==='Eiken4'&&p.level===3&&p.text===e.question.text)?.formNote??''}))};
fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(dir+'/review.json',JSON.stringify(report,null,2)+'\n');
fs.writeFileSync('src/data/questionSets/eiken/grade4Foundations.json',JSON.stringify(runtime.map(({question,card,band})=>({question,card,band})),null,2)+'\n');
fs.writeFileSync('src/data/grade4FoundationAssignments.json',JSON.stringify(Object.fromEntries(added.map(e=>[e.question.text,e.card])),null,2)+'\n');
fs.writeFileSync(promptFile,JSON.stringify(prompts,null,2)+'\n');
console.log('Prepared',report.counts,'cumulative pools',report.bands);
