# 英検4級Level 2と長文の学習進行（2026-09-26）

## 対象・結果

- 4級Level 2を全文200件点検。146件を表現の核へ整理し、同じ核になる問題を統合して149問にした。件数合わせの追加はしない。元のgrade4.jsonは保存履歴照合用として変更しない。
- `be interested in science/music` → `be interested in`。既存例文を引き継ぎ、使い方はそこで確認する。take a picture、have a coldなど意味のまとまりは残す。
- 動名詞を伴う型（finish reading等）も残す。take A to B、help A with B等は途中の可変部分を飛ばして不自然な連結にせず、A・Bの枠を明示。入力も表示どおり。注意を使い方に追加。
- ほかの級・Levelの教材は変更なし。HPとダメージ計算も変更なし。

## 全英検Level 2・3の学習進行

- 成功許容：9文字以下は0ミス、10〜39文字は1ミス、40〜59文字は2ミス、60文字以上は3ミス。文字数は空白・句読点込み。単語Level 1と会話教材は従来どおり。
- 和訳・音声バトルは成功1回で「もう少し」。さらに同コース・同Levelのほかの問題を5問完成させ、その問題で再び成功すると「覚えた」。間隔不足の成功は習得回数に加算しない。少人数の問題リストで到達不能にしないため、出題可能問題が6問未満なら前回成功から2分経過でも次の成功を数える。
- リスニング練習は許容内の成功で「もう少し」まで。基礎練習では従来どおり自動習得を上げない。手動上書き状態は優先。大きなミスによる降格条件は維持。
- 通常抽選・優先復習・未習得保証を含め直近6問を避け、候補が少なければ最も前に出た問題を選ぶ。プレイヤー・級・Levelで分離し、モンスターをまたいで保持。短い間隔で同じ問題を連打して習得扱いにすることを防ぐ。
- 優先復習は直近5問中最大1問、待ち間隔10問分。少数ミスの完成は優先復習に入れず、古い同問題の待ち行列も解除する。スキップ・大きなミスは復習対象。
- バトル終了時も少数ミスだけでは苦手語へ再登録しない。ミスランキングとAI相談用の記録は残す。

## 保存互換

- 旧4級Level 2のキーから新しい核へ学習状態・除外・選択・ブックマーク・保存リスト・復習待ち行列を移行。
- 統合前の学習段階は最も進んだものを引き継ぐ。手動上書き・除外は最新更新のものを使用。新しい核の記録が既にあれば上書きしない。
- 旧キー・元の弱点履歴は保全し、他級にも共有される旧熟語を破壊しない。移行済みの旧苦手語には印を保持し、克服済みの核を再生成しない。核の履歴がない場合に旧ミス数を合算。
- 習得の成功回数・待ち問題数・成功時刻はプレイヤーの状態に保存。再読込・別PCへの学習データ移行で保持する。
- AI相談の過去記録はその時点の実入力として変更しない。

## 検証

- test-phrase-learning.mjs：149問の一意性、146変更の対応、全例文、旧キー/選択/保存リスト/復習/苦手語の移行と再実行、克服後の再登録防止、少数ミス境界、間隔付き習得、候補1/2/5/7/20件の選択。
- test-learning-question-balance.mjs：既存80%・3/10保証、プレイヤー隔離等。
- test-grade5-sentence-balance.mjs：全級Level 3ダメージ2,400,510件・対象外69,552件の既存計算を維持。
- 旧和訳/類義語の履歴テストは保存した旧4級Level 2を参照し、それ以外の教材を引き続き固定ハッシュで検査。新4級は専用テストで検証。
- build成功、lintエラー0・既存Hook警告1。隔離した無音Chromeで実入力による少数ミス成功・即時反復の昇格防止・モンスターをまたぐ出題間隔・間隔後の習得を確認。
- 実機IME・実音声・スマホ実機は未検証。今回はローカル実装のみ、commit/pushは未実施。

## 変更一覧（統合される具体例も記載）

