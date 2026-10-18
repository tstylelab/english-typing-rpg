import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {load} from '../../scripts/lib/load-typescript-data.mjs';

// Review artifacts only. Never write into src, public, storage, or Git.
const dir=path.dirname(fileURLToPath(import.meta.url));
const sha=v=>createHash('sha256').update(v).digest('hex');
const {QUESTIONS}=load('src/data/questions.ts');
const {getQuestionMeaning}=load('src/data/questionMeaning.ts');
const {getTranslationBattlePrompt}=load('src/data/translationBattlePrompts.ts');
const qs=QUESTIONS.EikenPre2[3];
assert.equal(qs.length,173);
const original=qs.map((q,i)=>({number:i+1,text:q.text,translation:q.translation,displayMeaning:getQuestionMeaning(q,'EikenPre2'),prompt:getTranslationBattlePrompt(q,'EikenPre2',3)??null,grammar:q.grammarPoint}));
const topics=[];
function topic(id,section,title,goal,numbers,note='重点',extra=''){
 topics.push({id,section,title,goal,numbers,priority:note,extra});
}
topic('01','時制・助動詞・受け身','現在完了と過去形','今へのつながりを保ち、経験・完了・継続と過去の一点を使い分ける。',[90,97,98,111,132],'復習→重点');
topic('02','時制・助動詞・受け身','現在完了進行形','過去から今まで続く活動を have been + ing で表す。',[112]);
topic('03','時制・助動詞・受け身','過去完了','過去の基準時より前に済んだこと・それまでの経験を表す。',[145,147,161]);
topic('04','時制・助動詞・受け身','助動詞の推量','must / may / might / could / cannot の確信の強さを理解する。',[24]);
topic('05','時制・助動詞・受け身','受け身と助動詞','受け手を主語にし、疑問・否定・未来・必要性の形に広げる。',[60,83,84,99,128,133,149,159],'復習→重点','It is said that ... は応用の一例。単純な受け身から順に扱う。');
topic('06','時制・助動詞・受け身','進行形の受け身','今まさに行われている作業を be being + 過去分詞で表す。',[141]);
topic('07','動詞の後ろ・不定詞・動名詞','動詞＋人＋to','依頼・許可・勧め・注意喚起で、行う人と動作を結び付ける。',[89,113,114,134]);
topic('08','動詞の後ろ・不定詞・動名詞','仮主語it＋不定詞','it を先に置き、何が・誰にとって必要かを後ろで説明する。',[96,170],'復習→重点');
topic('09','動詞の後ろ・不定詞・動名詞','不定詞・動名詞の基本の選択','decide / avoid などの後ろの形、目的・感情の理由、動名詞主語を使う。',[49,71,75,80,105,107],'復習→重点','機能の異なる to / ing を含む広い復習分野。各問題の小目標を確認する。');
topic('10','動詞の後ろ・不定詞・動名詞','前置詞＋動名詞','to が前置詞である場合も含め、前置詞の後ろに動名詞を置く。',[63,65,69,85,92,125]);
topic('11','動詞の後ろ・不定詞・動名詞','stop・rememberの意味の違い','to と ing によって動作の順序・意味が変わることを理解する。',[]);
topic('12','使役・知覚・状態の説明','使役・help＋人＋動詞','let / make の原形不定詞と、help に続く動作を組み立てる。',[33,62,115],'重点','help は to 付きも自然。解答後の比較で許容形を説明する。');
topic('13','使役・知覚・状態の説明','知覚動詞','進行中の動作と、動作をひとまとまりとして捉える形を比較する。',[66],'重点','原形とingは見方の違い。日本語だけで常に一意に分かれるとは扱わない。');
topic('14','使役・知覚・状態の説明','目的語＋補語','keep / find / leave などで、目的語がどんな状態かを表す。',[]);
topic('15','使役・知覚・状態の説明','分詞による名詞の説明','する側のingと、される側の過去分詞を使い分ける。',[91,129]);
topic('16','関係詞・間接疑問','関係代名詞','主格と目的格の節を組み立て、名詞に説明を加える。',[119,126],'復習→重点');
topic('17','関係詞・間接疑問','所有を表すwhose','人と、その人に属するものを一つの節で説明する。',[150]);
topic('18','関係詞・間接疑問','関係副詞where・when','場所・時と、そこで／その時に起きることを結び付ける。',[142,151]);
topic('19','関係詞・間接疑問','間接疑問・疑問詞＋to','疑問詞の後ろを平叙文の語順にし、疑問詞＋toの形も比べる。',[55,57,77,102,108]);
topic('20','関係詞・間接疑問','if・whetherの名詞節','〜かどうか、という内容を動詞の目的語にする。',[73,95,146]);
topic('21','比較・条件・つながり','比較の使い分け','倍数、比較級の強調、最上級、好み、比例比較を使う。',[122,127,130,156,162],'復習→重点');
topic('22','比較・条件・つながり','too…to・enough to','不可能なほどの程度と、十分な程度を区別する。',[76,100]);
topic('23','比較・条件・つながり','時・条件を表す節','未来を表す時・条件の節で現在形を使い、順序と条件を表す。',[29,42,101,120,123],'復習→重点','ifの条件節と、〜かどうかを表す名詞節を区別する。');
topic('24','比較・条件・つながり','理由・譲歩・対比の接続','because / although / while / but などで二つの事柄の関係を表す。',[116,124,144,166],'重点','whileの同時進行と対比も比較。単独のHoweverなどを打つ練習にはしない。');
topic('25','比較・条件・つながり','目的のso that・結果のso…that','目的と、程度から生じる結果を、違う語順で表す。',[135,136]);
topic('26','仮定・願い・発言の伝達','仮定法過去','今・未来について現実とは違う仮定を置く。',[94,154,163]);
topic('27','仮定・願い・発言の伝達','wish・as if','現実と違う願い、まるでそうであるかのような様子を表す。',[139,143],'重点→応用','as if＋仮定の過去形は既存の応用1問として残す。');
topic('28','仮定・願い・発言の伝達','間接話法・発言や質問の伝達','発言した時点と人称を考え、語順・時制を調整する。',[87,137,152,157],'重点','時制を機械的に全部過去へずらすという規則にはしない。');
topic('29','補助の構文・使い分け','that節・内容の説明・否定の範囲','that節を目的語や補語に置き、思わない範囲にも注意する。',[45,81,104,171],'復習→重点','前回の28の柱に加え、既存の有用な内容節を残す補助分野。');
topic('30','補助の構文・使い分け','並列・省略・同意の語順','同じ種類の要素を並べ、so / neither の助動詞と語順を使う。',[6,82,121],'復習→重点','短くても構造の学びがあるNeither do I.を残す。');
topic('31','補助の構文・使い分け','依頼のmind＋ingと許可のmind if','自分の許可を尋ねる形と、相手の行動を頼む形を比較する。',[68,70,72],'重点','意味の重なりはあるが、誰が行動するかを和訳と解説で明確にする。');

