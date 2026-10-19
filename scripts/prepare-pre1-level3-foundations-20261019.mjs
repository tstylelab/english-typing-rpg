import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {load} from './lib/load-typescript-data.mjs';
const plan=JSON.parse(fs.readFileSync('docs/pre1-level3-check-2026-10-19/review.json','utf8'));
const dir='docs/pre1-level3-foundations-2026-10-19';
assert.ok(!fs.existsSync(dir+'/release.json'),'Preserve the first review baseline; do not reapply over later work.');
const {QUESTIONS}=load('src/data/questions.ts');
const original=JSON.parse(JSON.stringify(QUESTIONS));
const {pre1GrammarCards:existingCards}=load('src/data/pre1GrammarGuide.ts');
const {pre1GrammarAssignments}=load('src/data/pre1GrammarAssignments.ts');
const point=(label,pattern,note)=>({label,pattern,note});
const originalPoints={
 'embedded-question':['文の中に入る疑問の内容','動詞 + why/how/where + 主語 + 動詞','疑問詞から始まるまとまりが、理解する・確かめる内容です。その内側は普通の主語と動詞の順にします。'],
 'what-clause':['what節が表す内容','what + 主語 + 動詞','what以下を「〜すること」というひとまとまりとして使います。文全体の主語・目的語・補語のどの位置にあるかを確認します。'],
 'questions':['疑問詞の役割と語順','What + do + 主語 + 動詞? / What + 動詞 ...?','whatが主語なのか、動詞の内容を尋ねる目的語なのかで、助動詞を置く語順が異なります。'],
 'requests':['助動詞を使う依頼','Could/Can you + 動詞の原形?','相手に説明や行動を頼む形です。couldはこの依頼では過去の能力を述べていません。'],
 'make-person':['使役動詞と行動する人','What makes + 人 + 動詞の原形?','whatが原因を尋ねる主語です。makesの後ろに行動する人、その後ろに原形の動詞を置きます。'],
 'let':['自分に行動させてもらう','Let me + 動詞の原形','行動をする人はmeです。letに人と動詞の原形を続け、自分が考える・確認する・言い直すことを申し出ます。'],
 'make-clear':['目的語の状態を述べる補語','make + 目的語 + clear','目的語の内容を明確な状態にする形です。clearは形容詞で、makes you sayの原形の動詞とは区別します。'],
 'to-modifier':['名詞を説明する不定詞','way/time + to + 動詞の原形','to以下が、どんな方法・何をする時間かを名詞の後ろから説明します。動詞の目的を直接述べる不定詞とは区別します。'],
 'viewpoint':['見方を示す副詞','see + 目的語 + 副詞','seeはこの文ではどのように物事を捉えるかという意味です。differentlyが見方の違いを示し、a littleがその程度を添えます。'],
 'viewpoint-understanding':['比喩的な方向と疑問詞節','see/get + where + 主語 + 動詞','where以下は話の背景や行き先を表す比喩です。理解することと、その意見への賛成は同じとは限りません。'],
 'conditional-intro':['内容が続く前置きの節','If/When + 主語 + 動詞, 主節','会話では前置きだけで反応を含ませられます。文章の骨組みを考えるときは、後ろに主節を続ける形も確認します。'],
 'rephrase-intro':['言い換えを導く不定詞の前置き','To put it + 説明の仕方, 文','どう説明するかを前置きする定型表現です。後ろに説明内容を続ける形も練習し、目的の不定詞だけに当てはめません。'],
 'stance-intro':['判断の立場・根拠を示す前置き','意見・根拠の前置き, 主語 + 動詞','自分の見方や分かる範囲を前置きしています。この収録文は前置きだけで、判断の中身は会話の文脈に委ねられています。'],
 'agreement':['同意・容認・反対を表す','be with / be for / be against / go with','前置詞や動詞の組合せで判断の立場を表します。積極的な賛成、受け入れられること、反対ではないことの強さを区別します。'],
 'partial':['同意する範囲を限定する','up to a point / partly / in a way','全面的な賛成とせず、範囲や見方を限定しています。限定する表現が、賛成・正しさのどこに掛かるかを見ます。'],
 'partial-negative':['否定の及ぶ範囲','not + always/entirely/fully/quite','いつもとは限らない、完全にとは言えない、ぴったり一致しないという否定です。全否定と同じには扱いません。'],
 'sure-clause':['確信できない内容と省略','be not sure/convinced + (that) + 文','確信できない内容を節で続けたり、文脈から分かる内容を省いたりします。否定している範囲に注目します。'],
 'not-necessarily':['必然性の部分否定','not necessarily mean + (that) + 文','二つの内容が必ず結び付くとは限らないという意味です。後ろの内容を全面的に否定しているわけではありません。'],
 'saying-negative':['発言内容の否定と範囲','be not saying + (that) + 文','その内容を主張しているわけではない、と発言の受け取られ方を訂正します。内容を直接否定する文とは分けて考えます。'],
 'would-stance':['仮の立場・状況からの判断','would / would not + 動詞の原形','自分なら、そういう状況なら、という判断を控えめに示します。単に過去の出来事を述べる形とは限りません。'],
 'possibility':['可能性を表す助動詞','may/might/could + 動詞の原形','あり得ることを断定せず述べます。助動詞どうしの確率を固定の数字で区別しません。'],
 'chance':['可能性の内容を名詞で示す','a chance + (that) + 文 / a possibility','chanceやpossibilityで可能性を表します。後ろの節があれば、それがどんな可能性かという中身です。'],
 'tendency':['傾向・やや傾いた判断','tend to / be inclined to + 動詞の原形','習慣や考えの傾向を示します。いつでも必ずそうだと断定するのではなく、判断の強さを調整しています。'],
 'depend':['判断の条件と前置詞','depend on + 名詞/疑問詞節','onの後ろに判断が何によるかを置きます。疑問詞節なら、その中は普通の主語と動詞の語順です。'],
 'sense':['定型表現の比喩的な意味','make sense / add up / see the logic','説明の意味が通る、筋道が理解できるという表現です。物理的な視覚や数の加算としてだけ読まないようにします。'],
 'practical-response':['提案への返答と比喩的な意味','work for / work with / be more like','提案・条件が自分に合うか、期待していた状態に近いかを述べます。どの予定や条件の話かは文脈で補います。'],
 'rather':['好む行動と原形','would rather (not) + 動詞の原形','自分がどちらを望むかを述べます。自分の行動を続けるこの形では、動詞を不定詞や動名詞にしません。'],
 'should':['望ましい対応の提案','should + 動詞の原形','今どの対応が望ましいかを提案します。過去への後悔を表すshould haveとは形が違います。'],
 'that-content':['発言・考えの内容節','think/say + (that) + 主語 + 動詞','考えや発言の中身を節で続けています。省略できる接続詞のthatと、物事を指す主語のthatを区別します。'],
 'noun-phrase':['名詞句と代用語','a/an + 形容詞 + 名詞 / the only one','冠詞・形容詞・名詞で評価する対象を示します。oneがあれば、前に出た数えられる名詞を代わりに表す役割も確認します。'],
 'it-to':['形式主語と不定詞','It is + 形容詞 + to + 動詞の原形','先に仮の主語itを置き、後ろの不定詞で評価する行動を示しています。'],
 'worth':['価値のある対象・行動','be worth + 名詞/動名詞','worthの後ろに名詞や動詞のing形を続けます。worth to doという形にはしません。'],
 'past-perfect':['過去の基準以前を振り返る','had not + 過去分詞','相手の説明を聞いた時点などを基準に、それ以前にはそう考えていなかったと振り返ります。'],
 'perfect-change':['変化と現在完了','have come to + 動詞の原形','考えが変わって、今はそう思うようになっていることを述べます。comeの後ろにto不定詞を続けています。'],
 'perfect-experience':['現在までの経験','have + 過去分詞 + before','現在までに同じ感情を経験したことがあると述べています。特定の過去の時だけを指定する過去形とは視点が違います。'],
 'modal-perfect':['過去についての強い推量','must have + 過去分詞','過去の出来事について、きっと大変だったのだろうと推量しています。義務を表すmustとは意味を分けます。'],
 'progressive':['進行・一時的な取り組み','be + 動詞-ing','今取り組んでいることや一時的な姿勢を進行形で示します。動作の機械的な進行だけに限りません。'],
 'past-progressive':['過去の時点での思考','was + 動詞-ing','過去のある時点で思っていたことを述べています。justが、ちょうどそのときだったことを添えます。'],
 'being':['一時的な振る舞い・態度','be being + 形容詞','今そういう態度を取っていると述べます。be beingは、すべての状態を表す形容詞と自由に使えるわけではありません。'],
 'modal-progressive':['助動詞と進行形','may/might + be + 動詞-ing','今していることや一時的な状態について、断定せず可能性を述べます。'],
 'contrast':['前の内容を受けて別の面を示す','on the other hand / still / even so','前に認めた内容に対して別の面や留保を続ける表現です。何と何を対比しているかを会話の中で確かめます。'],
 'reason':['理由を受ける前置詞句','For that reason, 主語 + 動詞','前に述べた事情を理由として受け、判断を続けます。この句だけでは、具体的な理由の内容は分かりません。'],
 'empathy':['経験・気持ちへの理解','relate to / know what ... is like','似た経験や状況を理解できるという表現です。理解できることと、相手の行動すべてに賛成することは別です。'],
 'sound-seem':['印象を表す補語','sound/seem + 形容詞 / sound like + 名詞','聞いた印象や見込まれる様子を述べます。形容詞を続ける形と、likeの後ろに名詞を置く形を区別します。'],
 'blame-for':['理由の前置詞と動名詞','blame + 人 + for + 動詞-ing','責める理由をfor以下に続けます。forは前置詞なので、行動や感情を動詞で述べるならing形を使います。'],
 'comparison':['比較する程度と基準','not as + 原級 + as / 比較級 + than','同じ程度かどうか、またはどちらの程度が上かを比べます。比較の基準が何かも確認します。'],
 'more-to':['表面に出ていない事情','There is more to ... than ...','すでに述べられた説明に加えて、さらに事情があることを示します。単に物の個数だけを比べていません。'],
 'too-to':['程度と実現しにくさ','too + 形容詞 + to + 動詞の原形','判断できないほど早いという程度を示します。tellはここでは分かる・判断するという意味です。'],
 'hypothetical':['事実から距離を置く仮定','would + 原形 + if + 主語 + 過去形','仮にその内容が本当だとしても驚かない、という判断です。実際に過去に起きたことを述べる形とは区別します。'],
 'easier-said':['比較級と過去分詞','be easier said than done','言う容易さと実行する容易さを比べる定型表現です。saidとdoneが過去分詞でも、この文全体は過去の話ではありません。'],
 'ready-to':['行動の準備・必要・努力','be ready to / need to / try to + 原形','行動を始められる状態、必要性、行動しようとする努力を表す形です。toの前の語によって意味が変わります。'],
 'cause':['可能性と結果を表す前置詞','could lead to + 名詞','起こり得る結果をlead toの後ろに置きます。このtoは前置詞で、動詞の原形を導くto不定詞ではありません。'],
 'relative-object':['目的格関係代名詞の省略','名詞 + (that) + 主語 + 動詞','名詞を説明する節で目的語が欠け、その内容が前の名詞に当たります。ここでは目的格の関係代名詞が省かれています。'],
 'lets-not':['行動をしない提案','Let us not + 動詞の原形','自分も含めた行動について、しないようにしようと提案します。主語weに対応する再帰代名詞も確かめます。'],
 'perception':['目的語の様子を表す分詞','see + 目的語 + 動詞-ing','thatは起こる事柄を指す目的語、happeningはその様子を表す分詞です。この文では起こる場面を想像できるという意味です。'],
 'wh-to':['疑問詞と不定詞','what + to + 動詞の原形','どう解釈すればよいかという内容を、疑問詞と不定詞で表します。make ofは作ることではなく、解釈・評価する意味です。'],
 'litotes':['否定による控えめな肯定','not a bad + 名詞','悪くはないという否定で、一定の肯定を伝えます。どれほど強い賛成かは口調や文脈にもよります。'],
 'thought':['考えが浮かぶ表現と過去形','主語 + crossed + 人のmind','考えが頭をよぎったという意味です。crossedは過去形で、物理的に何かを横断したという意味ではありません。'],
 'undecided':['決めかねる状態と前置詞句','be on the fence about + 内容','賛否や選択を決めかねているという慣用表現です。aboutの後ろが迷っている対象です。'],
 'indirect-if':['〜かどうかを表すif節','know + if + 主語 + 動詞','if節が分からない内容を表します。この文のifは、もし〜ならという条件ではありません。'],
};
const specific={
 'I know what that\'s like.':['経験に基づく理解','know + what + 主語 + be like','what that is likeが、どんなものかという内容です。ここでは経験があるのでその状況が分かる、と伝えます。'],
 "I'm with you on that.":['同意する点を示す','be with + 人 + on + 内容','この文では、相手と意見が同じだと述べます。on thatで、どの点について同意するかを示しています。'],
 "I'm not sure I'm with you there.":['同意・理解への留保','be not sure + (that) + 文','内側のI am with youは、同意している場合にも、説明についていける場合にも使えます。今回の表示和訳は同意への留保です。'],
 'You may have a point there.':['助動詞と現在のhave','may + have + a point','have a pointは一理あるという現在の内容です。haveの後ろが名詞なので、助動詞と完了形の組合せではありません。'],
 "I'd have to think about that.":['仮の判断と必要性','would + have to + 動詞の原形',"I'dはI would。have to thinkは考える必要があるという意味で、would haveと過去分詞の完了形ではありません。"],
 'That must have been difficult.':['過去の出来事を推量する','must have been + 形容詞','haveの後ろにbeの過去分詞beenがあり、過去の大変さを強く推量しています。have a pointのhaveとは形が違います。'],
 'Sounds about right.':['会話での主語の省略','(That/It) sounds + 形容詞','会話で分かる主語を省いた自然な返答です。aboutはここでは程度をやわらげ、だいたい正しそうだと伝えます。'],
 'I can see the logic behind that.':['理解のseeと名詞句','see + the logic behind + 内容','目的語はthe logic。behind thatがどの考えの筋道かを説明しています。理解できることと賛成は同じではありません。'],
 "I'm still figuring that out.":['句動詞の進行形と代名詞','be figuring + 代名詞 + out','figure outは考えて分かる・答えを見つける意味。目的語が代名詞thatなので、figuringとoutの間に置きます。'],
 'What exactly do you mean?':['目的語を尋ねる疑問文','What + do + 主語 + mean?','youが主語で、meanの内容をwhatで尋ねます。exactlyはどの意味かを具体的に確かめる副詞です。'],
 'What brought you to that conclusion?':['主語を尋ねる疑問文','What + brought + 人 + to + 結論?','whatが結論へ導いた要因を尋ねる主語です。broughtはbringの過去形で、この形にdidを足す必要はありません。'],
 'We need to be realistic about this.':['必要性と不定詞','need to + be + 形容詞','needの後ろにto be realisticを続け、現実的である必要を述べています。beは動詞の原形です。'],
 "I'm trying to be careful.":['努力を表す進行形と不定詞','be trying to + be + 形容詞','今、慎重であろうと心がけています。tryingの後ろのto beが目指す状態を示しています。'],
 "I'm trying to look at both sides.":['努力を表す進行形と不定詞','be trying to + 動詞の原形','今、両方の立場から見るように努めています。bothは二つの立場のどちらも、という意味です。'],
 "I'm not ready to commit to that.":['準備を表す不定詞と前置詞','be not ready to commit to + 内容','最初のto commitは不定詞、次のto thatはcommitの対象を示す前置詞句です。二つのtoの役割を分けます。'],
 "I'm not ready to rule it out.":['行動の準備と句動詞','be not ready to + rule + 代名詞 + out','可能性を外す判断をする準備がまだないと述べます。rule outの目的語itは二つの語の間に置いています。'],
};
// Two further contexts for each accepted priority target; retain the reviewed sample.
const further={
 EikenPre1Part1:[
  [['What concerns us is whether the water is safe.','私たちが心配しているのは、その水が安全かどうかです。'],['What we need is a plan that everyone can follow.','私たちに必要なのは、誰でも従える計画です。']],
  [['Whatever she recommends deserves consideration.','彼女が何を勧めても、検討する価値があります。'],['Whatever happens will be recorded automatically.','何が起きても、自動的に記録されます。']],
  [['Our main office, which is near the station, is small.','私たちの本社は小さいです。ちなみに、駅の近くにあります。'],['This device, which uses little power, is reliable.','この装置は信頼できます。ちなみに、消費電力が少ないです。']],
  [['The system on which we depend is being upgraded.','私たちが頼っているシステムは、改良されているところです。'],['The rules under which they operate are unclear.','彼らが従って活動する規則は不明確です。']],
  [['Given enough time, we could solve the problem.','十分な時間が与えられれば、私たちはその問題を解決できるでしょう。'],['Delayed by the storm, we arrived after midnight.','嵐で足止めされ、私たちは真夜中を過ぎて到着しました。']],
  [['When asked for details, he referred to the report.','詳細を尋ねられると、彼はその報告書に言及しました。'],['While waiting for approval, she revised the budget.','承認を待つ間、彼女は予算を修正しました。']],
  [['We had been discussing the issue when she called.','彼女から電話が来たとき、私たちはその問題についてそれまで話し合いを続けていました。'],['He had been saving for years before he bought a home.','彼は家を買う前、それまで何年も貯金を続けていました。']],
  [['They cannot have received the goods so quickly.','彼らがそんなに早く品物を受け取ったはずがありません。'],['He cannot have read the entire report in a minute.','彼が1分で報告書全体を読んだはずがありません。']],
  [['The figures may have been entered incorrectly.','その数値は、間違って入力されたのかもしれません。'],['The meeting may have been postponed again.','その会議は、また延期されたのかもしれません。']],
  [['If we had invested sooner, we would be safer now.','もしもっと早く投資していたら、私たちは今もっと安全な状況にいるでしょう。'],['If she had taken the job, she would live abroad now.','もしその仕事を引き受けていたら、彼女は今外国で暮らしているでしょう。']],
  [['But for the grant, the study would have ended.','その助成金がなかったら、その研究は終わってしまっていたでしょう。'],['But for the warning, we would have used that road.','その警告がなかったら、私たちはその道を使っていたでしょう。']],
  [['She considers it important to protect local jobs.','彼女は、地元の雇用を守ることが重要だと考えています。'],['They found it impossible to meet the deadline.','彼らは、その締め切りを守ることは不可能だと分かりました。']],
 ],
 EikenPre1Part2:[
  [['Even if they object, we will explain our reasons.','たとえ彼らが反対しても、私たちは理由を説明します。'],['Even if demand falls, the service will remain.','たとえ需要が減っても、そのサービスは存続します。']],
  [['You may attend provided that you register first.','先に登録するという条件なら、参加して構いません。'],['They will help provided that we share the costs.','私たちが費用を分担するという条件なら、彼らは協力してくれます。']],
  [['We can agree as long as the terms are fair.','条件が公平であれば、私たちは同意できます。'],['You can borrow it as long as you return it today.','今日返すのであれば、それを借りて構いません。']],
  [['Not every applicant meets the requirements.','すべての応募者が要件を満たしているわけではありません。'],['Not all the evidence supports that conclusion.','すべての証拠がその結論を裏付けているわけではありません。']],
  [['More spending does not necessarily solve the problem.','支出を増やすことが、必ずしも問題を解決するとは限りません。'],['A delay does not necessarily mean failure.','遅れは、必ずしも失敗を意味するわけではありません。']],
  [['Our goal is not growth but long-term stability.','私たちの目標は成長ではなく長期的な安定です。'],['She blamed not the staff but the system.','彼女は職員ではなくシステムを責めました。']],
  [['Now that funding is secure, we can hire more staff.','資金が確保された今では、私たちは職員を増やせます。'],['Now that everyone is here, we can begin.','全員がここにそろったので、私たちは始められます。']],
  [['The report was so clear that no one had questions.','報告書がとても明確だったので、誰からも質問が出ませんでした。'],['The demand was so great that supplies ran out.','需要がとても大きかったので、物資が底をつきました。']],
  [['It was such a complex issue that we needed advice.','それはとても複雑な問題だったので、私たちは助言を必要としました。'],['She gave such a clear explanation that we agreed.','彼女はとても明確に説明したので、私たちは同意しました。']],
  [['He asked whether the deadline had been extended.','彼は、締め切りが延長されていたかどうか尋ねました。'],['They asked whether we had checked the figures.','彼らは、私たちが数値を確認していたかどうか尋ねました。']],
  [['The new battery lasts twice as long as the old one.','その新しい電池は、古いものの2倍長持ちします。'],['This hall is three times as large as that one.','このホールは、あのホールの3倍の広さです。']],
  [['She should have checked the source before sharing it.','彼女はそれを共有する前に、情報源を確認しておくべきでした。'],['They should have warned us about the risks.','彼らは、その危険について私たちに警告しておくべきでした。']],
 ],
};
const teachings={
 EikenPre1Part1:[
  ['What + 文 + is + 内容','what節全体を文の主語にします。isの後ろは、何が必要・重要・心配かという内容です。','この3文ではwhat節全体を単数として扱います。whetherは〜かどうかという内容を導き、関係代名詞のwhatとは役割が異なります。'],
  ['Whatever + 主語 + 動詞 / Whatever + 動詞','whateverで何を選んでも・何が起きてもという範囲を含め、節全体を主語にします。','Whatever she recommendsではsheが主語、Whatever happensではwhatever自体が主語です。後半の動詞の一致と節の役割を確認します。'],
  ['主語の名詞, which + 補足, 主節の動詞 + 続き','すでに特定されているものについて、コンマで区切る関係詞節で情報を補足します。','主節と補足の二つの動詞を見分けます。この非制限用法のwhichをthatに置き換えることはできません。'],
  ['名詞 + 前置詞 + which + 主語 + 動詞','関係詞節の中の動詞や意味に合う前置詞を、whichの直前に置きます。','depend on、operate under、手段のbyなど、元の結び付きを確かめます。場所や物の名詞を見て、前置詞を機械的に決めるわけではありません。'],
  ['過去分詞のまとまり, 主節','文頭の過去分詞のまとまりが主節の主語の状況・理由・条件を添えます。省略された主語の対応を確認します。','Askedは尋ねられた人、Givenは時間を与えられる側、Delayedは遅れさせられた人です。動詞の形だけでなく、主節の主語が行動を受ける側かを確かめます。'],
  ['While/When + 分詞のまとまり, 主節','主節と同じ主語について、接続詞の後ろを分詞のまとまりに縮めます。能動と受け身で分詞の形が変わります。','while reviewingでは自分が見直し、when askedでは自分が尋ねられます。主語の異なる節を同じように縮めないようにします。'],
  ['had been + 動詞-ing + 過去の基準','過去の基準時点まで続いていた動作を、had beenとing形で表します。','過去完了had workedとの意味の重なりはありますが、ここでは続けていた活動に注目します。when/beforeの節は基準となる出来事を示します。'],
  ['cannot have + 過去分詞','過去の出来事について、したはずがないという強い否定の推量を述べます。','cannot haveは推量であり、単にそのとき能力がなかったという意味とは違います。can\'t haveも自然な短縮形です。'],
  ['may have been + 過去分詞','過去に何かがされた可能性を、助動詞・完了形・受け身で組み立てます。','may haveは過去の可能性、beenと過去分詞は受け身です。might have beenも自然で、確率だけを理由に誤りとしません。'],
  ['If + had + 過去分詞, would + 原形 + now','条件は実際とは違う過去、結果は現在です。混合仮定法として二つの時点を分けます。','過去の結果ならwould haveと過去分詞にする形がありますが、この3文はnowで現在の状態を明示しています。'],
  ['But for + 名詞, would have + 過去分詞','もしその助けや出来事がなかったら、という仮定を前置詞句で示します。後半は実際とは異なる過去の結果です。','withoutやIf it had not been forでも自然に表せます。文頭のBut forは、普通の文を逆接でつなぐbutとは構造が違います。'],
  ['find/consider + it + 形容詞 + to不定詞','仮の目的語itを先に置き、後ろの不定詞で何が難しい・重要・不可能かという内容を示します。','We found it difficult to obtain ...では、目的語itは後ろのto以下の内容を先に受けています。itを必ず前に出た物を指す「それ」として訳す必要はありません。'],
 ],
 EikenPre1Part2:[
  ['Even if + 文, 主節','事実だとは確定していない条件を認めても、主節の判断・行動は変わらないと伝えます。','Even thoughはすでに認める事実についての譲歩にも使います。日本語の「〜ても」だけで選ばせず、仮の条件かどうかを補足します。'],
  ['主節 + provided that + 文','ある条件が満たされる場合に限って、許可や協力などを述べます。','providing that、if、on condition thatなども文脈により自然です。今回練習する接続の形と、同義の別表現を区別します。'],
  ['主節 + as long as + 文','条件が満たされればという意味で許可や同意を述べます。','as long asには期間の意味もありますが、この3文は条件です。別の接続詞でも表せることと、今回の練習する型を分けます。'],
  ['Not all + 複数名詞・不可算名詞 / Not every + 単数名詞','全員・全部が当てはまるわけではないという部分否定です。誰も・何も当てはまらないと断定する形とは違います。','not every applicantでは中心の名詞が単数なのでmeets。evidenceはこの意味で不可算名詞なのでsupportsとします。'],
  ['主語 + do/does not necessarily + 動詞','必ずそうなる、必ずそう結び付くという必然性を否定します。','meanの後ろは名詞句でも構いません。more spendingが主語なら、活動全体を受けてdoesとなります。'],
  ['not + A + but + B','AではなくBという対比で、何が問題・目標・責める対象なのかを示します。','AとBはこの3文では名詞句です。The issue is not ...なら補語、She blamed not ...なら目的語の位置で、二つの内容を対比しています。'],
  ['Now that + 文, 主節','新しく成立した状況を理由にして、その結果可能になることや変化を述べます。','becauseやsinceで言い換えることもできます。now thatは、今その状況が成立したことを理由に、次の行動や変化へ話を進める表現です。'],
  ['so + 形容詞 + that + 結果の文','形容詞の程度を強め、その程度から生じた結果をthat節で述べます。','so high/clear/greatではsoの直後が形容詞です。so thatだけで目的を示す文と区別します。'],
  ['such + a/an + 形容詞 + 名詞 + that + 文','形容詞と名詞を含むまとまりの程度を強め、結果をthat節で続けます。','a useful courseはusefulの最初の音が子音なのでaです。so useful a courseという別の語順もありますが、今回はsuchの型を練習します。'],
  ['asked + whether + 主語 + had + 過去分詞','過去に尋ねた内容を間接疑問で伝え、それより前の完了を過去完了で示します。','whether節の内側を疑問文の語順にしません。ifも〜かどうかの意味で使える場合があるので、条件のifとの違いも含めて説明します。'],
  ['倍数 + as + 形容詞/副詞 + as + 比較相手','程度・時間の長さを倍数で比べます。2倍を超える場合はmore than twiceです。','asの後ろの形容詞・副詞は比較級ではなく原級です。比較相手を省く文では、出題時の場面にどの方法と比べるかを示します。'],
  ['should have + 過去分詞','実際にはしなかった行動について、しておくべきだったと振り返る3文です。','should haveは文脈によって「もう着いているはずだ」という予想にもなります。この練習では後悔の意味であることを日本語に明示します。'],
 ],
};
const additional={},points={},cards=[],assignments={};
for(const c of plan.courses){
 const course=c.course,targets=c.proposed.filter(p=>p.priority==='優先');assert.equal(targets.length,12);points[course]={};assignments[course]={};
 for(const q of original[course][3]){const id=pre1GrammarAssignments[course][q.text],meta=specific[q.text]??originalPoints[id];assert.ok(meta,id+' '+q.text);points[course][q.text]=point(...meta);}
 additional[course]=targets.flatMap((t,i)=>{
  const [pattern,note,more]=teachings[course][i],id='core-'+(course.endsWith('1')?'a':'b')+'-'+String(i+1).padStart(2,'0');
  const pairs=[[t.text,t.meaning],...further[course][i]];
  cards.push({id,section:3,title:t.target,subtitle:'短い文で意味と形を組み立てる',term:t.target,pattern,tip:note,more,examples:pairs.slice(0,2)});
  return pairs.map(([text,translation],j)=>{assignments[course][text]=id;return{topic:t.target,group:t.group,question:{text,translation,grammarPoint:point(t.target,pattern,note)},formNote:t.formNote,sampleNumber:j+1};});
 });
 assert.equal(additional[course].length,36);assert.equal(new Set(additional[course].map(r=>r.question.text)).size,36);
}
// Phrase-specific supplementary conditions and comparisons are filled below.
const prompts=JSON.parse(fs.readFileSync('src/data/translationBattlePrompts.json','utf8'));
 for(const [course,rows]of Object.entries(additional))for(const r of rows){
 const q=r.question;let formNote=r.formNote;
 const synonyms=[];
 if(r.topic==='what節を主語にする')formNote='関係代名詞から始まる節全体を主語にし、後半でその内容を示します。';
 if(r.topic==='whateverで選択の範囲を広げる')formNote='何を選んでも・何が起きてもという内容全体を、複合関係代名詞の節として主語にします。';
 if(r.topic==='非制限用法で補足する')formNote='すでに特定されたものを、コンマで区切る関係代名詞の節で補足します。物を絞り込む用法にはしません。';
 if(r.topic==='前置詞と関係代名詞')formNote='動詞や意味に合う前置詞を、関係代名詞の直前に置く形で練習します。';
 if(r.topic==='受け身の分詞構文')formNote='前半を受け身の意味の分詞構文にします。その状態・行動の主体は主節の主語と同じです。';
 if(r.topic==='形式目的語と不定詞')formNote='仮の目的語を先に置き、評価の内容を後ろの不定詞で示します。';
 if(r.topic==='満たすべき条件の範囲')formNote='主節を先に置き、条件が満たされればという意味の節を後ろに続けます。期間の長さを述べる用法とは区別します。';
 if(r.topic==='二つの内容を対比する')formNote='二つの名詞句を対比します。前半の名詞句を否定し、後半を対比の接続詞で続けます。';
 if(r.topic==='程度の倍数比較')formNote='同等比較の形で倍数を述べます。時間の長さには副詞、広さには形容詞の原級を使います。';
 if(r.topic==='過去についての否定の推量')formNote='過去にしたはずがないという強い否定の推量です。助動詞と完了形を使い、短縮しない形で練習します。';
 if(r.topic==='助動詞と完了受け身'){formNote='過去に何かがされた可能性を表します。下の別表現も自然ですが、今回はそれ以外の助動詞で練習します。';synonyms.push({text:q.text.replace(' may have been ',' might have been '),note:'過去の可能性を表す自然な別表現'});}
 if(r.topic==='助けがなかった場合を仮定する'){formNote='もし〜がなかったらという前置詞句を先に置き、過去の反実仮想を続けます。下の別表現以外の句で練習します。';synonyms.push({text:q.text.replace(/^But for /,'Without '),note:'助けがない仮定を表す別表現'});}
 if(r.topic==='条件を明示する接続表現'){formNote='主節を先に置き、条件を明示する接続表現の節を続けます。下の別表現以外の形で練習します。';synonyms.push({text:q.text.replace(' provided that ',' providing that '),note:'同じ条件を表せる接続表現'});}
 if(r.topic==='過去の疑問を伝える'){formNote='尋ねた時点より前の完了を過去完了にし、その内容を間接疑問で伝えます。下の別表現以外で練習します。';synonyms.push({text:q.text.replace(' whether ',' if '),note:'〜かどうかを表す別表現'});}
 if(r.topic==='過去にすべきだったこと'){formNote='実際にはしなかった行動への後悔を、助動詞と完了形で述べます。下の別表現以外の助動詞で練習します。';synonyms.push({text:q.text.replace(' should have ',' ought to have '),note:'過去への後悔を表す別表現'});}
 // The third context uses a that-clause rather than a to-infinitive.
 if(q.text==='We made it clear that the deadline was final.')formNote='仮の目的語を置き、明確にした内容を接続詞の節で後ろに続けます。';
 if(q.text==='We need not more rules but better guidance.')formNote='必要なものを二つの名詞句で対比します。前半の名詞句を否定し、後半を対比の接続詞で続けます。';
 if(q.text==='Not every applicant meets the requirements.')formNote='全員ではないという部分否定です。一人ひとりを表す語に単数名詞を続けます。';
 if(q.text==='Not all the evidence supports that conclusion.')formNote='証拠全体が当てはまるわけではないという部分否定です。証拠は不可算名詞で表します。';
 if(q.text==='When asked for details, he referred to the report.')formNote='主節と同じ人が尋ねられています。時の接続詞の後ろで、受け身の節の主語と動詞の一部を省く形です。';
 if(q.text==='Concerned about safety, they canceled the event.')formNote='安全を心配している状態を分詞のまとまりで先に示します。その状態の主体は主節の主語と同じです。';
 if(q.text==='This method is more than twice as efficient.')formNote='従来の方法との効率の比較です。同等比較の形を使い、倍率が２倍を上回ると表します。比較相手は文中では省きます。';
 r.formNote=formNote;r.alternatives=synonyms;
 prompts.push({course,level:3,...{text:q.text,translation:q.translation},previousMeaning:q.translation,meaning:q.translation,formNote,alternatives:synonyms,contrasts:[],reason:'文法の中心となる構文・場面と自然な別表現を整理する。'});
}
fs.mkdirSync(dir,{recursive:true});
const sha=s=>createHash('sha256').update(s).digest('hex');
const baseline={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),questionsSha256:sha(JSON.stringify(original)),sourceHashes:Object.fromEntries(['src/App.tsx','src/data/questionSets/eiken/gradepre1-part1.json','src/data/questionSets/eiken/gradepre1-part2.json','src/data/translationBattlePrompts.json'].map(p=>[p,sha(fs.readFileSync(p))])),promptCount:prompts.length-72};
const report={status:'implemented-local-unpublished',date:'2026-10-19',baseline,courses:plan.courses.map(c=>({course:c.course,title:c.title,retained:75,added:36,total:111,removed:0,targets:12,addedRows:additional[c.course]}))};
for(const [p,data]of [
 ['src/data/questionSets/eiken/pre1GrammarFoundations.json',additional],
 ['src/data/pre1GrammarPointOverrides.json',points],
 ['src/data/pre1GrammarFoundationCards.json',cards],
 ['src/data/pre1GrammarFoundationAssignments.json',assignments],
 ['src/data/translationBattlePrompts.json',prompts],
 [dir+'/release.json',report],
])fs.writeFileSync(p,JSON.stringify(data,null,2)+'\n');
console.log('Prepared 36+36 new questions, 24 guides, 150 short annotations; all original questions preserved. Local only.');
