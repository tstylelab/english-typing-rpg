import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {load} from './lib/load-typescript-data.mjs';
const dir='docs/grade1-level3-check-2026-10-19',r=JSON.parse(fs.readFileSync(dir+'/review.json'));
assert.ok(!fs.existsSync(dir+'/release.json'),'Preserve the initial release audit; do not apply twice.');
const {QUESTIONS}=load('src/data/questions.ts'),{getGrammarCard}=load('src/data/grammarGuides.ts');
const sha=x=>createHash('sha256').update(x).digest('hex');
assert.equal(sha(JSON.stringify(QUESTIONS)),r.baseline.questionsSha256);
const points={},additions={},assignments={},cards=[];
const extras={
 'perfect-passive':'have been revisedは受け身の現在完了です。過去形were revisedとの意味の重なりはありますが、ここでは現在につながる処理の結果を確かめます。',
 'progressive-passive':'is being testedは現在進んでいる受け身です。has been testedなら試験済みの結果に焦点があり、同じ時点の説明とは限りません。',
 'modal-perfect':'may haveとmight haveはどちらも自然な可能性の表現です。この文脈で確率を固定の数字にして区別する必要はありません。',
 'modal-perfect-passive':'should have been disclosedでは、過去に開示されるべきだった対応を述べます。ought to have beenも自然です。単に現在開示すべきだというshould beとは時点が違います。',
 'impersonal-report':'It is believed thatは信じられている内容の報告です。その内容が証明されたという意味ではありません。that節の過去形と、現在の見解を示すisを分けます。',
 'personal-report-perfect':'is believedは現在の見解、to have existedなどはそれより前の内容です。It is believed that ...という別の語順でも表せます。',
 'mandative-verb':'recommend thatの後ろの原形は、提案の内容を示す形です。should publishのようにshouldを使う形も自然です。主語が単数だからと機械的にpublishesへ変えません。',
 'mandative-adjective':'be informedは受け身、have accessは利用できるという意味のhaveです。that節のbeをisにしない原形の型を練習しています。shouldを使う型もあります。',
 'relative-object':'the team collectedの中では、集めたものを目的語として繰り返しません。whichも自然で、目的格のthat/whichを省略できる場合もあります。',
 'nonrestrictive':'コンマで補足するwhichをthatに置き換えることはできません。主語と主節の動詞の間に補足が挟まるので、まず主節の骨組みを確かめます。',
 'sentential-which':'which angered ...は、前の節が述べる出来事を受けます。直前の名詞を必ずwhichの先行詞にする、と決めつけないようにします。',
 'preposition-relative':'assess against、conduct under、rest onなど、元の意味の結び付きを確認します。前置詞の直後のwhichをthatに替えることはできません。',
 'perfect-participle':'Having examinedでは、調べたのも主張を退けたのもpanelです。先に終わった行為を表し、having以下だけで独立した過去の主節にはなりません。',
 'result-participle':'cutting offやleaving以下は、主節の出来事がもたらした結果です。これから達成する目的を表すto不定詞と取り違えないようにします。',
 'formal-subject-whether':'whether以下が、不明だと評価している内容です。条件のif節を後ろに付けているのではありません。It remains unclear if ...とする文も自然です。',
 'formal-object':'itは前に出た具体的な物でなく、後ろのto以下の内容を先に受ける形式目的語です。considerの主語がsheならconsidersとなります。',
 'not-until':'until以下の時が来るまでは起きなかったという意味です。過去の一般動詞にはdidを補い、その後ろの動詞は原形に戻します。',
 'cleft':'It wasとthatの間が強調する部分です。that以下に、原因となった主語をもう一度書き足しません。形式主語It is essential that ...とは役割が違います。',
 'had-inversion':'Had the warnings been heededはIf the warnings had been heededに対応します。前半のhadと、後半のwould haveの位置を混同しません。',
 'concessive-as':'形容詞を前に置いたasはここでは譲歩です。thoughでもこの形を作れますが、通常のAlthough the funds were limited ...とは語順が異なります。',
 'unreal-present':'wereは現在の現実から距離を置く形です。主節のwould gainなどと組み合わせます。wereの代わりにwasを使う文脈もありますが、ここではwereの型を練習します。',
 'unreal-past':'条件節はhad been/consultedなど、結果はwould have been/avoidedなどです。現在の仮定で使うwould＋原形だけの形とは時点が異なります。',
 'mixed-conditional':'would have fewer jobsのhaveは「雇用がある」という一般動詞で、後ろは名詞です。would have＋過去分詞の過去の結果と混同しません。nowが現在を明示しています。',
 'provided':'provided thatとproviding thatはどちらも条件を述べられます。主節のcanは可能性、may proceedはこの文では進めてよいという許可です。',
 'even-if':'even ifは仮の条件を認めても結果・判断が変わらないことを示します。事実として認めるeven thoughと意味が重なる日本語でも、場面を確認します。',
 'whether-or':'このwhether節は「成功するかどうかを知る」という目的語でなく、成功してもしなくてもという譲歩です。主節がどちらの場合にも成り立ちます。',
 'however-degree':'howeverの直後のconvincing/urgent/severeが程度を表します。No matter how ...とも言い換えられます。文頭のHowever, ...という逆接とは語順が違います。',
 'regardless-whether':'regardless ofのofは前置詞で、その後ろにwhether節を続けます。Whether ... or not, ...の譲歩や、名詞だけを続けるregardless of the costとも比べられます。',
 'partial-negative':'Not allは「すべてに当てはまる」の否定です。「どれも当てはまらない」と断定していません。主語を説明するthat節と、主節の動詞も分けます。',
 'not-necessarily':'necessarilyを置くことで、結果が必ず生じるという結び付きを否定します。主語がEconomic growthなど単数のまとまりなのでdoesを使います。',
 'neither-nor':'今回の三つの文は、二つの主語がどちらも単数なのでprovides/accepts/accountsです。複数の要素が混ざる場合まで同じ一致規則で決めるものではありません。',
 'appositive-that':'the figures differという節は、factの中身を示す完全文です。the figures that we checkedならcheckedの目的語が欠ける関係節で、役割が異なります。',
 'need-not-perfect':'need not haveは、実際には行ったが不要だったという振り返りです。did not need toだけなら、その行為を実際にしたかどうかは文脈で判断します。',
 'multiple-comparison':'twice/three timesの後ろは原級を挟むas ... asです。last as longのlongは時間の副詞、efficient/extensiveは主語の性質を表す形容詞です。',
 'correlative-comparison':'The longer ...とthe harder ...のように、二つの程度の変化を対応させます。less reliableは信頼性の低さを表し、more cautionは必要な慎重さの量です。',
 'rather-than-parallel':'chose to revise rather than abandonでは、二つの行動が並びます。rather thanの後ろを原形にして対応させる型です。別の文脈にはingを用いる形もあります。',
 'no-sooner':'この型では前半が過去完了の倒置、後半がthanです。hardly ... whenという自然な別の型と混ぜないようにします。no soonerに続く時制が常に過去完了に限られる、という意味ではありません。',
 'negative-fronting':'Under no circumstancesは否定の条件を前に出した形です。shouldの後ろは主語、その後ろに動詞を置きます。文の途中の主語自体を否定しているのではありません。',
 'should-condition':'Should further evidence emergeはIf further evidence should emergeに対応します。shouldはここでは義務の「すべき」でなく、万一の場合の条件を示します。',
 'were-condition':'Were the scheme to failはIf the scheme were to failに対応します。実現から距離を置く仮定で、実際に必ず失敗する・絶対に失敗しないと断定していません。',
};
const oldNotes={
 'Poor housing can increase the risk of illness.':['無生物主語と可能性','原因 + can + 他動詞 + 目的語','住環境を原因の主語にし、canで起こり得る影響を述べます。すべての場合に病気になるという断定ではありません。'],
 'The benefits are greater than the immediate costs.':['形容詞の比較級','主語 + be + greater than + 比較相手','greaterが大きさを比較する補語です。outweighのように比較を動詞で述べる形とは異なります。'],
 'Rural areas have fewer doctors than large cities.':['数えられる名詞の数量比較','have + fewer + 複数名詞 + than ...','doctorsは数えられる複数名詞で、数の少なさをfewerで表します。数えられない量のlessと区別します。'],
 'The new method uses less energy than the old one.':['数えられない量と代用語','use + less + 不可算名詞 + than ...','energyの量の少なさをlessで表します。oneは前にあるmethodの繰り返しを避ける代用語です。'],
 'The survey shows that public opinion has shifted.':['内容節と現在完了','show that + 主語 + has + 過去分詞','that節が示された内容で、has shiftedは変化が現在につながる現在完了です。'],
 'The program that supports small farms has expanded.':['主格関係節と現在完了','主語 + that + 動詞 ... + has + 過去分詞','that supports small farmsがprogramを説明します。文全体の動詞はhas expandedで、現在につながる拡大を表します。'],
 'The data suggests that the disease is spreading slowly.':['内容節と進行形','suggest that + 主語 + is + 動詞ing','that節で示された内容を述べ、is spreadingで今進行している変化を表します。dataはこの文では集合として単数扱いです。'],
 'The findings indicate that the treatment has long-term effects.':['内容節と一般動詞のhave','indicate that + 主語 + has + 名詞','that節のhasの後ろはeffectsという名詞なので、現在完了ではありません。治療に長期的な影響があることを表します。'],
 'The agency must verify the figures before publishing them.':['必要性と時のing表現','must + 原形 + 目的語 + before + 動詞ing','mustが必要性を示します。beforeの後ろはpublishingというing形で、公表する主体は主節と同じagencyです。'],
};
const forms={
 'Poor housing can increase the risk of illness.':'住環境を主語にして、一般的に起こり得る影響を助動詞と他動詞で述べます。',
 'The drought forced many families to leave the region.':'干ばつを主語にし、人をある行動へ強いる形で述べます。行動は目的語の人に不定詞を続けて表します。',
 'The closure left hundreds of workers without jobs.':'閉鎖を主語にし、影響を受けた人と、その後に残された状態を続けます。',
 'Governments must protect the rights of indigenous people.':'強い必要性・義務を、助動詞と動詞の原形で表します。',
 'The company may need to change its safety procedures.':'必要性がある可能性を述べます。助動詞の後ろに、必要性を表す動詞と不定詞を続けます。',
 'The benefits are greater than the immediate costs.':'恩恵を主語にし、性質を表す形容詞の比較級で費用と比べます。動詞自体で比較する形ではありません。',
 'Rural areas have fewer doctors than large cities.':'医師は数えられる複数名詞です。医師の数が少ないことを表す数量の比較を使います。',
 'The new method uses less energy than the old one.':'エネルギーの量を比較します。比較相手の方法は、同じ名詞の繰り返しを避ける代用語で述べます。',
 'If the evidence is weak, the case should be reconsidered.':'条件節を先に置きます。主節は案件を主語とし、望ましい対応を助動詞の受け身で述べます。',
 'Repeated delays eroded confidence in the project.':'度重なる遅れを主語にし、信頼を徐々に損なったことを他動詞で述べます。',
 'The false claim sparked a wave of public criticism.':'主張を原因の主語にし、引き起こした批判を他動詞の目的語として続けます。',
 'The drought drove more people to migrate to cities.':'干ばつを主語にし、人を移住へ追い込んだことを、目的語の人と不定詞を続ける形で述べます。',
 'A loophole allowed the firm to avoid the restriction.':'抜け穴を主語にし、行動を可能にしたことを、目的語の組織と不定詞を続ける形で述べます。',
 'The campaign helped dispel the stigma surrounding the illness.':'運動が助けとなった行動を、動詞の原形で続けます。偏見を表す名詞は分詞のまとまりで後ろから説明します。',
 'The potential harm outweighs the short-term benefit.':'害を主語にし、比較の意味を持つ他動詞の直後に、比較される恩恵を目的語として置きます。',
 'The families whose homes were flooded received support.':'家族と家の所有関係を、関係代名詞に名詞を続ける形で示します。家が関係節の主語です。',
 'The inquiry revealed that officials had ignored warnings.':'調査で明らかになるより前の行為を、内容節の過去完了で述べます。',
 'Witnesses claimed that the officer had altered the report.':'主張した時点より前の行為を、内容節の過去完了で述べます。検証済みの事実だとは断定していません。',
 'The damage was far more severe than officials had expected.':'程度の比較級を、差が大きいことを表す副詞で強めます。以前の予想は過去完了で述べます。',
 'Although both sides sought peace, neither would compromise.':'譲歩の節を先に置きます。主節では両方を否定し、過去に譲歩する意思がなかったことを助動詞で表します。',
 'The agency must verify the figures before publishing them.':'強い必要性を助動詞で述べます。公表する前という時のまとまりでは、動詞を名詞に準じる形で続けます。',
 'While the trial failed, it revealed an important problem.':'譲歩の節を先に置きます。比較欄の接続表現も自然ですが、今回はそれ以外の形で練習します。',
 'The law that protects workers will take effect next year.':'主語の名詞を、関係代名詞が主語になる節で説明します。比較欄以外の関係代名詞で練習します。',
};
const meanings={
 'If the evidence is weak, the case should be reconsidered.':'証拠が弱いなら、その案件は再検討されるべきです。',
 'Witnesses claimed that the officer had altered the report.':'目撃者たちは、その職員が報告書を改ざんしていたと主張しました。',
 'Although both sides sought peace, neither would compromise.':'双方が平和を求めましたが、どちらも譲歩しようとしませんでした。',
};
const prompts=JSON.parse(fs.readFileSync('src/data/translationBattlePrompts.json')),beforeCount=prompts.length,changedPrompts=[];
for(const c of r.courses){
 points[c.course]={};assignments[c.course]={};
 for(const row of c.rows){
  const q=row.question,card=getGrammarCard(c.course,3,q),meta=oldNotes[q.text];
  points[c.course][q.text]=meta?{label:meta[0],pattern:meta[1],note:meta[2]}:{label:card.term,pattern:card.pattern,note:card.tip};
  if(forms[q.text]){
   const index=prompts.findIndex(p=>p.course===c.course&&p.level===3&&p.text===q.text&&p.translation===q.translation);
   const before=index<0?null:structuredClone(prompts[index]);
   const after={...(before??{course:c.course,level:3,text:q.text,translation:q.translation,previousMeaning:q.translation,meaning:row.meaning,alternatives:row.alternatives,contrasts:[]}),meaning:meanings[q.text]??before?.meaning??row.meaning,formNote:forms[q.text],reason:'1級Level3の承認済み点検に基づき、対象の型・態・時点を具体化する。'};
   if(index<0)prompts.push(after);else prompts[index]=after;
   changedPrompts.push({course:c.course,text:q.text,before,after:structuredClone(after)});
  }
 }
 additions[c.course]=c.proposed.map(q=>({targetId:q.targetId,priority:q.priority,question:{text:q.text,translation:q.meaning,grammarPoint:q.grammarPoint}}));
 for(const t of c.targets){
  const qs=c.proposed.filter(q=>q.targetId===t.id),id='exp-'+(c.course.endsWith('1')?'a-':'b-')+t.id;
  cards.push({id,section:t.extension?4:3,title:t.title,subtitle:'短い文で形・時点・意味を組み立てる',term:t.title,pattern:t.pattern,tip:t.note,more:extras[t.id],examples:qs.slice(0,2).map(q=>[q.text,q.meaning])});assert.ok(extras[t.id]);
  for(const q of qs)assignments[c.course][q.text]=id;
 }
 for(const q of c.proposed){
  let formNote=q.formNote;
  if(q.targetId==='modal-perfect')formNote+='下の別表現以外の助動詞で練習します。';
  prompts.push({course:c.course,level:3,text:q.text,translation:q.meaning,previousMeaning:q.meaning,meaning:q.meaning,formNote,alternatives:q.alternatives,contrasts:[],reason:'承認済み1級の文法追加。型・時点・自然な別表現を整理する。'});
 }
}
assert.equal(changedPrompts.length,23);assert.equal(prompts.length,beforeCount+120+changedPrompts.filter(p=>p.before===null).length);
const release={date:'2026-10-19',status:'implemented-local-awaiting-publication',baseline:r.baseline,promptCountBefore:beforeCount,changedPrompts,courses:r.courses.map(c=>({course:c.course,retained:40,added:60,total:100,oldGuideCount:c.cards,newGuideCount:c.cards+20}))};
for(const [p,data]of [
 ['src/data/questionSets/eiken/grade1GrammarExpansion.json',additions],['src/data/grade1GrammarPointOverrides.json',points],
 ['src/data/grade1GrammarExpansionCards.json',cards],['src/data/grade1GrammarExpansionAssignments.json',assignments],
 ['src/data/translationBattlePrompts.json',prompts],[dir+'/release.json',release],
])fs.writeFileSync(p,JSON.stringify(data,null,2)+'\n');
console.log('Prepared 120 questions, 40 guides, 80 specific short annotations and 23 reviewed prompt updates; original identities retained.');