const assignments=new Map();
for(const t of topics)for(const n of t.numbers){assert.ok(!assignments.has(n),'Duplicate '+n);assignments.set(n,{status:'keep',topic:t.id,reason:t.goal});}
const rewritten=[];
function rewrite(n,id,text,ja,reason,focus){assert.ok(!assignments.has(n));assignments.set(n,{status:'rewrite',topic:id,reason});rewritten.push({sourceNumber:n,topic:id,text,ja,focus,reason,origin:'rewrite'});}
rewrite(56,'09','Taking the bus saves us money.','バスを利用することは私たちのお金の節約になります。','Secondとitに頼る断片的な文から、動名詞主語＋動詞＋人＋物を学べる文へ。','動名詞を主語にし、savesの三人称単数にも注意する。');
rewrite(58,'09','We should avoid using too much plastic.','私たちはプラスチックを使いすぎることを避けるべきです。','単純なshouldだけの復習から、avoid＋ingを組み合わせる練習へ。','助動詞の後ろの原形と、avoidの後ろのingを区別する。');
rewrite(67,'09','There is no reason to cancel the trip.','その旅行を中止する理由はありません。','文脈のない二つの理由という宣言を、名詞を説明する不定詞の文へ。','reasonをto cancelが後ろから説明する。');
rewrite(86,'12','Walking to school helps me stay healthy.','歩いて学校に通うことは、私が健康を保つ助けになります。','itの指すものが不明な理由の型から、動名詞主語とhelpの形を練習する文へ。','主語Walkingとhelps、help＋人＋動詞を確認する。');
rewrite(109,'24','We stayed home because the roads were icy.','道路が凍っていたので、私たちは家にいました。','Thisの前提が必要な文を、行動と理由が一文で分かる形へ。','becauseの前後をどちらも主語＋動詞で組み立てる。');
rewrite(110,'24','We chose this hotel because it was near the station.','私たちは、そのホテルが駅の近くにあったので、このホテルを選びました。','Another reasonやitに依存せず、過去の選択と理由を説明する。','主節と理由の節の両方で過去形を使う。');
rewrite(118,'23','We should listen carefully before we answer.','私たちは答える前に、注意深く話を聞くべきです。','First of allの暗記から、助動詞とbeforeの節で行動の順序を表す練習へ。','should＋原形とbefore＋文を確認する。');
rewrite(148,'24','Cars are convenient, but they can cause pollution.','車は便利ですが、汚染を引き起こすことがあります。','対比の片方だけの文を、利点と問題点の両方が入る一文へ。','butで対比し、代名詞theyがcarsを受ける。');
rewrite(160,'29','One advantage of cycling is that it saves energy.','自転車に乗ることの利点の一つは、エネルギーを節約できることです。','何の利点かを示し、動名詞とthat節を含む自立した文にする。','of＋動名詞と、補語となるthat節を組み立てる。');
rewrite(164,'02','Prices have been rising since last summer.','物価は去年の夏からずっと上がり続けています。','報告によると、という前置きの練習から、現在完了進行形とsinceの練習へ。','今まで続く変化と、始まった時点を表す。');
rewrite(165,'23','We need to consider the cost before we decide.','私たちは決める前に、費用を考慮する必要があります。','Howeverだけに対比を任せず、決定の前後関係を含める。','need＋toとbeforeの節を組み合わせる。');
rewrite(167,'07','Learning English allows us to talk with people abroad.','英語を学ぶことで、私たちは海外の人たちと話せるようになります。','For exampleで前文を必要とする型を、動名詞主語＋allow＋人＋toの文へ。','Learningを一つの活動として主語にし、allows us toを続ける。');
rewrite(168,'29','I agree that protecting nature is important.','私は、自然を守ることが大切だという意見に賛成です。','同種の意見文を増やすだけでなく、that節の中の動名詞主語を確認する。','that節の中でprotecting natureが主語、isが動詞。');
rewrite(173,'12','Learning languages helps us understand different cultures.','言語を学ぶことは、私たちが異なる文化を理解する助けになります。','believe thatの反復から、動名詞主語＋help＋人＋動詞の応用へ。','複数形languagesに引かれず、活動を表す主語にhelpsを合わせる。');

