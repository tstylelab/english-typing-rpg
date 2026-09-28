# 英検4級・理解から出発する文法ガイド

## 方針と結果

問題に説明を後付けするだけではなく、4級を学ぶ子が次の文を理解するために必要な土台と型を先に点検した。5級の基本は短く再確認でき、詳しく戻りたい場合は5級ガイドを別タブで開ける。

- 33カード、3グループ。型・例文2つ・短い要点・任意の補足。色分けした文の分解例、目次、カード保存。
- 4級Level3は200→209問（+4.5%）。元の200問の英文・和訳・順序は完全保持。既存の名詞差し替え練習を追加して数を水増ししない。
- Level1/2・他級の教材、戦闘のHP・問題数・採点・習得判定には変更なし。追加によって1戦の問題数や敵HPが増えるわけではない。
- ホームの「4級・文のしくみ」、結果の各問題から対応カードへ直行。解説を閉じると元の結果位置・フォーカスへ戻る。
- 既存200問にも復習として意味のある言い換え・異なる場面があるため、今回は既存問題を削除しない。

## 理解のための点検

### 目次・見出しの改善

- 各項目の上段に具体的な英単語・表現、下段に文法名や短い意味を表示。単に参考書風の日本語用語にするのではなく、どの英語を学ぶかが開く前に分かる形にする。
- 例：I am・She likes・I’m／主語・be動詞・一般動詞・短縮形、must・have to／義務・禁止・必要なし、to buy・to play／不定詞（目的）：〜するために。
- 目次は等幅の2段ボタン（PC3列、中小画面2列、360px以下1列）。カードにも同じ見出しを表示。明るい3色の区分は維持。
- この見出し修正では解説本文・209問・33カードのID・保存データを変更しない。5級は従来表示を維持。全項目に具体的な英語があることをデータテストに追加。

| 学ぶ内容 | 説明の組み立て | 練習の判断 |
|---|---|---|
| 文の主役・名詞/動詞・be/一般動詞・短縮形 | 先頭カードで日本語と色分け。疑問詞、冠詞/代名詞/前置詞も入口に | 既存問題と5級ガイドを活用 |
| 現在進行形、過去のbe/一般動詞、過去進行形 | 「今の習慣」「そのときの状態」「動作の途中」を分離。肯定/否定/疑問を比較 | 既存で十分な肯定・疑問は追加しない。was notとwas not ingを各1問 |
| willとbe going to | 意思・予想・予定を説明。両方が可能な場面も明記 | 否定形のみ各1問 |
| 存在のthere | 現在/過去、単数/複数。nobodyとnotを重ねない | 既存を使用 |
| can、許可、依頼、申し出、助言、義務、禁止 | Can I help you?を能力の説明に飛ばさない。must notとdo not have toを比較 | 既存を使用 |
| 比較級、最上級、同等比較 | er/more、est/most、as…asを分離。元の形・不規則形も補足 | 比較級・最上級は既存で十分。同等比較の肯定/否定を各1問 |
| 不定詞の「こと」「目的」「理由」 | toが見えたら全て「ために」としない。役割別にカードを分ける | 既存を使用 |
| 動名詞・前置詞＋ing | 進行形との違い、enjoy/finish、for/at、look forward to | 既存を使用 |
| something、everyone等 | 後ろからの修飾、単数扱い、否定の意味 | 既存を使用 |
| because/when/if/before/after、and/but/or | 短い文2つに分解。未来の条件・時の節では普通現在形 | 既存whenを活用し、because/if/before節を各1問 |
| think/hope＋文、人＋物、tell/ask＋人＋to、how to、It is…to、所要時間 | 長いまとまりを部品として見る | 既存を使用。収録済みの発展形まで説明し、追加の難問は作らない |
| 会話の省略・定型表現 | 前後の場面と結びつけ、一般の作文とは区別 | 既存を使用 |

この一覧は独自の学習用整理であり、英検公式の全出題範囲表や網羅保証ではない。既存収録の発展表現も含む。文法一覧だけで読解・聞き取り・語彙全てを教え切るものではない。

## 追加した9問

| 英文 | 補うもの |
|---|---|
| Ken is as tall as Tom. | 同じくらいの比較 |
| This bag is not as heavy as yours. | 〜ほどではない |
| I stayed home because I was sick. | 理由の文をつなぐ |
| If it rains, I will stay home. | 条件を表すifと現在形 |
| Wash your hands before you eat. | before＋文（名詞との違い） |
| She was not busy yesterday. | 過去のbe動詞の否定 |
| I was not sleeping then. | 過去進行形の否定 |
| I will not go out tonight. | willの否定 |
| We are not going to swim today. | 予定の否定 |

英文22〜34文字。和訳に必要な短縮形・構文の指定を添えた。9問の短い文法注釈も明示登録し、従来の自動推定だけで「be動詞」等に分類されないようにした。

## 実装・保存互換

- `grade4GrammarGuide.ts`と`grade4GrammarAssignments.ts`で全209問のリンクを個別に管理。キーワード一致による飛び先の推測はしない。
- `GrammarGuide.tsx`へ5級の既存画面を共通化。`grammarGuides.ts`の級別定義で内容を切り替える。5級のカードID、保存キー、221問は保持。
- 保存キーは `etyping_grammar_bookmarks_v1:<player>:Eiken4`。5級とは独立し、同じcard IDも混ざらない。既存の端末間同期や書き出しには含めないと画面に明記。
- 旧保存成績は削除・書き換えない。未知の問題や他級・Level1/2には文法リンクを出さない。
- 現行教材は `src/data/questionSets/eiken/grade4.json` を元に確認。古いmaster CSVからの再生成は今回実行しない。今回以外の和訳修正等も上書きし得るため、再生成時は現行JSONとの照合が必要。

## 検証

- `node scripts/test-grade4-grammar-guide.mjs`：209問/33カード、9問の追加、元の200問とLevel1/2の完全一致、全対応、意味の違う類似構文、対象外の分離。
- `node scripts/test-grade5-grammar-guide.mjs`、`node scripts/test-grammar-bookmarks.mjs`：5級維持、級/プレイヤー分離、保存失敗、壊れた保存値の保護。
- 共通UIテスト：`TEST_GRAMMAR_COURSE=Eiken4` または `Eiken5` で `scripts/test-grade5-grammar-guide-ui.mjs` を実行。無音の隔離Chromeで1366/390/320px。実入力→結果→対応カード、目次、保存/再読込、フォーカス/スクロール復帰、保存データ非変更、横はみ出し、実行時エラーを確認。
- 戦闘バランス・上位級熟語移行の回帰テスト、build、lint（既存warning1件）を確認。
- 実機Android/iOSでの確認は未実施。公開サイトにはまだ反映せず、ローカル `http://127.0.0.1:5178/?guide=eiken4` で確認する。

## 参考資料

- [英検公式・4級](https://www.eiken.or.jp/eiken/exam/grade_4/)：試験情報。こちらを独自カードの公式範囲認定とは扱わない。
- [British Council・比較](https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/comparative-superlative-adjectives)
- [British Council・toとing](https://learnenglish.britishcouncil.org/free-resources/grammar/a1-a2/verbs-followed-ing-or-infinitive)
- [British Council・条件文](https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/conditionals-zero-first-second)：今回の補強は基本のif＋現在形のみ。仮定法の発展範囲を追加する根拠にはしていない。
