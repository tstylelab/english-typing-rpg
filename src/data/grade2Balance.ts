// Grade 2 shares Pre-2's attainable-damage baseline. Keep this separate so
// real play can tune Grade 2 without changing any existing course.
import { getPre2BaseHp, getPre2BossHpMultiplier, getPre2MissMultiplier, getPre2QuestionLimit } from './pre2Balance';

export const getGrade2QuestionLimit = getPre2QuestionLimit;
export const getGrade2BossHpMultiplier = getPre2BossHpMultiplier;
export const getGrade2BaseHp = getPre2BaseHp;
export const getGrade2MissMultiplier = getPre2MissMultiplier;
