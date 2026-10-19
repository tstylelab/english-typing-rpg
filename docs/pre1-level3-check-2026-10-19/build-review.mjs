import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {load} from '../../scripts/lib/load-typescript-data.mjs';
const {QUESTIONS}=load('src/data/questions.ts');
const {grammarGuides,getGrammarCard}=load('src/data/grammarGuides.ts');
const {getQuestionGrammarPoint}=load('src/data/questionGrammarPoints.ts');
const {getQuestionMeaning}=load('src/data/questionMeaning.ts');
const {getTranslationBattlePrompt}=load('src/data/translationBattlePrompts.ts');
const fragments=new Set(['If I understand you correctly.','To put it simply.','To put it another way.','When you put it that way.','If you ask me.','From what I can tell.','The way I see it.']);
const issues={
 'If I understand you correctly.':'条件の前置きだけで止まっています。会話の断片としては使えますが、文法練習では確認する内容まで続ける例も必要です。',
 'To put it simply.':'説明の前置きのみです。不定詞の前置きと、後ろに続く説明の文を一緒に組み立てる練習を補いたい箇所です。',
 'To put it another way.':'言い換えの前置きのみです。慣用句として残す価値はありますが、これだけで説明する文法の練習を済ませたとは扱いません。',
 'When you put it that way.':'会話で反応を含ませられる断片です。標準的な完全文では何を主節に続けるかまで練習するとよい箇所です。',
 'If you ask me.':'意見の前置きのみです。現在の短い返答は残しつつ、自分の判断を続ける完全文を補うことを勧めます。',
 'From what I can tell.':'判断の根拠を限定する前置きのみです。what節の中身だけでなく、そこから導く判断まで続ける形を練習したい箇所です。',
 'The way I see it.':'見方の前置きのみです。「私が思うには」だけでは複数の定型表現が自然に成立します。文法対象と場面を補う方針です。',
 "I'm not sure I'm with you there.":'同意しきれない意味にも、説明についていけない意味にもなります。詳しいカードは両方に言及しています。意図する場面を出題側にも添えたい例です。',
 'That works for me.':'予定が都合よい、条件を受け入れられる、など場面で意味が変わります。現在の和訳は改善済みですが、自然な英訳が一通りになるわけではありません。',
 "I'm not fully convinced.":'完全には納得していないという意味には、他の副詞やnot entirely sureなども成立します。語調の違いを絶対的な境界として教えず、練習する構文と別表現を整理したい例です。',
 "I'm on the fence about it.":'慣用表現として有用ですが、和訳からはundecidedなども自然です。慣用句の復習と、その級の文法を組み立てる問題を分けて増やす方針です。',
 'Sounds about right.':'主語を省く自然な会話の返答です。誤文として削除する必要はありません。省略を説明し、主語を明示した形も別の例で確かめたい箇所です。',
};
// Planned counts are three contexts per narrow target. Only the one sample
// below each target is drafted here; this is not a 96-question finished corpus.
const plans={
 EikenPre1Part1:[
  ['名詞節・関係詞','what節を主語にする','What matters most is how the funds are used.','最も大切なのは、その資金がどのように使われるかです。','何が大切かを表す節を主語にし、使途を疑問詞の節で続けます。'],
  ['名詞節・関係詞','whateverで選択の範囲を広げる','Whatever we decide will affect local families.','私たちが何を決めても、地元の家族に影響します。','選択する内容全体を、複合関係代名詞の節を主語にして表します。'],
  ['名詞節・関係詞','非制限用法で補足する','The new clinic, which opens in June, needs staff.','その新しい診療所は職員を必要としています。ちなみに、6月に開業します。','すでに特定した診療所を、コンマで区切る関係代名詞の節で補足します。'],
  ['名詞節・関係詞','前置詞と関係代名詞','The method by which we collect data has changed.','私たちがデータを集める方法は変わりました。','手段を表す前置詞を、関係代名詞の直前に置く形で練習します。'],
  ['分詞・省略','完了分詞構文','Having read the report, I revised my proposal.','その報告書を読んだ後で、私は自分の提案を修正しました。','先に済んだ行動を完了形の分詞構文で文頭に置きます。二つの行動の主体は私です。','発展'],
  ['分詞・省略','受け身の分詞構文','Asked about the cost, she gave a clear answer.','費用について尋ねられ、彼女は明確に答えました。','文頭を受け身の意味の分詞構文にします。尋ねられた人が主節の主語です。'],
  ['分詞・省略','接続詞と省略された主語','While reviewing the budget, we found an error.','予算を見直している間に、私たちは誤りを見つけました。','同じ主体が行う二つのことです。時を表す接続詞の後ろで主語と動詞の一部を省く形を練習します。'],
  ['時制・助動詞','過去完了進行形','They had been working for hours when I arrived.','私が着いたとき、彼らはすでに何時間も働き続けていました。','過去の基準時点まで続いていた動作を過去完了進行形で表します。'],
  ['時制・助動詞','過去についての否定の推量','She cannot have approved such a risky plan.','彼女がそんな危険な計画を承認したはずがありません。','過去にしたはずがないという強い否定の推量を、助動詞と完了形で表します。'],
  ['時制・助動詞','助動詞と完了受け身','The file may have been deleted by mistake.','そのファイルは誤って削除されたのかもしれません。','過去についての推量と受け身を組み合わせます。別の自然な推量の助動詞も成立します。'],
  ['仮定・条件','過去の仮定と現在の結果','If I had accepted the offer, I would work here now.','もしその申し出を受けていたら、私は今ここで働いているでしょう。','条件は実際と違う過去、結果は現在です。条件節を先に置き、時点を使い分けます。'],
  ['仮定・条件','助けがなかった場合を仮定する','But for your advice, I would have signed it.','あなたの助言がなかったら、私はそれに署名してしまっていたでしょう。','もし〜がなかったらという前置詞句を文頭に置き、過去の反実仮想を続けます。'],
  ['形式構文・受け身','形式目的語と不定詞','We found it difficult to obtain reliable data.','私たちは、信頼できるデータを入手するのが難しいと分かりました。','仮の目的語を置き、後ろの不定詞で何が難しいかを示します。'],
  ['形式構文・受け身','伝達の受け身と完了不定詞','The building is believed to have housed a school.','その建物には、かつて学校が入っていたと考えられています。','建物を主語にした伝達の受け身です。過去の内容を完了不定詞で続けます。','発展'],
  ['否定・倒置','否定の時表現を文頭に置く','Not until Monday did we receive the results.','月曜日になって初めて、私たちは結果を受け取りました。','否定を含む時の表現を文頭に置き、主節を倒置する形で練習します。','発展'],
  ['否定・倒置','限定する節と倒置','Only when costs rose did they change the plan.','費用が上がって初めて、彼らは計画を変更しました。','時の節全体を文頭で限定し、主節の助動詞と主語を倒置します。','発展'],
 ],
 EikenPre1Part2:[
  ['譲歩・条件','たとえ〜でもという条件','Even if costs rise, we will continue the project.','たとえ費用が上がっても、私たちはその事業を続けます。','事実だとは断定しない譲歩の条件を先に置きます。'],
  ['譲歩・条件','条件を明示する接続表現','We can proceed provided that everyone agrees.','全員が同意するという条件なら、私たちは先に進めます。','主節を先に置き、後ろに条件を明示する接続表現の節を続けます。'],
  ['譲歩・条件','満たすべき条件の範囲','You may use the room as long as you leave it clean.','使った後きれいな状態にしておくなら、その部屋を使って構いません。','許可を先に述べ、条件を続けます。期間の長さを述べる用法とは区別します。'],
  ['対比・否定の範囲','すべてではないという部分否定','Not all residents support the new policy.','住民全員がその新しい方針を支持しているわけではありません。','全員が支持しないという全面否定ではなく、全員ではないと表します。'],
  ['対比・否定の範囲','必然的なつながりの否定','Higher fees do not necessarily mean better service.','料金が高いことは、必ずしもサービスの良さを意味しません。','二つのことが必ず結び付くとは限らない、という部分否定で表します。'],
  ['対比・否定の範囲','二つの内容を対比する','The issue is not the price but the quality.','問題は価格ではなく品質です。','問題となる二つの名詞句を、否定と対比の組でつなぎます。'],
  ['理由・結果','状況が変わったことを理由にする','Now that the road is open, traffic is improving.','その道路が開通した今では、交通状況が改善しています。','新しく成立した状況を理由にする節を先に置きます。'],
  ['理由・結果','程度と結果を節でつなぐ','The rent was so high that we had to move.','家賃があまりにも高かったので、私たちは引っ越さなければなりませんでした。','形容詞の程度を強め、その結果を接続詞の節で続けます。'],
  ['理由・結果','名詞句の程度と結果','It was such a useful course that I recommended it.','それはとても役立つ講座だったので、私は人に勧めました。','冠詞・形容詞・名詞を含むまとまりの程度を強め、その結果を節で続けます。'],
  ['発言・提案','提案を表す動詞と節','The doctor suggested that he rest for a week.','医師は、彼が1週間休むことを提案しました。','提案の内容を節で続け、その節では主語が三人称単数でも動詞を原形にする形で練習します。','発展'],
  ['発言・提案','必要性を表す節','It is essential that every member be informed.','すべてのメンバーに知らせることが不可欠です。','必要性を述べる節の中で、原形を用いる受け身を練習します。','発展'],
  ['発言・提案','過去の疑問を伝える','She asked whether we had received the payment.','彼女は、私たちがその支払いを受け取っていたかどうか尋ねました。','尋ねた内容を間接疑問で伝え、受け取りがそれより前かを時制で表します。'],
  ['比較・数量','数が2倍という比較','The city has twice the number of buses it had before.','その市には、以前の2倍の数のバスがあります。','バスの数を表す名詞句を使い、以前の数との倍数比較をします。','発展'],
  ['比較・数量','程度の倍数比較','This method is more than twice as efficient.','この方法は、比べている方法の2倍を超える効率です。','同等比較の形を使い、効率の倍率が2倍を上回ると表します。比較相手は場面で明示します。'],
  ['過去の行動への評価','過去にすべきだったこと','We should have consulted local residents first.','私たちはまず地元の住民に相談しておくべきでした。','実際はしなかった行動への後悔を、助動詞と完了形で表します。'],
  ['過去の行動への評価','したが必要なかったこと','You need not have printed all the documents.','あなたは書類を全部印刷する必要はなかったのに、実際には印刷してしまいました。','必要がなかった行動を実際にはした、という意味を助動詞と完了形で表します。','発展'],
 ],
};
const report={date:'2026-10-19',status:'inspection-and-allocation-proposal-only',proposedAdds:96,proposedSampleCount:32,proposedNewTotal:246,sources:[['英検公式：準1級の水準','https://www.eiken.or.jp/eiken/exam/grade_p1/'],['英検公式：2026年度第2回問題','https://www.eiken.or.jp/eiken/exam/kakomon/2026-2-1ji_p1kyu.pdf'],['英検公式：2026年度第1回問題','https://www.eiken.or.jp/eiken/exam/kakomon/2026-1-1ji-p1kyu.pdf'],['British Council：伝達の受け身','https://learnenglish.britishcouncil.org/free-resources/grammar/c1/advanced-passives-review'],['British Council：否定語句と倒置','https://learnenglish.britishcouncil.org/free-resources/grammar/c1/inversion-after-negative-adverbials']],courses:[]};
for(const course of ['EikenPre1Part1','EikenPre1Part2']){
 const rows=QUESTIONS[course][3].map((q,i)=>{const card=getGrammarCard(course,3,q),prompt=getTranslationBattlePrompt(q,course,3);return{number:i+1,question:q,meaning:getQuestionMeaning(q,course),cardId:card?.id,cardTitle:card?.title,point:getQuestionGrammarPoint(course,3,q),formNote:prompt?.formNote??'',alternatives:prompt?.alternatives??[],issue:issues[q.text]??'',fragment:fragments.has(q.text)};});
 const proposed=plans[course].map(([group,target,text,meaning,formNote,priority='優先'])=>({group,target,text,meaning,formNote,priority,count:3}));
 assert.equal(rows.length,75);assert.ok(rows.every(r=>r.cardId));assert.equal(rows.filter(r=>r.point).length,0);
 assert.equal(proposed.length,16);assert.equal(proposed.reduce((n,r)=>n+r.count,0),48);
 assert.equal(proposed.filter(r=>r.priority==='発展').length,4);
 report.courses.push({course,title:grammarGuides[course].grade,total:75,linked:rows.filter(r=>r.cardId).length,shortNotes:0,cards:grammarGuides[course].cards.length,shortFiveWords:rows.filter(r=>r.question.text.split(/\s+/).length<=5).length,fragments:rows.filter(r=>r.fragment).length,averageLength:rows.reduce((n,r)=>n+r.question.text.length,0)/rows.length,counts:Object.fromEntries([...new Set(rows.map(r=>r.cardId))].map(id=>[id,rows.filter(r=>r.cardId===id).length])),groups:[...new Set(proposed.map(r=>r.group))].map(group=>({group,count:proposed.filter(r=>r.group===group).reduce((n,r)=>n+r.count,0)})),rows,proposed});
}
assert.equal(report.courses.flatMap(c=>c.rows).filter(r=>r.issue).length,12);
const sha=s=>createHash('sha256').update(s).digest('hex');
report.sourceHashes=Object.fromEntries(['src/App.tsx','src/data/questionSets/eiken/gradepre1-part1.json','src/data/questionSets/eiken/gradepre1-part2.json','src/data/translationBattlePrompts.json','src/data/pre1GrammarGuide.ts','src/data/questionGrammarPoints.ts'].map(p=>[p,sha(fs.readFileSync(p))]));
const dir=import.meta.dirname;fs.writeFileSync(dir+'/review.json',JSON.stringify(report,null,2)+'\n');
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const data=JSON.stringify(report).replaceAll('<','\\u003c');
fs.writeFileSync(dir+'/index.html',`<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>準1級 Level 3：点検と追加配分案</title><style>*{box-sizing:border-box}body{margin:0;background:#0a1824;color:#e6eff5;font:16px/1.7 system-ui,"Yu Gothic",sans-serif}main{max-width:1100px;margin:auto;padding:20px 16px}h1{font-size:clamp(23px,4vw,32px);color:#ffdc95}h2{font-size:21px}h3{font-size:18px}article,.panel{background:#152e3d;border:1px solid #486e81;border-radius:10px;padding:16px;margin:12px 0}a{color:#9ee3ef}nav{display:flex;flex-wrap:wrap;gap:8px;background:#0a1824f5;position:sticky;top:0;z-index:2;padding:10px 0}select,input{font:inherit;max-width:100%;min-height:44px;background:#193b4c;color:inherit;border:1px solid #6b9bb1;border-radius:6px;padding:8px}input[type=checkbox]{min-height:auto}label{display:flex;align-items:center;gap:6px}p{margin:6px 0}.en{font-size:21px;font-weight:650;overflow-wrap:anywhere}.ja{font-size:18px}.hint{color:#a4e3d6}.warn{color:#ffda91}small{color:#b7cfdb}.hidden .answer{display:none}li{margin:6px 0}.table{overflow:auto}table{width:100%;border-collapse:collapse;min-width:460px}td,th{padding:9px;text-align:left;border-bottom:1px solid #456a80}summary{cursor:pointer}</style><main><h1>準1級①・② Level 3：内容点検と追加配分案</h1><p>全150問を点検／①75問・②75問／本体への新しい変更はありません。</p><section class="panel"><h2>総評</h2><p><strong>会話で判断・留保・共感を伝える練習として有用です。その級の文法を幅広く組み立てるLevel 3としては補強を勧めます。</strong></p><ul><li>5語以下は①34/75問、②37/75問。平均文字数は①27.7、②28.6文字です。短いこと自体が問題ではなく、相づち・定型的な返答に構成が寄っている点を改善したい教材です。</li><li>詳しい文法解説への対応は①75/75、②75/75。リンク欠落はありません。一方、結果画面などで使う<strong>短い文法注釈は両方0/75</strong>です。解説そのものがない、という意味とは区別します。</li><li>現在の主分類で、①は過去完了1問、現在完了の変化1問・経験1問、助動詞＋完了形1問。②は仮定の形1問、目的格関係節1問があります。単に文法が一切ないという内容ではありません。</li><li>①の前置きだけの7問は、後ろに内容を続ける練習も補いたい箇所です。会話で自然な断片を、誤文として一律に削除する提案ではありません。</li><li>助動詞の後ろにhaveがあっても、You may have a point.は現在の「一理ある」という意味で、過去の推量には数えません。I'd have to think ...も助動詞＋完了形ではありません。</li><li>英検公式は準1級をおよそ大学中級程度としています。今回の提案は公式の必須文法一覧ではなく、試験の実例と本サイトの文法練習の目的を合わせて考えたものです。</li></ul></section><section class="panel"><h2>何を、どれくらい追加するか</h2><p><strong>①48問＋②48問＝96問追加、全体150→246問</strong>という配分案です。各コース16の型×3文脈。まず優先36問ずつ、発展12問ずつに分けます。既存問の保存ID・学習/撃破記録を保つ前提で、現在の150問は削除しない案です。</p><p>今回は各型の例文を1本ずつ、計32本作成しました。<strong>追加96問すべての原稿が完成したという意味ではありません。</strong>採用時に各型へさらに2文脈を用意し、和訳条件・別表現・解説・入力負担を照合します。</p><p>2級で学んだ構文も別の文脈で使い直します。全項目が準1級で初めて登場する形、という扱いにはしません。倒置・完了分詞構文・伝達受け身の発展形などは、最初から全員に要求する必須項目とはせず後半に置く方針です。</p>${report.courses.map(c=>'<h3>'+e(c.title)+'：75→123問</h3><div class="table"><table><thead><tr><th>分野</th><th>追加数</th></tr></thead><tbody>'+c.groups.map(g=>'<tr><td>'+e(g.group)+'</td><td>'+g.count+'問</td></tr>').join('')+'</tbody></table></div>').join('')}<p>既存の短い会話表現は復習として活かし、追加文では何を判断・説明しているかが分かる内容を持たせます。長文読解や難語の暗記を目的にせず、中心の構文を一つずつ練習します。</p></section><section class="panel"><h2>和訳バトルと解説の整備</h2><p>和訳だけから全ての語句を一意に決められるとは扱いません。特に助動詞、接続表現、会話の返答には自然な別解が残ります。文法の条件・場面・比較表現を整え、語義の違いをでっち上げて絞り込みません。</p><p>実装するなら、既存150問と新規問題の短い注釈を個別に用意し、詳細解説の対応も全件確認します。新規の型に既存の解説が合わなければ追加します。難易度の再計算と保存互換性の検証も実装時に行います。</p></section><nav><select id="course" aria-label="コース"><option value="all">準1級①・②</option><option value="EikenPre1Part1">準1級①</option><option value="EikenPre1Part2">準1級②</option></select><select id="view" aria-label="表示内容"><option value="candidate">改善箇所の具体例12問</option><option value="all">現行150問</option><option value="proposal">追加配分・例文32本</option></select><input id="search" type="search" aria-label="検索" placeholder="英文・和訳・文法で検索"><label><input id="hide" type="checkbox">英文を隠す</label></nav><p id="count" aria-live="polite"></p><section id="rows"></section><details class="panel"><summary>主分類別の現行問題数</summary>${report.courses.map(c=>'<h3>'+e(c.title)+'</h3>'+Object.entries(c.counts).map(([id,n])=>'<p>'+e(id)+'：'+n+'問</p>').join('')).join('')}</details><details class="panel"><summary>参照資料</summary><p>公式問題は水準比較に参照し、提案例文へ転載していません。上級文法の資料全体を準1級の必須範囲とみなすものではありません。</p>${report.sources.map(([t,u])=>'<p><a target="_blank" rel="noopener" href="'+u+'">'+e(t)+'</a></p>').join('')}</details></main><script>const d=${data},$=s=>document.querySelector(s),e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const p=new URLSearchParams(location.search);for(const id of ['course','view'])if([...$('#'+id).options].some(o=>o.value===p.get(id)))$('#'+id).value=p.get(id);$('#search').value=p.get('q')||'';$('#hide').checked=p.get('hide')==='1';function draw(){const courses=d.courses.filter(c=>$('#course').value==='all'||c.course===$('#course').value),proposal=$('#view').value==='proposal',q=$('#search').value.toLowerCase();const rows=courses.flatMap(c=>(proposal?c.proposed:c.rows).filter(r=>(proposal||$('#view').value==='all'||r.issue)&&JSON.stringify(r).toLowerCase().includes(q)).map(r=>({...r,courseTitle:c.title})));$('#count').textContent=rows.length+(proposal?'本の例文を表示（追加配分は各型3問）':'問を表示');$('#rows').classList.toggle('hidden',$('#hide').checked);$('#rows').innerHTML=rows.map(r=>'<article><small>'+e(r.courseTitle)+'・'+(proposal?e(r.priority)+'・'+e(r.group)+'・計画3問':('問題'+r.number+'・解説：'+e(r.cardTitle)))+'</small>'+(proposal?'<h3>'+e(r.target)+'</h3>':'')+'<p class="en answer">'+e(proposal?r.text:r.question.text)+'</p><p class="ja">'+e(r.meaning)+'</p><p class="hint">'+(proposal?'出題補足案：':'現在の補足：')+e(r.formNote||'なし')+'</p>'+(r.issue?'<p class="warn">'+e(r.issue)+'</p>':'')+(!proposal?'<p><small>短い文法注釈：'+(r.point?e(r.point.label):'現在は登録なし。詳しい解説リンクはあります。')+'</small></p>':'')+'</article>').join('');const u=new URL(location);for(const id of ['course','view'])u.searchParams.set(id,$('#'+id).value);u.searchParams.set('q',$('#search').value);u.searchParams.set('hide',$('#hide').checked?'1':'0');history.replaceState(null,'',u);}for(const id of ['course','view','search','hide'])$('#'+id).addEventListener('input',draw);draw();</script></html>`);
console.log('Pre-1 inspection: 150 rows, 12 candidate examples, 150 links / 0 short notes; 48+48 allocation and 32 prototype sentences. Runtime unchanged.');
