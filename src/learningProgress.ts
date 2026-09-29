export type LearningProgressLevel = 1 | 2 | 3;
export type AutomaticLearningSource = 'listening' | 'battle';
export type AutomaticLearningOutcome = 'success' | 'neutral' | 'struggle';

export type AutomaticLearningState = {
  listeningLevel: LearningProgressLevel;
  battleLevel: LearningProgressLevel;
  longTextSuccessCount?: number;
  longTextSpacingRemaining?: number;
  longTextLastSuccessAt?: number;
};

export const getLongTextMistakeAllowance = (characters: number) => (
  // English recall, not flawless typing: 10–19 chars allow 2, 20–29 allow 3, etc.
  characters < 10 ? 0 : Math.floor(characters / 10) + 1
);

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
  if (missCount <= getLongTextMistakeAllowance(characterCount)) return 'success';

  const accuracy = Math.max(0, 1 - (missCount / Math.max(characterCount, 1)));
  const demotionMissCount = questionLevel === 2 ? 3 : 4;

  return missCount >= demotionMissCount && accuracy < 0.85
    ? 'struggle'
    : 'neutral';
};

// Two successful battle recalls, with five other answers between them.
// Listening can prepare a question, but does not count as an unaided battle recall.
export const getNextLongTextLearningState = (
  state: AutomaticLearningState, source: AutomaticLearningSource, outcome: AutomaticLearningOutcome,
  smallPool = false, now = Date.now(),
): AutomaticLearningState => {
  if (source !== 'battle') return getNextAutomaticLearningState(state, source, outcome);
  if (outcome === 'neutral') return state;
  if (outcome === 'struggle') return { ...getNextAutomaticLearningState(state, source, outcome), longTextSuccessCount: 0, longTextSpacingRemaining: 0 };
  const timeGap = smallPool && now - (state.longTextLastSuccessAt ?? now) >= 120000;
  if ((state.longTextSuccessCount ?? 0) > 0 && (state.longTextSpacingRemaining ?? 0) > 0 && !timeGap) return state;
  const successes = Math.min(2, (state.longTextSuccessCount ?? 0) + 1);
  return {
    ...state,
    battleLevel: Math.max(state.battleLevel, successes === 2 ? 3 : 2) as LearningProgressLevel,
    longTextSuccessCount: successes,
    longTextSpacingRemaining: 5,
    longTextLastSuccessAt: now,
  };
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
