import { getLongTextRecallOutcome } from './learningProgress';

export type BattleAnswerSound = 'attack' | 'critical' | null;

// Feedback must not depend on the deliberately capped long-text damage bonus.
export const getBattleAnswerSound = ({
  longText, text, charsPerSec, speedMultiplier, misses, formattingMisses = 0,
  assisted, defeated,
}: {
  longText: boolean;
  text: string;
  charsPerSec: number;
  speedMultiplier: number;
  misses: number;
  formattingMisses?: number;
  assisted: boolean;
  defeated: boolean;
}): BattleAnswerSound => {
  if (defeated) return null; // Existing defeat/clear feedback takes priority.
  if (assisted) return 'attack';
  const fastSuccess = longText
    ? charsPerSec >= 2.4 && getLongTextRecallOutcome(text, Math.max(0, misses - formattingMisses)) === 'success'
    : speedMultiplier >= 2 && misses === 0;
  return fastSuccess ? 'critical' : 'attack';
};
