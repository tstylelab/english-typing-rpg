import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {load} from '../../scripts/lib/load-typescript-data.mjs';

// Proposal data only. This module writes inside this documentation directory.
// It does not supply questions to the game or write to src/.
const groups = [
  ['tense','時制・完了形',12,'過去の前後関係と、現在まで続く動作を整理。未来の期限までの完了へつなげる。'],
  ['conditional','仮定法・願望',12,'現在の事実に反する仮定から、過去の反実仮想・後悔へ進む。'],
  ['modal','助動詞＋完了形',9,'過去についての確信・可能性・後悔を対比する。'],
  ['participle','分詞の修飾・分詞構文',9,'名詞を説明する分詞と、文全体に状況を添える分詞を分ける。'],
  ['relative','関係詞の発展',9,'所有・場所・時の復習から、コンマで補足する非制限用法へ進む。'],
  ['causative','使役・手配',6,'人に行動させる形と、物を修理・確認してもらう形を区別する。'],
  ['passive','受け身の発展',6,'完了した結果と、今進められている作業を区別する。'],
  ['verb-pattern','不定詞・動名詞の意味の違い',6,'同じ動詞でも後続形によって、行動の前後関係や意味が変わることを練習する。'],
  ['comparison','比較の応用',3,'二つの変化の関連を、対になる比較級で説明する。'],
].map(([id,title,count,reason])=>({id,title,count,reason}));

