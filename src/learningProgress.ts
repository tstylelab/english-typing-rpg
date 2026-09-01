export type LearningProgressLevel = 1 | 2 | 3;
export type AutomaticLearningSource = 'listening' | 'battle';
export type AutomaticLearningOutcome = 'success' | 'neutral' | 'struggle';

export type AutomaticLearningState = {
  listeningLevel: LearningProgressLevel;
  battleLevel: LearningProgressLevel;
};

export const getAutomaticLearningLevel = (state: AutomaticLearningState): LearningProgressLevel => (
  Math.max(state.battleLevel, Math.min(2, state.listeningLevel)) as LearningProgressLevel
);

export const getBattleLearningOutcome = (
  questionLevel: LearningProgressLevel,
  missCount: number,
  characterCount: number,
): AutomaticLearningOutcome => {
  if (missCount === 0) return 'success';
  if (questionLevel === 1) return 'struggle';

  const accuracy = Math.max(0, 1 - (missCount / Math.max(characterCount, 1)));
  const demotionMissCount = questionLevel === 2 ? 3 : 4;

  return missCount >= demotionMissCount && accuracy < 0.85
    ? 'struggle'
    : 'neutral';
};

export const getNextAutomaticLearningState = (
  state: AutomaticLearningState,
  source: AutomaticLearningSource,
  outcome: AutomaticLearningOutcome,
): AutomaticLearningState => {
  const currentLevel = getAutomaticLearningLevel(state);

  if (outcome === 'neutral') return state;

  if (source === 'listening') {
    if (outcome !== 'success' || currentLevel >= 2) return state;
    return { ...state, listeningLevel: 2 };
  }

  const nextLevel = outcome === 'success'
    ? Math.min(3, currentLevel + 1) as LearningProgressLevel
    : Math.max(1, currentLevel - 1) as LearningProgressLevel;

  if (nextLevel === currentLevel) return state;

  return {
    listeningLevel: Math.min(state.listeningLevel, nextLevel) as LearningProgressLevel,
    battleLevel: nextLevel,
  };
};
