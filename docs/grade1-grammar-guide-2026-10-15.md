# 英検1級①・②の文のしくみ

## 完成した範囲

| 教材 | 解説カード | Level 3の対応問題 |
| --- | ---: | ---: |
| 英検1級① | 17 | 40 / 40 |
| 英検1級② | 21 | 40 / 40 |

共有する解説を含めて25種類。3章「対比・条件・原因をつなぐ」「対象を説明する・受け身で伝える」「判断・比較・報告を読み分ける」。

ホームの「1級①・文のしくみ」「1級②・文のしくみ」、結果画面の各文から開ける。確認用は `?guide=eiken1part1` / `?guide=eiken1part2`。

## 編集方針

既存の大まかな8種類のタグだけに頼らず、80文それぞれの構造と意味を確認して、完全一致の対応表を作成。原文・和訳・HP・学習判定・問題の保存キーは変更しない。解説には型、和訳付き例文2つ、要点、折りたたみの補足を設け、必要な項目に比較表と文の区切りを追加。

| 読み違えやすい箇所 | 解説の扱い |
| --- | --- |
| neither would compromise | neitherの否定と、譲歩しようとしない過去の態度。wouldを一律に仮定法・習慣としない |
| families whose homes were flooded | 関係節の主語homes、主節の主語familiesを分ける |
| evidence that supported … was discredited | 長い主語の説明と、主節の受け身を区切る |
| was accused of withholding | 受け身＋前置詞of＋ing。非難・告発と、事実の確定は別 |
| forced / allowed 人 to | 事情が行動を強いる場合と、行動を可能にする場合 |
| left workers without jobs | leaveの結果の状態。単純な「去る」と区別 |
| helped dispel … surrounding … | helpの後ろの原形と、名詞を説明する分詞を分ける |
| far more … than … had expected | 比較の差を強めるfarと、以前の予想を示す過去完了 |
| outweigh | 比較の意味を持つ他動詞。後ろにthanを足さない |
| revealed / claimed that … had | 報告より前の出来事と、判明・主張という報告の違い |

このゲームの短文を理解するためのガイドであり、英検1級の全試験範囲を網羅する一覧ではない。収録されていない高度な構文を水増しして追加していない。

## 検証

- `test-grade1-grammar-guide.mjs`：80問の完全一致、17/21枚・共有25種類、全カードに対象文あり、分類の重点、教材とApp.tsxの14d0826比較、級・プレイヤー保存分離、AIの対象級と英文。
- `test-grade5-grammar-guide-ui.mjs` を1級①②にも拡張。両教材×1366/390/320pxで、実バトル→結果→正しい解説→元画面、カード保存と再読込、目次、折りたたみ、フォーカス、Escape、スクロール復帰、Enterの誤操作防止、学習保存不変を確認。
- AI相談は全4教材（準1級①②・1級①②）×3幅で、プレビュー・コピー・失敗時処理・閉じた後の遅延タブ抑止を確認。コピーと外部タブは模擬。Pixel実機、外部AIへの貼り付け・送信は未確認。
- AIテストの初回は全条件の検査後に専用Chromeの終了待ちが残ったため停止し、既存の専用ブラウザ終了補助を適用。再実行で学習内容を保持したまま自動保存のupdatedAtだけが変わるケースを検出し、その管理時刻だけを比較から除外した。学習内容・設定の全フィールドは引き続き比較する。
- 5級から1級までの9教材のデータ検査、カード保存、AI質問文検査、ビルド、変更コードのESLint成功。既存のバンドルサイズ警告は継続。
- 1級②のPC目次・スマホ解説を画像で目視。作業用画像は `docs/grammar-ui-2026-10-15/`。

## 参考資料

- [British Council：関係節](https://learnenglish.britishcouncil.org/grammar/b1-b2-grammar/relative-clauses-defining-relative-clauses?page=5)
- [British Council：willとwould](https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/will-would)
- [British Council：比較級の強調](https://learnenglish.britishcouncil.org/comment/178171)
- [Cambridge：allow](https://dictionary.cambridge.org/dictionary/english/allow)
- [Cambridge：helpの動詞の形](https://dictionary.cambridge.org/grammar/british-grammar/help)

解説と追加例文は独自に執筆。今回の上位級文法追加はローカル保存のみで、未コミット・未プッシュ。

## 次の相談

準2級、2級、準1級①②、1級①②の合意範囲が揃った。モンスター473体は先にプッシュ済み。次は、機能の見つけやすさ・普段の操作と詳細設定・縦幅の節約・文字の読みやすさを含むアプリ全体のUI整理を相談する予定。UI変更自体はまだ開始しない。
