import { grade5GrammarCards } from './data/grade5GrammarGuide';

const knownIds = new Set(grade5GrammarCards.map(card => card.id));
type BookmarkStorage = Pick<Storage, 'getItem' | 'setItem'>;
export const grammarBookmarkKey = (playerId: string) => `etyping_grammar_bookmarks_v1:${encodeURIComponent(playerId)}:Eiken5`;

export function readGrammarBookmarks(storage: BookmarkStorage, playerId: string): string[] {
  if (!playerId) return [];
  const raw = storage.getItem(grammarBookmarkKey(playerId));
  if (raw === null) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('Invalid grammar bookmarks');
  return [...new Set(parsed.filter((id): id is string => typeof id === 'string' && knownIds.has(id)))];
}

// Read immediately before writing so separately opened result cards/tabs do not
// replace each other's saved cards with an older in-memory list.
export function toggleGrammarBookmark(storage: BookmarkStorage, playerId: string, cardId: string): string[] {
  if (!playerId || !knownIds.has(cardId)) throw new Error('Invalid bookmark target');
  const current = readGrammarBookmarks(storage, playerId);
  const next = current.includes(cardId) ? current.filter(id => id !== cardId) : [...current, cardId];
  storage.setItem(grammarBookmarkKey(playerId), JSON.stringify(next));
  return next;
}