// Explicit editorial decisions for every remaining current question.
const removals={
 1:'驚き・拒否の決まり文句。文法より会話場面の暗記が中心。',2:'帰宅の挨拶。準2級の文法確認としての優先度が低い。',3:'くだけた挨拶。文法中心の本案では優先度が低い。',4:'控えめな同意の慣用表現。soの代用は補助の並列・同意で絞って扱う。',5:'快諾の決まり文句。語句の意味の学習が中心。',7:'感嘆文は有用だが、今回の準2級重点構文の配分では外す。',8:'未来とmissの意味が中心。意図する重点構文が薄い。',9:'eitherの選択とdoの慣用義は有用だが、今回の重点構文より優先度を下げる。',10:'can\'t help itは慣用的な意味の学習が中心。',11:'省略された会話の返答。今回の文法確認では優先度が低い。',12:'挨拶への返答。前の発言がないと使いどころを確認できない。',13:'watchの語義が中心。命令文の基本形だけの再出題は抑える。',14:'接客の返答と呼びかけ。語用の学習が中心。',15:'on meの慣用義が中心。文法の重点問題としては外す。',16:'基本命令文と句動詞が中心。',17:'呼びかけとlet\'sの基本表現。使役letは別問題で残す。',18:'食事の返答。満腹を表すfullの意味が中心。',19:'了承の定型表現。構文の新しい練習要素が少ない。',20:'感情＋不定詞はI was surprised to hear the news.で残し、文脈依存のthatは減らす。',21:'基本的な未来と時刻。上位の時制・受け身を優先する。',22:'伝言を受ける会話表現。文法よりtake/leaveの語句の区別が中心。',23:'how comeの語順は有用だが、間接疑問の反復に比重を移す。',25:'伝言を頼む会話表現。take/leaveの語句の区別が中心。',26:'thatの内容が前文頼りで、wouldの仮定を確認しづらい。',27:'会話のgo getの用法。今回の重点構文では優先度を下げる。',28:'感情＋不定詞の学びは別の具体的な文に残す。',30:'強い同意の慣用義が中心。字面と実際の意味の差を学ぶ会話向け。',31:'give a handの慣用義が中心。丁寧な依頼はmindの比較で残す。',32:'飲食店の定型表現。会話場面の知識が中心。',34:'likeによる特徴の質問は有用だが、今回の構文配分では優先度を下げる。',35:'話の切り出しと短い報告。目標とする重点文法が薄い。',36:'基本の過去の疑問文。過去完了などの比較を優先する。',37:'接客への返答。基本進行形だけの再出題は抑える。',38:'be sure aboutの語句が中心。',39:'depend onの語句が中心。',40:'道案内の定型表現。未来形の基本だけの再出題は抑える。',41:'会話での確認に便利だが、内容節は通常の疑問文Does that mean ...?を残す。',43:'不具合を尋ねる決まり文句。疑問文は受け身や間接疑問で扱う。',44:'お祝いの定型表現。前置詞onは別の動名詞問題などで反復する。',46:'感想を尋ねる会話表現。文法より場面の使い分けが中心。',47:'直前の状況が必要なつなぎとlet\'s。今回の重点構文として外す。',48:'よろしく伝える慣用表現が中心。',50:'help yourself toの慣用義が中心。',51:'丁寧な前置きと売切れの語句が中心。that節・受け身は他の問題で残す。',52:'診察予約の語句が中心。',53:'意見を尋ねる基本表現。間接疑問などの反復を優先する。',54:'道案内の定型依頼。同じCould you tell meでも間接疑問のある55番を残す。',59:'take A for Bの語句・構文は有用だが、今回はL2向けの慣用表現として優先度を下げる。',61:'作文で例を挙げる型。文法上の重点練習要素が少ない。',64:'do you goodの慣用義が中心。',74:'前文の結果を述べるつなぎ。理由・結果を一文で結ぶ問題を優先する。',78:'in charge ofの語句が中心。疑問文は受け身・間接疑問で残す。',79:'see to it thatは有用だが、語句固有の型として今回はL2寄りと判断する。',88:'thatが指す理由が前文頼り。関係副詞は場所・時から反復する。',93:'疑問詞とshouldの基礎復習。より重点的な助動詞の用法を補う。',103:'電話でのput throughの語句が中心。',106:'In additionという作文のつなぎが主な学び。',117:'意見の前置きが主な学びで、that節や動名詞主語の問題と配分が重なる。',131:'apply forの語句が中心。疑問文は他の重点構文で扱う。',138:'do nothing butの型は有用だが、今回は基本の動詞後の形と否定の範囲を優先する。',140:'Moreoverのつなぎ語の意味が中心で前文頼り。',153:'前文の複数理由がないと内容が薄い、作文の結びの型。',155:'theyが指すものと対比の前半が不足。148番の組み直し案で内容をまとめる。',158:'Generally speakingは有用だが、この1問だけを分詞構文の体系的練習とは扱わない。',169:'強調した意見の型は有用だが、内容節は別の文に絞る。',172:'結論の前置きと慣用表現が中心。今回の文法確認から外す。'
};
for(const [key,reason] of Object.entries(removals)){const n=Number(key);assert.ok(!assignments.has(n),'Already assigned '+n);assignments.set(n,{status:'remove',topic:null,reason});}
assert.equal(assignments.size,173,'Every existing question gets an explicit decision');

