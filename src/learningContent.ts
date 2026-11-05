// Shared display names only. Question identities and saved progress do not use these labels.
export function getLearningContentLabel(level: 1 | 2 | 3 | 4 | 5, isConversation = false): string {
  if (isConversation) return '会話表現';
  return level === 1 ? '単語' : level === 2 ? '熟語・表現' : '文章問題';
}

export function getLearningAnswerLabel(level: 1 | 2 | 3 | 4 | 5, isConversation = false): string {
  return level === 3 && !isConversation ? '英文' : getLearningContentLabel(level, isConversation);
}

export function formatLearningProgress(total: number, mastered: number): string {
  return `全${total}問・習得${mastered}問`;
}
