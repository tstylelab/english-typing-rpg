import { QUESTIONS } from './data/questions';
import type { DifficultyKey, LevelKey } from './data/questions';

// The released Grade 5 progression is the common reference for Eiken phrase
// and sentence battles. Learning modes, Level 1 and stored progress are separate.
const PHRASE_HP = [924, 1074, 1214, 1346, 1452, 1478, 1496, 1505, 1514, 1522, 1531, 1540, 1549, 1558, 1566, 1575, 1584, 1593, 1602, 2402, 3203, 3604, 4004];
const SENTENCE_HP = [600, 650, 700, 730, 760, 790, 820, 850, 880, 900, 920, 930, 940, 950, 960, 970, 980, 990, 1000, 1650, 2000, 2350, 2680];
const PHRASE_LIMITS = [8, 12, 16, 18, 20];
const SENTENCE_LIMITS = [6, 10, 12, 14, 16];

// Compute once from shipped text, not player progress or a changing review filter.
// A square-root correction reduces long-text endurance without turning a whole
// battle into one or two questions. Shorter curricula never get longer battles.
const averageLengths = new Map<string, number>();
const meanLength = (difficulty: DifficultyKey, level: LevelKey) => {
  const key = `${difficulty}:${level}`;
  const cached = averageLengths.get(key);
  if (cached !== undefined) return cached;
  const pool = QUESTIONS[difficulty]?.[level] ?? [];
  const mean = pool.length ? pool.reduce((sum, q) => sum + q.text.length, 0) / pool.length : 1;
  averageLengths.set(key, mean);
  return mean;
};

export const isBalancedLongTextBattle = (difficulty: string, level: number, mode: string, inputMode: string) => (
  difficulty.startsWith('Eiken') && (level === 2 || level === 3)
  && mode === 'challenge' && (inputMode === 'voice-only' || inputMode === 'text-only')
);

export const getBalancedLongTextTuning = (difficulty: DifficultyKey, level: LevelKey, inputMode: string, stepIndex: number, bossStage: number) => {
  const curve = level === 2 ? PHRASE_HP : SENTENCE_HP;
  const hp = curve[Math.min(curve.length - 1, Math.max(0, stepIndex))];
  const referenceLimit = (level === 2 ? PHRASE_LIMITS : SENTENCE_LIMITS)[bossStage] ?? 8;
  const lengthScale = Math.min(1, Math.sqrt(meanLength('Eiken5', level) / meanLength(difficulty, level)));
  const maxQuestions = Math.max(bossStage ? 8 : 4, Math.ceil(referenceLimit * lengthScale));
  const referenceHp = inputMode === 'text-only' ? Math.round(hp * 0.92) : hp;
  return {
    // Preserve required damage per answer (and therefore accuracy) as time shrinks.
    monsterHp: Math.round(referenceHp * maxQuestions / referenceLimit),
    maxQuestions,
    damageMultiplier: 1,
  };
};

const mistakeRate = (length: number, misses: number) => Math.max(0, misses) / Math.max(1, length);

export const getBalancedLongTextSpeedMultiplier = (charsPerSec: number, length: number, misses: number) => {
  const speedBonus = Math.min(0.1, Math.max(0, (charsPerSec - 1) / 30));
  // Speed helps a careful answer a little; at 25% mistakes it cannot cancel errors.
  const accuracyBonus = Math.max(0, 1 - mistakeRate(length, misses) / 0.25);
  return 1 + speedBonus * accuracyBonus;
};

export const getBalancedLongTextDamage = (level: number, length: number, misses: number, speedMultiplier: number) => {
  // Grade 5 L2's hardest stage needs 200.25 HP per answer. 225 completion
  // points leave room for 10% typos even without speed (floor(225*.9)=202).
  // L3 retains its released 200 completion points. Longer text gets the same
  // completion points and proportionally more typo allowance, not more raw power.
  const completionPoints = level === 2 ? 225 : 200;
  const accuracy = Math.max(0.2, 1 - mistakeRate(length, misses));
  return Math.floor(completionPoints * accuracy * speedMultiplier + 1e-9);
};
