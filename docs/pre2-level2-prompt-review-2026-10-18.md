# 英検準2級 Level 2 和訳バトルの見直し（2026-10-18）

全223問の現在の和訳・例文・補足を確認し、83問を修正しました。残り140問は今回据え置きです。

## 過去の合意を守る方針

- 頭文字・文字数・正解の英単語を指示するヒントは復活させない。
- 動作と状態、対象、場面を短い日本語で補う。例文一つの場面だけに意味を限定しない。
- 意味の重なる表現に架空の使い分けを作らない。類義語は原則1つ、最大2つ。
- 補足のある問題は43問から122問へ。83問のうち79問が新規補足、4問が既存補足の見直し。
- 問題の英語・保存用和訳・例文・順序は変更せず、表示用の和訳と比較情報だけを更新する。

## 残る制約

このゲームは指定された熟語を思い出す練習で、自由英作文の採点ではありません。同じ和訳に複数の自然な英語が対応すること自体はなくせません。類義語表示は比較のための情報で、別解を正解として受理する機能ではありません。採点・HP・進行・保存形式は今回変更していません。

## 語義の確認資料

- [Cambridge: after all](https://dictionary.cambridge.org/us/dictionary/english/after-all) — 予想に反する結果と、理由を添える用法。
- [Cambridge: first](https://dictionary.cambridge.org/uk/grammar/british-grammar/first) — at first と in the beginning の重なり。既存の類義語比較を維持。
- [Cambridge: as long as / so long as](https://dictionary.cambridge.org/grammar/british-grammar/as-long-as-and-so-long-as) — 期間と条件の用法。
- [Cambridge: no more than](https://dictionary.cambridge.org/us/thesaurus/no-more-than) — only との重なり。

## 検証

- 全7,370問の表示アダプター・保存済み問題オブジェクトの参照互換性テスト成功。
- 全問題データのハッシュ不変。他の級・レベルの表示補足も変更前と一致。
- 専用の空のブラウザー環境で幅1366/820/390/320pxを確認。補足表示、正解の非表示、横はみ出しなし、回答後の元の保存キー更新、他の問題の記録保持を確認。
- 本番ビルド成功。既存のバンドルサイズ警告あり。
- 実機スマホのキーボード・音声と、本人の主観的な解きやすさは未確認。ローカル変更のみ、未コミット・未プッシュ。

## 変更した83問（英語・変更前・変更後）

| 英語 | 変更前の表示 | 変更後の表示 |
|---|---|---|
| as well | 〜もまた（文末で） | 〜もまた（文末に添えて、追加を表す）<br>類義語：too（〜もまた） |
| line up | 列に並ぶ | 一列に並ぶ・列を作る<br>意味の違い：in line（列に並んでいる状態） |
| be over | 終わっている | （行事・出来事などが）終わっている<br>類義語：be finished（終わっている） |
| be away | 留守にしている | （家・職場などを）留守にしている<br>類義語：be absent（不在である） |
| in line | 列に並んで | 列に並んでいる状態で<br>意味の違い：line up（列を作る動作） |
| in shape | 体の調子がよくて | 体の調子がよくて・体が鍛えられて<br>類義語：fit（健康で体力がある） |
| speak up | もっと大きな声で話す | 相手に聞こえるよう、もっと大きな声で話す<br>類義語：speak louder（もっと大きな声で話す） |
| on board | 乗り物に乗って | 船・飛行機などに乗って<br>類義語：aboard（船・飛行機などに乗って） |
| and so on | 〜など（列挙の続き） | 〜など（同じ種類のものを列挙した後に）<br>類義語：and so forth（〜など） |
| with care | 注意して・丁寧に | 注意を払って・丁寧に<br>類義語：carefully（注意して） |
| by mistake | 間違って・うっかり | 取り違えたり判断を誤ったりして、間違って<br>類義語：mistakenly（誤って） |
| on purpose | わざと・故意に | 偶然ではなく、わざと・故意に<br>類義語：intentionally（意図的に）／deliberately（故意に） |
| break down | （機械などが）故障する | （機械などが）故障する・動かなくなる<br>意味の違い：out of order（故障している状態） |
| fall asleep | 眠りに落ちる | 眠りに落ちる・眠り始める<br>意味の違い：be asleep（眠っている状態） |
| get injured | けがをする | （事故・運動などで）けがをする<br>類義語：get hurt（けがをする） |
| out of order | （機械などが）故障している | （機械などが）故障していて使えない<br>意味の違い：break down（故障して動かなくなる） |
| feel at home | くつろいだ気分になる | 自分の家にいるように、くつろいだ気分になる<br>類義語：feel comfortable（居心地よく感じる） |
| at the moment | ちょうど今・現在は | ちょうど今・現在のところ<br>類義語：right now（今この瞬間に）／currently（現在は） |
| do A a favor | Aの頼みを聞く（Aは人） | Aのためにひと肌脱ぐ・頼みを聞いてあげる（Aは人）<br>類義語：help A out（困っている人を助ける） |
| plenty of | 十分な・たっぷりの〜 | 十分な量の・たっぷりの〜<br>類義語：more than enough（十分すぎるほどの） |
| take your time | 焦らずゆっくりする | 急がずに、必要なだけ時間をかける<br>類義語：do not rush（急がないで） |
| run after | 〜を走って追いかける | （人・動物など）を走って追いかける<br>類義語：chase（追いかける） |
| make a reservation | 予約を入れる | 席・部屋などを確保するため、予約を入れる<br>類義語：make a booking（予約を入れる） |
| be tired from | 〜で疲れている（疲れの原因） | （運動・作業など）で体が疲れている<br>意味の違い：be tired of（〜にうんざりしている） |
| a bunch of flowers | 一束の花 | 一束の花・花束<br>類義語：a bouquet（花束） |
| leave behind | （物を）置き忘れる | 持っていく物をその場に置き忘れる |
| make an appointment | 面会・診察の予約をする | 診察・面会などの日時を予約する<br>類義語：arrange an appointment（面会などの日時を決める） |
| take after | （家族など）に似ている | （親・親族と）顔や性格が似ている<br>類義語：resemble（〜に似ている） |
| start with | 〜から始める | 最初のものとして〜から始める<br>類義語：begin with（〜から始める） |
| stay away from | 〜に近づかない<br>類義語：stay off（〜に近づかない）／keep away from（〜に近づかない） | 〜に近づかない・〜から離れている<br>類義語：keep away from（〜に近づかない） |
| so far | 今までのところ | 今までのところ・ここまでの時点では<br>類義語：up to now（今までのところ） |
| at most | 多くとも・最大限で<br>類義語：no more than（多くても） | 多くても〜・最大でも〜（数量の上限）<br>類義語：no more than（多くても〜） |
| show off | 見せびらかす・自慢する<br>類義語：flaunt（誇示する） | 見せびらかす・得意げに自慢する<br>類義語：boast（自慢する） |
| for sure | 確実に・間違いなく | 確実に・間違いなく（確信を表す）<br>類義語：for certain（確実に） |
| after all | 結局・考えてみれば | 結局は（予想・心配に反して）／だって・何と言っても |
| with luck | 運がよければ | 運がよければ<br>類義語：if we are lucky（私たちの運がよければ） |
| stand out | 目立つ・際立つ | 周囲より目立つ・際立つ<br>類義語：be noticeable（目につく） |
| without fail | 必ず・間違いなく | 必ず・欠かさず（実行を確実にする） |
| mean to | 〜するつもりである（後ろに動詞の原形） | 〜するつもりである（後ろに動詞の原形）<br>類義語：intend to（〜するつもりである） |
| in particular | とりわけ・特に | とりわけ・特に<br>類義語：especially（特に） |
| make an effort | 努力する | 目標に向かって努力する<br>類義語：try hard（懸命に努力する） |
| see if | 〜かどうか確かめる（後ろに文） | 実際に調べて〜かどうか確かめる（後ろに文）<br>類義語：check whether（〜かどうか確認する） |
| make up one's mind | 決心する（one'sはmy・yourなど） | どうするか決心する（one'sはmy・yourなど）<br>類義語：decide（決める） |
| stand for | 〜を表す | （記号・印などが）〜を意味する・象徴する<br>類義語：represent（〜を表す） |
| search for | 〜を探し回る | 見つけようとして〜を探す<br>類義語：look for（〜を探す） |
| decide on | 〜を決める | 候補の中から〜に決める<br>類義語：choose（〜を選ぶ） |
| go over | （計画・内容など）をよく見直す | （内容・計画など）をよく確認する・復習する<br>類義語：review（見直す・復習する） |
| do without | 〜なしで済ませる | 〜がなくても、なんとか済ませる<br>類義語：manage without（〜なしでやっていく） |
| carry out | （計画・調査など）を実行する | （計画・調査など）を実行する<br>類義語：perform（仕事などを実行する） |
| a variety of | さまざまな種類の〜 | さまざまな種類の〜<br>類義語：various kinds of（いろいろな種類の） |
| cut down on | （摂取量・使用量など）を減らす | （摂取量・使用量など）を減らす<br>類義語：reduce（量などを減らす） |
| cut off | （供給など）を止める | （水・電気などの供給）を止める・遮断する<br>類義語：shut off（供給などを止める） |
| bring up | （子どもを）育てる | （子どもを）育てる<br>類義語：raise（子どもなどを育てる） |
| catch up with | 〜に追いつく | 先にいる人や、進んだ水準に追いつく<br>意味の違い：keep up with（遅れずに同じペースを保つ） |
| think about | 〜を検討する・〜について考える | 〜について考える・〜を検討する<br>類義語：consider（〜を検討する） |
| be sure of | 〜を確信している | 〜について確信している<br>類義語：be certain of（〜を確信している） |
| feel sorry for | 〜を気の毒に思う | （つらい立場の人など）を気の毒に思う<br>類義語：pity（〜を気の毒に思う） |
| be aware of | 〜に気づいている | 〜に気づいている・〜を認識している<br>類義語：be conscious of（〜を意識している） |
| keep an eye on | 〜を見ている・見守る | 〜から目を離さず、様子を見ている<br>類義語：watch（様子を見守る） |
| keep up with | 〜に遅れずについていく | 〜に遅れず、同じペースについていく<br>意味の違い：catch up with（遅れていたところから追いつく） |
| take over | （事業など）を引き継ぐ | （仕事・事業など）を引き継ぐ<br>類義語：assume control of（管理・責任を引き受ける） |
| be grateful for | 〜に感謝している | （助け・親切など）に感謝している<br>類義語：be thankful for（〜に感謝している） |
| be jealous of | 〜をうらやんでいる | （人の成功・持ち物など）をうらやんでいる<br>類義語：be envious of（〜をうらやんでいる） |
| pay attention to | 〜に注意を向ける<br>類義語：heed（〜に注意を払う） | 〜に注意を向ける・気を配る<br>類義語：take notice of（〜に注意を向ける） |
| go through | （つらいことなど）を経験する | （つらいことなど）を経験する<br>類義語：experience（〜を経験する） |
| in return for | 〜のお返しに | 受けた〜へのお返しとして<br>類義語：in exchange for（〜と引き換えに） |
| be involved in | 〜に関わっている | （活動・出来事など）に関わっている<br>類義語：be engaged in（活動などに従事している） |
| be impressed with | 〜に感心している | （出来栄え・能力など）に感心している<br>類義語：be impressed by（〜に感銘を受けている） |
| be satisfied with | 〜に満足している | （結果・状況など）に満足している<br>類義語：be content with（〜に満足している） |
| in a sense | ある意味では | ある意味では・ある見方をすれば<br>類義語：in a way（ある意味では） |
| in reality | 実際には・現実には | 実際には・現実には（見かけや想像と違って）<br>類義語：in fact（実際には） |
| in contrast | 対照的に | それに対して・対照的に<br>類義語：by contrast（対照的に） |
| to the point | 要点をついて | 話の要点を的確について<br>類義語：relevant（本題に関係のある） |
| in the long run | 長い目で見ると | 長い目で見ると・長期的には<br>類義語：in the long term（長期的には） |
| no more than | わずか〜・〜にすぎない | わずか〜・〜にすぎない／多くても〜<br>類義語：only（わずか〜という意味）／at most（数量の上限という意味） |
| make out | （文字など）をなんとか読み取る | （見えにくい文字など）をなんとか判別する<br>類義語：discern（なんとか見分ける） |
| turn out to be | 〜であると判明する | 後になって〜であると分かる<br>類義語：prove to be（〜であると分かる） |
| out of the question | まったく不可能で・論外で | まったく不可能で・考慮の余地がなくて<br>類義語：impossible（不可能な） |
| as long as | 〜する限り（後ろに文） | 〜する限り（条件・期間、後ろに文）<br>類義語：so long as（〜する限り） |
| be independent of | 〜から自立している | 〜に頼らず自立している |
| make sense of | 〜を理解する | （分かりにくいもの）の意味を理解する<br>類義語：understand（〜を理解する）<br>意味の違い：make sense（意味が通る・筋が通る） |
| appeal to | （人の心）に訴える・気に入られる | （人の心）をひきつける・気に入られる<br>類義語：attract（〜をひきつける） |
| as a result of | 〜の結果として | 〜が原因となって・〜の結果として<br>類義語：because of（〜のために） |

## 確認して据え置いた140問

- eat out：外食する
- at first：最初は
- get lost：道に迷う
- come out：外に出る・発売される
- check in：（ホテルなどで）到着手続きをする
- for long：長い間（主に否定・疑問文）
- dress up：着飾る・仮装する
- come down：下へ降りてくる
- check out：（ホテルで）出発手続きをする
- in public：人前で・公の場で
- in danger：危険な状態で
- in advance：前もって・事前に
- in the past：過去には
- as you know：ご存じのように
- take a bite：一口かじる
- see off：（人を）見送る
- by accident：（意図せず）偶然に・うっかり
- from now on：今からずっと・今後は
- live on：〜を主食にする・〜で生計を立てる
- for a change：気分を変えて・たまには
- go on a tour：ツアーに参加する
- one at a time：一度に一つずつ
- over and over：何度も何度も
- put out a fire：火を消す
- make a mistake：間違いをする
- all year round：一年中ずっと
- do the laundry：洗濯をする
- keep a promise：約束を守る
- fill out：（用紙）に記入する
- some other time：また別の機会に
- lose one's balance：バランスを崩す（one'sはmy・yourなど）
- go into：〜の中に入る
- add A to B：AをBに加える
- put down：（物を）下に置く
- fill up：〜を満タンにする
- hand in：（書類など）を提出する
- work on：（課題など）に取り組む
- stop by：〜にちょっと立ち寄る
- pass by：〜の前を通り過ぎる
- earlier than usual：いつもより早く
- have a sore throat：のどが痛い
- watch out for：〜に気をつける
- bring back：（物を）持ち帰る・返しに来る
- send out：（招待状・通知など）を発送する
- across from：〜の向かいに
- head for：〜へ向かう
- be popular with：〜に人気がある
- by the side of：〜の脇に
- take A out of B：AをBから取り出す
- in turn：順番に・交代で
- go wrong：うまくいかなくなる
- break up：解散する・関係が終わる
- by chance：偶然に（意図せず起きること）
- by nature：生まれつき・本来
- no longer：もはや〜ない
- on demand：要求があり次第・好きな時に
- on my own：独力で・一人だけで
- in the end：結局は・最後には
- on average：平均して
- make sense：意味が通る・筋が通る
- before long：まもなく・ほどなく
- out of date：時代遅れの・期限切れの
- stand by：（人の）味方でいる・支える
- come to life：活気を帯びる・生き生きし始める
- let down：（人を）がっかりさせる
- lose control：制御できなくなる
- set up：（設備）を設置する・（組織）を設立する
- be about to：まさに〜しようとしている（後ろに動詞の原形）
- be typical of：いかにも〜らしい
- be based on：〜に基づいている
- in other words：言い換えれば
- learn by heart：（すっかり）暗記する
- look up to：（人を）尊敬する
- be busy with：〜で忙しい
- to my surprise：驚いたことに
- be sure to：忘れずに必ず〜する（後ろに動詞の原形）
- apply for：（仕事・許可など）に応募する・申請する
- due to：〜のために（原因）
- be free from：（心配・害など）がない
- get over：（病気・困難など）から回復する・乗り越える
- even if：たとえ〜でも（後ろに文）
- up to：最大〜まで
- in case：〜の場合に備えて（後ろに文）
- of one's own：自分専用の〜（名詞の後、one'sはmyなど）
- in the beginning：初めのうちは
- be unable to：〜することができない（後ろに動詞の原形）
- had better：〜した方がよい（忠告、後ろに動詞の原形）
- in order to：〜するために（後ろに動詞の原形）
- focus on：〜に集中する
- be related to：〜に関連している
- against the rules：規則に反して
- ahead of schedule：予定より早く
- make a difference：違いを生む・役に立つ
- a number of：かなりの数の〜（後ろに複数名詞）
- by the end of：〜の終わりまでに
- go out of business：廃業する
- come across：（人・物）に偶然出会う
- rely on：〜を頼りにする
- be expected to：〜すると見込まれている（後ろに動詞の原形）
- in addition to：〜に加えて
- put off：（予定など）を延期する
- point out：（問題点など）を指摘する
- lead to：（結果として）〜につながる
- lead A to B：AをBへ案内する（Aは人、Bは場所）
- come up with：（考え・案）を思いつく
- spend A on B：AをBに使う（Aはお金・時間など）
- look over：（書類など）にざっと目を通す
- provide A with B：AにBを提供する
- along with：〜と一緒に
- by the time：〜する時までには（後ろに文）
- suffer from：（病気・問題など）に苦しむ
- succeed in：〜に成功する（後ろに名詞・-ing形）
- in charge of：〜を担当して
- hope for：〜を望む
- except for：〜を除いて
- translate into：〜語に翻訳する
- grow up to be：成長して〜になる
- be responsible for：〜に責任がある
- lose sight of：〜を見失う
- have a chance to：〜する機会がある（後ろに動詞の原形）
- run into：（人に）偶然会う
- get rid of：（不要なもの）を処分する
- reach out for：〜に手を伸ばす
- look through：（書類など）にひと通り目を通す
- complain about：〜について苦情を言う
- take A back to B：AにBを思い出させる（Aは人、Bは過去の時期）
- compare A with B：AをBと比べる
- separate A from B：AをBから分ける
- at length：詳しく・長い時間をかけて
- in conclusion：結論として・最後にまとめると
- by far：群を抜いて・はるかに（最上級などを強める）
- against one's will：意志に反して（one'sはmy・yourなど）
- result in：結果として〜につながる
- be said to：〜すると言われている（後ろに動詞の原形）
- at risk of：〜の危険にさらされて
- in spite of：〜にもかかわらず
- be capable of：〜する能力がある（後ろに名詞・-ing形）
- none of your business：あなたには関係のないこと
- make up for：（遅れ・損失など）を埋め合わせる
- play an important role：重要な役割を果たす
