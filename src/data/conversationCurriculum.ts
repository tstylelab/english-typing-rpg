import approved from './conversationCurriculum.json';
import archive from './questionSets/conversation/beginner.json';
import type { Question } from './questions';

export type ConversationLevel = 1 | 2 | 3 | 4 | 5;
type QuestionLike = { text: string; translation?: string };
type Item = { level: ConversationLevel; topic: string; sourceLevel: 1 | 2 | 3 | null; sourceIndex: number | null; question: Question };
const items = approved.items as Item[];
export const CONVERSATION_LEVEL_INFO = approved.levels;
const archived = archive.levels as Record<string, Question[]>;
const identity = (q: QuestionLike) => JSON.stringify([q.text, q.translation]);

// The 216 released items retain their original text, translation and example.
// Revised prompts/notes are presentation; saved question keys remain unchanged.
const entries = items.map(item => {
  const original = item.sourceLevel !== null && item.sourceIndex !== null
    ? archived[item.sourceLevel]?.[item.sourceIndex] : undefined;
  if (item.sourceLevel !== null && !original) throw new Error('Missing archived conversation question');
  const question: Question = original ? {
    ...original,
    promptEn: item.question.promptEn || undefined,
    promptJa: item.question.promptJa || undefined,
    sceneJa: item.question.sceneJa,
    speakingTip: item.question.speakingTip,
  } : { ...item.question };
  const key = `Conversation:${item.sourceLevel ?? item.level}:${question.text}:${question.translation}`;
  return { ...item, question, display: item.question, key };
});
const byIdentity = new Map(entries.map(entry => [identity(entry.question), entry]));
const byText = new Map(entries.map(entry => [entry.question.text, entry]));
const byKey = new Map(entries.map(entry => [entry.key, entry]));
const find = (q: QuestionLike) => q.translation === undefined ? byText.get(q.text) : byIdentity.get(identity(q));

export const CONVERSATION_QUESTIONS = Object.fromEntries(
  ([1, 2, 3, 4, 5] as const).map(level => [level, entries.filter(entry => entry.level === level).map(entry => entry.question)]),
) as Record<ConversationLevel, Question[]>;

export const getConversationProgressKey = (q: QuestionLike) => find(q)?.key;
export const getConversationQuestionLevel = (q: QuestionLike) => find(q)?.level;
export const getConversationQuestionDisplay = (q: QuestionLike) => find(q)?.display;
export const hydrateConversationQuestion = <T extends QuestionLike>(q: T): T => (
  find(q)?.question ?? q
) as T;

// Move collection membership to the display Level, retaining every key value.
// Unknown/imported keys stay in their original scope. This is idempotent and
// leaves all other courses unchanged; no learning or victory record is reset.
export function normalizeConversationScopedKeys(scopes: Record<string, string[]>): Record<string, string[]> {
  const next = Object.fromEntries(Object.entries(scopes).map(([scope, keys]) => [scope, [...keys]]));
  for (const [scope, keys] of Object.entries(scopes)) {
    if (!/^Conversation:[1-5]$/.test(scope)) continue;
    for (const key of keys) {
      const entry = byKey.get(key);
      if (!entry) continue;
      const target = `Conversation:${entry.level}`;
      if (target === scope) continue;
      next[scope] = next[scope].filter(value => value !== key);
      next[target] = [...new Set([...(next[target] ?? []), key])];
    }
  }
  return next;
}
