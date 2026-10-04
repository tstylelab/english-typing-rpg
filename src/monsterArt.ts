// Artwork is rolled out course by course. Other courses keep their SVG avatars.
const artIdsForLevel = (level: number) => [
  ...Array.from({ length: 10 }, (_, i) => `m${level}_${i + 1}`),
  ...Array.from({ length: 10 }, (_, i) => `m${level}_extra_${i + 1}`),
  ...Array.from({ length: 13 }, (_, i) => `c${level}_${i + 1}`),
  ...Array.from({ length: 10 }, (_, i) => `c${level}_extra_${i + 1}`),
];
export const EIKEN5_LEVEL1_ART_IDS = artIdsForLevel(1);
export const EIKEN5_ART_IDS = [1, 2, 3].flatMap(artIdsForLevel);
export const EIKEN4_LEVEL1_ART_IDS = artIdsForLevel(1);
const eiken5ArtIds = new Set(EIKEN5_ART_IDS);
const eiken4Level1ArtIds = new Set(EIKEN4_LEVEL1_ART_IDS);

export const getMonsterArtUrl = (monsterId: string | undefined, difficulty: string | undefined, size = 384) => {
  if (!monsterId) return undefined;
  const folder = difficulty === 'Eiken5' && eiken5ArtIds.has(monsterId)
    ? `eiken5-level${monsterId[1]}`
    : difficulty === 'Eiken4' && eiken4Level1ArtIds.has(monsterId)
      ? 'eiken4-level1'
      : undefined;
  return folder
    ? `${import.meta.env.BASE_URL}monsters/${folder}/${size <= 100 ? 256 : 384}/${monsterId}.webp`
    : undefined;
};

// High-resolution art is requested only when the user opens a preview.
export const MONSTER_PREVIEW_IMAGE_SIZE = 1024;
export const getMonsterPreviewArtUrl = (monsterId: string | undefined, difficulty: string | undefined) => (
  getMonsterArtUrl(monsterId, difficulty)?.replace('/384/', `/${MONSTER_PREVIEW_IMAGE_SIZE}/`)
);

// Only prepare the next encounter, never preload the entire monster collection.
export const preloadMonsterArt = (monsterId: string | undefined, difficulty: string | undefined) => {
  const src = getMonsterArtUrl(monsterId, difficulty);
  if (!src) return;
  const image = new Image();
  image.decoding = 'async';
  image.src = src;
};
