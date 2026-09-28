import { grammarGuides, type GrammarCourse } from './data/grammarGuides';

const knownIds = { Eiken5: new Set(grammarGuides.Eiken5.cards.map(card => card.id)), Eiken4: new Set(grammarGuides.Eiken4.cards.map(card => card.id)) };
type BookmarkStorage = Pick<Storage, 'getItem' | 'setItem'>;
export const grammarBookmarkKey = (playerId: string, course: GrammarCourse = 'Eiken5') => `etyping_grammar_bookmarks_v1:${encodeURIComponent(playerId)}:${course}`;

export function readGrammarBookmarks(storage: BookmarkStorage, playerId: string, course: GrammarCourse = 'Eiken5'): string[] {
  if (!playerId) return [];
  const raw = storage.getItem(grammarBookmarkKey(playerId, course));
  if (raw === null) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('Invalid grammar bookmarks');
  return [...new Set(parsed.filter((id): id is string => typeof id === 'string' && knownIds[course].has(id)))];
}

// Read immediately before writing so separately opened result cards/tabs do not
// replace each other's saved cards with an older in-memory list.
export function toggleGrammarBookmark(storage: BookmarkStorage, playerId: string, cardId: string, course: GrammarCourse = 'Eiken5'): string[] {
  if (!playerId || !knownIds[course].has(cardId)) throw new Error('Invalid bookmark target');
  const current = readGrammarBookmarks(storage, playerId, course);
  const next = current.includes(cardId) ? current.filter(id => id !== cardId) : [...current, cardId];
  storage.setItem(grammarBookmarkKey(playerId, course), JSON.stringify(next));
  return next;
}
