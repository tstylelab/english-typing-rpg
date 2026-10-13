export type LearningProgressLevel = 1 | 2 | 3;
export type AutomaticLearningSource = 'listening' | 'battle';
export type AutomaticLearningOutcome = 'success' | 'neutral' | 'struggle';

export type AutomaticLearningState = {
  listeningLevel: LearningProgressLevel;
  battleLevel: LearningProgressLevel;
  longTextSuccessCount?: number;
  longTextSpacingRemaining?: number;
  longTextLastSuccessAt?: number;
  longTextPreviousExcess?: boolean;
};

// Only learning progress uses this counter; scoring and raw mistake logs stay intact.
export const getEnglishLetterCount = (text: string) => (text.match(/[a-z]/gi) ?? []).length;
export const getRecallMistakeAllowance = (letters: number) => Math.max(2, Math.ceil(letters * 0.20));
export const getLongTextRecallOutcome = (text: string, misses: number): AutomaticLearningOutcome => (
  misses <= getRecallMistakeAllowance(getEnglishLetterCount(text)) ? 'success' : 'struggle'
);

export const isFormattingOnlyMistake = (target: string, attempted: string): boolean => {
  let index = 0;
  while (index < target.length && target[index] === attempted[index]) index += 1;
  // Apostrophes/hyphens remain meaningful. Exempt a missed separator or an extra one.
  if (/^['’-]$/.test(target[index] ?? '')) return false;
  const formatting = /^[\s.,!?]$/;
  return formatting.test(target[index] ?? '') || formatting.test(attempted[index] ?? '');
};

export const getNextTolerantLongTextLearningState = (
  state: AutomaticLearningState, source: AutomaticLearningSource, outcome: AutomaticLearningOutcome,
  poolSize = Infinity, now = Date.now(),
): AutomaticLearningState => {
  if (source !== 'battle' || outcome === 'neutral') {
    return getNextAutomaticLearningState(state, source, outcome);
  }
  if (outcome === 'struggle' && !state.longTextPreviousExcess) {
    return { ...state, longTextPreviousExcess: true };
  }
  if (outcome === 'struggle') {
    return { ...getNextAutomaticLearningState(state, source, outcome), longTextSuccessCount: 0, longTextSpacingRemaining: 0, longTextPreviousExcess: false };
  }
  // Adapt to the actual practice pool, including a single selected question.
  const interval = Math.min(3, Math.max(0, poolSize - 1));
  const waiting = Math.min(state.longTextSpacingRemaining ?? 0, interval) > 0;
  const currentLevel = getAutomaticLearningLevel(state);
  const nextLevel = currentLevel === 1 ? 2 : waiting ? currentLevel : 3;
  return {
    ...state,
    battleLevel: nextLevel,
    longTextSuccessCount: nextLevel === 3 ? 2 : 1,
    longTextSpacingRemaining: currentLevel === 1 ? interval : Math.min(state.longTextSpacingRemaining ?? 0, interval),
    longTextLastSuccessAt: now,
    longTextPreviousExcess: false,
  };
};

// A manual return to learning/caution is a review request, not a permanent lock.
// Do not change existing saved records until the learner actually succeeds.
export const getNextLongTextStudyState = <T extends AutomaticLearningState & { manualOverrideLevel: LearningProgressLevel | null }>(
  state: T, source: AutomaticLearningSource, outcome: AutomaticLearningOutcome, poolSize: number,
): T => {
  const reviewLevel = state.manualOverrideLevel;
  if (reviewLevel !== null && reviewLevel < 3) {
    if (outcome !== 'success') return state;
    const baseline = { ...state, listeningLevel: reviewLevel, battleLevel: reviewLevel, longTextSuccessCount: 0, longTextSpacingRemaining: 0, longTextPreviousExcess: false };
    return { ...baseline, ...getNextTolerantLongTextLearningState(baseline, source, outcome, poolSize), manualOverrideLevel: null };
  }
  const next = getNextTolerantLongTextLearningState(state, source, outcome, poolSize);
  return next === state ? state : { ...state, ...next };
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
