import dialogueData from './monsterDialogues.json';

export interface MonsterDialogue {
  name: string;
  entrance: string;
  battle: string[];
  aside: string[];
  pressure: string[];
  defeat: string;
}

const catalogue = dialogueData as Record<string, MonsterDialogue>;

export const getMonsterDialogue = (course: string, monsterId: string): MonsterDialogue | undefined =>
  catalogue[`${course}:${monsterId}`];

// Only presentation text is replaced. Progress identities, order, HP and types
// continue to come from the existing roster and course profiles.
export const applyMonsterDialogue = <T extends { id: string; dialogueStart: string; dialogueDefeat: string }>(course: string, monster: T): T => {
  const dialogue = getMonsterDialogue(course, monster.id);
  return dialogue ? { ...monster, dialogueStart: dialogue.entrance, dialogueDefeat: dialogue.defeat } : monster;
};

type SpeechKind = 'entrance' | 'battle' | 'aside' | 'pressure' | 'fallback';
export interface QuestionSpeech {
  encounterKey: string;
  questionNumber: number;
  text: string;
  kind: SpeechKind;
  generalTurn: number;
  battleCursor: number;
  asideCursor: number;
  pressureCursor: number;
}

const offsetFor = (seed: string, size: number) => {
  let hash = 2166136261;
  for (const character of seed) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return (hash >>> 0) % size;
};

const nextLine = (pool: string[], cursor: number, previous: string, seed: string) => {
  const offset = offsetFor(seed, pool.length);
  for (let step = 0; step < pool.length; step++) {
    const text = pool[(offset + cursor + step) % pool.length];
    if (text !== previous || pool.length === 1) return { text, cursor: cursor + step + 1 };
  }
  return { text: pool[offset], cursor: cursor + 1 };
};

export interface SpeechRequest {
  encounterKey: string;
  questionNumber: number;
  hpRate: number;
  dialogue?: MonsterDialogue;
  fallbackText: string;
}

// A repeated question number returns the same snapshot even when HP, combo,
// typing mistakes or visual effects change. No timers or saved player data.
export const advanceQuestionSpeech = (previous: QuestionSpeech | null, request: SpeechRequest): QuestionSpeech => {
  const { encounterKey, questionNumber, hpRate, dialogue, fallbackText } = request;
  if (previous?.encounterKey === encounterKey && previous.questionNumber === questionNumber) return previous;
  const last = previous?.encounterKey === encounterKey && previous.questionNumber < questionNumber ? previous : null;
  const next: QuestionSpeech = {
    encounterKey, questionNumber, text: fallbackText, kind: 'fallback',
    generalTurn: last?.generalTurn ?? 0, battleCursor: last?.battleCursor ?? 0,
    asideCursor: last?.asideCursor ?? 0, pressureCursor: last?.pressureCursor ?? 0,
  };
  if (!dialogue) return next;
  if (!last) return { ...next, text: dialogue.entrance, kind: 'entrance' };

  // Pressure lines alternate with ordinary conversation rather than repeating
  // the single normal monster's low-HP line on every remaining question.
  const pressure = hpRate <= 0.2 && last.kind !== 'pressure' && dialogue.pressure.length > 0;
  const pattern: ('battle' | 'aside')[] = dialogue.battle.length > 3
    ? ['battle', 'battle', 'aside', 'battle', 'battle', 'aside', 'battle', 'aside']
    : ['battle', 'battle', 'aside', 'battle', 'aside'];
  const kind = pressure ? 'pressure' : pattern[next.generalTurn % pattern.length];
  const cursorKey = `${kind}Cursor` as 'battleCursor' | 'asideCursor' | 'pressureCursor';
  const selected = nextLine(dialogue[kind], next[cursorKey], last.text, `${encounterKey}:${kind}`);
  return { ...next, text: selected.text, kind, [cursorKey]: selected.cursor,
    generalTurn: next.generalTurn + (pressure ? 0 : 1) };
};
