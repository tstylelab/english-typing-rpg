# 上位級Level2・熟語の核への整理（2026-09-27）

## 方針

- 具体的な目的語・場所などは例文に残し、出題は熟語の核にする。語数だけによる自動切り詰めはしない。
- throw in the towel、eke out a living、a piece of paper等は意味のまとまりを保つ。
- 構文はprefer A to B、prevent A from doing等の型を残し、和訳と使い方で入れ替え部分を説明する。入力は表示どおり。
- 例文は既存文を維持。重複した核は代表例文へ統合。類義語は核に合った短いヒントへ見直す。
- 同一級の和訳の完全重複は避け、必要箇所に「takeを使う」等の識別ヒントを加える。
- 5級・4級・準1級①②、全級のLevel1/3は変更しない。問題数/HP/得点計算/習得判定は今回変更しない。

## 件数

|級|元の問題数|修正後|修正元項目数|
|---|---:|---:|---:|
|3級|183|182|127|
|準2級|223|223|129|
|2級|203|203|156|
|1級①|70|70|27|
|1級②|82|82|52|

## 保存データと出題順

- 旧データ行をそのまま保管し、旧「級・Level・英語・和訳」キーから新キーへ移行する。旧キーは削除しない。
- 学習段階・手動上書き・除外・学習成功回数/間隔・選択/保存リスト・復習待ちを引き継ぐ。既に新キーの記録がある場合は優先。
- 苦手語の旧項目を残しつつ新しい核も登録。移行済みの印で再読込時の復活を防ぐ。級を共有するミス統計の旧語は重複加算しない。
- 3級のpick up2項目を一つに統合。学習帯(band)と問題一覧の両方を同時に更新して、序盤/中盤/終盤の出題区分を維持。
- AI相談の過去ログは実際の入力履歴として変更しない。

## 検証

- test-upper-phrase-cores.mjs：9ac5d02との範囲外比較、全変更対応、全例文、和訳重複/識別、学習帯、実App保存処理による全件移行/再実行。
- test-phrase-learning.mjs：4級の既存移行と長文反復仕様の回帰。
- test-supplemental-synonyms.mjs：旧教材に対する既存類義語の契約を保持し、新しい核は新テストで検証。
- ビルド、lint、問題数/HP・Level3ダメージ・出題保証の回帰テスト。
- 実画面テスト結果はセッション記録に記載。今回はコミット・プッシュ指定なし。

## 全変更一覧