// All examples are original drafts. Each narrow target has three contexts.
// kind=bridge means that the rebuilt Pre2 curriculum already teaches the form.
const targets = [
  {id:'past-sequence',group:'tense',title:'過去完了：過去の出来事より前の完了',kind:'bridge',band:1,pattern:'had + 過去分詞 / when + 過去形',hint:'過去の二つの出来事。先に完了していた方を過去完了にし、後の出来事は後半の「〜したとき」の節で表します。',rows:[
    ['The meeting had ended when I reached the office.','私が事務所に着いたとき、会議はすでに終わっていました。'],
    ['She had saved the file when the computer crashed.','コンピューターが故障したとき、彼女はすでにファイルを保存していました。'],
    ['We had sold all the tickets when the doors opened.','開場したときには、私たちはすでにすべてのチケットを売り終えていました。'],
  ]},
  {id:'past-experience',group:'tense',title:'過去完了：過去の時点までの経験',kind:'bridge',band:1,pattern:'had never + 過去分詞 / before + 過去形',hint:'過去のある出来事より前には経験がなかった、という文です。前半を過去完了の否定にし、後半を「〜する前」の節にします。',rows:[
    ['I had never voted before I turned eighteen.','私は18歳になるまで、それ以前に投票した経験がありませんでした。'],
    ['She had never managed a team before she joined us.','彼女は私たちの仲間になる前には、チームをまとめた経験がありませんでした。'],
    ['We had never used solar power before we moved here.','私たちはここへ引っ越す前には、太陽光発電を利用した経験がありませんでした。'],
  ]},
  {id:'present-perfect-progressive',group:'tense',title:'現在完了進行形：続いている動作',kind:'bridge',band:1,pattern:'have/has been + 動詞-ing',hint:'過去から今まで続けている動作を、現在完了進行形で表します。期間や起点も含めます。',rows:[
    ['We have been collecting donations for two weeks.','私たちは2週間、今までずっと寄付を集め続けています。'],
    ['She has been looking for a job since April.','彼女は4月から今までずっと仕事を探し続けています。'],
    ['They have been discussing the budget all morning.','彼らは午前中ずっと、今も予算について話し合い続けています。'],
  ]},
  {id:'future-perfect',group:'tense',title:'未来完了：期限までに終わっていること',kind:'extension',band:3,pattern:'will have + 過去分詞 / by + 期限',hint:'未来の期限までには完了している見込みを、未来完了で表します。期限を表す語句は文末に置きます。',rows:[
    ['I will have completed the survey by Friday.','私は金曜日までには、その調査を終えているでしょう。'],
    ['We will have reduced our waste by next summer.','私たちは来年の夏までには、ごみの量を減らせているでしょう。'],
    ['They will have repaired the roof by tomorrow.','彼らは明日までには、その屋根を修理し終えているでしょう。'],
  ]},
  {id:'second-conditional',group:'conditional',title:'仮定法過去：現在の事実と違う仮定',kind:'bridge',band:1,pattern:'If + 過去形, 主語 + would + 動詞原形',hint:'現在の事実とは違うことを想像します。条件節を先に置く仮定法過去で、「〜だろう」は意志・想定を表す助動詞で表します。',rows:[
    ['If I owned a car, I would drive to work.','もし車を持っていれば、私は車で通勤するでしょう。（実際は持っていません）'],
    ['If rent were lower, more students would live here.','もし家賃がもっと安ければ、もっと多くの学生がここに住むでしょう。（実際は高いです）'],
    ['If we had more staff, we would open on Sundays.','もし職員がもっといれば、私たちは日曜日も営業するでしょう。（実際は足りません）'],
  ]},
  {id:'third-conditional',group:'conditional',title:'仮定法過去完了：過去の事実と違う仮定',kind:'extension',band:3,pattern:'If + had + 過去分詞, would have + 過去分詞',hint:'実際とは違う過去と、その場合の結果を想像します。条件節を先に置き、仮定法過去完了で表します。',rows:[
    ['If I had left earlier, I would have caught the bus.','もしもっと早く出発していたら、私はそのバスに間に合っていたでしょう。（実際は間に合いませんでした）'],
    ['If we had checked the map, we would have found it.','もし地図を確認していたら、私たちはそれを見つけていたでしょう。（実際は見つかりませんでした）'],
    ['If she had applied, she would have got the job.','もし応募していたら、彼女はその仕事に就けていたでしょう。（実際は応募しませんでした）'],
  ]},
  {id:'wish-present',group:'conditional',title:'願望：現在と違っていればよいのに',kind:'bridge',band:1,pattern:'I wish + 主語 + 過去形 / could + 動詞原形',hint:'現在かなわない願いを、願望を表す動詞に仮定法過去を続けて表します。',rows:[
    ['I wish our town had better public transport.','私たちの町の公共交通がもっと充実していればよいのにと思います。'],
    ['I wish I could afford a larger apartment.','もっと広いアパートを借りるだけの余裕があればよいのにと思います。'],
    ['I wish the library stayed open longer.','その図書館がもっと遅くまで開いていればよいのにと思います。'],
  ]},
  {id:'wish-past',group:'conditional',title:'願望：過去を変えたい後悔',kind:'extension',band:3,pattern:'I wish + 主語 + had + 過去分詞',hint:'すでに変えられない過去を後悔しています。願望を表す動詞の後ろを過去完了にします。',rows:[
    ['I wish I had kept a copy of the receipt.','領収書のコピーを取っておけばよかったのにと思います。（実際は取りませんでした）'],
    ['I wish we had asked for advice sooner.','私たちはもっと早く助言を求めておけばよかったのにと思います。'],
    ['I wish I had read the contract more carefully.','契約書をもっと注意深く読んでおけばよかったのにと思います。'],
  ]},
  {id:'must-perfect',group:'modal',title:'過去の推量：きっと〜したに違いない',kind:'extension',band:2,pattern:'must have + 過去分詞',hint:'過去についての強い確信を、推量の助動詞に完了形を続けて表します。義務の意味にはしません。',rows:[
    ['She must have forgotten about the appointment.','彼女はその約束を忘れてしまったに違いありません。'],
    ['Someone must have moved my bicycle.','誰かが私の自転車を移動させたに違いありません。'],
    ['They must have received our message.','彼らは私たちの伝言を受け取ったに違いありません。'],
  ]},
  {id:'might-perfect',group:'modal',title:'過去の推量：〜したかもしれない',kind:'extension',band:2,pattern:'might have + 過去分詞',hint:'過去についての可能性を、推量の助動詞に完了形を続けて表します。同じ意味になる助動詞の別表現もあります。',alternatives:'may haveも自然です。mightとmayの選択を日本語の確率だけで一意に決めません。',rows:[
    ['I might have sent it to the wrong address.','私はそれを間違った住所に送ってしまったかもしれません。'],
    ['She might have misunderstood the instructions.','彼女はその指示を誤解したのかもしれません。'],
    ['They might have taken a different route.','彼らは別の経路を通ったのかもしれません。'],
  ]},
  {id:'should-perfect',group:'modal',title:'過去の後悔：〜しておくべきだった',kind:'extension',band:2,pattern:'should have + 過去分詞',hint:'過去に実行しなかったことを振り返り、「しておくべきだった」と表します。助動詞の後ろに完了形を続けます。',alternatives:'ought to haveなどの別表現も成立します。意味の誤りと、練習する型の違いを区別します。',rows:[
    ['I should have booked the tickets in advance.','私は事前にそのチケットを予約しておくべきでした。（実際はしませんでした）'],
    ['We should have compared the prices first.','私たちはまず価格を比較しておくべきでした。（実際はしませんでした）'],
    ['She should have backed up the data.','彼女はそのデータをバックアップしておくべきでした。（実際はしませんでした）'],
  ]},
  {id:'participle-active',group:'participle',title:'現在分詞の後置修飾',kind:'bridge',band:1,pattern:'名詞 + 動詞-ingのまとまり',hint:'「〜している」という説明を、現在分詞のまとまりで名詞の後ろに置きます。関係代名詞の節にはしません。',rows:[
    ['People living near the airport complained.','その空港の近くに住んでいる人々が苦情を言いました。'],
    ['The woman leading the tour speaks three languages.','そのツアーを案内している女性は3つの言語を話します。'],
    ['Students taking this course need a laptop.','この講座を受講している学生にはノートパソコンが必要です。'],
  ]},
  {id:'participle-passive',group:'participle',title:'過去分詞の後置修飾',kind:'bridge',band:1,pattern:'名詞 + 過去分詞のまとまり',hint:'「〜された」という説明を、過去分詞のまとまりで名詞の後ろに置きます。関係代名詞の節にはしません。',rows:[
    ['The products made in this factory are exported.','この工場で作られた製品は輸出されています。'],
    ['The proposal submitted yesterday needs revision.','昨日提出された提案は修正が必要です。'],
    ['The money raised at the event helped local families.','その催しで集められたお金は、地元の家族を助けました。'],
  ]},
  {id:'participle-clause',group:'participle',title:'分詞構文：主節と同じ主語の状況',kind:'extension',band:3,pattern:'動詞-ing / 過去分詞 ..., 主語 + 動詞',hint:'前半を分詞構文、後半を主節にします。分詞の動作・状態の主体は主節の主語と同じです。',caution:'接続詞の節でも自然に言えます。独立分詞構文・完了分詞構文は今回含めません。',rows:[
    ['Feeling tired, she decided to take a break.','疲れを感じていたので、彼女は休憩を取ることにしました。'],
    ['Walking home, I noticed a new recycling center.','歩いて帰宅する途中、私は新しいリサイクルセンターに気づきました。'],
    ['Surprised by the result, we checked the figures again.','その結果に驚いて、私たちは数値をもう一度確認しました。'],
  ]},
  {id:'whose',group:'relative',title:'所有を表す関係代名詞',kind:'bridge',band:2,pattern:'先行詞 + whose + 名詞 + ...',hint:'人とその人の持ち物・活動を、所有を表す関係代名詞でつなぎます。',rows:[
    ['I met a student whose research focuses on energy.','私は、研究がエネルギーに重点を置いている学生に会いました。'],
    ['We helped a farmer whose crops were damaged.','私たちは、作物が被害を受けた農家の人を助けました。'],
    ['The woman whose bag was stolen called the police.','かばんを盗まれた女性は警察に連絡しました。'],
  ]},
  {id:'where-when',group:'relative',title:'場所・時を説明する関係副詞',kind:'bridge',band:2,pattern:'場所 + where / 時 + when + 主語 + 動詞',hint:'場所・時を表す名詞を、関係副詞に続く節で説明します。',rows:[
    ['This is the center where volunteers receive training.','ここは、ボランティアたちが研修を受けるセンターです。'],
    ['I remember the day when our campaign began.','私は、私たちの活動が始まった日を覚えています。'],
    ['We need a place where residents can exchange ideas.','私たちには、住民が意見を交換できる場所が必要です。'],
  ]},
  {id:'nonrestrictive',group:'relative',title:'非制限用法：コンマで補足する関係詞',kind:'extension',band:3,pattern:'特定済みの名詞, which + ...',hint:'すでに特定されている物について、コンマを使う関係代名詞の節で補足します。物を絞り込む用法にはしません。',rows:[
    ['My bicycle, which I bought last year, needs repairs.','私の自転車は修理が必要です。ちなみに、それは去年買ったものです。'],
    ['Our library, which opened in May, is very popular.','私たちの図書館はとても人気です。ちなみに、5月に開館しました。'],
    ['This app, which is free, helps users save energy.','このアプリは利用者の省エネに役立ちます。ちなみに、無料です。'],
  ]},
  {id:'causative-base',group:'causative',title:'使役：人＋動詞の原形',kind:'bridge',band:2,pattern:'make / let + 人 + 動詞原形',hint:'「〜させる」または「〜することを許す」を、使役動詞に人と動詞の原形を続けて表します。',rows:[
    ['The delay made us change our plans.','その遅れによって、私たちは予定を変更せざるを得ませんでした。'],
    ['Our manager let us work from home.','私たちの上司は、私たちが在宅勤務をすることを許可しました。'],
    ['The new rules made drivers slow down.','新しい規則によって、運転手たちは速度を落とさなければなりませんでした。'],
  ]},
  {id:'causative-passive',group:'causative',title:'手配：物を〜してもらう',kind:'extension',band:3,pattern:'have + 物 + 過去分詞',hint:'自分で作業するのではなく、人に依頼・手配して物を〜してもらいます。目的語に物、その後ろに過去分詞を置く構文を練習します。',alternatives:'get + 物 + 過去分詞も自然です。意味の違いをでっち上げてhaveだけに絞りません。採用時は比較情報を含む出題条件と、別表現の扱いを整えます。',rows:[
    ['I had my bicycle repaired yesterday.','私は昨日、自転車を修理してもらいました。'],
    ['We had the documents translated into English.','私たちは、その書類を英語に翻訳してもらいました。'],
    ['She had her eyesight tested last week.','彼女は先週、視力を検査してもらいました。'],
  ]},
  {id:'perfect-passive',group:'passive',title:'現在完了の受け身',kind:'extension',band:2,pattern:'have/has been + 過去分詞',hint:'主語が〜されたという完了・現在の結果を、現在完了の受け身で表します。',rows:[
    ['The deadline has been extended by two weeks.','締め切りは2週間延長され、現在もその状態です。'],
    ['All the applications have been checked.','すべての申請書は、すでに確認が済んでいます。'],
    ['The missing documents have been found.','紛失していた書類は見つかり、今は所在が分かっています。'],
  ]},
  {id:'progressive-passive',group:'passive',title:'進行形の受け身',kind:'bridge',band:1,pattern:'am/is/are being + 過去分詞',hint:'今まさに作業を受けている途中であることを、現在進行形の受け身で表します。',rows:[
    ['The bridge is being inspected now.','その橋は今、点検されている最中です。'],
    ['New safety rules are being discussed.','新しい安全規則は今、話し合われている最中です。'],
    ['The damaged houses are being repaired.','被害を受けた家々は今、修理されている最中です。'],
  ]},
  {id:'remember',group:'verb-pattern',title:'覚えていること／忘れずこれからすること',kind:'bridge',band:1,pattern:'remember doing / remember to do',hint:'これから忘れずにする行動は不定詞、すでにした行動を覚えている場合は動名詞を使います。「覚えている」を中心とする動詞で練習します。',rows:[
    ['Please remember to attach the file.','忘れずに、そのファイルを添付してください。（これからすることです）'],
    ['I remember attaching the file to my email.','私は、自分のメールにそのファイルを添付したことを覚えています。'],
    ['She remembered to renew her passport.','彼女は、忘れずにパスポートを更新しました。'],
  ]},
  {id:'stop',group:'verb-pattern',title:'行動をやめる／別の目的のため立ち止まる',kind:'bridge',band:1,pattern:'stop doing / stop to do',hint:'続けていた動作をやめる場合は動名詞、別のことをする目的でいったん止まる場合は不定詞を使います。',rows:[
    ['We stopped using disposable cups.','私たちは、使い捨てカップを使うのをやめました。'],
    ['We stopped to check the emergency exits.','私たちは、非常口を確認するために立ち止まりました。'],
    ['She stopped driving after the accident.','彼女は、その事故の後、車の運転をやめました。'],
  ]},
  {id:'correlative-comparison',group:'comparison',title:'〜すればするほど、ますます…',kind:'bridge',band:2,pattern:'The + 比較級 ..., the + 比較級 ...',hint:'二つの変化の関連を、定冠詞に比較級を続ける形を二つ組み合わせて表します。',rows:[
    ['The more we recycle, the less waste we produce.','私たちがリサイクルすればするほど、出すごみは少なくなります。'],
    ['The longer we wait, the fewer seats are available.','私たちが長く待てば待つほど、利用できる席は少なくなります。'],
    ['The more carefully we plan, the fewer mistakes we make.','私たちが注意深く計画すればするほど、犯す間違いは少なくなります。'],
  ]},
];

