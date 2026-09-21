// Pre-2 alone: keep word battles at the Grade 4 baseline, while shortening
// phrase/sentence battles. HP is based on attainable damage, not vocabulary count.
export const getPre2QuestionLimit = (level: 1 | 2 | 3, bossStage: number) => (
  level === 1 ? [10, 20, 30, 40, 50] : level === 2 ? [10, 16, 20, 24, 28] : [8, 12, 16, 20, 24]
)[bossStage] ?? 10;

export const getPre2BossHpMultiplier = (level: 1 | 2 | 3, bossStage: number) => (
  level === 1 ? [1, 2, 3, 4, 5] : [1, 1.5, 2.3, 3.1, 4]
)[bossStage] ?? 1;

export const getPre2BaseHp = (level: 1 | 2 | 3, learning: boolean, stageIndex: number, fallback: number) => {
  if (level === 1) return fallback;
  const [start, end] = level === 2
    ? (learning ? [300, 600] : [1200, 1700])
    : (learning ? [400, 900] : [1600, 2100]);
  const progress = Math.min(19, Math.max(0, stageIndex)) / 19;
  return Math.round((start + (end - start) * progress) / 10) * 10;
};

export const getPre2MissMultiplier = (level: 1 | 2 | 3, misses: number, length: number) => {
  if (misses === 0) return 1;
  if (level === 1) return 0.5;
  // A single typo is a small fraction of a sentence, not half the entire answer.
  // Repeated mistakes still matter; this does not waive all errors.
  return Math.max(level === 3 ? 0.8 : 0.75, 1 - misses / Math.max(1, length));
};
