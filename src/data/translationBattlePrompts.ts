import entries from './translationBattlePrompts.json';
import type { DifficultyKey } from './questions';
type QuestionLike = { text: string; translation: string; exampleEn?: string };
export type TranslationBattleExpression = { text: string; note: string };
const identity = (q: QuestionLike) => JSON.stringify([q.text, q.translation, q.exampleEn ?? '']);
const meanings = new Map(entries.map(e => [e.course + ':' + identity(e), e.meaning]));
const prompts = new Map(entries.map(e => [e.course + ':' + e.level + ':' + identity(e), e]));
export const getReviewedTranslationMeaning = (q: QuestionLike, course?: DifficultyKey) => course ? meanings.get(course + ':' + identity(q)) : undefined;
export const getTranslationBattlePrompt = (q: QuestionLike, course: DifficultyKey, level: number) => prompts.get(course + ':' + level + ':' + identity(q));