|級|変更前|変更後|和訳|
|---|---|---|---|
|3級|cheer her up|cheer up|（人を）元気づける|
|3級|no more bread|no more|これ以上の〜はない|
|3級|get on the bus|get on|（バス・電車など）に乗る|
|3級|give me a ride|give A a ride|Aを車に乗せて送る（Aは人）|
|3級|such as apples|such as|例えば〜のような|
|3級|on my way home|on the way home|帰宅する途中で|
|3級|give me a hand|give A a hand|Aに手を貸す（Aは人）|
|3級|agree with you|agree with|（人・意見）に賛成する|
|3級|too many books|too many|多すぎる〜（数えられるもの）|
|3級|put on a jacket|put on|（衣服など）を身につける|
|3級|not cold at all|not at all|少しも〜ない（notとat allで挟む）|
|3級|pick up the pen|pick up|（物を）拾い上げる・（人を）迎えに行く|
|3級|leave for Tokyo|leave for|〜に向けて出発する|
|3級|look for my keys|look for|〜を探す|
|3級|try on this coat|try on|（服など）を試着する|
|3級|all the way home|all the way|道中ずっと・はるばる|
|3級|turn on the radio|turn on|（機器・電気）をつける|
|3級|have time to read|have time to|〜する時間がある（後ろに動詞の原形）|
|3級|part of the story|part of|〜の一部|
|3級|be kind to others|be kind to|〜に親切にする|
|3級|hundreds of birds|hundreds of|何百もの〜|
|3級|in time for lunch|in time for|〜に間に合って|
|3級|the same as yours|the same as|〜と同じ|
|3級|turn off the light|turn off|（機器・電気）を消す|
|3級|too heavy to carry|too A to B|AすぎてBできない（Aは形容詞、Bは動詞の原形）|
|3級|both cats and dogs|both A and B|AとBの両方|
|3級|find out the truth|find out|（調べて事実・答えを）見つけ出す|
|3級|work for a company|work for|（会社・人）のために働く|
|3級|be full of flowers|be full of|〜でいっぱいである|
|3級|take off your shoes|take off|（靴・衣服）を脱ぐ|
|3級|take part in a race|take part in|〜に参加する|
|3級|be afraid of snakes|be afraid of|〜を怖がる|
|3級|be proud of my team|be proud of|〜を誇りに思う|
|3級|take care of a baby|take care of|〜の世話をする（takeを使う）|
|3級|thousands of people|thousands of|何千もの〜|
|3級|turn down the music|turn down|（音量など）を下げる|
|3級|most of the students|most of|〜の大部分|
|3級|throw away old paper|throw away|（不要な物）を捨てる|
|3級|turn left at the bank|turn left|左に曲がる|
|3級|be different from mine|be different from|〜とは異なる|
|3級|at the end of the road|at the end of|〜の終わりに・突き当たりに|
|3級|be famous for its food|be famous for|〜で有名である|
|3級|hear about the accident|hear about|〜について耳にする|
|3級|belong to me|belong to|〜のものである・〜に所属する|
|3級|on your right|on the right|右側に|
|3級|call you back|call back|（人に）折り返し電話する|
|3級|forget to call|forget to|〜するのを忘れる（後ろに動詞の原形）|
|3級|sound like fun|sound like|〜のように聞こえる|
|3級|change my mind|change one's mind|考えを変える（one'sはmy・yourなど）|
|3級|talk to myself|talk to oneself|独り言を言う（oneselfはmyselfなど）|
|3級|look up a word|look up|（語・情報）を辞書などで調べる|
|3級|ask him to help|ask A to do|Aに〜するよう頼む（Aは人、doは動詞の原形）|
|3級|decide to leave|decide to|〜することに決める（後ろに動詞の原形）|
|3級|be glad to help|be glad to|喜んで〜する（後ろに動詞の原形）|
|3級|get him to help|get A to do|Aを説得して〜してもらう（Aは人、doは動詞の原形）|
|3級|on my first day|on the first day|最初の日に|
|3級|be able to swim|be able to|〜することができる（後ろに動詞の原形）|
|3級|run out of milk|run out of|（物など）を使い切る|
|3級|want you to come|want A to do|Aに〜してほしい（Aは人、doは動詞の原形）|
|3級|tell her to wait|tell A to do|Aに〜するよう伝える（Aは人、doは動詞の原形）|
|3級|not have to work|not have to|〜する必要がない（後ろに動詞の原形）|
|3級|not finished yet|not yet|まだ〜していない（notとyetで挟む）|
|3級|be happy to join|be happy to|喜んで〜する（happyを使い、後ろに動詞の原形）|
|3級|a couple of days|a couple of|二、三の〜|
|3級|be ready to start|be ready to|〜する準備ができている（後ろに動詞の原形）|
|3級|look after my dog|look after|〜の世話をする（lookを使う）|
|3級|feel like dancing|feel like|〜したい気分だ（後ろに-ing形）|
|3級|pick up my sister|pick up|（物を）拾い上げる・（人を）迎えに行く|
|3級|care about others|care about|〜を気にかける|
|3級|instead of coffee|instead of|〜の代わりに（insteadを使う）|
|3級|used to live here|used to|以前は〜していた（後ろに動詞の原形）|
|3級|give it back to me|give A back to B|AをBに返す（Aは物、Bは人など）|
|3級|hear of the writer|hear of|〜の存在を耳にする|
|3級|take turns reading|take turns|交代で〜する（後ろに-ing形を続けられる）|
|3級|because of the rain|because of|〜のために（理由）|
|3級|do well on the test|do well on|（試験など）でよい成績を取る|
|3級|be tired of waiting|be tired of|〜にうんざりしている|
|3級|show me how to cook|show A how to do|Aに〜の仕方を教える（Aは人、doは動詞の原形）|
|3級|have been to Canada|have been to|〜へ行ったことがある|
|3級|thanks to your help|thanks to|〜のおかげで|
|3級|would love to visit|would love to|ぜひ〜したい（後ろに動詞の原形）|
|3級|be similar to yours|be similar to|〜によく似ている|
|3級|plan to study abroad|plan to|〜する予定を立てる（後ろに動詞の原形）|
|3級|invite you to dinner|invite A to B|AをBに招く（Aは人、Bは場所・行事など）|
|3級|far from the station|far from|（場所）から遠くに|
|3級|as tall as my father|as tall as|〜と同じくらい背が高い|
|3級|on the way to school|on the way to|〜へ行く途中で|
|3級|such a beautiful day|such a|こんなに〜な（後ろに形容詞と単数名詞）|
|3級|be covered with snow|be covered with|〜で覆われている|
|3級|be filled with water|be filled with|〜で満たされている|
|3級|be known as a writer|be known as|〜として知られている|
|3級|look around the town|look around|〜を見て回る|
|3級|make paper from wood|make A from B|Bを原料にAを作る（材料の形が変わる）|
|3級|make a chair of wood|make A of B|Bを材料にAを作る（材料が見てわかる）|
|3級|think of a good idea|think of|（考えなど）を思いつく|
|3級|either tea or coffee|either A or B|AかBのどちらか|
|3級|help me with homework|help A with B|AのBを手伝う（Aは人、Bは仕事など）|
|3級|be ready for the test|be ready for|〜の準備ができている|
|3級|finish reading a book|finish reading|読み終える（finishの後に-ing形）|
|3級|be absent from school|be absent from|（学校・会合など）を欠席している|
|3級|graduate from college|graduate from|（学校）を卒業する|
|3級|depend on the weather|depend on|〜次第である・〜に頼る|
|3級|help me carry this box|help A do|Aが〜するのを手伝う（Aは人、doは動詞の原形）|
|3級|be careful about money|be careful about|〜に気をつける|
|3級|one of the best players|one of the best|最もよい〜の一つ・一人（後ろに複数名詞）|
|3級|something cold to drink|something to drink|何か飲むもの|
|3級|have enough time to eat|have enough time to|〜するのに十分な時間がある（後ろに動詞の原形）|
|3級|get away from the noise|get away from|〜から離れる・逃れる|
|3級|be interested in science|be interested in|〜に興味がある|
|3級|show you around the city|show A around|Aに周辺を案内する（Aは人）|
|3級|exchange dollars for yen|exchange A for B|AをBに交換する|
|3級|taller than any other boy|than any other|ほかのどの〜よりも（比較級の後、続く名詞は単数）|
|3級|name him after his father|name A after B|BにちなんでAを名づける|
|3級|introduce you to my sister|introduce A to B|AをBに紹介する|
|3級|have an interview with her|have an interview with|〜と面接・取材をする|
|3級|make sure the door is shut|make sure|〜を確かめる|
|3級|where to buy tickets|where to|どこで〜するか（後ろに動詞の原形）|
|3級|as soon as I get home|as soon as|〜するとすぐに（後ろに文）|
|3級|keep in touch with you|keep in touch with|〜と連絡を取り続ける|
|3級|not today but tomorrow|not A but B|AではなくB|
|3級|the number of students|the number of|〜の数（後ろに複数名詞）|
|3級|leave a message for her|leave a message for|〜に伝言を残す|
|3級|look forward to seeing you|look forward to|〜を楽しみにする（後ろに名詞・-ing形）|
|3級|It is easy for me to swim.|It is A for B to do|Bにとって〜するのはAだ（Aは形容詞、Bは人、doは動詞の原形）|
|3級|so tired that I cannot walk|so A that B|とてもAなのでBだ（Aは形容詞・副詞、Bは文）|
|3級|This is my first time skiing.|one's first time doing|〜するのは初めて（one'sはmyなど、doingは-ing形）|
|3級|It takes an hour to walk there.|It takes A to do|〜するのにAかかる（Aは時間、doは動詞の原形）|
|準2級|see her off|see off|（人を）見送る|
|準2級|live on rice|live on|〜を主食にする・〜で生計を立てる|
|準2級|do me a favor|do A a favor|Aの頼みを聞く（Aは人）|
|準2級|plenty of time|plenty of|十分な・たっぷりの〜|
|準2級|fill out a form|fill out|（用紙）に記入する|
|準2級|lose my balance|lose one's balance|バランスを崩す（one'sはmy・yourなど）|
|準2級|go into the room|go into|〜の中に入る|
|準2級|add sugar to tea|add A to B|AをBに加える|
|準2級|put down the bag|put down|（物を）下に置く|
|準2級|fill up the tank|fill up|〜を満タンにする|
|準2級|hand in homework|hand in|（書類など）を提出する|
|準2級|work on a project|work on|（課題など）に取り組む|
|準2級|run after the dog|run after|〜を走って追いかける|
|準2級|stop by the store|stop by|〜にちょっと立ち寄る|
|準2級|pass by the house|pass by|〜の前を通り過ぎる|
|準2級|tired from walking|be tired from|〜で疲れている（疲れの原因）|
|準2級|leave a bag behind|leave behind|（物を）置き忘れる|
|準2級|watch out for cars|watch out for|〜に気をつける|
|準2級|bring back the book|bring back|（物を）持ち帰る・返しに来る|
|準2級|send out invitations|send out|（招待状・通知など）を発送する|
|準2級|across from the bank|across from|〜の向かいに|
|準2級|take after my father|take after|（家族など）に似ている|
|準2級|head for the station|head for|〜へ向かう|
|準2級|popular with children|be popular with|〜に人気がある|
|準2級|start with a question|start with|〜から始める|
|準2級|by the side of the road|by the side of|〜の脇に|
|準2級|stay away from the edge|stay away from|〜に近づかない|
|準2級|take a book out of a bag|take A out of B|AをBから取り出す|
|準2級|stand by me|stand by|（人の）味方でいる・支える|
|準2級|let her down|let down|（人を）がっかりさせる|
|準2級|mean to call|mean to|〜するつもりである（後ろに動詞の原形）|
|準2級|set up a tent|set up|（設備）を設置する・（組織）を設立する|
|準2級|about to leave|be about to|まさに〜しようとしている（後ろに動詞の原形）|
|準2級|typical of him|be typical of|いかにも〜らしい|
|準2級|based on facts|be based on|〜に基づいている|
|準2級|look up to her|look up to|（人を）尊敬する|
|準2級|busy with work|be busy with|〜で忙しい|
|準2級|be sure to call|be sure to|忘れずに必ず〜する（後ろに動詞の原形）|
|準2級|apply for a job|apply for|（仕事・許可など）に応募する・申請する|
|準2級|due to the rain|due to|〜のために（原因、dueを使う）|
|準2級|see if it works|see if|〜かどうか確かめる（後ろに文）|
|準2級|make up my mind|make up one's mind|決心する（one'sはmy・yourなど）|
|準2級|free from worry|be free from|（心配・害など）がない|
|準2級|get over a cold|get over|（病気・困難など）から回復する・乗り越える|
|準2級|stand for peace|stand for|〜を表す|
|準2級|even if it rains|even if|たとえ〜でも（後ろに文）|
|準2級|search for a key|search for|〜を探し回る|
|準2級|decide on a date|decide on|〜を決める|
|準2級|up to ten people|up to|最大〜まで|
|準2級|go over the plan|go over|（計画・内容など）をよく見直す|
|準2級|in case it rains|in case|〜の場合に備えて（後ろに文）|
|準2級|a room of my own|of one's own|自分専用の〜（名詞の後、one'sはmyなど）|
|準2級|do without a car|do without|〜なしで済ませる|
|準2級|carry out a plan|carry out|（計画・調査など）を実行する|
|準2級|unable to attend|be unable to|〜することができない（後ろに動詞の原形）|
|準2級|had better leave|had better|〜した方がよい（忠告、後ろに動詞の原形）|
|準2級|in order to learn|in order to|〜するために（後ろに動詞の原形）|
|準2級|a variety of food|a variety of|さまざまな種類の〜|
|準2級|cut down on sugar|cut down on|（摂取量・使用量など）を減らす|
|準2級|cut off the water|cut off|（供給など）を止める|
|準2級|focus on the task|focus on|〜に集中する|
|準2級|related to health|be related to|〜に関連している|
|準2級|bring up children|bring up|（子どもを）育てる|
|準2級|catch up with her|catch up with|〜に追いつく|
|準2級|think about moving|think about|〜を検討する・〜について考える|
|準2級|a number of people|a number of|かなりの数の〜（後ろに複数名詞）|
|準2級|by the end of June|by the end of|〜の終わりまでに|
|準2級|sure of the answer|be sure of|〜を確信している|
|準2級|feel sorry for him|feel sorry for|〜を気の毒に思う|
|準2級|come across a book|come across|（人・物）に偶然出会う|
|準2級|rely on my friends|rely on|〜を頼りにする|
|準2級|expected to arrive|be expected to|〜すると見込まれている（後ろに動詞の原形）|
|準2級|in addition to math|in addition to|〜に加えて|
|準2級|put off the meeting|put off|（予定など）を延期する|
|準2級|point out a mistake|point out|（問題点など）を指摘する|
|準2級|lead to an accident|lead to|（結果として）〜につながる|
|準2級|aware of the danger|be aware of|〜に気づいている|
|準2級|lead us to the exit|lead A to B|AをBへ案内する（Aは人、Bは場所）|
|準2級|come up with an idea|come up with|（考え・案）を思いつく|
|準2級|spend money on books|spend A on B|AをBに使う（Aはお金・時間など）|
|準2級|look over the report|look over|（書類など）にざっと目を通す|
|準2級|provide us with food|provide A with B|AにBを提供する|
|準2級|along with my friends|along with|〜と一緒に|
|準2級|by the time we arrive|by the time|〜する時までには（後ろに文）|
|準2級|suffer from a disease|suffer from|（病気・問題など）に苦しむ|
|準2級|keep an eye on my bag|keep an eye on|〜を見ている・見守る|
|準2級|succeed in finding it|succeed in|〜に成功する（後ろに名詞・-ing形）|
|準2級|in charge of the team|in charge of|〜を担当して|
|準2級|hope for good weather|hope for|〜を望む|
|準2級|except for one mistake|except for|〜を除いて|
|準2級|translate into English|translate into|〜語に翻訳する|
|準2級|keep up with the class|keep up with|〜に遅れずについていく|
|準2級|take over the business|take over|（事業など）を引き継ぐ|
|準2級|grow up to be a doctor|grow up to be|成長して〜になる|
|準2級|responsible for safety|be responsible for|〜に責任がある|
|準2級|lose sight of the boat|lose sight of|〜を見失う|
|準2級|have a chance to speak|have a chance to|〜する機会がある（後ろに動詞の原形）|
|準2級|run into an old friend|run into|（人に）偶然会う|
|準2級|get rid of old clothes|get rid of|（不要なもの）を処分する|
|準2級|grateful for your help|be grateful for|〜に感謝している|
|準2級|jealous of her success|be jealous of|〜をうらやんでいる|
|準2級|reach out for the rope|reach out for|〜に手を伸ばす|
|準2級|pay attention to signs|pay attention to|〜に注意を向ける|
|準2級|go through a hard time|go through|（つらいことなど）を経験する|
|準2級|in return for your help|in return for|〜のお返しに|
|準2級|look through the papers|look through|（書類など）にひと通り目を通す|
|準2級|involved in the project|be involved in|〜に関わっている|
|準2級|impressed with the work|be impressed with|〜に感心している|
|準2級|complain about the noise|complain about|〜について苦情を言う|
|準2級|satisfied with the result|be satisfied with|〜に満足している|
|準2級|take me back to childhood|take A back to B|AにBを思い出させる（Aは人、Bは過去の時期）|
|準2級|compare my plan with yours|compare A with B|AをBと比べる|
|準2級|separate paper from plastic|separate A from B|AをBから分ける|
|準2級|by far the best|by far|群を抜いて・はるかに（最上級などを強める）|
|準2級|against my will|against one's will|意志に反して（one'sはmy・yourなど）|
|準2級|result in success|result in|結果として〜につながる|
|準2級|no more than five|no more than|わずか〜・〜にすぎない|
|準2級|make out the words|make out|（文字など）をなんとか読み取る|
|準2級|said to be healthy|be said to|〜すると言われている（後ろに動詞の原形）|
|準2級|turn out to be true|turn out to be|〜であると判明する|
|準2級|at risk of flooding|at risk of|〜の危険にさらされて|
|準2級|as long as you stay|as long as|〜する限り（後ろに文）|
|準2級|in spite of the rain|in spite of|〜にもかかわらず|
|準2級|capable of solving it|be capable of|〜する能力がある（後ろに名詞・-ing形）|
|準2級|independent of others|be independent of|〜から自立している|
|準2級|make sense of the map|make sense of|〜を理解する|
|準2級|make up for lost time|make up for|（遅れ・損失など）を埋め合わせる|
|準2級|appeal to young people|appeal to|（人の心）に訴える・気に入られる|
|準2級|as a result of the storm|as a result of|〜の結果として|
|2級|give her a hand|give A a hand|Aに手を貸す（Aは人）|
|2級|ask her for help|ask A for B|AにBを求める|
|2級|stop by the shop|stop by|〜にちょっと立ち寄る|
|2級|try out the game|try out|（物・方法）を試してみる|
|2級|fill out the form|fill out|（用紙）に記入する|
|2級|bring back a book|bring back|（物を）持ち帰る・返しに来る|
|2級|take up gardening|take up|（趣味など）を始める|
|2級|throw away the box|throw away|（不要な物）を捨てる|
|2級|turn up the volume|turn up|（音量など）を上げる|
|2級|in search of a job|in search of|〜を探して|
|2級|pick up the package|pick up|（荷物など）を受け取る|
|2級|take a look at this|take a look at|〜をちょっと見る|
|2級|leave my bag behind|leave behind|（物を）置き忘れる|
|2級|stare at the screen|stare at|〜をじっと見る|
|2級|three days in a row|in a row|連続して・一列に|
|2級|hand in the homework|hand in|（書類など）を提出する|
|2級|sell out the tickets|sell out|（商品など）を売り切る|
|2級|take away the plates|take away|（物を）片づける・持ち去る|
|2級|put together the table|put together|（部品など）を組み立てる|
|2級|according to the report|according to|〜によると|
|2級|look through the photos|look through|（写真・書類など）にざっと目を通す|
|2級|meet our needs|meet one's needs|必要を満たす（one'sはour・theirなど）|
|2級|run out of time|run out of|（時間・物など）を使い切る|
|2級|keep my promise|keep a promise|約束を守る|
|2級|make fun of him|make fun of|〜をからかう|
|2級|work on a report|work on|（課題など）に取り組む|
|2級|instead of a car|instead of|〜の代わりに（insteadを使う）|
|2級|set up a company|set up|（設備）を設置する・（組織）を設立する|
|2級|manage to finish|manage to|何とか〜する（後ろに動詞の原形）|
|2級|look up the word|look up|（語・情報）を辞書などで調べる|
|2級|as if he knew me|as if|まるで〜であるかのように（後ろに文）|
|2級|tend to be quiet|tend to|〜する傾向がある（後ろに動詞の原形）|
|2級|find my way home|find one's way|道を見つけて進む（one'sはmy・yourなど）|
|2級|major in history|major in|（学問）を専攻する|
|2級|put off the trip|put off|（予定など）を延期する|
|2級|be based on facts|be based on|〜に基づいている|
|2級|happen to see her|happen to|偶然〜する（後ろに動詞の原形）|
|2級|result in a delay|result in|結果として〜につながる|
|2級|by the end of May|by the end of|〜の終わりまでに|
|2級|apply for the job|apply for|（仕事・許可など）に応募する・申請する|
|2級|be about to leave|be about to|まさに〜しようとしている（後ろに動詞の原形）|
|2級|due to heavy rain|due to|〜のために（原因、dueを使う）|
|2級|stick to the plan|stick to|（計画・約束など）を守り続ける|
|2級|be likely to rain|be likely to|〜しそうだ（後ろに動詞の原形）|
|2級|keep that in mind|keep in mind|（大事なことを）覚えておく|
|2級|remind me of home|remind A of B|AにBを思い出させる|
|2級|wear out my shoes|wear out|（靴など）をすり減らす|
|2級|bring up an issue|bring up|（問題・話題）を持ち出す|
|2級|carry out a survey|carry out|（計画・調査など）を実行する|
|2級|find a way to help|find a way to|〜する方法を見つける（後ろに動詞の原形）|
|2級|refer to the chart|refer to|（資料など）を参照する|
|2級|in return for help|in return for|〜のお返しに|
|2級|allow her to enter|allow A to do|Aが〜するのを許す（Aは人、doは動詞の原形）|
|2級|let my friend down|let down|（人を）がっかりさせる|
|2級|be willing to help|be willing to|進んで〜する（後ろに動詞の原形）|
|2級|drop out of school|drop out of|（学校など）を中退する・途中でやめる|
|2級|take over the shop|take over|（事業など）を引き継ぐ|
|2級|a series of events|a series of|一連の〜|
|2級|come up with a plan|come up with|（考え・案）を思いつく|
|2級|turn water into ice|turn A into B|AをBに変える|
|2級|as long as you need|as long as|〜する限り（後ろに文）|
|2級|end up staying home|end up|結局〜することになる（後ろに-ing形など）|
|2級|feel like going out|feel like|〜したい気分だ（後ろに-ing形）|
|2級|give in to pressure|give in to|〜に屈する|
|2級|count on my friends|count on|〜を頼りにする|
|2級|ever since that day|ever since|〜以来ずっと|
|2級|a number of students|a number of|かなりの数の〜（後ろに複数名詞）|
|2級|encourage him to try|encourage A to do|Aが〜するよう励ます（Aは人、doは動詞の原形）|
|2級|along with my family|along with|〜と一緒に|
|2級|be related to health|be related to|〜に関連している|
|2級|prefer tea to coffee|prefer A to B|BよりAを好む|
|2級|had better leave now|had better|〜した方がよい（忠告、後ろに動詞の原形）|
|2級|persuade him to join|persuade A to do|Aが〜するよう説得する（Aは人、doは動詞の原形）|
|2級|in danger of closing|in danger of|〜の危険がある（後ろに名詞・-ing形）|
|2級|in time for the show|in time for|〜に間に合って|
|2級|be sick of the noise|be sick of|〜にうんざりしている|
|2級|break into the house|break into|（建物に）押し入る|
|2級|call off the meeting|call off|（予定・行事）を中止する|
|2級|care for the patient|care for|〜の世話をする|
|2級|put aside some money|put aside|（お金など）を取っておく|
|2級|think over the offer|think over|（案など）をよく考える|
|2級|use up all the paper|use up|〜をすべて使い切る|
|2級|go along with a plan|go along with|（案など）に賛同する|
|2級|so tired that I slept|so A that B|とてもAなのでBだ（Aは形容詞・副詞、Bは文）|
|2級|deal with the problem|deal with|（問題など）に対処する（dealを使う）|
|2級|figure out the answer|figure out|（答えなど）を考えて見つける|
|2級|so that she can study|so that|〜するように（目的を表し、後ろに文）|
|2級|get used to the noise|get used to|〜に慣れる（後ろに名詞・-ing形）|
|2級|look up to my teacher|look up to|（人を）尊敬する|
|2級|a wide range of books|a wide range of|幅広い種類の〜|
|2級|just in case it rains|just in case|万が一に備えて（後ろに文を続けられる）|
|2級|look into the problem|look into|（問題など）を調査する|
|2級|make use of this tool|make use of|〜を活用する|
|2級|in order to save money|in order to|〜するために（後ろに動詞の原形）|
|2級|suffer from a headache|suffer from|（病気・問題など）に苦しむ|
|2級|take part in the event|take part in|〜に参加する|
|2級|tea rather than coffee|rather than|〜よりもむしろ|
|2級|be similar to this one|be similar to|〜によく似ている|
|2級|be aware of the danger|be aware of|〜に気づいている|
|2級|live on a small income|live on|〜を主食にする・〜で生計を立てる|
|2級|be capable of swimming|be capable of|〜する能力がある（後ろに名詞・-ing形）|
|2級|consist of three parts|consist of|〜から成る|
|2級|except for one student|except for|〜を除いて|
|2級|in addition to English|in addition to|〜に加えて|
|2級|rely on her for advice|rely on A for B|BのためにAを頼る|
|2級|sign up for the course|sign up for|（講座など）に申し込む|
|2級|would rather stay home|would rather|むしろ〜したい（後ろに動詞の原形）|
|2級|compare this with that|compare A with B|AをBと比べる|
|2級|carry on with the work|carry on with|〜を続ける|
|2級|get by on little money|get by on|〜で何とか暮らす|
|2級|in place of my brother|in place of|〜の代わりに|
|2級|keep in touch with her|keep in touch with|〜と連絡を取り続ける|
|2級|sum up the main points|sum up|（要点など）をまとめる|
|2級|a variety of activities|a variety of|さまざまな種類の〜|
|2級|catch up with the class|catch up with|〜に追いつく|
|2級|concentrate on the task|concentrate on|〜に集中する|
|2級|prevent him from leaving|prevent A from doing|Aが〜するのを防ぐ（doingは動詞の-ing形）|
|2級|be concerned about costs|be concerned about|〜を心配している|
|2級|come across an old photo|come across|（人・物）に偶然出会う|
|2級|get along with my sister|get along with|〜と仲よくやっていく|
|2級|be made up of four teams|be made up of|〜で構成される|
|2級|in exchange for a ticket|in exchange for|〜と引き換えに|
|2級|provided that it is safe|provided that|〜であることを条件に（後ろに文）|
|2級|make sure that it is safe|make sure that|〜であることを確認する（後ろに文）|
|2級|pay attention to the sign|pay attention to|〜に注意を向ける|
|2級|be responsible for safety|be responsible for|〜に責任がある|
|2級|be involved in the project|be involved in|〜に関わっている|
|2級|in response to the request|in response to|〜に応じて|
|2級|put an end to the argument|put an end to|〜を終わらせる|
|2級|put the plan into practice|put into practice|（計画・考え）を実行に移す|
|2級|provide children with books|provide A with B|AにBを提供する|
|2級|be satisfied with the result|be satisfied with|〜に満足している|
|2級|not only students but also teachers|not only A but also B|AだけでなくBも|
|2級|in terms of cost|in terms of|〜の面では・〜の観点から|
|2級|cope with stress|cope with|（問題など）に対処する|
|2級|be free from worry|be free from|（心配・害など）がない|
|2級|bring about change|bring about|（変化など）をもたらす|
|2級|owing to the storm|owing to|〜のために（原因）|
|2級|for fear of failure|for fear of|〜を恐れて|
|2級|enable her to study|enable A to do|Aが〜できるようにする（doは動詞の原形）|
|2級|by means of a survey|by means of|〜という手段で|
|2級|in favor of the plan|in favor of|〜に賛成して|
|2級|be reluctant to speak|be reluctant to|〜するのをためらう（後ろに動詞の原形）|
|2級|put up with the noise|put up with|〜を我慢する|
|2級|keep track of expenses|keep track of|（出費・変化など）を記録して把握する|
|2級|take health for granted|take for granted|〜を当然のことと思う|
|2級|in contrast to the past|in contrast to|〜とは対照的に|
|2級|live up to expectations|live up to|（期待など）に応える|
|2級|not to mention the cost|not to mention|〜は言うまでもなく|
|2級|rule out the possibility|rule out|（可能性など）を除外する|
|2級|account for half the sales|account for|（割合）を占める|
|2級|be familiar with the rules|be familiar with|〜をよく知っている|
|2級|prohibit them from entering|prohibit A from doing|Aが〜するのを禁じる（doingは動詞の-ing形）|
|2級|take advantage of the chance|take advantage of|（機会など）を活用する|
|2級|be independent of her parents|be independent of|〜から自立している|
|2級|play an important role in health|play a role in|〜に役割を果たす|
|1級①|dawn on me|dawn on|（人に）ふとわかる|
|1級①|cater to demand|cater to|（需要・好みなど）に応える|
|1級①|drum up support|drum up|（支持・商売など）を集める|
|1級①|choke back tears|choke back|（涙・感情など）をこらえる|
|1級①|dip into savings|dip into|（貯金など）を少し使う|
|1級①|flesh out a plan|flesh out|（案など）を詳しく肉付けする|
|1級①|dote on her child|dote on|（人を）溺愛する|
|1級①|dwell on the past|dwell on|（過去など）をくよくよ考える|
|1級①|farm out the work|farm out|（仕事を）外部に委託する|
|1級①|abide by the rules|abide by|（規則など）を守る|
|1級①|bargain on success|bargain on|〜を当てにする|
|1級①|defer to an expert|defer to|（人の判断など）を尊重する|
|1級①|factor in the cost|factor in|（費用・事情など）を計算に入れる|
|1級①|fend off an attack|fend off|（攻撃など）を防ぐ|
|1級①|crack down on crime|crack down on|（犯罪など）を厳しく取り締まる|
|1級①|creep into the room|creep into|〜にそっと忍び込む|
|1級①|ease up on the rules|ease up on|（規制など）を緩める|
|1級①|fall back on savings|fall back on|（困ったときに）〜を頼りにする|
|1級①|cash in on popularity|cash in on|〜を利用して利益を得る|
|1級①|come in for criticism|come in for|（批判など）を受ける|
|1級①|boil down to one issue|boil down to|結局〜に帰着する|
|1級①|chip away at a problem|chip away at|（問題など）を少しずつ減らす|
|1級①|detract from the value|detract from|（価値など）を損なう|
|1級①|barge through the crowd|barge through|〜を強引に通り抜ける|
|1級①|come down on the company|come down on|（人・組織）を厳しく非難する|
|1級①|dispense with formalities|dispense with|（手続きなど）を省く|
|1級①|capitalize on an opportunity|capitalize on|（好機など）を生かす|
|1級②|tide him over|tide over|（人に困難な時期を）一時的にしのがせる|
|1級②|gang up on him|gang up on|（人を）集団で攻撃する|
|1級②|hike up prices|hike up|（価格など）を大幅に引き上げる|
|1級②|level with him|level with|（人に）率直に話す|
|1級②|scrimp on food|scrimp on|（費用など）を切り詰める|
|1級②|load up on food|load up on|（食料など）をたっぷり買い込む|
|1級②|revel in success|revel in|〜を大いに喜ぶ|
|1級②|settle on a plan|settle on|（案など）に決める|
|1級②|fritter away time|fritter away|（時間・お金）を無駄に使う|
|1級②|pick up on a clue|pick up on|（手がかりなど）に気づく|
|1級②|root for the team|root for|（チーム・人）を応援する|
|1級②|stock up on water|stock up on|（物資など）を買いだめする|
|1級②|gain on the leader|gain on|（先を行く人など）との差を縮める|
|1級②|grate on my nerves|grate on one's nerves|神経に障る（one'sはmy・yourなど）|
|1級②|nail down the date|nail down|（日付・条件など）をはっきり決める|
|1級②|pass up the chance|pass up|（機会など）を見送る|
|1級②|ride out the storm|ride out|（困難など）を何とか乗り切る|
|1級②|stave off a crisis|stave off|（危機など）を食い止める|
|1級②|tap into new ideas|tap into|（資源・発想など）を活用する|
|1級②|tip off the police|tip off|（人に）密告する・そっと知らせる|
|1級②|hinge on the result|hinge on|〜次第で決まる|
|1級②|leaf through a book|leaf through|（本など）をぱらぱらめくる|
|1級②|live down a mistake|live down|（失敗などの）悪い評判を消す|
|1級②|mete out punishment|mete out|（罰など）を与える|
|1級②|mull over the offer|mull over|（案など）をじっくり考える|
|1級②|own up to a mistake|own up to|（過ちなど）を認める|
|1級②|rip into the policy|rip into|（政策・人など）を激しく批判する|
|1級②|root out corruption|root out|（悪弊など）を根絶する|
|1級②|shrug off criticism|shrug off|（批判など）を気にせず受け流す|
|1級②|gloss over a problem|gloss over|（問題など）に詳しく触れずに済ます|
|1級②|iron out the details|iron out|（問題・食い違いなど）を解決する|
|1級②|lead up to the event|lead up to|（出来事など）の前に起きる・そこにつながる|
|1級②|swear by this method|swear by|（方法など）を強く信頼する|
|1級②|tamper with evidence|tamper with|（証拠など）を改ざんする|
|1級②|lag behind the others|lag behind|〜より遅れる|
|1級②|side with the workers|side with|（人・陣営）の側を支持する|
|1級②|sift through evidence|sift through|（証拠など）を丹念に調べる|
|1級②|glance over the report|glance over|（書類など）にざっと目を通す|
|1級②|gnaw at his confidence|gnaw at|（自信・心など）を徐々にむしばむ|
|1級②|harp on the same point|harp on|（同じこと）をしつこく言う|
|1級②|muscle into the market|muscle into|（市場など）に強引に参入する|
|1級②|opt out of the program|opt out of|（制度などへの）参加をやめる|
|1級②|roll out a new service|roll out|（新サービスなど）を導入する|
|1級②|shy away from conflict|shy away from|（争いなど）を避ける|
|1級②|stand in for the actor|stand in for|（人の）代役を務める|
|1級②|stumble upon an answer|stumble upon|（答え・物など）を偶然見つける|
|1級②|make off with the money|make off with|（物を）持ち逃げする|
|1級②|stack up against rivals|stack up against|〜と比べてどの程度であるか|
|1級②|go through with the plan|go through with|（計画など）を最後まで実行する|
|1級②|opt for the cheaper plan|opt for|（案など）を選ぶ|
|1級②|hunker down in the shelter|hunker down|身を潜める・腰を据えて取り組む|
|1級②|ingratiate oneself with the boss|ingratiate oneself with|〜に取り入る（oneselfはmyselfなど）|
