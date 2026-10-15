export type HomeCompanion = { course: string; monsterId: string };

// Decorative cast: food, household objects and comic creatures, rather than armored heroes.
export const HOME_COMPANIONS = [
  { course: 'Eiken4', monsterId: 'm1_5' },
  { course: 'Eiken4', monsterId: 'm1_extra_5' },
  { course: 'Eiken3', monsterId: 'm2_10' },
  { course: 'Eiken3', monsterId: 'm3_2' },
  { course: 'Eiken3', monsterId: 'c3_4' },
  { course: 'Eiken3', monsterId: 'c3_extra_3' },
  { course: 'Eiken3', monsterId: 'c3_13' },
  { course: 'Eiken2', monsterId: 'm3_1' },
  ...['Eiken4', 'Eiken3', 'EikenPre2', 'Eiken2'].flatMap(course =>
    [1, 2].flatMap(level => [1, 2, 3, 4].map(index => ({ course, monsterId: `m${level}_${index}` })))),
] as const;

// Choose on entering home. The component retains the pair while home is visible.
export function getHomeCompanions(opponentCourse: string, opponentId?: string, previous: readonly HomeCompanion[] = [], random = Math.random): HomeCompanion[] {
  const excluded = new Set([...previous.map(item => `${item.course}:${item.monsterId}`), `${opponentCourse}:${opponentId}`]);
  const seen = new Set<string>();
  const pool = HOME_COMPANIONS.filter(item => {
    const key = `${item.course}:${item.monsterId}`;
    if (excluded.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const result: HomeCompanion[] = [];
  while (result.length < 2 && pool.length) result.push(...pool.splice(Math.floor(random() * pool.length), 1));
  return result;
}
