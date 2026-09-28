import type { GrammarCard } from './data/grade5GrammarGuide';

export const GRAMMAR_AI_DESTINATIONS = {
  ChatGPT: 'https://chatgpt.com/',
  Gemini: 'https://gemini.google.com/app',
} as const;

// Generate only on explicit request. No player, history, storage or network access.
export function buildGrammarQuestion(grade: string, card: GrammarCard, questionText?: string): string {
  const pairs = (items: [string, string][]) => items.map(([a, b]) => `- ${a} ／ ${b}`).join('\n');
  return [
    `英検${grade}を学んでいます。次の文法カードを読んでもまだよく分からないので、この内容をやさしく教えてください。`,
    `英検${grade}に挑戦する学習者を対象に、説明の深さ・例文の語彙・確認問題の難しさを、その級とこのカードの内容に合わせてください。年齢や学年は決めつけないでください。`,
    '日本語はなるべく平易に、親しみのある「です・ます」調でお願いします。文法用語には短い意味を添え、理解に必要な前提は補ってください。読みやすくするために、学ぶべき内容を省いたり、不必要に幼い説明にしたりしないでください。',
    'まず「どんなときに使うか」を説明し、短い英文と和訳を1〜2組使って、単語の役割や語順が分かるようにしてください。カードの文をそのまま繰り返すだけでなく、別の言い方や身近な場面で説明してください。',
    '似た形との大切な違いがあれば1つだけ添えてください。最初の説明は400字程度を目安に、必要なところに絞ってください。無理な語呂合わせや例外を無視した断言は不要です。',
    '最後に、この型を使う簡単な確認問題を1問出してください。答えはまだ書かず、私の返事を待ってください。',
    'カードの説明に誤りや言い過ぎがあれば、正確な内容に直して教えてください。',
    '',
    '【質問したいカード】',
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
