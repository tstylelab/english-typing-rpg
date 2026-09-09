export type LearningQuestionBalance = {
  position: number;
  unfinishedCount: number;
  pendingKeys: string[];
};

export const createLearningQuestionBalance = (): LearningQuestionBalance => ({
  position: 0,
  unfinishedCount: 0,
  pendingKeys: [],
});

// Called only when choosing an actual question in a normal training/battle.
// The caller keeps one state per player, course, level and mode, across monsters.
export function selectLearningBalancedQuestion<T>(options: {
  state: LearningQuestionBalance;
  playableQuestions: T[];
  eligibleQuestions: T[];
  getKey: (question: T) => string;
  getLevel: (question: T) => number;
  currentKey?: string;
  chooseDefault: () => T;
  random?: () => number;
}): T {
  const { state, playableQuestions, eligibleQuestions, getKey, getLevel, currentKey, chooseDefault } = options;
  const random = options.random ?? Math.random;
  const masteredCount = playableQuestions.filter(q => getLevel(q) === 3).length;
  const unfinished = eligibleQuestions.filter(q => getLevel(q) < 3);
  if (playableQuestions.length === 0 || masteredCount * 5 < playableQuestions.length * 4 || unfinished.length === 0) {
    Object.assign(state, createLearningQuestionBalance());
    return chooseDefault();
  }

  const byKey = new Map(unfinished.map(q => [getKey(q), q]));
  state.pendingKeys = state.pendingKeys.filter(key => byKey.has(key));
  if (state.pendingKeys.length === 0) {
    state.pendingKeys = [...byKey.keys()];
    for (let i = state.pendingKeys.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [state.pendingKeys[i], state.pendingKeys[j]] = [state.pendingKeys[j], state.pendingKeys[i]];
    }
  }

  // By questions 3, 6 and 9, ensure at least 1, 2 and 3 unfinished questions.
  // Naturally selected unfinished/review questions also count toward this minimum.
  const minimumSoFar = Math.min(3, Math.floor((state.position + 1) / 3));
  let question: T;
  if (state.unfinishedCount < minimumSoFar) {
    const key = state.pendingKeys.find(candidate => candidate !== currentKey) ?? state.pendingKeys[0];
    question = byKey.get(key)!;
  } else {
    question = chooseDefault();
  }

  if (getLevel(question) < 3) {
    state.unfinishedCount += 1;
    state.pendingKeys = state.pendingKeys.filter(key => key !== getKey(question));
  }
  state.position += 1;
  if (state.position === 10) {
    state.position = 0;
    state.unfinishedCount = 0;
  }
  return question;
}
