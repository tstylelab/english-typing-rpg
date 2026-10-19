import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import ts from 'typescript';
import {load} from '../../scripts/lib/load-typescript-data.mjs';
import {loadBattleDamage} from '../../scripts/lib/load-battle-damage.mjs';
import {plans} from './proposal-input.mjs';
import {page} from './page-template.mjs';
const dir=import.meta.dirname,sha=x=>createHash('sha256').update(x).digest('hex'),plain=x=>JSON.parse(JSON.stringify(x));
if(fs.existsSync(dir+'/release.json')){
 const release=JSON.parse(fs.readFileSync(dir+'/release.json'));
 fs.writeFileSync(dir+'/index.html',page(release));
 console.log('Rendered approved release; original inspection/proposal/balance snapshots preserved.');
 process.exit(0);
}
const {QUESTIONS}=load('src/data/questions.ts');
const {getGrammarCard,grammarGuides}=load('src/data/grammarGuides.ts');
const {getQuestionGrammarPoint}=load('src/data/questionGrammarPoints.ts');
const {getQuestionMeaning}=load('src/data/questionMeaning.ts');
const {getTranslationBattlePrompt}=load('src/data/translationBattlePrompts.ts');
const baselinePath=dir+'/baseline.json';
const sourcePaths=['src/App.tsx','src/data/questionSets/eiken/grade1.ts','src/data/questionSets/eiken/grade1Sentences.ts','src/data/grade1GrammarGuide.ts','src/data/grade1GrammarAssignments.ts','src/data/questionGrammarPoints.ts','src/data/translationBattlePrompts.json','src/data/questions.ts'];
const current={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),questionsSha256:sha(JSON.stringify(QUESTIONS)),sourceHashes:Object.fromEntries(sourcePaths.map(p=>[p,sha(fs.readFileSync(p))]))};
if(!fs.existsSync(baselinePath))fs.writeFileSync(baselinePath,JSON.stringify(current,null,2)+'\n');
assert.deepEqual(current,JSON.parse(fs.readFileSync(baselinePath)),'Inspection must not change runtime sources, existing Pre-1 work, or any question');
const findings={
 'Poor housing can increase the risk of illness.':['短い文法注釈','語順の主な形は、原因の主語・助動詞・他動詞・目的語です。現在の注釈のBecause節／led toという型だけでは、この文のcan increaseを説明できません。','住環境を主語にする形と、canによる一般的な可能性を説明する。'],
 'The drought forced many families to leave the region.':['短い文法注釈','詳細なforce-toカードは適切です。短い注釈は原因一般の型で、force＋人＋to不定詞の形が見えません。','行動するのはfamiliesであることと、force＋人＋toの型を短い注釈にも反映する。'],
 'The closure left hundreds of workers without jobs.':['短い文法注釈','詳細なleave-stateカードは適切ですが、短い注釈の型はbecause／led toです。実際は人をある状態に残すleaveです。','leave＋目的語＋状態の型にし、without jobsがworkersの状態だと示す。'],
 'Local governments should prepare for extreme weather.':['保持','shouldを使う必要な対応の提案として自然です。既存のshouldカードとの対応も適切です。','現状を保持し、追加問題で過去のshould haveや受け身との違いも練習する。'],
 'Governments must protect the rights of indigenous people.':['短い文法注釈','短い注釈は可能性・提案で、may/could/shouldの型です。実際のmustは強い必要性・義務を述べています。詳細mustカードは対応しています。','must＋原形による必要性を個別に説明する。'],
 'The company may need to change its safety procedures.':['和訳・型の条件','和訳は自然ですが、mightやhave toなども成立します。may＋need＋toの形を練習する狙いを明確にしたい文です。','必要性がある可能性を述べることと、助動詞の後ろのneed toの組み立てを補足する。別の自然な英文を誤りと断定しない。'],
 'The benefits are greater than the immediate costs.':['和訳・型の条件','「恩恵は費用を上回る」からはoutweighも自然です。語義だけでgreater thanを決めることはできません。','主語の性質を形容詞の比較級で比べる型だと補足し、動詞で比較する別表現も併記する。'],
 'Rural areas have fewer doctors than large cities.':['注釈の具体化','詳細quantityカードは適切です。短い注釈のmore/lessという型を、数えられるdoctorの数の比較に合わせたい文です。','fewer＋複数名詞と、数えられない量に使うlessを比較する。'],
 'The new method uses less energy than the old one.':['注釈の具体化','意味と詳細quantityカードは適切です。量を表すenergyと、同じ名詞の繰り返しを避けるoneを確認できます。','量のlessと、方法を指す代用語oneを短い説明に含める。'],
 'If the evidence is weak, the case should be reconsidered.':['和訳・態','「事件は再検討すべきだ」は能動にも読めます。実際は案件を主語にしたshould be reconsideredで、受け身です。詳細conditionカードは受け身まで説明しています。','表示和訳を「証拠が弱いなら、その案件は再検討されるべきです」とし、条件節＋助動詞の受け身を補足する案。元の保存用和訳は維持する。'],
 'The survey shows that public opinion has shifted.':['保持','that節の中のhas shiftedは現在完了です。内容節と、変化が今につながる完了形の両方がある文として保持できます。','内容節を主目標として残し、短い注釈に現在完了も添える。'],
 'The data suggests that the disease is spreading slowly.':['保持','dataの単数扱いは使用されます。data suggestという複数扱いもあり、単数だから誤文と断定しません。hasではなくis spreadingは進行形です。','原文を保持し、今進行している変化と、dataの数の扱いの幅を解説で確認する。'],
 'The findings indicate that the treatment has long-term effects.':['保持','has long-term effectsのhasは「持つ」という動詞で、現在完了ではありません。本文は内容節の練習として自然です。','現在完了の集計に入れず、主語が複数のfindingsなのでindicateになる点も確認する。'],
 'Repeated delays eroded confidence in the project.':['短い文法注釈','詳細cause-directカードは適切です。短い注釈のBecause節／led toではなく、出来事を主語にして他動詞で影響を述べています。','erodedの目的語confidenceと、その対象in the projectを分けて説明する。'],
 'The false claim sparked a wave of public criticism.':['短い文法注釈','原因と結果という意味の分類は合っていますが、実際の型は他動詞spark＋目的語です。becauseやled toを使った文ではありません。','主語の出来事が批判を引き起こしたことと、a wave of＋名詞を説明する。'],
 'The drought drove more people to migrate to cities.':['短い文法注釈','車を運転したという意味のdriveではなく、人を行動へ追い込むdrive＋人＋toです。詳細force-toカードは適切です。','drove＋人＋to不定詞、行動する人、二つのtoの役割を短い注釈にも示す。'],
 'A loophole allowed the firm to avoid the restriction.':['短い文法注釈','詳細allow-toカードは適切です。短い原因一般の注釈から、allow＋人・組織＋toの形を明確にしたい文です。','正式な許可に限らず、可能にした事情を表すと説明する。'],
 'The campaign helped dispel the stigma surrounding the illness.':['短い文法注釈','helpの後ろの原形dispelと、名詞stigmaを説明する分詞surroundingがあります。短いcause型だけではその区別ができません。','help＋原形と、名詞＋現在分詞の後置修飾を個別に説明する。'],
 'The potential harm outweighs the short-term benefit.':['短い文法注釈','詳細outweighカードは適切です。短い注釈のmore/less ... thanという型とは異なり、outweighが目的語を直接取ります。','比較の意味を持つ他動詞として説明し、後ろにthanを追加しないことを示す。'],
 'The families whose homes were flooded received support.':['短い文法注釈','関係詞という分類は適切ですが、短い型はthat/which/whoです。この文はwhose＋名詞で所有関係を示し、関係節内は受け身です。','主節の主語familiesと、関係節の主語homesを分け、whoseを含む型にする。'],
 'The inquiry revealed that officials had ignored warnings.':['短い文法注釈','詳細that-past-perfectカードと現在の出題補足は適切です。短い注釈にも、明らかになる前の行為という過去完了を反映したい文です。','revealedの時点より前をhad ignoredで表すと明示する。'],
 'Witnesses claimed that the officer had altered the report.':['注釈・和訳の条件','had alteredは主張した時点より前の行為。claimedは主張されたことを示し、内容が検証済みと保証しません。','短い注釈と出題補足に過去完了の時点を示し、「改ざんしていたと主張した」とする案。'],
 'The damage was far more severe than officials had expected.':['短い文法注釈','詳細comparison-pastカードは適切です。短い比較一般の説明に、farの強調と以前の予想のhad expectedを補いたい文です。','比較の差の強調、than節の過去完了と省略を説明する。'],
 'Although both sides sought peace, neither would compromise.':['注釈・和訳の条件','譲歩の接続に加えて、neitherの両方否定と、過去に譲歩する意思を示さなかったwouldがあります。仮定法と一律に数えません。','「どちらも譲歩しようとしなかった」とする案。譲歩・neither・過去の意思を分けて説明する。'],
 'The agency must verify the figures before publishing them.':['短い文法注釈','mustの義務・必要性と、before＋動名詞があります。短い注釈のmay/could/shouldだけでは形が合いません。','must＋原形とbefore＋ing、publishingする主体がagencyであることを示す。'],
 'While the trial failed, it revealed an important problem.':['和訳・型の条件','whileとalthoughなどの自然な譲歩表現が重なります。現在はAlthoughが比較表示されています。語義だけではwhileを一意に選べません。','譲歩の節を先に置く型を指定し、比較欄の自然な別表現と今回の指定形の関係を示す。'],
 'The law that protects workers will take effect next year.':['和訳・型の条件','thatとwhichはどちらも自然です。現在もwhichの比較表示があります。「関係詞」だけではthatを一意に選べません。','関係代名詞を省略しない主格の型を明示し、別の自然な関係代名詞もあることを残す。'],
};
const alternatives=(id,text)=>{
 const out=[];const add=(t,n)=>{if(t!==text)out.push({text:t,note:n});};
 if(id==='modal-perfect')add(text.replace(' may have ',' might have '),'過去の可能性を述べる自然な別表現');
 if(id==='modal-perfect-passive')add(text.replace(' should have been ',' ought to have been '),'過去の対応を振り返る別の助動詞表現');
 if(id==='relative-object'){add(text.replace(' that ',' which '),'物を説明する目的格の関係代名詞');add(text.replace(' that ',' '),'目的格の関係代名詞を省く形');}
 if(id==='provided')add(text.replace(' provided that ',' providing that '),'同じ条件を表せる接続表現');
 if(id==='concessive-as')add(text.replace(' as ',' though '),'形容詞を前に出す譲歩の別の形');
 return out;
};
const report={date:'2026-10-19',status:'inspection-and-complete-draft-proposal-only',baseline:current,findings:[],courses:[],sources:[
 ['英検公式：1級の位置付け','https://www.eiken.or.jp/eiken/exam/grade_1/'],
 ['英検公式：2026年度第2回問題','https://www.eiken.or.jp/eiken/exam/kakomon/2026-2-1ji_1kyu.pdf'],
 ['英検公式：2026年度第1回問題','https://www.eiken.or.jp/eiken/exam/kakomon/2026-1-1ji-1kyu.pdf'],
 ['British Council：発展的な受け身','https://learnenglish.britishcouncil.org/free-resources/grammar/c1/advanced-passives-review'],
 ['British Council：分詞構文','https://learnenglish.britishcouncil.org/free-resources/grammar/c1/participle-clauses'],
 ['British Council：否定語句と倒置','https://learnenglish.britishcouncil.org/free-resources/grammar/c1/inversion-after-negative-adverbials'],
 ['Cambridge：条件の倒置','https://dictionary.cambridge.org/uk/grammar/british-grammar/conditionals-other'],
 ['British Council：条件の倒置の解説','https://learnenglish.britishcouncil.org/free-resources/grammar/c1/inversion-conditionals'],
 ['BBC Learning English：提案の節と仮定法現在','https://downloads.bbc.co.uk/worldservice/learningenglish/ask_about_english/pdfs/subjunctive.pdf'],
]};
const mean=xs=>xs.reduce((n,q)=>n+q.text.length,0)/xs.length;
for(const [course,targets]of Object.entries(plans)){
 const guide=grammarGuides[course];
 const rows=QUESTIONS[course][3].map((q,i)=>{const card=getGrammarCard(course,3,q),p=getTranslationBattlePrompt(q,course,3),f=findings[q.text];return {number:i+1,question:q,meaning:getQuestionMeaning(q,course),formNote:p?.formNote??'',alternatives:p?.alternatives??[],point:getQuestionGrammarPoint(course,3,q),card,action:'保持',review:f?{kind:f[0],finding:f[1],suggestion:f[2]}:{kind:'保持',finding:'英文・表示和訳と詳細カードの対応を確認。今回の目的でも既存文として活かせます。',suggestion:'英文と保存用和訳・保存キーを保持し、追加文で構文の幅を補う。'}};});
 assert.equal(rows.length,40);assert.ok(rows.every(r=>r.point&&r.card));assert.equal(targets.length,20);
 const proposed=targets.flatMap(t=>t.examples.map(([text,meaning],i)=>({number:40+proposedIndex(targets,t,i),targetId:t.id,group:t.group,target:t.title,priority:t.extension?'発展':'優先',text,meaning,formNote:t.formNote,alternatives:alternatives(t.id,text),grammarPoint:{label:t.title,pattern:t.pattern,note:t.note},guidePlan:'型・意味・別表現・例文を持つ詳細カードをこの目標に対応させる。既存カードが十分なら拡張し、旧IDは保持する。'})));
 assert.equal(proposed.length,60);assert.equal(new Set(proposed.map(q=>q.text)).size,60);assert.ok(proposed.every(q=>!rows.some(r=>r.question.text===q.text)));
 const broad=Object.fromEntries([...new Set(rows.map(r=>r.point.label))].map(label=>[label,rows.filter(r=>r.point.label===label).length]));
 assert.equal(Object.keys(broad).length,8);assert.ok(Object.values(broad).every(n=>n===5));
 const featureSets=course==='Eiken1Part1'?{presentPerfect:[6,12],pastPerfect:[],modalPerfect:[],unrealConditional:[],relativeWhose:[],postmodifierParticiple:[],participleClause:[],negativeInversion:[]}:{presentPerfect:[],pastPerfect:[21,26,27],modalPerfect:[],unrealConditional:[],relativeWhose:[12],postmodifierParticiple:[37],participleClause:[],negativeInversion:[]};
 // Explicit verified indices avoid counting "has long-term effects" as a perfect tense,
 // or past unwillingness "neither would compromise" as an unreal conditional.
 for(const indices of Object.values(featureSets))for(const n of indices)assert.ok(rows[n-1]);
 const lengths={mean:mean(rows.map(r=>r.question)),min:Math.min(...rows.map(r=>r.question.text.length)),max:Math.max(...rows.map(r=>r.question.text.length)),newMean:mean(proposed),combinedMean:mean([...rows.map(r=>r.question),...proposed]),newMin:Math.min(...proposed.map(q=>q.text.length)),newMax:Math.max(...proposed.map(q=>q.text.length))};
 report.courses.push({course,title:guide.grade,retained:40,removed:0,linked:40,shortNotes:40,cards:guide.cards.length,broad,featureSets,lengths,rows,targets:targets.map(({examples,...rest})=>({...rest,count:examples.length})),proposed,priorityAdds:48,extensionAdds:12,newTotal:100});
}
function proposedIndex(targets,t,i){return targets.indexOf(t)*3+i+1;}
assert.equal(new Set(report.courses.flatMap(c=>c.proposed).map(q=>q.text)).size,120);
report.findings=[
 '既存80問は社会・科学・公共政策などの題材を扱い、基本的な論理関係を短文で練習する用途に活かせます。誤文が多いので全面削除するという評価ではありません。',
 '文法の幅という目的では補強を勧めます。両コースとも8つの主分類に5問ずつ。主格の関係節や通常の条件・比較はある一方、反実仮想、助動詞＋完了形、分詞構文、倒置などを組み立てる練習はありません。',
 '詳細カードは①17枚・②21枚で全80問に対応します。短い文法注釈も80問にありますが、8種類の共通タグから作られており、force＋人＋to、leave＋目的語＋状態、outweighなどには実際と異なる型が表示されます。詳細解説が誤っているという意味とは分けます。',
 '追加案は各20目標×3文脈＝60問、各40→100問。優先16目標48問と発展4目標12問です。数合わせのために同じ文を言い換えるのではなく、主体・時点・対象を変えて同じ型を組み立てます。100が最適と実証された数という意味ではありません。',
 '今回は追加120問すべてに独自の英文・和訳・日本語の型の補足・短い文法説明を用意しました。詳細カードの本体実装、段階プールの採用、別解の自動受理はまだ行っていません。既存80問の英文・保存キーと旧カードIDを保持する方針です。',
 '1級でも長文読解の再現や難しい単語だけでの難化を目的にしません。短い文で情報の焦点、時点、条件、否定の範囲を扱います。接続詞・助動詞・関係詞など自然な別解が残るため、語義に架空の差を作って正解を一つに見せません。',
 '英検公式が求める広い英語運用と過去問中の構造を参考にした教材設計です。40目標は公式の必須文法リストでも、頻出順の認定でもありません。公式過去問の英文を原稿へ転載していません。',
];
// Calculate existing tuning and the complete draft's hypothetical tuning without editing app/data.
const expanded={...QUESTIONS};for(const c of report.courses)expanded[c.course]={...QUESTIONS[c.course],3:[...QUESTIONS[c.course][3],...c.proposed.map(q=>({text:q.text,translation:q.meaning}))]};
const m={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/longTextBattleBalance.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:m,exports:m.exports,require:()=>({QUESTIONS:expanded})});
const app=fs.readFileSync('src/App.tsx','utf8'),beforeEngine=loadBattleDamage(app),afterEngine=loadBattleDamage(app);afterEngine.getBalancedLongTextTuning=m.exports.getBalancedLongTextTuning;
const balance=[];let calculations=0;
for(const c of report.courses)for(const input of ['text-only','voice-only'])for(let stage=0;stage<23;stage++){
 const monster=beforeEngine.roster[3].challenge[stage],boss=beforeEngine.boss('challenge',input,stage,23),args=[c.course,3,'challenge',input,stage,monster.baseHp,boss];
 const before=beforeEngine.tune(...args),after=afterEngine.tune(...args);
 for(const [engine,tuning,qs]of [[beforeEngine,before,QUESTIONS[c.course][3]],[afterEngine,after,expanded[c.course][3]]])for(const speed of [.5,2,8])for(const rate of [0,.3,1]){
  const damages=qs.map(q=>engine.damage({selectedDifficulty:c.course,selectedLevel:3,mode:'challenge',inputMode:input,bossStage:boss,maxMonsterHp:tuning.monsterHp,maxQuestions:tuning.maxQuestions,missCount:Math.ceil(q.text.length*rate),startTime:1000000-q.text.length/speed*1000},q.text));calculations+=damages.length;
  if(rate===0)assert.ok(Math.min(...damages)*tuning.maxQuestions>=tuning.monsterHp);
  if(rate===1||boss&&rate===.3)assert.ok(Math.max(...damages)*tuning.maxQuestions<tuning.monsterHp);
 }
 balance.push({course:c.course,input,stage:stage+1,boss,before:plain(before),proposed:plain(after),requiredPerQuestion:{before:before.monsterHp/before.maxQuestions,proposed:after.monsterHp/after.maxQuestions}});
}
report.balance={status:'isolated-existing-and-proposed-simulation',calculations,changedLimits:balance.filter(r=>r.before.maxQuestions!==r.proposed.maxQuestions).length,bossError30PercentCanWin:false,allStagesErrorPerCharacterCanWin:false,stages:balance,limitations:'実際の回答計算を隔離VMで使用。間違えた問題の割合ではなく、完成までの誤打鍵数/文字数。問題を完成できずスキップする挙動は別。体感や語彙・構文の難しさの実測ではない。提案120問を採用した場合の計算であり本体未変更。'};
fs.writeFileSync(dir+'/review.json',JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(dir+'/balance-check.json',JSON.stringify(report.balance,null,2)+'\n');
fs.writeFileSync(dir+'/index.html',page());
console.log('Built Grade 1 review: 80 retained; '+report.courses.flatMap(c=>c.rows).filter(r=>r.review.kind!=='保持').length+' annotated improvement candidates; 120 complete draft questions / 40 targets; '+calculations+' real damage checks; runtime unchanged.');
