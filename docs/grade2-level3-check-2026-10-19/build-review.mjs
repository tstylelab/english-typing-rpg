import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {load} from '../../scripts/lib/load-typescript-data.mjs';
const {QUESTIONS}=load('src/data/questions.ts');
const {grade2Curriculum,getGrade2CurriculumLimit}=load('src/data/questionSets/eiken/grade2.ts');
const {grade2GrammarCards:cards}=load('src/data/grade2GrammarGuide.ts');
const {getGrammarCard}=load('src/data/grammarGuides.ts');
const {getQuestionGrammarPoint}=load('src/data/questionGrammarPoints.ts');
const {getQuestionMeaning}=load('src/data/questionMeaning.ts');
const {getTranslationBattlePrompt}=load('src/data/translationBattlePrompts.ts');
const sha=value=>createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
const issues={
 'Can you tell me how to apply for the program?':{kind:'注釈・表現条件',finding:'短い説明と出題補足は「間接疑問」「疑問詞＋主語＋動詞」ですが、実際の中心はhow to applyです。詳しいwh-toカードは両者を正しく区別しています。',suggestion:'短い注釈も「疑問詞＋不定詞」に合わせる。補足は「応募の仕方を、疑問詞に不定詞を続ける形で尋ねます」などにする。'},
 'I prefer learning with friends.':{kind:'注釈',finding:'詳しいカードは動名詞ですが、短い注釈の型はI think / In my opinionです。この文のprefer＋learningの形を説明できていません。',suggestion:'「好みを表すprefer＋動名詞」とし、learningが好みの対象を表すことを説明する。'},
 'The most important thing is to keep trying.':{kind:'注釈',finding:'短い注釈は形式主語It is important for … to …ですが、この文はThe most important thingが主語で、to以下が補語です。詳しいカードは適切です。',suggestion:'「補語になる不定詞・keep＋動名詞」に合わせ、主語・is・内容を分けて説明する。'},
 'I have two reasons for this.':{kind:'注釈',finding:'短い注釈の型はbecause / because ofですが、実際はreasons for thisです。理由という意味の分類は合っても、文の形の説明が一致していません。',suggestion:'「reasons for＋名詞」で、何についての理由かを示すと説明する。'},
 'I have two reasons why I think so.':{kind:'注釈',finding:'短い注釈がbecause / because ofを説明しています。この文ではwhy以下がreasonsを後ろから説明します。',suggestion:'「reasons why＋主語＋動詞」を説明し、whyの後ろを疑問文の語順にしないことを示す。'},
 'One reason is that everyone needs a fair chance.':{kind:'注釈',finding:'短い注釈の型はbecause / because ofですが、この文の型はOne reason is that …です。詳しいreason-contentカードは適切です。',suggestion:'that以下が理由の内容となることを短い注釈にも反映する。'},
 'More and more people work from home.':{kind:'注釈',finding:'短い注釈の型はThe number of … is increasing.ですが、この文はmore and more＋複数名詞です。主語はpeopleで、一般動詞workが続きます。',suggestion:'「more and more＋複数名詞」で増える傾向を表すと説明し、主語の中心がnumberになる構文とは区別する。'},
 'This means that more people can use the service.':{kind:'注釈',finding:'短い注釈はAs a result / Thereforeの型です。結果という機能の分類だけでなく、meansの後ろのthat節を説明したい文です。',suggestion:'「mean that＋文」で意味・内容を説明する形に合わせる。'},
 'The book that you recommended was useful.':{kind:'和訳の曖昧さ',finding:'現在の補足は「目的語の関係代名詞を省略しない」。whichも自然なため、省略しないという条件だけではthatを一意に選べません。別表現欄にはwhichが表示されています。',suggestion:'別表現も正しいことと、今回どの形を練習するかを明示する。別解を受理する設計を選ぶ場合は、入力判定まで別途検証する。'},
 'Although the plan is expensive, it may save energy.':{kind:'和訳の曖昧さ',finding:'補足の「対比する」だけでは、althoughとthough・whileなどの自然な言い方を十分に絞れません。和訳の意味自体はおおむね適切です。',suggestion:'譲歩の節を先に置くなど、学習対象の構文を日本語で示す。接続詞の別表現も併せて整理する。これだけで全ての英訳が一意になるとは扱わない。'},
 'The new bridge is as wide as the old one.':{kind:'和訳の曖昧さ',finding:'「同じ幅です」「比較」という条件からは、the same width asのような名詞を使う別の型も自然です。',suggestion:'「同等比較。幅を形容詞で表し、古い橋は同じ名詞の繰り返しを避ける代名詞で」など、文法上の対象を具体化する。'},
 'If the city improves the buses, fewer people may drive.':{kind:'和訳の具体性',finding:'現在の「車に乗る人が減る」は、同乗する人とも読めます。この文のdriveは車を運転することです。',suggestion:'「市がバスを改善すれば、車を運転する人が減るかもしれません」とし、条件節を先に置く条件も維持する。'},
};
const rows=QUESTIONS.Eiken2[3].map((q,i)=>{
 const prompt=getTranslationBattlePrompt(q,'Eiken2',3),card=getGrammarCard('Eiken2',3,q);
 return {number:i+1,question:q,meaning:getQuestionMeaning(q,'Eiken2'),formNote:prompt?.formNote??'',alternatives:prompt?.alternatives??[],cardId:card?.id,cardTitle:card?.title,point:getQuestionGrammarPoint('Eiken2',3,q),band:grade2Curriculum[3].find(e=>e.question.text===q.text)?.band,issue:issues[q.text]??null};
});
assert.equal(rows.length,94);assert.equal(new Set(rows.map(r=>r.question.text)).size,94);assert.ok(rows.every(r=>r.cardId&&r.point));assert.equal(rows.filter(r=>r.issue).length,12);
// One primary card per question. These functional categories also contain grammar;
// this grouping does not imply that the questions lack grammatical content.
const writingIds=['opinion','agreement','reason-content','reasons-for-why','order','example','addition','contrast-link','result','conclusion'];
const counts=cards.map(c=>({id:c.id,title:c.title,count:rows.filter(r=>r.cardId===c.id).length}));
const writingCount=rows.filter(r=>writingIds.includes(r.cardId)).length;
assert.equal(writingCount,39);
const gaps=[
 {target:'仮定法：現実と異なる仮定',currentCount:0,priority:'優先',note:'現行のif・unlessの4問は、実際に起こりうる条件です。仮定法過去・仮定法過去完了を区別して練習する文はありません。'},
 {target:'過去完了・完了進行形',currentCount:0,priority:'優先',note:'現在完了は4問ありますが、二つの過去の前後関係や、動作の継続を完了進行形で伝える型はありません。'},
 {target:'助動詞＋完了形',currentCount:0,priority:'優先',note:'過去についての推量・後悔などを、助動詞に完了形を続けて伝える練習はありません。'},
 {target:'分詞の後置修飾・分詞構文',currentCount:0,priority:'段階を付けて補強',note:'recycled paperのように分詞が名詞の前にある語句は収録されています。ここでの0は、分詞のまとまりを名詞の後ろに置く練習や分詞構文の数です。主語の対応が明瞭な短い文で段階を付けたい範囲です。受け身・動名詞とは区別します。'},
 {target:'完了形・進行形の受け身',currentCount:0,priority:'次の補強候補',note:'通常の受け身と未来の受け身、伝達の受け身はあります。完了・進行と組み合わせる型はありません。'},
 {target:'関係詞の発展',currentCount:0,priority:'次の補強候補',note:'ここでの0は、whose、場所・時の関係副詞、非制限用法を対象とする文の数です。関係詞全体が0という意味ではなく、主格4問・目的格1問、reasons whyの文は収録されています。'},
 {target:'使役・知覚動詞の構文',currentCount:0,priority:'次の補強候補',note:'人に〜させる、だれかが〜するのを見る、という目的語と後ろの動詞の形を使い分ける練習はありません。make a differenceは使役構文として数えていません。'},
];
const report={status:'inspection-only',date:'2026-10-19',baselineCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),questionsSha256:sha(QUESTIONS),promptsSha256:sha(fs.readFileSync('src/data/translationBattlePrompts.json','utf8')),appSha256:sha(fs.readFileSync('src/App.tsx','utf8')),total:94,linked:94,guideCards:31,examples:12,lengths:{min:Math.min(...rows.map(r=>r.question.text.length)),max:Math.max(...rows.map(r=>r.question.text.length)),mean:rows.reduce((n,r)=>n+r.question.text.length,0)/94},pools:[0,7,14].map(i=>getGrade2CurriculumLimit(3,i)),counts,writingCount,writingIds,gaps,findings:[
 '意見・理由・結論など、英作文の型を短文で練習する内容として有用です。環境・教育・公共サービス・個人情報など、2級につながる題材もあります。',
 '文法を幅広く練習するLevel 3としては補強を勧めます。仮定法・過去完了・助動詞＋完了形などが0問で、現在完了4問、関係代名詞の主格4問・目的格1問です。長文にすることより、文法の種類と対比を増やすことを優先したい構成です。',
 '意見・理由・文章の順序・追加・例示・結果・結論などを主分類とする問題は39/94問です。各文に文法が含まれないという意味ではなく、主な学習対象の分布として示しています。',
 '基礎練習・リスニング練習は、先頭27→76→94問の範囲へ進みます。序盤にも現在完了や条件・受け身は入っていますが、文章をつなぐ短い型が目立ちます。各範囲内はランダム出題です。',
 '文法ガイドは94/94問に対応し、31カードへのリンク欠落はありません。詳しいカードで区別できている構文が、短い文法注釈では別の型になっている例があります。',
 '和訳は前回のレビューも反映済みです。その修正を保持した上で、that/whichや接続表現など、現在の条件だけでは別の自然な英文も成立する例を再確認しました。',
 '今回の12件は改善箇所の具体例で、必要修正の総数を確定したものではありません。短い注釈の具体化、和訳の構文条件の整理、優先文法の補強という順を勧めます。',
 'ゲーム本体・問題・和訳・保存データ・難易度は変更していません。既存のミス音80%変更もそのまま保持しています。コミット・プッシュは行っていません。'
],sources:[
 ['英検公式：2級の位置付け','https://www.eiken.or.jp/eiken/exam/grade_2/'],
 ['英検公式：2026年度第2回問題','https://www.eiken.or.jp/eiken/exam/kakomon/2026-2-1ji_2kyu.pdf'],
 ['英検公式：2026年度第1回問題','https://www.eiken.or.jp/eiken/exam/kakomon/2026-1-1ji-2kyu.pdf'],
 ['British Council：現実の条件と仮定の条件','https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/conditionals-zero-first-second'],
 ['British Council：過去完了','https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/past-perfect'],
 ['British Council：過去についての推量','https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/modals-deductions-about-past'],
 ['Cambridge：動詞の後ろの節と疑問詞＋不定詞','https://dictionary.cambridge.org/grammar/british-grammar/verb-patterns-with-and-without-objects']
],rows};
const dir=import.meta.dirname;fs.writeFileSync(dir+'/review.json',JSON.stringify(report,null,2)+'\n');
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const data=JSON.stringify(report).replaceAll('<','\\u003c');
fs.writeFileSync(dir+'/index.html',`<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>2級 Level 3 点検結果</title><style>*{box-sizing:border-box}body{margin:0;background:#091824;color:#e7f0f4;font-family:system-ui,"Yu Gothic",sans-serif;line-height:1.65}main{max-width:1100px;margin:auto;padding:22px 16px}h1{font-size:clamp(23px,3vw,32px);color:#ffdb92}h2{font-size:20px}.panel,article{background:#142e3e;border:1px solid #456d80;border-radius:10px;padding:16px;margin:12px 0}nav{position:sticky;top:0;background:#091824f5;display:flex;flex-wrap:wrap;gap:8px;padding:10px 0}button,input{font:inherit;color:inherit;background:#193d4e;border:1px solid #709caf;border-radius:6px;min-height:44px;padding:8px 12px}button[aria-pressed=true]{background:#795c2b}input[type=checkbox]{min-height:auto}label{display:flex;align-items:center;gap:6px}.en{font-size:21px;font-weight:650;overflow-wrap:anywhere}.ja{font-size:18px}.issue{color:#ffda92}.hint{color:#a3e2da}.hidden .en{visibility:hidden}small{color:#b4ccda}p{margin:6px 0}summary{cursor:pointer}a{color:#9de0ef}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:7px}.grid p{background:#1a3a4c;padding:6px 9px;border-radius:5px}.gap h3{font-size:17px;margin-bottom:4px}</style><main><h1>英検2級 Level 3：文法・和訳・解説の点検</h1><p>全94問／31解説カード／問題・進捗・難易度は未変更</p><section class="panel"><h2>総評</h2><p><strong>英作文の型として有用です。文法を幅広く練習する教材としては、2級向けの補強を勧めます。</strong></p><ul>${report.findings.map(f=>'<li>'+e(f)+'</li>').join('')}</ul><p>平均${report.lengths.mean.toFixed(1)}文字（空白・記号込み）。英文を長くすることだけを改善の基準にはしません。</p></section><details class="panel"><summary>補強したい文法と、その理由</summary><p>以下は公式の必須文法一覧ではなく、公式の水準・実際の問題と、このサイトの短文練習の目的を照合した補強案です。全てを一度に難しくせず、短い文で段階を付けます。</p>${gaps.map(g=>'<div class="gap"><h3>'+e(g.target)+'：'+g.currentCount+'問（'+e(g.priority)+'）</h3><p>'+e(g.note)+'</p></div>').join('')}</details><details class="panel"><summary>主分類ごとの問題数（1問1カードで集計）</summary><div class="grid">${counts.map(c=>'<p>'+e(c.title)+'：'+c.count+'問</p>').join('')}</div></details><details class="panel"><summary>確認に使った資料</summary><p>公式の実問題は水準比較に使いました。下の英文一覧は現行ゲームの問題で、試験問題の転載ではありません。</p>${report.sources.map(([t,u])=>'<p><a href="'+u+'" target="_blank" rel="noopener">'+e(t)+'</a></p>').join('')}</details><nav><button data-view="candidate">改善箇所の具体例12問</button><button data-view="all">現行94問</button><input id="search" type="search" aria-label="検索" placeholder="英文・和訳・文法で検索"><label><input id="hide" type="checkbox">英文を隠す</label></nav><p id="count" aria-live="polite"></p><section id="rows"></section></main><script>const d=${data};const $=s=>document.querySelector(s);const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const params=new URLSearchParams(location.search);let view=params.get('view')||'candidate';$('#search').value=params.get('q')||'';$('#hide').checked=params.get('hide')==='1';function draw(){const q=$('#search').value.toLowerCase();const rows=d.rows.filter(r=>(view==='all'||r.issue)&&JSON.stringify([r.question.text,r.meaning,r.cardTitle,r.issue]).toLowerCase().includes(q));$('#count').textContent=rows.length+'問を表示';$('#rows').classList.toggle('hidden',$('#hide').checked);$('#rows').innerHTML=rows.map(r=>'<article><small>問題'+r.number+'・段階'+r.band+'・解説：'+esc(r.cardTitle)+'</small><p class="en">'+esc(r.question.text)+'</p><p class="ja">'+esc(r.meaning)+'</p>'+(r.formNote?'<p class="hint">現在の表現条件：'+esc(r.formNote)+'</p>':'')+(r.issue?'<p class="issue">【'+esc(r.issue.kind)+'】'+esc(r.issue.finding)+'</p><p class="hint">改善案（未実装）：'+esc(r.issue.suggestion)+'</p>':'')+'<details><summary>現在の短い文法注釈・別表現</summary><p>'+esc(r.point?.label)+'：'+esc(r.point?.note)+'</p><p>型：'+esc(r.point?.pattern)+'</p><p>別表現：'+esc(r.alternatives.map(a=>a.text+'（'+a.note+'）').join(' / ')||'登録なし')+'</p></details></article>').join('');document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));const u=new URL(location);u.searchParams.set('view',view);u.searchParams.set('q',$('#search').value);u.searchParams.set('hide',$('#hide').checked?'1':'0');history.replaceState(null,'',u);}document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;draw()});['#search','#hide'].forEach(s=>$(s).addEventListener('input',draw));draw();</script></html>`);
console.log('Inspection report: 94 questions, 31 guides, 12 concrete examples; pools',report.pools,'writing-primary',writingCount);