const additions=[];
function add(id,text,ja,focus,comparison=''){
 additions.push({topic:id,text,ja,focus,comparison,origin:'add',reason:'既存の例が少ない形・意味の使い分けを補う。'});
}
add('01','I lost my key yesterday.','私は昨日、鍵をなくしました。','yesterdayという過去の時点には過去形を使う。','今の状況を伝えるI have lost my key ...と比較する。');
add('01','I have lost my key, so I cannot open the door.','鍵をなくしてしまったので、私はドアを開けられません。','紛失の結果が今に残ることを現在完了で表す。');
add('09','She decided to study abroad.','彼女は留学することを決めました。','decideの後ろにto＋原形を続ける。');
add('09','She enjoys learning new languages.','彼女は新しい言語を学ぶことを楽しんでいます。','enjoyの後ろに動名詞を続ける。');
add('10','I used to walk to school.','私は以前、歩いて学校に通っていました。','過去の習慣のused to＋原形と、慣れているbe used to＋ingを対比する。');
add('20',"I don't know if he will come tomorrow.",'彼が明日来るかどうか、私は分かりません。','〜かどうかのif節では、未来のwillを使える。','条件を表すIf he comes tomorrow, ...との違いを確認する。');
add('23','If he comes tomorrow, I will tell him.','もし彼が明日来たら、私は彼に伝えます。','未来でも条件を表すif節は現在形を使う。');
add('21','This bag is not as heavy as mine.','このかばんは私のものほど重くありません。','否定を伴うas ... asと、所有代名詞mineを確認する。');
add('30','So can I.','私もできます。','肯定への同意ではso＋助動詞＋主語。','前提：相手が「私は泳げます」と言った場面。');
add('30','Neither can I.','私もできません。','否定への同意ではneither＋助動詞＋主語。','前提：相手が「私は泳げません」と言った場面。');
add('02','She has been studying for two hours.','彼女は二時間ずっと勉強しています。','過去から今まで続く活動とfor＋期間。');
add('02','How long have you been learning English?','あなたはどのくらいの間、英語を学び続けていますか。','現在完了進行形の疑問文と語順。');
add('03','He had not finished his homework when I called.','私が電話したとき、彼はまだ宿題を終えていませんでした。','過去の基準時より前の未完了をhad notで表す。');
add('04','This must be the wrong address.','これはきっと間違った住所に違いありません。','mustが義務ではなく強い推量を表す。');
add('04','She might be at the library.','彼女は図書館にいるかもしれません。','確信が弱い現在の可能性。mayも自然な別表現。','She may be at the library. も自然。');
add('04','He cannot be at home. I just saw him at school.','彼が家にいるはずはありません。私はたった今、学校で彼を見かけました。','cannotが能力ではなく、根拠のある否定の推量を表す。');
add('06','The road is being repaired today.','その道路は今日、修理が行われているところです。','進行中の作業を受け身で述べる。');
add('06','Our computers are being checked now.','私たちのコンピューターは今、点検されているところです。','複数主語とare beingを合わせる。');
add('06','Is the meeting room being used now?','会議室は今、使われているところですか。','進行形の受け身を疑問文にする。');
add('08','It was difficult for me to understand the instructions.','その指示を理解することは、私には難しかったです。','仮主語itと過去形、for＋人＋toを組み合わせる。');
add('08','It is not safe for children to swim here.','ここで泳ぐことは、子供たちにとって安全ではありません。','仮主語の文を否定形にする。');
add('11','He stopped talking when the teacher arrived.','先生が来たとき、彼は話すのをやめました。','やめた対象をingで表す。','He stopped to talk to the teacher. は「先生と話すために立ち止まった」。');
add('11','He stopped to talk to the teacher.','彼は先生と話すために立ち止まりました。','立ち止まった目的をtoで表す。');
add('11','Please remember to lock the door.','忘れずにドアに鍵をかけてください。','これからする行動を忘れない、というremember＋to。');
add('11','I remember locking the door.','私はドアに鍵をかけたことを覚えています。','すでにした行動の記憶をremember＋ingで表す。');
add('13','We heard someone calling for help.','私たちは誰かが助けを呼んでいるのを聞きました。','聞こえてきた進行中の動作をingで説明する。');
add('13','I watched her cross the street.','私は彼女が通りを渡るのを見届けました。','一まとまりの動作を原形で捉える。','crossingなら、渡っている途中を見ていたという捉え方ができる。');
add('13','Did you see him leave the building?','彼がその建物を出るのを見ましたか。','知覚動詞の文を疑問文にし、目的語の後ろに原形を置く。');
add('14','Please keep the door closed.','ドアは閉まった状態にしておいてください。','閉まった状態を保つkeep＋目的語＋補語。');
add('14','The news made her happy.','その知らせは彼女を幸せな気持ちにしました。','make＋目的語＋形容詞で状態の変化を表す。');
add('14','I found the instructions difficult to understand.','私はその指示が理解しにくいと感じました。','find＋目的語＋形容詞と、それを補う不定詞。');
add('14','Please leave the window open.','窓は開けたままにしておいてください。','leave＋目的語＋形容詞で、ある状態のままにする。');
add('15','The man waiting outside is our coach.','外で待っている男性は私たちのコーチです。','自分で待っている人をingで説明する。');
add('15','The pictures taken by my mother are beautiful.','私の母が撮った写真は美しいです。','撮られた写真を過去分詞で説明し、複数主語に動詞を合わせる。');
add('16','The student who won the prize is in my class.','賞を取った生徒は私と同じクラスにいます。','主格の関係代名詞の後ろに動詞を続ける。');
add('16','The book that you lent me was interesting.','あなたが私に貸してくれた本は面白かったです。','目的格の関係代名詞の後ろに主語＋動詞を続ける。','thatの省略やwhichも自然。構文練習としての想定解。');
add('17','The girl whose mother teaches English is my friend.','母親が英語を教えている少女は私の友達です。','whose＋名詞で、人とその家族を結び付ける。');
add('17','I helped a boy whose bicycle was broken.','私は自転車が壊れていた少年を手伝いました。','所有物の説明をwhose節にする。');
add('17','Do you know the woman whose son lives abroad?','息子が海外に住んでいる女性を知っていますか。','whose節を含む文を疑問文にする。');
add('18','This is the library where I usually study.','ここは私がふだん勉強する図書館です。','場所とそこでの活動をwhereで結び付ける。');
add('18','I will never forget the day when we met.','私たちが出会った日のことを、私は決して忘れません。','日をwhenの節で説明し、否定の未来と組み合わせる。');
add('20','I wonder whether the museum is open today.','その博物館は今日開いているのだろうかと思います。','whether＋主語＋動詞で、〜かどうかを表す。','ifも自然な別表現。');
add('22','The instructions are easy enough for children to follow.','その指示は、子供たちでも従えるほど簡単です。','形容詞＋enough＋for人＋toの順序。');
add('22','It was too dark for us to see the path.','暗すぎて、私たちは小道を見ることができませんでした。','too＋形容詞＋for人＋toで程度と不可能を結ぶ。');
add('25','I wrote it down so that I would not forget it.','それを忘れないように、私は書き留めました。','so thatの目的節で否定を使う。');
add('25','The music was so loud that we could not talk.','音楽がとても大きかったので、私たちは話すことができませんでした。','so＋形容詞＋thatで、程度の結果を表す。');
add('26','If I lived near the station, I would walk there.','もし駅の近くに住んでいたら、私はそこまで歩くのですが。','現実と違う今の条件を過去形とwouldで表す。');
add('27','I wish I had more time to practice.','練習する時間がもっとあればいいのにと思います。','今、十分な時間がないという願いに過去形hadを使う。');
add('27','I wish our town had a larger library.','私たちの町に、もっと大きな図書館があればいいのにと思います。','主節と異なる主語を置いたwish＋過去形。');
add('30','Both Ken and I enjoy cooking.','ケンも私も、料理をすることを楽しんでいます。','both A and Bで主語を並列にし、複数として扱う。');
add('31','Would you mind helping me carry this box?','この箱を運ぶのを手伝っていただけますか。','相手に行動を依頼するmind＋ing。helpの後ろも確認する。');