| 元の問題 | 新しい出題 | 和訳 |
|---|---|---|
| want to play soccer | want to | 〜したい（wantを使う） |
| want to visit Kyoto | want to | 〜したい（wantを使う） |
| like to read books | like to | 〜するのが好きだ（likeの後にto） |
| want to be a doctor | want to be | 〜になりたい |
| need to finish homework | need to | 〜する必要がある |
| need to leave soon | need to | 〜する必要がある |
| go back home | go back | （元の場所へ）戻る・戻っていく |
| go back to my room | go back | （元の場所へ）戻る・戻っていく |
| go back to school | go back | （元の場所へ）戻る・戻っていく |
| do my homework after dinner | do homework | 宿題をする |
| do my homework | do homework | 宿題をする |
| take my bag to school | take A to B | AをBへ持っていく・連れていく（A・Bは入れ替える部分） |
| take my sister to school | take A to B | AをBへ持っていく・連れていく（A・Bは入れ替える部分） |
| leave Tokyo for Osaka | leave A for B | Aを出てBへ向かう（A・Bは場所） |
| leave home for school | leave A for B | Aを出てBへ向かう（A・Bは場所） |
| look for my key | look for | 〜を探す |
| look for my glasses | look for | 〜を探す |
| wait for the train | wait for | 〜を待つ |
| wait for the bus | wait for | 〜を待つ |
| stay in a tent | stay in | （部屋・建物など）の中に泊まる・滞在する |
| stay with my cousin | stay with | （人）の家に泊まる |
| stay with my aunt | stay with | （人）の家に泊まる |
| wake up | wake up | 目を覚ます（寝床を出るとは限らない） |
| wake up early tomorrow | wake up | 目を覚ます（寝床を出るとは限らない） |
| speak to my mother | speak to | 〜に話しかける（speakを使う） |
| speak to my teacher | speak to | 〜に話しかける（speakを使う） |
| talk to my mother | talk to | 〜に話す（talkの後にto） |
| talk to my friend | talk to | 〜に話す（talkの後にto） |
| talk with my father | talk with | 〜と話す（talkの後にwith） |
| talk with my mother | talk with | 〜と話す（talkの後にwith） |
| listen to English | listen to | 〜に耳を傾ける・〜を聞く |
| listen to music | listen to | 〜に耳を傾ける・〜を聞く |
| hear about the festival | hear about | 〜について耳にする |
| hear about the news | hear about | 〜について耳にする |
| finish reading this book | finish reading | 読み終える（finishの後に-ing形） |
| finish reading | finish reading | 読み終える（finishの後に-ing形） |
| enjoy playing soccer | enjoy playing | 遊ぶこと・競技をすることを楽しむ |
| enjoy playing tennis | enjoy playing | 遊ぶこと・競技をすることを楽しむ |
| come back to school | come back | （元の場所へ）戻ってくる |
| come back to Japan | come back | （元の場所へ）戻ってくる |
| come back from China | come back from | 〜から帰ってくる |
| come back from school | come back from | 〜から帰ってくる |
| arrive at the airport | arrive at | （駅などの地点）に着く（arriveを使う） |
| arrive at the station | arrive at | （駅などの地点）に着く（arriveを使う） |
| arrive in Kyoto | arrive in | （国・都市）に着く（arriveを使う） |
| arrive in Tokyo | arrive in | （国・都市）に着く（arriveを使う） |
| get to the library | get to | （場所）に着く（getを使う） |
| get to school | get to | （場所）に着く（getを使う） |
| start to study | start to | 〜し始める（startの後にto） |
| stop talking in class | stop talking | 話すのをやめる（stopの後に-ing形） |
| stop talking | stop talking | 話すのをやめる（stopの後に-ing形） |
| walk to the library | walk to | 〜へ歩いて行く |
| walk to school | walk to | 〜へ歩いて行く |
| ask for help | ask for | 〜を求める |
| ask for water | ask for | 〜を求める |
| help my friend with homework | help A with B | AのBを手伝う（Aは人、Bは仕事など） |
| help my mother with dinner | help A with B | AのBを手伝う（Aは人、Bは仕事など） |
| say goodbye to my teacher | say goodbye to | 〜にさよならを言う |
| say goodbye to my friend | say goodbye to | 〜にさよならを言う |
| think of my family | think of | 〜のことを考える・〜を思いつく |
| think of my future | think of | 〜のことを考える・〜を思いつく |
| think of a good idea | think of | 〜のことを考える・〜を思いつく |
| become friends with Tom | become friends with | 〜と友達になる（becomeを使う） |
| become friends with him | become friends with | 〜と友達になる（becomeを使う） |
| get off the train | get off | （電車・バスなど）を降りる |
| get off the bus | get off | （電車・バスなど）を降りる |
| go around the lake | go around | 〜のまわりを回る |
| go around the park | go around | 〜のまわりを回る |
| move to Tokyo from Osaka | move to | 〜へ引っ越す |
| move to Tokyo | move to | 〜へ引っ越す |
| write to my teacher | write to | 〜に手紙を書く |
| write to my friend | write to | 〜に手紙を書く |
| worry about homework | worry about | 〜を心配する |
| worry about my test | worry about | 〜を心配する |
| worry about the test | worry about | 〜を心配する |
| look like my mother | look like | 〜に似ている・〜のように見える |
| look like my father | look like | 〜に似ている・〜のように見える |
| believe in my dream | believe in | 〜を信じる |
| believe in yourself | believe in | 〜を信じる |
| a lot of books | a lot of | たくさんの〜 |
| a lot of people | a lot of | たくさんの〜 |
| be late for class | be late for | 〜に遅れる |
| be late for school | be late for | 〜に遅れる |
| be interested in music | be interested in | 〜に興味がある |
| be interested in science | be interested in | 〜に興味がある |
| kind of tired | kind of | 少し・なんとなく（くだけた言い方） |
| a glass of milk | a glass of | グラス一杯の〜 |
| a glass of water | a glass of | グラス一杯の〜 |
| a cup of coffee | a cup of | カップ一杯の〜 |
| a cup of tea | a cup of | カップ一杯の〜 |
| as busy as my mother | as busy as | 〜と同じくらい忙しい |
| from Tokyo to Kyoto | from A to B | AからBまで（A・Bは場所や時刻など） |
| from Tokyo to Osaka | from A to B | AからBまで（A・Bは場所や時刻など） |
| twelve years old | years old | 〜歳（前に年齢の数字を置く） |
| ten years old | years old | 〜歳（前に年齢の数字を置く） |
| in front of the library | in front of | 〜の前に |
| in front of the station | in front of | 〜の前に |
| next to the park | next to | 〜のとなりに |
| next to the school | next to | 〜のとなりに |
| out of the room | out of | 〜の中から外へ |
| out of the box | out of | 〜の中から外へ |
| both soccer and tennis | both A and B | AとBの両方（A・Bは入れ替える部分） |
| both dogs and cats | both A and B | AとBの両方（A・Bは入れ替える部分） |
| have to study tonight | have to | 〜しなければならない |
| have to study | have to | 〜しなければならない |
| like playing tennis | like playing | 遊ぶこと・競技をすることが好きだ |
| stay at a hotel | stay at | （ホテルなど）に泊まる・滞在する |
| ask my teacher for help | ask A for B | AにBを求める（Aは人、Bは助け・物など） |
| as tall as my father | as tall as | 〜と同じくらい背が高い |
| be afraid of dogs | be afraid of | 〜を怖がる |
| be good for you | be good for | 〜のためになる・〜によい |
| be ready for class | be ready for | 〜の準備ができている |
| be proud of him | be proud of | 〜を誇りに思う |
| be surprised at the news | be surprised at | 〜に驚く |
| belong to my brother | belong to | 〜のものだ・〜に所属する |
| care for animals | care for | 〜の世話をする（careを使う） |
| decide to stay home | decide to | 〜することに決める |
| enjoy cooking dinner | enjoy cooking | 料理することを楽しむ |
| feel like dancing | feel like | 〜したい気がする（後ろに-ing形） |
| find out the answer | find out | （調べて答え・事実など）を見つけ出す |
| get along with her | get along with | 〜と仲良くする |
| get ready for school | get ready for | 〜の準備をする |
| go abroad next year | go abroad | 海外へ行く |
| grow up in Tokyo | grow up | 成長する・育つ |
| have a fever today | have a fever | 熱がある |
| have a look at this | have a look at | 〜を見てみる |
| hear from my friend | hear from | 〜から連絡をもらう |
| keep on studying | keep on | 〜し続ける（後ろに-ing形） |
| know about Japan | know about | 〜について知っている |
| look forward to summer | look forward to | 〜を楽しみにする（後ろに名詞・-ing形） |
| make friends with her | make friends with | 〜と友達になる（makeを使う） |
| pay for the ticket | pay for | 〜の代金を払う |
| plan to visit Kyoto | plan to | 〜する予定である |
| practice playing the piano | practice playing | 演奏すること・競技をすることを練習する |
| remember to call Mom | remember to | 忘れずに〜する |
| run away from home | run away from | 〜から逃げ出す |
| spend time with family | spend time with | 〜と時間を過ごす |
| take care of my dog | take care of | 〜の世話をする（takeを使う） |
| take part in the game | take part in | 〜に参加する |
| talk about the movie | talk about | 〜について話す |
| thank you for coming | thank you for | 〜をありがとう（後ろに名詞・-ing形） |
| try to speak English | try to | 〜しようとする |
| turn into a bird | turn into | 〜に変わる |
| use this for homework | use A for B | AをBに使う（Aは物、Bは目的など） |
| work hard at school | work hard | 一生懸命取り組む |
| be different from my old bag | be different from | 〜とは違う |

