import type { DifficultyKey, LevelKey, Question } from './questions';
import { grade5GrammarCards, grade5GrammarSections, getGrade5GrammarCard } from './grade5GrammarGuide';
import { grade4GrammarCards, grade4GrammarSections, getGrade4GrammarCard } from './grade4GrammarGuide';
import { grade3GrammarCards, grade3GrammarSections, getGrade3GrammarCard } from './grade3GrammarGuide';
import { pre2GrammarCards, pre2GrammarSections, getPre2GrammarCard } from './pre2GrammarGuide';
import { grade2GrammarCards, grade2GrammarSections, getGrade2GrammarCard } from './grade2GrammarGuide';
import { pre1GrammarCardsByCourse, pre1GrammarSections, getPre1GrammarCard } from './pre1GrammarGuide';
import { grade1GrammarCardsByCourse, grade1GrammarSections, getGrade1GrammarCard } from './grade1GrammarGuide';

export const grammarGuides = {
  Eiken5: { grade: '5級', cards: grade5GrammarCards, sections: grade5GrammarSections,
    intro: 'はじめてなら先頭から。「I＝私」→「名詞・動詞って何？」→「I am・You are」→「言葉の順番」→「This is・That is」と進めます。' },
  Eiken4: { grade: '4級', cards: grade4GrammarCards, sections: grade4GrammarSections,
    intro: 'まず文の土台を確認してから、過去・未来へ。「お願い」「比べる」「文をつなぐ」と、できることを少しずつ広げましょう！' },
  Eiken3: { grade: '3級', cards: grade3GrammarCards, sections: grade3GrammarSections,
    intro: '文の土台から、現在完了・受け身・関係代名詞へ。似た形の違いを見比べ、長い文も意味のまとまりに分けて確かめましょう。' },
  EikenPre2: { grade: '準2級', cards: pre2GrammarCards, sections: pre2GrammarSections,
    intro: '完了形・受け身から、toとing、関係詞、仮定・発言の伝達へ。短い文で文法を組み立て、似た形の意味の違いを確かめましょう。' },
  Eiken2: { grade: '2級', cards: grade2GrammarCards, sections: grade2GrammarSections,
    intro: '意見・理由・具体例をつなぐ表現から、長い文の骨組みへ。収録文の文法と、考えを伝える組み立てを確かめましょう。' },
  EikenPre1Part1: { grade: '準1級①', cards: pre1GrammarCardsByCourse.EikenPre1Part1, sections: pre1GrammarSections,
    intro: '相手の話を確かめ、同意する範囲や判断の強さを伝えます。会話の前置きは、後ろに内容を続けた例でも確認しましょう。' },
  EikenPre1Part2: { grade: '準1級②', cards: pre1GrammarCardsByCourse.EikenPre1Part2, sections: pre1GrammarSections,
    intro: '留保・可能性・提案を伝える会話の形を学びます。否定の範囲や、会話で省かれている部分にも注目しましょう。' },
  Eiken1Part1: { grade: '1級①', cards: grade1GrammarCardsByCourse.Eiken1Part1, sections: grade1GrammarSections,
    intro: '社会や科学についての収録文を、対比・条件・原因のつながりから読みます。長い主語を区切り、判断の強さや比較の基準を確かめましょう。' },
  Eiken1Part2: { grade: '1級②', cards: grade1GrammarCardsByCourse.Eiken1Part2, sections: grade1GrammarSections,
    intro: '収録文の報告・主張・因果関係を読み分けます。誰が何をしたのか、いつ起きたのかを、関係詞や過去完了から確かめましょう。' },
};
export type GrammarCourse = keyof typeof grammarGuides;
export function getGrammarGuideCourse(value: string | null): GrammarCourse | undefined {
  if (value === 'Eiken5' || value === 'eiken5') return 'Eiken5';
  if (value === 'Eiken4' || value === 'eiken4') return 'Eiken4';
  if (value === 'Eiken3' || value === 'eiken3') return 'Eiken3';
  if (value === 'EikenPre2' || value === 'eikenpre2') return 'EikenPre2';
  if (value === 'Eiken2' || value === 'eiken2') return 'Eiken2';
  if (value === 'EikenPre1Part1' || value === 'eikenpre1part1') return 'EikenPre1Part1';
  if (value === 'EikenPre1Part2' || value === 'eikenpre1part2') return 'EikenPre1Part2';
  if (value === 'Eiken1Part1' || value === 'eiken1part1') return 'Eiken1Part1';
  if (value === 'Eiken1Part2' || value === 'eiken1part2') return 'Eiken1Part2';
  return undefined;
}
export function getGrammarCard(difficulty: DifficultyKey, level: LevelKey, question: Pick<Question, 'text'>) {
  return getGrade5GrammarCard(difficulty, level, question) ?? getGrade4GrammarCard(difficulty, level, question) ?? getGrade3GrammarCard(difficulty, level, question) ?? getPre2GrammarCard(difficulty, level, question) ?? getGrade2GrammarCard(difficulty, level, question) ?? getPre1GrammarCard(difficulty, level, question) ?? getGrade1GrammarCard(difficulty, level, question);
}
