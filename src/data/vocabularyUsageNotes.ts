import type { DifficultyKey } from './questions';
import { getGrade2VocabularyUsageNote } from './grade2VocabularyUsageNotes';
import { getGrade5VocabularyReview } from './grade5VocabularyReview';
import { getLevel1VocabularyReview } from './level1VocabularyReview';
import { getLevel2PhraseReview } from './level2PhraseReview';
import { getGrade2PhraseConsistencyReview } from './grade2PhraseConsistencyReview';

type QuestionLike = { text: string; translation: string; exampleEn?: string };

// Answer feedback and revealed study content, never grading or saved fields.
export const getVocabularyUsageNote = (
  course: DifficultyKey, level: number, question: QuestionLike,
): string | undefined => (
  getGrade2PhraseConsistencyReview(course, level, question)?.usageNote
  ?? getLevel2PhraseReview(course, level, question)?.usageNote
  ?? getLevel1VocabularyReview(course, level, question)?.usageNote
  ?? getGrade5VocabularyReview(course, level, question)?.usageNote
  ?? getGrade2VocabularyUsageNote(course, level, question)
);
