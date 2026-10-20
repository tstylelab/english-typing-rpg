# 英検4級のモンスター会話・半分英語案

2026-10-20作成。同日、ユーザーの承認を受けて本体へ反映。

確認URL: http://127.0.0.1:5196/docs/eiken4-dialogue-english-review-2026-10-20/index.html

## 内容と方針

- 全Level 1〜3、129体、1,092本中546本を英語にする案。日本語も546本。各Levelは43体・364本中182本が英語。
- 通常敵は全8本中4本、ボスは全12本中6本。登場・撃破はすべて現行のまま。戦闘2本・寄り道1本・低HP1本を英語化し、ボスは戦闘と寄り道をもう1本ずつ英語化する。
- 現行ですでに英語の寄り道がある場合は、その枠から調整する。残す日本語の冗談・口調・登場と撃破でキャラらしさも保つ。
- 最大10語・56文字。基本語を軸に短い会話、過去形、未来の表現を使い、身近な口語や言葉遊びも少数加えた。公式の4級配当語だけに限定したものではない。キャラ固有の語や補助的に楽しむ表現の読みやすさは本人確認で調整する。
- I'm all ears、Stay cool、Hang onなどの口語、whole/hole、reel/realなどの音や意味の重なりは、確認用の意味欄に説明した。日本語の「すべる」等をそのまま英語の意味として当てはめず、自然な出来事や言い方に作り直した。
- 英語の完全重複なし。本数50%は表示頻度50%の保証ではない。戦闘経過・HPと既存の選択処理により実際の頻度は変わる。
- 意味と元セリフは確認ページだけの機能。ゲーム中の和訳併記・新しい学習機能・セリフ選択処理は実装していない。吹き出しは原稿順の簡易プレビューで、本体の頻度再現ではない。

## 元データ・保存物

- 現在のセリフ正本は `src/monsterDialogues.json` の `Eiken4:` 129体。性格・画像の参考は既存の `docs/monster-dialogue-drafts-2026-10-17/catalogue.json`。画像は現在の `public/monsters/eiken4-v2-level1〜3/256/`。
- `level1.txt`〜`level3.txt`: 英語案と意味の編集用原稿。4行/通常敵、6行/ボス。
- `review.json`: 全1,092行の現行・提案・意味とキャラ別比較。
- `proposal.json`: 現行と同形式のEiken4向け提案データ。承認済み生成用overlayに集約して本体へ反映済み。
- `baseline.json`: 着手時の174ファイルのSHA-256。本体src全体、既存変更スクリプト、package等に加え、先に作成した5級レビュー資料全体と参照catalogueも保護対象。
- `build-review.mjs`: ID・名前・本数・画像・英語比率・語数/文字数・登場撃破不変・現行ソースと5級資料不変を検証して一覧を生成。
- `check-ui.mjs`: 独立した空のChromeコンテキストで全129体・全英文と意味・画像・検索/絞り込み・表示切替・URL復元・吹き出し・各画面幅を確認。
- `ui-verification.json`, `review-desktop.png`, `review-mobile.png`: 確認結果と画面画像。

## 再生成

```powershell
node docs/eiken4-dialogue-english-review-2026-10-20/build-review.mjs --complete
node docs/eiken4-dialogue-english-review-2026-10-20/check-ui.mjs
```

5196番の既存ローカルサーバーを再利用。停止している場合だけ `npm run dev -- --host 127.0.0.1 --port 5196 --strictPort` で起動する。

本体反映時にアプリ全体のビルド、セリフ遷移、保存互換性、独立Chromeでの実バトル表示・回答・記録保持を検証。学習者の実ブラウザー・実保存データには触れない。実機入力・音声・本人の読みやすさは未検証。

## 承認後の本体反映

5級・4級のセリフを承認済みoverlay `docs/monster-dialogue-drafts-2026-10-17/approved-english-2026-10-20.json` に集約。`node docs/monster-dialogue-drafts-2026-10-17/build-runtime.mjs` で本体へ再生成する。登場/撃破や対象外コース、保存処理・HP・出題・セリフ選択処理は変更していない。

上記build-review.mjsとbaseline.jsonは提案作成時点の変更前データを照合するための資料で、本体反映後にはソース差分を検出して停止する。review.json/proposal.jsonは確認・採用した原稿のスナップショットとして保持する。本体反映後の検証は `node scripts/test-bilingual-monster-dialogues.mjs`、`node scripts/test-monster-dialogues.mjs`、`node scripts/test-ui-progress-compatibility.mjs`、`node scripts/test-bilingual-monster-dialogues-ui.mjs` を使う。
