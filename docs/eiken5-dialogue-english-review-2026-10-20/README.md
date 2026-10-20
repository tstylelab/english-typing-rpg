# 英検5級のモンスター会話・半分英語案

2026-10-20作成。同日、ユーザーの承認を受けて本体へ反映。

確認URL: http://127.0.0.1:5196/docs/eiken5-dialogue-english-review-2026-10-20/index.html

## 内容

- 全Level 1〜3、129体、1,092本。英語546本（50%）、日本語主体546本（うち2本に英語も混在）。各Level 43体・364本中182本を英語にする。
- 通常敵は8本中4本、ボスは12本中6本。登場・撃破はすべて現行のまま。戦闘2本・寄り道1本・低HP1本を英語にし、ボスは戦闘・寄り道をもう1本ずつ英語にする。
- 既に英語の寄り道がある場合は、その枠を優先して調整。日本語の長い冗談や掛け合いも残す。
- 英語546本のうち2本は現行と完全一致。544枠を変更する案。英語は最大8語・46文字。同じ英文の完全重複なし。
- 基本語・現在形・命令・短い疑問文を中心に、キャラ固有の語や短い口語表現を混ぜる。公式の5級配当語だけに限定したものではない。短いことと、すべての初心者が読めることは同義ではないので、本人の確認で難しすぎる箇所を調整する。
- レビュー用の意味欄には、一部の決まり文句・言葉遊びの説明も付けた。ゲーム中の和訳併記や新しい学習機能は実装していない。
- 50%は原稿本数の割合。既存選択処理と戦闘経過による実際の表示頻度は別。吹き出し確認は原稿順のプレビューであり、ゲーム実機検証ではない。

## ファイル

- `level1.txt`〜`level3.txt`: 人が読んで修正する英語案と意味。1体ごとの4行または6行の順番はbuild-review.mjsのslotsを参照。
- `review.json`: 現行・提案・意味・キャラの性格・絵の特徴・全1,092行の比較。
- `proposal.json`: 現行と同形式のEiken5向け提案129体。承認済み生成用overlayに集約して本体へ反映済み。
- `baseline.json`: 着手時のsrc全体・既存変更スクリプト・package等159ファイルのSHA-256。後から本体が変わっていたら、古い案で上書きせず差分を再確認する。
- `build-review.mjs`: 129体・ID/名前/画像・本数・全登場/撃破不変・文字数/語数・現行ソース不変を確認してページを生成。
- `check-ui.mjs`: 独立した空のChromeコンテキストで一覧・全英語/意味・画像・検索/絞り込み・URL復元・意味/現行表示の切替・プレビュー・画面幅を確認。学習データを作らない。
- `ui-verification.json`, `review-desktop.png`, `review-mobile.png`: 確認結果と画面画像。

## 再生成・検証

```powershell
node docs/eiken5-dialogue-english-review-2026-10-20/build-review.mjs --complete
node docs/eiken5-dialogue-english-review-2026-10-20/check-ui.mjs
```

ローカルサーバーが必要。使用中の5196番が停止している場合のみ、`npm run dev -- --host 127.0.0.1 --port 5196 --strictPort` で起動する。

本体反映時にアプリ全体のビルド、全モンスターのセリフ遷移、保存互換性、独立Chromeでの実バトル表示・回答・記録保持を検証。音声の主観的確認・実機キーボード・本人の読みやすさは未検証。ユーザーの利用中ブラウザーや実保存データは操作しない。

## 承認後の本体反映

5級・4級のセリフを承認済みoverlay `docs/monster-dialogue-drafts-2026-10-17/approved-english-2026-10-20.json` に集約。`node docs/monster-dialogue-drafts-2026-10-17/build-runtime.mjs` で本体へ再生成する。登場/撃破や対象外コース、保存処理・HP・出題・セリフ選択処理は変更していない。

上記build-review.mjsとbaseline.jsonは提案作成時点の変更前データを照合するための資料で、本体反映後にはソース差分を検出して停止する。review.json/proposal.jsonは確認・採用した原稿のスナップショットとして保持する。本体反映後の検証は `node scripts/test-bilingual-monster-dialogues.mjs`、`node scripts/test-monster-dialogues.mjs`、`node scripts/test-ui-progress-compatibility.mjs`、`node scripts/test-bilingual-monster-dialogues-ui.mjs` を使う。
