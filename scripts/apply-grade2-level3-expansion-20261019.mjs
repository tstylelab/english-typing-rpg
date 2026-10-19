import fs from 'node:fs';
import assert from 'node:assert/strict';
import {load} from './lib/load-typescript-data.mjs';
import {getPriorMeaning} from './lib/translation-prompt-baseline.mjs';
const dir='docs/grade2-level3-expansion-proposal-2026-10-19/';
const proposal=JSON.parse(fs.readFileSync(dir+'proposal.json','utf8'));
const audit=JSON.parse(fs.readFileSync('docs/grade2-level3-check-2026-10-19/review.json','utf8'));
const {grade2GrammarCards}=load('src/data/grade2GrammarGuide.ts');
const cards=new Map(grade2GrammarCards.map(c=>[c.id,c]));
const details={
 'past-sequence':['先に終わった出来事と、後から起きた出来事を分けます。hadは主語によらず同じ形で、後ろは過去分詞です。','whenの節を過去形、先に完了した主節を過去完了にしています。順序が文脈で明らかなら単純過去でも伝わる場合があり、二つの過去なら必ず過去完了という規則ではありません。'],
 'past-experience':['過去の基準時点までに一度も経験がなかったことをhad neverで表します。今までの経験を表すhave neverとは基準時点が違います。','beforeの後ろは主語と過去形の動詞がある節です。neverはhadと過去分詞の間に置きます。beforeだけで前後関係が伝わる場合もありますが、ここでは過去完了の経験用法を練習します。'],
 'present-perfect-progressive':['過去に始めて今まで続けている動作を、have/has beenと動詞のing形で表します。三人称単数の主語ではhasです。','forは期間、sinceは開始した時点です。have been lookingとhave lookedのように両方使える場面もあります。ここでは継続中の活動に注目し、状態を表す動詞まで一律に進行形にはしません。'],
 'future-perfect':['未来のある期限までには終わっていることを、will haveと過去分詞で表します。期限そのものに作業を始める、という意味ではありません。','by Fridayは金曜日までに、という期限です。will finishでも文脈によって同じ予定を伝えられます。ここでは未来の時点から完了を見渡す形を練習します。'],
 'second-conditional':['現在の事実とは違うことを想像するとき、条件節を過去形、結果をwouldと動詞原形で表します。この過去形は、過去の出来事を述べるためのものではありません。','If rent were lowerのwereは仮定法の形です。口語でwasが使われることもあります。実現しうる未来のIf it rains ...とは、状況の捉え方が違います。'],
 'third-conditional':['すでに起きた過去とは別の条件と結果を想像します。条件節はhadと過去分詞、結果はwould haveと過去分詞です。','実際の過去を変えることはできません。「早く出発していたら間に合っただろう」のように、起きなかった別の展開を述べます。現在の仮定とは動詞の形を区別しましょう。'],
 'wish-present':['現在の事実に反する願いには、wishの後ろに過去形やcouldを使います。現在の願望なので、過去形でも過去の出来事とは限りません。','I wish I could afford ...は、今はその余裕がないという願いです。実現を期待している出来事をhopeで述べる場合とは分けて考えます。'],
 'wish-past':['過去にしなかったことを後悔するとき、wishの後ろをhadと過去分詞にします。現在への願いで使う単純な過去形と区別します。','I wish we had asked ...では、実際にはその時に助言を求めませんでした。後悔する気持ちは現在、変えたい出来事は過去、という二つの時点を整理します。'],
 'must-perfect':['must haveと過去分詞は、過去について「きっと〜したに違いない」という強い推量です。過去の義務を表すhad toとは違います。','推量は話し手の判断であり、出来事が証明されたという意味ではありません。must have receivedなら「受け取ったはずだ」と、完了した出来事を推測しています。'],
 'might-perfect':['might haveと過去分詞で、過去に起きた可能性を述べます。断定せず「〜したかもしれない」と伝えます。','may haveもこの意味で自然です。mayとmightの確率を固定の数値で区別しません。間違った住所へ送ったかもしれないという推測と、送るべきだったという後悔は別です。'],
 'should-perfect':['should haveと過去分詞で、過去にするべきだったのにしなかったことを振り返れます。今回の例文はこの後悔の意味です。','should haveは文脈により「もう到着しているはずだ」のような予想にもなります。形だけで常に後悔と決めず、今回の訳と実際にした行動を照合しましょう。ought to haveという別表現もあります。'],
 'participle-active':['現在分詞のまとまりを名詞の後ろに置き、「〜している人・物」と説明します。説明される名詞が、その動作を行う側です。','People living near the airportはPeople who live near the airportとも言えます。livingはこの文全体の動詞ではなく、主節の動詞complainedと分けて見ます。'],
 'participle-passive':['過去分詞のまとまりを名詞の後ろに置き、「〜された物」と説明します。その名詞は動作を受ける側です。','The products made in this factoryではmade以下がproductsを説明し、are exportedが文全体の動詞です。過去分詞で修飾されていても、文全体が過去の話になるとは限りません。'],
 'participle-clause':['分詞構文では、分詞のまとまりで状況・理由などを添えます。この3例では、分詞の動作や状態の主体は主節の主語と同じです。','Walking home, I ...なら歩いているのはIです。Feeling tiredでは本人が疲れを感じ、Surprised by ...では本人が驚かされるため過去分詞です。無関係な主語を続けないようにします。接続詞を使う普通の節でも表せます。'],
 'whose':['whoseの後ろに名詞を続け、人とその人に属する物・活動との関係を表します。whoの後ろに単に所有物を足す形とは違います。','a farmer whose crops were damagedでは、作物の持ち主はfarmerですが、whose節の主語の中心は複数形cropsです。wereはfarmerではなくcropsに合わせています。'],
 'where-when':['場所を説明するwhere、時を説明するwhenの後ろには、通常の主語と動詞の順で節を続けます。前の名詞と後ろの節のつながりを確認します。','the center where volunteers receive trainingでは、センターで研修を受けます。場所の名詞だから必ずwhereではなく、後ろの節で目的語が欠けるならwhichなどになる場合があります。'],
 'nonrestrictive':['すでに特定されている物について、コンマで区切ったwhichの節で補足します。どの物かを絞り込むための関係詞節とは区別します。','My bicycle, which I bought last year, needs repairs.の主節はMy bicycle needs repairs.です。途中に補足を挟んでいます。この非制限用法のwhichをthatに置き換えることはできません。'],
 'causative-base':['makeやletの後ろに人、その後ろに動詞の原形を置きます。makeは行動させる・余儀なくさせる、letは許可する意味で使っています。','The delay made us change ...では予定を変えるのはusです。make us to changeにはしません。ただし受け身でbe made to doにする場合はtoが必要で、すべての形でtoを取るわけではありません。'],
 'causative-passive':['haveの後ろに物、その後ろに過去分詞を置き、手配して作業をしてもらうことを表します。物は作業を受ける側です。','I had my bicycle repaired.では、自分で修理したとは述べていません。get my bicycle repairedも自然です。同じ形が盗難などの被害を表す場合もありますが、今回の例は依頼・手配の意味です。'],
 'perfect-passive':['have/has beenと過去分詞を組み合わせ、何かがされた完了・現在の結果を伝えます。have/hasは主語に合わせます。','The deadline has been extendedでは延長が済み、その結果が今に関わります。All the applications have been checkedでは主語が複数なのでhaveです。動作途中のis being checkedとは区別します。'],
 'progressive-passive':['be beingと過去分詞で、何かが今まさに作業されている途中だと伝えます。主語に合わせてis/areを使います。','The bridge is being inspected.では点検の途中です。has been inspectedなら点検の完了が今に関わります。beingとbeenの綴り・役割の違いも確かめましょう。'],
 'remember':['remember to doは忘れずに行動すること、remember doingは行動したことの記憶です。行動と覚えている時点の順序が異なります。','She remembered to renew ...は、実際に忘れず更新したという過去の話です。rememberedが過去形だから後ろも必ずing、とはなりません。いつ覚えていて、いつ行動したかを見ます。'],
 'stop':['stop doingはその動作をやめること。stop to doは別の動作をするため、それまでの活動を止めることです。','We stopped to check ...は確認するため立ち止まったのであって、確認をやめたのではありません。to以下は目的を添える不定詞です。stop to doは歩いている場面だけに限りません。'],
 'correlative-comparison':['theと比較級のまとまりを二つ対応させ、「〜すればするほど、ますます…」と二つの変化の関連を示します。','less wasteのwasteは量、fewer seats/mistakesは数えられる複数名詞です。carefullyの比較級はmore carefully。二つのtheを、単に名詞に付く定冠詞と同じ働きだとは考えないようにします。'],
};
const shortOverrides={
 'I have two reasons for this.':['理由を名詞で示す','have + 数 + reasons for + 名詞','for thisで何についての理由かを名詞句で示します。becauseの節は使っていません。'],
 'I have two reasons why I think so.':['理由を説明するwhy節','reasons why + 主語 + 動詞','why I think soがreasonsの内容を後ろから説明します。whyの後ろは疑問文の語順にしません。'],
 'I prefer learning with friends.':['preferと動名詞','prefer + 動詞-ing','learning with friendsが好みの対象です。この文には比較相手は明示されていません。'],
 'The most important thing is to keep trying.':['補語になる不定詞・keepと動名詞','The most important thing is to + 動詞 / keep + 動詞-ing','to keep tryingは大切なことの中身を示す補語。keepの後ろではtryingと動名詞を使います。'],
 'More and more people work from home.':['比較級の反復と複数主語','more and more + 複数名詞 + 動詞','人数の増加をmore and more peopleで表し、peopleを主語にworkを続けます。主語はnumberではありません。'],
 'More and more people are concerned about privacy.':['増える人数と状態','more and more people + are concerned about + 名詞','more and moreで人数の増加、are concerned aboutで気にかけている状態を伝えます。'],
 'These days, many people shop online.':['近ごろの習慣と現在形','These days, 主語 + 現在形','近ごろの習慣をshopという現在形で表しています。時代の傾向だから必ず進行形になるわけではありません。'],
 'The town is becoming more popular.':['変化を表す進行形','主語 + be becoming + 比較級','is becomingで変化の途中を、more popularで人気の高まりを表します。'],
 'This means that more people can use the service.':['意味する内容をthat節で示す','主語 + mean that + 文','that以下がmeansの目的語として、何を意味するのかを説明します。Thereforeを使った文ではありません。'],
 'Can you tell me how to apply for the program?':['疑問詞と不定詞','tell + 人 + how to + 動詞の原形','how to applyが応募の仕方を表します。疑問詞の後ろに主語と動詞を続ける間接疑問の節とは形が違います。'],
};
const point=(label,pattern,note)=>({label,pattern,note});
const oldPoints={};
for(const r of audit.rows){
 const c=cards.get(r.cardId),t=r.question.text;assert.ok(c);
 let p=point(c.term,c.pattern,c.tip);
 if(shortOverrides[t])p=point(...shortOverrides[t]);
 else if(r.cardId==='opinion')p=point('意見を示す前置き・内容節',t.startsWith('In my opinion')?'In my opinion, 主語 + 動詞':t.startsWith('I believe')?'I believe that + 文':'I think that + 文',t.startsWith('In my opinion')?'前置詞句で自分の意見だと前置きし、後ろに意見の文を置きます。':'that以下が思う・信じる内容です。thatはここでは省略せず書いています。');
 else if(r.cardId==='reason-content')p=point('理由の内容をthat節で示す','理由を表す主語 + is that + 文','isの後ろのthat節が理由の中身です。becauseを直接続ける型とは区別します。');
 else if(r.cardId==='agreement')p=point('賛否とその内容',t.startsWith('I agree')?'agree that + 文':t.includes('idea of')?'disagree with the idea of + 動名詞':'disagree with the idea that + 文',t.startsWith('I agree')?'that節に賛成する内容を続けます。':t.includes('idea of')?'withの後ろに反対する意見、ofの後ろに動名詞を置きます。':'withの後ろに反対する意見を置き、that節でその内容を示します。');
 else if(r.cardId==='order')p=point('順序を示す前置き',t.split(',')[0]+', 主語 + 動詞','文頭の表現で話の順序を示し、コンマの後ろに理由や判断を続けます。前後の理由とつなげて使います。');
 else if(r.cardId==='addition')p=point('情報を追加する前置き',t.split(',')[0]+', 主語 + 動詞','文頭の表現は情報を加える合図です。後ろの文に、追加する行動・理由・結果を述べます。');
 else if(r.cardId==='example')p=point('具体例を示す',t.startsWith('For example')?'For example, 主語 + 動詞':'名詞 + such as + 具体例の名詞','For exampleは文全体への前置き、such asの後ろには具体例の名詞を続けます。この文でどちらを使っているかを確かめます。');
 else if(r.cardId==='result')p=point('出来事の結果・判断',t.includes('as a result,')?'文; as a result, 文':t.startsWith('Therefore')?'Therefore, 主語 + 動詞':'As a result, 主語 + 動詞',t.startsWith('Therefore')?'根拠から導いた判断・行動をThereforeで示します。':'出来事から生じた結果をas a resultで示します。');
 else if(r.cardId==='conclusion')p=point('結論・理由を受けた判断',t.startsWith('That is why')?'That is why + 主語 + 動詞':t.startsWith('For these')?'For these two reasons, 主語 + 動詞':'In conclusion, 主語 + 動詞',t.startsWith('That is why')?'why節で、前に述べた事情から導かれる結果・判断を示します。':'前に述べた内容を受け、結論となる判断を続けます。');
 else if(r.cardId==='contrast-clause')p=point('譲歩・対比の節',t.startsWith('Although')?'Although + 文, 文':t.startsWith('While')?'While + 文, 文':t.includes(', while')?'Some + 名詞 + 動詞, while others + 動詞':'Some + 名詞 + 動詞, and others + 動詞',t.startsWith('Although')||t.startsWith('While')?'前半で認めた面に対して、後半で別の面を示します。前半も主語と動詞を持つ節です。':'someとothersで二つの集団を比べます。othersの後ろにも動詞を置きます。');
 else if(r.cardId==='contrast-link')p=point('文をつなぐ逆接の副詞','However, 主語 + 動詞','Howeverは前の話と異なる面を導く副詞です。コンマの後ろに独立した文を続けます。');
 else if(r.cardId==='it-to')p=point('形式主語と不定詞',t.includes('for us')||t.includes('for children')?'It is + 形容詞 + for 人 + to 動詞':'It is + 形容詞 + to 動詞',t.includes('for us')||t.includes('for children')?'itは仮の主語、to以下が行為の内容。forの後ろはその行為を行う人です。':'itは仮の主語で、後ろのto以下が評価される行為の内容です。この文では行為を行う人をforで明示していません。');
 else if(r.cardId==='gerund')p=point('動詞の後ろの動名詞',t.includes('enjoys')?'enjoy + 動詞-ing':'avoid + 動詞-ing','enjoyやavoidの対象となる活動は、動詞のing形で続けます。前の動詞に合わせた形を選びます。');
 else if(r.cardId==='condition')p=point('条件の節',t.startsWith('Unless')?'Unless + 現在形の文, 主節':'If + 現在形の文, 主節',t.startsWith('Unless')?'unlessで「もし〜しなければ」。未来の条件もこの節の中では現在形を使います。':'if節が条件、後半が行動・結果です。未来に起こりうる条件では、if節の中を通常は現在形にします。');
 else if(r.cardId==='comparison')p=point('比較する形',t.includes('as wide as')?'as + 形容詞の原級 + as':t.includes('less energy')?'less + 不可算名詞 + than':'more + 形容詞 + than',t.includes('as wide as')?'wideを二つのasではさみ、同じ幅だと比べます。oneはbridgeの繰り返しを避ける代名詞です。':'何と何を比べるかをthanで示します。lessは量の少なさ、moreは程度が上であることを表します。');
 else if(r.cardId==='passive')p=point('受け身',t.includes('will be')?'will be + 過去分詞':t.includes('made from')?'be made from + 材料':'was/were + 過去分詞','主語は行為を受ける側です。未来ではwill be、過去ではwas/wereを使います。made fromのfromは材料を示します。');
 oldPoints[t]=p;
}
const additions=proposal.rows.map(r=>({band:r.band,topic:r.targetId,question:{text:r.text,translation:r.meaning,grammarPoint:point(r.title,r.pattern,details[r.targetId][0])}}));
const newCards=[...new Set(proposal.rows.map(r=>r.targetId))].map(id=>{
 const rs=proposal.rows.filter(r=>r.targetId===id),r=rs[0];
 return {id:'exp-'+id,section:['tense','conditional','modal','comparison'].includes(r.group)?2:1,title:r.title,subtitle:r.kind==='bridge'?'準2級で学んだ形を別の場面で使う':'基本の形から組み合わせへ',term:r.title,pattern:r.pattern,examples:rs.slice(0,2).map(r=>[r.text,r.meaning]),tip:details[id][0],more:details[id][1]};
});
const assignments=Object.fromEntries(proposal.rows.map(r=>[r.text,'exp-'+r.targetId]));
const prompts=JSON.parse(fs.readFileSync('src/data/translationBattlePrompts.json','utf8'));
assert.ok(!prompts.some(e=>e.course==='Eiken2'&&proposal.rows.some(r=>r.text===e.text)),'One-time apply; do not overwrite a later review');
const revisions={
 'Can you tell me how to apply for the program?':{formNote:'応募の仕方を、疑問詞に不定詞を続ける形で尋ねます。'},
 'I have two reasons for this.':{formNote:'理由が二つあると述べ、何についての理由かを前置詞に名詞を続けて示します。'},
 'I have two reasons why I think so.':{formNote:'理由を表す名詞の後ろに、自分がそう考える理由を関係副詞の節で添えます。'},
 'The book that you recommended was useful.':{formNote:'目的格の関係代名詞を省略しない形を練習します。下の別表現も自然ですが、今回はそれ以外の関係代名詞を使います。'},
 'The new bridge is as wide as the old one.':{formNote:'形容詞による同等比較を練習します。古い橋は、同じ名詞の繰り返しを避ける代名詞で表します。'},
 'Although the plan is expensive, it may save energy.':{formNote:'譲歩の節を先に置きます。下の別表現も自然ですが、今回はそれ以外の接続詞を練習します。'},
 'Although the device is expensive, it uses less electricity.':{formNote:'譲歩の節を先に置きます。下の別表現も自然ですが、今回はそれ以外の接続詞を練習します。'},
 'If the city improves the buses, fewer people may drive.':{meaning:'市がバスを改善すれば、車を運転する人が減るかもしれません。',formNote:'条件節を先に置き、運転する人の数が減る可能性を述べます。'},
};
const alternatives={
 'The book that you recommended was useful.':[['The book which you recommended was useful.','whichも自然な目的格の関係代名詞です。'],['The book you recommended was useful.','目的格の関係代名詞を省略する形も自然です。']],
 'Although the plan is expensive, it may save energy.':[['Though the plan is expensive, it may save energy.','thoughも自然な譲歩の接続詞です。'],['While the plan is expensive, it may save energy.','whileもここでは譲歩を示せます。']],
 'Although the device is expensive, it uses less electricity.':[['Though the device is expensive, it uses less electricity.','thoughも自然な譲歩の接続詞です。'],['While the device is expensive, it uses less electricity.','whileもここでは譲歩を示せます。']],
};
const changed=[];
for(const [text,patch]of Object.entries(revisions)){
 const q=audit.rows.find(r=>r.question.text===text).question;
 let e=prompts.find(e=>e.course==='Eiken2'&&e.level===3&&e.text===text&&e.translation===q.translation);
 if(!e){e={course:'Eiken2',level:3,text,translation:q.translation,previousMeaning:getPriorMeaning(q,'Eiken2'),meaning:audit.rows.find(r=>r.question.text===text).meaning,formNote:'',alternatives:[],contrasts:[],reason:'学習対象の構文と自然な別表現の扱いを明確にする。'};prompts.push(e);}
 const before=JSON.parse(JSON.stringify(e));Object.assign(e,patch);
 if(alternatives[text])e.alternatives=alternatives[text].map(([text,note])=>({text,note}));
 changed.push({text,before,after:JSON.parse(JSON.stringify(e))});
}
for(const r of proposal.rows){
 let formNote=r.formNote,alts=[];
 if(r.targetId==='might-perfect'){formNote+=' 下の別表現も自然ですが、今回はそれ以外の助動詞を使います。';alts=[[r.text.replace(' might have ',' may have '),'過去の可能性を表す自然な別表現']];}
 if(r.targetId==='should-perfect'){formNote+=' 下の別表現も自然ですが、今回はそれ以外の助動詞を使います。';alts=[[r.text.replace(' should have ',' ought to have '),'過去への後悔を表す自然な別表現']];}
 if(r.targetId==='causative-passive'){formNote+=' 下の別表現も自然ですが、今回はそれ以外の動詞で練習します。';alts=[[r.text.replace(' had ',' got '),'get + 物 + 過去分詞も手配を表せます。']];}
 prompts.push({course:'Eiken2',level:3,text:r.text,translation:r.meaning,previousMeaning:r.meaning,meaning:r.meaning,formNote,alternatives:alts.map(([text,note])=>({text,note})),contrasts:[],reason:'文法の練習対象と場面を日本語で補足する。'});
}
for(const [path,data]of [
 ['src/data/questionSets/eiken/grade2GrammarExpansion.json',additions],
 ['src/data/grade2GrammarPointOverrides.json',oldPoints],
 ['src/data/grade2GrammarExpansionCards.json',newCards],
 ['src/data/grade2GrammarExpansionAssignments.json',assignments],
 ['src/data/translationBattlePrompts.json',prompts],
 [dir+'release.json',{status:'implemented-local',retained:94,added:72,total:166,removed:0,changedPrompts:changed,grammarPointOverrides:94,addedCards:24,baselineCommit:proposal.baselineCommit}],
])fs.writeFileSync(path,JSON.stringify(data,null,2)+'\n');
console.log('Prepared approved 72 additions, 94 precise short annotations, 24 guides, 8 prompt revisions. No original question identities changed.');
