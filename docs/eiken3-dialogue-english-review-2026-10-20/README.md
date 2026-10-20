> 2026-10-20：本人の「準2級までで一旦ストップし、コミット・プッシュ」の依頼により、3級・準2級の承認済みセリフを本体へ反映。以下は制作・検証時点の記録です。review/proposal/baseline.jsonは提案時点の比較を保持しています。
> 本体やこの資料の表示を反映済みに変更したため、旧build-review.mjsは基準SHA不一致で停止します。baselineを上書きして回避せず、現行の本体検証にはscripts/test-bilingual-monster-dialogues.mjsとscripts/test-monster-dialogues.mjsを使ってください。scripts/apply-intermediate-bilingual-dialogues-20261020.mjsは公開5級・4級だけの状態から適用する一回用です。

# 英検3級・半分英語のモンスター会話案

2026-10-20作成。確認用の提案であり、本体へは未反映。コミット・プッシュ・公開も行っていない。

## 確認ページ

http://127.0.0.1:5196/docs/eiken3-dialogue-english-review-2026-10-20/index.html

Level 1〜3の全129体。全1,092本のうち英語546本・日本語546本。各Levelは43体・364本中182本が英語。通常敵は8本中4本、ボスは12本中6本。登場・撃破、残す日本語のセリフを保持。これは原稿本数の割合であり、実バトルの表示頻度が50%になる保証ではない。

## 原稿の方針

現行の性格設定・日本語のセリフ・画像設定を参照し、逐語訳よりキャラらしい自然な短い発言を優先した。基本的な会話に加え、現在完了や受け身、少数の口語・言葉遊びを含む。最長12語・64文字。キャラ固有の語も含み、英検3級の公式配当語だけに限定した資料ではない。

意味欄には一部の口語表現の説明を添えている。日本語だけで成立する意味の重なりを英語の慣用句として説明しないよう見直した。意味欄はレビュー用であり、ゲーム中に和訳を併記する機能の提案・実装ではない。

## ファイル

- `level1.txt`〜`level3.txt`：編集用の英文と日本語の意味。通常4組、ボス6組。
- `review.json`：名前・性格・画像パス、現行と提案の全セリフ、意味、集計。
- `proposal.json`：3級129体だけの提案データ。本体へコピーしていない。
- `page-template.html` / `index.html`：確認ページのひな型／生成結果。
- `build-review.mjs`：原稿と現行データから生成・検証。
- `baseline.json`：着手時の保護対象192ファイルのSHA256。
- `check-ui.mjs` / `ui-verification.json`：独立した空のChrome環境での表示検査／結果。
- `review-desktop.png` / `review-mobile.png`：確認ページの画面画像。

## 検証

```text
node docs/eiken3-dialogue-english-review-2026-10-20/build-review.mjs --complete
node docs/eiken3-dialogue-english-review-2026-10-20/check-ui.mjs
npx eslint docs/eiken3-dialogue-english-review-2026-10-20/build-review.mjs docs/eiken3-dialogue-english-review-2026-10-20/check-ui.mjs
```

生成時に129体のID・名前・画像・セリフ本数、登場／撃破不変、英語比率、語数・文字数、完全一致の英文重複を検査。保護対象はsrc全体、既存の5級／4級レビュー資料、公開済みの英語overlayと生成処理、元catalogue、package関連、既存未コミットのgrade5 UI検査など。192ファイルが開始時と同一であることを確認した。

表示検査は全546英文と意味のDOM一致、129画像、Level・区分・通常敵／ボスのフィルター、検索、意味／元の表示切替、URL再読込、原稿順の吹き出しプレビュー、1366/820/390/320pxの横はみ出し、JavaScriptエラーを確認。テスト用ChromeのlocalStorage／sessionStorageは空のまま。利用者の実ブラウザーや保存データにはアクセスしない。

本体コード未変更のためアプリ全体のビルド・過去教材のテストは繰り返していない。実バトルへの組込み、実機入力、音声、本人の読みやすさは未確認。公開済みの5級・4級は今回変更していない。

## 採用する場合の注意

確認後の具体的な依頼を待つ。現行の名前・ID・順番・保存形式・セリフ選択処理を保持する。採用時には最新ソースと比較し、ここに保存した古いproposal全体で以後の変更を上書きしない。保護対象が変わった後の生成はハッシュ不一致で停止する仕様。
