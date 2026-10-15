# 英検準1級①・②の文のしくみ

## 完成した範囲

- ①は37カード・Level 3全75問、②は40カード・全75問。共通の解説は、その教材に対応する問題がある場合だけ表示。
- 3章：相手の話を理解する・確認する／賛成・留保・可能性を伝える／時間・形・会話の省略を読む。
- ホームの「準1級①・文のしくみ」「準1級②・文のしくみ」、結果の各文から参照できる。確認用は `?guide=eikenpre1part1` / `?guide=eikenpre1part2`。
- 保存したカードはプレイヤー・教材別。AI質問は対応する級とカード内容を含み、結果から開いた場合は今回の文も含む。

## 説明の重点

- If I understand you correctly.などの前置きだけの収録文を、一般的な完全文の型として説明しない。後続の主節を補った例を示す。元の出題文・和訳は変更しない。
- not always、not necessarily、I'm not saying、not a bad ideaを同一の否定表現としてまとめない。
- may have a pointのhaveと、must have beenの助動詞＋完了形を区別。
- where you're coming from、get at、make ofなどは会話での意味も説明。
- what節、間接疑問のif、関係代名詞の省略、see＋目的語＋ingを個別に説明。

## 確認

- `test-pre1-grammar-guide.mjs`：150問の完全一致リンク、カード数、未使用カードなし、意味による分類、元教材保持、級・プレイヤー別保存、AIの文脈。
- App.tsxの比較基準だけは、別途承認された連続再生・解除履歴機能の公開コミット14d0826へ更新。教材の比較基準4c6731cは維持。
- ①②それぞれ1366px・390px・320pxで、目次・比較・保存と再読み込み・実バトル→結果→該当カード→復帰を確認。フォーカス・スクロール・学習データ保持、Enter誤操作防止、横はみ出し・pageerrorなしも確認。
- AI質問のプレビュー、コピー、失敗時の手動コピー、閉じた後の遅延タブ抑止を同3幅で確認。外部タブとクリップボードは模擬で、AIへ実送信していない。
- PC目次とスマホの解説を画像で目視。作業用画像は `docs/grammar-ui-2026-10-15/`。ビルド・変更コードのESLint成功。
- Pixel端末の実機表示は未確認。

## 参考

- [Cambridge：会話の省略](https://dictionary.cambridge.org/grammar/british-grammar/ellipsis)
- [Cambridge：would rather](https://dictionary.cambridge.org/grammar/british-grammar/would-rather-would-sooner)
- [British Council：過去の推量](https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2-grammar/modals-deductions-about-past)

このゲームの収録文を理解するための解説で、英検公式の文法範囲を網羅するものではない。独自に執筆。ローカル実装・確認まで完了、未コミット・未プッシュ。
