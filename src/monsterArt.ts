// Artwork is rolled out course by course. Other courses keep their SVG avatars.
export const EIKEN5_LEVEL1_ART_IDS = [
  'm1_1', 'm1_2', 'm1_3', 'm1_4', 'm1_5', 'm1_6', 'm1_7', 'm1_8', 'm1_9', 'm1_10',
  ...Array.from({ length: 10 }, (_, i) => `m1_extra_${i + 1}`),
  ...Array.from({ length: 13 }, (_, i) => `c1_${i + 1}`),
  ...Array.from({ length: 10 }, (_, i) => `c1_extra_${i + 1}`),
];
const artIds = new Set(EIKEN5_LEVEL1_ART_IDS);

export const getMonsterArtUrl = (monsterId: string | undefined, difficulty: string | undefined, size = 384) => (
  difficulty === 'Eiken5' && monsterId && artIds.has(monsterId)
    ? `${import.meta.env.BASE_URL}monsters/eiken5-level1/${size <= 100 ? 256 : 384}/${monsterId}.webp`
    : undefined
);

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
