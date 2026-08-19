# english-typing-rpg

英語タイピング練習とRPG風バトルを組み合わせたWebアプリです。

英検レベル別の単語・熟語・文章を、モンスターとのバトル形式で練習できます。音声読み上げ、苦手問題の復習、スコア記録、モンスター図鑑などを備えています。

## 公開URL

https://en-typing.tsg-gt.com/

## Codex作業の引き継ぎ

別のPCで作業を再開するときは、最新の判断・変更内容・確認手順をまとめた [`docs/HANDOFF.md`](docs/HANDOFF.md) を確認してください。

## GitHubリポジトリ

https://github.com/tstylelab/english-typing-rpg

## 使用技術

- React
- TypeScript
- Vite
- Tailwind CSS
- lucide-react
- GitHub Actions
- GitHub Pages

## 主な機能

- 英検5級、英検4級、英検準1級の問題に対応
- 単語、熟語、文章レベルの練習
- RPG風のモンスターバトル
- タイピング練習
- 英語音声の読み上げ
- 苦手問題の自動記録
- 苦手問題の復習
- あとで復習したい問題の保存
- スコア・記録表示
- モンスター図鑑
- ヘルプ画面
- 学習進捗の保存・引き継ぎ

## フォルダ構成

```text
english-typing-rpg/
  src/
    App.tsx
    HelpScreen.tsx
    data/
      questions.ts
      questionExamples.ts
      questionSynonyms.ts
      questionSets/
        eiken/
          grade5.json
          grade4.json
          gradepre1.json
        conversation/
          beginner.json

  data-source/
    eiken/
      grade4/
      gradepre1/

  scripts/

  public/

  .github/
    workflows/
      deploy.yml
```

## 主なファイルの役割

### `src/App.tsx`

アプリ本体の中心です。画面切り替え、バトル処理、タイピング処理、スコア、復習、設定など、多くの処理がここにまとまっています。

### `src/HelpScreen.tsx`

ヘルプ画面のコンポーネントです。

### `src/data/questions.ts`

英検5級、4級、準1級と、英会話教材の問題JSONを読み込み、アプリで使える形にまとめています。

### `src/data/questionSets/eiken/*.json`

ゲーム内で実際に使う問題データです。

### `src/data/questionSets/conversation/beginner.json`

英検4級を終えたころから始められる「英会話 はじめて」の教材です。Levelごとに72会話、合計216会話を収録しています。各問題に、相手の発言、返答、両方の日本語、話すコツ、会話例があります。

### `src/data/questionExamples.ts`

問題に対応する例文を扱うファイルです。

### `src/data/questionSynonyms.ts`

類義語や関連語の表示に関するファイルです。

### `data-source/`

問題データを作るための元データや作業用データを置く場所です。CSV、候補リスト、バッチJSONなどがあります。

### `scripts/`

問題データを変換・検証するためのスクリプトがあります。

### `public/`

画像、BGM、効果音など、公開時に使う素材があります。

### `.github/workflows/deploy.yml`

GitHub Pagesへ自動公開するための設定です。`main` ブランチに反映されると、GitHub Actionsでビルドと公開が行われます。

## 起動方法

依存関係が入っている状態で、次のコマンドを実行します。

```bash
npm install
npm run dev
```

ローカル確認用のURLが表示されるので、ブラウザで開きます。

## ビルド方法

公開前と同じ形式でビルドできるか確認する場合は、次を実行します。

```bash
npm run build
```

成功すると `dist/` フォルダに公開用ファイルが作られます。

## 公開方法

このアプリはGitHub Actions経由でGitHub Pagesに公開されています。

確認済みの設定:

- 公開URL: https://en-typing.tsg-gt.com/
- GitHub Pages: GitHub Actionsでデプロイ
- カスタムドメイン: `en-typing.tsg-gt.com`
- HTTPS: 有効

通常は、`main` ブランチに反映された内容がGitHub Actionsでビルドされ、公開サイトへ反映されます。

## 問題データを変更するときの注意

問題データには、アプリで直接使うJSONと、元データ・作業用データがあります。

直接使うデータ:

```text
src/data/questionSets/eiken/
```

元データ・作業用データ:

```text
data-source/
```

問題数を増やす、翻訳を修正する、例文を追加する場合は、どのデータを正本として扱うかを確認してから作業します。
