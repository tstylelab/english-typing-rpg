import { getLearningAnswerLabel } from './learningContent';

export type QuestionAiContext = {
  course: string;
  level: 1 | 2 | 3;
  isConversation?: boolean;
  text: string;
  meaning: string;
  example?: string;
  exampleJa?: string;
};

// Only the selected teaching item is included; no player or performance data.
export function buildQuestionAiPrompt({ course, level, isConversation = false, text, meaning, example, exampleJa }: QuestionAiContext): string {
  const answerLabel = getLearningAnswerLabel(level, isConversation);
  return [
    `${course}・Level ${level}を学習しています。次の${answerLabel}について教えてください。`,
    '',
    `英語：${text}`,
    `教材の和訳：${meaning}`,
    ...(example && example !== text ? [`例文：${example}`, ...(exampleJa ? [`例文の和訳：${exampleJa}`] : [])] : []),
    '',
    level === 3
      ? 'この英文の意味と文の組み立て、なぜこの語順・文法の形になるのかを説明してください。'
      : `まず、この${answerLabel}そのものの基本的な意味と使い方を説明してください。例文があれば、その文での使われ方や文の組み立ても説明してください。${answerLabel}の意味を例文の場面だけに限定しないでください。`,
    'この級・教材を学ぶ人に合わせて、やさしい日本語で要点を整理してください。文法用語には短い説明を添え、必要なら短い例文と和訳を示してください。年齢や学年は決めつけないでください。',
    '教材の和訳や説明に不自然な点があれば、そのまま引き継がず指摘してください。自然な別の言い方がある場合は、元の表現との違いを説明してください。',
    'まずこの一問について説明を完結させてください。詳しく知りたい点は続けて質問します。',
  ].join('\n');
}
