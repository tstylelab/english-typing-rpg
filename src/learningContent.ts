// Shared display names only. Question identities and saved progress do not use these labels.
export function getLearningContentLabel(level: 1 | 2 | 3, isConversation = false): string {
  if (isConversation) return '会話表現';
  return { 1: '単語', 2: '熟語・表現', 3: '文章問題' }[level];
}

export function getLearningAnswerLabel(level: 1 | 2 | 3, isConversation = false): string {
  return level === 3 && !isConversation ? '英文' : getLearningContentLabel(level, isConversation);
}

export function formatLearningProgress(total: number, mastered: number): string {
  return `全${total}問・習得${mastered}問`;
}
