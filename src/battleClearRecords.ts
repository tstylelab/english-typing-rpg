import { battleResumeScope } from './battleResume';

// Separate from lifetime defeated IDs: old victories cannot reveal repeat counts.
export type BattleClearCounts = Record<string, number>;

export const FINAL_BOSS_MILESTONES = [3, 5, 10] as const;

export function isCountedBattle(mode: string, inputMode: string): boolean {
  return mode === 'challenge' && (inputMode === 'voice-only' || inputMode === 'text-only');
}

export function finalBossClearScope(course: string, level: number, inputMode: string): string {
  return battleResumeScope(course, level, 'challenge', inputMode);
}

export function normalizeBattleClearCounts(value: unknown): BattleClearCounts {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([scope, count]) =>
    /^(?:(?:Eiken5|Eiken4|Eiken3|EikenPre2|Eiken2|EikenPre1Part1|EikenPre1Part2|Eiken1Part1|Eiken1Part2):[123]|Conversation:[1-5]):challenge:(voice-only|text-only)$/.test(scope)
    && typeof count === 'number' && Number.isSafeInteger(count) && count >= 0
  ));
}

export function canRecordFinalBossVictory(battle: {
  mode: string; inputMode: string; currentMonsterIndex: number;
  totalMonstersInStage: number; bossStage: number;
  focusedBattle?: unknown;
}, isReviewSession: boolean): boolean {
  return isCountedBattle(battle.mode, battle.inputMode)
    && !battle.focusedBattle && !isReviewSession
    && battle.bossStage === 4 && battle.totalMonstersInStage > 0
    && battle.currentMonsterIndex === battle.totalMonstersInStage - 1;
}

export function getFinalBossMilestone(count: number): { achieved?: number; next?: number } {
  return {
    achieved: [...FINAL_BOSS_MILESTONES].reverse().find(target => count >= target),
    next: FINAL_BOSS_MILESTONES.find(target => count < target),
  };
}
