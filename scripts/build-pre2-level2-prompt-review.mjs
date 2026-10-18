import fs from 'node:fs';
const audit=JSON.parse(fs.readFileSync('docs/pre2-level2-prompt-review-2026-10-18.json','utf8'));
const details=value=>[value.meaning,...(value.alternatives.length?['類義語：'+value.alternatives.map(a=>`${a.text}（${a.note}）`).join('／')]:[]),...(value.contrasts.length?['意味の違い：'+value.contrasts.map(a=>`${a.text}（${a.note}）`).join('／')]:[])].join('<br>');
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const textDetails=v=>details(v).split('<br>').map(escape).join('<br>');
const intro=`# 英検準2級 Level 2 和訳バトルの見直し（2026-10-18）

全223問の現在の和訳・例文・補足を確認し、83問を修正しました。残り140問は今回据え置きです。

## 過去の合意を守る方針

- 頭文字・文字数・正解の英単語を指示するヒントは復活させない。
- 動作と状態、対象、場面を短い日本語で補う。例文一つの場面だけに意味を限定しない。
- 意味の重なる表現に架空の使い分けを作らない。類義語は原則1つ、最大2つ。
- 補足のある問題は43問から122問へ。83問のうち79問が新規補足、4問が既存補足の見直し。
- 問題の英語・保存用和訳・例文・順序は変更せず、表示用の和訳と比較情報だけを更新する。

## 残る制約

このゲームは指定された熟語を思い出す練習で、自由英作文の採点ではありません。同じ和訳に複数の自然な英語が対応すること自体はなくせません。類義語表示は比較のための情報で、別解を正解として受理する機能ではありません。採点・HP・進行・保存形式は今回変更していません。

## 語義の確認資料

- [Cambridge: after all](https://dictionary.cambridge.org/us/dictionary/english/after-all) — 予想に反する結果と、理由を添える用法。
- [Cambridge: first](https://dictionary.cambridge.org/uk/grammar/british-grammar/first) — at first と in the beginning の重なり。既存の類義語比較を維持。
- [Cambridge: as long as / so long as](https://dictionary.cambridge.org/grammar/british-grammar/as-long-as-and-so-long-as) — 期間と条件の用法。
- [Cambridge: no more than](https://dictionary.cambridge.org/us/thesaurus/no-more-than) — only との重なり。

## 検証

- 全7,370問の表示アダプター・保存済み問題オブジェクトの参照互換性テスト成功。
- 全問題データのハッシュ不変。他の級・レベルの表示補足も変更前と一致。
- 専用の空のブラウザー環境で幅1366/820/390/320pxを確認。補足表示、正解の非表示、横はみ出しなし、回答後の元の保存キー更新、他の問題の記録保持を確認。
- 本番ビルド成功。既存のバンドルサイズ警告あり。
- 実機スマホのキーボード・音声と、本人の主観的な解きやすさは未確認。ローカル変更のみ、未コミット・未プッシュ。

## 変更した83問（英語・変更前・変更後）

| 英語 | 変更前の表示 | 変更後の表示 |
|---|---|---|
`;
fs.writeFileSync('docs/pre2-level2-prompt-review-2026-10-18.md',intro+audit.rows.filter(r=>r.changed).map(r=>`| ${r.text} | ${details(r.before)} | ${details(r.after)} |`).join('\n')+'\n\n## 確認して据え置いた140問\n\n'+audit.rows.filter(r=>!r.changed).map(r=>`- ${r.text}：${r.after.meaning}`).join('\n')+'\n');
fs.writeFileSync('docs/pre2-level2-prompt-review-2026-10-18.html',`<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>準2級 Level 2 和訳見直し</title><style>body{font:17px/1.7 system-ui,sans-serif;background:#101d2d;color:#e4edf4;margin:0}main{max-width:1200px;margin:auto;padding:24px}h1{font-size:28px}p{max-width:80ch}input{font:inherit;padding:10px;border:1px solid #80c9cf;border-radius:8px;background:#183348;color:white;width:min(90%,520px)}article{border:1px solid #496474;border-radius:10px;padding:18px;margin:16px 0;background:#152c3e}h2{margin:0 0 12px;color:#ffe3a1;font-size:22px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:20px}.label{font-weight:bold;color:#8fddd4}small{color:#b2c7d6}a{color:#8fddd4}@media(max-width:650px){.pair{grid-template-columns:1fr}}</style><main><h1>準2級 Level 2：和訳バトルの見直し</h1><p>全223問を確認し、83問の和訳・補足を修正。下は変更した問題の比較です。元の問題・記録キーは維持しています。</p><p>同じ意味になる英語は複数あります。類義語は比較用で、別解の正解判定を追加したものではありません。頭文字や文字数のヒントは追加していません。</p><p><a href="pre2-level2-prompt-review-2026-10-18.md">方針・検証・据え置き問題を含む全記録</a></p><input id="search" aria-label="英語・日本語で絞り込む" placeholder="英語・日本語で絞り込む"><p id="count">83問</p>${audit.rows.filter(r=>r.changed).map(r=>`<article><h2>${escape(r.text)}</h2><div class="pair"><section><div class="label">変更前</div>${textDetails(r.before)}</section><section><div class="label">変更後</div>${textDetails(r.after)}</section></div><p><small>${escape(r.reason)}</small></p></article>`).join('')}<script>document.querySelector('#search').addEventListener('input',e=>{let n=0;for(const el of document.querySelectorAll('article')){el.hidden=!el.textContent.toLowerCase().includes(e.target.value.toLowerCase());if(!el.hidden)n++;}document.querySelector('#count').textContent=n+'問';});</script></main></html>`);
console.log('Review Markdown and HTML generated.');
