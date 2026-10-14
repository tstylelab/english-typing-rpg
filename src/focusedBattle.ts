export type FocusedBattleKind = 'unseen' | 'learning';

export type FocusedBattle<Question> = {
  kind: FocusedBattleKind;
  remaining: Question[];
  total: number;
};

export const FOCUSED_BATTLE_LABELS = {
  unseen: '未出題だけ',
  learning: '学習中だけ',
} satisfies Record<FocusedBattleKind, string>;

type QuestionStatus = {
  presentedAt?: number;
  practiceLevel: number;
  listeningLevel: number;
  battleLevel: number;
  manualOverrideLevel: number | null;
  longTextSuccessCount?: number;
  longTextLastSuccessAt?: number;
  longTextPreviousExcess?: boolean;
  excluded: boolean;
};

// Old saves did not record every presentation. Use actual learning evidence;
// updatedAt alone can come from an exclusion or a manual status change.
export function hasQuestionHistory(status: QuestionStatus): boolean {
  return (status.presentedAt ?? 0) > 0
    || Math.max(status.practiceLevel, status.listeningLevel, status.battleLevel, status.manualOverrideLevel ?? 1) > 1
    || (status.longTextSuccessCount ?? 0) > 0
    || (status.longTextLastSuccessAt ?? 0) > 0
    || status.longTextPreviousExcess === true;
}

export function selectFocusedQuestions<Q>(
  questions: Q[], kind: FocusedBattleKind,
  getStatus: (question: Q) => QuestionStatus,
  getLevel: (question: Q) => number,
  hasReviewHistory: (question: Q) => boolean,
): Q[] {
  return questions.filter(question => {
    const status = getStatus(question);
    if (status.excluded) return false;
    return kind === 'learning'
      ? getLevel(question) === 1
      : !hasQuestionHistory(status) && !hasReviewHistory(question);
  });
}
