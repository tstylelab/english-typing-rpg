import type { Question, QuestionSetFile } from '../../questions';
import { grade1VocabularyRows, grade1AdvancedVocabularyRows } from './grade1Vocabulary';
import { grade1PhraseRows } from './grade1Phrases';
import { grade1Grammar, grade1SentenceRows } from './grade1Sentences';

type RankedQuestion = { rank: string; sourceId?: number; question: Question };
const lines = (rows: string) => rows.split('\n').map(line => line.split('|'));
const words: RankedQuestion[] = lines(`${grade1VocabularyRows}\n${grade1AdvancedVocabularyRows}`)
  .map(([rank, sourceId, text, translation, exampleEn]) => ({
    rank, sourceId: Number(sourceId), question: { text, translation, exampleEn },
  }));
const phrases: (RankedQuestion & { part: number })[] = lines(grade1PhraseRows)
  .map(([part, sourceId, text, translation, exampleEn]) => ({
    part: Number(part), rank: part, sourceId: Number(sourceId), question: { text, translation, exampleEn },
  }));
const sentences: (RankedQuestion & { part: number })[] = lines(grade1SentenceRows)
  .map(([part, grammar, text, translation]) => ({
    part: Number(part), rank: part, question: {
      text, translation, grammarPoint: grade1Grammar[grammar as keyof typeof grade1Grammar],
    },
  }));
const order = (entries: RankedQuestion[]) => [...entries].sort((a, b) =>
  a.rank.localeCompare(b.rank) || a.question.text.length - b.question.text.length ||
  (a.sourceId ?? 0) - (b.sourceId ?? 0)
).map(entry => entry.question);
const makeCourse = (part: 1 | 2): QuestionSetFile => ({
  category: 'eiken', series: '英検', difficultyKey: part === 1 ? 'Eiken1Part1' : 'Eiken1Part2',
  displayName: `英検1級${part === 1 ? '①' : '②'}`,
  levels: {
    1: order(words.filter(entry => part === 1 ? entry.rank === 'A' : entry.rank !== 'A')),
    2: order(phrases.filter(entry => entry.part === part)),
    3: order(sentences.filter(entry => entry.part === part)),
  },
});

export const grade1Part1 = makeCourse(1);
export const grade1Part2 = makeCourse(2);
