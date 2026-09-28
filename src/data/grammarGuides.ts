import type { DifficultyKey, LevelKey, Question } from './questions';
import { grade5GrammarCards, grade5GrammarSections, getGrade5GrammarCard } from './grade5GrammarGuide';
import { grade4GrammarCards, grade4GrammarSections, getGrade4GrammarCard } from './grade4GrammarGuide';

export const grammarGuides = {
  Eiken5: { grade: '5級', cards: grade5GrammarCards, sections: grade5GrammarSections,
    intro: 'はじめてなら先頭から。「I＝私」→「名詞・動詞って何？」→「I am・You are」→「言葉の順番」→「This is・That is」と進めます。' },
  Eiken4: { grade: '4級', cards: grade4GrammarCards, sections: grade4GrammarSections,
    intro: 'まず文の土台を確認してから、過去・未来へ。「お願い」「比べる」「文をつなぐ」と、できることを少しずつ広げましょう！' },
};
export type GrammarCourse = keyof typeof grammarGuides;
export function getGrammarGuideCourse(value: string | null): GrammarCourse | undefined {
  if (value === 'Eiken5' || value === 'eiken5') return 'Eiken5';
  if (value === 'Eiken4' || value === 'eiken4') return 'Eiken4';
  return undefined;
}
export function getGrammarCard(difficulty: DifficultyKey, level: LevelKey, question: Pick<Question, 'text'>) {
  return getGrade5GrammarCard(difficulty, level, question) ?? getGrade4GrammarCard(difficulty, level, question);
}
