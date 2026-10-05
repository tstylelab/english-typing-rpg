import profiles from './monsterProfiles.json';

export interface MonsterProfile {
  course: string;
  monsterId: string;
  name: string;
  type: 'slime' | 'beast' | 'wing' | 'ghost' | 'robot' | 'boss' | 'object';
  color: string;
  theme: string;
  dialogueStart: string;
  dialogueDefeat: string;
  artFolder: string;
}

// Only fully exported and checked levels enter this catalogue. Names and artwork
// share this exact key; input modes retain their existing progress identities.
const catalogue = new Map<string, MonsterProfile>((profiles as MonsterProfile[]).map(profile => [
  `${profile.course}:${profile.monsterId}`, profile,
]));

export const getMonsterProfile = (course: string | undefined, monsterId: string | undefined) => (
  course && monsterId ? catalogue.get(`${course}:${monsterId}`) : undefined
);

export const applyMonsterProfile = <T extends { id: string; battleDialogues?: unknown }>(course: string, monster: T): T => {
  const profile = getMonsterProfile(course, monster.id);
  if (!profile) return monster;
  return { ...monster, name: profile.name, type: profile.type, color: profile.color,
    theme: profile.theme, dialogueStart: profile.dialogueStart,
    dialogueDefeat: profile.dialogueDefeat, battleDialogues: undefined, courseProfile: true };
};
