> 2026-10-20：本人の「準2級までで一旦ストップし、コミット・プッシュ」の依頼により、3級・準2級の承認済みセリフを本体へ反映。以下は制作・検証時点の記録です。review/proposal/baseline.jsonは提案時点の比較を保持しています。
> 本体やこの資料の表示を反映済みに変更したため、旧build-review.mjsは基準SHA不一致で停止します。baselineを上書きして回避せず、現行の本体検証にはscripts/test-bilingual-monster-dialogues.mjsとscripts/test-monster-dialogues.mjsを使ってください。scripts/apply-intermediate-bilingual-dialogues-20261020.mjsは公開5級・4級だけの状態から適用する一回用です。

# 英検準2級・半分英語のモンスター会話案

2026-10-20作成。本体へ反映する前の確認用資料。コミット・プッシュ・公開は行っていない。

確認ページ：http://127.0.0.1:5196/docs/eikenpre2-dialogue-english-review-2026-10-20/index.html

## 原稿の範囲と方針

全Level 1〜3の129体、全1,092本中546本を英語にする案。各Level43体・364本中182本。通常敵は8本中4本、ボスは12本中6本。残り546本は日本語主体で、うち1本は現行の「共演NG」を含む。登場・撃破と、英語化対象以外のセリフは保持した。

「半分」は登場・撃破も含めた原稿本数の割合であり、プレイ中の英語表示頻度を50%に制御するものではない。実際の表示頻度は既存の選択処理や戦闘の進み方による。

現行の性格・セリフ・画像設定を参照し、短く自然な会話を優先。少数の口語や言葉遊びを、温泉大王のthrow in the towel、湯たんぽ伯爵のkeep my coolなど、キャラに結びつけて使った。最長12語・67文字、完全一致の英文重複なし。キャラ固有語や口語も含み、英検準2級の公式配当語のみを使ったという意味ではない。

元の日本語を逐語訳するより、英語として成立する短い冗談に作り直した。意味欄は確認用の文脈訳で、一部の口語のニュアンスも説明している。ゲーム中への和訳併記は実装していない。

## ファイル

- `level1.txt`〜`level3.txt`：編集用の英文と日本語の意味。通常4組・ボス6組。
- `review.json`：全セリフのbefore/after/意味、名前・性格・画像パス、集計。
- `proposal.json`：準2級129体の提案データ。本体へコピーしていない。
- `page-template.html` / `index.html`：確認ページのひな型と生成結果。
- `build-review.mjs` / `baseline.json`：生成・検証処理と着手時の保護対象206ファイルのSHA256。
- `check-ui.mjs` / `ui-verification.json`：隔離したChromeによる確認ページ検査と結果。
- `review-desktop.png` / `review-mobile.png`：表示確認用の画面画像。

## 検証

```text
node docs/eikenpre2-dialogue-english-review-2026-10-20/build-review.mjs --complete
node docs/eikenpre2-dialogue-english-review-2026-10-20/check-ui.mjs
npx eslint docs/eikenpre2-dialogue-english-review-2026-10-20/build-review.mjs docs/eikenpre2-dialogue-english-review-2026-10-20/check-ui.mjs
```

129体のID・名前・画像・本数、各体の英語比率、登場／撃破不変、語数・文字数を検証。既存の英語だけの寄り道セリフを優先して置き換え、日本語にNG等が含まれる行を誤って優先しないようにした。

本体src全体、既存5級・4級・3級のレビュー資料、承認済み英語overlayと本体生成処理、元catalogue、package関連、既存未コミットのgrade5 UI検査等の206ファイルは、着手時と同一SHA。今回作成した資料は、このフォルダ内のみ。

独立した空のheadless Chromeで全546英文と意味のDOM一致、129画像、Level・区分・通常敵／ボスのフィルター、検索、意味／元セリフ切替、URL再読込、原稿順の吹き出しプレビューを確認。全129体の表示時を含む1366/820/390/320pxで横はみ出しなし、JavaScriptエラーなし、localStorage／sessionStorageは空のまま。PC・スマホ幅の画面画像も目視した。

本体コード未変更なのでアプリ全体のbuildと過去教材テストは繰り返していない。実バトル、実機入力、音声、本人の読みやすさは未検証。利用者の実ブラウザーや保存データは操作していない。

## 次の作業

本人の内容確認と必要な修正を待つ。本体採用・コミット・公開には別の具体的な依頼が必要。採用時には最新ソースと再比較し、古いproposal全体で以後の更新を上書きしない。保護対象が変わった場合、生成処理はSHA不一致で停止する。
