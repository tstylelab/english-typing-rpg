import type { GrammarCard } from './data/grade5GrammarGuide';

export const GRAMMAR_AI_DESTINATIONS = {
  ChatGPT: 'https://chatgpt.com/',
  Gemini: 'https://gemini.google.com/app',
} as const;

// Generate only on explicit request. No player, history, storage or network access.
export function buildGrammarQuestion(grade: string, card: GrammarCard, questionText?: string): string {
  const pairs = (items: [string, string][]) => items.map(([a, b]) => `- ${a} ／ ${b}`).join('\n');
  return [
    `英検${grade}を学んでいます。下のカードが扱う文法項目について、参考書の一節のように、基礎から順序立てた詳しい解説をお願いします。`,
    'カードは最小限のまとめです。カードの文章を言い換えるのではなく、その文法の仕組みを体系的に説明してください。カードにない前提や関連する型も、理解に必要なら補ってください。複数の項目がある場合は、それぞれの役割とつながりを整理してください。',
    `英検${grade}に挑戦する学習者を対象に、説明の深さと例文の語彙を合わせてください。年齢や学年は決めつけないでください。級全体の文法講義や、関係の薄い発展事項へは広げないでください。`,
    '日本語は平易で親しみのある「です・ます」調にし、文法用語には短い意味を添えてください。幼い言い方にするのではなく、前提から理解できる説明にしてください。',
    '',
    '【解説の流れ】',
    '1. 全体像と前提：何を表し、どんなときに使う文法なのか。理解に必要な用語や既習事項も説明してください。',
    '2. 基本ルールと作り方：語順、単語の役割、形が変わる条件を順に説明してください。人称・単数複数・肯定文・否定文・疑問文などは、その項目の理解に関係するものを整理し、関係のない型を無理に並べないでください。',
    '3. 例文と使い分け：各ルールに短い英文と和訳を添え、「なぜこの形になるか」を示してください。似た形との違いやよくある間違いも、必要なところで対比してください。カード以外の例文も使ってください。',
    '4. 要点のまとめ：あとで復習できるよう、大切なルールを短く振り返ってください。',
    '',
    '文字数や例文数を一律に制限せず、この項目を理解するために必要な説明を揃えてください。見出しと短い段落を使い、重複や余談は省いてください。確認問題や返信待ちで解説を中断せず、まず説明を完結させてください。',
    '無理な語呂合わせ、架空の説明、例外を無視した断言は不要です。カードに誤りや言い過ぎがあれば、それを引き継がず正確に説明してください。',
    '',
    '【参考：学びたい文法の要約カード（説明範囲の上限ではありません）】',
    `見出し：${card.title}`,
    ...(card.subtitle ? [`学ぶ内容：${card.subtitle}`] : []),
    `文法：${card.term}`,
    `型：${card.pattern}`,
    '例文：', pairs(card.examples),
    `ポイント：${card.tip}`,
    ...(card.chunks ? ['文の区切り：', pairs(card.chunks)] : []),
    ...(card.compare ? ['比べる形：', pairs(card.compare)] : []),
    `補足：${card.more}`,
    ...(questionText ? ['', `ゲームで出た文：${questionText}`] : []),
  ].join('\n');
}
