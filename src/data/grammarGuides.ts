import type { DifficultyKey, LevelKey, Question } from './questions';
import { grade5GrammarCards, grade5GrammarSections, getGrade5GrammarCard } from './grade5GrammarGuide';
import { grade4GrammarCards, grade4GrammarSections, getGrade4GrammarCard } from './grade4GrammarGuide';
import { grade3GrammarCards, grade3GrammarSections, getGrade3GrammarCard } from './grade3GrammarGuide';

export const grammarGuides = {
  Eiken5: { grade: '5級', cards: grade5GrammarCards, sections: grade5GrammarSections,
    intro: 'はじめてなら先頭から。「I＝私」→「名詞・動詞って何？」→「I am・You are」→「言葉の順番」→「This is・That is」と進めます。' },
  Eiken4: { grade: '4級', cards: grade4GrammarCards, sections: grade4GrammarSections,
    intro: 'まず文の土台を確認してから、過去・未来へ。「お願い」「比べる」「文をつなぐ」と、できることを少しずつ広げましょう！' },
  Eiken3: { grade: '3級', cards: grade3GrammarCards, sections: grade3GrammarSections,
    intro: '文の土台から、現在完了・受け身・関係代名詞へ。似た形の違いを見比べ、長い文も意味のまとまりに分けて確かめましょう。' },
};
export type GrammarCourse = keyof typeof grammarGuides;
export function getGrammarGuideCourse(value: string | null): GrammarCourse | undefined {
  if (value === 'Eiken5' || value === 'eiken5') return 'Eiken5';
  if (value === 'Eiken4' || value === 'eiken4') return 'Eiken4';
  if (value === 'Eiken3' || value === 'eiken3') return 'Eiken3';
  return undefined;
}
export function getGrammarCard(difficulty: DifficultyKey, level: LevelKey, question: Pick<Question, 'text'>) {
  return getGrade5GrammarCard(difficulty, level, question) ?? getGrade4GrammarCard(difficulty, level, question) ?? getGrade3GrammarCard(difficulty, level, question);
}
