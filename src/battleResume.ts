// A replay position is separate from lifetime victories and completion stars.
// Store monster IDs, not array indexes, so a catalog reorder cannot misroute it.
export type BattleResumePositions = Record<string, string>;

export function battleResumeScope(course: string, level: number, mode: string, inputMode: string): string {
  return `${course}:${level}:${mode}:${mode === 'guide' ? 'voice-text' : inputMode}`;
}

export function normalizeBattleResumePositions(value: unknown): BattleResumePositions {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([key, id]) =>
    /^(Eiken5|Eiken4|Eiken3|EikenPre2|Eiken2|EikenPre1Part1|EikenPre1Part2|Eiken1Part1|Eiken1Part2|Conversation):[123]:(guide:voice-text|challenge:(voice-text|voice-only|text-only))$/.test(key)
    && typeof id === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(id)
  ));
}

export function resolveBattleResumeStep(ids: string[], savedId: string | undefined, isDefeated: (id: string) => boolean): number {
  const savedStep = savedId ? ids.indexOf(savedId) : -1;
  if (savedStep >= 0) return savedStep;
  const firstUndefeated = ids.findIndex(id => !isDefeated(id));
  return firstUndefeated >= 0 ? firstUndefeated : 0;
}

export function nextBattleResumeId(ids: string[], defeatedStep: number): string | undefined {
  return ids[(defeatedStep + 1) % ids.length];
}
