import { grade4PhraseChanges, grade4PhraseQuestions } from './grade4PhraseCores';
import grade3, { legacyGrade3Phrases } from './questionSets/eiken/grade3';
import pre2, { legacyPre2Phrases } from './questionSets/eiken/pre2';
import grade2, { legacyGrade2Phrases } from './questionSets/eiken/grade2';
import { grade1Part1, grade1Part2, legacyGrade1Phrases } from './questionSets/eiken/grade1';
import { reviewUpperPhrase } from './upperPhraseCoreRules';
import type { DifficultyKey, Question } from './questions';

export const upperPhraseLegacy: Partial<Record<DifficultyKey, Question[]>> = {
  Eiken3: legacyGrade3Phrases, EikenPre2: legacyPre2Phrases, Eiken2: legacyGrade2Phrases,
  ...legacyGrade1Phrases,
};
const currentByCourse: Partial<Record<DifficultyKey, Question[]>> = {
  Eiken4: grade4PhraseQuestions, Eiken3: grade3.levels['2'], EikenPre2: pre2.levels['2'],
  Eiken2: grade2.levels['2'], Eiken1Part1: grade1Part1.levels['2'], Eiken1Part2: grade1Part2.levels['2'],
};
export const phraseCoreChanges: { difficulty: DifficultyKey; before: Question; after: Question }[] = [
  ...grade4PhraseChanges.map(change => ({ difficulty: 'Eiken4' as const, ...change })),
  ...Object.entries(upperPhraseLegacy).flatMap(([difficulty, questions]) => questions.flatMap(before => {
    const reviewed = reviewUpperPhrase(before);
    const after = currentByCourse[difficulty as DifficultyKey]!.find(q => q.text === reviewed.text)!;
    return before.text === after.text && before.translation === after.translation ? []
      : [{ difficulty: difficulty as DifficultyKey, before, after }];
  })),
];
const identity = (q: Question) => JSON.stringify([q.text, q.translation]);
const statusKey = (difficulty: string, q: Question) => `${difficulty}:2:${q.text}:${q.translation}`;
const migratedKeys = new Map(phraseCoreChanges.map(c => [statusKey(c.difficulty, c.before), statusKey(c.difficulty, c.after)]));
const scopedQuestions = new Map(phraseCoreChanges.map(c => [statusKey(c.difficulty, c.before), c.after]));
const unscopedQuestions = new Map<string, Question[]>();
for (const c of phraseCoreChanges) {
  const key = identity(c.before);
  const next = unscopedQuestions.get(key) ?? [];
  if (!next.some(q => identity(q) === identity(c.after))) next.push(c.after);
  unscopedQuestions.set(key, next);
}

export const migratePhraseCoreKey = (key: string): string => migratedKeys.get(key) ?? key;
export const migrateScopedPhraseCore = (difficulty: string, level: number, question: Question): Question => (
  level === 2 ? scopedQuestions.get(statusKey(difficulty, question)) ?? question : question
);
// Legacy weak lists have no course field: keep all relevant senses, not an arbitrary first one.
export const getUnscopedPhraseCores = (question: Question): Question[] => unscopedQuestions.get(identity(question)) ?? [];