const rows=original.map(q=>({...q,...assignments.get(q.number)}));
const final=[];
for(const t of topics){
 for(const row of rows.filter(r=>r.status==='keep'&&r.topic===t.id))final.push({topic:t.id,text:row.text,ja:row.displayMeaning,origin:'keep',sourceNumber:row.number,focus:t.goal,reason:'既存文を採用。'+t.goal,comparison:row.prompt?.formNote??''});
 final.push(...rewritten.filter(q=>q.topic===t.id),...additions.filter(q=>q.topic===t.id));
}
for(const [i,q] of final.entries()){
 q.id='draft-pre2-l3-'+String(i+1).padStart(3,'0');
 assert.ok(topics.some(t=>t.id===q.topic));assert.ok(q.text&&q.ja&&q.focus);
 if(q.origin!=='keep')assert.match(q.text,/^[\x20-\x7E]+$/,'ASCII typing text');
}
assert.equal(final.length,new Set(final.map(q=>q.text)).size,'No duplicate English targets');
for(const q of additions)assert.ok(!qs.some(old=>old.text===q.text),'Addition already exists: '+q.text);
for(const q of rewritten)assert.notEqual(q.text,original[q.sourceNumber-1].text);
const counts={existing:rows.length,keep:rows.filter(r=>r.status==='keep').length,remove:rows.filter(r=>r.status==='remove').length,rewrite:rewritten.length,add:additions.length,proposed:final.length};
const special={6:'前提：相手が「私はその映画が好きではありません」と言った場面。一般動詞の否定への同意を練習する。',94:'仮定した場面について尋ねるwouldの疑問文。状況の具体例は実装時に補う。',143:'as ifは常に仮定法になるわけではない。この文は現実と違うかのような言い方として扱う。',171:'全部が不要だとは思わない、という否定の範囲。二重の否定を含むため総合復習寄り。'};
for(const q of final){if(special[q.sourceNumber])q.comparison=[q.comparison,special[q.sourceNumber]].filter(Boolean).join(' ');}
const focuses={
 6:'一般動詞の否定への同意で、neither＋do＋主語の順にする。',24:'couldが過去ではなく、時間がかかる可能性を表す。',29:'Is it OK if ...?の中に、自分がしてよいか尋ねる行動を置く。',33:'let＋人＋原形で、自分がすることを申し出る。',42:'if you likeの条件を添えて、相手に選択を任せる。',45:'疑問になっている外側と、meanの後ろの平叙文を区別する。',49:'feel freeの後ろをto＋原形にする。',55:'whereの後ろをthe bus stopsの語順にし、doesを入れない。',57:'have no ideaの後ろに、where＋主語＋動詞を続ける。',62:'make＋人＋原形と、feel＋形容詞を組み合わせる。',63:'慣れているbe used toの後ろには動名詞を置く。過去の習慣と比較する。',65:'thank you forの後ろを動名詞にし、help＋人＋動詞も確認する。',66:'see＋人＋ingで、動作が進行しているところを捉える。',68:'相手にしてほしいことを、Would you mind＋ingで依頼する。',69:'withoutの後ろに動名詞を続け、しなかった行動を表す。',70:'mindの後ろの動名詞と、依頼に応じる際の否定の返事の意味を確認する。',71:'be worthの後ろには動名詞を置く。twiceは読む回数。',72:'自分の行動への許可を、Do you mind if＋文で尋ねる。',73:'wonderingの後ろに、〜かどうかを表すif＋主語＋動詞を続ける。',75:'to hearが、驚いた理由を表す。',76:'old＋enough＋toの語順で、行動できる十分な年齢を表す。',77:'whyの後ろをhe changedの語順にする。',80:'avoidの後ろは動名詞。',81:'meanの後ろに、意味する内容をthat節で置く。',82:'not only A but also Bで、二つの形容詞を並べる。',83:'mustの後ろをbe＋過去分詞にする。brokenは名詞の前の分詞。',84:'will＋主語＋be＋過去分詞という受け身の疑問文を作る。',85:'提案のWhat do you say to ...?のtoは前置詞なので後ろは動名詞。',87:'現在のI hearから内容を伝える。that節を機械的に過去へ変えない。',89:'would like＋人＋toで、相手にしてほしい行動を述べる。',90:'have just＋過去分詞で、今ちょうど完了したことを表す。',91:'girlの後ろのcarryingが、女の子自身の動作を説明する。',92:'look forward toのtoは前置詞。後ろはhearing。',94:'仮定した場面での行動をwouldの疑問文で尋ねる。',95:'knowの後ろのifは条件ではなく、〜かどうかを表す。',96:'形式的な主語it、行う人for us、内容to saveの順にする。',97:'have＋主語＋ever＋過去分詞で経験を尋ねる。',98:'has not＋過去分詞とyetで、今も未完了であることを表す。',99:'署名される用紙を主語にし、must be signedとする。',100:'too＋形容詞＋for人＋toで、できないほどの程度を表す。',101:'未来の到着でも、時を表すas soon asの節は現在形。',102:'have not decidedと、which＋名詞＋toを組み合わせる。',104:'thinkの目的語にthat節を置き、その中でneedを使う。',105:'happen to＋原形で、偶然行動したことを表す。',107:'図書館へ行った目的をto doで表す。',108:'間接疑問の中ではthis ticket costsの語順にする。',111:'現在までの継続に現在完了、始点となる卒業にはsince＋過去形。',112:'have been＋ingとfor＋期間で、今まで続く活動を述べる。',113:'allow＋人＋toの形を否定文で使う。',114:'remind＋人＋toで、これからすることを思い出させる。',115:'letの後ろに、人とtoのない原形を置く。',116:'whileの節で、その時進行していた別の動作を過去進行形にする。',119:'主格のwhoの後ろにlivesを続け、先行詞womanを説明する。',120:'未来の条件でもif節は現在形、主節はwill＋原形。',121:'as well asで、同じ前置詞の目的語となる二つの楽器を並べる。',122:'twice＋as＋形容詞＋asで、二倍の速さを表す。',123:'unlessが否定の条件を表す。unless節の未来は現在形にする。',124:'althoughで、予想とは反対の出来事を結び付ける。',125:'When it comes toのtoは前置詞。後ろを動名詞にする。',126:'目的格thatの後ろをI boughtで続け、cameraを説明する。',127:'one of＋the＋最上級＋複数名詞の形を使う。',128:'製品を主語にして、原料から作られる受け身を表す。',129:'languageの後ろに、話されるという過去分詞の説明を置く。',130:'比較級を強めるmuchと、比較対象を示すthanを使う。',132:'How long＋現在完了で、今までの継続期間を尋ねる。',133:'中止されたコンサートを主語にし、理由をbecause of＋名詞で添える。',134:'encourage＋人＋toで、参加するよう勧める。',135:'so＋形容詞＋thatで、程度から生じた結果を説明する。',136:'so thatで、理解してもらう目的を表す。',137:'伝えられた質問のwhereの後ろは、疑問文ではなくI livedの語順。',139:'今はできない願いを、wish＋couldで表す。',141:'今清掃されている作業を、is being cleanedと表す。',142:'townをwhereの節で説明し、そこで育ったことを伝える。',143:'as if＋過去形で、実際とは違うかのような様子を表す。',144:'Now thatで、今は準備が整ったことを理由にする。',145:'到着した過去より前の出発を、had＋過去分詞で示す。',146:'whether or notの後ろに、来られるかどうかを平叙文の語順で続ける。',147:'電話した時点より前に済んでいた食事を過去完了で述べる。',149:'It is said thatの受け身で、伝えられている内容を述べる。',150:'whose＋fatherを主語にした節で、少年と父親を結び付ける。',151:'dayの後ろに、初めて会った時をwhenの節で説明する。',152:'過去に聞いた未来の発言をwouldで伝える。',154:'現実と違う立場If I were youとwouldで助言する。',156:'prefer A to Bで、同じ動名詞の形を比べる。',157:'過去の発言時点で進行していた動作をwas lookingで伝える。',159:'will＋be＋過去分詞で、今後建設されるものを主語にする。',161:'引っ越した時点までの未経験をhad never＋過去分詞で表す。',162:'the＋比較級を二回使い、変化が連動することを表す。',163:'今は時間が十分でない仮定を、if＋過去形とwouldで表す。',166:'二つの集団の違いをwhileで対比し、some / othersを使う。',170:'it＋形容詞＋toの形で、何が重要かを説明する。',171:'not thinkとall ... unnecessaryの組合せで、全面否定との違いを確認する。'
};
focuses[60]='why＋be動詞＋主語＋過去分詞で、延期された理由を尋ねる。';
for(const q of final.filter(q=>q.origin==='keep')){
 assert.ok(focuses[q.sourceNumber],'Missing individual focus '+q.sourceNumber);
 q.focus=focuses[q.sourceNumber];rows[q.sourceNumber-1].reason='残す：'+q.focus;
}
const metrics=list=>({meanCharacters:Number((list.reduce((s,q)=>s+q.text.length,0)/list.length).toFixed(1)),maxCharacters:Math.max(...list.map(q=>q.text.length)),meanWords:Number((list.reduce((s,q)=>s+(q.text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g)||[]).length,0)/list.length).toFixed(1))});
for(const t of topics){t.kept=final.filter(q=>q.topic===t.id&&q.origin==='keep').length;t.rewritten=final.filter(q=>q.topic===t.id&&q.origin==='rewrite').length;t.added=final.filter(q=>q.topic===t.id&&q.origin==='add').length;t.total=t.kept+t.rewritten+t.added;assert.ok(t.total>=4,t.title);}
assert.equal(counts.keep+counts.remove+counts.rewrite,173);
assert.equal(counts.keep+counts.rewrite+counts.add,counts.proposed);
const proposal={date:'2026-10-19',status:'proposal-only',course:'EikenPre2',level:3,sourceQuestionsSha256:sha(JSON.stringify(QUESTIONS)),sourcePromptsSha256:sha(fs.readFileSync(path.resolve(dir,'../../src/data/translationBattlePrompts.json'))),counts,metrics:{existing:metrics(qs),proposed:metrics(final)},topics,existing:rows,proposed:final,sources:[
 {title:'英検公式：準2級の試験内容・高校中級程度の目安',url:'https://www.eiken.or.jp/eiken/exam/grade_p2/solutions.html'},
 {title:'British Council：条件文（文法確認用。英検の級との一対一対応ではありません）',url:'https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/conditionals-zero-first-second'},
 {title:'British Council：間接話法（時制を戻さない場合も説明）',url:'https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/reported-speech-statements'},
 {title:'British Council：stop / rememberなどの後ろの形と意味',url:'https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/verbs-followed-ing-or-infinitive-change-meaning'}
]};
fs.writeFileSync(path.join(dir,'proposal.json'),JSON.stringify(proposal,null,2)+'\n');
console.log(JSON.stringify(counts));
console.log(topics.map(t=>t.id+' '+t.title+': '+t.kept+' retained + '+t.rewritten+' revised + '+t.added+' new = '+t.total).join('\n'));
