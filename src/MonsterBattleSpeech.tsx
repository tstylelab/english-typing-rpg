import { useState } from 'react';
import { advanceQuestionSpeech, getMonsterDialogue } from './monsterDialogues';

export default function MonsterBattleSpeech({ course, monsterId, encounterKey, questionNumber, hpRate, isDefeated, fallbackText, fallbackDefeat }: {
  course: string;
  monsterId: string;
  encounterKey: string;
  questionNumber: number;
  hpRate: number;
  isDefeated: boolean;
  fallbackText: string;
  fallbackDefeat: string;
}) {
  const dialogue = getMonsterDialogue(course, monsterId);
  const request = { encounterKey, questionNumber, hpRate, dialogue, fallbackText };
  const [snapshot, setSnapshot] = useState(() => advanceQuestionSpeech(null, request));
  let speech = snapshot;
  if (snapshot.encounterKey !== encounterKey || snapshot.questionNumber !== questionNumber) {
    speech = advanceQuestionSpeech(snapshot, request);
    // Conditional adjustment of this component's own state keeps the new line
    // in the same render as its question, without a delayed effect or flicker.
    setSnapshot(speech);
  }
  return <span data-dialogue-kind={isDefeated ? 'defeat' : speech.kind} data-dialogue-question={questionNumber}>
    {isDefeated ? dialogue?.defeat ?? fallbackDefeat : speech.text}
  </span>;
}