const {QUESTIONS}=load('src/data/questions.ts');
const baseline=JSON.parse(fs.readFileSync(new URL('../grade2-level3-check-2026-10-19/review.json',import.meta.url)));
const pre2=JSON.parse(fs.readFileSync('src/data/questionSets/eiken/pre2GrammarCurriculum.json','utf8'));
const old=load('src/data/questionSets/eiken/grade2.ts').legacyGrade2Sentences ?? QUESTIONS.Eiken2[3];
const normalize=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
const oldSet=new Set(old.map(q=>normalize(q.text)));
const pre2Set=new Set(pre2.map(q=>normalize(q.question.text)));
const rows=targets.flatMap(t=>t.rows.map(([text,meaning],i)=>({id:t.id+'-'+(i+1),targetId:t.id,group:t.group,title:t.title,kind:t.kind,band:t.band,text,meaning,formNote:t.hint,pattern:t.pattern,alternatives:t.alternatives??'',caution:t.caution??''})));
assert.equal(old.length,94);
assert.equal(targets.length,24);
assert.equal(rows.length,72);
assert.equal(new Set(rows.map(r=>normalize(r.text))).size,72);
assert.ok(targets.every(t=>t.rows.length===3));
assert.ok(rows.every(r=>r.text&&r.meaning&&r.formNote&&!oldSet.has(normalize(r.text))&&!pre2Set.has(normalize(r.text))));
assert.equal(rows.filter(r=>r.kind==='bridge').length,42);
assert.equal(rows.filter(r=>r.kind==='extension').length,30);
for(const g of groups)assert.equal(rows.filter(r=>r.group===g.id).length,g.count);
const lengths=a=>({min:Math.min(...a.map(s=>s.length)),max:Math.max(...a.map(s=>s.length)),mean:a.reduce((n,s)=>n+s.length,0)/a.length});
const sha=s=>createHash('sha256').update(s).digest('hex');
const sourceFiles=['src/App.tsx','src/data/translationBattlePrompts.json','src/data/questionSets/eiken/grade2.ts','src/data/questionSets/eiken/grade2Sentences.ts','src/data/grade2GrammarGuide.ts','src/data/grade2GrammarAssignments.ts'];
const report=fs.existsSync(import.meta.dirname+'/release.json') ? JSON.parse(fs.readFileSync(import.meta.dirname+'/proposal.json','utf8')) : {status:'proposal-only',date:'2026-10-19',retained:94,removed:0,added:72,total:166,bridge:42,extension:30,targets:24,groups,rows,lengths:{existing:lengths(old.map(q=>q.text)),added:lengths(rows.map(r=>r.text)),combined:lengths([...old.map(q=>q.text),...rows.map(r=>r.text)])},bands:[1,2,3].map(b=>({band:b,added:rows.filter(r=>r.band===b).length,cumulativeAdded:rows.filter(r=>r.band<=b).length})),sourceHashes:Object.fromEntries(sourceFiles.map(p=>[p,sha(fs.readFileSync(p))])),baselineCommit:baseline.baselineCommit,sources:[
 ['英検公式：2級の水準','https://www.eiken.or.jp/eiken/exam/grade_2/'],
 ['英検公式：2026年度第2回問題','https://www.eiken.or.jp/eiken/exam/kakomon/2026-2-1ji_2kyu.pdf'],
 ['British Council：過去完了','https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/past-perfect'],
 ['British Council：過去の反実仮想','https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/conditionals-third-mixed'],
 ['British Council：過去の推量','https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/modals-deductions-about-past'],
 ['British Council：未来完了','https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/future-continuous-future-perfect'],
 ['British Council：分詞構文（掲載範囲全体は今回の対象ではありません）','https://learnenglish.britishcouncil.org/free-resources/grammar/c1/participle-clauses'],
]};
const dir=import.meta.dirname;
fs.writeFileSync(dir+'/proposal.json',JSON.stringify(report,null,2)+'\n');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const data=JSON.stringify(report).replaceAll('<','\\u003c');
fs.writeFileSync(dir+'/index.html',`<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>2級 Level 3：72問の追加提案</title><style>*{box-sizing:border-box}body{margin:0;background:#0a1824;color:#e6f0f5;font:16px/1.75 system-ui,"Yu Gothic",sans-serif}main{max-width:1100px;margin:auto;padding:20px 16px}h1{font-size:clamp(23px,4vw,32px);color:#ffda91}h2{font-size:21px}h3{font-size:18px;margin:0}a{color:#9ee3ef}.panel,article{border:1px solid #456a80;background:#142d3d;border-radius:10px;padding:16px;margin:12px 0}.numbers{display:flex;flex-wrap:wrap;gap:12px}.numbers strong{font-size:25px;color:#ffdc95}.table{overflow:auto}table{width:100%;border-collapse:collapse;min-width:480px}th,td{text-align:left;border-bottom:1px solid #456a80;padding:9px}td:nth-child(2){white-space:nowrap}nav{display:flex;flex-wrap:wrap;gap:8px;position:sticky;top:0;background:#0a1824f5;padding:10px 0;z-index:2}select,input,button{font:inherit;max-width:100%;background:#183b4b;color:inherit;border:1px solid #7198ac;border-radius:6px;min-height:44px;padding:7px 10px}input[type=checkbox]{min-height:auto}label{display:flex;align-items:center;gap:6px}.en{font-size:21px;font-weight:600;overflow-wrap:anywhere}.ja{font-size:18px}.hint{color:#a6e5d6}.warn{color:#ffdc96}small{color:#b7cedb}p{margin:7px 0}.hidden .answer{display:none}summary{cursor:pointer;padding:4px 0}li{margin:7px 0}.badge{display:inline-block;font-size:13px;border:1px solid #629b9c;padding:0 6px;border-radius:4px;margin-right:6px}</style><main><h1>英検2級 Level 3：追加する内容と問題数の提案</h1><p>2026-10-19／<strong>${fs.existsSync(dir+'/release.json')?'承認済みの72問を本体へ追加。全166問・文法解説55枚に対応しています。':'提案用の72問を全件作成。本体への追加はまだ行っていません。'}</strong></p><p><a href="../grade2-level3-check-2026-10-19/index.html?view=candidate">既存94問の点検結果・注釈などの改善例12件を見る</a></p><section class="panel"><h2>提案の全体像</h2><div class="numbers"><span>既存 <strong>94</strong> 問を保持</span><span>追加 <strong>72</strong> 問</span><span>合計 <strong>166</strong> 問</span><span>削除 <strong>0</strong> 問</span></div><p>既存の意見・理由・説明の文は、英作文の型として活かします。追加は<strong>24の小さな学習対象 × 3つの異なる文脈</strong>。1例だけ覚える構成を避けつつ、似た問題を大量に増やしすぎない配分です。72問は唯一の正解ではなく、今回の不足と反復量から組んだ提案です。</p><p><strong>準2級からの復習・応用42問＋発展30問。</strong>準2級の改訂版は過去完了・現在完了進行形・使役・分詞の後置修飾などをすでに扱っています。これらを2級で初めて学ぶ構文とは呼ばず、仕事・社会生活などの別の文脈で使い直します。英文の丸ごとの重複はありません。</p><p>発展30問は、未来完了、過去の反実仮想、過去への願望、助動詞＋完了形3種類、短い分詞構文、関係詞の非制限用法、物を〜してもらう形、現在完了の受け身です。</p><p>英検公式が示す高校卒業程度という水準と実際の問題を参照した、本サイト向けの短文文法練習案です。<strong>公式の必須文法リストや出題頻度を示すものではありません。</strong>長文読解用の文章にはせず、社会的な題材も難しい専門語を増やすためには使いません。</p></section><section class="panel"><h2>何を、何問追加するか</h2><div class="table"><table><thead><tr><th>分野</th><th>追加数</th><th>狙い</th></tr></thead><tbody>${groups.map(g=>'<tr><td>'+esc(g.title)+'</td><td>'+g.count+'問</td><td>'+esc(g.reason)+'</td></tr>').join('')}</tbody></table></div></section><section class="panel"><h2>負担と段階の付け方</h2><ul><li>段階1：復習中心の30問。過去完了、継続、現在の仮定・願望、分詞の修飾、進行受け身、動詞の後続形。</li><li>段階2：対比・組み合わせの24問。助動詞＋完了形、関係詞の復習、使役、完了受け身、比較。</li><li>段階3：発展18問。未来完了、過去の反実仮想・願望、短い分詞構文、非制限用法、手配の表現。</li></ul><p>文字数（空白・記号込み）：既存平均${report.lengths.existing.mean.toFixed(1)} → 追加平均${report.lengths.added.mean.toFixed(1)} → 全体平均${report.lengths.combined.mean.toFixed(1)}。追加の最長は${report.lengths.added.max}文字です。複数の難構文を一文へ詰め込まず、中心の型を一つに絞りました。</p><p>上の段階は追加案内での順序です。${fs.existsSync(dir+'/release.json')?'ゲームの段階別プールは57→130→166問です。序盤から復習する構文を追加し、全166問でダメージを計算しました。各敵のHP・出題上限は追加前と同じです。':'現在のゲームの出題範囲・順序・HPは変更していません。採用する際には既存94問と合わせて序盤にも各分野が入る順序を組み、文字数の増加に伴うダメージ・HPへの影響を数値で確認します。'}</p></section><section class="panel"><h2>和訳バトルと文法解説も一緒に整える</h2><ol><li>下の72問すべてに、和訳と「今回練習する形」の案を付けました。日本語だけで英訳が一通りになるとは扱いません。</li><li>同じ意味の自然な別表現は誤りと区別します。特に推量の助動詞など、文法の条件を示しても一意にならないものがあります。採用時には答えの型・比較表現の表示を整え、別解を受理する場合は入力判定まで検証します。</li><li>追加72問は全件、実際の構文に合う解説へ接続する方針です。既存カードで不足する構文は説明も追加します。${fs.existsSync(dir+'/release.json')?'追加72問すべてに文法解説を接続済みです。正誤判定は既存の方式を維持しています。':'現時点の案には本体のリンク・正誤判定を実装していません。'}</li><li>既存94問は別途、短い注釈の不一致や和訳条件を修正します。点検ページの12件は具体例で、これだけ直せば完了という総数ではありません。</li></ol><p class="warn">和訳のみの記述入力には語彙・語順の別解も残ります。「この補足があれば必ず一意」とは判断せず、採用前に全件を出題表示・答え・比較表現の組で確認します。</p></section><nav><select id="group" aria-label="文法分野"><option value="all">すべての分野</option>${groups.map(g=>'<option value="'+g.id+'">'+esc(g.title)+'（'+g.count+'問）</option>').join('')}</select><select id="kind" aria-label="学習の位置付け"><option value="all">復習・応用と発展</option><option value="bridge">準2級からの復習・応用42問</option><option value="extension">発展30問</option></select><input id="search" type="search" aria-label="検索" placeholder="英文・和訳・文法で検索"><label><input id="hide" type="checkbox">英文・答えの型を隠す</label></nav><p id="count" aria-live="polite"></p><section id="rows"></section><details class="panel"><summary>参照資料</summary><p>下の資料は水準・構文の確認に使いました。72英文は資料の例文を転載せず、この提案用に作成しました。分詞構文の資料全体は上級範囲を含むため、本提案では主語が明瞭な短い3文に限定しています。</p>${report.sources.map(([t,u])=>'<p><a href="'+u+'" target="_blank" rel="noopener">'+esc(t)+'</a></p>').join('')}</details></main><script>const d=${data};const $=s=>document.querySelector(s);const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const p=new URLSearchParams(location.search);for(const id of ['group','kind']){const v=p.get(id);if([...$('#'+id).options].some(o=>o.value===v))$('#'+id).value=v;}$('#search').value=p.get('q')||'';$('#hide').checked=p.get('hide')==='1';function draw(){const q=$('#search').value.toLowerCase();const rows=d.rows.filter(r=>($('#group').value==='all'||r.group===$('#group').value)&&($('#kind').value==='all'||r.kind===$('#kind').value)&&JSON.stringify([r.text,r.meaning,r.title]).toLowerCase().includes(q));$('#count').textContent=rows.length+'問を表示／追加案72問';$('#rows').classList.toggle('hidden',$('#hide').checked);$('#rows').innerHTML=rows.map(r=>'<article data-id="'+r.id+'"><small><span class="badge">'+(r.kind==='bridge'?'復習・応用':'発展')+'</span>段階'+r.band+'・提案'+(d.rows.indexOf(r)+1)+'</small><h3>'+e(r.title)+'</h3><p class="en answer">'+e(r.text)+'</p><p class="ja">'+e(r.meaning)+'</p><p class="hint">出題補足案：'+e(r.formNote)+'</p><details class="answer"><summary>練習する型・別表現など</summary><p>'+e(r.pattern)+'</p>'+(r.alternatives?'<p class="warn">'+e(r.alternatives)+'</p>':'<p>この文も、語彙や語順を変える別の自然な言い方があり得ます。</p>')+(r.caution?'<p>'+e(r.caution)+'</p>':'')+'</details></article>').join('');const u=new URL(location);for(const id of ['group','kind'])u.searchParams.set(id,$('#'+id).value);u.searchParams.set('q',$('#search').value);u.searchParams.set('hide',$('#hide').checked?'1':'0');history.replaceState(null,'',u);}for(const id of ['group','kind','search','hide'])$('#'+id).addEventListener('input',draw);draw();</script></html>`);
console.log(JSON.stringify({added:rows.length,total:report.total,bridge:report.bridge,extension:report.extension,bands:report.bands,lengths:report.lengths},null,2));
