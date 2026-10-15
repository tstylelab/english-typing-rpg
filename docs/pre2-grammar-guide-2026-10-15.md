# 英検準2級・文のしくみ（2026-10-15）

更新：上位級は準1級①②・1級①②まで制作・確認済み。文法追加はすべて未コミット。App.tsxの不変比較だけは、別途公開した連続再生・解除履歴機能を反映して14d0826基準へ更新済み。教材の4c6731c比較は維持。以下の「次は準1級」は本書初稿時点の記録。

## 実装済み

- 65枚の解説カード、4章「会話で尋ねる・気持ちを伝える」「動詞の後ろ・名詞の後ろを読む」「時・比較・条件を伝える」「意見・理由・具体例をつなぐ」。
- 現行Level 3の全173問を英文完全一致で適切なカードへ対応。原データの大まかな文法タグを自動流用せず、各文の働きから分類した。
- ホームで準2級を選ぶと「準2級・文のしくみ」。結果の各文の「文のしくみ」から、その文に対応するカードへ移動する。
- カード保存、級・プレイヤーの分離、カードからのAI質問、結果から開いたときの対象英文の引き継ぎに対応。
- 各カードは型・和訳付きの例文2つ・要点・折りたたみの補足。必要な項目だけ比較表と文の区切りを追加。確認用URLは `?guide=eikenpre2`。

## 特に区別した項目

| 項目 | 説明の重点 |
| --- | --- |
| Do you mind if / Would you mind ing | 許可と依頼、返答の意味。会話で肯定形の応答が使われることも含め、一律に誤りとしない |
| Is it OK if / know if | 許可の条件と「〜かどうか」を区別 |
| used to / be used to / get used to | 昔の習慣、慣れた状態、慣れる変化 |
| to不定詞 | 目的・感情のきっかけ・人への働きかけ・形式主語の中身を分ける |
| let / make / allow | 原形とto不定詞、強制だけではないmakeの意味 |
| 関係詞 / 分詞 / 間接疑問 | 文の欠け方、名詞の説明、主語＋動詞の語順 |
| 完了形 / 完了進行形 / 過去完了 | 今とのつながり、継続中の活動、過去の基準時より前 |
| so that / so … that | 目的と程度による結果 |
| do not think … all … | 「全部不要だ」とは思わない、という否定の範囲 |
| do you good / take A for B / see to it that | 基本動詞の別の使い方を、その句に即して説明 |

このゲームの収録文を理解するためのガイドで、英検公式の出題範囲を網羅した一覧ではない。

## 検証

- `test-pre2-grammar-guide.mjs`：173対応・65カード・4章、意味の異なる文の分類、保存分離と壊れた保存内容の保全、AI質問の対象級・英文を検査。原教材4ファイル、pre2Balance、App.tsxは公開済み4c6731cと同一。
- 既存5/4/3/2級のデータ検査、文法カード保存、AI質問文の検査成功。登録級が増えたため既存テストの「準2級は未登録」という期待だけ更新。
- 隔離Chromeの1366px・390px・320pxで、目次、該当箇所、比較表、保存と再読込、実バトル→結果→解説→復帰、Escape、フォーカス、Enterの誤作動防止、スクロール・学習保存保持を確認。
- 同3幅でAI質問プレビュー・コピー・失敗時の手動コピー・閉じた後の遅延タブ抑止を確認。外部タブとコピーはテストで模擬。AIへの送信やPixel実機の検証ではない。
- ビルド成功。変更TypeScriptのESLintエラー・警告なし。既存のバンドルサイズ警告は継続。
- 目次とカードのPC・スマホ幅スクリーンショットを目視確認。保存先 `tmp/pre2-grammar-check/`（作業用、非コミット）。

## 参考資料

- [British Council：used toの使い分け](https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2-grammar/different-uses-of-used-to)
- [British Council：発言の伝え方](https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/reported-speech)
- [British Council：条件の文](https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/conditionals-zero-first-second)
- [Cambridge：Would you mindの依頼と返答](https://dictionaryblog.cambridge.org/2014/04/30/would-you-mind-reading-this-please/)

解説は独自に執筆。元のゲームの英文・和訳・出題順・HP・学習判定・問題の保存キーは変更していない。

## 保存状態と続き

準2級と先行の2級の文法追加はローカル保存。今回コミット・プッシュは行っていない。モンスター473体は昨日4c6731cでプッシュ・リモート一致確認済み。

次は準1級①・②の構成案を基に本文を作り、その後1級①・②へ。上位級の文法一覧を整えた後に、アプリ全体の表示・操作を整理する相談を行う。
