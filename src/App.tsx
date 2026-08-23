import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Volume2, Sword, Shield, Trophy, Home, SkipForward, Zap, ArrowRight, RotateCcw, BookOpen, Star, Lock, Flame, Skull, ClipboardList, Crown, Target, Medal, Keyboard, AlertCircle, Brain, CheckCircle2, FastForward, LayoutGrid, LogOut, Square, Bookmark } from 'lucide-react';
import { QUESTIONS } from './data/questions';
import { getQuestionExample } from './data/questionExamples';
import { getQuestionGrammarPoint } from './data/questionGrammarPoints';
import { getQuestionSynonyms } from './data/questionSynonyms';
import { BEGINNER_BATTLE_PHASES, BEGINNER_BATTLE_PHASE_SIZE, BEGINNER_BATTLE_QUESTIONS } from './data/beginnerBattle';
import HelpScreen from './HelpScreen';

// --- Types & Interfaces ---

type Difficulty = 'Eiken5' | 'Eiken4' | 'EikenPre1' | 'Conversation';
type Level = 1 | 2 | 3;
type Mode = 'guide' | 'challenge' | 'weakness'; 
type InputMode = 'voice-text' | 'text-only' | 'voice-only';
type BattleResult = 'win' | 'lose' | 'draw' | null;
type SpeechVoiceMode = 'random' | 'us_female' | 'us_male' | 'uk_female' | 'uk_male';
type BossStage = 0 | 1 | 2 | 3 | 4;
type BattleHistoryItem = { damage: number; speed: number };
type VersusPromptMode = 'spelling' | 'listening' | 'translation' | 'listening-translation';
type VersusPromptSelection = VersusPromptMode | 'mixed';
type VersusCourseSelection = { difficulty: Difficulty; level: Level };

type VersusQuestion = {
  question: Question;
  promptMode: VersusPromptMode;
};

type VersusPlayer = {
  id: string;
  name: string;
  difficulty: Difficulty;
  level: Level;
  score: number;
  scoreMultiplier: number;
  perfectCount: number;
  missCount: number;
  totalTimeMs: number;
};

type VersusRankingEntry = {
  name: string;
  score: number;
  perfectCount: number;
  missCount: number;
  totalTimeMs: number;
  recordedAt: number;
};

// Monster Types for Visuals
type MonsterType = 'slime' | 'beast' | 'wing' | 'ghost' | 'robot' | 'boss' | 'object';

interface Monster {
  id: string;
  name: string;
  type: MonsterType;
  color: string;
  baseHp: number; 
  dialogueStart: string;
  dialogueDefeat: string;
  battleDialogues?: Partial<Record<MonsterDialogueState, string[]>>;
  theme: string;
}

type MonsterVisualVariant =
  | 'horns'
  | 'crown'
  | 'mask'
  | 'runes'
  | 'crystal'
  | 'mimic'
  | 'halo'
  | 'spikes'
  | 'cape'
  | 'orbital'
  | 'sigil'
  | 'flare';

type MonsterVisualStyle = {
  primary?: MonsterVisualVariant;
  secondary?: MonsterVisualVariant;
  accentColor?: string;
  eyeColor?: string;
  silhouette?: 'wyvern' | 'overlord' | 'reaper' | 'apocalypse';
};

interface Question {
  text: string;
  translation: string;
  basicMeaning?: string;
  exampleEn?: string;
  exampleJa?: string;
  synonyms?: string[];
  promptEn?: string;
  promptJa?: string;
  speakingTip?: string;
}

interface BattleLogItem {
    question: Question;
    missCount: number;
    skipped: boolean;
}

type WeakQuestionStat = {
  missCount: number;
  lastMissedAt: number;
  consecutiveCorrect: number;
};

type LearningLevel = 1 | 2 | 3;

type ManualQuestionStatus = {
  practiceLevel: LearningLevel;
  battleLevel: LearningLevel;
  manualOverrideLevel: LearningLevel | null;
  excluded: boolean;
  updatedAt: number;
  learningLevel?: LearningLevel;
};

type QuestionPoolState = {
  order: number[];
  cursor: number;
  lastIndex: number | null;
};

type ReviewQueueEntry = {
  difficulty: Difficulty;
  level: Level;
  question: Question;
  remainingQuestions: number;
  missCount: number;
};

type AutoPlaySource = 'all' | 'weak' | 'marked' | 'selected';
type AutoPlaySequenceMode = 'normal' | 'exampleFirst' | 'exampleTextExample';

type AutoPlaySettings = {
  source: AutoPlaySource;
  playText: boolean;
  playTranslation: boolean;
  playExample: boolean;
  sequenceMode: AutoPlaySequenceMode;
  repeat: boolean;
  shuffle: boolean;
  playbackRatePercent: number;
  itemGapSeconds: number;
  questionGapSeconds: number;
};

type AutoPlayNowPlayingPart = 'text' | 'translation' | 'example';

type AutoPlayNowPlaying = {
  questionText: string;
  translation: string;
  basicMeaning?: string;
  example: string | null;
  activePart: AutoPlayNowPlayingPart;
};

type ProgressExportPayload = {
  formatVersion: number;
  app: 'english-typing-rpg';
  exportedAt: string;
  player?: {
    id: string;
    name: string;
    data: PlayerProfileData;
  };
  data?: PlayerProfileData;
};

type PlayerProfileData = {
  defeatedMonsterIds?: string[];
  bestScores?: Record<string, number>;
  maxKeystrokes?: number;
  weakQuestions?: Question[];
  weakQuestionStats?: Record<string, WeakQuestionStat>;
  manualQuestionStatuses?: Record<string, ManualQuestionStatus>;
  reviewQueue?: ReviewQueueEntry[];
  dailyProgress?: DailyProgress;
  bgmVolumeLevel?: number;
  speechVoiceMode?: SpeechVoiceMode;
  speechRatePercent?: number;
  translationBattleCorrectSpeechEnabled?: boolean;
  autoPlaySettings?: AutoPlaySettings;
  selectedQuestionKeysByScope?: Record<string, string[]>;
  markedQuestionKeysByScope?: Record<string, string[]>;
  savedSelectionLists?: SavedSelectionList[];
};

type PlayerProfile = {
  id: string;
  name: string;
  updatedAt: number;
  data: PlayerProfileData;
};

type SavedSelectionList = {
  id: string;
  name: string;
  difficulty: Difficulty;
  level: Level;
  questionKeys: string[];
  updatedAt: number;
};

type ResolvedSpeechConfig = {
  mode: Exclude<SpeechVoiceMode, 'random'>;
  lang: 'en-US' | 'en-GB';
  voice: SpeechSynthesisVoice | null;
  resolution: 'locale-gender' | 'gender-fallback' | 'locale-fallback' | 'unresolved';
};

interface GameState {
  screen: 'title' | 'settings' | 'help' | 'monster-book' | 'question-list' | 'score-view' | 'rank-list' | 'level-select' | 'mode-select' | 'battle' | 'result' | 'versus-setup' | 'versus-play' | 'versus-results' | 'typing-practice' | 'beginner-battle';
  selectedDifficulty: Difficulty;
  selectedLevel: Level;
  mode: Mode;
  inputMode: InputMode;
  currentMonsterIndex: number;
  currentMonsterList: Monster[]; 
  challengeModeIndices: number[];
  monsterHp: number;
  maxMonsterHp: number;
  score: number;
  combo: number;
  currentQuestion: Question;
  userInput: string;
  startTime: number | null;
  history: BattleHistoryItem[];
  questionCount: number; 
  maxQuestions: number;  
  battleResult: BattleResult;
  totalMonstersInStage: number;
  defeatedMonsterIds: string[];
  isNewRecord: boolean; 
  missCount: number;
  totalKeystrokes: number;
  hintLength: number; 
  currentBattleMissedQuestions: Question[]; 
  battleLog: BattleLogItem[];
  battleStartScore: number;
  battleStartKeystrokes: number;
  bossStage: BossStage;
}

type DailyProgress = {
  date: string;
  questionCount: number;
};

type MonsterDialogueState = 'start' | 'combo' | 'desperate' | 'damaged' | 'taunt' | 'defeat';

// --- Rank System ---
interface RankData { threshold: number; title: string; color: string; }

const GUIDE_TARGET_COUNT = 20;
const LISTENING_TRAINING_TARGET_COUNT = 20;
const VERSUS_QUESTION_COUNT = 20;
const VERSUS_RANKING_LIMIT = 10;
const DEFAULT_VERSUS_COURSE_SELECTION: VersusCourseSelection = { difficulty: 'Eiken5', level: 1 };
const VERSUS_SCORE_MULTIPLIER_OPTIONS = Array.from({ length: 15 }, (_, index) => {
  const value = Number((0.7 + index * 0.05).toFixed(2));
  return { value, label: value === 1 ? '標準 1.00倍' : `${value.toFixed(2)}倍` };
});
const NORMAL_TARGET_COUNT = 20;
const TYPING_PRACTICE_STEPS = ['f', 'j', 'a', 's', 'd', 'k', 'l', 'q', 'w', 'e', 'z', 'x', 'c', 'cat', 'dog', 'sun'];
const TYPING_FINGER_GUIDES: Record<string, { finger: string; homeKey: string }> = {
  a: { finger: '左手の小指', homeKey: 'A' }, q: { finger: '左手の小指', homeKey: 'A' }, z: { finger: '左手の小指', homeKey: 'A' },
  s: { finger: '左手の薬指', homeKey: 'S' }, w: { finger: '左手の薬指', homeKey: 'S' }, x: { finger: '左手の薬指', homeKey: 'S' },
  d: { finger: '左手の中指', homeKey: 'D' }, e: { finger: '左手の中指', homeKey: 'D' }, c: { finger: '左手の中指', homeKey: 'D' },
  f: { finger: '左手の人さし指', homeKey: 'F' }, r: { finger: '左手の人さし指', homeKey: 'F' }, t: { finger: '左手の人さし指', homeKey: 'F' }, g: { finger: '左手の人さし指', homeKey: 'F' }, v: { finger: '左手の人さし指', homeKey: 'F' }, b: { finger: '左手の人さし指', homeKey: 'F' },
  j: { finger: '右手の人さし指', homeKey: 'J' }, y: { finger: '右手の人さし指', homeKey: 'J' }, u: { finger: '右手の人さし指', homeKey: 'J' }, h: { finger: '右手の人さし指', homeKey: 'J' }, n: { finger: '右手の人さし指', homeKey: 'J' }, m: { finger: '右手の人さし指', homeKey: 'J' },
  k: { finger: '右手の中指', homeKey: 'K' }, i: { finger: '右手の中指', homeKey: 'K' },
  l: { finger: '右手の薬指', homeKey: 'L' }, o: { finger: '右手の薬指', homeKey: 'L' },
  p: { finger: '右手の小指', homeKey: '；' },
};
const TYPING_FINGER_KEY_CLASSES: Record<string, string> = {
  q: 'border-rose-300/70 bg-rose-400/15', a: 'border-rose-300/70 bg-rose-400/15', z: 'border-rose-300/70 bg-rose-400/15',
  w: 'border-orange-300/70 bg-orange-400/15', s: 'border-orange-300/70 bg-orange-400/15', x: 'border-orange-300/70 bg-orange-400/15',
  e: 'border-yellow-300/70 bg-yellow-400/15', d: 'border-yellow-300/70 bg-yellow-400/15', c: 'border-yellow-300/70 bg-yellow-400/15',
  r: 'border-sky-300/70 bg-sky-400/15', f: 'border-sky-300/70 bg-sky-400/15', v: 'border-sky-300/70 bg-sky-400/15', t: 'border-sky-300/70 bg-sky-400/15', g: 'border-sky-300/70 bg-sky-400/15', b: 'border-sky-300/70 bg-sky-400/15',
  y: 'border-violet-300/70 bg-violet-400/15', h: 'border-violet-300/70 bg-violet-400/15', n: 'border-violet-300/70 bg-violet-400/15', u: 'border-violet-300/70 bg-violet-400/15', j: 'border-violet-300/70 bg-violet-400/15', m: 'border-violet-300/70 bg-violet-400/15',
  i: 'border-cyan-300/70 bg-cyan-400/15', k: 'border-cyan-300/70 bg-cyan-400/15',
  o: 'border-emerald-300/70 bg-emerald-400/15', l: 'border-emerald-300/70 bg-emerald-400/15', p: 'border-fuchsia-300/70 bg-fuchsia-400/15',
};
const HARD_TARGET_COUNT = 20;
const REVIEW_REAPPEAR_DELAY = 5;
const REVIEW_RATE_WINDOW_SIZE = 5;
const REVIEW_RATE_MAX_IN_WINDOW = 3;
const LISTENING_TRAINING_DAMAGE_MULTIPLIER = 0.28;
const GUIDE_DAMAGE_MULTIPLIER = 0.3;
const LEARNING_LEVELS: LearningLevel[] = [1, 2, 3];
const DIFFICULTY_HP_MULTIPLIERS: Record<Difficulty, number> = {
  Eiken5: 1,
  Eiken4: 1,
  EikenPre1: 1.35,
  Conversation: 1,
};

const getGuideTargetCount = (difficulty: Difficulty, level: Level) => {
  void difficulty;
  void level;
  return GUIDE_TARGET_COUNT;
};

const getListeningTargetCount = (difficulty: Difficulty, level: Level) => {
  void difficulty;
  void level;
  return LISTENING_TRAINING_TARGET_COUNT;
};

const getBattleDamageMultiplier = (mode: Mode, inputMode: InputMode) => {
  if (mode === 'guide') return GUIDE_DAMAGE_MULTIPLIER;
  if (mode === 'challenge' && inputMode === 'voice-text') return LISTENING_TRAINING_DAMAGE_MULTIPLIER;
  return 1;
};

const normalizeTypingText = (text: string) => (
  text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
);

const DEFAULT_BATTLE_QUESTION_LIMIT = 10;
const FINAL_BOSS_QUESTION_LIMIT = 20;
const FINAL_BOSS_HP_MULTIPLIER = 2;
const HIDDEN_BOSS_COUNT = 3;
const HIDDEN_BOSS_QUESTION_LIMITS: Record<Exclude<BossStage, 0 | 1>, number> = {
  2: 30,
  3: 40,
  4: 50,
};
const HIDDEN_BOSS_HP_MULTIPLIERS: Record<Exclude<BossStage, 0 | 1>, number> = {
  2: 3,
  3: 4,
  4: 5,
};
const EIKEN5_LEVEL2_GUIDE_HP_CURVE = [260, 290, 320, 350, 380, 400, 415, 430, 440, 450, 460, 470, 480, 490, 500, 505, 510, 515, 520, 520];
const EIKEN5_LEVEL2_BATTLE_HP_CURVE = [1050, 1220, 1380, 1530, 1650, 1680, 1700, 1710, 1720, 1730, 1740, 1750, 1760, 1770, 1780, 1790, 1800, 1810, 1820];
const EIKEN5_LEVEL3_GUIDE_HP_CURVE = [340, 380, 420, 460, 500, 530, 550, 570, 580, 590, 610, 620, 630, 650, 660, 670, 670, 680, 680, 680];
const EIKEN5_LEVEL3_BATTLE_HP_CURVE = [1380, 1610, 1820, 2010, 2170, 2210, 2240, 2250, 2270, 2280, 2290, 2300, 2320, 2330, 2340, 2360, 2370, 2380, 2400];

const isEndlessChallengeInputMode = (mode: Mode, inputMode: InputMode) => (
  mode === 'challenge' && (inputMode === 'voice-only' || inputMode === 'text-only')
);

const getBossStage = (
  mode: Mode,
  inputMode: InputMode,
  stepIndex: number,
  totalMonsters: number
): BossStage => {
  if (mode === 'weakness' || totalMonsters <= 0) return 0;

  if (isEndlessChallengeInputMode(mode, inputMode)) {
    const hiddenBossStartIndex = Math.max(totalMonsters - HIDDEN_BOSS_COUNT, 0);
    if (stepIndex >= hiddenBossStartIndex) {
      return Math.min(4, stepIndex - hiddenBossStartIndex + 2) as BossStage;
    }

    const finalBossIndex = hiddenBossStartIndex - 1;
    return stepIndex === finalBossIndex ? 1 : 0;
  }

  return stepIndex >= Math.max(totalMonsters - 1, 0) ? 1 : 0;
};

const getBattleQuestionLimit = (difficulty: Difficulty, level: Level, mode: Mode, bossStage: BossStage) => {
  if (mode === 'weakness') return DEFAULT_BATTLE_QUESTION_LIMIT;
  if (difficulty === 'Eiken5' && level === 2) {
    if (bossStage === 1) return 12;
    if (bossStage === 2) return 16;
    if (bossStage === 3) return 18;
    if (bossStage === 4) return 20;
    return 8;
  }
  if (difficulty === 'Eiken5' && level === 3) {
    if (bossStage === 1) return 10;
    if (bossStage === 2) return 12;
    if (bossStage === 3) return 14;
    if (bossStage === 4) return 16;
    return 6;
  }
  if (bossStage === 1) return FINAL_BOSS_QUESTION_LIMIT;
  if (bossStage === 2 || bossStage === 3 || bossStage === 4) {
    return HIDDEN_BOSS_QUESTION_LIMITS[bossStage];
  }
  return DEFAULT_BATTLE_QUESTION_LIMIT;
};

const getBattleHp = (
  difficulty: Difficulty,
  level: Level,
  baseHp: number,
  bossStage: BossStage
) => {
  const difficultyHpMultiplier = DIFFICULTY_HP_MULTIPLIERS[difficulty] ?? 1;
  const isEiken5Level2 = difficulty === 'Eiken5' && level === 2;
  const isEiken5Level3 = difficulty === 'Eiken5' && level === 3;
  const bossHpMultiplier = bossStage === 1
    ? (isEiken5Level2 ? 1.5 : isEiken5Level3 ? 1.25 : FINAL_BOSS_HP_MULTIPLIER)
    : bossStage === 2
      ? (isEiken5Level2 ? 2 : isEiken5Level3 ? 1.5 : HIDDEN_BOSS_HP_MULTIPLIERS[2])
      : bossStage === 3
        ? (isEiken5Level2 ? 2.25 : isEiken5Level3 ? 1.75 : HIDDEN_BOSS_HP_MULTIPLIERS[3])
        : bossStage === 4
          ? (isEiken5Level2 ? 2.5 : isEiken5Level3 ? 2 : HIDDEN_BOSS_HP_MULTIPLIERS[4])
          : 1;
  return Math.round(baseHp * difficultyHpMultiplier * bossHpMultiplier);
};

const getCourseBaseHp = (
  difficulty: Difficulty,
  level: Level,
  mode: Mode,
  inputMode: InputMode,
  stepIndex: number,
  defaultBaseHp: number
) => {
  if (difficulty !== 'Eiken5' || (level !== 2 && level !== 3)) return defaultBaseHp;

  const curve = level === 2
    ? (mode === 'guide' || inputMode === 'voice-text' ? EIKEN5_LEVEL2_GUIDE_HP_CURVE : EIKEN5_LEVEL2_BATTLE_HP_CURVE)
    : (mode === 'guide' || inputMode === 'voice-text' ? EIKEN5_LEVEL3_GUIDE_HP_CURVE : EIKEN5_LEVEL3_BATTLE_HP_CURVE);
  return curve[Math.min(Math.max(stepIndex, 0), curve.length - 1)] ?? defaultBaseHp;
};

const getBattleTuning = (
  difficulty: Difficulty,
  level: Level,
  mode: Mode,
  inputMode: InputMode,
  stepIndex: number,
  baseHp: number,
  bossStage: BossStage
) => {
  const courseBaseHp = getCourseBaseHp(difficulty, level, mode, inputMode, stepIndex, baseHp);
  const monsterHp = getBattleHp(difficulty, level, courseBaseHp, bossStage);

  return {
    monsterHp,
    damageMultiplier: getBattleDamageMultiplier(mode, inputMode),
    maxQuestions: getBattleQuestionLimit(difficulty, level, mode, bossStage),
  };
};

const getBattleStageIndices = (
  monsters: Monster[],
  baseCount: number,
  mode: Mode,
  inputMode: InputMode
) => {
  const baseIndices = Array.from({ length: Math.min(baseCount, monsters.length) }, (_, index) => index);

  if (!isEndlessChallengeInputMode(mode, inputMode) || monsters.length <= baseIndices.length) {
    return baseIndices;
  }

  const hiddenBossIndices = Array.from(
    { length: Math.min(HIDDEN_BOSS_COUNT, Math.max(monsters.length - baseIndices.length, 0)) },
    (_, index) => baseIndices.length + index
  );

  return [...baseIndices, ...hiddenBossIndices];
};

const getPerfectClearDamageFloor = (
  bossStage: BossStage,
  maxMonsterHp: number,
  maxQuestions: number,
  allowOneSmallMiss = false,
) => {
  if (bossStage === 0 || maxQuestions <= 0) return 0;
  const guaranteedClearQuestionCount = Math.max(1, maxQuestions - (allowOneSmallMiss ? 1 : 0));
  return Math.ceil(maxMonsterHp / guaranteedClearQuestionCount);
};

const getBossIntroLabel = (bossStage: BossStage) => {
  switch (bossStage) {
    case 1:
      return 'ラスボス出現！';
    case 2:
      return '裏ボス出現！';
    case 3:
      return '裏ボス第二形態！';
    case 4:
      return '裏ボス最終形態！';
    default:
      return '';
  }
};

const MONSTER_BOOK_INPUT_MODES: InputMode[] = ['voice-text', 'voice-only', 'text-only'];

const isMonsterDefeatedForBook = (
  defeatedMonsterIds: string[],
  difficulty: Difficulty,
  level: Level,
  mode: Extract<Mode, 'guide' | 'challenge'>,
  monsterId: string
) => (
  MONSTER_BOOK_INPUT_MODES.some(inputMode => (
    matchesDefeatedMonster(defeatedMonsterIds, difficulty, level, mode, inputMode, monsterId)
  ))
);

const countDefeatedMonstersForBook = (
  monsters: Monster[],
  defeatedMonsterIds: string[],
  difficulty: Difficulty,
  level: Level,
  mode: Extract<Mode, 'guide' | 'challenge'>
) => (
  monsters.filter(monster => (
    isMonsterDefeatedForBook(defeatedMonsterIds, difficulty, level, mode, monster.id)
  )).length
);

const getComboLabel = (combo: number) => {
  if (combo >= 10) return 'Legendary';
  if (combo >= 7) return 'Blazing';
  if (combo >= 5) return 'Hot Streak';
  if (combo >= 3) return 'Combo';
  return '';
};

const getBattleQuestionPresentation = (questionText: string) => {
  const questionLength = questionText.length;

  return {
    textClass: questionLength > 58
      ? 'text-xl md:text-3xl'
      : questionLength > 42
        ? 'text-2xl md:text-4xl'
        : 'text-3xl md:text-5xl',
    panelClass: questionLength > 42 ? 'px-5 md:px-8 py-4 md:py-5' : 'px-4 md:px-6 py-3 md:py-4',
    minHeightClass: questionLength > 58 ? 'min-h-[4.8em]' : questionLength > 42 ? 'min-h-[3.9em]' : 'min-h-[3em]',
  };
};

const RANKS: RankData[] = [
    { threshold: 0, title: "見習いチャレンジャー", color: "text-slate-400" },
    { threshold: 5, title: "駆け出しの冒険者", color: "text-green-400" },
    { threshold: 10, title: "期待のニューフェース", color: "text-blue-400" },
    { threshold: 15, title: "勇敢なソルジャー", color: "text-indigo-400" },
    { threshold: 20, title: "熟練のベテラン", color: "text-purple-400" },
    { threshold: 25, title: "百戦錬磨の騎士", color: "text-pink-400" },
    { threshold: 30, title: "アリーナの覇者", color: "text-orange-400" },
    { threshold: 35, title: "タイピングマスター", color: "text-red-500" },
    { threshold: 40, title: "疾風の達人", color: "text-rose-500" },
    { threshold: 45, title: "伝説の英雄", color: "text-yellow-400" }
];

// --- Helpers ---

const isEditableEventTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return tagName === 'input'
    || tagName === 'textarea'
    || tagName === 'select'
    || target.isContentEditable;
};

const getUniqueKey = (
  difficulty: Difficulty,
  level: Level,
  mode: Mode,
  inputMode: InputMode,
  monsterId: string
) => {
  return `${difficulty}:${level}:${mode}:${inputMode}:${monsterId}`;
};

const isScopedDefeatedMonsterKey = (value: string) => {
  const parts = value.split(':');
  if (parts.length !== 5) return false;

  const [difficulty, level, mode, inputMode, monsterId] = parts;
  if (!DIFFICULTIES.includes(difficulty as Difficulty)) return false;
  if (!getAvailableLevels(difficulty as Difficulty).includes(Number(level) as Level)) return false;
  if (!['guide', 'challenge', 'weakness'].includes(mode)) return false;
  if (!['voice-text', 'text-only', 'voice-only'].includes(inputMode)) return false;
  return monsterId.length > 0;
};

const normalizeDefeatedMonsterIds = (ids: string[] | unknown) => (
  Array.from(new Set((Array.isArray(ids) ? ids : []).filter((id): id is string => (
    typeof id === 'string' && isScopedDefeatedMonsterKey(id)
  ))))
);

const matchesDefeatedMonster = (
  defeatedMonsterIds: string[],
  difficulty: Difficulty,
  level: Level,
  mode: Mode,
  inputMode: InputMode,
  monsterId: string
) => {
  const scopedKey = getUniqueKey(difficulty, level, mode, inputMode, monsterId);
  return defeatedMonsterIds.includes(scopedKey);
};

const extractMonsterId = (uniqueKey: string) => {
    if (!uniqueKey) return "";
    const parts = uniqueKey.split(':');
    return parts.length > 1 ? parts[parts.length - 1] : uniqueKey;
};

const getSpeedMultiplier = (charsPerSec: number): number => {
  if (charsPerSec < 0.8) return 1.0;
  if (charsPerSec < 1.2) return 1.2;
  if (charsPerSec < 1.6) return 1.4;
  if (charsPerSec < 2.0) return 1.6;
  if (charsPerSec < 2.4) return 1.8;
  if (charsPerSec < 2.8) return 2.0;
  if (charsPerSec < 3.2) return 2.2;
  if (charsPerSec < 3.6) return 2.4;
  if (charsPerSec < 4.0) return 2.6;
  if (charsPerSec < 4.4) return 2.8;
  return 3.0;
};

// 英検5級の長いフレーズ・文では、速さは小さなボーナスにとどめる。
// 1文字のケアレスミスより、英文を最後まで理解して入力できたことを重視するため。
const getEikenLongTextGuideSpeedMultiplier = (charsPerSec: number): number => {
  if (charsPerSec < 0.8) return 1.0;
  if (charsPerSec < 1.6) return 1.05;
  if (charsPerSec < 2.4) return 1.1;
  if (charsPerSec < 3.2) return 1.15;
  return 1.2;
};

// 英検4級は5級より文が長いため、同じHPに対して必要な基礎ダメージを個別に設定する。
// これは入力の速さではなく、最後まで英文を入力できたことを評価するための調整。
const getEikenLongTextGuideDamageMultiplier = (difficulty: Difficulty, level: Level): number => {
  if (difficulty === 'Eiken4') return level === 2 ? 0.5 : 0.58;
  return level === 2 ? 0.7 : 0.74;
};

const getMonsterBattleDialogue = (
  monster: Monster,
  options: {
    isDefeated: boolean;
    isDamaged: boolean;
    hpRate: number;
    combo: number;
    missCount: number;
  }
): string => {
  if (options.isDefeated) return monster.dialogueDefeat;

  if (options.combo >= 7) {
    return monster.type === 'boss' ? 'な、なんだその猛攻は…！' : 'その勢い、ちょっと反則だよ！';
  }

  if (options.hpRate <= 0.2) {
    return monster.type === 'boss' ? 'まだだ…まだ倒れん…！' : 'ま、まだ負けない…！';
  }

  if (options.isDamaged) {
    if (monster.type === 'robot') return 'ダメージ確認…制御低下…！';
    if (monster.type === 'ghost') return 'その一撃はきいたぞ…！';
    if (monster.type === 'boss') return 'くっ…やるではないか！';
    return 'うわっ、きいたー！';
  }

  if (options.missCount >= 2) {
    return monster.type === 'boss' ? '迷いがあるぞ。そこを突く！' : '焦ってるね？ まだいけるかな？';
  }

  if (options.combo >= 3) {
    return monster.type === 'boss' ? '連撃だと…！？' : 'そんなに続けて決めるの！？';
  }

  return monster.dialogueStart;
};

const uniqueLines = (lines: string[]) => Array.from(new Set(lines.filter(Boolean)));

const getTypeSpecificDialogues = (monster: Monster, state: MonsterDialogueState): string[] => {
  const typeLines: Record<MonsterType, Partial<Record<MonsterDialogueState, string[]>>> = {
    slime: {
      start: ['今日のコンディションは半熟です。', 'ぷるぷる代表として負けられません。'],
      damaged: ['揺らすな揺らすな、中身が寄る〜！', 'いまの一撃で三層に分かれた！'],
      desperate: ['もうスライムというより、こぼれそうなゼリー...', '体積は減ってもプライドは増量中...！'],
    },
    beast: {
      start: ['ガオー！ と言いたいけど今日はのどが乾いてる。', '勢いだけで来た。作戦は途中で考える！'],
      damaged: ['うおっ、野生の勘が外れた！', 'いまのは毛並みにひびくやつ！'],
      desperate: ['足はふらつくが、見栄はまだ立っている！', '負けそうなので迫力だけ2割増しでいきます。'],
    },
    wing: {
      start: ['上空から失礼します。着地は未定です。', '飛べるけど方向音痴、それが空の流儀。'],
      damaged: ['羽がっ、羽が言うことを聞かない！', '今の一発で飛行プランが乱気流！'],
      desperate: ['高度が下がる、テンションも下がる...', 'このままだと徒歩帰宅コースです...'],
    },
    ghost: {
      start: ['ひゅ〜どろろ。効果音だけは一流です。', '背後を取る予定でしたが、今ちょっと迷ってます。'],
      damaged: ['ひゃっ、透ける透ける！', '驚かす側なのに、今ので私が驚いた！'],
      desperate: ['消えそうで消えない、しぶとい未練です...', '成仏の予約、まだキャンセルできますか？'],
    },
    robot: {
      start: ['起動完了。なお説明書は紛失しました。', 'ロックオン完了。たぶん合ってます。'],
      damaged: ['エラー発生。つよい、かなりつよい。', '装甲に傷。メンタルにも傷。'],
      desperate: ['出力低下...ですが見た目は平静を維持。', '警告。かっこよく負ける準備が始まりました。'],
    },
    boss: {
      start: ['余裕の登場だ。BGMだけ先に盛り上がっている。', '我こそは強敵。たぶん演出込みで。'],
      combo: ['その連打、反則では？ 反則じゃないのか...', '待て待て、その勢いだと私の威厳が追いつかん！'],
      damaged: ['くっ...今のは演出ではなく本当に痛い。', 'よろめいてなどいない。床が近づいただけだ。'],
      desperate: ['ここまで来るとは...脚本にない展開だぞ！', 'まだ終わらん...終わらんが、息は上がっている。'],
      taunt: ['手元が乱れているぞ。余裕がないのはお互い様だがな。', '集中が切れたか？ こちらは最初から切れ気味だ。'],
      defeat: ['見事だ...今日は威厳を置いて帰る。', '敗北を認めよう。拍手は小さめで頼む...。'],
    },
    object: {
      start: ['物なのにやる気だけは生きている。', '転がってきた。本人にも理由はよくわからない。'],
      damaged: ['あっ、そこは耐久試験の範囲外です！', 'きしむきしむ、でも一応まだ現役！'],
      desperate: ['部品が外れそう。気合いで留めています。', '形を保つので精一杯、でも登場料は返しません。'],
    },
  };

  return typeLines[monster.type][state] ?? [];
};

const getDefaultMonsterDialoguePool = (monster: Monster, state: MonsterDialogueState): string[] => {
  const genericLines: Record<MonsterDialogueState, string[]> = {
    start: [
      monster.dialogueStart,
      `${monster.name}が現れた。たぶん本人も少し緊張している。`,
      `${monster.name}「勝負の前に深呼吸。ふー、ふー、まだ長い！」`,
      `${monster.name}「タイピングで勝つ。できればスマートに！」`,
      `${monster.name}「今日はいい感じ。根拠はない！」`,
      `${monster.name}「負けたら帰り道で反省会します...」`,
      `${monster.name}「やる気だけ先に来ました！」`,
      `${monster.name}「本日の作戦名は『なんとかする』です！」`,
      `${monster.name}「勝負だ！ でもちょっと手加減してもいいよ？」`,
      `${monster.name}が吹き出しのネタを温めながら迫ってくる。`,
    ],
    combo: [
      `${monster.name}「そのコンボ、指にエンジン積んでる？」`,
      `${monster.name}「速い速い！ こっちは気持ちしか追いつかない！」`,
      `${monster.name}「待って、今ので三回くらい心が折れかけた！」`,
      `${monster.name}「そのテンポ、メトロノームが転職するレベル！」`,
      `${monster.name}「連続ヒット！？ こちらの言い訳が間に合わない！」`,
      `${monster.name}「押されてる！ でも口だけは元気です！」`,
      `${monster.name}「ちょっと本気がすぎませんこと！？」`,
      `${monster.name}「その勢い、もはやタイピングという名の天気！」`,
    ],
    desperate: [
      `${monster.name}「まだだ...まだセリフの在庫はある...！」`,
      `${monster.name}「ここで倒れたらオチがつかない！」`,
      `${monster.name}「ピンチです。顔には出てないつもりです！」`,
      `${monster.name}「ふらついているが、ボケる余力は残っている！」`,
      `${monster.name}「あと一歩...いや半歩くらいで危ない！」`,
      `${monster.name}「もうだめかも...いや、だめでも言い切らん！」`,
      `${monster.name}「この場を乗り切ったら甘いものを食べる！」`,
      `${monster.name}「根性で立ってる。物理法則とは相談中！」`,
    ],
    damaged: [
      `${monster.name}「いまの一撃、ちゃんと効くやつじゃん！」`,
      `${monster.name}「痛っ！ 今のは笑って流せない！」`,
      `${monster.name}「見た目より本気だね！？ それ困る！」`,
      `${monster.name}「ちょっと待って、心の準備がまだ！」`,
      `${monster.name}「その速さ、反省する暇もくれない！」`,
      `${monster.name}「うぐっ...今ので顔芸が一段階進んだ！」`,
      `${monster.name}「さすがに今のはノーカウントにしない？」`,
      `${monster.name}「痛い！ でもリアクションは100点を狙う！」`,
    ],
    taunt: [
      `${monster.name}「おやおや、指が迷子かな？」`,
      `${monster.name}「あせるとミスが増える。経験者は語る！」`,
      `${monster.name}「リズムが崩れてるぞ。こっちは最初から崩れてるが！」`,
      `${monster.name}「その打ち間違い、ちょっと親近感あるね！」`,
      `${monster.name}「落ち着いて！ 私まで落ち着いちゃうから！」`,
      `${monster.name}「手が止まった？ じゃあ今のうちに威張っとく！」`,
      `${monster.name}「集中、集中。私に言われたくはないだろうけど！」`,
      `${monster.name}「ミスが続くと、こちらの調子まで乗ってしまう！」`,
    ],
    defeat: [
      monster.dialogueDefeat,
      `${monster.name}「負けました...でも最後のリアクションは良かったはず。」`,
      `${monster.name}「完敗です。拍手より先に回復がほしい...。」`,
      `${monster.name}「次はもっと面白いセリフを持って戻る！」`,
      `${monster.name}「やられた〜！ でもちょっといい勝負だったよね？」`,
      `${monster.name}「今日は君が主役。私は字幕で十分です...。」`,
      `${monster.name}「くっ、敗北！ せめて転び方だけでも美しく...！」`,
      `${monster.name}「まいった。帰って吹き出し会議を開きます。」`,
    ],
  };

  return uniqueLines([
    ...genericLines[state],
    ...getTypeSpecificDialogues(monster, state),
    ...(monster.battleDialogues?.[state] ?? []),
  ]);
};

const getMonsterDialoguePool = (monster: Monster, state: MonsterDialogueState) => {
  const pool = getDefaultMonsterDialoguePool(monster, state);
  if (pool.length > 0) return pool;
  return state === 'defeat' ? [monster.dialogueDefeat] : [monster.dialogueStart];
};

void getMonsterDialoguePool;

const pickStableLine = (lines: string[], seed: string) => {
  if (lines.length === 0) return '';
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return lines[hash % lines.length];
};

const NORMAL_MONSTER_DIALOGUES: Record<MonsterDialogueState, string[]> = {
  start: [
    'ここから先は通さないよ！',
    '今日の練習、ちょっとだけ邪魔しちゃうぞ。',
    'その単語、ちゃんと聞き取れるかな？',
    'ゆっくりでもいいから、正確に来てみな！',
    'ぼくを倒すには集中力が必要だよ。',
    '準備はできた？ こっちはできてるよ。',
    '一問目から本気で来るんだね。',
    '今日はどれくらい強くなったか見せてよ。',
    'あわてるとミスが増えるよ。',
    '耳と指をちゃんと連携させてみな！',
    'このステージ、油断すると止まるよ。',
    '小さなミスも見逃さないからね。',
    '英語の音、ちゃんとつかまえられるかな？',
    'ここは練習場だけど、手加減は少しだけだよ。',
    '一文字ずつ、ていねいに来てみな。',
    '今日はぼくが相手だよ。',
    'まずは落ち着いて深呼吸だね。',
    'その集中、最後まで続くかな？',
    '正解を重ねたら道をあけてあげる。',
    'さあ、タイピング勝負を始めよう！',
    '音をよく聞いてから打つんだよ。',
    '聞こえた英語をそのままつかまえてみな。',
    'この問題、意外とあなどれないよ。',
    'ぼくの前で指が止まらないかな？',
    'リズムに乗れたら強いかもね。',
    '集中ゲージ、ちゃんと満タン？',
    '今日は新しいセリフで待ってたよ。',
    '同じ敵でも、毎回ちょっと違うぞ。',
    'ここでウォーミングアップしていこう。',
    'さあ、最初の一手を見せて！',
    'こちらも勤務時間内なので、なるべく手短にお願いしたい。',
    'このステージの治安は、だいたい君の正答率にかかっている。',
    '台本では強敵の予定だったんだけど、現場判断でいくよ。',
    '先に言っておくけど、負けても労災は出ないタイプの敵です。',
    '今日はコンディションが良い。昨日はアップデート待ちで寝不足だった。',
    '正直、英語より君の集中力の方がこわい。',
    'ここを守るのが仕事だけど、突破される前提の配置だとは聞いている。',
    '敵役にも生活があるんだ。だから全力で止める。',
    'このセリフ、何回目で見つけた？ けっこう奥に入れておいたよ。',
    '練習は裏切らないらしい。敵としては少し困る情報だね。',
    'ここは安全な練習場です。倒される側の安全は含まれていません。',
    '負けるために配置された敵にも、いちおう尊厳はあります。',
    '今日は君の成長を止める係です。成功率は歴代かなり低めです。',
    'この仕事、勝つより負け方の美しさが評価されがちなんだ。',
    '英語学習のためなら敵のメンタルは消耗品、という設計思想です。',
    'こちらは使い捨てモンスターですが、セリフだけは再利用されています。',
    '君が強くなるほど、私の存在理由は薄くなる。教育とは残酷だね。',
    'このステージに配属された時点で、だいたい結末は察している。',
    '新人研修では、勇者に倒される時の角度まで教わりました。',
    'この仕事を始めてから、正解音が少し苦手になりました。',
    '敵役の健康診断では、毎年メンタル欄だけ再検査です。',
    'ここを守れと言われたけど、ドアの鍵は最初から開いています。',
    '君が上達すると世界は平和になる。私の立場は平和ではない。',
    '倒される予定の敵にも、朝のコーヒーくらいは必要です。',
    'このセリフはランダムです。人生ほどではありません。',
    '本気で止めます。ただし仕様上、だいたい止まりません。',
    '練習相手としては優秀、敵としてはやや複雑な気持ちです。',
    '今日は強めに出ます。評価面談が近いので。',
    '君の英語力と私の退場タイミングは、おおむね比例します。',
    'このステージの空気、なんとなく倒される前提で進んでいます。',
    '敵にも事情がありますが、ゲーム画面には収まりません。',
    '正解されるたびに、私のキャリアプランが少し揺れます。',
    'ここで君を止めたら伝説。止められなければ通常営業です。',
    '敵側にもマニュアルはあります。だいたい役に立ちません。',
    '一応ボスではありませんが、気持ちだけは中間管理職です。',
    'ここまで来たなら、私の出番は残り短そうですね。',
    '倒されることも仕事のうち。そう思わないとやっていけません。',
    'このゲーム、成長するのは君で、減るのは私のHPです。',
    '準備運動は済みましたか。私は覚悟だけ済ませました。',
    'ここで油断してくれると、私の勤務評価が少し上がります。',
    '強くなった君を見るのは嬉しい。敵としては全然嬉しくない。',
    'このステージの平和は、私が倒されることで保たれます。',
    '君が来るまで待機していました。待機時間の方が長い仕事です。',
    '英語の練習相手にしては、こちらの失うものが多すぎます。',
    '私は壁です。ただし、かなり薄い壁です。',
    'この先に進むには私を倒す必要があります。人事配置の問題です。',
    '敵として登場していますが、内心では君の継続を応援しています。',
    'この場所を任されました。任された理由は聞かないでください。',
    '今日は倒される予定表に名前が載っています。',
    '練習の成果を試す相手として、私のHPはちょうどよく消費されます。',
    '君が間違えると少し安心します。器が小さい敵です。',
    '私は試練です。だいぶ親しみやすいタイプの試練です。',
    'このセリフを読む余裕があるなら、かなり落ち着いていますね。',
    '英語学習の前では、敵の都合はだいたい後回しです。',
    '一応こわい敵のつもりですが、丸みのある立場です。',
    'ここで足止めする契約ですが、契約内容に無理があります。',
    '君の上達に合わせて、私の影が少しずつ薄くなります。',
    'このステージの名脇役として、まずは全力で邪魔します。',
    '敵にもプライドはあります。HPほど長持ちはしません。',
    '今日は君の練習のために、ほどよく悪役を務めます。',
    '私は通行止めです。ただし突破される想定で設置されています。',
    '君が来た時点で、私の勤務終了時刻が近づきました。',
    'この勝負、始まる前から少し不利な気配があります。',
    '敵側の控室では、君の正答率がちょっとした噂です。',
    '今日は負ける準備も勝つ準備もしてきました。前者が濃厚です。',
    '練習相手としての誇りを胸に、敵っぽく立っています。',
    'このセリフを聞いたら、そろそろ私の番が来たということです。',
  ],
  combo: [
    '連続正解！？ ちょっと待って！',
    'そのテンポ、かなりいい感じだね。',
    'ミスなしで進むの、かっこいいじゃん。',
    'コンボが続くとこっちがあせるよ！',
    '指が温まってきたみたいだね。',
    'そのまま行かれると困るなあ。',
    'リズムが合ってきてる！',
    'いまの流れ、止めにくいぞ。',
    'え、もうそんなに正解したの？',
    '集中が乗ってるね。これは強い。',
    'その連続正解、会議で共有していいレベルだね。',
    'ちょっと待って、こちらの想定QAにない動きです。',
    'そのテンポ、敵側の士気にじわじわ効いてる。',
    '今の流れ、上司に報告したら配置換えされそう。',
    'コンボが続くと、こちらの存在意義が揺らぐんだよ。',
    'その正確さ、予算をかけた防衛ラインより信頼できるね。',
    'やめて、こっちのHPバーがプレゼン資料みたいに減ってる。',
    'いま完全にゾーン入ってるね。敵ながら議事録に残したい。',
    '連続正解が続くと、敵側の労働意欲が目に見えて下がります。',
    'そのコンボ、こちらの退職理由にそのまま書けそう。',
    'すごいね。私の敗北フラグが丁寧に回収されていく。',
    'HPより先にプライドの耐久値が危ない。',
    'その勢い、もはや戦闘というより業務改善だね。',
    'コンボが続くたびに、私のキャラ設定が薄くなっていく。',
    '連続正解で、こちらの反論する余白が消えていく。',
    'その流れ、止めるより拍手した方が早そうだ。',
    '今の君、敵から見てもだいぶ面倒なタイプです。',
    'コンボが続くと、私の登場時間が短縮されます。',
    'その正確さ、こちらの防衛計画を紙くずにしている。',
    '連続で決められると、敵の台本が追いつかない。',
    '待って、まだ負け惜しみの準備ができていない。',
    'そのペース、こっちの労務管理が崩れます。',
    'コンボの数字が伸びるたび、私の顔色が悪くなる。',
    '正解が続きすぎて、敵側の会議が静かになりました。',
    'その勢いなら、私の出番をスキップしても成立しそう。',
    '連続正解は素晴らしい。私の立場以外は。',
    '今の流れ、敵の心を折るには十分すぎる。',
    'こちらの作戦名は粘りでした。もう名前負けしています。',
    'コンボが続くと、私のセリフが言い訳に聞こえてくる。',
    'そのリズム、練習というより処理速度です。',
    '今の君に必要なのは敵ではなく、少し広い舞台かもしれない。',
    'このままでは私は経験値の形でしか残れない。',
    '連続正解の前では、敵の威厳も軽量化されます。',
    'その集中力、こちらの小細工を全部素通りしてくる。',
    '止めたい気持ちはあります。能力が追いついていません。',
    'コンボが伸びるほど、私の未来が短くなる。',
    'その安定感、敵側からするとかなり不親切です。',
    'もう少し手加減してもいいんだよ。言ってみただけです。',
    'その連打、キーボードより私の心に響いています。',
    '今の流れを止めるには、こちらに追加予算が必要です。',
    'コンボ表示を見るたびに、私の目が泳ぎます。',
    '正解が続くと、負ける理由がどんどん美しくなっていく。',
    'この連続正解、敵の控室までざわついています。',
    '君の指、今日はかなり機嫌が良さそうだね。',
    'コンボが増えるたびに、こちらの台本が白紙になります。',
    'その流れは危険です。主に私にとって。',
    '連続で当てられると、敵側の演技指導が入りそうです。',
    '今のテンポ、こちらの反撃タイミングを全部置き去りにしている。',
    'コンボを見ているだけで、敗北の輪郭がはっきりしてきました。',
    'その集中力、こちらの小芝居を正面から突破してくる。',
    '連続正解って、受ける側にはなかなか厳しい文化です。',
    'そのペースだと、私のセリフが余るかもしれない。',
    '君の調子が良すぎて、敵の仕事が成立しにくい。',
    'このコンボ、もはや説得力があります。',
    '正解が続くと、こちらの悪役感がだんだん弱火になります。',
    'いまの流れ、止めるには勇気より制度が必要です。',
    'そのコンボ、敵の安全基準を軽く超えています。',
    '連続正解が続くと、こちらの存在が効果音に近づきます。',
    '今の勢い、もう止めるより見届ける段階かもしれない。',
    'コンボの数字が、私にだけ厳しい現実を伝えてきます。',
    'そのテンポ、敵側の準備運動を完全に置いていった。',
    '正解が続くほど、私の名場面が短くなります。',
    '君の集中、敵を黙らせるタイプの説得力があります。',
  ],
  desperate: [
    'うわ、あと少しで倒されそう！',
    'まだ負けたわけじゃないからね！',
    'ここから粘れば、まだチャンスはあるはず！',
    '体力は少ないけど、気持ちは残ってるよ。',
    'あと一歩のところで止めてみせる！',
    'ま、まだセリフの在庫はあるんだから！',
    'ここで油断したら、もったいないよ。',
    '最後まで正確に打てるかな？',
    'ぐぬぬ、かなり追い込まれた。',
    'ここを抜けたら本当に強いね。',
    'ここから逆転したら映画化だけど、尺が足りないかもしれない。',
    '体力が少ない時ほど、発言が急に謙虚になるんだ。',
    'まだ終わってない。終わってないけど、終わりの気配はする。',
    'ここで粘るのがプロの敵役。なお契約は単発です。',
    'HPが少ないと、急に人生について考え始めるね。',
    'あと少しで倒れるけど、せめてセリフだけは残していく。',
    'これはピンチではない。かなり具体的なピンチだ。',
    '強がりの在庫が残りわずかになってきた。',
    '走馬灯にチュートリアル画面が流れてきた。',
    'ここまで削られると、悪役にも福利厚生が必要だと思う。',
    '最後の抵抗をしたいけど、予算の都合で短めにします。',
    'だいぶ追い込まれたね。主に私が。',
    'ここから逆転できたら伝説だけど、たぶん教材の趣旨が変わる。',
    'もう少しで倒れるけど、せめて倒れ方には品格を持ちたい。',
    'このHPで強がるのは、もはや芸風です。',
    'まだ立っています。立っているだけとも言います。',
    '逆転の可能性はあります。資料上は。',
    'ここから粘れたらすごい。主に私の根性が。',
    '残り体力を見ると、急に敬語になりたくなります。',
    'この状況で余裕ぶるのは、さすがに無理があります。',
    'あと少しの命ですが、セリフだけは長めです。',
    '体力バーが短すぎて、逆に見失いそうです。',
    'ピンチになると、敵にも走馬灯と反省文が見えます。',
    'ここまで来ると、負け方の演出が大事になってきます。',
    'もう少しで終わりそうですが、せめて爪あとを残したい。',
    'HPが減ると、急に世界が優しく見えるね。',
    'ここから本気を出します。少し遅かった気もします。',
    '追い込まれてからが勝負。という言葉にすがっています。',
    'まだ倒れていないので、理論上は敵です。',
    'この体力で挑発するのは、なかなか勇気がいります。',
    'もうすぐ退場ですが、気持ちはエンディング後も残ります。',
    'ここで粘れば名場面。倒れれば予定通り。',
    'HPが少ないと、言葉選びだけ慎重になります。',
    'だいぶ危ないです。敵側の実況も声が小さくなっています。',
    '私の残り体力より、君の集中力の方が多そうだ。',
    'ここで逆転できたら、タイトル画面を飾れるかもしれない。',
    '体力は少ないけど、負け惜しみはまだ豊富です。',
    'この状況、敵の研修ではかなり後半に習います。',
    'そろそろ倒れますが、倒れる方向だけ選ばせてください。',
    'まだ終わりではない。終わりにかなり近いだけです。',
    'HPバーが細くなると、妙に哲学的になります。',
    '勝ち筋が細い。かなり細い。糸くらい細い。',
    '残り体力が少ないと、敵にも言葉の重みが出ます。',
    'ここまで来たら、せめて名言っぽく散りたい。',
    'まだ戦えます。戦えるという表現には幅があります。',
    '体力が減ると、急に世界の解像度が上がります。',
    'ここで倒れたら予定通り。粘れたら奇跡です。',
    '最後の一粘りを見せたい。見せ場が短いかもしれない。',
    'ここまで追い込まれると、敵も急に素直になります。',
    'HPは少ないですが、負け惜しみにはまだ余白があります。',
    '強敵らしい雰囲気だけでも残しておきたい。',
    'かなり危ない。危ないというより、ほぼ説明がついている。',
    '終わりが近い時ほど、セリフが少し長くなります。',
    'この体力で踏ん張るのは、演出上かなり大事です。',
    'あと一撃が見えているのに、見えていないふりをしています。',
    'ここで粘ると、私にも少しだけ物語が生まれます。',
    '残りHPを見ると、急に優しい世界を信じたくなります。',
    'まだ倒れていないだけで、かなり説得力は失っています。',
    'ここからの一言一言が、ほぼ遺言のリハーサルです。',
    '体力が少ないので、強がりも省エネ運転です。',
    '逆転したい気持ちはあります。気持ちは無料なので。',
    'ここまで来ると、負ける覚悟にも品格が必要です。',
    'まだ粘ります。粘る以外の選択肢が見当たりません。',
  ],
  damaged: [
    'いたっ、今の正解は効いた！',
    'その一撃、ちゃんと入ってるよ。',
    'うわ、思ったより正確だね。',
    '今のタイピング、なかなか鋭い！',
    'ちょっと守りを固めないと。',
    'よく聞き取ったね。やるなあ。',
    'ダメージ確認、こっちが不利かも。',
    '一問ずつ削られてる感じがする。',
    'その調子で来られるとまずい！',
    '今のはきれいに決まったね。',
    '今の一撃、社内チャットなら既読スルーできない重さだ。',
    '痛い。しかも理不尽ではなく正当に痛い。',
    'こちらの防御、思ったより紙の資料だった。',
    'いまの正解、敵側の空気が一段冷えたよ。',
    'ダメージ音より、君の成長音の方が大きい。',
    'やるね。こちらの負け筋が急に鮮明になった。',
    'いまのは効いた。言い訳を探す時間をください。',
    'このダメージ、あとで経費精算できるかな。',
    '今の一撃で、私の将来設計が少し変わった。',
    '痛いけど、教育効果としては正しい痛みだ。',
    'その正解、こちらの存在を否定するには十分だった。',
    'ダメージより、君が成長している事実の方が刺さる。',
    'いまのは効いた。敵役の表情管理にも限界がある。',
    '防御していたつもりが、ただの願望だったみたいだ。',
    '今の一撃、きれいすぎて文句が言いづらい。',
    'ダメージ処理が追いつかないので、少し待ってください。',
    '痛い。しかも教育的に正しいのが余計につらい。',
    'その正解、こちらの自信をきちんと削ってきますね。',
    '今のは見事。敵としては認めたくないけど。',
    'ダメージを受けるたび、役作りが深まります。',
    'その一撃で、私の強敵感が少し薄まりました。',
    '痛みよりも、納得感があるのが困る。',
    'いまの正解、まっすぐ刺さりました。比喩ではなく。',
    'こちらの防御態勢、ただのポーズだった疑惑があります。',
    'その聞き取り、敵側の隠し味まで拾っています。',
    '今のタイピング、地味に容赦がない。',
    'ダメージを受けました。ついでに現実も見ました。',
    'やるじゃない。こちらの想定よりずっと早い。',
    '今のは避けたかった。気持ちだけは避けていました。',
    'この一撃、敵の昼休みに響きます。',
    'いい正解だね。こちらは全然よくないけど。',
    'ダメージログに残るタイプの一撃です。',
    '今ので少しだけ、悪役の夢から覚めました。',
    'その正確さ、こちらの演技プランを崩してくる。',
    '痛いけど、プレイヤーの成長としては美しい。',
    '今の一問で、こちらの勝率が静かに沈みました。',
    'その入力、敵の言い訳を封じる速度だった。',
    'ぐっ、今のは普通にうまい。',
    'ダメージ音が鳴る前に、心が先に負けました。',
    'その調子だと、私の台詞より先にHPが尽きる。',
    '正解のたびに、こちらの立場が説明しづらくなります。',
    '今の一撃、かなり業務に支障が出ています。',
    '今の正解、こちらの防御を丁寧に無視してきました。',
    '痛いのに、学習効果としては納得してしまう。',
    'その一撃で、私の強がりにひびが入りました。',
    '今のは避けるべきでした。あとからなら何とでも言えます。',
    '君の正解が、こちらの設定を少しずつ削っています。',
    'ダメージを受けるたび、敵役の奥行きが増します。',
    '今の入力、きれいすぎて逆に傷つく。',
    'こちらの守り、見た目ほど機能していませんでした。',
    'その一問で、だいぶ話が早くなりましたね。',
    '痛い。しかもかなりロジカルに痛い。',
    '今のは効いた。敵の余裕が一段階下がりました。',
    '正解が刺さるたび、こちらの演出が短縮されます。',
    '今のタイピング、まっすぐで逃げ道がない。',
    'その一撃、敵の強がりを黙らせるには十分です。',
    '今ので、こちらの余裕が音を立てずに消えました。',
    '正解の切れ味が良すぎて、反応が遅れました。',
    'その一撃、見た目より内側に来ますね。',
    '今のはきれいに入った。敵としては認めたくないけど。',
    'こちらの防御、気持ちだけ先行していました。',
    'そのダメージ、敵の午後の予定にも影響します。',
    '一問でここまで削られると、言葉も少し丁寧になります。',
  ],
  taunt: [
    'あれ、少しあわててる？',
    '落ち着けば聞こえるはずだよ。',
    'ミスしても、次で取り返せばいいんだよ。',
    '深呼吸してからもう一回！',
    '指だけ先に走ってない？',
    '耳で聞いて、頭で考えて、指で打つ！',
    'ここで崩れないのが大事だよ。',
    'まだまだ練習の途中だね。',
    '焦りはこっちの味方だよ。',
    'ゆっくり正確に、が一番こわいんだ。',
    '今のミスは見なかったことにしたいけど、システムは見ている。',
    '大丈夫、敵の私もよくタイプミスする。',
    '焦る気持ちはわかる。締切前の魔物だからね。',
    '落ち着いて。こっちも落ち着かれると困るけど。',
    'いまのは練習としてはおいしいミスだね。',
    'ミスを責めるより、次の一問で回収しよう。敵だけど。',
    'ここで慌てると、私の思うつぼという古典的展開になる。',
    '指が先に会議室を出ていった感じだったね。',
    'ミスは誰にでもある。敵としてはもう少しあってほしい。',
    'その入力、英語というより心の叫びに近かったよ。',
    '焦りは自然な反応です。こちらの営業成績にも貢献します。',
    '大丈夫、ミスをした瞬間だけ私の人生に意味が生まれる。',
    '落ち着いて。君が落ち着くと私は終わるけど。',
    '今のミス、敵側としては大変助かります。ありがとうございます。',
    'ミスは成長の材料です。敵としては主食です。',
    'いまの入力、勢いだけはラスボス級だったよ。',
    '焦りが見えました。こちらの小さな希望です。',
    '大丈夫、次で直せば物語としてはむしろ自然です。',
    '今のミスを責める気はないよ。少し喜んだだけです。',
    '落ち着けば聞こえる。落ち着かれると私が困る。',
    'ミスをした時こそ、敵の笑顔が不自然に増えます。',
    '指が先走ったね。心当たりは私にもあります。',
    'そのミス、こちらの延命措置として記録されました。',
    '焦ると英語も逃げます。敵は少し近づきます。',
    '今のは惜しい。惜しいは敵のごちそうです。',
    '一回ミスしたくらいで崩れないで。崩れるなら歓迎だけど。',
    '呼吸を整えよう。私も勝手に整えています。',
    '今の入力、やる気は伝わった。正解は別便だった。',
    'ミスが続くと、こちらの表情管理がゆるみます。',
    '落ち着いて打つだけでいい。言うのは簡単だね。',
    'その焦り、敵側の照明が少し明るくなるレベルです。',
    'ミスをした時ほど、次の正解が気持ちいいものです。敵は嫌です。',
    '今のは事故です。事故処理は次の一問で。',
    '焦りすぎると、キーボードもびっくりします。',
    'ここで立て直せると、だいぶ強い人です。',
    'ミスはログに残るけど、成長もちゃんと残ります。',
    '今の一回で、私の寿命が少し延びました。',
    '敵の私が言うのも何だけど、落ち着いた方が勝てます。',
    '急ぐほど遠回りになるタイプのステージです。',
    'そのミス、教材としては非常においしいです。',
    '大丈夫、まだ戦況は戻せる。戻されると私が困る。',
    '焦りを手放して、正解だけ拾っていこう。',
    'ミスは悪くない。敵に希望を与えるだけです。',
    '今のは惜しい。惜しさでこちらが少し延命しました。',
    '焦った時ほど、敵の存在感が少し増します。',
    '大丈夫、まだ取り返せる。取り返されたくはないけど。',
    'そのミス、練習としては価値が高い。敵としてもありがたい。',
    '落ち着くと正解に近づく。私からは言いたくない真実です。',
    'いま少しだけ、こちらに風が吹きました。微風です。',
    'ミスが出ると、敵の表情が少し明るくなります。',
    'その一回で決まるわけじゃない。だから次が大事です。',
    '指が迷ったね。敵としては良い迷路でした。',
    '焦りは誰にでもある。私にも退場前はあります。',
    'いまのミス、次の正解を気持ちよくする前振りです。',
    '落ち着いて打てば戻せる。戻されると私はつらい。',
    'ここで立て直せたら、かなり良い練習になります。',
    'ミスは小さな寄り道です。敵はその道で待っています。',
    '今の一回で焦らなければ、まだ全然強いです。',
    '惜しい入力でした。敵の私にはちょうどよかった。',
    'ここで深呼吸できる人は、だいたい後半で強い。',
    'ミスした後の一問目が、本当の勝負だったりします。',
    '焦ると音が遠くなるよ。敵の声だけ近くなるけど。',
    '今のミスは回収できます。私の喜びも短そうです。',
  ],
  defeat: [
    'やられたー！ でもいい勝負だったよ。',
    '今日は君の集中力の勝ちだね。',
    '次はもっと面白いセリフを用意してくるよ。',
    '見事なタイピングだったよ。',
    'くやしいけど、今のはきれいに決まった！',
    'また練習に来たら相手してあげる。',
    '一問ずつ積み上げた結果だね。',
    '負けたけど、なんだかうれしいぞ。',
    'その調子なら次の敵にも進めそうだよ。',
    '今日はここまで。先へ進んでいいよ！',
    '完敗です。敵役としては悔しいけど、教材としては満足です。',
    '今日のところは退勤します。お疲れさまでした。',
    '負けた理由は明確です。君がちゃんと練習したからです。',
    'これは敗北ではなく、学習効果の確認です。たぶん。',
    '見事でした。こちらは反省会という名の休憩に入ります。',
    '次に会う時までに、もう少し気の利いた負け方を考えておきます。',
    'やられたけど、ゲームとしてはかなり良い展開だったね。',
    'この負け方なら、敵側レビューでも星4くらいはもらえそう。',
    '負けました。なお、この敗北は仕様です。',
    '私の犠牲で英語力が伸びるなら、まあ成仏はできます。',
    '敗因は君の努力です。こちらに改善余地がないタイプの負けです。',
    'おめでとう。私の出番は短かったけど、意味はあったと思いたい。',
    '倒されたので、これから反省会という名の省エネモードに入ります。',
    '完敗です。敵としては終了、教材としては成功です。',
    '敗北しました。ですがセリフ数ではまだ戦えます。',
    '君の勝ちです。こちらは静かにアップデートを待ちます。',
    '倒されたので、今日の業務はここまでにしたいです。',
    '見事です。私は経験値として第二の人生を歩みます。',
    '負けたけど、君の上達に関われたなら悪くないです。',
    '今回の敗因は、相手がちゃんと聞いていたことです。',
    'やられました。しかも納得できる負け方です。',
    '私の防衛ラインは崩れましたが、君の英語力は積み上がりました。',
    '本日は閉店です。次の敵をご利用ください。',
    '完敗です。こちらの反省点は、相手を甘く見たことです。',
    '倒れる時くらい、良い練習相手だったと思われたい。',
    'この敗北、教材的にはかなり価値があります。',
    '君の勝ちです。私は背景設定に戻ります。',
    'お見事。敵の私から見ても気持ちいい決着でした。',
    '負けましたが、物語は進みます。私以外の物語が。',
    '今日はここまで。私のHPも勤務時間も終了です。',
    '倒されたので、次回はもう少し低姿勢で登場します。',
    '君の努力に負けました。これは悪い負けではないね。',
    '私の出番は終わり。君の練習はまだ続く。',
    '負け方としては上々です。強がり込みで。',
    'この負けを胸に、しばらく読み込み画面で休みます。',
    '次の敵に伝えておきます。かなり正確だった、と。',
    '敗北確認。敵側のプライドを安全にシャットダウンします。',
    '君の勝利です。こちらは効果音とともに退場します。',
    '見事に倒されました。演出としては満点です。',
    '今日は君の日でした。私はセーブデータの片隅に帰ります。',
    '負けたけど、ちゃんと練習した人に負けるのは悪くない。',
    'おめでとう。次の敵にもこの嫌な正確さを見せてあげて。',
    '倒されましたが、教育現場としては成功例です。',
    '私の負けで君が進むなら、まあ悪役冥利につきます。',
    '今回の敗北は、かなり納得度の高い敗北です。',
    'お見事。こちらの準備不足ではなく、君の練習不足ではなかった。',
    '敵の私から見ても、今の勝ちはきれいでした。',
    'これで私の役目は完了です。短い出番でした。',
    '負けました。次の敵には少し大げさに伝えておきます。',
    '君の勝ちです。私はしばらく静かな画面で反省します。',
    '今日の私は踏み台でした。踏み台としては悪くない仕事です。',
    'おめでとう。私のHPは減りましたが、君の自信は増えました。',
    '敗北です。敵側のコメントは以上です。',
    'よく倒しました。こちらは役目を終えて背景に溶けます。',
    'この勝利は保存しておきたいね。私は保存されなくていいけど。',
    '次もその調子で。敵としては言いたくないけど、本音です。',
    '倒されました。これで君の今日の練習が少し前に進みました。',
    '勝利おめでとう。こちらはきれいに役目を終えます。',
    '私を越えたなら、次の敵にもちゃんと届くはずです。',
    'やられました。負け惜しみを言う余白も少なめです。',
    '今日の君には、敵としてちょうどよく負けました。',
    'これで通行許可です。かなり力ずくの許可ですが。',
    'お見事。私は退場、君は前進です。',
  ],
};

const getNormalMonsterDialogueState = (options: {
  isDefeated: boolean;
  isDamaged: boolean;
  hpRate: number;
  combo: number;
  missCount: number;
}): MonsterDialogueState => {
  if (options.isDefeated) return 'defeat';
  if (options.combo >= 3) return 'combo';
  if (options.hpRate <= 0.2) return 'desperate';
  if (options.isDamaged) return 'damaged';
  if (options.missCount >= 2) return 'taunt';
  return 'start';
};

const getBossMonsterDialoguePool = (monster: Monster, state: MonsterDialogueState): string[] => {
  const bossLines: Record<MonsterDialogueState, string[]> = {
    start: [
      monster.dialogueStart,
      `${monster.name}「ここまで来たか。まずは、その継続力に拍手しておこう。」`,
      `${monster.name}「私はラスボスだ。つまり、倒されるために一番立派な場所をもらった者だ。」`,
      `${monster.name}「ここから先は小手先では通れない。まあ、私は小手先もけっこう好きだが。」`,
      `${monster.name}「練習の成果を見せてみろ。こちらも威厳だけは多めに用意してある。」`,
      `${monster.name}「ようこそ最終試験へ。なお、採点基準は私のHPで表示される。」`,
      `${monster.name}「ここまで来た君に敬意を表する。だからこそ、ちゃんと邪魔をする。」`,
      `${monster.name}「私は強敵だ。少なくとも登場演出はそう言っている。」`,
      `${monster.name}「ラスボスにも都合がある。できれば名勝負として記録されたい。」`,
      `${monster.name}「ここまでの敵とは違うぞ。セリフの重さだけでも違う。」`,
      `${monster.name}「さあ来い。私はボスらしく、少し長めにしゃべって待っている。」`,
      `${monster.name}「君の集中力が本物か、私のHPで確認してやろう。」`,
      `${monster.name}「このステージの最後に立つ者として、負け方にもこだわりたい。」`,
      `${monster.name}「裏側まで来たのか。物好きだな。嫌いではない。」`,
      `${monster.name}「ここからは趣味の領域だ。英語学習にも、たまに深淵がある。」`,
      `${monster.name}「最終決戦だ。まずは深呼吸しろ。私はその間に威圧感を調整する。」`,
    ],
    combo: [
      `${monster.name}「連続正解だと？ ラスボスの面目に少し傷がつくな。」`,
      `${monster.name}「そのコンボ、こちらの演出時間を削りに来ているな。」`,
      `${monster.name}「見事だ。だが、褒めすぎると私の立場がなくなる。」`,
      `${monster.name}「その集中、最終決戦に持ち込むには少々まぶしい。」`,
      `${monster.name}「コンボが続くたび、こちらの玉座が少し低くなる気がする。」`,
      `${monster.name}「速いな。ボス戦のBGMも少し焦っている。」`,
      `${monster.name}「このペースは危険だ。主に私の威厳が。」`,
      `${monster.name}「連続正解で押し切る気か。正攻法すぎて文句が言いづらい。」`,
      `${monster.name}「ふむ、ここまで鍛えてきた成果が出ているな。敵としては複雑だ。」`,
      `${monster.name}「コンボ表示が伸びるほど、私の負けイベント感が増していく。」`,
      `${monster.name}「そのリズム、ラスボスの沈黙を引き出すには十分だ。」`,
      `${monster.name}「やめろとは言わない。言っても止まらなそうだからな。」`,
    ],
    desperate: [
      `${monster.name}「ここまで追い込むとは。正直、少し予定より早い。」`,
      `${monster.name}「まだ終わらん。終わらんが、終わりの気配はかなり濃い。」`,
      `${monster.name}「ラスボスが残りHPを気にし始めたら、物語は終盤だ。」`,
      `${monster.name}「ここからが本番だ。ということにして、威厳を保っている。」`,
      `${monster.name}「あと少しで倒せると思ったか。だいたい合っている。」`,
      `${monster.name}「このHPで強がるのも、ボスの大事な仕事だ。」`,
      `${monster.name}「見事だ。だが私にも、最後のセリフを言う権利くらいはある。」`,
      `${monster.name}「ここまで来ると、玉座より保健室が恋しくなるな。」`,
      `${monster.name}「裏ボスらしく粘りたい。粘れるとは言っていない。」`,
      `${monster.name}「残りわずかか。ならば、せめて倒れ方だけは豪華にしよう。」`,
      `${monster.name}「この緊張感、教材としてはかなり良い。私としてはかなり悪い。」`,
      `${monster.name}「まだだ。ラスボスは最後に少しだけ話を引き延ばすものだ。」`,
    ],
    damaged: [
      `${monster.name}「ぐっ、今の一撃はラスボスにも普通に効く。」`,
      `${monster.name}「その正解、なかなか深いところを突いてくる。」`,
      `${monster.name}「痛いな。だが、努力の結果なら受け止めるしかない。」`,
      `${monster.name}「今のタイピング、最終決戦にふさわしい切れ味だ。」`,
      `${monster.name}「ダメージは受けたが、威厳はまだ半分くらい残っている。」`,
      `${monster.name}「いい一撃だ。こちらの演出担当が少し慌てている。」`,
      `${monster.name}「正確さで削られるのは、ラスボスとしても言い訳が難しい。」`,
      `${monster.name}「その聞き取り、闇の力より厄介だな。」`,
      `${monster.name}「今のは認めよう。認めたくないが、認めよう。」`,
      `${monster.name}「私の防御を抜くとは。つまり、ちゃんと練習してきたな。」`,
      `${monster.name}「一撃ごとに、君の成長がこちらのHPを説得してくる。」`,
      `${monster.name}「やるではないか。ボスとして少し笑ってしまったぞ。」`,
    ],
    taunt: [
      `${monster.name}「焦ったな。最終決戦では、焦りも立派な敵だ。」`,
      `${monster.name}「落ち着け。私を倒す前に、自分の指を倒してどうする。」`,
      `${monster.name}「ミスは悪ではない。だが、私には少し都合がいい。」`,
      `${monster.name}「ここで崩れるには惜しい。もう一度、音を聞け。」`,
      `${monster.name}「深呼吸だ。ラスボスが親切に言うのだから、かなり大事だ。」`,
      `${monster.name}「そのミス、私の寿命をほんの少し延ばしたな。」`,
      `${monster.name}「慌てるな。私は逃げない。逃げたい気持ちは少しある。」`,
      `${monster.name}「ここで立て直せる者だけが、最後まで進める。」`,
      `${monster.name}「指が先走ったな。勇者にも人間味がある。」`,
      `${monster.name}「よいミスだ。次の正解を強くする材料にしろ。」`,
      `${monster.name}「今の一回で終わりではない。むしろ、ここからだ。」`,
      `${monster.name}「落ち着いた君は厄介だ。だからこそ、落ち着け。」`,
    ],
    defeat: [
      monster.dialogueDefeat,
      `${monster.name}「見事だ。ラスボスとして、これ以上ない負け方だった。」`,
      `${monster.name}「私を越えたか。ならば胸を張れ。かなりちゃんと練習している。」`,
      `${monster.name}「敗北を認めよう。なお、セリフだけは少し長めに残す。」`,
      `${monster.name}「やるな。君の努力に、私の闇が普通に負けた。」`,
      `${monster.name}「ここまで来た者にだけ、この先の景色は開かれる。」`,
      `${monster.name}「完敗だ。だが、教材としては大成功だろう。」`,
      `${monster.name}「私の役目は終わった。君の英語修行は、まだ続く。」`,
      `${monster.name}「よくぞ倒した。次に会う時は、もう少し強がって登場しよう。」`,
      `${monster.name}「この敗北、悪くない。努力に負けるのは、敵としても納得できる。」`,
      `${monster.name}「最終決戦は君の勝ちだ。私は静かにエンドロール側へ行く。」`,
      `${monster.name}「裏まで踏破するとはな。正直、敵ながら少し嬉しいぞ。」`,
      `${monster.name}「勝者よ、進め。私はセーブデータの奥で反省しておく。」`,
      `${monster.name}「今日のところは君の勝ちだ。いや、かなり明確に君の勝ちだ。」`,
      `${monster.name}「見事だった。ラスボスの肩書きも、少し誇らしく散れる。」`,
      `${monster.name}「おめでとう。私を倒した事実は、ちゃんと自信にしていい。」`,
    ],
  };

  return uniqueLines(bossLines[state]);
};

const TITLE_MONSTER_TAUNTS = [
  'ここまで来たなら、次はぼくの番だね。',
  '準備できた？ こっちは少しだけ本気です。',
  '今日の集中力、ここで見せてもらおうかな。',
  '音をよく聞いて。あとは指が迷わなければ大丈夫。',
  '次の一戦、油断するとちょっと止まるよ。',
  'きみの正答率、こちらでも話題になっています。',
  '練習相手にしては、わりと本気で待っています。',
  'ここを通りたいなら、一問ずつ丁寧にどうぞ。',
  '今ならまだ引き返せるよ。まあ、来るんでしょ？',
  '今日のぼくは、負け方にもこだわる予定です。',
  '聞き取り勝負なら、まずは落ち着いた方が強いよ。',
  'ミスを誘う準備はできています。成功するかは別です。',
  'ここで止められたら敵として誇らしい。たぶん止められないけど。',
  'きみが強くなるほど、ぼくの勤務時間は短くなります。',
  '次の問題、耳と指のチームワークで来てみな。',
  '今日はどんな勝ち方をするのか、敵ながら少し気になります。',
  '正解を重ねたら道をあけます。悔しいけどルールです。',
  'ここで会ったのも何かの縁。まずは一問どうぞ。',
  'こちらの作戦はシンプルです。ちょっと邪魔します。',
  'ぼくを倒すころには、たぶん少し英語が強くなっています。',
  '挑戦ボタンを押したら、もう言い訳は聞こえません。',
  'きみの集中が続くか、ぼくのHPが続くか、勝負です。',
  '練習の成果、敵側にもちゃんと刺さります。',
  '次に会う時はバトル画面です。表情だけ作って待っています。',
  'ぼくは敵です。ですが、学習効果には協力的です。',
  'ここで止まるか、ここで伸びるか。敵としては前者を希望します。',
  'きみの集中力、だんだんこちらの業務リスクになってきました。',
  '挑戦前の静けさですね。ぼくのHPだけが先にざわついています。',
  'この一戦、勝てば英語力、負ければ経験値。どっちも教材側の勝ちです。',
  '正解できたら道を開けます。できれば少し悔しそうに開けます。',
  'きみが強くなるほど、ぼくの登場シーンは短くなります。',
  'まだ戦っていないのに、負け筋だけは見えてきました。',
  '挑発しているようで、実は緊張をほぐしています。敵なりの配慮です。',
  '今日の作戦は、きみの油断待ちです。受け身の戦略です。',
  'ここは通行止めです。英語ができる人だけ、なぜか通れます。',
  'ぼくを倒しても世界は救えません。でも単語は少し覚えます。',
  '次の敵はぼくです。名前だけでも覚えて帰ってください。',
  'きみのミスを待っています。言い方を変えると、かなり他力本願です。',
  '勝つ気はあります。勝てる気配は、まだ確認中です。',
  'ぼくの強みは待機時間の長さです。戦闘力とは別問題です。',
  'この画面で目が合った以上、次はバトルで会いましょう。',
  '今日は調子が良さそうですね。敵としては見なかったことにしたい。',
  '挑戦するなら今です。ぼくの覚悟が固まる前に。',
  '英語を聞いて、正確に打つ。それだけで敵はだいたい困ります。',
  'このあと倒される予定ですが、今だけは堂々としています。',
  '負ける前から言うのも何ですが、いい勝負にしましょう。',
  'ぼくのHPは数字ですが、削られる気持ちは本物です。',
  '敵側の立場で言うと、きみの継続はかなり迷惑です。',
  '練習を続ける人には勝ちにくい。これは敵界の常識です。',
  'このステージで止めたい。止めたいという気持ちだけは一流です。',
  'きみが勝ったら、ぼくは教材として胸を張れます。敵としては下を向きます。',
  '焦らず来てください。焦ってくれると、こちらは助かります。',
  'ここで一問ずつ積み上げる人が、だいたい一番こわいんです。',
  '見た目はかわいめでも、セリフには少しだけ毒を混ぜています。',
  'さあ、挑戦しますか。こちらは敗北時のコメントも準備済みです。',
  'この一戦、きみの集中力とぼくの強がりの勝負です。',
  '敵にもプライドがあります。だいたいHPより先に減ります。',
  '次のバトルで会いましょう。表情だけは強そうにしておきます。',
  '今のうちに深呼吸を。ぼくも今のうちに強敵ぶっておきます。',
  '努力は裏切らないそうです。敵としては裏切ってほしい日もあります。',
  'ここで勝てば気持ちいい。負けても教材としてはおいしい。ずるい仕組みです。',
  'ぼくの挑発で焦ったら成功。笑ったらそれも成功です。',
  'きみの努力は見えています。敵側の管理画面にもたぶん出ています。',
  '次の敵はぼくです。予約なしで挑戦できます。',
  '倒される未来が見えていても、敵は敵らしく立つものです。',
  '今日のぼくは少し強気です。まだ戦っていないので。',
  'きみがリロードしても、ぼくの不安はリロードされません。',
  'ここで待っている間に、だいぶ人生について考えました。',
  '挑戦する前から強そうですね。こちらは雰囲気で対抗します。',
  '英語を聞いて打つだけ。言うのは簡単、敵には残酷。',
  'ぼくを見て笑ったなら、もう半分勝っています。たぶん。',
  'この一戦、勝敗よりも継続がえらい。敵としては勝敗も気にします。',
  'ここを突破する鍵は正確さです。物理キーではありません。',
  'ぼくの作戦は、きみがうっかりするまで堂々と待つことです。',
  '練習してきた人の顔をしています。敵側では嫌な予感と呼びます。',
  '正答率が上がるほど、ぼくのセリフは負け惜しみに近づきます。',
  '挑戦ボタンを押す前に、こちらの強敵感を味わってください。',
  'ぼくは次の敵です。次の踏み台と言わないでください。',
  'ここで止められたら伝説です。伝説になれない予感もあります。',
  'きみの集中力が続くなら、ぼくの仕事は短時間勤務です。',
  'この画面でのぼくは強そうに見える。バトル後のことは知らない。',
  '油断してくれると助かります。敵が本音を言う時代です。',
  '聞き取りは耳の勝負。ぼくは横から雰囲気で邪魔します。',
  'この挑発文、効く人には効きます。効かない人は強いです。',
  '次に進みたいなら、ぼくを説得してください。タイピングで。',
  '英語力が上がると敵が困る。これがこの世界の経済です。',
  'ぼくはここで待っています。待つのも敵の大事な業務です。',
  'きみの一問目で、今日のぼくの運命がだいたい決まります。',
  '正解を重ねる人はこわい。派手さより継続がこわい。',
  '挑発しているけど、内心ではかなり様子を見ています。',
  'ぼくの名前を覚えたら、倒す時に少しだけ味が出ます。',
  'ここでの勝負は短い。でも記憶には少し残りたい。',
  '敵にも段取りがあります。まず強がる、次に削られる。',
  '今日の調子が良いなら、ぼくの調子は相対的に悪いです。',
  'このステージで会ったのも縁です。では、きっちり邪魔します。',
  'ぼくは敵ですが、学習ログ的には協力者です。',
  '挑戦前のきみはまだ無傷。ぼくの威厳もまだ無傷。',
  '英語学習に立ちはだかる壁です。壁にしてはよくしゃべります。',
  'ここで詰まっても大丈夫。詰まらないなら、ぼくが大丈夫じゃない。',
  'そのボタンを押すと始まります。ぼくの終わりも始まります。',
  'きみが強くなるのは良いことです。ぼくの立場以外は。',
  '本日の敵役を担当します。レビューは星多めでお願いします。',
  'ぼくを倒すと前に進めます。説明すると急に業務感が出ますね。',
  '聞き取れたら勝ち。聞き取れなければ、ぼくが少し長生きします。',
  'この挑発は無料です。バトルは集中力をいただきます。',
  '勝ちたいなら落ち着いて。ぼくは落ち着かれると困ります。',
  'まだ始まっていませんが、もう少しだけ強敵のふりをします。',
  'ぼくのHPは有限です。きみの練習意欲も有限なので、大切にどうぞ。',
  '一問ずつ来る人が一番こわい。派手な必殺技よりこわい。',
  '今日のきみが強いかどうか、ぼくの表情でだいたい分かります。',
  'ここで勝てば小さな達成感。ぼくには小さな敗北感。',
  '敵側の控室では、きみの継続力が少し問題視されています。',
  'ぼくはランダムに選ばれたセリフを言っています。人生みたいですね。',
  'この世界では、正確なタイピングがだいたい暴力です。',
  '挑戦を待っています。待つしかできないとも言います。',
  'きみが笑ってくれたら勝ちです。ぼくは負けるけど。',
  'ここで会った以上、次は正々堂々と削られます。',
  'ぼくの強さは未知数です。主にまだ戦っていないからです。',
  '今日の一問目、敵側もけっこう注目しています。',
  '落ち着いたプレイヤーほど、敵には静かに効きます。',
  'ぼくは止める役です。でも、進んでほしい気持ちも少しあります。',
  'この先に進むなら、まずはぼくのプライドを越えてください。',
  '勝てるかどうかは別として、負ける準備は整っています。',
  '練習を続ける人は地味に強い。敵としては本当に地味に困る。',
  'ぼくの挑発を読んでいる時点で、もう少しだけ世界観に入っています。',
  'この一戦で、きみの英語とぼくの威厳が同時に試されます。',
  '今日の敵はぼくです。明日の筋肉痛みたいに地味に残りたい。',
  '聞こえた音を信じて打つ。それでだいたいぼくは困ります。',
  '敵役としては、きみの成長に歯止めをかけたい。無理そうなら応援します。',
  'この画面では余裕があります。バトル画面では保証外です。',
  'ぼくのセリフにひるまないなら、もうかなり強いです。',
  '次のバトル、ぼくは本気です。と言うだけなら簡単です。',
  '挑戦前の沈黙が一番こわい。敵側も空気を読んでいます。',
  'ここで深呼吸できる人は、だいたい敵に嫌われます。',
  'ぼくを倒しても祝日は増えません。でも達成感は増えます。',
  '今日のきみの敵はぼく。ぼくの敵はきみの継続力です。',
  '挑発のつもりが、だんだん応援になってきました。',
  'ぼくの負けで君が少し伸びるなら、まあ悪くない仕事です。',
  'きみが強いほど、ぼくは短い出演時間で印象を残す必要があります。',
  'この先へ行きたいならどうぞ。止めますけど、形式上。',
  '英語の音を拾える人は、敵の弱音も拾いがちです。',
  'ぼくはここで待っています。HPと一緒に。',
  'きみの正確さが高いほど、ぼくの発言が軽くなります。',
  '挑戦ボタンの向こうで、ぼくの運命が小さく震えています。',
  '今日の練習量に比例して、ぼくの不安も増えています。',
  'ここで勝ったら次へ。負けたらもう一回。敵に休みはありません。',
  'ぼくは壁。きみは練習。だいたい練習が勝つ話です。',
  'このセリフが表示されたのも運命です。かなり小さめの運命です。',
  '正確に聞いて、正確に打つ。敵から見るとだいぶ嫌な攻略法です。',
  'きみの成長に拍手したい。敵なので小さめにしておきます。',
  '次の一戦、楽しみにしています。怖くないとは言っていません。',
];

const TITLE_BOSS_TAUNTS = [
  'ここから先は最終試験だ。深呼吸してから来い。',
  'ラスボスとして待っている。威厳は少し多めに用意した。',
  'ここまで来たなら、もう偶然ではない。実力を見せてみろ。',
  '最後の壁にも、倒される覚悟くらいはある。',
  'きみの集中力が本物か、私のHPで確かめよう。',
  '裏まで来るとは物好きだな。だが、嫌いではない。',
  'ここで勝てば物語が進む。私の出番は終わるがな。',
  '最終決戦の前に一つだけ言おう。落ち着いた者が強い。',
  '私を越えたければ、正確さで黙らせてみせろ。',
  'ラスボスにも都合はある。できれば名勝負にしてくれ。',
  'ここからは小手先では通れない。小手先も少しは有効だが。',
  'その努力、最後まで続くか見せてもらおう。',
  'ラスボスは最後に立つ者だ。つまり、最後に倒される係でもある。',
  'ここまで来た努力に敬意を表して、少しだけ大げさに待っている。',
  '君が挑むまで、私はこの威厳を維持しなければならない。意外と大変だ。',
  '最終決戦の空気を作っておいた。あとは君が正確に打つだけだ。',
  '私を倒せば物語は進む。私の予定は崩れる。',
  'ここはラスボス部屋だ。深呼吸と正確な入力以外は持ち込み禁止だ。',
  '君の努力が本物なら、私の威厳はかなり危ない。',
  '裏ボスとは、余った実力を試すための少し面倒な親切である。',
  '私は強い。少なくとも、そういうBGMが流れる予定だ。',
  'ここまで来た君に必要なのは勇気ではない。たぶん落ち着きだ。',
  '最終試験へようこそ。採点者は私、採点方法は私のHPだ。',
  '強がって待っているが、正確なタイピングには昔から弱い。',
  '私を倒す準備はできたか。私は倒される準備をまだ認めていない。',
  'ラスボスにも誇りがある。負ける時は、なるべく印象的に負けたい。',
  '君が勝てば達成感、私が勝てば再挑戦。どちらにせよ学習は続く。',
  'ここから先は集中力の領域だ。ついでに私の残業時間の領域でもある。',
  '努力してきた者ほど、ラスボスには嫌な相手になる。',
  '私の闇の力より、君の毎日の練習の方が地味に強い。',
  'ラスボスとして一言だけ言おう。焦るな。焦ると私が少し助かる。',
  'ここまで来たなら、もう偶然ではない。私の負けも偶然では済まなそうだ。',
  '最終決戦は派手に見えるが、勝敗はだいたい一文字ずつ決まる。',
  '裏まで来るとは見事だ。こちらも裏の顔で、少し余計にしゃべる。',
  '私は最後の壁だ。壁としては、やや話しすぎる自覚がある。',
  'この玉座、座り心地はいい。問題は、君が来ると長く座れないことだ。',
  'ラスボスの仕事は、最後に立って、最後に少し長くしゃべることだ。',
  '君が来るまで、この威厳を維持していた。そこも評価してほしい。',
  'ここまで来たなら、もう練習不足とは言わせない。私が言うのも変だが。',
  '最終決戦は派手に見える。だが勝敗はだいたい一問ずつ決まる。',
  '私を倒せば次へ進める。私は倒されるまで進めない。立場の差だな。',
  'ラスボスにも緊張はある。威厳で包んでいるだけだ。',
  'ここで焦れば私の勝ち。落ち着けば、だいぶ私が困る。',
  '君の努力が本物なら、私の玉座はかなり座り心地が悪くなる。',
  '最後の壁として立っている。壁にしては、少し話しすぎる。',
  '私の闇より、君の毎日の積み重ねの方が地味に厄介だ。',
  'この部屋のBGMが大げさなのは、私の不安を隠すためでもある。',
  '君が勝てば達成感。私が勝てば再挑戦。教育設計としては盤石だ。',
  '裏ボスとは、やり込んだ者にだけ現れる余計なおもてなしだ。',
  'ここまで来た者には敬意を払う。だから全力で邪魔をする。',
  '最終試験の採点方法は簡単だ。私のHPをゼロにすればよい。',
  'ラスボスは孤独だ。挑戦者が来ると嬉しいが、来ると困る。',
  '私を越える準備はできたか。私は越えられる準備を認めていない。',
  'この戦い、勝つのは君か、私の演出力か。',
  '一文字の正確さが、闇の軍勢より強いこともある。',
  '君が落ち着いているほど、私はラスボスらしく焦る。',
  '玉座から見ると、継続してきた者の目はなかなか怖い。',
  'この先へ進むなら、私の威厳を丁寧に削っていけ。',
  '私の敗北は物語の進行だ。分かっていても複雑だ。',
  'ラスボス戦では、勇気よりも聞き取り精度がものを言う。',
  '君の集中力が切れれば私の勝ち。切れなければ、かなり厳しい。',
  '私は最後の門番だ。門番にしては内心が騒がしい。',
  'ここまで来た努力に免じて、少しだけ本気で待っている。',
  '私を倒したら胸を張れ。ついでに私の出番は終わる。',
  '最終決戦の前に言っておく。ミスは誰にでもある。私にはありがたい。',
  '君が強くなるほど、私は名言っぽいことを言うしかなくなる。',
  'このステージの結末は、君の指先にかかっている。私の予定にもかかっている。',
  '裏まで来たなら、もう趣味の領域だ。嫌いではない。',
  '私の強さは本物だ。少なくとも自己申告では。',
  'この玉座は長く座るほど不安になる。挑戦者が強い日は特に。',
  '君が勝てば伝説。私が勝てば、もう一回練習。どちらも悪くない。',
  'ラスボスとしての誇りがある。負ける時も、なるべく美しく負けたい。',
  '最後の敵が一番強いとは限らない。一番よくしゃべる可能性は高い。',
  '君の努力を試す役目だ。できれば試しすぎずに終わりたい。',
  '私の闇の力は強大だが、毎日の練習には地味に弱い。',
  'ここで勝ったら、君は本当に前へ進める。私は画面外へ進む。',
  '最終決戦に必要なのは、集中、正確さ、そして少しの図太さだ。',
  '私を見て緊張するなら正常だ。緊張しても打てるなら強者だ。',
  'ラスボスは倒されるためにいる、などと言うな。事実でも言うな。',
  'ここまでの道のりを信じろ。私は信じられると困る。',
  'この戦いで必要なのは派手な奇跡ではない。静かな正解の積み重ねだ。',
  '私のセリフが長いのは、時間を稼いでいるわけではない。少しある。',
  '君の挑戦を待っていた。待っている間に少し不安になった。',
  'ここまで来た君なら分かるはずだ。ラスボスも結局、問題数で倒れる。',
  '裏ボスの私に会うとは、かなり物好きだ。最高の褒め言葉だ。',
  'この先に進む者は、だいたい私を過去形にしていく。',
  '私の威圧感は十分か。足りなければ、BGMを心の中で足してくれ。',
  '君が正確に打つたび、私の世界征服計画は校正されていく。',
  'ラスボスにも弱点はある。正確な入力と、まっすぐな努力だ。',
  '私は大きな壁だ。だが、壁は越えられるために描かれることもある。',
  '最終戦だからといって焦るな。焦りは私にとって数少ない味方だ。',
];

const getTitleMonsterTaunt = (monster: Monster, seedKey: string) => {
  const pool = monster.type === 'boss' ? TITLE_BOSS_TAUNTS : TITLE_MONSTER_TAUNTS;
  return pickStableLine(pool, `${monster.id}:title:${seedKey}`);
};

const getBattleBubbleDialogue = (
  monster: Monster,
  options: {
    isDefeated: boolean;
    isDamaged: boolean;
    hpRate: number;
    combo: number;
    missCount: number;
    seedKey: string;
  }
): string => {
  if (monster.type !== 'boss') {
    const state = getNormalMonsterDialogueState(options);
    return pickStableLine(
      NORMAL_MONSTER_DIALOGUES[state],
      `${monster.id}:${state}:${options.seedKey}`
    );
  }

  const state = getNormalMonsterDialogueState(options);
  return pickStableLine(
    getBossMonsterDialoguePool(monster, state),
    `${monster.id}:${state}:${options.seedKey}`
  ) || getMonsterBattleDialogue(monster, options);
};

const SOUND_BASE_PATH = `${import.meta.env.BASE_URL}sound/`;
const BGM_VOLUME_LEVELS = [0, 0.035, 0.06, 0.092, 0.125, 0.16] as const;
const SPEECH_VOICE_OPTIONS: { id: SpeechVoiceMode; label: string; description: string }[] = [
  { id: 'random', label: 'ランダム', description: '4種類の音声からランダム' },
  { id: 'us_female', label: '米語 女性', description: 'アメリカ英語の女性音声' },
  { id: 'us_male', label: '米語 男性', description: 'アメリカ英語の男性音声' },
  { id: 'uk_female', label: '英語 女性', description: 'イギリス英語の女性音声' },
  { id: 'uk_male', label: '英語 男性', description: 'イギリス英語の男性音声' },
];
const NON_RANDOM_SPEECH_VOICE_MODES: Exclude<SpeechVoiceMode, 'random'>[] = ['us_female', 'us_male', 'uk_female', 'uk_male'];
const EIKEN_DIFFICULTIES: Difficulty[] = ['Eiken5', 'Eiken4', 'EikenPre1'];
const DIFFICULTIES: Difficulty[] = [...EIKEN_DIFFICULTIES, 'Conversation'];
const LEVELS: Level[] = [1, 2, 3];
const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  Eiken5: '英検5級',
  Eiken4: '英検4級',
  EikenPre1: '英検準1級',
  Conversation: '英会話 はじめて',
};
const DIFFICULTY_SCORE_TAB_ACTIVE_CLASSES: Record<Difficulty, string> = {
  Eiken5: 'bg-blue-600 border-blue-400 text-white',
  Eiken4: 'bg-purple-600 border-purple-400 text-white',
  EikenPre1: 'bg-emerald-600 border-emerald-400 text-white',
  Conversation: 'bg-cyan-600 border-cyan-400 text-white',
};
const getAvailableLevels = (difficulty: Difficulty): Level[] => {
  void difficulty;
  return LEVELS;
};
const getSafeLevelForDifficulty = (difficulty: Difficulty, level: Level): Level => (
  getAvailableLevels(difficulty).includes(level) ? level : getAvailableLevels(difficulty)[0]
);
const FEMALE_VOICE_HINTS = ['female', 'woman', 'samantha', 'victoria', 'zira', 'ava', 'emma', 'susan', 'karen', 'moira', 'serena', 'libby', 'sonia', 'allison', 'anna', 'kathy', 'alice', 'fiona', 'sara', 'hazel', 'aria', 'jenny', 'joanna', 'salli', 'ivy', 'ruth', 'amy'];
const MALE_VOICE_HINTS = ['male', 'man', 'david', 'mark', 'daniel', 'alex', 'fred', 'tom', 'aaron', 'guy', 'arthur', 'andrew', 'brian', 'christopher', 'edward', 'george', 'james', 'jason', 'matthew', 'oliver', 'ryan', 'thomas', 'william', 'nathan', 'joey', 'roger', 'steffan', 'google uk english male', 'google us english male', 'microsoft david', 'microsoft mark', 'microsoft guy', 'guy online'];
const US_VOICE_HINTS = ['en-us', 'us', 'american', 'united states'];
const UK_VOICE_HINTS = ['en-gb', 'uk', 'british', 'england', 'great britain', 'united kingdom'];

const NORMAL_BATTLE_TRACKS = [
  `${SOUND_BASE_PATH}EnglishTyping001.mp3`,
  `${SOUND_BASE_PATH}EnglishTyping002.mp3`,
  `${SOUND_BASE_PATH}EnglishTyping003.mp3`,
  `${SOUND_BASE_PATH}EnglishTyping004.mp3`,
];

const BOSS_BATTLE_TRACKS = [
  `${SOUND_BASE_PATH}EnglishTyping005.mp3`,
  `${SOUND_BASE_PATH}EnglishTyping006.mp3`,
];
const EFFECT_SOUND_BASE_PATH = `${import.meta.env.BASE_URL}effect sound/`;
const DESIGN_ASSET_BASE_PATH = `${import.meta.env.BASE_URL}designs/`;
const DEFEAT_EFFECT_TRACKS = [
  `${EFFECT_SOUND_BASE_PATH}effectsound-defeat01.mp3`,
  `${EFFECT_SOUND_BASE_PATH}effectsound-defeat02.mp3`,
  `${EFFECT_SOUND_BASE_PATH}effectsound-defeat03.mp3`,
];
const BOSS_DEFEAT_EFFECT_TRACKS = [
  `${EFFECT_SOUND_BASE_PATH}effectsound-boss01.mp3`,
  `${EFFECT_SOUND_BASE_PATH}effectsound-boss02.mp3`,
];
const BOSS_COME_OUT_EFFECT_TRACKS = [
  `${EFFECT_SOUND_BASE_PATH}effectsound-boss-come-out-01.mp3`,
  `${EFFECT_SOUND_BASE_PATH}effectsound-boss-come-out-02.mp3`,
  `${EFFECT_SOUND_BASE_PATH}effectsound-boss-come-out-03.mp3`,
  `${EFFECT_SOUND_BASE_PATH}effectsound-boss-come-out-04.mp3`,
];
const LOSE_EFFECT_TRACKS = [
  `${EFFECT_SOUND_BASE_PATH}effectsound-lose01.mp3`,
  `${EFFECT_SOUND_BASE_PATH}effectsound-lose02.mp3`,
];
const EFFECT_SOUND_VOLUME = 0.45;

const SETTINGS_BGM_PREVIEW_TRACK = NORMAL_BATTLE_TRACKS[0];
const TITLE_LOGO_IMAGE = `${DESIGN_ASSET_BASE_PATH}title-logo-wide.png`;
const COURSE_SELECT_ILLUSTRATION_IMAGE = `${DESIGN_ASSET_BASE_PATH}course-select-pop.png`;
const SETTINGS_SPEECH_PREVIEW_TEXT = 'The brave hero learns English every day.';
const SPEECH_VOICE_COPY: Record<SpeechVoiceMode, { label: string; description: string }> = {
  random: {
    label: 'ランダム / Random',
    description: '4種類の英語音声からランダムで再生します。',
  },
  us_female: {
    label: '米語女性 / American Accent - Female',
    description: 'アメリカ英語の女性音声で再生します。',
  },
  us_male: {
    label: '米語男性 / American Accent - Male',
    description: 'アメリカ英語の男性音声で再生します。',
  },
  uk_female: {
    label: '英語女性 / British Accent - Female',
    description: 'イギリス英語の女性音声で再生します。',
  },
  uk_male: {
    label: '英語男性 / British Accent - Male',
    description: 'イギリス英語の男性音声で再生します。',
  },
};

let lastBattleMusicPath = '';

const getBattleMusicPath = (_mode: Mode, _inputMode: InputMode, isBoss: boolean): string => {
  const candidates = isBoss ? BOSS_BATTLE_TRACKS : NORMAL_BATTLE_TRACKS;
  const availableTracks = candidates.length > 1
    ? candidates.filter(track => track !== lastBattleMusicPath)
    : candidates;
  const nextTrack = availableTracks[Math.floor(Math.random() * availableTracks.length)];
  lastBattleMusicPath = nextTrack;
  return nextTrack;
};

const normalizeVoiceLang = (lang: string) => lang.toLowerCase().replace(/_/g, '-');

const normalizeVoiceText = (voice: SpeechSynthesisVoice) => (
  `${voice.name} ${voice.voiceURI} ${normalizeVoiceLang(voice.lang)}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
);

const matchesVoiceHint = (voice: SpeechSynthesisVoice, hints: string[]) => {
  const normalized = normalizeVoiceText(voice);
  const tokens = new Set(normalized.split(/\s+/));

  return hints.some(hint => {
    const normalizedHint = hint
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();

    if (!normalizedHint) return false;
    if (normalizedHint.includes(' ')) {
      return ` ${normalized} `.includes(` ${normalizedHint} `);
    }

    return tokens.has(normalizedHint);
  });
};

const isEnglishVoice = (voice: SpeechSynthesisVoice) => normalizeVoiceLang(voice.lang).startsWith('en');

const matchesVoiceLocale = (voice: SpeechSynthesisVoice, locale: 'en-us' | 'en-gb') => {
  const lang = normalizeVoiceLang(voice.lang);
  const localeHints = locale === 'en-us' ? US_VOICE_HINTS : UK_VOICE_HINTS;
  return lang === locale || lang.startsWith(`${locale}-`) || matchesVoiceHint(voice, localeHints);
};

const getSpeechLocale = (mode: Exclude<SpeechVoiceMode, 'random'>): 'en-US' | 'en-GB' => (
  mode.startsWith('us_') ? 'en-US' : 'en-GB'
);

const isExactSpeechModeSupported = (voices: SpeechSynthesisVoice[], mode: Exclude<SpeechVoiceMode, 'random'>) => {
  const locale = mode.startsWith('us_') ? 'en-us' : 'en-gb';
  const isFemaleMode = mode.endsWith('female');
  const localeVoices = voices.filter(voice => matchesVoiceLocale(voice, locale));

  if (localeVoices.length === 0) {
    return false;
  }

  if (isFemaleMode) {
    return localeVoices.some(voice => !matchesVoiceHint(voice, MALE_VOICE_HINTS));
  }

  return localeVoices.some(voice => (
    matchesVoiceHint(voice, MALE_VOICE_HINTS)
    && !matchesVoiceHint(voice, FEMALE_VOICE_HINTS)
  ));
};

const getSupportedSpeechModes = (voices: SpeechSynthesisVoice[]) => (
  NON_RANDOM_SPEECH_VOICE_MODES.filter(mode => isExactSpeechModeSupported(voices, mode))
);

const getBalancedRandomSpeechMode = (voices: SpeechSynthesisVoice[]): Exclude<SpeechVoiceMode, 'random'> => {
  const exactModes = getSupportedSpeechModes(voices);
  const usModes = exactModes.filter(mode => mode.startsWith('us_'));
  const ukModes = exactModes.filter(mode => mode.startsWith('uk_'));
  const availableLocaleGroups = [usModes, ukModes].filter(group => group.length > 0);

  if (availableLocaleGroups.length === 0) {
    return 'us_female';
  }

  const localeGroup = availableLocaleGroups[Math.floor(Math.random() * availableLocaleGroups.length)];
  return localeGroup[Math.floor(Math.random() * localeGroup.length)] ?? 'us_female';
};

const isSpeechModeSelectable = (voices: SpeechSynthesisVoice[], mode: SpeechVoiceMode) => (
  mode === 'random'
  || isExactSpeechModeSupported(voices, mode)
  || resolveSpeechConfig(voices, mode).resolution !== 'unresolved'
);

const matchesRequestedGender = (voice: SpeechSynthesisVoice, mode: Exclude<SpeechVoiceMode, 'random'>) => {
  const isFemaleMode = mode.endsWith('female');

  if (isFemaleMode) {
    return !matchesVoiceHint(voice, MALE_VOICE_HINTS);
  }

  return matchesVoiceHint(voice, MALE_VOICE_HINTS) && !matchesVoiceHint(voice, FEMALE_VOICE_HINTS);
};

const getVoiceMatchScore = (voice: SpeechSynthesisVoice, mode: Exclude<SpeechVoiceMode, 'random'>) => {
  const locale = mode.startsWith('us_') ? 'en-us' : 'en-gb';
  const isFemaleMode = mode.endsWith('female');
  const preferredHints = isFemaleMode ? FEMALE_VOICE_HINTS : MALE_VOICE_HINTS;
  const oppositeHints = isFemaleMode ? MALE_VOICE_HINTS : FEMALE_VOICE_HINTS;
  const preferredLocaleHints = locale === 'en-us' ? US_VOICE_HINTS : UK_VOICE_HINTS;
  const oppositeLocaleHints = locale === 'en-us' ? UK_VOICE_HINTS : US_VOICE_HINTS;
  const lang = normalizeVoiceLang(voice.lang);

  if (!lang.startsWith('en')) return -1_000;

  let score = 0;
  if (lang.startsWith(locale)) {
    score += 140;
  } else {
    score += 10;
  }

  if (matchesVoiceHint(voice, preferredLocaleHints)) {
    score += 45;
  }

  if (matchesVoiceHint(voice, oppositeLocaleHints)) {
    score -= 55;
  }

  if (matchesVoiceHint(voice, preferredHints)) {
    score += 50;
  }

  if (matchesVoiceHint(voice, oppositeHints)) {
    score -= 120;
  }

  if (voice.default) {
    score += 3;
  }

  return score;
};

const getStrictLocaleVoice = (voices: SpeechSynthesisVoice[], mode: Exclude<SpeechVoiceMode, 'random'>) => {
  const locale = mode.startsWith('us_') ? 'en-us' : 'en-gb';
  const isFemaleMode = mode.endsWith('female');
  const preferredHints = isFemaleMode ? FEMALE_VOICE_HINTS : MALE_VOICE_HINTS;
  const oppositeHints = isFemaleMode ? MALE_VOICE_HINTS : FEMALE_VOICE_HINTS;
  const localeVoices = voices.filter(voice => matchesVoiceLocale(voice, locale));

  if (localeVoices.length === 0) {
    return null;
  }

  const tiers = [
    (voice: SpeechSynthesisVoice) => matchesVoiceHint(voice, preferredHints) && !matchesVoiceHint(voice, oppositeHints),
    (voice: SpeechSynthesisVoice) => matchesVoiceHint(voice, preferredHints),
  ];

  for (const tier of tiers) {
    const candidates = localeVoices
      .filter(tier)
      .map(voice => ({ voice, score: getVoiceMatchScore(voice, mode) }))
      .sort((a, b) => b.score - a.score)
      .map(entry => entry.voice);

    if (candidates.length > 0) {
      return candidates[0];
    }
  }

  const fallbackCandidates = localeVoices
    .map(voice => ({ voice, score: getVoiceMatchScore(voice, mode) }))
    .sort((a, b) => b.score - a.score)
    .map(entry => entry.voice);

  return fallbackCandidates[0] ?? null;
};

const getGenderFallbackVoice = (voices: SpeechSynthesisVoice[], mode: Exclude<SpeechVoiceMode, 'random'>) => {
  const isFemaleMode = mode.endsWith('female');
  const preferredHints = isFemaleMode ? FEMALE_VOICE_HINTS : MALE_VOICE_HINTS;
  const oppositeHints = isFemaleMode ? MALE_VOICE_HINTS : FEMALE_VOICE_HINTS;
  const englishVoices = voices.filter(isEnglishVoice);
  const tiers = [
    (voice: SpeechSynthesisVoice) => matchesVoiceHint(voice, preferredHints) && !matchesVoiceHint(voice, oppositeHints),
    (voice: SpeechSynthesisVoice) => matchesVoiceHint(voice, preferredHints),
    (voice: SpeechSynthesisVoice) => !matchesVoiceHint(voice, oppositeHints),
  ];

  for (const tier of tiers) {
    const candidates = englishVoices
      .filter(tier)
      .map(voice => ({ voice, score: getVoiceMatchScore(voice, mode) }))
      .sort((a, b) => b.score - a.score)
      .map(entry => entry.voice);

    if (candidates.length > 0) {
      return candidates[0];
    }
  }

  return null;
};

const resolveSpeechConfig = (voices: SpeechSynthesisVoice[], mode: SpeechVoiceMode): ResolvedSpeechConfig => {
  const resolvedMode: Exclude<SpeechVoiceMode, 'random'> = mode === 'random'
    ? getBalancedRandomSpeechMode(voices)
    : mode;

  const lang = getSpeechLocale(resolvedMode);
  const localeVoice = getStrictLocaleVoice(voices, resolvedMode);
  const hasLocaleGenderMatch = localeVoice ? matchesRequestedGender(localeVoice, resolvedMode) : false;
  const genderFallbackVoice = hasLocaleGenderMatch ? null : getGenderFallbackVoice(voices, resolvedMode);
  const resolvedVoice = localeVoice && hasLocaleGenderMatch
    ? localeVoice
    : genderFallbackVoice ?? localeVoice;
  const resolution: ResolvedSpeechConfig['resolution'] = localeVoice && hasLocaleGenderMatch
    ? 'locale-gender'
    : genderFallbackVoice
      ? 'gender-fallback'
      : localeVoice
        ? 'locale-fallback'
        : 'unresolved';

  return {
    mode: resolvedMode,
    lang,
    voice: resolvedVoice,
    resolution,
  };
};

const speakText = (
  text: string,
  options?: {
    voice?: SpeechSynthesisVoice | null;
    rate?: number;
    lang?: string;
    interrupt?: boolean;
    onend?: () => void;
    onerror?: () => void;
  }
) => {
  if (options?.interrupt !== false) {
    // Cancel any ongoing speech to prevent queuing lag
    window.speechSynthesis.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options?.rate ?? 0.9;
  if (options?.voice) {
    utterance.voice = options.voice;
  }
  utterance.lang = options?.lang || options?.voice?.lang || 'en-US';
  utterance.onend = () => options?.onend?.();
  utterance.onerror = () => options?.onerror?.();

  window.speechSynthesis.speak(utterance);
};


// --- Sound Engine ---
class SoundEngine {
  private ctx: AudioContext | null = null;
  private ambienceOscillators: OscillatorNode[] = [];
  private ambienceGain: GainNode | null = null;
  private battleMusic: HTMLAudioElement | null = null;
  private battleMusicElements = new Set<HTMLAudioElement>();
  private disposedBattleMusicElements = new WeakSet<HTMLAudioElement>();
  private effectAudioElements = new Set<HTMLAudioElement>();
  private currentBattleMusicSrc = '';
  private battleMusicRequestId = 0;
  private previewMusic: HTMLAudioElement | null = null;
  private previewMusicTimeout: number | null = null;
  private previewMusicRequestId = 0;
  private lastDefeatEffectSrc = '';
  private lastBossDefeatEffectSrc = '';
  private lastLoseEffectSrc = '';
  private lastBossComeOutEffectSrc = '';

  constructor() {
    try {
      const AudioContext = window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof window.AudioContext }).webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = new AudioContext();
    } catch {
      console.error("Web Audio API not supported");
    }
  }

  playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1) {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playType() { this.playTone(800, 'square', 0.05, 0.05); }
  playMiss() { this.playTone(150, 'sawtooth', 0.3, 0.1); }
  
  playAttack() { 
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }
  
  playCritical() {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1600, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  private playRandomEffect(
    tracks: string[],
    volume: number,
    lastSrcKey: 'lastDefeatEffectSrc' | 'lastBossDefeatEffectSrc' | 'lastLoseEffectSrc' | 'lastBossComeOutEffectSrc',
  ) {
    if (tracks.length === 0) return;
    const availableTracks = tracks.length > 1
      ? tracks.filter(track => track !== this[lastSrcKey])
      : tracks;
    const selectedTrack = availableTracks[Math.floor(Math.random() * availableTracks.length)] ?? tracks[0];
    this[lastSrcKey] = selectedTrack;
    const audio = new Audio(selectedTrack);
    audio.preload = 'auto';
    audio.volume = volume;
    this.effectAudioElements.add(audio);
    const releaseAudio = () => {
      audio.pause();
      audio.currentTime = 0;
      this.effectAudioElements.delete(audio);
    };
    audio.addEventListener('ended', releaseAudio, { once: true });
    audio.addEventListener('error', () => {
      console.error('Effect sound failed to load:', selectedTrack, audio.error);
      releaseAudio();
    });
    audio.load();
    void audio.play().catch((error) => {
      console.error('Effect sound play failed:', selectedTrack, error);
      releaseAudio();
    });
  }

  playClear() {
    this.playRandomEffect(DEFEAT_EFFECT_TRACKS, EFFECT_SOUND_VOLUME, 'lastDefeatEffectSrc');
  }
  
  playStageClear() {
    this.playRandomEffect(BOSS_DEFEAT_EFFECT_TRACKS, EFFECT_SOUND_VOLUME, 'lastBossDefeatEffectSrc');
  }

  playFail() {
    this.playRandomEffect(LOSE_EFFECT_TRACKS, EFFECT_SOUND_VOLUME, 'lastLoseEffectSrc');
  }

  playBossComeOut() {
    this.playRandomEffect(BOSS_COME_OUT_EFFECT_TRACKS, EFFECT_SOUND_VOLUME, 'lastBossComeOutEffectSrc');
  }
  
  playNewRecord() {
    this.playRandomEffect(BOSS_DEFEAT_EFFECT_TRACKS, EFFECT_SOUND_VOLUME * 0.9, 'lastBossDefeatEffectSrc');
  }

  startBattleAmbience(isBoss: boolean = false) {
    if (!this.ctx) return;
    if (this.ambienceOscillators.length > 0) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(isBoss ? 0.018 : 0.012, this.ctx.currentTime + 0.8);
    gain.connect(this.ctx.destination);

    const baseFrequencies = isBoss ? [65.4, 98.0] : [130.8, 196.0];
    const oscillators = baseFrequencies.map((freq, index) => {
      const osc = this.ctx!.createOscillator();
      const oscGain = this.ctx!.createGain();
      osc.type = index === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);
      osc.frequency.linearRampToValueAtTime(freq * (isBoss ? 1.08 : 1.04), this.ctx!.currentTime + (isBoss ? 3.5 : 4.5));
      osc.frequency.linearRampToValueAtTime(freq, this.ctx!.currentTime + (isBoss ? 7 : 9));
      oscGain.gain.setValueAtTime(index === 0 ? 0.7 : 0.35, this.ctx!.currentTime);
      osc.connect(oscGain);
      oscGain.connect(gain);
      osc.start();
      return osc;
    });

    this.ambienceGain = gain;
    this.ambienceOscillators = oscillators;
  }

  stopBattleAmbience() {
    if (!this.ctx || !this.ambienceGain || this.ambienceOscillators.length === 0) return;

    const stopTime = this.ctx.currentTime + 0.6;
    this.ambienceGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.ambienceGain.gain.setValueAtTime(this.ambienceGain.gain.value, this.ctx.currentTime);
    this.ambienceGain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

    this.ambienceOscillators.forEach(osc => osc.stop(stopTime));
    this.ambienceOscillators = [];
    this.ambienceGain = null;
  }

  startBattleMusic(src: string, volume: number = 0.18) {
    this.stopBattleMusicPreview();

    if (this.currentBattleMusicSrc === src && this.battleMusic && this.battleMusicElements.size === 1) {
      this.battleMusic.volume = volume;
      void this.battleMusic.play().catch((error) => {
        console.error('Battle music replay failed:', src, error);
      });
      return;
    }

    this.stopBattleMusic();
    const requestId = ++this.battleMusicRequestId;

    const audio = new Audio();
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = volume;
    audio.src = src;
    this.battleMusicElements.add(audio);
    audio.onerror = () => {
      if (this.disposedBattleMusicElements.has(audio)) return;
      console.error('Battle music failed to load:', src, audio.error);
    };
    audio.oncanplaythrough = () => {
      if (this.disposedBattleMusicElements.has(audio) || this.battleMusic !== audio || this.battleMusicRequestId !== requestId) return;
      void audio.play().catch((error) => {
        if (this.disposedBattleMusicElements.has(audio) || this.battleMusic !== audio || this.battleMusicRequestId !== requestId) return;
        console.error('Battle music play after load failed:', src, error);
      });
    };
    this.battleMusic = audio;
    this.currentBattleMusicSrc = src;
    audio.load();
    void audio.play().catch((error) => {
      if (this.disposedBattleMusicElements.has(audio) || this.battleMusic !== audio || this.battleMusicRequestId !== requestId) return;
      console.error('Battle music initial play failed:', src, error);
    });
  }

  private disposeBattleMusicElement(audio: HTMLAudioElement) {
    this.disposedBattleMusicElements.add(audio);
    audio.oncanplaythrough = null;
    audio.onerror = null;
    audio.loop = false;
    audio.pause();
    audio.currentTime = 0;
    audio.removeAttribute('src');
    audio.load();
    this.battleMusicElements.delete(audio);
  }

  stopBattleMusic() {
    this.battleMusicRequestId += 1;
    if (this.battleMusicElements.size > 0) {
      Array.from(this.battleMusicElements).forEach(audio => this.disposeBattleMusicElement(audio));
    }
    this.battleMusic = null;
    this.currentBattleMusicSrc = '';
  }

  setBattleMusicVolume(volume: number) {
    if (!this.battleMusic) return;
    this.battleMusic.volume = volume;
  }

  playBattleMusicPreview(src: string, volume: number = 0.18, durationMs: number = 2200) {
    this.stopBattleMusicPreview();
    const requestId = ++this.previewMusicRequestId;

    const audio = new Audio(src);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = volume;
    audio.src = src;
    audio.onerror = () => {
      console.error('Battle music preview failed to load:', src, audio.error);
    };
    audio.oncanplaythrough = () => {
      if (this.previewMusic !== audio || this.previewMusicRequestId !== requestId) return;
      void audio.play().catch((error) => {
        console.error('Battle music preview play after load failed:', src, error);
      });
    };

    this.previewMusic = audio;
    this.previewMusicTimeout = window.setTimeout(() => {
      this.stopBattleMusicPreview();
    }, durationMs);

    audio.load();
    void audio.play().catch((error) => {
      console.error('Battle music preview initial play failed:', src, error);
    });
  }

  stopBattleMusicPreview() {
    this.previewMusicRequestId += 1;
    if (this.previewMusicTimeout !== null) {
      window.clearTimeout(this.previewMusicTimeout);
      this.previewMusicTimeout = null;
    }
    if (!this.previewMusic) return;
    this.previewMusic.oncanplaythrough = null;
    this.previewMusic.onerror = null;
    this.previewMusic.pause();
    this.previewMusic.currentTime = 0;
    this.previewMusic.removeAttribute('src');
    this.previewMusic.load();
    this.previewMusic = null;
  }
}
const soundEngine = new SoundEngine();

const STORAGE_KEYS = {
  defeatedMonsters: 'etyping_defeated_monsters',
  bestScores: 'etyping_best_scores',
  maxKeystrokes: 'etyping_max_keystrokes',
  weakQuestions: 'etyping_weak_questions',
  weakQuestionStats: 'etyping_weak_question_stats',
  manualQuestionStatuses: 'etyping_manual_question_statuses',
  reviewQueue: 'etyping_review_queue',
  dailyProgress: 'etyping_daily_progress',
  bgmVolumeLevel: 'etyping_bgm_volume_level',
  speechVoiceMode: 'etyping_speech_voice_mode',
  speechRatePercent: 'etyping_speech_rate_percent',
  translationBattleCorrectSpeechEnabled: 'etyping_translation_battle_correct_speech_enabled',
  autoPlaySettings: 'etyping_auto_play_settings',
  selectedQuestionKeysByScope: 'etyping_selected_question_keys_by_scope',
  markedQuestionKeysByScope: 'etyping_marked_question_keys_by_scope',
  savedSelectionLists: 'etyping_saved_selection_lists',
  versusBestScores: 'etyping_versus_best_scores',
  versusRankings: 'etyping_versus_rankings',
  playerProfiles: 'etyping_player_profiles',
  activePlayerId: 'etyping_active_player_id',
  lastSelectedCourse: 'etyping_last_selected_course',
  beginnerBattleProgress: 'etyping_beginner_battle_progress',
} as const;

const safeLoadJson = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) as T : fallback;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
};

const normalizeVersusRankings = (value: unknown): Record<string, VersusRankingEntry[]> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.entries(value as Record<string, unknown>).reduce<Record<string, VersusRankingEntry[]>>((rankings, [key, entries]) => {
    if (!Array.isArray(entries)) return rankings;
    const validEntries = entries.flatMap((entry): VersusRankingEntry[] => {
      if (!entry || typeof entry !== 'object') return [];
      const candidate = entry as Partial<VersusRankingEntry>;
      const { name, score, perfectCount, missCount, totalTimeMs, recordedAt } = candidate;
      if (typeof name !== 'string' || typeof score !== 'number' || typeof perfectCount !== 'number' || typeof missCount !== 'number' || typeof totalTimeMs !== 'number' || typeof recordedAt !== 'number' || !Number.isFinite(score) || !Number.isFinite(perfectCount) || !Number.isFinite(missCount) || !Number.isFinite(totalTimeMs) || !Number.isFinite(recordedAt)) return [];
      return [{
        name: name.slice(0, 20),
        score: Math.max(0, Math.round(score)),
        perfectCount: Math.max(0, Math.round(perfectCount)),
        missCount: Math.max(0, Math.round(missCount)),
        totalTimeMs: Math.max(0, Math.round(totalTimeMs)),
        recordedAt: Math.max(0, Math.round(recordedAt)),
      }];
    });
    if (validEntries.length > 0) rankings[key] = validEntries;
    return rankings;
  }, {});
};

type StoredCourseSelection = {
  difficulty: Difficulty;
  level: Level;
  resumeMode: Extract<Mode, 'guide' | 'challenge'>;
  resumeInputMode: InputMode;
};

const getStoredCourseSelection = (): StoredCourseSelection => {
  const saved = safeLoadJson<Partial<StoredCourseSelection>>(STORAGE_KEYS.lastSelectedCourse, {});
  const difficulty = DIFFICULTIES.includes(saved.difficulty as Difficulty)
    ? saved.difficulty as Difficulty
    : 'Eiken5';
  const requestedLevel: Level = saved.level === 1 || saved.level === 2 || saved.level === 3
    ? saved.level
    : 1;
  const resumeMode: Extract<Mode, 'guide' | 'challenge'> = saved.resumeMode === 'guide'
    ? 'guide'
    : 'challenge';
  const resumeInputMode: InputMode = resumeMode === 'guide'
    ? 'voice-text'
    : saved.resumeInputMode === 'voice-only' || saved.resumeInputMode === 'text-only'
      ? saved.resumeInputMode
      : 'voice-text';

  return {
    difficulty,
    level: getSafeLevelForDifficulty(difficulty, requestedLevel),
    resumeMode,
    resumeInputMode,
  };
};

const getTodayKey = () => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Tokyo',
}).format(new Date());

const createDailyProgress = (date: string = getTodayKey()): DailyProgress => ({
  date,
  questionCount: 0,
});

const getReviewScopeKey = (difficulty: Difficulty, level: Level) => `${difficulty}:${level}`;

const resolveLegacyReviewScope = (question: Question): { difficulty: Difficulty; level: Level } | null => {
  const matches = DIFFICULTIES.flatMap(difficulty => (
    getAvailableLevels(difficulty).flatMap(level => {
      const hasMatch = (QUESTIONS[difficulty]?.[level] ?? []).some(candidate => (
        candidate.text === question.text && candidate.translation === question.translation
      ));
      return hasMatch ? [{ difficulty, level }] : [];
    })
  ));

  return matches.length === 1 ? matches[0] : null;
};

const getDefaultWeakQuestionStat = (): WeakQuestionStat => ({
  missCount: 0,
  lastMissedAt: 0,
  consecutiveCorrect: 0,
});

const getDefaultAutoPlaySettings = (): AutoPlaySettings => ({
  source: 'all',
  playText: true,
  playTranslation: true,
  playExample: true,
  sequenceMode: 'normal',
  repeat: false,
  shuffle: false,
  playbackRatePercent: 100,
  itemGapSeconds: 0.5,
  questionGapSeconds: 1.5,
});

const AUTO_PLAY_RATE_OPTIONS = [75, 100, 125, 150, 175, 200] as const;
const MIN_AUTO_PLAY_ITEM_GAP_SECONDS = 0.2;
const MIN_AUTO_PLAY_QUESTION_GAP_SECONDS = 0.5;
const DEFAULT_QUESTION_LIST_RENDER_LIMIT = 260;
const COMPACT_QUESTION_LIST_RENDER_LIMIT = 160;

const DEFAULT_MANUAL_QUESTION_STATUS: ManualQuestionStatus = {
  practiceLevel: 1,
  battleLevel: 1,
  manualOverrideLevel: null,
  excluded: false,
  updatedAt: 0,
  learningLevel: 1,
};

const getDefaultManualQuestionStatus = (): ManualQuestionStatus => DEFAULT_MANUAL_QUESTION_STATUS;

const shuffleQuestions = <T,>(items: T[]) => {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
};

const normalizeManualQuestionStatuses = (statuses: Record<string, ManualQuestionStatus> | unknown) => (
  Object.fromEntries(
    Object.entries(typeof statuses === 'object' && statuses !== null ? statuses : {}).map(([key, value]) => [
      key,
      withDerivedLearningLevel({
        practiceLevel: LEARNING_LEVELS.includes(value?.practiceLevel as LearningLevel)
          ? value.practiceLevel as LearningLevel
          : LEARNING_LEVELS.includes(value?.learningLevel as LearningLevel)
            ? value.learningLevel as LearningLevel
            : 1,
        battleLevel: LEARNING_LEVELS.includes(value?.battleLevel as LearningLevel)
          ? value.battleLevel as LearningLevel
          : 1,
        manualOverrideLevel: value?.manualOverrideLevel === null
          ? null
          : LEARNING_LEVELS.includes(value?.manualOverrideLevel as LearningLevel)
            ? value.manualOverrideLevel as LearningLevel
            : null,
        excluded: !!value?.excluded,
        updatedAt: Number.isFinite(value?.updatedAt) ? value.updatedAt : 0,
      }),
    ])
  ) as Record<string, ManualQuestionStatus>
);

const getQuestionStatusKey = (difficulty: Difficulty, level: Level, question: Question) => (
  `${difficulty}:${level}:${question.text}:${question.translation}`
);

const normalizeSelectedQuestionKeysByScope = (value: unknown) => (
  Object.fromEntries(
    Object.entries(typeof value === 'object' && value !== null ? value : {}).map(([key, item]) => [
      key,
      Array.isArray(item)
        ? item.filter((entry): entry is string => typeof entry === 'string')
        : [],
    ])
  ) as Record<string, string[]>
);

const normalizeSavedSelectionLists = (value: unknown): SavedSelectionList[] => (
  Array.isArray(value)
    ? value.flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const typedItem = item as Partial<SavedSelectionList> & Record<string, unknown>;
      const difficulty = typedItem.difficulty;
      const level = typedItem.level;
      if (!DIFFICULTIES.includes(difficulty as Difficulty)) return [];
      if (![1, 2, 3].includes(level as number)) return [];

      return [{
        id: typeof typedItem.id === 'string' && typedItem.id.length > 0 ? typedItem.id : `${difficulty}:${level}:${Date.now()}`,
        name: typeof typedItem.name === 'string' && typedItem.name.trim().length > 0 ? typedItem.name.trim() : '保存リスト',
        difficulty: difficulty as Difficulty,
        level: level as Level,
        questionKeys: Array.isArray(typedItem.questionKeys)
          ? typedItem.questionKeys.filter((entry: unknown): entry is string => typeof entry === 'string')
          : [],
        updatedAt: Number.isFinite(typedItem.updatedAt) ? Number(typedItem.updatedAt) : 0,
      }];
    })
    : []
);

const normalizeAutoPlaySettings = (value: unknown): AutoPlaySettings => {
  const defaults = getDefaultAutoPlaySettings();
  if (!value || typeof value !== 'object') return defaults;
  const typedValue = value as Partial<AutoPlaySettings> & Record<string, unknown>;
  const normalizedSource: AutoPlaySource = typedValue.source === 'all' || typedValue.source === 'weak' || typedValue.source === 'marked' || typedValue.source === 'selected'
    ? typedValue.source
    : defaults.source;
  const normalizedSequenceMode: AutoPlaySequenceMode = typedValue.sequenceMode === 'normal' || typedValue.sequenceMode === 'exampleFirst' || typedValue.sequenceMode === 'exampleTextExample'
    ? typedValue.sequenceMode
    : defaults.sequenceMode;

  return {
    source: normalizedSource,
    playText: typeof typedValue.playText === 'boolean' ? typedValue.playText : defaults.playText,
    playTranslation: typeof typedValue.playTranslation === 'boolean' ? typedValue.playTranslation : defaults.playTranslation,
    playExample: typeof typedValue.playExample === 'boolean' ? typedValue.playExample : defaults.playExample,
    sequenceMode: normalizedSequenceMode,
    repeat: typeof typedValue.repeat === 'boolean' ? typedValue.repeat : defaults.repeat,
    shuffle: typeof typedValue.shuffle === 'boolean' ? typedValue.shuffle : defaults.shuffle,
    playbackRatePercent: Number.isFinite(typedValue.playbackRatePercent) ? Math.min(250, Math.max(50, Number(typedValue.playbackRatePercent))) : defaults.playbackRatePercent,
    itemGapSeconds: Number.isFinite(typedValue.itemGapSeconds) ? Math.min(10, Math.max(0, Number(typedValue.itemGapSeconds))) : defaults.itemGapSeconds,
    questionGapSeconds: Number.isFinite(typedValue.questionGapSeconds) ? Math.min(15, Math.max(0, Number(typedValue.questionGapSeconds))) : defaults.questionGapSeconds,
  };
};

const getEffectiveLearningLevel = (status: ManualQuestionStatus): LearningLevel => (
  status.manualOverrideLevel ?? status.battleLevel
);

const withDerivedLearningLevel = (status: ManualQuestionStatus): ManualQuestionStatus => ({
  ...status,
  learningLevel: getEffectiveLearningLevel(status),
});

const normalizeWeakQuestionStats = (stats: Record<string, WeakQuestionStat>) => (
  Object.fromEntries(
    Object.entries(stats).map(([key, value]) => [
      key,
      {
        missCount: Number.isFinite(value?.missCount) ? value.missCount : 0,
        lastMissedAt: Number.isFinite(value?.lastMissedAt) ? value.lastMissedAt : 0,
        consecutiveCorrect: Number.isFinite(value?.consecutiveCorrect) ? value.consecutiveCorrect : 0,
      },
    ])
  ) as Record<string, WeakQuestionStat>
);

const normalizeReviewQueue = (entries: ReviewQueueEntry[] | unknown) => (
  (Array.isArray(entries) ? entries : [])
    .map(entry => {
      if (!entry?.question?.text || !entry?.question?.translation) return null;

      const resolvedScope =
        (DIFFICULTIES.includes(entry.difficulty) && getAvailableLevels(entry.difficulty as Difficulty).includes(entry.level as Level))
          ? { difficulty: entry.difficulty as Difficulty, level: entry.level as Level }
          : resolveLegacyReviewScope(entry.question);

      if (!resolvedScope) return null;

      return {
        difficulty: resolvedScope.difficulty,
        level: resolvedScope.level,
        question: entry.question,
        remainingQuestions: Number.isFinite(entry.remainingQuestions) ? Math.max(0, entry.remainingQuestions) : 0,
        missCount: Number.isFinite(entry.missCount) ? Math.max(1, entry.missCount) : 1,
      };
    })
    .filter((entry): entry is ReviewQueueEntry => entry !== null)
);

const normalizeDailyProgress = (value: unknown): DailyProgress => {
  const todayKey = getTodayKey();
  if (!value || typeof value !== 'object') return createDailyProgress(todayKey);

  const typedValue = value as Partial<DailyProgress>;
  const date = typeof typedValue.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(typedValue.date)
    ? typedValue.date
    : todayKey;
  const questionCount = Number.isFinite(typedValue.questionCount) ? Math.max(0, Number(typedValue.questionCount)) : 0;

  return { date, questionCount };
};

const normalizeQuestionArray = (value: unknown): Question[] => (
  Array.isArray(value)
    ? value.flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const typedItem = item as Partial<Question>;
      if (typeof typedItem.text !== 'string' || typeof typedItem.translation !== 'string') return [];

      const nextQuestion: Question = {
        text: typedItem.text,
        translation: typedItem.translation,
      };

      if (typeof typedItem.basicMeaning === 'string' && typedItem.basicMeaning.trim()) {
        nextQuestion.basicMeaning = typedItem.basicMeaning.trim();
      }
      if (typeof typedItem.exampleEn === 'string' && typedItem.exampleEn.trim()) {
        nextQuestion.exampleEn = typedItem.exampleEn.trim();
      }
      if (typeof typedItem.exampleJa === 'string' && typedItem.exampleJa.trim()) {
        nextQuestion.exampleJa = typedItem.exampleJa.trim();
      }
      if (Array.isArray(typedItem.synonyms)) {
        const synonyms = typedItem.synonyms
          .filter((synonym): synonym is string => typeof synonym === 'string')
          .map(synonym => synonym.trim())
          .filter(Boolean)
          .slice(0, 3);
        if (synonyms.length > 0) {
          nextQuestion.synonyms = synonyms;
        }
      }

      return [nextQuestion];
    })
    : []
);

const normalizePlayerProfileData = (value: unknown): PlayerProfileData => {
  const typedValue = typeof value === 'object' && value !== null ? value as Partial<PlayerProfileData> : {};

  return {
    defeatedMonsterIds: normalizeDefeatedMonsterIds(typedValue.defeatedMonsterIds ?? []),
    bestScores: normalizeBestScores(typedValue.bestScores ?? {}),
    maxKeystrokes: normalizeMaxKeystrokes(typedValue.maxKeystrokes),
    weakQuestions: normalizeQuestionArray(typedValue.weakQuestions ?? []),
    weakQuestionStats: normalizeWeakQuestionStats(typedValue.weakQuestionStats ?? {}),
    manualQuestionStatuses: normalizeManualQuestionStatuses(typedValue.manualQuestionStatuses ?? {}),
    reviewQueue: normalizeReviewQueue(typedValue.reviewQueue ?? []),
    dailyProgress: normalizeDailyProgress(typedValue.dailyProgress ?? createDailyProgress()),
    bgmVolumeLevel: normalizeBgmVolumeLevel(typedValue.bgmVolumeLevel),
    speechVoiceMode: normalizeSpeechVoiceMode(typedValue.speechVoiceMode),
    speechRatePercent: normalizeSpeechRatePercent(typedValue.speechRatePercent),
    translationBattleCorrectSpeechEnabled: typeof typedValue.translationBattleCorrectSpeechEnabled === 'boolean' ? typedValue.translationBattleCorrectSpeechEnabled : true,
    autoPlaySettings: normalizeAutoPlaySettings(typedValue.autoPlaySettings ?? getDefaultAutoPlaySettings()),
    selectedQuestionKeysByScope: normalizeSelectedQuestionKeysByScope(typedValue.selectedQuestionKeysByScope ?? {}),
    markedQuestionKeysByScope: normalizeSelectedQuestionKeysByScope(typedValue.markedQuestionKeysByScope ?? {}),
    savedSelectionLists: normalizeSavedSelectionLists(typedValue.savedSelectionLists ?? []),
  };
};

const normalizePlayerProfiles = (value: unknown): PlayerProfile[] => (
  Array.isArray(value)
    ? value.flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const typedItem = item as Partial<PlayerProfile>;
      if (typeof typedItem.id !== 'string' || typedItem.id.trim().length === 0) return [];

      return [{
        id: typedItem.id,
        name: typeof typedItem.name === 'string' && typedItem.name.trim().length > 0 ? typedItem.name.trim() : 'Player',
        updatedAt: Number.isFinite(typedItem.updatedAt) ? Number(typedItem.updatedAt) : 0,
        data: normalizePlayerProfileData(typedItem.data ?? {}),
      }];
    })
    : []
);

const normalizeBestScores = (value: unknown): Record<string, number> => (
  Object.fromEntries(
    Object.entries(typeof value === 'object' && value !== null ? value : {}).flatMap(([key, score]) => (
      Number.isFinite(score) ? [[key, Math.max(0, Number(score))]] : []
    ))
  )
);

const normalizeMaxKeystrokes = (value: unknown): number => (
  Number.isFinite(value) ? Math.max(0, Number(value)) : 0
);

const normalizeBgmVolumeLevel = (value: unknown): number => (
  Number.isFinite(value) && Number(value) >= 0 && Number(value) < BGM_VOLUME_LEVELS.length
    ? Number(value)
    : 3
);

const normalizeSpeechVoiceMode = (value: unknown): SpeechVoiceMode => (
  SPEECH_VOICE_OPTIONS.some((option) => option.id === value)
    ? value as SpeechVoiceMode
    : 'us_female'
);

const normalizeSpeechRatePercent = (value: unknown): number => (
  Number.isFinite(value) ? Math.min(250, Math.max(50, Number(value))) : 100
);

const isProgressExportPayload = (value: unknown): value is ProgressExportPayload => {
  if (!value || typeof value !== 'object') return false;
  const typedValue = value as Partial<ProgressExportPayload>;
  return typedValue.app === 'english-typing-rpg'
    && typeof typedValue.formatVersion === 'number'
    && typedValue.formatVersion >= 1
    && typeof typedValue.exportedAt === 'string'
    && (
      (!!typedValue.player && typeof typedValue.player === 'object' && typeof typedValue.player.id === 'string')
      || (!!typedValue.data && typeof typedValue.data === 'object')
    );
};

const MONSTER_VISUALS: Partial<Record<string, MonsterVisualStyle>> = {
  m1_1: { primary: 'halo', secondary: 'orbital', accentColor: '#FDE68A', eyeColor: '#0F172A' },
  m1_2: { primary: 'mimic', secondary: 'runes', accentColor: '#86EFAC', eyeColor: '#DCFCE7' },
  m1_3: { primary: 'flare', secondary: 'halo', accentColor: '#FACC15', eyeColor: '#FEF3C7' },
  m1_4: { primary: 'horns', secondary: 'spikes', accentColor: '#FDBA74', eyeColor: '#7C2D12' },
  m1_5: { primary: 'halo', accentColor: '#FFD1F3' },
  m1_6: { primary: 'crystal', secondary: 'orbital', accentColor: '#BFDBFE', eyeColor: '#E0F2FE' },
  m1_7: { primary: 'mask', secondary: 'runes', accentColor: '#D1D5DB', eyeColor: '#F8FAFC' },
  m1_8: { primary: 'crown', secondary: 'cape', accentColor: '#F59E0B', eyeColor: '#FEF3C7' },
  m1_9: { primary: 'mimic', secondary: 'runes', accentColor: '#FCD34D' },
  m1_10: { primary: 'crown', secondary: 'sigil', accentColor: '#FBBF24', eyeColor: '#FFE066', silhouette: 'wyvern' },
  c1_1: { primary: 'runes', accentColor: '#A78BFA', eyeColor: '#C4B5FD' },
  c1_2: { primary: 'horns', secondary: 'spikes', accentColor: '#FCA5A5' },
  c1_3: { primary: 'halo', secondary: 'flare', accentColor: '#67E8F9', eyeColor: '#ECFEFF' },
  c1_4: { primary: 'mask', secondary: 'halo', accentColor: '#E9D5FF' },
  c1_5: { primary: 'spikes', secondary: 'orbital', accentColor: '#94A3B8', eyeColor: '#7DD3FC' },
  c1_6: { primary: 'crystal', secondary: 'runes', accentColor: '#D6D3D1', eyeColor: '#FEF3C7' },
  c1_8: { primary: 'horns', secondary: 'flare', accentColor: '#FCA5A5', eyeColor: '#FEE2E2' },
  c1_9: { primary: 'mask', secondary: 'orbital', accentColor: '#A78BFA', eyeColor: '#DDD6FE' },
  c1_10: { primary: 'crystal', secondary: 'runes', accentColor: '#FCA5A5' },
  c1_7: { primary: 'flare', secondary: 'sigil', accentColor: '#F59E0B', eyeColor: '#FDE68A', silhouette: 'overlord' },
  c2_3: { primary: 'halo', secondary: 'crystal', accentColor: '#FDE047' },
  c2_4: { primary: 'mask', secondary: 'cape', accentColor: '#CBD5E1' },
  c2_5: { primary: 'orbital', secondary: 'spikes', accentColor: '#FBBF24', eyeColor: '#67E8F9' },
  c2_7: { primary: 'flare', secondary: 'sigil', accentColor: '#A78BFA', eyeColor: '#F8FAFC', silhouette: 'reaper' },
  m3_7: { primary: 'mask', secondary: 'mimic', accentColor: '#E2E8F0' },
  m3_9: { primary: 'orbital', secondary: 'halo', accentColor: '#60A5FA', eyeColor: '#C4B5FD' },
  m3_10: { primary: 'flare', secondary: 'sigil', accentColor: '#C4B5FD', eyeColor: '#FDE68A', silhouette: 'overlord' },
  c3_3: { primary: 'halo', secondary: 'spikes', accentColor: '#93C5FD' },
  c3_4: { primary: 'mask', secondary: 'runes', accentColor: '#E2E8F0' },
  c3_5: { primary: 'orbital', secondary: 'crystal', accentColor: '#FCD34D', eyeColor: '#5EEAD4' },
  c3_7: { primary: 'flare', secondary: 'sigil', accentColor: '#F59E0B', eyeColor: '#FECACA', silhouette: 'apocalypse' },
  c3_8: { primary: 'halo', secondary: 'runes', accentColor: '#F8FAFC' },
  c3_9: { primary: 'spikes', secondary: 'mask', accentColor: '#D1D5DB' },
  c3_10: { primary: 'horns', secondary: 'crystal', accentColor: '#FDA4AF' },
};

const getMonsterVisualStyle = (monster: Monster): MonsterVisualStyle | undefined => {
  const presetStyle = MONSTER_VISUALS[monster.id];
  if (presetStyle) return presetStyle;

  const theme = monster.theme.toLowerCase();
  const name = monster.name;

  if (theme.includes('dark') || theme.includes('curse') || theme.includes('void') || theme.includes('abyss') || theme.includes('nightmare')) {
    return { primary: 'runes', secondary: 'mask', accentColor: '#C4B5FD', eyeColor: '#DDD6FE' };
  }

  if (theme.includes('fire') || theme.includes('inferno') || theme.includes('thunder') || theme.includes('crimson') || theme.includes('chaos')) {
    return { primary: 'spikes', secondary: 'crystal', accentColor: '#FCA5A5', eyeColor: '#FDE68A' };
  }

  if (theme.includes('ancient') || theme.includes('steel') || theme.includes('titan') || theme.includes('clean')) {
    return { primary: 'orbital', secondary: 'spikes', accentColor: '#93C5FD', eyeColor: '#67E8F9' };
  }

  if (theme.includes('book') || theme.includes('art') || theme.includes('mirror') || theme.includes('maze')) {
    return { primary: 'mask', secondary: 'runes', accentColor: '#FDE68A' };
  }

  if (theme.includes('sleep') || theme.includes('sleepy') || theme.includes('lost') || theme.includes('scary')) {
    return { primary: 'halo', secondary: 'orbital', accentColor: '#BFDBFE' };
  }

  if (name.includes('王') || name.includes('魔王') || name.includes('終焉') || monster.type === 'boss') {
    return { primary: 'crown', secondary: 'cape', accentColor: '#FBBF24', eyeColor: '#FDE68A' };
  }

  switch (monster.type) {
    case 'slime':
      return { primary: 'orbital', accentColor: '#BAE6FD' };
    case 'beast':
      return { primary: 'horns', secondary: 'spikes', accentColor: '#FCD34D' };
    case 'wing':
      return { primary: 'halo', secondary: 'crystal', accentColor: '#E0E7FF' };
    case 'ghost':
      return { primary: 'mask', secondary: 'halo', accentColor: '#E9D5FF', eyeColor: '#C4B5FD' };
    case 'robot':
      return { primary: 'orbital', secondary: 'runes', accentColor: '#93C5FD', eyeColor: '#67E8F9' };
    case 'object':
      return { primary: 'crystal', secondary: 'mimic', accentColor: '#FDE68A' };
    default:
      return undefined;
  }
};

// --- Rich Monster Avatar Component (SVG) ---
const MonsterAvatar = ({ type, color, emotion = 'normal', size = 150, visualStyle }: { type: MonsterType, color: string, emotion?: 'normal' | 'damage' | 'win', size?: number, visualStyle?: MonsterVisualStyle }) => {
  const mainColor = color;
  const gradientId = `grad-${type}-${color.replace('#', '')}`;
  const accentColor = visualStyle?.accentColor ?? '#F8FAFC';
  
  const renderBody = () => {
    switch (type) {
      case 'slime':
        return <g filter="url(#glow)"><path d="M-50 40 Q-60 0 0 -50 Q60 0 50 40 Q40 60 0 60 Q-40 60 -50 40" fill={`url(#${gradientId})`} stroke="rgba(255,255,255,0.5)" strokeWidth="2" /><circle cx="0" cy="10" r="25" fill={mainColor} opacity="0.6" filter="url(#blur)" /><circle cx="0" cy="10" r="15" fill="white" opacity="0.3" filter="url(#blur)" /><ellipse cx="-20" cy="-20" rx="10" ry="5" fill="white" opacity="0.7" transform="rotate(-45)" /><circle cx="20" cy="-25" r="3" fill="white" opacity="0.5" /><path d="M-30 55 Q-25 65 -20 55" fill={mainColor} stroke="none" /></g>;
      case 'beast': 
        return <g filter="url(#shadow)"><path d="M-40 -30 L-55 -70 L-20 -50 Z" fill={`url(#${gradientId})`} stroke="#222" strokeWidth="3" /><path d="M40 -30 L55 -70 L20 -50 Z" fill={`url(#${gradientId})`} stroke="#222" strokeWidth="3" /><path d="M-50 0 Q-60 -40 0 -50 Q60 -40 50 0 Q60 30 40 50 L0 60 L-40 50 Q-60 30 -50 0" fill={`url(#${gradientId})`} stroke="#222" strokeWidth="3" /><path d="M-50 0 L-60 10 L-50 20" fill="none" stroke={mainColor} strokeWidth="2" /><path d="M50 0 L60 10 L50 20" fill="none" stroke={mainColor} strokeWidth="2" /><ellipse cx="0" cy="20" rx="20" ry="14" fill="#ffddaa" stroke="#222" strokeWidth="2" /><path d="M-5 15 L5 15 L0 22 Z" fill="#222" /><path d="M0 22 L0 28 M-5 28 Q0 32 5 28" stroke="#222" strokeWidth="2" fill="none" /></g>;
      case 'wing': 
        return <g filter="url(#shadow)"><path d="M-20 0 Q-80 -40 -70 20 L-40 10 Z" fill="#222" opacity="0.3" /><path d="M20 0 Q80 -40 70 20 L40 10 Z" fill="#222" opacity="0.3" /><path d="M-30 10 Q-90 -50 -80 30 Q-60 50 -30 20" fill={`url(#${gradientId})`} stroke="#222" strokeWidth="3" /><path d="M30 10 Q90 -50 80 30 Q60 50 30 20" fill={`url(#${gradientId})`} stroke="#222" strokeWidth="3" /><circle cx="0" cy="0" r="35" fill={`url(#${gradientId})`} stroke="#222" strokeWidth="3" /><circle cx="0" cy="10" r="20" fill="white" opacity="0.2" /><path d="M-20 -25 L-25 -50 L-10 -30" fill={`url(#${gradientId})`} stroke="#222" strokeWidth="3" /><path d="M20 -25 L25 -50 L10 -30" fill={`url(#${gradientId})`} stroke="#222" strokeWidth="3" /></g>;
      case 'ghost':
        return <g filter="url(#glow)"><path d="M-40 50 Q-50 0 0 -50 Q50 0 40 50 Q30 40 20 50 Q10 40 0 50 Q-10 40 -20 50 Q-30 40 -40 50" fill={`url(#${gradientId})`} opacity="0.8" /><circle cx="0" cy="-10" r="40" fill={mainColor} opacity="0.3" filter="url(#blur)" /><circle cx="-25" cy="10" r="5" fill="#ffaaaa" opacity="0.6" /><circle cx="25" cy="10" r="5" fill="#ffaaaa" opacity="0.6" /></g>;
      case 'robot':
        return <g filter="url(#shadow)"><line x1="0" y1="-50" x2="0" y2="-70" stroke="#444" strokeWidth="4" /><circle cx="0" cy="-70" r="6" fill="red" stroke="#222" strokeWidth="2" filter="url(#glow)" /><circle cx="0" cy="-70" r="2" fill="white" opacity="0.8" /><rect x="-45" y="-50" width="90" height="80" rx="15" fill={`url(#${gradientId})`} stroke="#222" strokeWidth="4" /><rect x="-35" y="-30" width="70" height="30" rx="5" fill="#222" stroke="#444" strokeWidth="2" /><path d="M-30 -25 L30 -25" stroke="lime" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" /><rect x="-55" y="-30" width="10" height="20" fill="#888" stroke="#222" strokeWidth="2" /><rect x="45" y="-30" width="10" height="20" fill="#888" stroke="#222" strokeWidth="2" /><line x1="-20" y1="15" x2="20" y2="15" stroke="#333" strokeWidth="2" /><line x1="-20" y1="20" x2="20" y2="20" stroke="#333" strokeWidth="2" /><line x1="-20" y1="25" x2="20" y2="25" stroke="#333" strokeWidth="2" /></g>;
      case 'object': 
        return <g filter="url(#shadow)"><rect x="-40" y="-50" width="80" height="100" rx="5" fill={`url(#${gradientId})`} stroke="#222" strokeWidth="4" /><path d="M-35 45 L35 45 L30 35 L-30 35 Z" fill="#fff" stroke="#ccc" /><circle cx="0" cy="0" r="15" fill="gold" stroke="#b8860b" strokeWidth="3" /><rect x="-5" y="-5" width="10" height="10" fill="#222" /><path d="M-40 -50 L-20 -50 L-40 -30 Z" fill="gold" stroke="#222" strokeWidth="2" /><path d="M40 -50 L20 -50 L40 -30 Z" fill="gold" stroke="#222" strokeWidth="2" /><path d="M-40 50 L-20 50 L-40 30 Z" fill="gold" stroke="#222" strokeWidth="2" /><path d="M40 50 L20 50 L40 30 Z" fill="gold" stroke="#222" strokeWidth="2" /></g>;
      case 'boss': {
        const silhouette = visualStyle?.silhouette ?? 'overlord';

        if (silhouette === 'wyvern') {
          return <g filter="url(#shadow)"><path d="M-54 -8 Q-96 -40 -82 10 Q-66 28 -36 10" fill={`url(#${gradientId})`} stroke="#222" strokeWidth="3" /><path d="M54 -8 Q96 -40 82 10 Q66 28 36 10" fill={`url(#${gradientId})`} stroke="#222" strokeWidth="3" /><path d="M-22 -42 L-40 -72 L-10 -50 Z" fill={accentColor} stroke="#222" strokeWidth="3" /><path d="M22 -42 L40 -72 L10 -50 Z" fill={accentColor} stroke="#222" strokeWidth="3" /><path d="M-44 18 Q-48 -34 0 -50 Q48 -34 44 18 Q36 58 0 62 Q-36 58 -44 18" fill={`url(#${gradientId})`} stroke="#222" strokeWidth="4" /><path d="M-18 44 L-6 62 L6 62 L18 44" fill="none" stroke="#222" strokeWidth="4" strokeLinecap="round" /><path d="M-28 -8 Q0 -22 28 -8" fill="none" stroke="rgba(255,255,255,0.24)" strokeWidth="3" /></g>;
        }

        if (silhouette === 'reaper') {
          return <g filter="url(#shadow)"><path d="M-8 -62 Q24 -72 40 -44 Q18 -42 4 -20 Z" fill="rgba(15,23,42,0.92)" stroke={accentColor} strokeWidth="3" /><path d="M-50 54 Q-16 8 -10 -42 Q18 -10 48 52 Q26 62 0 62 Q-28 62 -50 54" fill={`url(#${gradientId})`} stroke="#222" strokeWidth="4" /><path d="M-38 16 Q-76 28 -70 54 Q-40 46 -20 26" fill="rgba(15,23,42,0.9)" stroke="#222" strokeWidth="3" /><path d="M38 16 Q76 28 70 54 Q40 46 20 26" fill="rgba(15,23,42,0.9)" stroke="#222" strokeWidth="3" /><path d="M0 -50 L0 58" stroke="rgba(255,255,255,0.18)" strokeWidth="3" /><circle cx="0" cy="-12" r="30" fill="rgba(15,23,42,0.35)" /></g>;
        }

        if (silhouette === 'apocalypse') {
          return <g filter="url(#shadow)"><path d="M-46 -18 L-74 -48 L-40 -40" fill={accentColor} stroke="#222" strokeWidth="3" /><path d="M46 -18 L74 -48 L40 -40" fill={accentColor} stroke="#222" strokeWidth="3" /><path d="M-22 -42 L-42 -78 L-8 -52 Z" fill={accentColor} stroke="#222" strokeWidth="3" /><path d="M22 -42 L42 -78 L8 -52 Z" fill={accentColor} stroke="#222" strokeWidth="3" /><path d="M-54 -8 Q0 -88 54 -8 L42 16 L54 52 Q0 82 -54 52 L-42 16 Z" fill={`url(#${gradientId})`} stroke="#222" strokeWidth="4" /><path d="M-30 28 L0 8 L30 28 L18 58 L-18 58 Z" fill="rgba(0,0,0,0.22)" /><path d="M-34 -6 L34 -6 M-28 18 L28 18" stroke="rgba(255,255,255,0.2)" strokeWidth="3" /></g>;
        }

        return <g filter="url(#shadow)"><path d="M-58 46 Q-46 2 -30 -30 L-12 -12 L-22 44 Z" fill="rgba(15,23,42,0.7)" stroke="#222" strokeWidth="3" /><path d="M58 46 Q46 2 30 -30 L12 -12 L22 44 Z" fill="rgba(15,23,42,0.7)" stroke="#222" strokeWidth="3" /><path d="M-26 -42 C-44 -70 -66 -54 -78 -66" fill="none" stroke="#222" strokeWidth="8" /><path d="M-26 -42 C-44 -70 -66 -54 -78 -66" fill="none" stroke={accentColor} strokeWidth="4" /><path d="M26 -42 C44 -70 66 -54 78 -66" fill="none" stroke="#222" strokeWidth="8" /><path d="M26 -42 C44 -70 66 -54 78 -66" fill="none" stroke={accentColor} strokeWidth="4" /><path d="M-50 -26 Q0 -74 50 -26 L42 50 Q0 80 -42 50 Z" fill={`url(#${gradientId})`} stroke="#222" strokeWidth="4" /><path d="M0 -26 L0 52" stroke="rgba(255,255,255,0.16)" strokeWidth="3" /><path d="M-26 -8 L26 -8" stroke="rgba(255,255,255,0.16)" strokeWidth="3" /><path d="M-36 22 L36 22" stroke="rgba(255,255,255,0.16)" strokeWidth="3" /></g>;
      }
      default: return <circle cx="0" cy="0" r="35" fill={`url(#${gradientId})`} />;
    }
  };

  const renderVariant = (variant?: MonsterVisualVariant) => {
    switch (variant) {
      case 'horns':
        return (
          <g>
            <path d="M-18 -38 L-34 -72 L-8 -50 Z" fill={accentColor} stroke="#111827" strokeWidth="3" />
            <path d="M18 -38 L34 -72 L8 -50 Z" fill={accentColor} stroke="#111827" strokeWidth="3" />
          </g>
        );
      case 'crown':
        return (
          <g>
            <path d="M-30 -48 L-18 -68 L0 -52 L18 -68 L30 -48 L24 -34 L-24 -34 Z" fill={accentColor} stroke="#111827" strokeWidth="3" />
            <circle cx="-18" cy="-52" r="4" fill="#FEF3C7" />
            <circle cx="0" cy="-58" r="4.5" fill="#FCA5A5" />
            <circle cx="18" cy="-52" r="4" fill="#BFDBFE" />
          </g>
        );
      case 'mask':
        return (
          <g>
            <path d="M-32 -8 Q0 -28 32 -8 Q24 22 0 30 Q-24 22 -32 -8 Z" fill="rgba(15,23,42,0.72)" stroke={accentColor} strokeWidth="3" />
            <path d="M-20 -6 Q-10 -16 0 -6" fill="none" stroke={accentColor} strokeWidth="2" />
            <path d="M20 -6 Q10 -16 0 -6" fill="none" stroke={accentColor} strokeWidth="2" />
          </g>
        );
      case 'runes':
        return (
          <g opacity="0.88">
            <circle cx="-42" cy="-6" r="8" fill="none" stroke={accentColor} strokeWidth="2.5" />
            <path d="M-42 -14 L-42 2 M-50 -6 L-34 -6" stroke={accentColor} strokeWidth="2" />
            <circle cx="42" cy="8" r="9" fill="none" stroke={accentColor} strokeWidth="2.5" />
            <path d="M42 -1 L42 17 M35 8 L49 8" stroke={accentColor} strokeWidth="2" />
          </g>
        );
      case 'crystal':
        return (
          <g>
            <path d="M-46 18 L-30 -18 L-18 12 Z" fill={accentColor} opacity="0.8" stroke="#111827" strokeWidth="2.5" />
            <path d="M46 10 L26 -22 L14 6 Z" fill={accentColor} opacity="0.7" stroke="#111827" strokeWidth="2.5" />
            <path d="M0 -44 L12 -70 L24 -42 Z" fill={accentColor} opacity="0.85" stroke="#111827" strokeWidth="2.5" />
          </g>
        );
      case 'mimic':
        return (
          <g>
            <path d="M-24 26 L24 26 L0 42 Z" fill="#111827" />
            <path d="M-22 26 L-16 18 L-10 26 L-4 18 L2 26 L8 18 L14 26 L20 18 L26 26" fill="none" stroke="#F8FAFC" strokeWidth="3" strokeLinejoin="round" />
          </g>
        );
      case 'halo':
        return (
          <g>
            <ellipse cx="0" cy="-52" rx="30" ry="10" fill="none" stroke={accentColor} strokeWidth="4" opacity="0.95" />
            <ellipse cx="0" cy="-52" rx="18" ry="5" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
          </g>
        );
      case 'spikes':
        return (
          <g>
            <path d="M-46 14 L-62 8 L-46 -2" fill={accentColor} stroke="#111827" strokeWidth="2.5" />
            <path d="M46 14 L62 8 L46 -2" fill={accentColor} stroke="#111827" strokeWidth="2.5" />
            <path d="M-28 48 L-18 66 L-4 48" fill={accentColor} stroke="#111827" strokeWidth="2.5" />
            <path d="M28 48 L18 66 L4 48" fill={accentColor} stroke="#111827" strokeWidth="2.5" />
          </g>
        );
      case 'cape':
        return (
          <g opacity="0.92">
            <path d="M-38 -12 Q0 12 38 -12 L52 44 Q0 74 -52 44 Z" fill="rgba(127,29,29,0.78)" stroke="#111827" strokeWidth="3" />
            <path d="M-12 -22 Q0 -14 12 -22" fill="none" stroke={accentColor} strokeWidth="3" />
          </g>
        );
      case 'orbital':
        return (
          <g>
            <ellipse cx="0" cy="4" rx="52" ry="16" fill="none" stroke={accentColor} strokeWidth="3" opacity="0.8" />
            <circle cx="-48" cy="0" r="5" fill={accentColor} />
            <circle cx="48" cy="8" r="4" fill="#F8FAFC" opacity="0.9" />
          </g>
        );
      case 'sigil':
        return (
          <g opacity="0.92">
            <circle cx="0" cy="2" r="58" fill="none" stroke={accentColor} strokeWidth="3" strokeDasharray="6 5" />
            <circle cx="0" cy="2" r="44" fill="none" stroke="rgba(248,250,252,0.55)" strokeWidth="1.8" />
            <path d="M0 -48 L12 -18 L42 -18 L18 0 L28 30 L0 12 L-28 30 L-18 0 L-42 -18 L-12 -18 Z" fill="none" stroke={accentColor} strokeWidth="2.4" strokeLinejoin="round" />
          </g>
        );
      case 'flare':
        return (
          <g opacity="0.95">
            <circle cx="0" cy="-4" r="54" fill={accentColor} opacity="0.14" filter="url(#blur)" />
            <path d="M0 -74 L8 -50 L28 -64 L22 -38 L48 -42 L30 -18 L58 -8 L30 2 L48 24 L20 18 L24 46 L0 28 L-24 46 L-20 18 L-48 24 L-30 2 L-58 -8 L-30 -18 L-48 -42 L-22 -38 L-28 -64 L-8 -50 Z" fill={accentColor} opacity="0.78" stroke="#111827" strokeWidth="2.5" strokeLinejoin="round" />
          </g>
        );
      default:
        return null;
    }
  };

  const renderFace = () => {
    const isRobot = type === 'robot';
    const isGhost = type === 'ghost';
    const eyeFill = emotion === 'damage'
      ? '#ff0000'
      : visualStyle?.eyeColor ?? (isRobot || isGhost ? '#00ffcc' : '#222');
    const eyeStroke = isRobot || isGhost ? 'none' : '#222';
    const isBoss = type === 'boss';
    
    if (emotion === 'damage') {
        return <g transform={isRobot ? 'translate(0, -15)' : 'translate(0, 0)'}><path d="M-25 -10 L-10 0 M-10 -10 L-25 0" stroke={eyeFill} strokeWidth="5" strokeLinecap="round" /><path d="M10 -10 L25 0 M25 -10 L10 0" stroke={eyeFill} strokeWidth="5" strokeLinecap="round" /><ellipse cx="0" cy="20" rx="8" ry="10" fill="#222" /></g>;
    } else if (emotion === 'win') {
         return <g transform={isRobot ? 'translate(0, -15)' : 'translate(0, 0)'}><path d="M-25 -5 L-15 -15 L-5 -5" fill="none" stroke={eyeFill} strokeWidth="4" strokeLinecap="round" /><path d="M5 -5 L15 -15 L25 -5" fill="none" stroke={eyeFill} strokeWidth="4" strokeLinecap="round" /><path d="M-5 20 L5 30 M5 20 L-5 30" stroke="#222" strokeWidth="3" /></g>;
    } else {
        return <g transform={isRobot ? 'translate(0, -15)' : 'translate(0, 0)'}>{isBoss ? (<><path d="M-30 -15 L-10 -5 L-10 -15 Z" fill={eyeFill} /><path d="M30 -15 L10 -5 L10 -15 Z" fill={eyeFill} /></>) : (<><circle cx="-18" cy="-8" r="6" fill={eyeFill} stroke={eyeStroke} strokeWidth={isRobot ? 0 : 0} /><circle cx="18" cy="-8" r="6" fill={eyeFill} stroke={eyeStroke} strokeWidth={isRobot ? 0 : 0} />{!isRobot && <circle cx="-16" cy="-10" r="2" fill="white" />}{!isRobot && <circle cx="20" cy="-10" r="2" fill="white" />}</>)}{isRobot ? null : <path d="M-10 15 Q0 25 10 15" fill="none" stroke="#222" strokeWidth="3" strokeLinecap="round" />}</g>;
    }
  };

  return (
    <svg width={size} height={size} viewBox="-80 -80 160 160" className="drop-shadow-2xl transition-all duration-300">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: mainColor, stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#222', stopOpacity: 0.8 }} /> 
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.5"/></filter>
        <filter id="blur"><feGaussianBlur stdDeviation="2" /></filter>
        <radialGradient id="groundShadow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%"><stop offset="0%" style={{stopColor:'rgba(0,0,0,0.6)', stopOpacity:1}} /><stop offset="100%" style={{stopColor:'rgba(0,0,0,0)', stopOpacity:0}} /></radialGradient>
      </defs>
      <ellipse cx="0" cy="65" rx="50" ry="12" fill="url(#groundShadow)" />
      <g className={emotion === 'damage' ? 'translate-x-2 translate-y-2' : ''}>
        {renderVariant(visualStyle?.secondary)}
        {visualStyle?.primary === 'cape' && renderVariant(visualStyle.primary)}
        {renderBody()}
        {visualStyle?.primary !== 'cape' && renderVariant(visualStyle?.primary)}
        {renderFace()}
      </g>
    </svg>
  );
};

const GameTitleLogo = () => (
  <div className="w-full max-w-4xl text-center">
    <img
      src={TITLE_LOGO_IMAGE}
      alt="English Typing Fantasy"
      className="mx-auto h-[clamp(72px,8vw,112px)] w-[min(760px,72vw)] max-w-full object-contain drop-shadow-[0_14px_30px_rgba(0,0,0,0.34)]"
    />
  </div>
);

const BASE_MONSTERS: Record<Level, { guide: Monster[], challenge: Monster[] }> = {
  1: {
    guide: [
      { id: 'm1_1', name: '朝ねぼうベルクロック', type: 'object', color: '#60A5FA', baseHp: 150, dialogueStart: "リンリン！ あと5分だけ止めておくよ！", dialogueDefeat: "起きる時間をちゃんと鳴らします...", theme: "Timekeeper" },
      { id: 'm1_2', name: 'ちらかしノートミミック', type: 'object', color: '#22C55E', baseHp: 180, dialogueStart: "ページもプリントも全部ぐちゃぐちゃだ！", dialogueDefeat: "名前を書いて、きれいに閉じます...", theme: "MessyBook" },
      { id: 'm1_3', name: 'おしゃべりラッパバード', type: 'wing', color: '#FACC15', baseHp: 200, dialogueStart: "パパパー！ 授業中でも鳴らしちゃうぞ！", dialogueDefeat: "小さな声で合図します...", theme: "NoiseMaker" },
      { id: 'm1_4', name: 'つまみぐいスナックオーク', type: 'beast', color: '#F97316', baseHp: 220, dialogueStart: "そのおやつ、ひとくちだけ...全部くれ！", dialogueDefeat: "手を洗って、順番を待ちます...", theme: "SnackBandit" },
      { id: 'm1_5', name: 'らくがきスターゴースト', type: 'ghost', color: '#EC4899', baseHp: 250, dialogueStart: "ノートのすみっこを星だらけにしてやる！", dialogueDefeat: "キャンバスに描くことにします...", theme: "DoodleStar" },
      { id: 'm1_6', name: 'まいごの消しゴムナイト', type: 'object', color: '#DBEAFE', baseHp: 280, dialogueStart: "筆箱の国へ帰る道を忘れた！", dialogueDefeat: "机の右上で待機します...", theme: "LostKnight" },
      { id: 'm1_7', name: 'そうじサボりダストマスク', type: 'ghost', color: '#94A3B8', baseHp: 300, dialogueStart: "ほこりの雲で見えなくしてやる！", dialogueDefeat: "すみっこまで集められました...", theme: "DustMask" },
      { id: 'm1_8', name: '給食おかわりキング', type: 'beast', color: '#F59E0B', baseHp: 350, dialogueStart: "カレーの大鍋はぜんぶ王さまのものだ！", dialogueDefeat: "みんなで分けるほうがおいしい...", theme: "LunchKing" },
      { id: 'm1_9', name: 'としょかん禁書ミミック', type: 'object', color: '#7C3AED', baseHp: 400, dialogueStart: "しおりを閉じ込めて、物語を止めてやる！", dialogueDefeat: "静かにページを開きます...", theme: "ForbiddenBook" },
      { id: 'm1_10', name: 'ゲーム沼ドラゴン', type: 'boss', color: '#EF4444', baseHp: 400, dialogueStart: "宿題よりラスボス周回だ！ 今日は寝かせないぞ！", dialogueDefeat: "時間を決めて遊びます...", theme: "GameAbyss" },
    ],
    challenge: [
      { id: 'c1_1', name: '影ぬいインクコア', type: 'slime', color: '#4C1D95', baseHp: 420, dialogueStart: "黒いインクで答えを塗りつぶしてやる...", dialogueDefeat: "文字が...はっきり見える...", theme: "DarkInk" },
      { id: 'c1_2', name: '炎門のケルベロス', type: 'beast', color: '#DC2626', baseHp: 580, dialogueStart: "三つの火花で集中を散らしてやる！", dialogueDefeat: "門を開けよう...見事だ...", theme: "FireGate" },
      { id: 'c1_3', name: '嵐譜のウイングメイジ', type: 'wing', color: '#0891B2', baseHp: 740, dialogueStart: "風の楽譜でキーを乱す！", dialogueDefeat: "リズムを読まれたか...", theme: "StormScore" },
      { id: 'c1_4', name: '呪面ファントム', type: 'ghost', color: '#7E22CE', baseHp: 900, dialogueStart: "その迷い、仮面に閉じ込めてやる...", dialogueDefeat: "仮面が割れる...成仏します...", theme: "CursedMask" },
      { id: 'c1_5', name: '鉄壁プロトガード', type: 'robot', color: '#64748B', baseHp: 1040, dialogueStart: "入力パターン解析開始。突破不能デス。", dialogueDefeat: "解析不能...システムダウン...", theme: "SteelProtocol" },
      { id: 'c1_6', name: '地鳴りルーンゴーレム', type: 'object', color: '#A16207', baseHp: 1200, dialogueStart: "古い石文字で道をふさいでやる...", dialogueDefeat: "刻まれたルーンがほどける...", theme: "EarthRune" },
      { id: 'c1_8', name: '紅牙ブラッドファング', type: 'beast', color: '#991B1B', baseHp: 1260, dialogueStart: "一文字の迷いも逃さない...", dialogueDefeat: "牙が...届かなかった...", theme: "CrimsonFang" },
      { id: 'c1_9', name: '奈落ランタンレイス', type: 'ghost', color: '#6D28D9', baseHp: 1310, dialogueStart: "底なしの灯りで目を惑わせよう...", dialogueDefeat: "灯りが...静かに消える...", theme: "AbyssLantern" },
      { id: 'c1_10', name: '獄炎バリスタ・アイ', type: 'object', color: '#B91C1C', baseHp: 1340, dialogueStart: "照準固定。焼き払う準備はできた。", dialogueDefeat: "砲身が...冷えていく...", theme: "InfernoEye" },
      { id: 'c1_7', name: '魔王ドラゴニス', type: 'boss', color: '#2F4F4F', baseHp: 1340, dialogueStart: "我に挑む愚か者よ", dialogueDefeat: "貴様こそ勇者だ...", theme: "Boss" },
      { id: 'c1_11', name: '裏魔竜ヴォイド', type: 'boss', color: '#4C1D95', baseHp: 1340, dialogueStart: "まだ終わりではない。ここからが真の試練だ。", dialogueDefeat: "やるな...だが次で終わると思うな。", theme: "HiddenVoid" },
      { id: 'c1_12', name: '深淵王ネメシス', type: 'boss', color: '#1D4ED8', baseHp: 1340, dialogueStart: "その集中力、どこまで続くか見せてみろ。", dialogueDefeat: "くっ...さらに上を用意していたのだが。", theme: "HiddenAbyss" },
      { id: 'c1_13', name: '真冥皇アポカリス', type: 'boss', color: '#7F1D1D', baseHp: 1340, dialogueStart: "全問を貫いてみせろ。最後の壁は私だ。", dialogueDefeat: "見事だ...お前こそ真の覇者。", theme: "HiddenEnd" },
    ]
  },
  2: {
    guide: [
      { id: 'm2_1', name: '遅刻コウモリ', type: 'wing', color: '#9370DB', baseHp: 300, dialogueStart: "学校に遅れる〜！", dialogueDefeat: "間に合った！", theme: "Tardiness" },
      { id: 'm2_2', name: 'わすれんぼウルフ', type: 'beast', color: '#708090', baseHp: 350, dialogueStart: "宿題わすれた...", dialogueDefeat: "カバンにあった！", theme: "Forgetful" },
      { id: 'm2_3', name: 'いじわるフォックス', type: 'beast', color: '#FF8C00', baseHp: 400, dialogueStart: "意地悪してやる！", dialogueDefeat: "仲良くします...", theme: "Mean" },
      { id: 'm2_4', name: '居眠りベア', type: 'beast', color: '#8B4513', baseHp: 450, dialogueStart: "ぐーぐー...", dialogueDefeat: "目が覚めた！", theme: "Sleep" },
      { id: 'm2_5', name: '黒板消しクリーチャー', type: 'object', color: '#483D8B', baseHp: 500, dialogueStart: "真っ白にしてやる！", dialogueDefeat: "綺麗になった！", theme: "Clean" },
      { id: 'm2_6', name: 'リコーダーへび', type: 'slime', color: '#98FB98', baseHp: 550, dialogueStart: "変な音だしてやる！", dialogueDefeat: "綺麗な音色...", theme: "Music" },
      { id: 'm2_7', name: 'ドッジボールゴーレム', type: 'robot', color: '#A9A9A9', baseHp: 600, dialogueStart: "当ててやるぞ！", dialogueDefeat: "ナイスキャッチ！", theme: "Sport" },
      { id: 'm2_8', name: 'うわばき隠し', type: 'ghost', color: '#E0FFFF', baseHp: 650, dialogueStart: "靴がないぞ〜", dialogueDefeat: "揃えて置きます...", theme: "Shoes" },
      { id: 'm2_9', name: '騒音トロール', type: 'beast', color: '#CD5C5C', baseHp: 700, dialogueStart: "大声で歌うぞー！", dialogueDefeat: "静かにします...", theme: "Noisy" },
      { id: 'm2_10', name: 'テストの悪魔', type: 'boss', color: '#800000', baseHp: 700, dialogueStart: "0点とれ〜！", dialogueDefeat: "100点だと！？", theme: "Anxiety" },
    ],
    challenge: [
      { id: 'c2_1', name: 'ポイズンスライム', type: 'slime', color: '#8B008B', baseHp: 1500, dialogueStart: "毒を浴びろ！", dialogueDefeat: "解毒された...", theme: "Poison" },
      { id: 'c2_2', name: '氷結のオオカミ', type: 'beast', color: '#E0FFFF', baseHp: 1800, dialogueStart: "凍り付け！", dialogueDefeat: "溶けちゃう...", theme: "Ice" },
      { id: 'c2_3', name: 'サンダーバード', type: 'wing', color: '#FFD700', baseHp: 2000, dialogueStart: "雷よ落ちろ！", dialogueDefeat: "ビリビリする...", theme: "Thunder" },
      { id: 'c2_4', name: 'ファントムナイト', type: 'ghost', color: '#2F4F4F', baseHp: 2200, dialogueStart: "剣のサビにしてやる", dialogueDefeat: "見事な剣筋だ...", theme: "Knight" },
      { id: 'c2_5', name: '古代兵器オメガ', type: 'robot', color: '#8B4513', baseHp: 2500, dialogueStart: "排除行動開始。", dialogueDefeat: "機能停止...", theme: "Ancient" },
      { id: 'c2_6', name: 'デス・スコーピオン', type: 'beast', color: '#800000', baseHp: 2800, dialogueStart: "毒針の恐怖...", dialogueDefeat: "解毒完了...", theme: "Venom" },
      { id: 'c2_8', name: 'ブリザードミラー', type: 'object', color: '#AFEEEE', baseHp: 2860, dialogueStart: "凍てつく自分を見ろ", dialogueDefeat: "ひび割れて...映らない...", theme: "Mirror" },
      { id: 'c2_9', name: 'ナイトメアクロウ', type: 'wing', color: '#4B0082', baseHp: 2920, dialogueStart: "悪夢を運んでやる", dialogueDefeat: "羽ばたきが...止まる...", theme: "Nightmare" },
      { id: 'c2_10', name: '深海のジャッジ', type: 'ghost', color: '#1E3A5F', baseHp: 2960, dialogueStart: "沈黙の底へ沈め", dialogueDefeat: "判決は...覆ったか...", theme: "Depth" },
      { id: 'c2_7', name: '冥王ハーデス', type: 'boss', color: '#000000', baseHp: 2960, dialogueStart: "絶望を味わえ", dialogueDefeat: "光が戻るのか...", theme: "Death" },
      { id: 'c2_11', name: '裏冥王レヴナント', type: 'boss', color: '#312E81', baseHp: 2960, dialogueStart: "正確さだけでなく、持久力も試してやろう。", dialogueDefeat: "まだ届くか...ならば次を受けてみろ。", theme: "HiddenRevenant" },
      { id: 'c2_12', name: '終刻神クロノス', type: 'boss', color: '#0F766E', baseHp: 2960, dialogueStart: "焦るな。崩れるのはお前のほうだ。", dialogueDefeat: "時間さえ押し返すとはな...", theme: "HiddenChronos" },
      { id: 'c2_13', name: '真絶望アザゼル', type: 'boss', color: '#7C2D12', baseHp: 2960, dialogueStart: "最後まで一つも落とさず来られるか。", dialogueDefeat: "その執念...認めよう。", theme: "HiddenDespair" },
    ]
  },
  3: {
    guide: [
      { id: 'm3_1', name: '言い訳ゴースト', type: 'ghost', color: '#D8BFD8', baseHp: 500, dialogueStart: "犬が宿題食べた...", dialogueDefeat: "嘘つきました...", theme: "Lying" },
      { id: 'm3_2', name: 'よそみロボ', type: 'robot', color: '#00CED1', baseHp: 600, dialogueStart: "あっちに何かある！", dialogueDefeat: "集中モードON", theme: "Distraction" },
      { id: 'm3_3', name: '夜更かしフクロウ', type: 'wing', color: '#191970', baseHp: 700, dialogueStart: "夜はこれからだ！", dialogueDefeat: "早く寝ます...", theme: "Night" },
      { id: 'm3_4', name: '廊下ダッシュチーター', type: 'beast', color: '#FFD700', baseHp: 800, dialogueStart: "廊下を走るぞ！", dialogueDefeat: "歩きます...", theme: "Run" },
      { id: 'm3_5', name: 'なまけゴーレム', type: 'robot', color: '#8B4513', baseHp: 900, dialogueStart: "動きたくない...", dialogueDefeat: "運動します！", theme: "Laziness" },
      { id: 'm3_6', name: '偏食モンスター', type: 'slime', color: '#228B22', baseHp: 1000, dialogueStart: "野菜は食べない！", dialogueDefeat: "美味しい...", theme: "Food" },
      { id: 'm3_7', name: '迷路マンション', type: 'object', color: '#778899', baseHp: 1100, dialogueStart: "迷子になれ〜", dialogueDefeat: "出口こっち？", theme: "Maze" },
      { id: 'm3_8', name: '雷おやじ', type: 'ghost', color: '#FFFF00', baseHp: 1200, dialogueStart: "コラ〜！！", dialogueDefeat: "許してやろう...", theme: "Scary" },
      { id: 'm3_9', name: '宿題ブラックホール', type: 'boss', color: '#000000', baseHp: 1300, dialogueStart: "全部吸い込むぞ", dialogueDefeat: "提出します...", theme: "Blackhole" },
      { id: 'm3_10', name: '夏休みの宿題王', type: 'boss', color: '#4B0082', baseHp: 1300, dialogueStart: "今日は8月31日だ！", dialogueDefeat: "7月中に終わってた！", theme: "Procrastination" },
    ],
    challenge: [
      { id: 'c3_1', name: 'カオススライム', type: 'slime', color: '#FF4500', baseHp: 2500, dialogueStart: "混沌を...", dialogueDefeat: "秩序が...", theme: "Chaos" },
      { id: 'c3_2', name: 'キメラビースト', type: 'beast', color: '#DAA520', baseHp: 2800, dialogueStart: "喰らってやる！", dialogueDefeat: "お腹いっぱい...", theme: "Chimera" },
      { id: 'c3_3', name: 'ヴォイドウィング', type: 'wing', color: '#191970', baseHp: 3000, dialogueStart: "闇夜に消えろ", dialogueDefeat: "夜が明ける...", theme: "Void" },
      { id: 'c3_4', name: 'スペクターロード', type: 'ghost', color: '#FFFafa', baseHp: 3500, dialogueStart: "恐怖せよ", dialogueDefeat: "恐れ入った...", theme: "Fear" },
      { id: 'c3_5', name: '機神タイタン', type: 'robot', color: '#B8860B', baseHp: 4000, dialogueStart: "出力最大！", dialogueDefeat: "エネルギー切れ...", theme: "Titan" },
      { id: 'c3_6', name: 'アビス・ウォーカー', type: 'ghost', color: '#483D8B', baseHp: 4500, dialogueStart: "深淵を覗くか...", dialogueDefeat: "見事だ...", theme: "Abyss" },
      { id: 'c3_8', name: '断罪のセラフ', type: 'wing', color: '#F5F5DC', baseHp: 4650, dialogueStart: "裁きを始めよう", dialogueDefeat: "天秤が...傾いた...", theme: "Judgement" },
      { id: 'c3_9', name: '虚無のコロッサス', type: 'object', color: '#696969', baseHp: 4800, dialogueStart: "存在ごと踏み潰す", dialogueDefeat: "巨体が...崩落する...", theme: "Void" },
      { id: 'c3_10', name: '深紅のキマイラ', type: 'beast', color: '#8B1E3F', baseHp: 4900, dialogueStart: "最後の恐怖を見せてやる", dialogueDefeat: "まだ...届かなかったか...", theme: "Crimson" },
      { id: 'c3_7', name: '終焉のドラゴン', type: 'boss', color: '#8B0000', baseHp: 4900, dialogueStart: "全てを無に還す", dialogueDefeat: "未来を託そう...", theme: "End" },
      { id: 'c3_11', name: '裏終焉ネビュラス', type: 'boss', color: '#581C87', baseHp: 4900, dialogueStart: "ここから先は、本当に折れない者だけが進める。", dialogueDefeat: "その意志...まだ尽きないのか。", theme: "HiddenNebula" },
      { id: 'c3_12', name: '深黒皇ディザスター', type: 'boss', color: '#0F172A', baseHp: 4900, dialogueStart: "迷いは一文字で命取りになるぞ。", dialogueDefeat: "完璧さで押し切るとは...。", theme: "HiddenDisaster" },
      { id: 'c3_13', name: '真終王アポカリプス', type: 'boss', color: '#7F1D1D', baseHp: 4900, dialogueStart: "最後の五十問、すべて通してみせろ。", dialogueDefeat: "これほどとは...完全敗北だ。", theme: "HiddenApocalypse" },
    ]
  }
};

type MonsterLane = 'guide' | 'challenge';

const TWENTY_STAGE_HP_CURVES: Record<Level, Record<MonsterLane, number[]>> = {
  1: {
    guide: [150, 170, 185, 200, 210, 220, 230, 240, 250, 260, 270, 285, 300, 315, 330, 345, 360, 370, 380, 370],
    challenge: [420, 580, 740, 900, 1040, 1200, 1260, 1267, 1273, 1280, 1287, 1293, 1300, 1307, 1313, 1320, 1327, 1333, 1340],
  },
  2: {
    guide: [300, 350, 400, 450, 500, 550, 600, 608, 616, 624, 632, 640, 648, 656, 664, 672, 680, 690, 700],
    challenge: [1500, 1800, 2000, 2200, 2500, 2800, 2860, 2868, 2876, 2884, 2892, 2900, 2908, 2916, 2924, 2932, 2940, 2950, 2960],
  },
  3: {
    guide: [500, 600, 700, 800, 900, 1000, 1100, 1115, 1130, 1145, 1160, 1175, 1190, 1205, 1220, 1240, 1260, 1280, 1300],
    challenge: [2500, 2800, 3000, 3500, 4000, 4500, 4650, 4670, 4690, 4710, 4730, 4750, 4770, 4790, 4810, 4830, 4850, 4875, 4900],
  },
};

const EXTRA_MONSTER_TYPES: MonsterType[] = ['slime', 'wing', 'object', 'beast', 'ghost', 'robot', 'slime', 'wing', 'object', 'beast'];
const EXTRA_MONSTER_COLORS = ['#38BDF8', '#A78BFA', '#FBBF24', '#34D399', '#F472B6', '#94A3B8', '#22C55E', '#F97316', '#818CF8', '#F43F5E'];

const EXTRA_MONSTER_NAMES: Record<Level, Record<MonsterLane, string[]>> = {
  1: {
    guide: ['朝チャイムスライム', 'プリントつむじバード', 'えんぴつ番人ゴーレム', '給食列ならびオーク', '音読こだまゴースト', '時間割ロボ', 'ノート整理スライム', '小テストフクロウ', 'しおり守りミミック', '集中ほのおビースト'],
    challenge: ['黒インクスライム改', '火花の番犬', '風読みウィング', '仮面の影法師', '鉄壁ガード改', '石文ルーン像', '紅牙の追跡者', '奈落の灯火', '獄炎の照準手', '魔門の門番'],
  },
  2: {
    guide: ['朝礼コウモリ', '忘れ物チェックウルフ', '仲直りフォックス', '目覚ましベア', '黒板みがき精', '音階へび', 'キャッチ練習ロボ', '上ばき番人', '静けさトロール', 'テスト前スピリット'],
    challenge: ['毒霧スライム', '氷牙ウルフ', '雷羽バード', '幻影ナイト', '古代ギア兵', '砂毒スコーピオン', '氷鏡の番人', '悪夢の羽音', '深海の審判官', '冥府の門衛'],
  },
  3: {
    guide: ['正直ゴースト', '集中ロボ改', '早寝フクロウ', '廊下ストッパー', '運動ゴーレム', '野菜スライム', '出口案内ミミック', '雷雲ゴースト', '宿題衛星コア', '提出日ガーディアン'],
    challenge: ['混沌スライム改', '金角キメラ', '夜空ウィング', '白影ロード', '機神ガード', '深淵ウォーカー改', '裁きの羽', '虚無巨像の影', '深紅キマイラ改', '終焉門の番人'],
  },
};

const makeExtraMonster = (
  level: Level,
  lane: MonsterLane,
  extraIndex: number,
  baseHp: number
): Monster => ({
  id: `${lane === 'guide' ? 'm' : 'c'}${level}_extra_${extraIndex + 1}`,
  name: EXTRA_MONSTER_NAMES[level][lane][extraIndex],
  type: EXTRA_MONSTER_TYPES[extraIndex],
  color: EXTRA_MONSTER_COLORS[extraIndex],
  baseHp,
  dialogueStart: '少しだけ強くなったぞ。ここを越えてみろ！',
  dialogueDefeat: 'いい集中力だ...次へ進もう。',
  theme: `${lane === 'guide' ? 'TrainingRamp' : 'DangerRamp'}${level}_${extraIndex + 1}`,
});

const buildTwentyStageList = (
  level: Level,
  lane: MonsterLane,
  monsters: Monster[]
): Monster[] => {
  const hpCurve = TWENTY_STAGE_HP_CURVES[level][lane];
  const finalBossBaseHp = hpCurve[19] ?? hpCurve[18];
  const firstSeven = monsters.slice(0, 7).map((monster, index) => ({ ...monster, baseHp: hpCurve[index] }));
  const oldEighth = { ...monsters[7], baseHp: hpCurve[11] };
  const oldNinth = { ...monsters[8], baseHp: hpCurve[18] };
  const extraMonsters = EXTRA_MONSTER_NAMES[level][lane].map((_, index) => makeExtraMonster(level, lane, index, hpCurve[index < 4 ? index + 7 : index + 8]));
  const finalBoss = { ...monsters[9], baseHp: finalBossBaseHp };
  const baseTwenty = [
    ...firstSeven,
    ...extraMonsters.slice(0, 4),
    oldEighth,
    ...extraMonsters.slice(4),
    oldNinth,
    finalBoss,
  ];

  if (lane === 'guide') return baseTwenty;

  const hiddenBosses = monsters.slice(10, 13).map(monster => ({ ...monster, baseHp: finalBossBaseHp }));
  return [...baseTwenty, ...hiddenBosses];
};

const MONSTERS: Record<Level, { guide: Monster[], challenge: Monster[] }> = {
  1: {
    guide: buildTwentyStageList(1, 'guide', BASE_MONSTERS[1].guide),
    challenge: buildTwentyStageList(1, 'challenge', BASE_MONSTERS[1].challenge),
  },
  2: {
    guide: buildTwentyStageList(2, 'guide', BASE_MONSTERS[2].guide),
    challenge: buildTwentyStageList(2, 'challenge', BASE_MONSTERS[2].challenge),
  },
  3: {
    guide: buildTwentyStageList(3, 'guide', BASE_MONSTERS[3].guide),
    challenge: buildTwentyStageList(3, 'challenge', BASE_MONSTERS[3].challenge),
  },
};

// --- Components ---
type GameButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'outline' | 'ghost';
type GameButtonSize = 'sm' | 'md' | 'lg';

type GameButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: GameButtonVariant;
  size?: GameButtonSize;
};

const PLAYER_NAME_MAX_LENGTH = 30;

const GameButton = ({ onClick, children, className = "", variant = "primary", disabled = false, size = "md", autoFocus = false, type = "button" }: GameButtonProps) => {
  const baseStyle = "relative font-bold transition-all transform active:scale-95 flex items-center justify-center gap-2 overflow-hidden border-2 rounded-lg shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300";
  const sizes: Record<GameButtonSize, string> = { sm: "px-4 py-2 text-sm", md: "px-6 py-3", lg: "px-10 py-4 text-xl" };
  const variants: Record<GameButtonVariant, string> = {
    primary: "bg-blue-600 border-blue-400 text-white shadow-blue-900/50 hover:bg-blue-500 hover:shadow-blue-500/50 hover:border-blue-300",
    secondary: "bg-purple-600 border-purple-400 text-white shadow-purple-900/50 hover:bg-purple-500 hover:shadow-purple-500/50 hover:border-purple-300",
    danger: "bg-red-600 border-red-400 text-white shadow-red-900/50 hover:bg-red-500 hover:shadow-red-500/50 hover:border-red-300",
    success: "bg-green-600 border-green-400 text-white shadow-green-900/50 hover:bg-green-500 hover:shadow-green-500/50 hover:border-green-300",
    warning: "bg-orange-500 border-orange-300 text-white shadow-orange-800/50 hover:bg-orange-400 hover:shadow-orange-400/50",
    outline: "bg-slate-800 border-slate-500 text-slate-200 hover:bg-slate-700 hover:border-slate-300",
    ghost: "bg-transparent border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200"
  };

  const btnRef = useRef<HTMLButtonElement>(null);
  
  useEffect(() => {
    if (autoFocus && btnRef.current) {
        btnRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <button ref={btnRef} type={type} onClick={onClick} disabled={disabled} className={`${baseStyle} ${sizes[size]} ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}>
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
    </button>
  );
};

const ScreenContainer = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`min-h-screen font-sans text-slate-100 flex flex-col relative ${className}`}>
    <div className="fixed inset-0 z-0 bg-slate-900">
       <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
       <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-slate-900/80"></div>
    </div>
    <div className="relative z-10 flex-1 flex flex-col items-center w-full overflow-y-auto">{children}</div>
  </div>
);

const GuidedKeyboard = ({
  nextLetter,
  onPress,
  highlightNext = true,
  disabled = false,
}: {
  nextLetter: string;
  onPress: (letter: string) => void;
  highlightNext?: boolean;
  disabled?: boolean;
}) => {
  const keyboardRows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

  return (
    <div className="guided-keyboard space-y-1.5 rounded-xl border border-slate-600 bg-slate-950/72 p-2 sm:space-y-2 sm:p-3">
      {keyboardRows.map(row => (
        <div key={row} className="guided-keyboard-row flex justify-center gap-1 sm:gap-1.5">
          {[...row].map(letter => {
            const isNext = highlightNext && letter === nextLetter;
            return (
              <button
                key={letter}
                type="button"
                disabled={disabled}
                onClick={() => onPress(letter)}
                aria-label={`${letter.toUpperCase()}のキー`}
                className={`guided-keyboard-key flex h-10 w-[clamp(1.7rem,7.6vw,2.75rem)] items-center justify-center rounded-md border text-sm font-black uppercase text-white transition sm:h-11 sm:text-base ${isNext ? 'scale-105 border-amber-100 bg-amber-400 text-slate-950 shadow-[0_0_18px_rgba(251,191,36,0.68)]' : TYPING_FINGER_KEY_CLASSES[letter] ?? 'border-slate-500 bg-slate-800'} ${disabled ? 'cursor-not-allowed opacity-55' : 'active:scale-95'}`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

type BeginnerBattleSavedProgress = {
  questionIndex: number;
  input: string;
};

const loadBeginnerBattleProgress = (): BeginnerBattleSavedProgress => {
  const fallback: BeginnerBattleSavedProgress = { questionIndex: 0, input: '' };
  const saved = safeLoadJson<unknown>(STORAGE_KEYS.beginnerBattleProgress, fallback);
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return fallback;
  const candidate = saved as Partial<BeginnerBattleSavedProgress>;
  const questionIndex = Number.isFinite(candidate.questionIndex)
    ? Math.min(Math.max(0, Math.floor(Number(candidate.questionIndex))), BEGINNER_BATTLE_QUESTIONS.length - 1)
    : 0;
  const question = BEGINNER_BATTLE_QUESTIONS[questionIndex];
  const input = typeof candidate.input === 'string' && question.text.startsWith(candidate.input.toLowerCase())
    ? candidate.input.toLowerCase()
    : '';
  return { questionIndex, input };
};

const saveBeginnerBattleProgress = (questionIndex: number, input: string = '') => {
  localStorage.setItem(STORAGE_KEYS.beginnerBattleProgress, JSON.stringify({ questionIndex, input }));
};

const clearBeginnerBattleProgress = () => {
  localStorage.removeItem(STORAGE_KEYS.beginnerBattleProgress);
};

const Box = ({ children, className = "", title }: { children: React.ReactNode; className?: string; title?: React.ReactNode }) => (
  <div className={`bg-slate-800/90 border-2 border-slate-600 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm ${className}`}>
    {title && (<div className="bg-slate-700/80 px-4 py-2 border-b border-slate-600 font-bold text-slate-200 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-400"></div>{title}</div>)}
    <div className="p-6">{children}</div>
  </div>
);

type QuestionListRowProps = {
  question: Question;
  idx: number;
  displayIndex: number;
  questionKey: string;
  isWeakQuestion: boolean;
  stats?: WeakQuestionStat;
  manualStatus: ManualQuestionStatus;
  isSelectedForAutoPlay: boolean;
  isMarkedForReview: boolean;
  example?: string | null;
  synonyms: string[];
  onSpeak: (text: string) => void;
  onToggleSelected: (question: Question) => void;
  onToggleMarked: (question: Question) => void;
  onUpdateManualLevel: (question: Question, level: LearningLevel) => void;
  onToggleExcluded: (question: Question) => void;
};

const QuestionListRow = React.memo(function QuestionListRow({
  question,
  idx,
  displayIndex,
  questionKey,
  isWeakQuestion,
  stats,
  manualStatus,
  isSelectedForAutoPlay,
  isMarkedForReview,
  example,
  synonyms,
  onSpeak,
  onToggleSelected,
  onToggleMarked,
  onUpdateManualLevel,
  onToggleExcluded,
}: QuestionListRowProps) {
  const learningLabel = manualStatus.learningLevel === 1 ? '学習中' : manualStatus.learningLevel === 2 ? 'もう少し' : '覚えた';
  const autoLabel = manualStatus.battleLevel === 1 ? '学習中' : manualStatus.battleLevel === 2 ? 'もう少し' : '覚えた';
  const isManualOverrideActive = manualStatus.manualOverrideLevel !== null;

  return (
    <div key={`${questionKey}-${idx}`} className={`p-3 rounded-lg border transition-colors group ${manualStatus.excluded ? 'bg-slate-950/80 border-slate-600 opacity-85' : isWeakQuestion ? 'bg-orange-950/40 border-orange-500/40 hover:border-orange-400/70' : 'bg-slate-900/50 border-slate-700 hover:border-blue-500/50'}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4 min-w-0">
          <div className="mt-1 min-w-[2.75rem] rounded-full border border-slate-600 bg-slate-900/80 px-2 py-1 text-center font-mono text-[11px] font-bold tracking-[0.18em] text-slate-400">
            {String(displayIndex).padStart(3, '0')}
          </div>
          <label className="mt-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-cyan-500/40 bg-cyan-950/40 text-cyan-100 transition-colors hover:bg-cyan-900/40">
            <input
              type="checkbox"
              checked={isSelectedForAutoPlay}
              onChange={() => onToggleSelected(question)}
              className="h-4 w-4 rounded border-slate-500 bg-slate-900 text-cyan-400"
            />
          </label>
          <button onClick={() => onSpeak(question.text)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-blue-600 hover:text-white transition-colors flex-shrink-0"><Volume2 size={16} /></button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-lg md:text-xl font-mono text-blue-100 font-bold break-all">{question.text}</span>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] ${manualStatus.learningLevel === 1 ? 'border border-sky-400/35 bg-sky-500/10 text-sky-100' : manualStatus.learningLevel === 2 ? 'border border-emerald-400/35 bg-emerald-500/10 text-emerald-100' : 'border border-violet-400/35 bg-violet-500/10 text-violet-100'}`}>
                {learningLabel}
              </span>
              {isSelectedForAutoPlay && <span className="rounded-full border border-cyan-300/40 bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-cyan-100">選択中</span>}
              {manualStatus.manualOverrideLevel !== null && <span className="rounded-full border border-fuchsia-400/40 bg-fuchsia-500/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-fuchsia-200">手動優先</span>}
              {manualStatus.excluded && <span className="rounded-full border border-slate-400/40 bg-slate-700/70 px-2 py-0.5 text-[10px] font-bold tracking-wide text-slate-200">除外中</span>}
              {isMarkedForReview && <span className="rounded-full border border-yellow-300/45 bg-yellow-500/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-yellow-100">あとで復習</span>}
              {isWeakQuestion && <span className="rounded-full border border-orange-400/40 bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-300">Weak</span>}
              {isWeakQuestion && stats && <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-200">Miss x{stats.missCount}</span>}
              {!isWeakQuestion && stats && <span className="rounded-full border border-slate-500/30 bg-slate-700/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-300">Past Miss x{stats.missCount}</span>}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className={`rounded-2xl border px-4 py-2 text-xl font-black leading-none tracking-[0.08em] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] md:text-2xl ${isManualOverrideActive ? 'border-slate-700 bg-slate-900/60 text-slate-300' : manualStatus.learningLevel === 1 ? 'border-sky-400/30 bg-sky-500/10 text-sky-100' : manualStatus.learningLevel === 2 ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100' : 'border-violet-400/30 bg-violet-500/10 text-violet-100'}`}>
                {learningLabel}
              </span>
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${isManualOverrideActive ? 'border-slate-700 bg-slate-900/70 text-slate-400' : 'border-cyan-400/30 bg-cyan-500/10 text-cyan-100'}`}>
                自動: {autoLabel}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          {question.promptEn && (
            <div className="mb-2 max-w-sm rounded-lg border border-violet-400/25 bg-violet-950/25 px-3 py-2 text-left">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-300">相手</div>
              <div className="mt-1 text-sm font-bold text-violet-50">{question.promptEn}</div>
              {question.promptJa && <div className="mt-0.5 text-[11px] font-medium text-violet-200/75">{question.promptJa}</div>}
            </div>
          )}
          <div className="text-slate-300 font-bold text-sm md:text-base">{question.translation}</div>
          {question.basicMeaning && (
            <div className="mt-0.5 text-[10px] font-medium text-slate-500 md:text-[11px]">
              Basic: {question.basicMeaning}
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 ml-[6.75rem] flex flex-wrap items-center gap-2 md:justify-end">
        <span className="text-[11px] font-bold text-slate-400">手動設定</span>
        {LEARNING_LEVELS.map(level => (
          <button
            key={level}
            onClick={() => onUpdateManualLevel(question, level)}
            className={`rounded-full border px-3 py-1 text-[11px] font-bold transition-colors ${manualStatus.manualOverrideLevel === level ? level === 1 ? 'border-sky-300 bg-sky-500/20 text-sky-100 shadow-[0_0_18px_rgba(56,189,248,0.24)]' : level === 2 ? 'border-emerald-300 bg-emerald-500/20 text-emerald-100 shadow-[0_0_18px_rgba(52,211,153,0.22)]' : 'border-violet-300 bg-violet-500/20 text-violet-100 shadow-[0_0_18px_rgba(167,139,250,0.24)]' : 'border-slate-600 bg-slate-900/70 text-slate-300 hover:border-slate-500 hover:text-white'}`}
          >
            {level === 1 ? '学習中' : level === 2 ? 'もう少し' : '覚えた'}
          </button>
        ))}
        <button
          onClick={() => onToggleMarked(question)}
          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-bold transition-colors ${isMarkedForReview ? 'border-yellow-300 bg-yellow-500/20 text-yellow-100 shadow-[0_0_18px_rgba(250,204,21,0.2)]' : 'border-slate-600 bg-slate-900/70 text-slate-300 hover:border-yellow-400/60 hover:text-yellow-100'}`}
        >
          <Bookmark size={12} fill={isMarkedForReview ? 'currentColor' : 'none'} />
          {isMarkedForReview ? '復習から外す' : 'あとで復習'}
        </button>
        <button
          onClick={() => onToggleExcluded(question)}
          className={`rounded-full border px-3 py-1 text-[11px] font-bold transition-colors ${manualStatus.excluded ? 'border-slate-300 bg-slate-200 text-slate-900' : 'border-slate-600 bg-slate-900/70 text-slate-300 hover:border-slate-500 hover:text-white'}`}
        >
          {manualStatus.excluded ? '除外を解除' : '除外する'}
        </button>
      </div>
      {example && (
        <div className="mt-3 ml-[6.75rem] rounded-lg border border-slate-700/80 bg-slate-950/70 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">Example</p>
          <p className="mt-1 text-xs md:text-sm text-slate-200">{example}</p>
        </div>
      )}
      {question.speakingTip && (
        <div className="mt-2 ml-[6.75rem] text-xs font-semibold text-amber-100/90">
          <span className="text-amber-300">話すコツ:</span> {question.speakingTip}
        </div>
      )}
      {synonyms.length > 0 && (
        <div className="mt-2 ml-[6.75rem] text-xs font-semibold text-cyan-100/90">
          <span className="text-cyan-300">類義/関連:</span> {synonyms.join(' / ')}
        </div>
      )}
    </div>
  );
});

// --- Main App ---
export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const savedCourse = getStoredCourseSelection();
    return {
    screen: 'title',
    selectedDifficulty: savedCourse.difficulty,
    selectedLevel: savedCourse.level,
    mode: savedCourse.resumeMode,
    inputMode: savedCourse.resumeInputMode,
    currentMonsterIndex: 0,
    currentMonsterList: [],
    challengeModeIndices: [],
    monsterHp: 100,
    maxMonsterHp: 100,
    score: 0,
    combo: 0,
    currentQuestion: { text: "", translation: "" },
    userInput: "",
    startTime: null,
    history: [],
    questionCount: 0,
    maxQuestions: 10,
    battleResult: null,
    totalMonstersInStage: 10,
    defeatedMonsterIds: [], 
    isNewRecord: false,
    missCount: 0,
    totalKeystrokes: 0,
    hintLength: 0,
    currentBattleMissedQuestions: [],
    battleLog: [],
    battleStartScore: 0,
    battleStartKeystrokes: 0,
    bossStage: 0,
    };
  });
  const [resumeMode, setResumeMode] = useState<Extract<Mode, 'guide' | 'challenge'>>(() => getStoredCourseSelection().resumeMode);
  const [resumeInputMode, setResumeInputMode] = useState<InputMode>(() => getStoredCourseSelection().resumeInputMode);

  const [bestScores, setBestScores] = useState<Record<string, number>>({});
  const [typingPracticeIndex, setTypingPracticeIndex] = useState(0);
  const [typingPracticeInput, setTypingPracticeInput] = useState('');
  const [typingPracticeMisses, setTypingPracticeMisses] = useState(0);
  const [showFirstPlayGuide, setShowFirstPlayGuide] = useState(false);
  const [beginnerBattleIndex, setBeginnerBattleIndex] = useState(0);
  const [beginnerBattleInput, setBeginnerBattleInput] = useState('');
  const [beginnerBattleKeyHintsEnabled, setBeginnerBattleKeyHintsEnabled] = useState(true);
  const [beginnerBattleMessage, setBeginnerBattleMessage] = useState('');
  const [beginnerBattleResolving, setBeginnerBattleResolving] = useState(false);
  const [beginnerBattleClearedPhase, setBeginnerBattleClearedPhase] = useState<number | null>(null);
  const [versusBestScores, setVersusBestScores] = useState<Record<string, number>>(() => safeLoadJson<Record<string, number>>(STORAGE_KEYS.versusBestScores, {}));
  const [versusRankings, setVersusRankings] = useState<Record<string, VersusRankingEntry[]>>(() => normalizeVersusRankings(safeLoadJson<unknown>(STORAGE_KEYS.versusRankings, {})));
  const [maxKeystrokes, setMaxKeystrokes] = useState<number>(0);
  const [weakQuestions, setWeakQuestions] = useState<Question[]>([]); 
  const [weakQuestionStats, setWeakQuestionStats] = useState<Record<string, WeakQuestionStat>>({});
  const [manualQuestionStatuses, setManualQuestionStatuses] = useState<Record<string, ManualQuestionStatus>>({});
  const [dailyProgress, setDailyProgress] = useState<DailyProgress>(createDailyProgress());
  const [bgmVolumeLevel, setBgmVolumeLevel] = useState<number>(3);
  const [allSpeechVoices, setAllSpeechVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speechVoices, setSpeechVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speechVoiceMode, setSpeechVoiceMode] = useState<SpeechVoiceMode>('us_female');
  const [speechRatePercent, setSpeechRatePercent] = useState<number>(100);
  const [translationBattleCorrectSpeechEnabled, setTranslationBattleCorrectSpeechEnabled] = useState(true);
  const [autoPlaySettings, setAutoPlaySettings] = useState<AutoPlaySettings>(getDefaultAutoPlaySettings());
  const [selectedQuestionKeysByScope, setSelectedQuestionKeysByScope] = useState<Record<string, string[]>>({});
  const [markedQuestionKeysByScope, setMarkedQuestionKeysByScope] = useState<Record<string, string[]>>({});
  const [savedSelectionLists, setSavedSelectionLists] = useState<SavedSelectionList[]>([]);
  const [selectionListName, setSelectionListName] = useState('');
  const [playerProfiles, setPlayerProfiles] = useState<PlayerProfile[]>([]);
  const [activePlayerId, setActivePlayerId] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [playerNameDrafts, setPlayerNameDrafts] = useState<Record<string, string>>({});
  const [settingsFocusSection, setSettingsFocusSection] = useState<'progress-transfer' | 'player-profiles' | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [autoPlayStatusText, setAutoPlayStatusText] = useState('待機中');
  const sessionWeakQuestionsRef = useRef<Question[] | null>(null);
  const [autoPlayNowPlaying, setAutoPlayNowPlaying] = useState<AutoPlayNowPlaying | null>(null);
  const [bookLevel, setBookLevel] = useState<Level>(1);
  const [bookDifficulty, setBookDifficulty] = useState<Difficulty>('Eiken5');
  const [, setShake] = useState(false);
  const [flash, setFlash] = useState(false);
  const [monsterShake, setMonsterShake] = useState(false); 
  const [scoreViewDiff, setScoreViewDiff] = useState<Difficulty>('Eiken5');
  const [questionListFilter, setQuestionListFilter] = useState<'all' | 'weak' | 'marked'>('all');
  const [weakListSort, setWeakListSort] = useState<'recent' | 'frequent'>('recent');
  const [questionListRenderLimit, setQuestionListRenderLimit] = useState(DEFAULT_QUESTION_LIST_RENDER_LIMIT);
  const [wordListToolsOpen, setWordListToolsOpen] = useState(false);
  const [weakReviewPanelOpen, setWeakReviewPanelOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [lastSolvedQuestion, setLastSolvedQuestion] = useState<Question | null>(null);
  const [showBossIntro, setShowBossIntro] = useState(false);
  const [progressTransferStatus, setProgressTransferStatus] = useState('');
  const [versusNameDrafts, setVersusNameDrafts] = useState(['プレイヤー1', 'プレイヤー2']);
  const [versusScoreMultipliers, setVersusScoreMultipliers] = useState<number[]>([1, 1]);
  const [versusCourseSelections, setVersusCourseSelections] = useState<VersusCourseSelection[]>([
    DEFAULT_VERSUS_COURSE_SELECTION,
    DEFAULT_VERSUS_COURSE_SELECTION,
  ]);
  const [versusPromptSelection, setVersusPromptSelection] = useState<VersusPromptSelection>('spelling');
  const [versusPlayers, setVersusPlayers] = useState<VersusPlayer[]>([]);
  const [versusQuestionOrders, setVersusQuestionOrders] = useState<VersusQuestion[][]>([]);
  const [versusPlayerIndex, setVersusPlayerIndex] = useState(0);
  const [versusQuestionIndex, setVersusQuestionIndex] = useState(0);
  const [versusInput, setVersusInput] = useState('');
  const [versusQuestionMisses, setVersusQuestionMisses] = useState(0);
  const [versusHintLength, setVersusHintLength] = useState(0);
  const [versusQuestionStartedAt, setVersusQuestionStartedAt] = useState<number | null>(null);
  const [versusShowHandoff, setVersusShowHandoff] = useState(true);
  const [versusSetupError, setVersusSetupError] = useState('');
  const [versusBestScoreKey, setVersusBestScoreKey] = useState('');
  const [versusPreviousBestScore, setVersusPreviousBestScore] = useState(0);
  const [versusIsNewBest, setVersusIsNewBest] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const versusInputRef = useRef<HTMLInputElement>(null);
  const typingPracticeInputRef = useRef<HTMLInputElement>(null);
  const beginnerBattleInputRef = useRef<HTMLInputElement>(null);
  const beginnerBattleAdvanceTimeoutRef = useRef<number | null>(null);
  const newPlayerNameInputRef = useRef<HTMLInputElement>(null);
  const progressImportInputRef = useRef<HTMLInputElement>(null);
  const playerProfilesSectionRef = useRef<HTMLDivElement>(null);
  const progressTransferSectionRef = useRef<HTMLDivElement>(null);
  const speechPreviewTimeoutRef = useRef<number | null>(null);
  const autoPlayTimeoutRef = useRef<number | null>(null);
  const autoPlayRunIdRef = useRef(0);
  const autoPlayListCriteriaRef = useRef('');
  const questionPoolRef = useRef<Record<string, QuestionPoolState>>({});
  const reviewQueueRef = useRef<ReviewQueueEntry[]>([]);
  const activeReviewEntryRef = useRef<ReviewQueueEntry | null>(null);
  const recentReviewAppearanceRef = useRef<boolean[]>([]);
  const shownBossIntroKeyRef = useRef<string | null>(null);
  const pendingBattleEndTimeoutRef = useRef<number | null>(null);
  const profilesReadyRef = useRef(false);
  const profileHydratingRef = useRef(false);

  const updateSelectedDifficulty = (difficulty: Difficulty, screen?: GameState['screen']) => {
    setGameState(prev => ({
      ...prev,
      selectedDifficulty: difficulty,
      selectedLevel: getSafeLevelForDifficulty(difficulty, prev.selectedLevel),
      ...(screen ? { screen } : {}),
    }));
  };

  const openPlayerProfileSettings = () => {
    setSettingsFocusSection('player-profiles');
    setGameState(prev => ({ ...prev, screen: 'settings' }));
  };

  const updateBookDifficulty = (difficulty: Difficulty) => {
    setBookDifficulty(difficulty);
    setBookLevel(prev => getSafeLevelForDifficulty(difficulty, prev));
  };

  const persistPlayerProfiles = useCallback((profiles: PlayerProfile[], nextActivePlayerId: string) => {
    localStorage.setItem(STORAGE_KEYS.playerProfiles, JSON.stringify(profiles));
    localStorage.setItem(STORAGE_KEYS.activePlayerId, nextActivePlayerId);
  }, []);

  const readLegacyWorkingSetFromLocalStorage = useCallback((): PlayerProfileData => {
    const savedWeak = normalizeQuestionArray(safeLoadJson<Question[]>(STORAGE_KEYS.weakQuestions, []));
    const savedWeakStats = normalizeWeakQuestionStats(safeLoadJson<Record<string, WeakQuestionStat>>(STORAGE_KEYS.weakQuestionStats, {}));
    const savedManualStatuses = normalizeManualQuestionStatuses(safeLoadJson<Record<string, ManualQuestionStatus>>(STORAGE_KEYS.manualQuestionStatuses, {}));
    const savedReviewQueue = normalizeReviewQueue(safeLoadJson<ReviewQueueEntry[]>(STORAGE_KEYS.reviewQueue, []));
    const savedDailyProgress = normalizeDailyProgress(safeLoadJson<DailyProgress>(STORAGE_KEYS.dailyProgress, createDailyProgress()));
    const savedAutoPlaySettings = normalizeAutoPlaySettings(safeLoadJson<AutoPlaySettings>(STORAGE_KEYS.autoPlaySettings, getDefaultAutoPlaySettings()));
    const savedSelectedQuestionKeysByScope = normalizeSelectedQuestionKeysByScope(safeLoadJson<Record<string, string[]>>(STORAGE_KEYS.selectedQuestionKeysByScope, {}));
    const savedMarkedQuestionKeysByScope = normalizeSelectedQuestionKeysByScope(safeLoadJson<Record<string, string[]>>(STORAGE_KEYS.markedQuestionKeysByScope, {}));
    const savedSelectionLists = normalizeSavedSelectionLists(safeLoadJson<SavedSelectionList[]>(STORAGE_KEYS.savedSelectionLists, []));

    const savedMaxKRaw = localStorage.getItem(STORAGE_KEYS.maxKeystrokes);
    const savedBgmVolumeLevelRaw = localStorage.getItem(STORAGE_KEYS.bgmVolumeLevel);
    const savedSpeechVoiceModeRaw = localStorage.getItem(STORAGE_KEYS.speechVoiceMode);
    const savedSpeechRatePercentRaw = localStorage.getItem(STORAGE_KEYS.speechRatePercent);
    const savedTranslationBattleCorrectSpeechRaw = localStorage.getItem(STORAGE_KEYS.translationBattleCorrectSpeechEnabled);

    return normalizePlayerProfileData({
      defeatedMonsterIds: safeLoadJson<string[]>(STORAGE_KEYS.defeatedMonsters, []),
      bestScores: safeLoadJson<Record<string, number>>(STORAGE_KEYS.bestScores, {}),
      maxKeystrokes: savedMaxKRaw ? parseInt(savedMaxKRaw, 10) : 0,
      weakQuestions: savedWeak,
      weakQuestionStats: savedWeakStats,
      manualQuestionStatuses: savedManualStatuses,
      reviewQueue: savedReviewQueue,
      dailyProgress: savedDailyProgress,
      bgmVolumeLevel: savedBgmVolumeLevelRaw ? parseInt(savedBgmVolumeLevelRaw, 10) : 3,
      speechVoiceMode: savedSpeechVoiceModeRaw ?? 'us_female',
      speechRatePercent: savedSpeechRatePercentRaw ? parseInt(savedSpeechRatePercentRaw, 10) : 100,
      translationBattleCorrectSpeechEnabled: savedTranslationBattleCorrectSpeechRaw === null ? true : savedTranslationBattleCorrectSpeechRaw === 'true',
      autoPlaySettings: savedAutoPlaySettings,
      selectedQuestionKeysByScope: savedSelectedQuestionKeysByScope,
      markedQuestionKeysByScope: savedMarkedQuestionKeysByScope,
      savedSelectionLists,
    });
  }, []);

  const writeProfileDataToWorkingSet = useCallback((data: PlayerProfileData) => {
    const normalizedData = normalizePlayerProfileData(data);
    localStorage.setItem(STORAGE_KEYS.defeatedMonsters, JSON.stringify(normalizedData.defeatedMonsterIds ?? []));
    localStorage.setItem(STORAGE_KEYS.bestScores, JSON.stringify(normalizedData.bestScores ?? {}));
    localStorage.setItem(STORAGE_KEYS.maxKeystrokes, String(normalizedData.maxKeystrokes ?? 0));
    localStorage.setItem(STORAGE_KEYS.weakQuestions, JSON.stringify(normalizedData.weakQuestions ?? []));
    localStorage.setItem(STORAGE_KEYS.weakQuestionStats, JSON.stringify(normalizedData.weakQuestionStats ?? {}));
    localStorage.setItem(STORAGE_KEYS.manualQuestionStatuses, JSON.stringify(normalizedData.manualQuestionStatuses ?? {}));
    localStorage.setItem(STORAGE_KEYS.reviewQueue, JSON.stringify(normalizedData.reviewQueue ?? []));
    localStorage.setItem(STORAGE_KEYS.dailyProgress, JSON.stringify(normalizedData.dailyProgress ?? createDailyProgress()));
    localStorage.setItem(STORAGE_KEYS.bgmVolumeLevel, String(normalizedData.bgmVolumeLevel ?? 3));
    localStorage.setItem(STORAGE_KEYS.speechVoiceMode, normalizedData.speechVoiceMode ?? 'us_female');
    localStorage.setItem(STORAGE_KEYS.speechRatePercent, String(normalizedData.speechRatePercent ?? 100));
    localStorage.setItem(STORAGE_KEYS.translationBattleCorrectSpeechEnabled, String(normalizedData.translationBattleCorrectSpeechEnabled ?? true));
    localStorage.setItem(STORAGE_KEYS.autoPlaySettings, JSON.stringify(normalizedData.autoPlaySettings ?? getDefaultAutoPlaySettings()));
    localStorage.setItem(STORAGE_KEYS.selectedQuestionKeysByScope, JSON.stringify(normalizedData.selectedQuestionKeysByScope ?? {}));
    localStorage.setItem(STORAGE_KEYS.markedQuestionKeysByScope, JSON.stringify(normalizedData.markedQuestionKeysByScope ?? {}));
    localStorage.setItem(STORAGE_KEYS.savedSelectionLists, JSON.stringify(normalizedData.savedSelectionLists ?? []));
  }, []);

  const applyProfileDataToState = useCallback((data: PlayerProfileData) => {
    const normalizedData = normalizePlayerProfileData(data);
    const todayKey = getTodayKey();
    const normalizedReviewQueue = (normalizedData.dailyProgress?.date ?? todayKey) === todayKey
      ? (normalizedData.reviewQueue ?? [])
      : (normalizedData.reviewQueue ?? []).map((entry) => ({ ...entry, remainingQuestions: 0 }));
    const normalizedDailyProgress = (normalizedData.dailyProgress?.date ?? todayKey) === todayKey
      ? normalizedData.dailyProgress ?? createDailyProgress(todayKey)
      : createDailyProgress(todayKey);

    setGameState((prev) => ({
      ...prev,
      defeatedMonsterIds: normalizedData.defeatedMonsterIds ?? [],
    }));
    setBestScores(normalizedData.bestScores ?? {});
    setMaxKeystrokes(normalizedData.maxKeystrokes ?? 0);
    setWeakQuestions(normalizedData.weakQuestions ?? []);
    setWeakQuestionStats(normalizedData.weakQuestionStats ?? {});
    setManualQuestionStatuses(normalizedData.manualQuestionStatuses ?? {});
    reviewQueueRef.current = normalizedReviewQueue;
    setDailyProgress(normalizedDailyProgress);
    setBgmVolumeLevel(normalizedData.bgmVolumeLevel ?? 3);
    setSpeechVoiceMode(normalizedData.speechVoiceMode ?? 'us_female');
    setSpeechRatePercent(normalizedData.speechRatePercent ?? 100);
    setTranslationBattleCorrectSpeechEnabled(normalizedData.translationBattleCorrectSpeechEnabled ?? true);
    setAutoPlaySettings(normalizedData.autoPlaySettings ?? getDefaultAutoPlaySettings());
    setSelectedQuestionKeysByScope(normalizedData.selectedQuestionKeysByScope ?? {});
    setMarkedQuestionKeysByScope(normalizedData.markedQuestionKeysByScope ?? {});
    setSavedSelectionLists(normalizedData.savedSelectionLists ?? []);
  }, []);

  const getCurrentActivePlayer = useCallback(() => (
    playerProfiles.find((profile) => profile.id === activePlayerId) ?? null
  ), [playerProfiles, activePlayerId]);

  const captureCurrentProfileData = useCallback((): PlayerProfileData => normalizePlayerProfileData({
    defeatedMonsterIds: gameState.defeatedMonsterIds,
    bestScores,
    maxKeystrokes,
    weakQuestions,
    weakQuestionStats,
    manualQuestionStatuses,
    reviewQueue: reviewQueueRef.current,
    dailyProgress,
    bgmVolumeLevel,
    speechVoiceMode,
    speechRatePercent,
    translationBattleCorrectSpeechEnabled,
    autoPlaySettings,
    selectedQuestionKeysByScope,
    markedQuestionKeysByScope,
    savedSelectionLists,
  }), [
    gameState.defeatedMonsterIds,
    bestScores,
    maxKeystrokes,
    weakQuestions,
    weakQuestionStats,
    manualQuestionStatuses,
    dailyProgress,
    bgmVolumeLevel,
    speechVoiceMode,
    speechRatePercent,
    translationBattleCorrectSpeechEnabled,
    autoPlaySettings,
    selectedQuestionKeysByScope,
    markedQuestionKeysByScope,
    savedSelectionLists,
  ]);

  useEffect(() => {
    const storedProfiles = normalizePlayerProfiles(safeLoadJson<PlayerProfile[]>(STORAGE_KEYS.playerProfiles, []));
    const storedActivePlayerId = localStorage.getItem(STORAGE_KEYS.activePlayerId) ?? '';

    let nextProfiles = storedProfiles;
    let nextActivePlayerId = storedActivePlayerId;

    if (nextProfiles.length === 0) {
      const initialProfile: PlayerProfile = {
        id: `player-${Date.now()}`,
        name: 'Player 1',
        updatedAt: Date.now(),
        data: readLegacyWorkingSetFromLocalStorage(),
      };
      nextProfiles = [initialProfile];
      nextActivePlayerId = initialProfile.id;
    } else if (!nextProfiles.some((profile) => profile.id === nextActivePlayerId)) {
      nextActivePlayerId = nextProfiles[0].id;
    }

    const activeProfile = nextProfiles.find((profile) => profile.id === nextActivePlayerId) ?? nextProfiles[0];

    profileHydratingRef.current = true;
    writeProfileDataToWorkingSet(activeProfile.data);
    setPlayerProfiles(nextProfiles);
    setActivePlayerId(activeProfile.id);
    persistPlayerProfiles(nextProfiles, activeProfile.id);
    profilesReadyRef.current = true;

    window.setTimeout(() => {
      profileHydratingRef.current = false;
    }, 0);
  }, [persistPlayerProfiles, readLegacyWorkingSetFromLocalStorage, writeProfileDataToWorkingSet]);

  useEffect(() => {
    const safeLevel = getSafeLevelForDifficulty(gameState.selectedDifficulty, gameState.selectedLevel);
    if (safeLevel !== gameState.selectedLevel) {
      setGameState(prev => ({ ...prev, selectedLevel: safeLevel }));
    }
  }, [gameState.selectedDifficulty, gameState.selectedLevel]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.lastSelectedCourse, JSON.stringify({
      difficulty: gameState.selectedDifficulty,
      level: gameState.selectedLevel,
      resumeMode,
      resumeInputMode,
    }));
  }, [gameState.selectedDifficulty, gameState.selectedLevel, resumeMode, resumeInputMode]);

  useEffect(() => {
    const safeBookLevel = getSafeLevelForDifficulty(bookDifficulty, bookLevel);
    if (safeBookLevel !== bookLevel) {
      setBookLevel(safeBookLevel);
    }
  }, [bookDifficulty, bookLevel]);

  useEffect(() => {
    const defeatedMonsterIds = normalizeDefeatedMonsterIds(safeLoadJson<string[]>(STORAGE_KEYS.defeatedMonsters, []));
    const savedScores = safeLoadJson<Record<string, number>>(STORAGE_KEYS.bestScores, {});
    const savedWeak = normalizeQuestionArray(safeLoadJson<Question[]>(STORAGE_KEYS.weakQuestions, []));
    const savedWeakStats = normalizeWeakQuestionStats(safeLoadJson<Record<string, WeakQuestionStat>>(STORAGE_KEYS.weakQuestionStats, {}));
    const savedManualStatuses = normalizeManualQuestionStatuses(safeLoadJson<Record<string, ManualQuestionStatus>>(STORAGE_KEYS.manualQuestionStatuses, {}));
    const savedReviewQueue = normalizeReviewQueue(safeLoadJson<ReviewQueueEntry[]>(STORAGE_KEYS.reviewQueue, []));
    const savedDailyProgress = normalizeDailyProgress(safeLoadJson<DailyProgress>(STORAGE_KEYS.dailyProgress, createDailyProgress()));
    const savedAutoPlaySettings = normalizeAutoPlaySettings(safeLoadJson<AutoPlaySettings>(STORAGE_KEYS.autoPlaySettings, getDefaultAutoPlaySettings()));
    const savedSelectedQuestionKeysByScope = normalizeSelectedQuestionKeysByScope(safeLoadJson<Record<string, string[]>>(STORAGE_KEYS.selectedQuestionKeysByScope, {}));
    const savedMarkedQuestionKeysByScope = normalizeSelectedQuestionKeysByScope(safeLoadJson<Record<string, string[]>>(STORAGE_KEYS.markedQuestionKeysByScope, {}));
    const savedSelectionLists = normalizeSavedSelectionLists(safeLoadJson<SavedSelectionList[]>(STORAGE_KEYS.savedSelectionLists, []));
    const todayKey = getTodayKey();
    const isNewDay = savedDailyProgress.date !== todayKey;
    const normalizedReviewQueue = isNewDay
      ? savedReviewQueue.map(entry => ({ ...entry, remainingQuestions: 0 }))
      : savedReviewQueue;
    const normalizedDailyProgress = savedDailyProgress.date === todayKey
      ? savedDailyProgress
      : createDailyProgress(todayKey);

    if (defeatedMonsterIds.length > 0) {
      setGameState(prev => ({ ...prev, defeatedMonsterIds }));
    }
    localStorage.setItem(STORAGE_KEYS.defeatedMonsters, JSON.stringify(defeatedMonsterIds));
    setBestScores(savedScores);

    const savedMaxK = localStorage.getItem(STORAGE_KEYS.maxKeystrokes);
    if (savedMaxK) {
      const parsedMaxK = parseInt(savedMaxK, 10);
      if (Number.isFinite(parsedMaxK) && parsedMaxK >= 0) {
        setMaxKeystrokes(parsedMaxK);
      } else {
        localStorage.removeItem(STORAGE_KEYS.maxKeystrokes);
      }
    }
    setWeakQuestions(savedWeak);
    setWeakQuestionStats(savedWeakStats);
    setManualQuestionStatuses(savedManualStatuses);
    setAutoPlaySettings(savedAutoPlaySettings);
    setSelectedQuestionKeysByScope(savedSelectedQuestionKeysByScope);
    setMarkedQuestionKeysByScope(savedMarkedQuestionKeysByScope);
    setSavedSelectionLists(savedSelectionLists);
    reviewQueueRef.current = normalizedReviewQueue;
    localStorage.setItem(STORAGE_KEYS.reviewQueue, JSON.stringify(normalizedReviewQueue));
    setDailyProgress(normalizedDailyProgress);
    localStorage.setItem(STORAGE_KEYS.dailyProgress, JSON.stringify(normalizedDailyProgress));

    const savedBgmVolumeLevel = localStorage.getItem(STORAGE_KEYS.bgmVolumeLevel);
    if (savedBgmVolumeLevel) {
      const parsedBgmVolumeLevel = parseInt(savedBgmVolumeLevel, 10);
      if (Number.isFinite(parsedBgmVolumeLevel) && parsedBgmVolumeLevel >= 0 && parsedBgmVolumeLevel < BGM_VOLUME_LEVELS.length) {
        setBgmVolumeLevel(parsedBgmVolumeLevel);
      } else {
        localStorage.removeItem(STORAGE_KEYS.bgmVolumeLevel);
      }
    }

    const savedSpeechVoiceMode = localStorage.getItem(STORAGE_KEYS.speechVoiceMode);
    if (savedSpeechVoiceMode && SPEECH_VOICE_OPTIONS.some(option => option.id === savedSpeechVoiceMode)) {
      setSpeechVoiceMode(savedSpeechVoiceMode as SpeechVoiceMode);
    }

    const savedSpeechRatePercent = localStorage.getItem(STORAGE_KEYS.speechRatePercent);
    if (savedSpeechRatePercent) {
      const parsedSpeechRatePercent = parseInt(savedSpeechRatePercent, 10);
      if (Number.isFinite(parsedSpeechRatePercent) && parsedSpeechRatePercent >= 50 && parsedSpeechRatePercent <= 250) {
        setSpeechRatePercent(parsedSpeechRatePercent);
      } else {
        localStorage.removeItem(STORAGE_KEYS.speechRatePercent);
      }
    }

    const savedTranslationBattleCorrectSpeech = localStorage.getItem(STORAGE_KEYS.translationBattleCorrectSpeechEnabled);
    if (savedTranslationBattleCorrectSpeech !== null) {
      setTranslationBattleCorrectSpeechEnabled(savedTranslationBattleCorrectSpeech === 'true');
    }
  }, []);

  const persistActivePlayerProfile = useCallback((overrideData?: Partial<PlayerProfileData>) => {
    if (!profilesReadyRef.current || !activePlayerId || profileHydratingRef.current) return;

    const baseData = captureCurrentProfileData();
    const nextData = normalizePlayerProfileData({
      ...baseData,
      ...overrideData,
    });

    setPlayerProfiles((prev) => {
      const nextProfiles = prev.map((profile) => (
        profile.id === activePlayerId
          ? { ...profile, updatedAt: Date.now(), data: nextData }
          : profile
      ));
      persistPlayerProfiles(nextProfiles, activePlayerId);
      return nextProfiles;
    });
  }, [activePlayerId, captureCurrentProfileData, persistPlayerProfiles]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.bgmVolumeLevel, bgmVolumeLevel.toString());
    soundEngine.setBattleMusicVolume(BGM_VOLUME_LEVELS[bgmVolumeLevel]);
  }, [bgmVolumeLevel]);

  const getManualQuestionStatus = (difficulty: Difficulty, level: Level, question: Question) => (
    manualQuestionStatuses[getQuestionStatusKey(difficulty, level, question)] ?? getDefaultManualQuestionStatus()
  );

  const isQuestionExcluded = (difficulty: Difficulty, level: Level, question: Question) => (
    getManualQuestionStatus(difficulty, level, question).excluded
  );

  const getScopedPlayableQuestions = (difficulty: Difficulty, level: Level) => (
    (QUESTIONS[difficulty]?.[level] ?? []).filter(question => !isQuestionExcluded(difficulty, level, question))
  );

  const getVersusSpeedBonus = (charsPerSecond: number) => {
    if (charsPerSecond >= 4) return 50;
    if (charsPerSecond >= 3.2) return 40;
    if (charsPerSecond >= 2.4) return 30;
    if (charsPerSecond >= 1.6) return 20;
    if (charsPerSecond >= 0.8) return 10;
    return 0;
  };

  const getAdjustedVersusScore = (player: VersusPlayer) => (
    Math.round(player.score * player.scoreMultiplier)
  );

  const getActiveVersusCourseSelections = () => (
    versusNameDrafts.flatMap((name, index) => (
      name.trim() ? [versusCourseSelections[index] ?? DEFAULT_VERSUS_COURSE_SELECTION] : []
    ))
  );

  const getVersusBestScoreKey = (course: VersusCourseSelection = getActiveVersusCourseSelections()[0] ?? DEFAULT_VERSUS_COURSE_SELECTION) => (
    `${activePlayerId || 'default'}:${course.difficulty}:${course.level}:${versusPromptSelection}`
  );

  const getVersusRankingKey = (courses: VersusCourseSelection[] = getActiveVersusCourseSelections()) => (
    courses.length > 0 && courses.every(course => course.difficulty === courses[0].difficulty && course.level === courses[0].level)
      ? `${courses[0].difficulty}:${courses[0].level}:${versusPromptSelection}`
      : `players:${courses.map(course => `${course.difficulty}:${course.level}`).join('|')}:${versusPromptSelection}`
  );

  const compareVersusRankingEntries = (a: VersusRankingEntry, b: VersusRankingEntry) => (
    b.score - a.score || b.perfectCount - a.perfectCount || a.missCount - b.missCount || a.totalTimeMs - b.totalTimeMs || a.recordedAt - b.recordedAt
  );

  const saveVersusRanking = (completedPlayers: VersusPlayer[]) => {
    const rankingKey = getVersusRankingKey(completedPlayers.map(player => ({ difficulty: player.difficulty, level: player.level })));
    const recordedAt = Date.now();
    setVersusRankings(previousRankings => {
      const bestByName = new Map<string, VersusRankingEntry>();
      [...(previousRankings[rankingKey] ?? []), ...completedPlayers.map(player => ({
        name: player.name,
        score: player.score,
        perfectCount: player.perfectCount,
        missCount: player.missCount,
        totalTimeMs: player.totalTimeMs,
        recordedAt,
      }))].forEach(entry => {
        const currentBest = bestByName.get(entry.name);
        if (!currentBest || compareVersusRankingEntries(entry, currentBest) < 0) bestByName.set(entry.name, entry);
      });
      const nextRankings = {
        ...previousRankings,
        [rankingKey]: [...bestByName.values()].sort(compareVersusRankingEntries).slice(0, VERSUS_RANKING_LIMIT),
      };
      localStorage.setItem(STORAGE_KEYS.versusRankings, JSON.stringify(nextRankings));
      return nextRankings;
    });
  };

  const startVersusMatch = () => {
    const playerDrafts = versusNameDrafts.flatMap((name, index) => {
      const trimmedName = name.trim();
      return trimmedName ? [{
        name: trimmedName,
        scoreMultiplier: versusNameDrafts.length === 1 ? 1 : versusScoreMultipliers[index] ?? 1,
        course: versusCourseSelections[index] ?? DEFAULT_VERSUS_COURSE_SELECTION,
      }] : [];
    });
    if (playerDrafts.length < 1) {
      setVersusSetupError('1人以上の名前を入力してください。');
      return;
    }
    const playerWithoutEnoughQuestions = playerDrafts.find(player => (
      getScopedPlayableQuestions(player.course.difficulty, player.course.level).length < VERSUS_QUESTION_COUNT
    ));
    if (playerWithoutEnoughQuestions) {
      setVersusSetupError(`${playerWithoutEnoughQuestions.name}の教材には、対戦に必要な20問がありません。`);
      return;
    }

    setVersusPlayers(playerDrafts.map((player, index) => ({
      id: `versus-${Date.now()}-${index}`,
      name: player.name,
      difficulty: player.course.difficulty,
      level: player.course.level,
      score: 0,
      scoreMultiplier: player.scoreMultiplier,
      perfectCount: 0,
      missCount: 0,
      totalTimeMs: 0,
    })));
    const sharedQuestionSetsByCourse = new Map<string, VersusQuestion[]>();
    setVersusQuestionOrders(playerDrafts.map(player => {
      const courseKey = `${player.course.difficulty}:${player.course.level}`;
      let sharedQuestionSet = sharedQuestionSetsByCourse.get(courseKey);
      if (!sharedQuestionSet) {
        const questions = shuffleQuestions(getScopedPlayableQuestions(player.course.difficulty, player.course.level)).slice(0, VERSUS_QUESTION_COUNT);
        const mixedPromptModes = shuffleQuestions<VersusPromptMode>(
          Array.from({ length: VERSUS_QUESTION_COUNT }, (_, index) => (
            ['spelling', 'listening', 'translation', 'listening-translation'][index % 4] as VersusPromptMode
          ))
        );
        sharedQuestionSet = questions.map((question, index) => ({
          question,
          promptMode: versusPromptSelection === 'mixed' ? mixedPromptModes[index] : versusPromptSelection,
        }));
        sharedQuestionSetsByCourse.set(courseKey, sharedQuestionSet);
      }
      return shuffleQuestions(sharedQuestionSet);
    }));
    setVersusPlayerIndex(0);
    setVersusQuestionIndex(0);
    setVersusInput('');
    setVersusQuestionMisses(0);
    setVersusHintLength(0);
    setVersusQuestionStartedAt(null);
    setVersusShowHandoff(true);
    setVersusSetupError('');
    const bestScoreKey = getVersusBestScoreKey(playerDrafts[0]?.course);
    setVersusBestScoreKey(bestScoreKey);
    setVersusPreviousBestScore(versusBestScores[bestScoreKey] ?? 0);
    setVersusIsNewBest(false);
    setGameState(prev => ({ ...prev, screen: 'versus-play' }));
  };

  const beginVersusTurn = () => {
    soundEngine.startBattleMusic(getBattleMusicPath('challenge', 'voice-text', false), BGM_VOLUME_LEVELS[bgmVolumeLevel]);
    soundEngine.startBattleAmbience();
    setVersusShowHandoff(false);
    setVersusInput('');
    setVersusQuestionMisses(0);
    setVersusHintLength(0);
    setVersusQuestionStartedAt(Date.now());
  };

  const quitVersusMatch = () => {
    if (!window.confirm('20問バトルを途中でやめますか？\n途中のスコアは保存されません。')) return;
    soundEngine.stopBattleMusic();
    soundEngine.stopBattleAmbience();
    setVersusInput('');
    setVersusQuestionMisses(0);
    setVersusHintLength(0);
    setVersusQuestionStartedAt(null);
    setVersusShowHandoff(true);
    setGameState(prev => ({ ...prev, screen: 'title' }));
  };

  const finishVersusQuestion = (answer: string) => {
    const startedAt = versusQuestionStartedAt ?? Date.now();
    const durationMs = Math.max(Date.now() - startedAt, 100);
    const charsPerSecond = answer.length / (durationMs / 1000);
    const isPerfect = versusQuestionMisses === 0;
    const gainedScore = Math.max(0, 50 + (isPerfect ? 50 : 0) + getVersusSpeedBonus(charsPerSecond) - versusQuestionMisses * 15);
    const isLastQuestion = versusQuestionIndex >= VERSUS_QUESTION_COUNT - 1;
    const isLastPlayer = versusPlayerIndex >= versusPlayers.length - 1;
    const isSoloChallenge = versusPlayers.length === 1;
    const finalSoloScore = (versusPlayers[versusPlayerIndex]?.score ?? 0) + gainedScore;

    const completedPlayers = versusPlayers.map((player, index) => (
      index === versusPlayerIndex
        ? {
            ...player,
            score: player.score + gainedScore,
            perfectCount: player.perfectCount + (isPerfect ? 1 : 0),
            missCount: player.missCount + versusQuestionMisses,
            totalTimeMs: player.totalTimeMs + durationMs,
          }
        : player
    ));
    setVersusPlayers(completedPlayers);

    if (isLastQuestion && isLastPlayer) {
      saveVersusRanking(completedPlayers);
      if (isSoloChallenge && finalSoloScore > versusPreviousBestScore && versusBestScoreKey) {
        setVersusIsNewBest(true);
        setVersusBestScores(previousScores => {
          const nextScores = { ...previousScores, [versusBestScoreKey]: finalSoloScore };
          localStorage.setItem(STORAGE_KEYS.versusBestScores, JSON.stringify(nextScores));
          return nextScores;
        });
      }
      soundEngine.stopBattleAmbience();
      soundEngine.stopBattleMusic();
      soundEngine.playStageClear();
      setGameState(prev => ({ ...prev, screen: 'versus-results' }));
      return;
    }

    if (isLastQuestion) {
      soundEngine.playClear();
      setVersusPlayerIndex(index => index + 1);
      setVersusQuestionIndex(0);
      setVersusShowHandoff(true);
    } else {
      setVersusQuestionIndex(index => index + 1);
    }
    setVersusInput('');
    setVersusQuestionMisses(0);
    setVersusHintLength(0);
    setVersusQuestionStartedAt(Date.now());
  };

  const handleVersusInput = (value: string) => {
    const currentVersusQuestion = versusQuestionOrders[versusPlayerIndex]?.[versusQuestionIndex];
    if (!currentVersusQuestion) return;
    const currentQuestion = currentVersusQuestion.question;
    const normalizedValue = normalizeTypingText(value);
    const normalizedAnswer = normalizeTypingText(currentQuestion.text);
    if (value.length > versusInput.length) soundEngine.playType();
    if (!normalizedAnswer.startsWith(normalizedValue)) {
      soundEngine.playMiss();
      setVersusQuestionMisses(count => count + 1);
      if (currentVersusQuestion.promptMode === 'listening' || currentVersusQuestion.promptMode === 'translation' || currentVersusQuestion.promptMode === 'listening-translation') {
        setVersusHintLength(length => Math.min(length + 1, currentQuestion.text.length));
      }
      setVersusInput(versusInput);
      return;
    }
    setVersusInput(value);
    if (normalizedValue === normalizedAnswer) {
      soundEngine.playAttack();
      finishVersusQuestion(value);
    }
  };

  useEffect(() => {
    if (gameState.screen !== 'versus-play' || versusShowHandoff) return;
    const timeoutId = window.setTimeout(() => versusInputRef.current?.focus(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [gameState.screen, versusShowHandoff, versusPlayerIndex, versusQuestionIndex]);

  const getAutoLearningTrack = (mode: Mode, inputMode: InputMode): 'practice' | 'battle' | null => {
    if (mode === 'guide' || (mode === 'challenge' && inputMode === 'voice-text')) {
      return 'practice';
    }
    if (mode === 'weakness' || (mode === 'challenge' && (inputMode === 'voice-only' || inputMode === 'text-only'))) {
      return 'battle';
    }
    return null;
  };

  const getWeightedLearningLevel = (status: ManualQuestionStatus) => {
    const effectiveLevel = getEffectiveLearningLevel(status);
    if (effectiveLevel === 1) return 6;
    if (effectiveLevel === 2) return 3;
    return 1;
  };

  const getScopedWeakQuestions = (difficulty: Difficulty, level: Level, sourceQuestions: Question[] = weakQuestions) => (
    sourceQuestions.filter(question => (
      (QUESTIONS[difficulty]?.[level] ?? []).some(candidate => (
        candidate.text === question.text && candidate.translation === question.translation
      ))
      && !isQuestionExcluded(difficulty, level, question)
    ))
  );

  const getScopedLearningSummary = (difficulty: Difficulty, level: Level) => {
    const questions = QUESTIONS[difficulty]?.[level] ?? [];
    let learningCount = 0;
    let cautionCount = 0;
    let masteredCount = 0;
    let excludedCount = 0;

    questions.forEach(question => {
      const status = getManualQuestionStatus(difficulty, level, question);
      if (status.excluded) {
        excludedCount += 1;
        return;
      }

      const effectiveLevel = getEffectiveLearningLevel(status);

      if (effectiveLevel === 1) {
        learningCount += 1;
        return;
      }

      if (effectiveLevel === 2) {
        cautionCount += 1;
        return;
      }

      masteredCount += 1;
    });

    return {
      totalCount: questions.length,
      playableCount: questions.length - excludedCount,
      learningCount,
      cautionCount,
      masteredCount,
      excludedCount,
    };
  };

  const updateAutoLearningStatus = (
    difficulty: Difficulty,
    level: Level,
    question: Question,
    outcome: 'success' | 'struggle',
    mode: Mode,
    inputMode: InputMode,
  ) => {
    const track = getAutoLearningTrack(mode, inputMode);
    if (!track) return;

    updateManualQuestionStatus(difficulty, level, question, current => {
      if (track === 'practice') {
        if (outcome !== 'success') return current;
        return {
          ...current,
          practiceLevel: Math.min(3, current.practiceLevel + 1) as LearningLevel,
        };
      }

      if (outcome === 'success') {
        return {
          ...current,
          battleLevel: Math.min(3, current.battleLevel + 1) as LearningLevel,
        };
      }

      return {
        ...current,
        battleLevel: Math.max(1, current.battleLevel - 1) as LearningLevel,
      };
    });
  };

  const persistManualQuestionStatuses = useCallback((nextStatuses: Record<string, ManualQuestionStatus>) => {
    localStorage.setItem(STORAGE_KEYS.manualQuestionStatuses, JSON.stringify(nextStatuses));
  }, []);

  const updateManualQuestionStatus = useCallback((
    difficulty: Difficulty,
    level: Level,
    question: Question,
    updater: (current: ManualQuestionStatus) => ManualQuestionStatus,
  ) => {
    const statusKey = getQuestionStatusKey(difficulty, level, question);
    setManualQuestionStatuses(prev => {
      const current = prev[statusKey] ?? getDefaultManualQuestionStatus();
      const nextStatuses = {
        ...prev,
        [statusKey]: withDerivedLearningLevel({
          ...updater(current),
          updatedAt: Date.now(),
        }),
      };
      persistManualQuestionStatuses(nextStatuses);
      return nextStatuses;
    });
  }, [persistManualQuestionStatuses]);

  const speakWithSettings = useCallback((text: string) => {
      const speechConfig = resolveSpeechConfig(speechVoices, speechVoiceMode);
      speakText(text, {
          voice: speechConfig.voice,
          lang: speechConfig.lang,
          rate: speechRatePercent / 100,
      });
  }, [speechRatePercent, speechVoiceMode, speechVoices]);

  const speakBattleQuestion = useCallback((question: Question, difficulty: Difficulty, mode: Mode) => {
    if (difficulty !== 'Conversation' || !question.promptEn) {
      speakWithSettings(question.text);
      return;
    }

    const speechConfig = resolveSpeechConfig(speechVoices, speechVoiceMode);
    const speechOptions = {
      voice: speechConfig.voice,
      lang: speechConfig.lang,
      rate: speechRatePercent / 100,
    };
    speakText(question.promptEn, {
      ...speechOptions,
      onend: mode === 'guide'
        ? () => speakText(question.text, { ...speechOptions, interrupt: false })
        : undefined,
    });
  }, [speakWithSettings, speechRatePercent, speechVoiceMode, speechVoices]);

  useEffect(() => {
    const currentVersusQuestion = versusQuestionOrders[versusPlayerIndex]?.[versusQuestionIndex];
    if (gameState.screen !== 'versus-play' || versusShowHandoff || (currentVersusQuestion?.promptMode !== 'listening' && currentVersusQuestion?.promptMode !== 'listening-translation')) return;
    speakWithSettings(currentVersusQuestion.question.text);
  }, [gameState.screen, speakWithSettings, versusPlayerIndex, versusQuestionIndex, versusQuestionOrders, versusShowHandoff]);

  const clearAutoPlayTimeout = useCallback(() => {
    if (autoPlayTimeoutRef.current !== null) {
      window.clearTimeout(autoPlayTimeoutRef.current);
      autoPlayTimeoutRef.current = null;
    }
  }, []);

  const clearSpeechPreviewTimeout = useCallback(() => {
    if (speechPreviewTimeoutRef.current !== null) {
      window.clearTimeout(speechPreviewTimeoutRef.current);
      speechPreviewTimeoutRef.current = null;
    }
  }, []);

  const stopAutoPlay = useCallback((statusText: string = '停止しました') => {
    autoPlayRunIdRef.current += 1;
    clearAutoPlayTimeout();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsAutoPlaying(false);
    setAutoPlayNowPlaying(null);
    setAutoPlayStatusText(statusText);
  }, [clearAutoPlayTimeout]);

  const clearPendingBattleEndTimeout = useCallback(() => {
    if (pendingBattleEndTimeoutRef.current !== null) {
      window.clearTimeout(pendingBattleEndTimeoutRef.current);
      pendingBattleEndTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.speechVoiceMode, speechVoiceMode);
  }, [speechVoiceMode]);

  useEffect(() => {
    if (speechVoiceMode === 'random') return;
    if (speechVoices.length === 0) return;
    if (isSpeechModeSelectable(speechVoices, speechVoiceMode)) return;
    setSpeechVoiceMode(isExactSpeechModeSupported(speechVoices, 'us_female') ? 'us_female' : 'random');
  }, [speechVoices, speechVoiceMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.speechRatePercent, speechRatePercent.toString());
  }, [speechRatePercent]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.translationBattleCorrectSpeechEnabled, String(translationBattleCorrectSpeechEnabled));
  }, [translationBattleCorrectSpeechEnabled]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.autoPlaySettings, JSON.stringify(autoPlaySettings));
  }, [autoPlaySettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.selectedQuestionKeysByScope, JSON.stringify(selectedQuestionKeysByScope));
  }, [selectedQuestionKeysByScope]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.markedQuestionKeysByScope, JSON.stringify(markedQuestionKeysByScope));
  }, [markedQuestionKeysByScope]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.savedSelectionLists, JSON.stringify(savedSelectionLists));
  }, [savedSelectionLists]);

  useEffect(() => {
    persistActivePlayerProfile();
  }, [
    persistActivePlayerProfile,
    gameState.defeatedMonsterIds,
    bestScores,
    maxKeystrokes,
    weakQuestions,
    weakQuestionStats,
    manualQuestionStatuses,
    dailyProgress,
    bgmVolumeLevel,
    speechVoiceMode,
    speechRatePercent,
    translationBattleCorrectSpeechEnabled,
    autoPlaySettings,
    selectedQuestionKeysByScope,
    markedQuestionKeysByScope,
    savedSelectionLists,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setAllSpeechVoices([]);
      setSpeechVoices([]);
      return;
    }

    const synth = window.speechSynthesis;
    const loadVoices = () => {
      try {
        const voices = synth.getVoices();
        const englishVoices = voices.filter(isEnglishVoice);
        setAllSpeechVoices(voices);
        setSpeechVoices(englishVoices.length > 0 ? englishVoices : voices);
      } catch (error) {
        console.error('Failed to load speech voices:', error);
        setAllSpeechVoices([]);
        setSpeechVoices([]);
      }
    };

    loadVoices();

    if (typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', loadVoices);
      return () => synth.removeEventListener('voiceschanged', loadVoices);
    }

    const previousHandler = synth.onvoiceschanged;
    synth.onvoiceschanged = loadVoices;
    return () => {
      synth.onvoiceschanged = previousHandler ?? null;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (speechPreviewTimeoutRef.current !== null) {
        window.clearTimeout(speechPreviewTimeoutRef.current);
      }
      if (beginnerBattleAdvanceTimeoutRef.current !== null) {
        window.clearTimeout(beginnerBattleAdvanceTimeoutRef.current);
      }
      clearAutoPlayTimeout();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      soundEngine.stopBattleMusicPreview();
    };
  }, [clearAutoPlayTimeout]);

  useEffect(() => {
    if (gameState.screen === 'settings' || gameState.screen === 'question-list') return;
    clearSpeechPreviewTimeout();
    stopAutoPlay('停止しました');
    soundEngine.stopBattleMusicPreview();
  }, [clearSpeechPreviewTimeout, gameState.screen, stopAutoPlay]);

  useEffect(() => {
    if (gameState.screen !== 'settings') return;
    if (!settingsFocusSection) return;

    const timerId = window.setTimeout(() => {
      const sectionRef = settingsFocusSection === 'player-profiles'
        ? playerProfilesSectionRef.current
        : progressTransferSectionRef.current;
      sectionRef?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setSettingsFocusSection(null);
    }, 60);

    return () => window.clearTimeout(timerId);
  }, [gameState.screen, settingsFocusSection]);

  useEffect(() => {
    const nextCriteria = [
      gameState.screen,
      gameState.selectedDifficulty,
      gameState.selectedLevel,
      questionListFilter,
      weakListSort,
    ].join('|');
    const previousCriteria = autoPlayListCriteriaRef.current;
    autoPlayListCriteriaRef.current = nextCriteria;
    if (!previousCriteria || previousCriteria === nextCriteria) return;

    if (gameState.screen !== 'question-list') return;
    if (!isAutoPlaying) return;
    stopAutoPlay('一覧条件の変更に合わせて停止しました');
  }, [
    isAutoPlaying,
    gameState.screen,
    gameState.selectedDifficulty,
    gameState.selectedLevel,
    questionListFilter,
    stopAutoPlay,
    weakListSort,
  ]);

  useEffect(() => {
    if (gameState.screen !== 'question-list') return;
    setQuestionListRenderLimit(DEFAULT_QUESTION_LIST_RENDER_LIMIT);
  }, [
    gameState.screen,
    gameState.selectedDifficulty,
    gameState.selectedLevel,
    questionListFilter,
    weakListSort,
  ]);

  useEffect(() => {
    if (gameState.screen === 'battle') inputRef.current?.focus();
  }, [gameState.screen, gameState.currentQuestion]);

  useEffect(() => {
    if (gameState.screen !== 'battle' && gameState.screen !== 'versus-play') {
      setShowBossIntro(false);
      return;
    }

    if (gameState.bossStage === 0) return;

    const introKey = [
      gameState.selectedDifficulty,
      gameState.selectedLevel,
      gameState.mode,
      gameState.inputMode,
      gameState.currentMonsterIndex,
      gameState.bossStage,
    ].join(':');

    if (shownBossIntroKeyRef.current === introKey) return;
    shownBossIntroKeyRef.current = introKey;
    soundEngine.playBossComeOut();
    setShowBossIntro(true);

    const timer = window.setTimeout(() => {
      setShowBossIntro(false);
    }, 950);

    return () => window.clearTimeout(timer);
  }, [
    gameState.screen,
    gameState.currentMonsterIndex,
    gameState.totalMonstersInStage,
    gameState.bossStage,
    gameState.selectedDifficulty,
    gameState.selectedLevel,
    gameState.mode,
    gameState.inputMode,
  ]);

  useEffect(() => {
    if (gameState.screen !== 'battle' && gameState.screen !== 'beginner-battle') {
      clearPendingBattleEndTimeout();
      soundEngine.stopBattleAmbience();
      soundEngine.stopBattleMusic();
    }
  }, [clearPendingBattleEndTimeout, gameState.screen]);

  useEffect(() => {
    return () => {
      clearPendingBattleEndTimeout();
      soundEngine.stopBattleAmbience();
      soundEngine.stopBattleMusic();
    };
  }, [clearPendingBattleEndTimeout]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (isEditableEventTarget(e.target)) return;
      if (e.key !== 'Escape') return;
      if (showResetConfirm) setShowResetConfirm(false);
      if (showHelp) setShowHelp(false);
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showHelp, showResetConfirm]);
  
  const getJapaneseSpeechVoice = () => (
    allSpeechVoices.find(voice => normalizeVoiceLang(voice.lang).startsWith('ja'))
    ?? null
  );

  const updateSelectedQuestionKeysForScope = (
    difficulty: Difficulty,
    level: Level,
    nextKeys: string[],
  ) => {
    const scopeKey = getReviewScopeKey(difficulty, level);
    setSelectedQuestionKeysByScope(prev => ({
      ...prev,
      [scopeKey]: nextKeys,
    }));
  };

  const toggleSelectedQuestion = (
    difficulty: Difficulty,
    level: Level,
    question: Question,
  ) => {
    const scopeKey = getReviewScopeKey(difficulty, level);
    const questionKey = getQuestionStatusKey(difficulty, level, question);
    setSelectedQuestionKeysByScope(prev => {
      const currentKeys = prev[scopeKey] ?? [];
      const nextKeys = currentKeys.includes(questionKey)
        ? currentKeys.filter(key => key !== questionKey)
        : [...currentKeys, questionKey];

      return {
        ...prev,
        [scopeKey]: nextKeys,
      };
    });
  };

  const toggleMarkedQuestion = (
    difficulty: Difficulty,
    level: Level,
    question: Question,
  ) => {
    const scopeKey = getReviewScopeKey(difficulty, level);
    const questionKey = getQuestionStatusKey(difficulty, level, question);
    setMarkedQuestionKeysByScope(prev => {
      const currentKeys = prev[scopeKey] ?? [];
      const nextKeys = currentKeys.includes(questionKey)
        ? currentKeys.filter(key => key !== questionKey)
        : [...currentKeys, questionKey];

      return {
        ...prev,
        [scopeKey]: nextKeys,
      };
    });
  };

  const saveCurrentSelectionList = (
    difficulty: Difficulty,
    level: Level,
    questionKeys: string[],
    name: string,
  ) => {
    const trimmedName = name.trim();
    if (trimmedName.length === 0 || questionKeys.length === 0) return false;

    const nextList: SavedSelectionList = {
      id: `${difficulty}:${level}:${Date.now()}`,
      name: trimmedName,
      difficulty,
      level,
      questionKeys,
      updatedAt: Date.now(),
    };

    setSavedSelectionLists(prev => (
      [nextList, ...prev.filter(list => !(list.difficulty === difficulty && list.level === level && list.name === trimmedName))]
    ));
    setSelectionListName('');
    return true;
  };

  const applySavedSelectionList = (list: SavedSelectionList) => {
    updateSelectedQuestionKeysForScope(list.difficulty, list.level, list.questionKeys);
    setGameState(prev => ({
      ...prev,
      selectedDifficulty: list.difficulty,
      selectedLevel: list.level,
      screen: 'question-list',
    }));
  };

  const deleteSavedSelectionList = (listId: string) => {
    setSavedSelectionLists(prev => prev.filter(list => list.id !== listId));
  };

  const beginProfileHydration = () => {
    profileHydratingRef.current = true;
    window.setTimeout(() => {
      profileHydratingRef.current = false;
    }, 0);
  };

  const activatePlayerProfile = (profileId: string) => {
    const currentProfile = getCurrentActivePlayer();
    if (currentProfile) {
      const currentSnapshot = captureCurrentProfileData();
      setPlayerProfiles((prev) => {
        const nextProfiles = prev.map((profile) => (
          profile.id === currentProfile.id
            ? { ...profile, updatedAt: Date.now(), data: currentSnapshot }
            : profile
        ));
        persistPlayerProfiles(nextProfiles, profileId);
        return nextProfiles;
      });
    }

    const nextProfile = playerProfiles.find((profile) => profile.id === profileId);
    if (!nextProfile) return;

    beginProfileHydration();
    setActivePlayerId(profileId);
    writeProfileDataToWorkingSet(nextProfile.data);
    applyProfileDataToState(nextProfile.data);
    setProgressTransferStatus(`プレイヤーを切り替えました: ${nextProfile.name}`);
  };

  const createPlayerProfile = () => {
    const trimmedName = newPlayerName.trim();
    if (!trimmedName) return;

    const nextProfile: PlayerProfile = {
      id: `player-${Date.now()}`,
      name: trimmedName,
      updatedAt: Date.now(),
      data: normalizePlayerProfileData({}),
    };

    beginProfileHydration();
    setPlayerProfiles((prev) => {
      const currentProfile = getCurrentActivePlayer();
      const currentSnapshot = captureCurrentProfileData();
      const baseProfiles = currentProfile
        ? prev.map((profile) => (
          profile.id === currentProfile.id
            ? { ...profile, updatedAt: Date.now(), data: currentSnapshot }
            : profile
        ))
        : prev;
      const nextProfiles = [nextProfile, ...baseProfiles];
      persistPlayerProfiles(nextProfiles, nextProfile.id);
      return nextProfiles;
    });
    setActivePlayerId(nextProfile.id);
    writeProfileDataToWorkingSet(nextProfile.data);
    applyProfileDataToState(nextProfile.data);
    setNewPlayerName('');
    setProgressTransferStatus(`新しいプレイヤーを作成しました: ${nextProfile.name}`);
  };

  const handleNewPlayerNameChange = (value: string) => {
    setNewPlayerName(value.slice(0, PLAYER_NAME_MAX_LENGTH));
  };

  const handlePlayerNameDraftChange = (profileId: string, value: string) => {
    setPlayerNameDrafts(prev => ({
      ...prev,
      [profileId]: value.slice(0, PLAYER_NAME_MAX_LENGTH),
    }));
  };

  const renamePlayerProfile = (profileId: string) => {
    const profile = playerProfiles.find(item => item.id === profileId);
    if (!profile) return;

    const trimmedName = (playerNameDrafts[profileId] ?? profile.name).trim();
    if (!trimmedName) {
      setProgressTransferStatus('プレイヤー名を入力してください。');
      return;
    }

    if (trimmedName === profile.name) {
      setPlayerNameDrafts(prev => {
        const { [profileId]: removed, ...rest } = prev;
        void removed;
        return rest;
      });
      return;
    }

    setPlayerProfiles(prev => {
      const nextProfiles = prev.map(item => (
        item.id === profileId
          ? { ...item, name: trimmedName, updatedAt: Date.now() }
          : item
      ));
      persistPlayerProfiles(nextProfiles, activePlayerId);
      return nextProfiles;
    });
    setPlayerNameDrafts(prev => {
      const { [profileId]: removed, ...rest } = prev;
      void removed;
      return rest;
    });
    setProgressTransferStatus(`プレイヤー名を変更しました: ${trimmedName}`);
  };

  const deletePlayerProfile = (profileId: string) => {
    if (playerProfiles.length <= 1) {
      setProgressTransferStatus('最後の1人は削除できません。');
      return;
    }

    const remainingProfiles = playerProfiles.filter((profile) => profile.id !== profileId);
    const nextActiveProfile = remainingProfiles.find((profile) => profile.id === activePlayerId) ?? remainingProfiles[0];

    beginProfileHydration();
    setPlayerProfiles(remainingProfiles);
    setActivePlayerId(nextActiveProfile.id);
    persistPlayerProfiles(remainingProfiles, nextActiveProfile.id);
    writeProfileDataToWorkingSet(nextActiveProfile.data);
    applyProfileDataToState(nextActiveProfile.data);
    setPlayerNameDrafts(prev => {
      const { [profileId]: removed, ...rest } = prev;
      void removed;
      return rest;
    });
    setProgressTransferStatus(`プレイヤーを削除しました。現在のプレイヤー: ${nextActiveProfile.name}`);
  };

  const buildProgressExportPayload = (): ProgressExportPayload => ({
    formatVersion: 2,
    app: 'english-typing-rpg',
    exportedAt: new Date().toISOString(),
    player: {
      id: activePlayerId || `player-${Date.now()}`,
      name: getCurrentActivePlayer()?.name ?? 'Player',
      data: captureCurrentProfileData(),
    },
  });

  const downloadProgressSnapshot = () => {
    try {
      const payload = buildProgressExportPayload();
      const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = payload.exportedAt.replace(/[:.]/g, '-');
      const playerName = (payload.player?.name ?? 'player').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'player';
      link.href = url;
      link.download = `english-typing-rpg-progress-${playerName}-${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setProgressTransferStatus(`学習データを書き出しました: ${payload.player?.name ?? 'Player'}`);
    } catch (error) {
      console.error('Failed to export progress data:', error);
      setProgressTransferStatus('学習データの書き出しに失敗しました。');
    }
  };

  const applyImportedProgressSnapshot = (payload: ProgressExportPayload) => {
    const importedData = payload.data ?? {};
    const todayKey = getTodayKey();
    const defeatedMonsterIds = normalizeDefeatedMonsterIds(importedData.defeatedMonsterIds ?? []);
    const importedBestScores = normalizeBestScores(importedData.bestScores ?? {});
    const importedMaxKeystrokes = normalizeMaxKeystrokes(importedData.maxKeystrokes);
    const importedWeakQuestions = normalizeQuestionArray(importedData.weakQuestions ?? []);
    const importedWeakQuestionStats = normalizeWeakQuestionStats(importedData.weakQuestionStats ?? {});
    const importedManualStatuses = normalizeManualQuestionStatuses(importedData.manualQuestionStatuses ?? {});
    const importedReviewQueue = normalizeReviewQueue(importedData.reviewQueue ?? []);
    const importedDailyProgress = normalizeDailyProgress(importedData.dailyProgress ?? createDailyProgress(todayKey));
    const normalizedReviewQueue = importedDailyProgress.date === todayKey
      ? importedReviewQueue
      : importedReviewQueue.map((entry) => ({ ...entry, remainingQuestions: 0 }));
    const normalizedDailyProgress = importedDailyProgress.date === todayKey
      ? importedDailyProgress
      : createDailyProgress(todayKey);
    const importedBgmVolumeLevel = normalizeBgmVolumeLevel(importedData.bgmVolumeLevel);
    const importedSpeechVoiceMode = normalizeSpeechVoiceMode(importedData.speechVoiceMode);
    const importedSpeechRatePercent = normalizeSpeechRatePercent(importedData.speechRatePercent);
    const importedTranslationBattleCorrectSpeechEnabled = typeof importedData.translationBattleCorrectSpeechEnabled === 'boolean'
      ? importedData.translationBattleCorrectSpeechEnabled
      : true;
    const importedAutoPlaySettings = normalizeAutoPlaySettings(importedData.autoPlaySettings ?? getDefaultAutoPlaySettings());
    const importedSelectedQuestionKeysByScope = normalizeSelectedQuestionKeysByScope(importedData.selectedQuestionKeysByScope ?? {});
    const importedMarkedQuestionKeysByScope = normalizeSelectedQuestionKeysByScope(importedData.markedQuestionKeysByScope ?? {});
    const importedSavedSelectionLists = normalizeSavedSelectionLists(importedData.savedSelectionLists ?? []);

    stopAutoPlay('学習データの読み込みに合わせて停止しました');

    setGameState((prev) => ({
      ...prev,
      defeatedMonsterIds,
    }));
    localStorage.setItem(STORAGE_KEYS.defeatedMonsters, JSON.stringify(defeatedMonsterIds));

    setBestScores(importedBestScores);
    localStorage.setItem(STORAGE_KEYS.bestScores, JSON.stringify(importedBestScores));

    setMaxKeystrokes(importedMaxKeystrokes);
    localStorage.setItem(STORAGE_KEYS.maxKeystrokes, String(importedMaxKeystrokes));

    setWeakQuestions(importedWeakQuestions);
    localStorage.setItem(STORAGE_KEYS.weakQuestions, JSON.stringify(importedWeakQuestions));

    setWeakQuestionStats(importedWeakQuestionStats);
    localStorage.setItem(STORAGE_KEYS.weakQuestionStats, JSON.stringify(importedWeakQuestionStats));

    setManualQuestionStatuses(importedManualStatuses);
    localStorage.setItem(STORAGE_KEYS.manualQuestionStatuses, JSON.stringify(importedManualStatuses));

    reviewQueueRef.current = normalizedReviewQueue;
    localStorage.setItem(STORAGE_KEYS.reviewQueue, JSON.stringify(normalizedReviewQueue));

    setDailyProgress(normalizedDailyProgress);
    localStorage.setItem(STORAGE_KEYS.dailyProgress, JSON.stringify(normalizedDailyProgress));

    setBgmVolumeLevel(importedBgmVolumeLevel);
    localStorage.setItem(STORAGE_KEYS.bgmVolumeLevel, String(importedBgmVolumeLevel));

    setSpeechVoiceMode(importedSpeechVoiceMode);
    localStorage.setItem(STORAGE_KEYS.speechVoiceMode, importedSpeechVoiceMode);

    setSpeechRatePercent(importedSpeechRatePercent);
    localStorage.setItem(STORAGE_KEYS.speechRatePercent, String(importedSpeechRatePercent));

    setTranslationBattleCorrectSpeechEnabled(importedTranslationBattleCorrectSpeechEnabled);
    localStorage.setItem(STORAGE_KEYS.translationBattleCorrectSpeechEnabled, String(importedTranslationBattleCorrectSpeechEnabled));

    setAutoPlaySettings(importedAutoPlaySettings);
    localStorage.setItem(STORAGE_KEYS.autoPlaySettings, JSON.stringify(importedAutoPlaySettings));

    setSelectedQuestionKeysByScope(importedSelectedQuestionKeysByScope);
    localStorage.setItem(STORAGE_KEYS.selectedQuestionKeysByScope, JSON.stringify(importedSelectedQuestionKeysByScope));

    setMarkedQuestionKeysByScope(importedMarkedQuestionKeysByScope);
    localStorage.setItem(STORAGE_KEYS.markedQuestionKeysByScope, JSON.stringify(importedMarkedQuestionKeysByScope));

    setSavedSelectionLists(importedSavedSelectionLists);
    localStorage.setItem(STORAGE_KEYS.savedSelectionLists, JSON.stringify(importedSavedSelectionLists));

    setProgressTransferStatus(`学習データを読み込みました: ${payload.exportedAt}`);
  };

  void applyImportedProgressSnapshot;

  const importPlayerProgressSnapshot = (payload: ProgressExportPayload) => {
    const importedProfile: PlayerProfile = payload.player
      ? {
        id: payload.player.id || `player-${Date.now()}`,
        name: payload.player.name?.trim() || 'Imported Player',
        updatedAt: Date.now(),
        data: normalizePlayerProfileData(payload.player.data ?? {}),
      }
      : {
        id: `player-${Date.now()}`,
        name: 'Imported Player',
        updatedAt: Date.now(),
        data: normalizePlayerProfileData(payload.data ?? {}),
      };

    stopAutoPlay('学習データの読み込みに合わせて停止しました');
    beginProfileHydration();

    setPlayerProfiles((prev) => {
      const currentProfile = getCurrentActivePlayer();
      const currentSnapshot = captureCurrentProfileData();
      const baseProfiles = currentProfile
        ? prev.map((profile) => (
          profile.id === currentProfile.id
            ? { ...profile, updatedAt: Date.now(), data: currentSnapshot }
            : profile
        ))
        : prev;
      const exists = baseProfiles.some((profile) => profile.id === importedProfile.id);
      const nextProfiles = exists
        ? baseProfiles.map((profile) => (profile.id === importedProfile.id ? importedProfile : profile))
        : [importedProfile, ...baseProfiles];
      persistPlayerProfiles(nextProfiles, importedProfile.id);
      return nextProfiles;
    });

    setActivePlayerId(importedProfile.id);
    writeProfileDataToWorkingSet(importedProfile.data);
    applyProfileDataToState(importedProfile.data);
    setProgressTransferStatus(`学習データを読み込みました: ${importedProfile.name}`);
  };

  const handleImportProgressFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!isProgressExportPayload(parsed)) {
        setProgressTransferStatus('対応していない学習データです。');
        return;
      }

      importPlayerProgressSnapshot(parsed);
    } catch (error) {
      console.error('Failed to import progress data:', error);
      setProgressTransferStatus('学習データの読み込みに失敗しました。');
    }
  };

  const openProgressImportPicker = () => {
    progressImportInputRef.current?.click();
  };

  const playSpeechPreview = (voiceMode: SpeechVoiceMode, ratePercent: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    clearSpeechPreviewTimeout();
    const speechConfig = resolveSpeechConfig(speechVoices, voiceMode);
    speakText(SETTINGS_SPEECH_PREVIEW_TEXT, {
      voice: speechConfig.voice,
      lang: speechConfig.lang,
      rate: ratePercent / 100,
    });
  };

  const scheduleSpeechPreview = (voiceMode: SpeechVoiceMode, ratePercent: number, delayMs: number = 250) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    clearSpeechPreviewTimeout();
    speechPreviewTimeoutRef.current = window.setTimeout(() => {
      speechPreviewTimeoutRef.current = null;
      playSpeechPreview(voiceMode, ratePercent);
    }, delayMs);
  };

  const handleBgmVolumeSelect = (level: number) => {
    setBgmVolumeLevel(level);
    if (level === 0) {
      soundEngine.stopBattleMusicPreview();
      return;
    }
    soundEngine.playBattleMusicPreview(SETTINGS_BGM_PREVIEW_TRACK, BGM_VOLUME_LEVELS[level]);
  };

  const handleSpeechVoiceSelect = (voiceMode: SpeechVoiceMode) => {
    if (!isSpeechModeSelectable(speechVoices, voiceMode)) {
      return;
    }
    setSpeechVoiceMode(voiceMode);
    playSpeechPreview(voiceMode, speechRatePercent);
  };

  const handleSpeechRateChange = (nextRatePercent: number) => {
    setSpeechRatePercent(nextRatePercent);
    scheduleSpeechPreview(speechVoiceMode, nextRatePercent);
  };

  const speakCurrentQuestion = useCallback(() => {
      if (!gameState.currentQuestion.text) return;
      speakBattleQuestion(gameState.currentQuestion, gameState.selectedDifficulty, gameState.mode);
      setTimeout(() => inputRef.current?.focus(), 10);
  }, [gameState.currentQuestion, gameState.mode, gameState.selectedDifficulty, speakBattleQuestion]);

  const saveDefeatedMonster = (monsterId: string) => {
    setGameState(prev => {
      const uniqueKey = getUniqueKey(prev.selectedDifficulty, prev.selectedLevel, prev.mode, prev.inputMode, monsterId);
      if (matchesDefeatedMonster(prev.defeatedMonsterIds, prev.selectedDifficulty, prev.selectedLevel, prev.mode, prev.inputMode, monsterId)) {
        return prev;
      }
      const newIds = [...prev.defeatedMonsterIds, uniqueKey];
      localStorage.setItem(STORAGE_KEYS.defeatedMonsters, JSON.stringify(newIds));
      return { ...prev, defeatedMonsterIds: newIds };
    });
  };

  const saveWeakQuestions = (newMissed: Question[]) => {
      if (newMissed.length === 0) return;
      const updatedWeak = [...weakQuestions];
      newMissed.forEach(q => {
          if (!updatedWeak.some(wq => wq.text === q.text)) { updatedWeak.push(q); }
      });
      setWeakQuestions(updatedWeak);
      localStorage.setItem(STORAGE_KEYS.weakQuestions, JSON.stringify(updatedWeak));
      recordWeakQuestionStats(newMissed);
  };

  const incrementDailyQuestionCount = () => {
    const todayKey = getTodayKey();
    setDailyProgress(prev => {
      const base = prev.date === todayKey ? prev : createDailyProgress(todayKey);
      const nextProgress = {
        ...base,
        questionCount: base.questionCount + 1,
      };
      localStorage.setItem(STORAGE_KEYS.dailyProgress, JSON.stringify(nextProgress));
      return nextProgress;
    });
  };

  const persistReviewQueue = () => {
    localStorage.setItem(STORAGE_KEYS.reviewQueue, JSON.stringify(reviewQueueRef.current));
    persistActivePlayerProfile({ reviewQueue: reviewQueueRef.current });
  };

  const getReviewDelay = (missCount: number) => {
    if (missCount <= 1) return REVIEW_REAPPEAR_DELAY;
    if (missCount === 2) return 4;
    return 3;
  };

  const recordWeakQuestionStats = (questionsToRecord: Question[]) => {
      if (questionsToRecord.length === 0) return;
      const timestamp = Date.now();
      setWeakQuestionStats(prev => {
        const nextStats = { ...prev };
        questionsToRecord.forEach(question => {
          const current = nextStats[question.text] ?? getDefaultWeakQuestionStat();
          nextStats[question.text] = {
            missCount: current.missCount + 1,
            lastMissedAt: timestamp,
            consecutiveCorrect: 0,
          };
        });
        localStorage.setItem(STORAGE_KEYS.weakQuestionStats, JSON.stringify(nextStats));
        return nextStats;
      });
  };

  const recordWeakQuestionSuccess = (question: Question) => {
    const current = weakQuestionStats[question.text] ?? getDefaultWeakQuestionStat();
    const nextStats = {
      ...weakQuestionStats,
      [question.text]: {
        ...current,
        consecutiveCorrect: current.consecutiveCorrect + 1,
      },
    };

    setWeakQuestionStats(nextStats);
    localStorage.setItem(STORAGE_KEYS.weakQuestionStats, JSON.stringify(nextStats));

    const isMastered = nextStats[question.text].consecutiveCorrect >= 2;
    if (!isMastered) return false;

    if (weakQuestions.some(q => q.text === question.text)) {
      const updatedWeak = weakQuestions.filter(q => q.text !== question.text);
      setWeakQuestions(updatedWeak);
      localStorage.setItem(STORAGE_KEYS.weakQuestions, JSON.stringify(updatedWeak));
    }

    return true;
  };

  const handleResetHistory = () => {
    setShowResetConfirm(true);
  };

  const confirmResetHistory = () => {
    [
      STORAGE_KEYS.defeatedMonsters,
      STORAGE_KEYS.bestScores,
      STORAGE_KEYS.maxKeystrokes,
      STORAGE_KEYS.weakQuestions,
      STORAGE_KEYS.weakQuestionStats,
      STORAGE_KEYS.manualQuestionStatuses,
      STORAGE_KEYS.reviewQueue,
      STORAGE_KEYS.dailyProgress,
      STORAGE_KEYS.bgmVolumeLevel,
      STORAGE_KEYS.speechVoiceMode,
      STORAGE_KEYS.speechRatePercent,
      STORAGE_KEYS.autoPlaySettings,
      STORAGE_KEYS.selectedQuestionKeysByScope,
      STORAGE_KEYS.markedQuestionKeysByScope,
      STORAGE_KEYS.savedSelectionLists,
      STORAGE_KEYS.beginnerBattleProgress,
    ].forEach(key => localStorage.removeItem(key));
    setBestScores({});
    setMaxKeystrokes(0);
    setWeakQuestions([]);
    setWeakQuestionStats({});
    setManualQuestionStatuses({});
    setMarkedQuestionKeysByScope({});
    setDailyProgress(createDailyProgress());
    reviewQueueRef.current = [];
    activeReviewEntryRef.current = null;
    setShowResetConfirm(false);
    setGameState(prev => ({
      ...prev,
      defeatedMonsterIds: [],
      score: 0,
      history: [],
      battleResult: null,
      isNewRecord: false,
      missCount: 0,
      totalKeystrokes: 0,
      hintLength: 0,
      currentBattleMissedQuestions: [],
      battleLog: [],
      battleStartScore: 0,
      battleStartKeystrokes: 0,
    }));
    setProgressTransferStatus('現在のプレイヤーの学習データをリセットしました。');
  };

  const handleGameEnd = (result: BattleResult, finalScore: number, history: BattleHistoryItem[], diff: Difficulty, level: Level, mode: Mode, finalKeystrokes: number, missedQs: Question[], finalBattleLog?: BattleLogItem[], playWinSound: boolean = true) => {
      clearPendingBattleEndTimeout();
      soundEngine.stopBattleAmbience();
      soundEngine.stopBattleMusic();
      const key = `${diff}_${level}_${mode}`;
      const currentBest = bestScores[key] || 0;
      let isNewRecord = false;

      if (mode !== 'weakness') {
        if (result === 'win' && finalScore > currentBest) {
            isNewRecord = true;
            const newScores = { ...bestScores, [key]: finalScore };
            setBestScores(newScores);
            localStorage.setItem(STORAGE_KEYS.bestScores, JSON.stringify(newScores));
            if (playWinSound) soundEngine.playNewRecord();
        } else if (result === 'win') {
            if (playWinSound) soundEngine.playClear();
        } else {
            soundEngine.playFail();
        }
        if (finalKeystrokes > maxKeystrokes) {
            setMaxKeystrokes(finalKeystrokes);
            localStorage.setItem(STORAGE_KEYS.maxKeystrokes, finalKeystrokes.toString());
        }
      } else {
          if (result === 'win' && playWinSound) soundEngine.playClear();
          else soundEngine.playFail();
      }
      saveWeakQuestions(missedQs);
      setGameState(prev => ({
        ...prev,
        screen: 'result',
        battleResult: result,
        score: finalScore,
        history: history,
        isNewRecord: isNewRecord,
        missCount: 0,
        hintLength: 0,
        totalKeystrokes: finalKeystrokes,
        currentBattleMissedQuestions: missedQs,
        battleLog: finalBattleLog ?? prev.battleLog,
      }));
  };

  const openWeakReviewHub = () => {
    setQuestionListFilter('weak');
    setWeakListSort('recent');
    setGameState(prev => ({ ...prev, screen: 'question-list' }));
  };

  const startGame = (diff: Difficulty, level: Level, mode: Mode, inputMode: InputMode, reviewQuestions?: Question[] | null) => {
    const monstersObj = MONSTERS[level];
    const guideTargetCount = getGuideTargetCount(diff, level);
    const listeningTargetCount = getListeningTargetCount(diff, level);
    let selectedList: Monster[] = [];
    let indices: number[] = [];
    let totalStageMonsters = 0;
    const playableQuestions = getScopedPlayableQuestions(diff, level);

    if (playableQuestions.length === 0) {
      alert("この範囲で出題できる問題がありません。除外を見直してください。");
      return;
    }

    if (mode === 'guide' || mode === 'challenge') {
      setResumeMode(mode);
      setResumeInputMode(mode === 'guide' ? 'voice-text' : inputMode);
    }

    sessionWeakQuestionsRef.current = reviewQuestions && reviewQuestions.length > 0
      ? reviewQuestions.filter(question => !isQuestionExcluded(diff, level, question))
      : null;
    activeReviewEntryRef.current = null;

    const getOrderedStageIndices = (list: Monster[], countToSelect: number, rangeLimit: number = list.length) => {
        const cappedRange = Math.min(rangeLimit, list.length);
        const cappedCount = Math.min(countToSelect, cappedRange);
        return Array.from({ length: cappedCount }, (_, index) => index);
    };

    if (mode === 'guide') {
      selectedList = monstersObj.guide;
      indices = getBattleStageIndices(selectedList, getOrderedStageIndices(selectedList, guideTargetCount, guideTargetCount).length, mode, inputMode);
      totalStageMonsters = indices.length;
    } else if (mode === 'weakness') {
        const activeWeakQuestions = sessionWeakQuestionsRef.current ?? getScopedWeakQuestions(diff, level);
        if (activeWeakQuestions.length === 0) { alert("まだ苦手な単語がありません！"); return; }
        selectedList = monstersObj.guide; 
        const count = Math.min(activeWeakQuestions.length, 10);
        indices = Array.from({length: count}, (_, i) => i % selectedList.length);
        totalStageMonsters = count;
    } else {
      if (inputMode === 'voice-text') {
        selectedList = monstersObj.guide;
        indices = getBattleStageIndices(selectedList, getOrderedStageIndices(selectedList, listeningTargetCount, listeningTargetCount).length, mode, inputMode);
        totalStageMonsters = indices.length;
      } else if (inputMode === 'voice-only') {
        selectedList = monstersObj.challenge;
        indices = getBattleStageIndices(selectedList, getOrderedStageIndices(selectedList, NORMAL_TARGET_COUNT, NORMAL_TARGET_COUNT).length, mode, inputMode);
        totalStageMonsters = indices.length;
      } else {
        selectedList = monstersObj.challenge;
        indices = getBattleStageIndices(selectedList, getOrderedStageIndices(selectedList, HARD_TARGET_COUNT, HARD_TARGET_COUNT).length, mode, inputMode);
        totalStageMonsters = indices.length;
      }
    }

    let startStep = 0;
    // Resume Training/Challenge from the first undefeated monster.
    // If all target monsters are already defeated, start from the beginning for replay.
    if (mode === 'guide' || mode === 'challenge') {
      const nextUndeatedStep = indices.findIndex(monsterIndex => {
        return !matchesDefeatedMonster(
          gameState.defeatedMonsterIds,
          diff,
          level,
          mode,
          inputMode,
          selectedList[monsterIndex].id
        );
      });

      startStep = nextUndeatedStep >= 0 ? nextUndeatedStep : 0;
    }

    initBattle(diff, level, mode, inputMode, startStep, indices, selectedList, totalStageMonsters, 0, 0);
  };

  const initBattle = (diff: Difficulty, level: Level, mode: Mode, inputMode: InputMode, stepIndex: number, indices: number[], monsterList: Monster[], totalMonsters: number, currentScore: number, currentKeystrokes: number) => {
    clearPendingBattleEndTimeout();
    setLastSolvedQuestion(null);
    recentReviewAppearanceRef.current = [];
    const safeIndices = indices.length > 0 ? indices : [0];
    const safeStepIndex = Math.min(Math.max(stepIndex, 0), safeIndices.length - 1);
    const actualMonsterIndex = safeIndices[safeStepIndex] ?? 0;
    const startingMonster = monsterList[actualMonsterIndex] ?? monsterList[0];
    const bossStage = getBossStage(mode, inputMode, safeStepIndex, totalMonsters);
    const battleTuning = getBattleTuning(diff, level, mode, inputMode, safeStepIndex, startingMonster.baseHp, bossStage);
    const startingMonsterHp = battleTuning.monsterHp;
    const maxQuestions = battleTuning.maxQuestions;
    const useBossBattleMusic = startingMonster?.type === 'boss' || bossStage > 0;
    if (!startingMonster) return;
    soundEngine.stopBattleAmbience();
    soundEngine.stopBattleMusic();
    soundEngine.startBattleMusic(
      getBattleMusicPath(mode, inputMode, useBossBattleMusic),
      BGM_VOLUME_LEVELS[bgmVolumeLevel]
    );
    let question: Question;
    const activeReviewQuestions = sessionWeakQuestionsRef.current;
    if (activeReviewQuestions && activeReviewQuestions.length > 0) {
        question = activeReviewQuestions[Math.floor(Math.random() * activeReviewQuestions.length)];
        activeReviewEntryRef.current = null;
    } else if (mode === 'weakness') {
        const activeWeakQuestions = getScopedWeakQuestions(diff, level);
        if (activeWeakQuestions.length > 0) { question = activeWeakQuestions[Math.floor(Math.random() * activeWeakQuestions.length)]; } 
        else { question = { text: "No Weakness", translation: "苦手なし" }; }
        activeReviewEntryRef.current = null;
    } else {
        question = getNextBattleQuestion(diff, level, null, safeStepIndex, mode);
    }

    setGameState(prev => ({
      ...prev, screen: 'battle', selectedDifficulty: diff, selectedLevel: level, mode: mode, inputMode: inputMode,
      currentMonsterIndex: safeStepIndex, currentMonsterList: monsterList, challengeModeIndices: safeIndices,
      monsterHp: startingMonsterHp, maxMonsterHp: startingMonsterHp, score: currentScore, combo: 0,
      currentQuestion: question, userInput: "", startTime: null, history: [], questionCount: 1, maxQuestions,
      battleResult: null, totalMonstersInStage: totalMonsters, isNewRecord: false, missCount: 0,
      totalKeystrokes: currentKeystrokes, hintLength: 0, currentBattleMissedQuestions: [],
      battleLog: [],
      battleStartScore: currentScore,
      battleStartKeystrokes: currentKeystrokes,
      bossStage,
    }));
  };
  const initBattleRef = useRef(initBattle);
  initBattleRef.current = initBattle;

  // Keyboard support for replaying question audio
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const isRightCtrlKey =
            e.code === 'ControlRight' ||
            (e.key === 'Control' && e.location === KeyboardEvent.DOM_KEY_LOCATION_RIGHT);

        if (gameState.screen === 'battle') {
            if (isRightCtrlKey && !e.repeat) {
                e.preventDefault();
                speakCurrentQuestion();
            }
            return;
        }

        if (gameState.screen === 'versus-play') {
            if (versusShowHandoff && e.key === 'Enter' && !e.repeat) {
                e.preventDefault();
                beginVersusTurn();
                return;
            }
            if (!versusShowHandoff) {
                const currentVersusQuestion = versusQuestionOrders[versusPlayerIndex]?.[versusQuestionIndex];
                if (isRightCtrlKey && !e.repeat && (currentVersusQuestion?.promptMode === 'listening' || currentVersusQuestion?.promptMode === 'listening-translation')) {
                    e.preventDefault();
                    speakWithSettings(currentVersusQuestion.question.text);
                }
            }
            return;
        }

        if (gameState.screen === 'versus-results' && e.key === 'Enter' && !e.repeat) {
            e.preventDefault();
            setGameState(prev => ({ ...prev, screen: 'versus-setup' }));
            return;
        }

        if (isEditableEventTarget(e.target)) return;

        if (gameState.screen === 'result') {
            if (e.key === 'Enter') {
                e.preventDefault();
                // Find primary action button and click it
                if (gameState.battleResult === 'win') {
                    const isNextAvailable = gameState.currentMonsterIndex < gameState.totalMonstersInStage - 1;
                    if (isNextAvailable) {
                         // Next Monster
                         initBattleRef.current(gameState.selectedDifficulty, gameState.selectedLevel, gameState.mode, gameState.inputMode, gameState.currentMonsterIndex + 1, gameState.challengeModeIndices, gameState.currentMonsterList, gameState.totalMonstersInStage, gameState.score, gameState.totalKeystrokes);
                    } else {
                         // Back to Mode Select (Complete)
                         setGameState(prev => ({ ...prev, screen: 'mode-select' }));
                    }
                } else {
                    // Retry
                    initBattleRef.current(gameState.selectedDifficulty, gameState.selectedLevel, gameState.mode, gameState.inputMode, gameState.currentMonsterIndex, gameState.challengeModeIndices, gameState.currentMonsterList, gameState.totalMonstersInStage, gameState.battleStartScore, gameState.battleStartKeystrokes);
                }
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [beginVersusTurn, gameState, speakCurrentQuestion, speakWithSettings, versusPlayerIndex, versusQuestionIndex, versusQuestionOrders, versusShowHandoff]);

  const shuffleIndices = (length: number) => {
    const indices = Array.from({ length }, (_, index) => index);
    for (let i = indices.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  };

  const getQuestionPoolKey = (diff: Difficulty, level: Level) => `${diff}:${level}`;

  const getNextQuestionFromPool = (diff: Difficulty, level: Level): Question => {
    const list = QUESTIONS[diff]?.[level] || [];
    if (list.length === 0) return { text: "No Data", translation: "No questions" };

    const poolKey = getQuestionPoolKey(diff, level);
    const existingPool = questionPoolRef.current[poolKey];
    const shouldRefreshPool =
      !existingPool ||
      existingPool.order.length !== list.length ||
      existingPool.cursor >= existingPool.order.length;

    if (shouldRefreshPool) {
      const order = shuffleIndices(list.length);
      if (existingPool && existingPool.lastIndex !== null && list.length > 1 && order[0] === existingPool.lastIndex) {
        const swapIndex = order.findIndex(index => index !== existingPool.lastIndex);
        if (swapIndex > 0) {
          [order[0], order[swapIndex]] = [order[swapIndex], order[0]];
        }
      }
      questionPoolRef.current[poolKey] = {
        order,
        cursor: 0,
        lastIndex: existingPool?.lastIndex ?? null,
      };
    }

    const pool = questionPoolRef.current[poolKey];
    const nextIndex = pool.order[pool.cursor] ?? 0;
    pool.cursor += 1;
    pool.lastIndex = nextIndex;
    return list[nextIndex] ?? list[0];
  };

  const getRandomQuestion = (diff: Difficulty, level: Level, currentQ: Question | null): Question => {
    const list = QUESTIONS[diff]?.[level] || []; 
    if (list.length === 0) return { text: "No Data", translation: "データがありません" };
    const nextQ = getNextQuestionFromPool(diff, level);
    if (!currentQ || nextQ.text !== currentQ.text) return nextQ;
    return getNextQuestionFromPool(diff, level);
  };

  const getPlayableRandomQuestion = (
    diff: Difficulty,
    level: Level,
    currentQ: Question | null,
    stageIndex: number,
    mode: Mode,
  ): Question => {
    const playableList = getScopedPlayableQuestions(diff, level);
    const curriculumLimit = (
      diff === 'Eiken5' && mode === 'guide' && level === 2
        ? (stageIndex < 7 ? 40 : stageIndex < 14 ? 100 : Infinity)
        : diff === 'Eiken5' && mode === 'guide' && level === 3
          ? (stageIndex < 7 ? 16 : stageIndex < 14 ? 66 : Infinity)
          : diff === 'Eiken4' && mode === 'guide' && level === 2
            ? (stageIndex < 7 ? 45 : stageIndex < 14 ? 110 : Infinity)
            : diff === 'Eiken4' && mode === 'guide' && level === 3
              ? (stageIndex < 7 ? 20 : stageIndex < 14 ? 75 : Infinity)
              : Infinity
    );
    const courseList = curriculumLimit === Infinity
      ? playableList
      : playableList.filter(question => (QUESTIONS[diff]?.[level] ?? []).indexOf(question) < curriculumLimit);
    const list = courseList.length > 0 ? courseList : playableList;
    if (list.length === 0) return { text: "No Data", translation: "出題できる問題がありません" };
    const poolFallback = getRandomQuestion(diff, level, currentQ);
    const candidates = list.filter(question => (
      !currentQ
      || question.text !== currentQ.text
      || question.translation !== currentQ.translation
    ));
    const source = candidates.length > 0 ? candidates : list;
    const weightedList = source.flatMap(question => {
      const status = getManualQuestionStatus(diff, level, question);
      return Array.from({ length: getWeightedLearningLevel(status) }, () => question);
    });

    return weightedList[Math.floor(Math.random() * weightedList.length)] ?? source[0] ?? poolFallback;
  };

  const decrementReviewQueueTimers = () => {
    if (reviewQueueRef.current.length === 0) return;
    reviewQueueRef.current = reviewQueueRef.current.map(entry => ({
      ...entry,
      remainingQuestions: Math.max(0, entry.remainingQuestions - 1),
    }));
    persistReviewQueue();
  };

  const scheduleQuestionReview = (question: Question, baseMissCount: number = 0) => {
    if (isQuestionExcluded(gameState.selectedDifficulty, gameState.selectedLevel, question)) return;
    const reviewScopeKey = getReviewScopeKey(gameState.selectedDifficulty, gameState.selectedLevel);
    const existingIndex = reviewQueueRef.current.findIndex(entry => (
      getReviewScopeKey(entry.difficulty, entry.level) === reviewScopeKey
      && entry.question.text === question.text
      && entry.question.translation === question.translation
    ));
    const nextMissCount = Math.max(
      existingIndex >= 0 ? reviewQueueRef.current[existingIndex].missCount + 1 : 0,
      baseMissCount + 1,
    );
    const nextEntry: ReviewQueueEntry = {
      difficulty: gameState.selectedDifficulty,
      level: gameState.selectedLevel,
      question,
      remainingQuestions: getReviewDelay(nextMissCount),
      missCount: nextMissCount,
    };

    if (existingIndex >= 0) {
      reviewQueueRef.current[existingIndex] = nextEntry;
    } else {
      reviewQueueRef.current.push(nextEntry);
    }

    persistReviewQueue();
  };

  const rescheduleReviewQuestionAfterSuccess = (entry: ReviewQueueEntry) => {
    if (isQuestionExcluded(entry.difficulty, entry.level, entry.question)) return;
    reviewQueueRef.current.push({
      ...entry,
      remainingQuestions: getReviewDelay(entry.missCount),
    });
    persistReviewQueue();
  };

  const getDueReviewQuestion = (diff: Difficulty, level: Level, currentQ: Question | null): ReviewQueueEntry | null => {
    const reviewScopeKey = getReviewScopeKey(diff, level);
    for (let index = 0; index < reviewQueueRef.current.length; index += 1) {
      const entry = reviewQueueRef.current[index];
      if (getReviewScopeKey(entry.difficulty, entry.level) !== reviewScopeKey) continue;
      if (entry.remainingQuestions > 0) continue;
      if (isQuestionExcluded(entry.difficulty, entry.level, entry.question)) {
        reviewQueueRef.current.splice(index, 1);
        persistReviewQueue();
        return getDueReviewQuestion(diff, level, currentQ);
      }
      if (currentQ && entry.question.text === currentQ.text && entry.question.translation === currentQ.translation) continue;

      reviewQueueRef.current.splice(index, 1);
      persistReviewQueue();
      return entry;
    }

    return null;
  };

  const canServeReviewQuestion = () => {
    const nextWindow = [...recentReviewAppearanceRef.current.slice(-(REVIEW_RATE_WINDOW_SIZE - 1)), true];
    const reviewCount = nextWindow.filter(Boolean).length;
    return reviewCount <= REVIEW_RATE_MAX_IN_WINDOW;
  };

  const recordRecentQuestionSource = (wasReviewQuestion: boolean) => {
    recentReviewAppearanceRef.current = [
      ...recentReviewAppearanceRef.current.slice(-(REVIEW_RATE_WINDOW_SIZE - 1)),
      wasReviewQuestion,
    ];
  };

  const getNextBattleQuestion = (
    diff: Difficulty,
    level: Level,
    currentQ: Question | null,
    stageIndex: number,
    mode: Mode,
  ): Question => {
    if (!canServeReviewQuestion()) {
      activeReviewEntryRef.current = null;
      return getPlayableRandomQuestion(diff, level, currentQ, stageIndex, mode);
    }

    const reviewEntry = getDueReviewQuestion(diff, level, currentQ);
    activeReviewEntryRef.current = reviewEntry;
    if (reviewEntry) return reviewEntry.question;
    activeReviewEntryRef.current = null;
    return getPlayableRandomQuestion(diff, level, currentQ, stageIndex, mode);
  };

  const handleSkip = () => {
    setLastSolvedQuestion(gameState.currentQuestion);
    advanceGame(0, 0, true, 0);
    inputRef.current?.focus();
  };

  const advanceGame = (damage: number, speed: number, skipped: boolean, addedChars: number) => {
    incrementDailyQuestionCount();
    decrementReviewQueueTimers();

    const nextHp = skipped ? gameState.monsterHp : Math.max(0, gameState.monsterHp - damage);
    const isMonsterDefeated = !skipped && nextHp <= 0;
    const currentScore = gameState.score + damage;
    const nextKeystrokes = gameState.totalKeystrokes + addedChars;
    const newHistory = [...gameState.history, { damage, speed }];
    const activeReviewEntry = activeReviewEntryRef.current;
    const wasCurrentQuestionReview = !!activeReviewEntry;
    let masteredCurrentQuestion = false;

    recordRecentQuestionSource(wasCurrentQuestionReview);

    if (!skipped) {
      updateAutoLearningStatus(
        gameState.selectedDifficulty,
        gameState.selectedLevel,
        gameState.currentQuestion,
        gameState.missCount === 0 ? 'success' : 'struggle',
        gameState.mode,
        gameState.inputMode,
      );
    }

    const newMissedQs = [...gameState.currentBattleMissedQuestions];
    if (gameState.missCount > 0 && !newMissedQs.some(q => q.text === gameState.currentQuestion.text)) { newMissedQs.push(gameState.currentQuestion); }
    if (gameState.mode !== 'weakness' && gameState.missCount > 0) {
      scheduleQuestionReview(gameState.currentQuestion, activeReviewEntry?.missCount ?? 0);
    } else if (activeReviewEntry && gameState.missCount === 0) {
      masteredCurrentQuestion = recordWeakQuestionSuccess(gameState.currentQuestion);
      if (!masteredCurrentQuestion) {
        rescheduleReviewQuestionAfterSuccess(activeReviewEntry);
      }
    }
    
    let remainingWeakQuestions = weakQuestions;
    let remainingSessionQuestions = sessionWeakQuestionsRef.current;
    const hadSessionReview = remainingSessionQuestions !== null;
    if (gameState.missCount === 0) {
        if (!activeReviewEntry && remainingWeakQuestions.some(q => q.text === gameState.currentQuestion.text)) {
            masteredCurrentQuestion = recordWeakQuestionSuccess(gameState.currentQuestion);
        }

        if (remainingSessionQuestions?.some(q => q.text === gameState.currentQuestion.text)) {
            remainingSessionQuestions = remainingSessionQuestions.filter(q => q.text !== gameState.currentQuestion.text);
            sessionWeakQuestionsRef.current = remainingSessionQuestions;
        }

        if (masteredCurrentQuestion && remainingWeakQuestions.some(q => q.text === gameState.currentQuestion.text)) {
            remainingWeakQuestions = remainingWeakQuestions.filter(q => q.text !== gameState.currentQuestion.text);
        }
    }

    const logItem: BattleLogItem = {
        question: gameState.currentQuestion,
        missCount: skipped ? -1 : gameState.missCount, 
        skipped: skipped
    };
    const newBattleLog = [...gameState.battleLog, logItem];

    const activeRemainingQuestions = remainingSessionQuestions
      ?? (gameState.mode === 'weakness' ? remainingWeakQuestions : []);

    if (hadSessionReview && gameState.missCount === 0 && remainingSessionQuestions && remainingSessionQuestions.length === 0) {
      handleGameEnd('win', currentScore, newHistory, gameState.selectedDifficulty, gameState.selectedLevel, gameState.mode, nextKeystrokes, newMissedQs, newBattleLog);
      setGameState(prev => ({ ...prev, monsterHp: 0, score: currentScore, history: newHistory, totalKeystrokes: nextKeystrokes, currentBattleMissedQuestions: newMissedQs, battleLog: newBattleLog }));
      return;
    }

    if (gameState.mode === 'weakness' && gameState.missCount === 0 && activeRemainingQuestions.length === 0) {
      handleGameEnd('win', currentScore, newHistory, gameState.selectedDifficulty, gameState.selectedLevel, gameState.mode, nextKeystrokes, newMissedQs, newBattleLog);
      setGameState(prev => ({ ...prev, monsterHp: 0, score: currentScore, history: newHistory, totalKeystrokes: nextKeystrokes, currentBattleMissedQuestions: newMissedQs, battleLog: newBattleLog }));
      return;
    }

    if (isMonsterDefeated) {
      setFlash(true);
      setTimeout(() => setFlash(false), 800);
      
      const actualId = gameState.challengeModeIndices[gameState.currentMonsterIndex];
      const monster = gameState.currentMonsterList[actualId];
      
      if (gameState.mode !== 'weakness') { 
          saveDefeatedMonster(monster.id); 
      }

      const isLastMonster = gameState.currentMonsterIndex >= gameState.totalMonstersInStage - 1;
      soundEngine.stopBattleAmbience();
      soundEngine.stopBattleMusic();

      pendingBattleEndTimeoutRef.current = window.setTimeout(() => {
          pendingBattleEndTimeoutRef.current = null;
          if (isLastMonster) soundEngine.playStageClear(); 
          handleGameEnd('win', currentScore, newHistory, gameState.selectedDifficulty, gameState.selectedLevel, gameState.mode, nextKeystrokes, newMissedQs, newBattleLog, !isLastMonster);
      }, 800); 

      setGameState(prev => ({ ...prev, monsterHp: 0, score: currentScore, history: newHistory, totalKeystrokes: nextKeystrokes, currentBattleMissedQuestions: newMissedQs, battleLog: newBattleLog }));
      return;
    }

    if (gameState.questionCount >= gameState.maxQuestions) {
       handleGameEnd('draw', currentScore, newHistory, gameState.selectedDifficulty, gameState.selectedLevel, gameState.mode, nextKeystrokes, newMissedQs, newBattleLog);
       return;
    }

    let nextQ: Question;
    if (activeRemainingQuestions.length > 0) {
      nextQ = activeRemainingQuestions[Math.floor(Math.random() * activeRemainingQuestions.length)];
    } else {
      nextQ = getNextBattleQuestion(
        gameState.selectedDifficulty,
        gameState.selectedLevel,
        gameState.currentQuestion,
        gameState.currentMonsterIndex,
        gameState.mode,
      );
    }
    
    setGameState(prev => ({
      ...prev, monsterHp: nextHp, score: currentScore, combo: skipped ? 0 : prev.combo + 1, currentQuestion: nextQ, userInput: "", 
      startTime: null, history: newHistory, questionCount: prev.questionCount + 1, missCount: 0, totalKeystrokes: nextKeystrokes, hintLength: 0, currentBattleMissedQuestions: newMissedQs,
      battleLog: newBattleLog
    }));
  };
  
  const handleCorrectAnswer = (finalInput: string) => {
    const now = Date.now();
    const start = gameState.startTime || now;
    const durationSec = Math.max((now - start) / 1000, 0.1);
    const charCount = finalInput.length;
    const charsPerSec = charCount / durationSec;
    const baseDamage = charCount * 10;
    const isEikenLongTextGuide = (
      (gameState.selectedDifficulty === 'Eiken5' || gameState.selectedDifficulty === 'Eiken4')
      && gameState.mode === 'guide'
      && (gameState.selectedLevel === 2 || gameState.selectedLevel === 3)
    );
    const speedMultiplier = isEikenLongTextGuide
      ? getEikenLongTextGuideSpeedMultiplier(charsPerSec)
      : getSpeedMultiplier(charsPerSec);
    const damageMultiplier = isEikenLongTextGuide
      ? getEikenLongTextGuideDamageMultiplier(gameState.selectedDifficulty, gameState.selectedLevel)
      : getBattleDamageMultiplier(gameState.mode, gameState.inputMode);
    const perfectClearDamageFloor = getPerfectClearDamageFloor(
      gameState.bossStage,
      gameState.maxMonsterHp,
      gameState.maxQuestions,
      isEikenLongTextGuide,
    );
    let finalDamage = Math.floor(baseDamage * speedMultiplier * damageMultiplier);
    const isEiken5LongTextLevel = gameState.selectedDifficulty === 'Eiken5' && (gameState.selectedLevel === 2 || gameState.selectedLevel === 3);
    const missDamageMultiplier = isEiken5LongTextLevel
      ? Math.max(gameState.selectedLevel === 3 ? 0.8 : 0.75, 1 - (gameState.missCount / Math.max(charCount, 1)))
      : !isEikenLongTextGuide
        ? 0.5
        : gameState.missCount === 0
          ? 1
          : gameState.missCount === 1
            ? 0.95
            : gameState.missCount === 2
              ? 0.9
              : gameState.missCount === 3
                ? 0.8
                : 0.7;
    if (isEikenLongTextGuide) {
      // 通常モンスターは、10問中5問程度の小さなケアレスミスで詰まらない余白を持たせる。
      // ラスボスは20問中、各文で1回程度の修正なら倒せるが、繰り返しのミスでは届かない。
      const requiredProgressQuestions = gameState.bossStage === 0
        ? Math.max(1, gameState.maxQuestions - 0.3)
        : Math.max(1, gameState.maxQuestions - 1);
      const progressDamageFloor = Math.ceil(gameState.maxMonsterHp / requiredProgressQuestions);
      finalDamage = Math.max(finalDamage, Math.floor(progressDamageFloor * missDamageMultiplier));
    } else if (gameState.missCount > 0) {
      finalDamage = Math.max(1, Math.floor(finalDamage * missDamageMultiplier));
    } else if (perfectClearDamageFloor > 0) {
      finalDamage = Math.max(finalDamage, perfectClearDamageFloor);
    }
    const willDefeatMonster = gameState.monsterHp - finalDamage <= 0;
    if (!willDefeatMonster) {
      if (speedMultiplier >= 2.0 && gameState.missCount === 0) { soundEngine.playCritical(); } else { soundEngine.playAttack(); }
    }
    setMonsterShake(true);
    setTimeout(() => setMonsterShake(false), 400); 
    setLastSolvedQuestion(gameState.currentQuestion);
    if (translationBattleCorrectSpeechEnabled && gameState.inputMode === 'text-only') {
      speakWithSettings(gameState.currentQuestion.text);
    }
    advanceGame(finalDamage, charsPerSec, false, charCount);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const targetText = gameState.currentQuestion.text;
    const normalizedVal = normalizeTypingText(val);
    const normalizedTargetText = normalizeTypingText(targetText);
    if (val.length > gameState.userInput.length) soundEngine.playType();
    if (!gameState.startTime && val.length > 0) setGameState(prev => ({ ...prev, startTime: Date.now() }));
    
    if (gameState.mode === 'guide' && gameState.selectedLevel === 1) {
        if (normalizedTargetText.startsWith(normalizedVal)) {
            setGameState(prev => ({ ...prev, userInput: val, hintLength: 0 }));
            if (normalizedVal === normalizedTargetText) handleCorrectAnswer(val);
        } else {
            soundEngine.playMiss(); setShake(true); setTimeout(() => setShake(false), 300);
            setGameState(prev => ({ ...prev, userInput: "", combo: 0, missCount: prev.missCount + 1, hintLength: 0 })); 
        }
    } else {
        if (normalizedTargetText.startsWith(normalizedVal)) {
            setGameState(prev => ({ ...prev, userInput: val, hintLength: 0 }));
            if (normalizedVal === normalizedTargetText) handleCorrectAnswer(val);
        } else {
            soundEngine.playMiss(); setShake(true); setTimeout(() => setShake(false), 300);
            const shouldShowHint = gameState.mode === 'challenge';
            setGameState(prev => ({ ...prev, missCount: prev.missCount + 1, hintLength: shouldShowHint ? prev.hintLength + 1 : 0 })); 
        }
    }
  };

  useEffect(() => {
    if (gameState.screen === 'battle' && gameState.inputMode !== 'text-only' && gameState.monsterHp > 0) {
      speakBattleQuestion(gameState.currentQuestion, gameState.selectedDifficulty, gameState.mode);
    }
  }, [gameState.currentQuestion, gameState.screen, gameState.inputMode, gameState.mode, gameState.monsterHp, gameState.selectedDifficulty, speakBattleQuestion]);

  const handleTypingPracticeInput = (value: string) => {
    const target = TYPING_PRACTICE_STEPS[typingPracticeIndex] ?? '';
    if (!target.startsWith(value)) {
      soundEngine.playMiss();
      setTypingPracticeMisses(count => count + 1);
      window.setTimeout(() => typingPracticeInputRef.current?.focus(), 0);
      return;
    }
    if (value.length > typingPracticeInput.length) soundEngine.playType();
    setTypingPracticeInput(value);
    if (value === target) {
      setTypingPracticeIndex(index => Math.min(index + 1, TYPING_PRACTICE_STEPS.length));
      setTypingPracticeInput('');
    }
    window.setTimeout(() => typingPracticeInputRef.current?.focus(), 0);
  };

  const clearBeginnerBattleAdvanceTimeout = () => {
    if (beginnerBattleAdvanceTimeoutRef.current !== null) {
      window.clearTimeout(beginnerBattleAdvanceTimeoutRef.current);
      beginnerBattleAdvanceTimeoutRef.current = null;
    }
  };

  const beginBeginnerBattle = (restart: boolean) => {
    clearBeginnerBattleAdvanceTimeout();
    if (restart) clearBeginnerBattleProgress();
    const savedProgress = restart ? { questionIndex: 0, input: '' } : loadBeginnerBattleProgress();
    const savedQuestion = BEGINNER_BATTLE_QUESTIONS[savedProgress.questionIndex];
    setBeginnerBattleIndex(savedProgress.questionIndex);
    setBeginnerBattleInput(savedProgress.input);
    setBeginnerBattleKeyHintsEnabled(true);
    setBeginnerBattleMessage(savedProgress.questionIndex > 0 || savedProgress.input
      ? `${savedProgress.questionIndex + 1}問目から、つづきを始めよう！`
      : '光っているキーを押してみよう！');
    setBeginnerBattleResolving(false);
    setBeginnerBattleClearedPhase(null);
    soundEngine.stopBattleAmbience();
    soundEngine.stopBattleMusic();
    soundEngine.startBattleMusic(
      getBattleMusicPath('guide', 'voice-text', false),
      BGM_VOLUME_LEVELS[bgmVolumeLevel]
    );
    setGameState(prev => ({ ...prev, screen: 'beginner-battle' }));
    window.setTimeout(() => {
      beginnerBattleInputRef.current?.focus();
      if (savedQuestion) speakWithSettings(savedQuestion.text);
    }, 250);
  };

  const startBeginnerBattle = () => beginBeginnerBattle(false);
  const restartBeginnerBattle = () => beginBeginnerBattle(true);

  const leaveBeginnerBattle = () => {
    clearBeginnerBattleAdvanceTimeout();
    soundEngine.stopBattleAmbience();
    soundEngine.stopBattleMusic();
    setBeginnerBattleResolving(false);
    setBeginnerBattleClearedPhase(null);
    setGameState(prev => ({ ...prev, screen: 'title' }));
  };

  const continueBeginnerBattle = useCallback(() => {
    const nextIndex = beginnerBattleIndex + 1;
    const nextQuestion = BEGINNER_BATTLE_QUESTIONS[nextIndex];
    saveBeginnerBattleProgress(nextIndex);
    setBeginnerBattleIndex(nextIndex);
    setBeginnerBattleInput('');
    setBeginnerBattleMessage('つぎのモンスターも、ゆっくり倒そう！');
    setBeginnerBattleClearedPhase(null);
    setBeginnerBattleResolving(false);
    window.setTimeout(() => {
      beginnerBattleInputRef.current?.focus();
      if (nextQuestion) speakWithSettings(nextQuestion.text);
    }, 150);
  }, [beginnerBattleIndex, speakWithSettings]);

  useEffect(() => {
    if (gameState.screen !== 'beginner-battle' || beginnerBattleClearedPhase === null) return;
    const handleEnter = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.repeat) return;
      event.preventDefault();
      continueBeginnerBattle();
    };
    window.addEventListener('keydown', handleEnter);
    return () => window.removeEventListener('keydown', handleEnter);
  }, [beginnerBattleClearedPhase, continueBeginnerBattle, gameState.screen]);

  useEffect(() => {
    if (gameState.screen !== 'beginner-battle') return;
    const restoreInputFocus = () => {
      if (document.visibilityState === 'hidden' || beginnerBattleResolving || beginnerBattleClearedPhase !== null || beginnerBattleIndex >= BEGINNER_BATTLE_QUESTIONS.length) return;
      window.setTimeout(() => beginnerBattleInputRef.current?.focus(), 0);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') restoreInputFocus();
    };
    const initialFocusTimeout = window.setTimeout(restoreInputFocus, 0);
    window.addEventListener('focus', restoreInputFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.clearTimeout(initialFocusTimeout);
      window.removeEventListener('focus', restoreInputFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [beginnerBattleClearedPhase, beginnerBattleIndex, beginnerBattleResolving, gameState.screen]);

  const handleBeginnerBattleInput = (value: string) => {
    if (beginnerBattleResolving || beginnerBattleClearedPhase !== null) return;
    const question = BEGINNER_BATTLE_QUESTIONS[beginnerBattleIndex];
    if (!question) return;

    const normalizedValue = value.toLowerCase();
    if (!question.text.startsWith(normalizedValue)) {
      soundEngine.playMiss();
      setBeginnerBattleMessage('だいじょうぶ！光っているキーを押してみよう。');
      window.setTimeout(() => beginnerBattleInputRef.current?.focus(), 0);
      return;
    }

    if (normalizedValue.length > beginnerBattleInput.length) soundEngine.playType();
    setBeginnerBattleInput(normalizedValue);
    setBeginnerBattleMessage('');
    if (normalizedValue !== question.text) {
      saveBeginnerBattleProgress(beginnerBattleIndex, normalizedValue);
      window.setTimeout(() => beginnerBattleInputRef.current?.focus(), 0);
      return;
    }

    const phaseIndex = Math.floor(beginnerBattleIndex / BEGINNER_BATTLE_PHASE_SIZE);
    const isPhaseEnd = (beginnerBattleIndex + 1) % BEGINNER_BATTLE_PHASE_SIZE === 0;
    const isFinalQuestion = beginnerBattleIndex === BEGINNER_BATTLE_QUESTIONS.length - 1;
    setBeginnerBattleResolving(true);
    if (isFinalQuestion) {
      soundEngine.playStageClear();
      clearBeginnerBattleProgress();
    } else if (isPhaseEnd) {
      soundEngine.playClear();
      saveBeginnerBattleProgress(beginnerBattleIndex + 1);
    } else {
      soundEngine.playAttack();
      saveBeginnerBattleProgress(beginnerBattleIndex + 1);
    }
    setMonsterShake(true);
    setBeginnerBattleMessage(isPhaseEnd ? 'やった！モンスターをたおした！' : 'やった！モンスターにこうげき！');

    clearBeginnerBattleAdvanceTimeout();
    beginnerBattleAdvanceTimeoutRef.current = window.setTimeout(() => {
      beginnerBattleAdvanceTimeoutRef.current = null;
      setMonsterShake(false);
      if (isFinalQuestion) {
        soundEngine.stopBattleMusic();
        setBeginnerBattleIndex(BEGINNER_BATTLE_QUESTIONS.length);
        setBeginnerBattleInput('');
        setBeginnerBattleMessage('');
        setBeginnerBattleResolving(false);
        return;
      }
      if (isPhaseEnd) {
        setBeginnerBattleClearedPhase(phaseIndex);
        setBeginnerBattleResolving(false);
        return;
      }

      const nextIndex = beginnerBattleIndex + 1;
      const nextQuestion = BEGINNER_BATTLE_QUESTIONS[nextIndex];
      setBeginnerBattleIndex(nextIndex);
      setBeginnerBattleInput('');
      setBeginnerBattleResolving(false);
      setBeginnerBattleMessage('');
      window.setTimeout(() => {
        beginnerBattleInputRef.current?.focus();
        if (nextQuestion) speakWithSettings(nextQuestion.text);
      }, 100);
    }, 320);
  };

  // --- Screens ---
  const selectedSpeechConfig = resolveSpeechConfig(speechVoices, speechVoiceMode);
  const supportedSpeechModes = getSupportedSpeechModes(speechVoices);
  const selectedSpeechLocale = normalizeVoiceLang(selectedSpeechConfig.lang);
  const currentScopedQuestions = useMemo(() => (
    QUESTIONS[gameState.selectedDifficulty]?.[gameState.selectedLevel] ?? []
  ), [gameState.selectedDifficulty, gameState.selectedLevel]);
  const currentQuestionExamples = useMemo(() => (
    new Map(
      currentScopedQuestions.map(question => {
        const questionKey = getQuestionStatusKey(gameState.selectedDifficulty, gameState.selectedLevel, question);
        return [questionKey, getQuestionExample(gameState.selectedDifficulty, gameState.selectedLevel, question)] as const;
      })
    )
  ), [currentScopedQuestions, gameState.selectedDifficulty, gameState.selectedLevel]);
  const speechDebugCandidates = speechVoices
    .filter(voice => matchesVoiceLocale(voice, selectedSpeechLocale as 'en-us' | 'en-gb'))
    .map(voice => ({
      voice,
      score: getVoiceMatchScore(voice, selectedSpeechConfig.mode),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const handleToggleSelectedQuestion = useCallback((question: Question) => {
    toggleSelectedQuestion(gameState.selectedDifficulty, gameState.selectedLevel, question);
  }, [gameState.selectedDifficulty, gameState.selectedLevel]);

  const handleToggleMarkedQuestion = useCallback((question: Question) => {
    toggleMarkedQuestion(gameState.selectedDifficulty, gameState.selectedLevel, question);
  }, [gameState.selectedDifficulty, gameState.selectedLevel]);

  const handleUpdateManualLevel = useCallback((question: Question, level: LearningLevel) => {
    updateManualQuestionStatus(
      gameState.selectedDifficulty,
      gameState.selectedLevel,
      question,
      current => ({ ...current, manualOverrideLevel: current.manualOverrideLevel === level ? null : level })
    );
  }, [gameState.selectedDifficulty, gameState.selectedLevel, updateManualQuestionStatus]);

  const handleToggleExcludedQuestion = useCallback((question: Question) => {
    updateManualQuestionStatus(
      gameState.selectedDifficulty,
      gameState.selectedLevel,
      question,
      current => ({ ...current, excluded: !current.excluded })
    );
  }, [gameState.selectedDifficulty, gameState.selectedLevel, updateManualQuestionStatus]);

  const startAutoPlaySequence = (
    entries: Array<{
      label: string;
      text: string;
      lang: string;
      voice: SpeechSynthesisVoice | null;
      gapAfterSeconds: number;
      nowPlaying: AutoPlayNowPlaying;
    }>,
  ) => {
    if (entries.length === 0) {
      stopAutoPlay('再生できる項目がありません');
      return;
    }

    autoPlayRunIdRef.current += 1;
    const runId = autoPlayRunIdRef.current;
    clearAutoPlayTimeout();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setAutoPlayNowPlaying(null);
    setIsAutoPlaying(true);

    const playAt = (index: number) => {
      if (autoPlayRunIdRef.current !== runId) return;

      if (index >= entries.length) {
        if (autoPlaySettings.repeat) {
          setAutoPlayStatusText('リピート再生を続けています');
          playAt(0);
          return;
        }
        setIsAutoPlaying(false);
        setAutoPlayNowPlaying(null);
        setAutoPlayStatusText('再生が完了しました');
        return;
      }

      const entry = entries[index];
      setAutoPlayNowPlaying(entry.nowPlaying);
      setAutoPlayStatusText(`${index + 1}/${entries.length} ${entry.label}`);
      const playbackRate = Math.max(0.5, autoPlaySettings.playbackRatePercent / 100);
      const minGapSeconds = index < entries.length - 1
        ? entries[index + 1].label.startsWith('次の単語')
          ? MIN_AUTO_PLAY_QUESTION_GAP_SECONDS
          : MIN_AUTO_PLAY_ITEM_GAP_SECONDS
        : 0;
      const nextDelaySeconds = Math.max(minGapSeconds, entry.gapAfterSeconds / playbackRate);

      speakText(entry.text, {
        voice: entry.voice,
        lang: entry.lang,
        rate: entry.lang.startsWith('ja') ? 1 : autoPlaySettings.playbackRatePercent / 100,
        interrupt: false,
        onend: () => {
          if (autoPlayRunIdRef.current !== runId) return;
          autoPlayTimeoutRef.current = window.setTimeout(() => {
            autoPlayTimeoutRef.current = null;
            playAt(index + 1);
          }, nextDelaySeconds * 1000);
        },
        onerror: () => {
          if (autoPlayRunIdRef.current !== runId) return;
          autoPlayTimeoutRef.current = window.setTimeout(() => {
            autoPlayTimeoutRef.current = null;
            playAt(index + 1);
          }, nextDelaySeconds * 1000);
        },
      });
    };

    playAt(0);
  };

  if (gameState.screen === 'rank-list') {
      const allMonsterIds = Object.values(MONSTERS).flatMap(lvl => [...lvl.guide, ...lvl.challenge]).map(m => m.id);
      const uniqueDefeatedIds = new Set(gameState.defeatedMonsterIds.map(key => extractMonsterId(key)));
      const totalDefeated = [...uniqueDefeatedIds].filter(id => allMonsterIds.includes(id)).length;
      return (
        <ScreenContainer className="bg-slate-900">
            <div className="max-w-4xl w-full p-4 h-full flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <GameButton size="sm" variant="outline" onClick={() => setGameState(prev => ({ ...prev, screen: 'title' }))}>&larr; タイトルへ</GameButton>
                    <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2"><Medal /> 称号リスト (Rank List)</h2>
                </div>
                <Box title={`Current Rank & Progress (Total Defeated: ${totalDefeated})`} className="flex-1 overflow-hidden flex flex-col">
                    <div className="overflow-y-auto pr-2 custom-scrollbar flex-1"><div className="grid gap-3">
                            {RANKS.map((rank, idx) => {
                                const isUnlocked = totalDefeated >= rank.threshold;
                                return (
                                    <div key={idx} className={`p-4 rounded-lg border-2 flex items-center justify-between transition-all ${isUnlocked ? 'bg-slate-800/80 border-yellow-500/50 shadow-lg' : 'bg-slate-900/50 border-slate-700 opacity-60'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 flex items-center justify-center rounded-full font-bold text-xl ${isUnlocked ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-slate-500'}`}>{isUnlocked ? <Crown size={24} /> : <Lock size={24} />}</div>
                                            <div><h3 className={`text-xl font-bold ${isUnlocked ? rank.color : 'text-slate-500'}`}>{rank.title}</h3><p className="text-sm text-slate-400">必要撃破数: <span className="text-white font-mono">{rank.threshold}</span> 体</p></div>
                                        </div>
                                        {isUnlocked && <div className="text-yellow-400 font-bold text-sm bg-yellow-900/30 px-3 py-1 rounded-full border border-yellow-500/30">GET!</div>}
                                    </div>
                                );
                            })}
                        </div></div>
                </Box>
            </div>
            <style>{`.custom-scrollbar::-webkit-scrollbar { width: 8px; } .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }`}</style>
        </ScreenContainer>
      );
  }

  if (gameState.screen === 'score-view') {
      return (
        <ScreenContainer className="bg-slate-900">
            <div className="max-w-4xl w-full p-4">
                <div className="flex justify-between items-center mb-6">
                    <GameButton size="sm" variant="outline" onClick={() => setGameState(prev => ({ ...prev, screen: 'title' }))}>&larr; タイトルへ</GameButton>
                    <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2"><Trophy /> Best Records</h2>
                </div>
                <div className="mb-6 flex flex-wrap justify-center gap-4">
                   {DIFFICULTIES.map(diff => (
                     <button
                       key={diff}
                       onClick={() => setScoreViewDiff(diff)}
                       className={`px-6 py-2 rounded-full font-bold transition-all border-2 ${scoreViewDiff === diff ? DIFFICULTY_SCORE_TAB_ACTIVE_CLASSES[diff] : 'bg-slate-800 border-slate-600 text-slate-400'}`}
                     >
                       {DIFFICULTY_LABELS[diff]}
                     </button>
                   ))}
                </div>
                <Box title={`${DIFFICULTY_LABELS[scoreViewDiff]} Records`} className="w-full">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead><tr className="border-b-2 border-slate-600 text-slate-400 text-sm uppercase"><th className="p-4">Level</th><th className="p-4 text-center text-blue-300">Training (Guide)</th><th className="p-4 text-center text-red-300">Battle (Challenge)</th></tr></thead>
                            <tbody className="divide-y divide-slate-700">
                                {getAvailableLevels(scoreViewDiff).map((lvl) => {
                                    const guideKey = `${scoreViewDiff}_${lvl}_guide`;
                                    const challengeKey = `${scoreViewDiff}_${lvl}_challenge`;
                                    return (<tr key={lvl} className="hover:bg-slate-700/50 transition-colors"><td className="p-4 font-bold text-xl">Level {lvl}</td><td className="p-4 text-center">{bestScores[guideKey] > 0 ? <span className="text-xl font-mono font-bold text-white">{bestScores[guideKey]}</span> : <span className="text-slate-600">-</span>}</td><td className="p-4 text-center">{bestScores[challengeKey] > 0 ? <span className="text-xl font-mono font-bold text-yellow-400">{bestScores[challengeKey]}</span> : <span className="text-slate-600">-</span>}</td></tr>);
                                })}
                            </tbody>
                        </table>
                    </div>
                </Box>
            </div>
        </ScreenContainer>
      );
  }

  if (gameState.screen === 'monster-book') {
    const monstersObj = MONSTERS[bookLevel];
    const visibleGuideMonsters = monstersObj.guide.slice(0, getGuideTargetCount(bookDifficulty, bookLevel));
    const visibleChallengeMonsterIndices = getBattleStageIndices(monstersObj.challenge, HARD_TARGET_COUNT, 'challenge', 'text-only');
    const visibleChallengeMonsters = visibleChallengeMonsterIndices.map(index => monstersObj.challenge[index]).filter(Boolean);
    const allMonsters = [...visibleGuideMonsters, ...visibleChallengeMonsters];
    const availableBookLevels = getAvailableLevels(bookDifficulty);
    const guideDefeatedCount = countDefeatedMonstersForBook(
      visibleGuideMonsters,
      gameState.defeatedMonsterIds,
      bookDifficulty,
      bookLevel,
      'guide'
    );
    const challengeDefeatedCount = countDefeatedMonstersForBook(
      visibleChallengeMonsters,
      gameState.defeatedMonsterIds,
      bookDifficulty,
      bookLevel,
      'challenge'
    );
    const isMonsterDefeatedInBook = (monsterId: string) => (
      isMonsterDefeatedForBook(gameState.defeatedMonsterIds, bookDifficulty, bookLevel, 'guide', monsterId)
      || isMonsterDefeatedForBook(gameState.defeatedMonsterIds, bookDifficulty, bookLevel, 'challenge', monsterId)
    );
    const getBookMonsterHp = (
      monster: Monster,
      monsterIndex: number,
      monsters: Monster[],
      mode: Extract<Mode, 'guide' | 'challenge'>,
      inputMode: InputMode
    ) => {
      const bossStage = getBossStage(mode, inputMode, monsterIndex, monsters.length);
      const courseBaseHp = getCourseBaseHp(bookDifficulty, bookLevel, mode, inputMode, monsterIndex, monster.baseHp);
      return getBattleHp(bookDifficulty, bookLevel, courseBaseHp, bossStage);
    };
    const totalDefeated = guideDefeatedCount + challengeDefeatedCount;
    return (
      <ScreenContainer className="bg-slate-900">
        <div className="max-w-6xl w-full p-4">
           <div className="flex justify-between items-center mb-6">
              <GameButton size="sm" variant="outline" onClick={() => setGameState(prev => ({ ...prev, screen: 'title' }))}>&larr; タイトルへ</GameButton>
              <div className="flex items-center gap-2 bg-slate-800 border border-slate-600 px-4 py-2 rounded-full shadow-sm text-yellow-400"><Trophy size={20} /><span className="font-bold">撃破数: {totalDefeated} / {allMonsters.length}</span></div>
           </div>
           <Box title={`Monster Collection - ${DIFFICULTY_LABELS[bookDifficulty]} - Level ${bookLevel}`} className="w-full">
               <div className="mb-4 flex flex-wrap justify-center gap-3">{DIFFICULTIES.map((diff) => (<button key={diff} onClick={() => updateBookDifficulty(diff)} className={`px-5 py-2 rounded-full font-bold transition-all border-2 ${bookDifficulty === diff ? 'bg-blue-600 border-blue-400 text-white shadow-lg scale-105' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}>{DIFFICULTY_LABELS[diff]}</button>))}</div>
               <div className="mb-4 rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-center text-xs text-slate-300">
                 モンスターの種類はレベルごとに共通です。ここでは <span className="font-bold text-blue-200">{DIFFICULTY_LABELS[bookDifficulty]}</span> の進行状況を表示しています。
               </div>
               <div className="flex justify-center gap-4 mb-8">{availableBookLevels.map((lvl) => (<button key={lvl} onClick={() => setBookLevel(lvl as Level)} className={`px-6 py-2 rounded-full font-bold transition-all border-2 ${bookLevel === lvl ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg scale-105' : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'}`}>レベル {lvl}</button>))}</div>
               <div className="mb-8">
                 <h3 className="text-blue-300 font-bold mb-4 flex items-center gap-2 text-xl"><Shield size={20} /> 練習エリア (Training Zone)</h3>
                 <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {visibleGuideMonsters.map((m, index, monsters) => {
                      const isDefeated = isMonsterDefeatedInBook(m.id);
                      const displayHp = getBookMonsterHp(m, index, monsters, 'guide', 'voice-text');
                      return (<div key={m.id} className={`relative p-4 rounded-xl flex flex-col items-center justify-center text-center transition-all border-2 ${isDefeated ? 'bg-slate-700/50 border-slate-500' : 'bg-slate-900/50 border-slate-800 opacity-70'}`}>{isDefeated ? (<><div className="mb-2 scale-75"><MonsterAvatar type={m.type} color={m.color} size={100} visualStyle={getMonsterVisualStyle(m)} /></div><div className="font-bold text-sm text-blue-300 mb-1">{m.name}</div><div className="mb-1 rounded-full border border-cyan-500/30 bg-cyan-950/70 px-2 py-1 text-[11px] font-black text-cyan-200">HP {displayHp}</div><div className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-full">{m.theme}</div><div className="absolute top-2 right-2 text-yellow-400"><Star size={16} fill="currentColor" /></div></>) : (<><div className="mb-2 scale-75 opacity-30 grayscale filter blur-[1px]"><MonsterAvatar type={m.type} color={m.color} size={100} visualStyle={getMonsterVisualStyle(m)} /></div><div className="font-bold text-sm text-slate-600 mb-1">???</div><div className="mb-1 rounded-full border border-cyan-500/30 bg-cyan-950/70 px-2 py-1 text-[11px] font-black text-cyan-200">HP {displayHp}</div><div className="absolute top-2 right-2 text-slate-700"><Lock size={16} /></div></>)}</div>);
                    })}
                 </div>
               </div>
               <div>
                 <h3 className="text-red-400 font-bold mb-4 flex items-center gap-2 text-xl"><Skull size={20} /> 危険エリア (Danger Zone)</h3>
                 <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {visibleChallengeMonsters.map((m, index, monsters) => {
                      const isDefeated = isMonsterDefeatedInBook(m.id);
                      const displayHp = getBookMonsterHp(m, index, monsters, 'challenge', 'text-only');
                      return (<div key={m.id} className={`relative p-4 rounded-xl flex flex-col items-center justify-center text-center transition-all border-2 ${isDefeated ? 'bg-red-900/20 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-slate-900/50 border-slate-800 opacity-70'}`}>{isDefeated ? (<><div className="mb-2 scale-90"><MonsterAvatar type={m.type} color={m.color} size={100} visualStyle={getMonsterVisualStyle(m)} /></div><div className="font-bold text-sm text-red-300 mb-1">{m.name}</div><div className="mb-1 rounded-full border border-red-500/30 bg-red-950/70 px-2 py-1 text-[11px] font-black text-red-100">HP {displayHp}</div><div className="text-xs text-red-200 bg-red-900/50 px-2 py-1 rounded-full">{m.theme}</div><div className="absolute top-2 right-2 text-yellow-400"><Star size={16} fill="currentColor" /></div></>) : (<><div className="mb-2 scale-90 opacity-30 grayscale filter blur-[1px]"><MonsterAvatar type={m.type} color={m.color} size={100} visualStyle={getMonsterVisualStyle(m)} /></div><div className="font-bold text-sm text-slate-600 mb-1">???</div><div className="mb-1 rounded-full border border-red-500/30 bg-red-950/70 px-2 py-1 text-[11px] font-black text-red-100">HP {displayHp}</div><div className="absolute top-2 right-2 text-slate-700"><Lock size={16} /></div></>)}</div>);
                    })}
                 </div>
               </div>
           </Box>
        </div>
      </ScreenContainer>
    );
  }

  if (gameState.screen === 'question-list') {
    const questions = currentScopedQuestions;
    const selectionScopeKey = getReviewScopeKey(gameState.selectedDifficulty, gameState.selectedLevel);
    const learningSummary = getScopedLearningSummary(gameState.selectedDifficulty, gameState.selectedLevel);
    const weakQuestionTexts = new Set(weakQuestions.map(q => q.text));
    const playableQuestions = questions.filter(q => !isQuestionExcluded(gameState.selectedDifficulty, gameState.selectedLevel, q));
    const excludedQuestions = questions.filter(q => isQuestionExcluded(gameState.selectedDifficulty, gameState.selectedLevel, q));
    const weakQuestionsInView = questions.filter(q => weakQuestionTexts.has(q.text) && !isQuestionExcluded(gameState.selectedDifficulty, gameState.selectedLevel, q));
    const markedQuestionKeys = markedQuestionKeysByScope[selectionScopeKey] ?? [];
    const markedQuestionKeySet = new Set(markedQuestionKeys);
    const markedQuestionsInView = questions.filter(q => markedQuestionKeySet.has(getQuestionStatusKey(gameState.selectedDifficulty, gameState.selectedLevel, q)) && !isQuestionExcluded(gameState.selectedDifficulty, gameState.selectedLevel, q));
    const selectedQuestionKeys = selectedQuestionKeysByScope[selectionScopeKey] ?? [];
    const selectedQuestionKeySet = new Set(selectedQuestionKeys);
    const selectedQuestionsInView = wordListToolsOpen
      ? playableQuestions.filter(q => selectedQuestionKeySet.has(getQuestionStatusKey(gameState.selectedDifficulty, gameState.selectedLevel, q)))
      : [];
    const savedSelectionListsInScope = savedSelectionLists
      .filter(list => list.difficulty === gameState.selectedDifficulty && list.level === gameState.selectedLevel)
      .sort((a, b) => b.updatedAt - a.updatedAt);
    const weakCountInView = weakQuestionsInView.length;
    const manualReviewQuestions = wordListToolsOpen
      ? playableQuestions.filter(q => getEffectiveLearningLevel(getManualQuestionStatus(gameState.selectedDifficulty, gameState.selectedLevel, q)) < 3)
      : [];
    const manualStudyCount = learningSummary.learningCount;
    const manualCautionCount = learningSummary.cautionCount;
    const sortedWeakQuestions = [...weakQuestionsInView].sort((a, b) => {
      const aStats = weakQuestionStats[a.text] ?? { missCount: 0, lastMissedAt: 0 };
      const bStats = weakQuestionStats[b.text] ?? { missCount: 0, lastMissedAt: 0 };
      if (weakListSort === 'frequent') {
        return (bStats.missCount - aStats.missCount) || (bStats.lastMissedAt - aStats.lastMissedAt) || a.text.localeCompare(b.text);
      }
      return (bStats.lastMissedAt - aStats.lastMissedAt) || (bStats.missCount - aStats.missCount) || a.text.localeCompare(b.text);
    });
    const visibleQuestions = questionListFilter === 'weak'
      ? sortedWeakQuestions
      : questionListFilter === 'marked'
        ? markedQuestionsInView
        : questions;
    const visiblePlayableQuestions = visibleQuestions.filter(q => !isQuestionExcluded(gameState.selectedDifficulty, gameState.selectedLevel, q));
    const recentWeakSamples = [...weakQuestionsInView]
      .sort((a, b) => (weakQuestionStats[b.text]?.lastMissedAt ?? 0) - (weakQuestionStats[a.text]?.lastMissedAt ?? 0))
      .slice(0, 3);
    const repeatedWeakSamples = [...weakQuestionsInView]
      .filter(q => (weakQuestionStats[q.text]?.missCount ?? 0) >= 2)
      .sort((a, b) => (weakQuestionStats[b.text]?.missCount ?? 0) - (weakQuestionStats[a.text]?.missCount ?? 0))
      .slice(0, 3);
    const topMissedQuestions = [...weakQuestionsInView]
      .sort((a, b) => ((weakQuestionStats[b.text]?.missCount ?? 0) - (weakQuestionStats[a.text]?.missCount ?? 0)) || ((weakQuestionStats[b.text]?.lastMissedAt ?? 0) - (weakQuestionStats[a.text]?.lastMissedAt ?? 0)))
      .slice(0, 10);
    const reviewTargetQuestions = questionListFilter === 'weak'
      ? visibleQuestions
      : questionListFilter === 'marked'
        ? markedQuestionsInView
        : weakQuestionsInView;
    const autoPlayTargetQuestions = wordListToolsOpen
      ? autoPlaySettings.source === 'all'
        ? visiblePlayableQuestions
        : autoPlaySettings.source === 'weak'
          ? weakQuestionsInView
          : autoPlaySettings.source === 'marked'
            ? markedQuestionsInView
            : selectedQuestionsInView
      : [];
    const autoPlayJapaneseVoice = wordListToolsOpen ? getJapaneseSpeechVoice() : null;
    const autoPlayPlayableQuestionCount = wordListToolsOpen
      ? autoPlayTargetQuestions.filter(q => {
        if (autoPlaySettings.playText || autoPlaySettings.playTranslation) return true;
        const questionKey = getQuestionStatusKey(gameState.selectedDifficulty, gameState.selectedLevel, q);
        return !!currentQuestionExamples.get(questionKey);
      }).length
      : 0;
    const learningLevelSelectionOptions: Array<{ level: LearningLevel; label: string; questions: Question[]; className: string }> = wordListToolsOpen ? [
      {
        level: 1,
        label: '学習中',
        questions: visiblePlayableQuestions.filter(q => getEffectiveLearningLevel(getManualQuestionStatus(gameState.selectedDifficulty, gameState.selectedLevel, q)) === 1),
        className: 'border-sky-500/40 text-sky-200 hover:bg-sky-900/20',
      },
      {
        level: 2,
        label: 'もう少し',
        questions: visiblePlayableQuestions.filter(q => getEffectiveLearningLevel(getManualQuestionStatus(gameState.selectedDifficulty, gameState.selectedLevel, q)) === 2),
        className: 'border-emerald-500/40 text-emerald-200 hover:bg-emerald-900/20',
      },
      {
        level: 3,
        label: '覚えた',
        questions: visiblePlayableQuestions.filter(q => getEffectiveLearningLevel(getManualQuestionStatus(gameState.selectedDifficulty, gameState.selectedLevel, q)) === 3),
        className: 'border-violet-500/40 text-violet-200 hover:bg-violet-900/20',
      },
    ] : [];
    const manualReviewSamples = wordListToolsOpen ? manualReviewQuestions.slice(0, 5).map(q => q.text).join(' / ') : '';
    const emptyListTitle = questionListFilter === 'marked'
      ? 'あとで復習に追加した用語はまだありません'
      : questionListFilter === 'weak'
        ? 'この一覧に苦手語はまだありません'
        : '表示できる用語がありません';
    const emptyListDescription = questionListFilter === 'marked'
      ? 'バトル中や問題一覧で「あとで復習」を押すと、ここに集められます。'
      : '通常の一覧に戻して、出題できる問題を確認できます。';

    const startReviewFromList = (mode: Mode, inputMode: InputMode) => {
      if (reviewTargetQuestions.length === 0) return;
      startGame(gameState.selectedDifficulty, gameState.selectedLevel, mode, inputMode, reviewTargetQuestions);
    };

    const startManualReview = (mode: Mode, inputMode: InputMode) => {
      if (manualReviewQuestions.length === 0) return;
      startGame(gameState.selectedDifficulty, gameState.selectedLevel, mode, inputMode, manualReviewQuestions);
    };

    const startTopMissReview = (mode: Mode, inputMode: InputMode) => {
      if (topMissedQuestions.length === 0) return;
      startGame(gameState.selectedDifficulty, gameState.selectedLevel, mode, inputMode, topMissedQuestions);
    };

    const updateAutoPlaySetting = <K extends keyof AutoPlaySettings>(key: K, value: AutoPlaySettings[K]) => {
      setAutoPlaySettings(prev => ({
        ...prev,
        [key]: value,
      }));
    };

    const handleStartAutoPlay = () => {
      if (!autoPlaySettings.playText && !autoPlaySettings.playTranslation && !autoPlaySettings.playExample) {
        setAutoPlayStatusText('再生対象を1つ以上選んでください');
        return;
      }

      const getEnglishAutoPlaySpeechConfig = () => resolveSpeechConfig(speechVoices, speechVoiceMode);
      const playbackQuestions = autoPlaySettings.shuffle
        ? shuffleQuestions(autoPlayTargetQuestions)
        : autoPlayTargetQuestions;

      const entries = playbackQuestions.flatMap((question, questionIndex) => {
        const questionKey = getQuestionStatusKey(gameState.selectedDifficulty, gameState.selectedLevel, question);
        const example = currentQuestionExamples.get(questionKey);
        const nextEntries: Array<{
          label: string;
          text: string;
          lang: string;
          voice: SpeechSynthesisVoice | null;
          gapAfterSeconds: number;
          nowPlaying: AutoPlayNowPlaying;
        }> = [];
        const pushEntry = (entry: {
          label: string;
          text: string;
          lang: string;
          voice: SpeechSynthesisVoice | null;
          nowPlaying: AutoPlayNowPlaying;
        }) => {
          nextEntries.push({
            ...entry,
            gapAfterSeconds: autoPlaySettings.itemGapSeconds,
          });
        };

        if (autoPlaySettings.sequenceMode === 'exampleFirst' && autoPlaySettings.playExample && example) {
          const speechConfig = getEnglishAutoPlaySpeechConfig();
          pushEntry({
            label: `例文: ${question.text}`,
            text: example,
            lang: speechConfig.lang,
            voice: speechConfig.voice,
            nowPlaying: {
              questionText: question.text,
              translation: question.translation,
              basicMeaning: question.basicMeaning,
              example,
              activePart: 'example',
            },
          });
        }

        if (autoPlaySettings.sequenceMode === 'exampleTextExample' && autoPlaySettings.playExample && example) {
          const speechConfig = getEnglishAutoPlaySpeechConfig();
          pushEntry({
            label: `例文: ${question.text}`,
            text: example,
            lang: speechConfig.lang,
            voice: speechConfig.voice,
            nowPlaying: {
              questionText: question.text,
              translation: question.translation,
              basicMeaning: question.basicMeaning,
              example,
              activePart: 'example',
            },
          });
        }

        if (autoPlaySettings.playText) {
          const speechConfig = getEnglishAutoPlaySpeechConfig();
          pushEntry({
            label: `単語: ${question.text}`,
            text: question.text,
            lang: speechConfig.lang,
            voice: speechConfig.voice,
            nowPlaying: {
              questionText: question.text,
              translation: question.translation,
              basicMeaning: question.basicMeaning,
              example: example ?? null,
              activePart: 'text',
            },
          });
        }

        if (autoPlaySettings.playTranslation) {
          pushEntry({
            label: `和訳: ${question.translation}`,
            text: question.translation,
            lang: autoPlayJapaneseVoice?.lang || 'ja-JP',
            voice: autoPlayJapaneseVoice,
            nowPlaying: {
              questionText: question.text,
              translation: question.translation,
              basicMeaning: question.basicMeaning,
              example: example ?? null,
              activePart: 'translation',
            },
          });
        }

        if (autoPlaySettings.playExample && example && autoPlaySettings.sequenceMode !== 'exampleFirst') {
          const speechConfig = getEnglishAutoPlaySpeechConfig();
          pushEntry({
            label: `例文: ${question.text}`,
            text: example,
            lang: speechConfig.lang,
            voice: speechConfig.voice,
            nowPlaying: {
              questionText: question.text,
              translation: question.translation,
              basicMeaning: question.basicMeaning,
              example,
              activePart: 'example',
            },
          });
        }

        if (nextEntries.length > 0) {
          nextEntries[nextEntries.length - 1].gapAfterSeconds = questionIndex < playbackQuestions.length - 1
            ? autoPlaySettings.questionGapSeconds
            : 0;
        }

        return nextEntries;
      });

      startAutoPlaySequence(entries);
    };

    const activeQuestionListRenderLimit = (isAutoPlaying || wordListToolsOpen)
      ? COMPACT_QUESTION_LIST_RENDER_LIMIT
      : questionListRenderLimit;
    const shouldLimitQuestionList = visibleQuestions.length > activeQuestionListRenderLimit;
    const renderedQuestions = shouldLimitQuestionList
      ? visibleQuestions.slice(0, activeQuestionListRenderLimit)
      : visibleQuestions;
    const questionRows = renderedQuestions.map((q, idx) => {
      const questionKey = getQuestionStatusKey(gameState.selectedDifficulty, gameState.selectedLevel, q);
      const synonyms = ['Eiken5', 'Eiken4', 'EikenPre1'].includes(gameState.selectedDifficulty) && gameState.selectedLevel !== 3
        ? getQuestionSynonyms(gameState.selectedDifficulty, gameState.selectedLevel, q)
        : [];
      return (
        <QuestionListRow
          key={questionKey}
          idx={idx}
          displayIndex={idx + 1}
          question={q}
          questionKey={questionKey}
          isWeakQuestion={weakQuestionTexts.has(q.text)}
          stats={weakQuestionStats[q.text]}
          manualStatus={getManualQuestionStatus(gameState.selectedDifficulty, gameState.selectedLevel, q)}
          isSelectedForAutoPlay={selectedQuestionKeySet.has(questionKey)}
          isMarkedForReview={markedQuestionKeySet.has(questionKey)}
          example={currentQuestionExamples.get(questionKey)}
          synonyms={synonyms}
          onSpeak={speakWithSettings}
          onToggleSelected={handleToggleSelectedQuestion}
          onToggleMarked={handleToggleMarkedQuestion}
          onUpdateManualLevel={handleUpdateManualLevel}
          onToggleExcluded={handleToggleExcludedQuestion}
        />
      );
    });

    return (
      <ScreenContainer className="bg-slate-900">
        <div className="max-w-4xl w-full p-4 h-full flex flex-col">
           <div className="flex justify-between items-center mb-6 flex-shrink-0">
              <GameButton size="sm" variant="outline" onClick={() => setGameState(prev => ({ ...prev, screen: 'title' }))}>&larr; タイトルへ</GameButton>
              <h2 className="text-2xl font-bold text-blue-300 flex items-center gap-2"><ClipboardList /> 問題リスト (Word List)</h2>
           </div>
           <div className="flex flex-col md:flex-row gap-4 mb-6 flex-shrink-0">
               <div className="flex flex-wrap bg-slate-800 p-1 rounded-lg">{DIFFICULTIES.map(d => (<button key={d} onClick={() => updateSelectedDifficulty(d)} className={`px-4 py-2 rounded-md font-bold transition-colors ${gameState.selectedDifficulty === d ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>{DIFFICULTY_LABELS[d]}</button>))}</div>
               <div className="flex bg-slate-800 p-1 rounded-lg">{getAvailableLevels(gameState.selectedDifficulty).map(l => (<button key={l} onClick={() => setGameState(prev => ({ ...prev, selectedLevel: l }))} className={`px-4 py-2 rounded-md font-bold transition-colors ${gameState.selectedLevel === l ? 'bg-green-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>Level {l}</button>))}</div>
           </div>
           <div className="mb-4 flex-shrink-0 rounded-2xl border border-cyan-500/20 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_58%),linear-gradient(145deg,rgba(15,23,42,0.96),rgba(12,18,32,0.92))] p-4 shadow-[0_0_30px_rgba(34,211,238,0.08)]">
             <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
               <div>
                 <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300">Word Progress</p>
                 <h3 className="mt-1 text-xl font-black text-white">{'\u5b66\u7fd2\u306e\u9032\u307f\u5177\u5408'}</h3>
               </div>
               <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/40 bg-orange-900/30 px-4 py-2 text-sm font-bold text-orange-200">
                 <AlertCircle size={16} className="text-orange-300" />
                 {'\u82e6\u624b'} {weakCountInView}{'\u4ef6'}
               </div>
             </div>
             <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
               <div className="rounded-2xl border border-sky-400/30 bg-sky-500/12 p-4 shadow-[0_0_24px_rgba(56,189,248,0.12)]">
                 <div className="flex items-center gap-2 text-sky-200">
                   <BookOpen size={18} className="text-sky-300" />
                   <p className="text-[12px] font-black tracking-[0.16em]">{'\u5b66\u7fd2\u4e2d'}</p>
                 </div>
                <p className="mt-3 text-4xl font-black leading-none text-white">{learningSummary.learningCount}</p>
               </div>
               <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/12 p-4 shadow-[0_0_24px_rgba(52,211,153,0.12)]">
                 <div className="flex items-center gap-2 text-emerald-200">
                   <CheckCircle2 size={18} className="text-emerald-300" />
                   <p className="text-[12px] font-black tracking-[0.16em]">{'\u3082\u3046\u5c11\u3057'}</p>
                 </div>
                <p className="mt-3 text-4xl font-black leading-none text-white">{learningSummary.cautionCount}</p>
               </div>
               <div className="rounded-2xl border border-violet-400/30 bg-violet-500/12 p-4 shadow-[0_0_28px_rgba(167,139,250,0.16)]">
                 <div className="flex items-center gap-2 text-violet-200">
                   <Crown size={18} className="text-violet-300" />
                   <p className="text-[12px] font-black tracking-[0.16em]">{'\u899a\u3048\u305f'}</p>
                 </div>
                <p className="mt-3 bg-gradient-to-r from-violet-100 via-white to-violet-200 bg-clip-text text-4xl font-black leading-none text-transparent">{learningSummary.masteredCount}</p>
               </div>
               <div className="rounded-2xl border border-slate-500/40 bg-slate-900/70 p-4 text-slate-300">
                 <div className="flex items-center gap-2 text-slate-300">
                   <Shield size={18} className="text-slate-400" />
                   <p className="text-[12px] font-black tracking-[0.16em]">{'\u9664\u5916\u4e2d'}</p>
                 </div>
                <p className="mt-3 text-3xl font-black leading-none text-white">{learningSummary.excludedCount}</p>
               </div>
             </div>
           </div>
           <div className="mb-4 hidden flex-shrink-0">
             <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/40 bg-orange-900/30 px-4 py-2 text-sm font-bold text-orange-200">
               <AlertCircle size={16} className="text-orange-300" />
               この一覧の苦手語: {weakCountInView}件
             </div>
             <div className="mt-3 flex flex-wrap gap-3">
               <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-950/20 px-4 py-2 text-sm font-bold text-sky-200">
                 <BookOpen size={16} className="text-sky-300" />
                 学習中 {manualStudyCount}件
               </div>
               <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/20 px-4 py-2 text-sm font-bold text-emerald-200">
                 <CheckCircle2 size={16} className="text-emerald-300" />
                 もう少し {manualCautionCount}件
               </div>
               <div className="inline-flex items-center gap-2 rounded-full border border-slate-500/40 bg-slate-800/80 px-4 py-2 text-sm font-bold text-slate-300">
                 <Shield size={16} className="text-slate-400" />
                 除外 {excludedQuestions.length}件
               </div>
             </div>
           </div>
            <div className="mb-4 flex-shrink-0">
              <div className="flex flex-wrap gap-3">
                <div className="flex bg-slate-800 p-1 rounded-lg self-start">
                <button onClick={() => setQuestionListFilter('all')} className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${questionListFilter === 'all' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>すべて</button>
                <button onClick={() => setQuestionListFilter('weak')} className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${questionListFilter === 'weak' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>苦手だけ</button>
                <button onClick={() => setQuestionListFilter('marked')} className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${questionListFilter === 'marked' ? 'bg-yellow-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>あとで復習</button>
                </div>
                {questionListFilter === 'weak' && (
                  <div className="flex bg-slate-800 p-1 rounded-lg self-start">
                    <button onClick={() => setWeakListSort('recent')} className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${weakListSort === 'recent' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>最近ミス順</button>
                    <button onClick={() => setWeakListSort('frequent')} className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${weakListSort === 'frequent' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>回数順</button>
                  </div>
                )}
              </div>
            </div>
            <div className="mb-4 flex-shrink-0">
              <button
                onClick={() => setWordListToolsOpen(prev => !prev)}
                className="flex w-full items-center justify-between rounded-xl border border-cyan-500/30 bg-cyan-950/20 px-4 py-3 text-left transition-colors hover:bg-cyan-900/25"
              >
                <div>
                  <p className="text-sm font-bold text-cyan-200">選択・自動再生ツール</p>
                  <p className="mt-1 text-xs text-slate-400">任意選択、25語まとめ選択、自動再生を必要なときだけ開けます。</p>
                </div>
                <span className="text-sm font-bold text-cyan-100">{wordListToolsOpen ? '閉じる ▲' : '開く ▼'}</span>
              </button>
            </div>
            {wordListToolsOpen && (
            <>
            <div className="mb-4 flex-shrink-0 rounded-xl border border-sky-500/30 bg-sky-950/20 p-4">
              <div className="mb-3 hidden flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-bold text-sky-200">自分で決めた学習メモから復習する</p>
                  <p className="mt-1 text-xs text-slate-400">学習中と「もう少し」にした単語をまとめて復習できます。苦手判定はこれまで通りゲーム側でも続き、除外した単語だけここから外れます。</p>
                </div>
                <div className="text-xs text-slate-300">
                  {manualReviewQuestions.length > 0 ? manualReviewSamples : 'まだありません'}
                </div>
              </div>
              <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-bold text-sky-200">{'\u624b\u52d5\u8a2d\u5b9a\u306e\u5358\u8a9e\u3092\u307e\u3068\u3081\u3066\u5fa9\u7fd2'}</p>
                  <p className="mt-1 text-xs text-slate-400">{'\u300c\u5b66\u7fd2\u4e2d\u300d\u3068\u300c\u3082\u3046\u5c11\u3057\u300d\u306b\u3057\u305f\u5358\u8a9e\u3092\u307e\u3068\u3081\u3066\u5fa9\u7fd2\u3067\u304d\u307e\u3059\u3002\u82e6\u624b\u5224\u5b9a\u306f\u3053\u308c\u307e\u3067\u901a\u308a\u30b2\u30fc\u30e0\u5074\u3067\u3082\u7d9a\u304d\u3001\u9664\u5916\u3057\u305f\u5358\u8a9e\u3060\u3051\u3053\u3053\u304b\u3089\u5916\u308c\u307e\u3059\u3002'}</p>
                </div>
                <div className="text-xs text-slate-300">
                  {manualReviewQuestions.length > 0 ? manualReviewSamples : '\u307e\u3060\u3042\u308a\u307e\u305b\u3093'}
                </div>
              </div>
              <div className="hidden grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <GameButton onClick={() => startManualReview('guide', 'voice-text')} size="sm" variant="outline" className="border-blue-500/40 text-blue-200 hover:bg-blue-900/20" disabled={manualReviewQuestions.length === 0}>
                  <Brain size={16} className="mr-1" /> Basic Training復習
                </GameButton>
                <GameButton onClick={() => startManualReview('challenge', 'voice-text')} size="sm" variant="outline" className="border-indigo-500/40 text-indigo-200 hover:bg-indigo-900/20" disabled={manualReviewQuestions.length === 0}>
                  <Volume2 size={16} className="mr-1" /> Listening Training復習
                </GameButton>
                <GameButton onClick={() => startManualReview('challenge', 'voice-only')} size="sm" variant="outline" className="border-orange-500/40 text-orange-200 hover:bg-orange-900/20" disabled={manualReviewQuestions.length === 0}>
                  <Sword size={16} className="mr-1" /> Listening Battle復習
                </GameButton>
                <GameButton onClick={() => startManualReview('challenge', 'text-only')} size="sm" className="bg-sky-600 border-sky-400 text-white hover:bg-sky-500" disabled={manualReviewQuestions.length === 0}>
                  <Flame size={16} className="mr-1" /> Translation Battle復習
                </GameButton>
              </div>
            </div>
            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4 flex-shrink-0">
              <GameButton onClick={() => startManualReview('guide', 'voice-text')} size="sm" variant="outline" className="border-blue-500/40 text-blue-200 hover:bg-blue-900/20" disabled={manualReviewQuestions.length === 0}>
                <Brain size={16} className="mr-1" /> {'Basic Training\u5fa9\u7fd2'}
              </GameButton>
              <GameButton onClick={() => startManualReview('challenge', 'voice-text')} size="sm" variant="outline" className="border-indigo-500/40 text-indigo-200 hover:bg-indigo-900/20" disabled={manualReviewQuestions.length === 0}>
                <Volume2 size={16} className="mr-1" /> {'Listening Training\u5fa9\u7fd2'}
              </GameButton>
              <GameButton onClick={() => startManualReview('challenge', 'voice-only')} size="sm" variant="outline" className="border-orange-500/40 text-orange-200 hover:bg-orange-900/20" disabled={manualReviewQuestions.length === 0}>
                <Sword size={16} className="mr-1" /> {'Listening Battle\u5fa9\u7fd2'}
              </GameButton>
              <GameButton onClick={() => startManualReview('challenge', 'text-only')} size="sm" className="bg-sky-600 border-sky-400 text-white hover:bg-sky-500" disabled={manualReviewQuestions.length === 0}>
                <Flame size={16} className="mr-1" /> {'Translation Battle\u5fa9\u7fd2'}
              </GameButton>
            </div>
            <div className="mb-4 flex-shrink-0 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4 shadow-[0_0_24px_rgba(34,211,238,0.08)]">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300">Auto Play</p>
                  <h3 className="mt-1 text-xl font-black text-white">単語一覧の連続再生</h3>
                  <p className="mt-2 text-xs text-slate-300">苦手語だけ、または自分で選んだ単語だけを連続再生できます。和訳は日本語音声、用語と例文は英語音声で読み上げます。</p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-200">
                  <div>対象数: <span className="font-black text-white">{autoPlayTargetQuestions.length}</span></div>
                  <div>再生可能: <span className="font-black text-cyan-200">{autoPlayPlayableQuestionCount}</span></div>
                  <div className="mt-1 text-xs text-slate-400">{autoPlayStatusText}</div>
                </div>
              </div>
              <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
                <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                  <p className="text-sm font-bold text-cyan-200">1. 再生元</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => updateAutoPlaySetting('source', 'all')}
                      className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${autoPlaySettings.source === 'all' ? 'border-emerald-300 bg-emerald-500/20 text-emerald-100' : 'border-slate-600 bg-slate-900/70 text-slate-300 hover:border-slate-500 hover:text-white'}`}
                    >
                      このレベル全部 ({visiblePlayableQuestions.length})
                    </button>
                    <button
                      onClick={() => updateAutoPlaySetting('source', 'weak')}
                      className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${autoPlaySettings.source === 'weak' ? 'border-orange-300 bg-orange-500/20 text-orange-100' : 'border-slate-600 bg-slate-900/70 text-slate-300 hover:border-slate-500 hover:text-white'}`}
                    >
                      苦手語だけ ({weakQuestionsInView.length})
                    </button>
                    <button
                      onClick={() => updateAutoPlaySetting('source', 'marked')}
                      className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${autoPlaySettings.source === 'marked' ? 'border-yellow-300 bg-yellow-500/20 text-yellow-100' : 'border-slate-600 bg-slate-900/70 text-slate-300 hover:border-slate-500 hover:text-white'}`}
                    >
                      あとで復習 ({markedQuestionsInView.length})
                    </button>
                    <button
                      onClick={() => updateAutoPlaySetting('source', 'selected')}
                      className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${autoPlaySettings.source === 'selected' ? 'border-cyan-300 bg-cyan-500/20 text-cyan-100' : 'border-slate-600 bg-slate-900/70 text-slate-300 hover:border-slate-500 hover:text-white'}`}
                    >
                      自分で選んだ語 ({selectedQuestionsInView.length})
                    </button>
                  </div>
                  <p className="mt-4 text-sm font-bold text-cyan-200">2. 再生する内容</p>
                  {autoPlaySettings.source !== 'all' && autoPlayTargetQuestions.length === 0 && visiblePlayableQuestions.length > 0 && (
                    <p className="mt-3 text-xs text-amber-200">
                      このレベルでは、まだ対象語がありません。「このレベル全部」を選ぶと自動再生できます。
                    </p>
                  )}
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {[
                      { key: 'playText', label: '用語', checked: autoPlaySettings.playText },
                      { key: 'playTranslation', label: '和訳', checked: autoPlaySettings.playTranslation },
                      { key: 'playExample', label: '例文', checked: autoPlaySettings.playExample },
                    ].map(item => (
                      <label key={item.key} className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-200">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={(e) => updateAutoPlaySetting(item.key as keyof AutoPlaySettings, e.target.checked as never)}
                          className="h-4 w-4 rounded border-slate-500 bg-slate-900 text-cyan-400"
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                  <p className="mt-4 text-sm font-bold text-cyan-200">再生順</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {[
                      { key: 'normal', label: '通常順', note: '用語→和訳→例文' },
                      { key: 'exampleFirst', label: '例文を先に', note: '例文→用語→和訳' },
                      { key: 'exampleTextExample', label: '例文で挟む', note: '例文→用語→例文' },
                    ].map(option => (
                      <button
                        key={option.key}
                        onClick={() => updateAutoPlaySetting('sequenceMode', option.key as AutoPlaySequenceMode)}
                        className={`rounded-lg border px-3 py-2 text-left transition-colors ${autoPlaySettings.sequenceMode === option.key ? 'border-violet-300 bg-violet-500/20 text-violet-50' : 'border-slate-600 bg-slate-900/70 text-slate-300 hover:border-slate-500 hover:text-white'}`}
                      >
                        <span className="block text-sm font-bold">{option.label}</span>
                        <span className="mt-1 block text-[11px] text-slate-400">{option.note}</span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-4 text-sm font-bold text-cyan-200">3. 間隔</p>
                  <label className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-200">
                    <span className="font-bold text-cyan-100">{'リピート再生'}</span>
                    <input
                      type="checkbox"
                      checked={autoPlaySettings.repeat}
                      onChange={(e) => updateAutoPlaySetting('repeat', e.target.checked)}
                      className="h-4 w-4 rounded border-slate-500 bg-slate-900 text-cyan-400"
                    />
                  </label>
                  <label className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-200">
                    <span className="font-bold text-cyan-100">{'シャッフル再生'}</span>
                    <input
                      type="checkbox"
                      checked={autoPlaySettings.shuffle}
                      onChange={(e) => updateAutoPlaySetting('shuffle', e.target.checked)}
                      className="h-4 w-4 rounded border-slate-500 bg-slate-900 text-cyan-400"
                    />
                  </label>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-3 text-sm text-slate-200">
                      <span className="block text-xs font-bold uppercase tracking-wide text-slate-400">用語・和訳・例文の間隔</span>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        step={0.5}
                        value={autoPlaySettings.itemGapSeconds}
                        onChange={(e) => updateAutoPlaySetting('itemGapSeconds', Math.min(10, Math.max(0, Number(e.target.value) || 0)))}
                        className="mt-2 w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-white"
                      />
                    </label>
                    <label className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-3 text-sm text-slate-200">
                      <span className="block text-xs font-bold uppercase tracking-wide text-slate-400">次の用語までの間隔</span>
                      <input
                        type="number"
                        min={0}
                        max={15}
                        step={0.5}
                        value={autoPlaySettings.questionGapSeconds}
                        onChange={(e) => updateAutoPlaySetting('questionGapSeconds', Math.min(15, Math.max(0, Number(e.target.value) || 0)))}
                        className="mt-2 w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-white"
                      />
                    </label>
                  </div>
                  <div className="mt-4 rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-cyan-200">英語の再生速度</span>
                      <span className="text-sm font-bold text-white">{autoPlaySettings.playbackRatePercent / 100}x</span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {AUTO_PLAY_RATE_OPTIONS.map(rateOption => (
                        <button
                          key={rateOption}
                          onClick={() => updateAutoPlaySetting('playbackRatePercent', rateOption)}
                          className={`rounded-lg border px-2 py-2 text-sm font-bold transition-colors ${autoPlaySettings.playbackRatePercent === rateOption ? 'border-cyan-300 bg-cyan-500/20 text-cyan-100' : 'border-slate-600 bg-slate-900/70 text-slate-300 hover:border-slate-500 hover:text-white'}`}
                        >
                          {rateOption / 100}x
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-cyan-200">現在再生中</span>
                      <span className="text-xs font-bold text-slate-400">{isAutoPlaying ? '再生中' : '待機中'}</span>
                    </div>
                    {autoPlayNowPlaying ? (
                      <div className="mt-3 space-y-2">
                        <div className={`rounded-lg border px-3 py-2 text-sm transition-colors ${autoPlayNowPlaying.activePart === 'text' ? 'border-cyan-300 bg-cyan-500/15 text-cyan-50' : 'border-slate-700 bg-slate-900/70 text-slate-300'}`}>
                          <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">用語</div>
                          <div className="mt-1 break-words font-semibold">{autoPlayNowPlaying.questionText}</div>
                        </div>
                        <div className={`rounded-lg border px-3 py-2 text-sm transition-colors ${autoPlayNowPlaying.activePart === 'translation' ? 'border-emerald-300 bg-emerald-500/15 text-emerald-50' : 'border-slate-700 bg-slate-900/70 text-slate-300'}`}>
                          <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">和訳</div>
                          <div className="mt-1 break-words font-semibold">{autoPlayNowPlaying.translation}</div>
                          {autoPlayNowPlaying.basicMeaning && (
                            <div className="mt-1 break-words text-[11px] font-medium text-slate-400">
                              Basic: {autoPlayNowPlaying.basicMeaning}
                            </div>
                          )}
                        </div>
                        {autoPlayNowPlaying.example && (
                          <div className={`rounded-lg border px-3 py-2 text-sm transition-colors ${autoPlayNowPlaying.activePart === 'example' ? 'border-violet-300 bg-violet-500/15 text-violet-50' : 'border-slate-700 bg-slate-900/70 text-slate-300'}`}>
                            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">例文</div>
                            <div className="mt-1 break-words leading-relaxed">{autoPlayNowPlaying.example}</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 rounded-lg border border-dashed border-slate-700 bg-slate-900/50 px-3 py-4 text-sm text-slate-400">
                        再生を開始すると、ここに用語・和訳・例文を表示します。
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <GameButton
                      onClick={handleStartAutoPlay}
                      size="sm"
                      className="bg-cyan-600 border-cyan-400 text-white hover:bg-cyan-500"
                      disabled={isAutoPlaying || autoPlayPlayableQuestionCount === 0}
                    >
                      <Volume2 size={16} className="mr-1" /> 連続再生を開始
                    </GameButton>
                    <GameButton
                      onClick={() => stopAutoPlay()}
                      size="sm"
                      variant="outline"
                      className="border-slate-500 text-slate-200 hover:bg-slate-800"
                      disabled={!isAutoPlaying}
                    >
                      <Square size={16} className="mr-1" /> 停止
                    </GameButton>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-sm font-bold text-cyan-200">任意選択リスト</p>
                      <p className="mt-1 text-xs text-slate-400">この難易度・レベルで選んだ単語は自動保存されます。さらに名前を付けて複数保存できます。</p>
                    </div>
                    <div className="text-xs text-slate-400">現在の選択: {selectedQuestionsInView.length}語</div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <GameButton
                      onClick={() => updateSelectedQuestionKeysForScope(gameState.selectedDifficulty, gameState.selectedLevel, weakQuestionsInView.map(q => getQuestionStatusKey(gameState.selectedDifficulty, gameState.selectedLevel, q)))}
                      size="sm"
                      variant="outline"
                      className="border-orange-500/40 text-orange-200 hover:bg-orange-900/20"
                    >
                      苦手語を全部選択
                    </GameButton>
                    <GameButton
                      onClick={() => updateSelectedQuestionKeysForScope(gameState.selectedDifficulty, gameState.selectedLevel, markedQuestionsInView.map(q => getQuestionStatusKey(gameState.selectedDifficulty, gameState.selectedLevel, q)))}
                      size="sm"
                      variant="outline"
                      className="border-yellow-500/40 text-yellow-100 hover:bg-yellow-900/20"
                    >
                      あとで復習を全部選択
                    </GameButton>
                    <GameButton
                      onClick={() => updateSelectedQuestionKeysForScope(gameState.selectedDifficulty, gameState.selectedLevel, visiblePlayableQuestions.map(q => getQuestionStatusKey(gameState.selectedDifficulty, gameState.selectedLevel, q)))}
                      size="sm"
                      variant="outline"
                      className="border-blue-500/40 text-blue-200 hover:bg-blue-900/20"
                    >
                      表示中を全部選択
                    </GameButton>
                    <GameButton
                      onClick={() => updateSelectedQuestionKeysForScope(gameState.selectedDifficulty, gameState.selectedLevel, [])}
                      size="sm"
                      variant="outline"
                      className="border-slate-500 text-slate-200 hover:bg-slate-800"
                    >
                      選択解除
                    </GameButton>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {learningLevelSelectionOptions.map(option => (
                      <GameButton
                        key={option.level}
                        onClick={() => updateSelectedQuestionKeysForScope(
                          gameState.selectedDifficulty,
                          gameState.selectedLevel,
                          option.questions.map(q => getQuestionStatusKey(gameState.selectedDifficulty, gameState.selectedLevel, q)),
                        )}
                        size="sm"
                        variant="outline"
                        className={option.className}
                      >
                        {option.label}を選択 ({option.questions.length})
                      </GameButton>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-col gap-3 md:flex-row">
                    <input
                      value={selectionListName}
                      onChange={(e) => setSelectionListName(e.target.value)}
                      placeholder="保存名を入力"
                      className="flex-1 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                    />
                    <GameButton
                      onClick={() => saveCurrentSelectionList(gameState.selectedDifficulty, gameState.selectedLevel, selectedQuestionKeys, selectionListName)}
                      size="sm"
                      className="bg-emerald-600 border-emerald-400 text-white hover:bg-emerald-500"
                      disabled={selectedQuestionKeys.length === 0 || selectionListName.trim().length === 0}
                    >
                      保存する
                    </GameButton>
                  </div>
                  <div className="mt-4 space-y-2">
                    {savedSelectionListsInScope.length > 0 ? savedSelectionListsInScope.map(list => (
                      <div key={list.id} className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="font-bold text-white">{list.name}</div>
                          <div className="mt-1 text-xs text-slate-400">{list.questionKeys.length}語 / 更新 {new Date(list.updatedAt).toLocaleString('ja-JP')}</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <GameButton onClick={() => applySavedSelectionList(list)} size="sm" variant="outline" className="border-cyan-500/40 text-cyan-200 hover:bg-cyan-900/20">
                            読み込む
                          </GameButton>
                          <GameButton onClick={() => deleteSavedSelectionList(list.id)} size="sm" variant="outline" className="border-red-500/40 text-red-200 hover:bg-red-900/20">
                            削除
                          </GameButton>
                        </div>
                      </div>
                    )) : (
                      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/50 px-3 py-4 text-sm text-slate-400">まだ保存済みリストはありません。</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            </>
            )}
            {questionListFilter === 'weak' && (
              <div className="mb-4 flex-shrink-0">
                <button
                  onClick={() => setWeakReviewPanelOpen(prev => !prev)}
                  className="flex w-full items-center justify-between rounded-xl border border-orange-500/30 bg-orange-950/20 px-4 py-3 text-left transition-colors hover:bg-orange-900/25"
                >
                  <div>
                    <p className="text-sm font-bold text-orange-200">苦手語レビュー詳細</p>
                    <p className="mt-1 text-xs text-slate-400">苦手語の統計や復習ボタンは必要なときだけ開けます。</p>
                  </div>
                  <span className="text-sm font-bold text-orange-100">{weakReviewPanelOpen ? '閉じる ▲' : '開く ▼'}</span>
                </button>
              </div>
            )}
            {questionListFilter === 'weak' && weakReviewPanelOpen && (
              <div className="mb-4 grid gap-4 md:grid-cols-3 flex-shrink-0">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-300">Recent Mistakes</p>
                  <p className="mt-2 text-2xl font-black text-white">{recentWeakSamples.length}</p>
                  <p className="mt-2 text-xs text-slate-300">{recentWeakSamples.length > 0 ? recentWeakSamples.map(q => q.text).join(' / ') : 'まだありません'}</p>
                </div>
                <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-amber-300">Repeated Mistakes</p>
                  <p className="mt-2 text-2xl font-black text-white">{weakQuestionsInView.filter(q => (weakQuestionStats[q.text]?.missCount ?? 0) >= 2).length}</p>
                  <p className="mt-2 text-xs text-slate-300">{repeatedWeakSamples.length > 0 ? repeatedWeakSamples.map(q => `${q.text} x${weakQuestionStats[q.text]?.missCount ?? 0}`).join(' / ') : 'まだありません'}</p>
                </div>
                <div className="rounded-xl border border-orange-500/30 bg-orange-950/20 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-orange-300">Need Review</p>
                  <p className="mt-2 text-2xl font-black text-white">{weakQuestionsInView.length}</p>
                  <p className="mt-2 text-xs text-slate-300">まだ克服できていない苦手語です。</p>
                </div>
              </div>
            )}
            {questionListFilter === 'weak' && weakReviewPanelOpen && (
              <div className="mb-4 flex-shrink-0 rounded-xl border border-orange-500/30 bg-orange-950/20 p-4">
                <div className="mb-3">
                  <p className="text-sm font-bold text-orange-200">表示中の苦手語を復習する</p>
                  <p className="mt-1 text-xs text-slate-400">一覧を見てから、自分に合ったモードでそのまま復習できます。</p>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <GameButton onClick={() => startReviewFromList('guide', 'voice-text')} size="sm" variant="outline" className="border-blue-500/40 text-blue-200 hover:bg-blue-900/20" disabled={reviewTargetQuestions.length === 0}>
                    <Brain size={16} className="mr-1" /> Basic Training復習
                  </GameButton>
                  <GameButton onClick={() => startReviewFromList('challenge', 'voice-text')} size="sm" variant="outline" className="border-indigo-500/40 text-indigo-200 hover:bg-indigo-900/20" disabled={reviewTargetQuestions.length === 0}>
                    <Volume2 size={16} className="mr-1" /> Listening Training復習
                  </GameButton>
                  <GameButton onClick={() => startReviewFromList('challenge', 'voice-only')} size="sm" variant="outline" className="border-orange-500/40 text-orange-200 hover:bg-orange-900/20" disabled={reviewTargetQuestions.length === 0}>
                    <Sword size={16} className="mr-1" /> Listening Battle復習
                  </GameButton>
                  <GameButton onClick={() => startReviewFromList('challenge', 'text-only')} size="sm" className="bg-orange-600 border-orange-400 text-white hover:bg-orange-500" disabled={reviewTargetQuestions.length === 0}>
                    <Flame size={16} className="mr-1" /> Translation Battle復習
                  </GameButton>
                </div>
              </div>
            )}
            {questionListFilter === 'weak' && weakReviewPanelOpen && (
              <div className="mb-4 flex-shrink-0 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
                <div className="mb-3">
                  <p className="text-sm font-bold text-amber-200">特に間違いが多い問題から復習する</p>
                  <p className="mt-1 text-xs text-slate-400">ミス回数が多い順の上位問題を優先して、集中的に復習できます。</p>
                </div>
                <div className="mb-3 text-xs text-slate-300">
                  {topMissedQuestions.length > 0
                    ? topMissedQuestions.slice(0, 5).map(q => `${q.text} x${weakQuestionStats[q.text]?.missCount ?? 0}`).join(' / ')
                    : 'まだ対象がありません'}
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <GameButton onClick={() => startTopMissReview('guide', 'voice-text')} size="sm" variant="outline" className="border-blue-500/40 text-blue-200 hover:bg-blue-900/20" disabled={topMissedQuestions.length === 0}>
                    <Brain size={16} className="mr-1" /> Basic上位復習
                  </GameButton>
                  <GameButton onClick={() => startTopMissReview('challenge', 'voice-text')} size="sm" variant="outline" className="border-indigo-500/40 text-indigo-200 hover:bg-indigo-900/20" disabled={topMissedQuestions.length === 0}>
                    <Volume2 size={16} className="mr-1" /> Listening上位復習
                  </GameButton>
                  <GameButton onClick={() => startTopMissReview('challenge', 'voice-only')} size="sm" variant="outline" className="border-orange-500/40 text-orange-200 hover:bg-orange-900/20" disabled={topMissedQuestions.length === 0}>
                    <Sword size={16} className="mr-1" /> 音声上位復習
                  </GameButton>
                  <GameButton onClick={() => startTopMissReview('challenge', 'text-only')} size="sm" className="bg-amber-600 border-amber-400 text-white hover:bg-amber-500" disabled={topMissedQuestions.length === 0}>
                    <Flame size={16} className="mr-1" /> 和訳上位復習
                  </GameButton>
                </div>
              </div>
            )}
            <div className="flex-1 min-h-0">
               <Box className="h-full flex flex-col" title={`${DIFFICULTY_LABELS[gameState.selectedDifficulty]} - Level ${gameState.selectedLevel} (${questions.length} ${gameState.selectedDifficulty === 'Conversation' ? 'conversations' : 'words'})`}>
                   <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">{visibleQuestions.length === 0 ? (
                     <div className="flex h-full min-h-[240px] flex-col items-center justify-center rounded-xl border border-slate-700 bg-slate-900/40 px-6 text-center">
                       <AlertCircle size={28} className="mb-3 text-slate-500" />
                       <p className="text-lg font-bold text-slate-200">{emptyListTitle}</p>
                       <p className="mt-2 text-sm text-slate-400">{emptyListDescription}</p>
                       <GameButton onClick={() => setQuestionListFilter('all')} variant="outline" size="sm" className="mt-4">すべて表示に戻す</GameButton>
                     </div>
                   ) : <>
                     {shouldLimitQuestionList && (
                       <div className="mb-3 rounded-lg border border-cyan-500/30 bg-cyan-950/30 px-4 py-3 text-sm text-cyan-100">
                         {wordListToolsOpen || isAutoPlaying
                           ? '動作を軽くするため、選択・自動再生ツールの使用中と連続再生中は一覧を先頭160件だけ表示しています。全件を確認したい場合は、ツールを閉じてから「さらに表示」を押してください。'
                           : `表示負荷を抑えるため、まず先頭${renderedQuestions.length}件を表示しています。`}
                         {!wordListToolsOpen && !isAutoPlaying && (
                           <button
                             onClick={() => setQuestionListRenderLimit(prev => prev + 260)}
                             className="ml-3 rounded-md border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-100 hover:bg-cyan-500/20"
                           >
                             {'さらに表示'}
                           </button>
                         )}
                       </div>
                     )}
                     <div className="grid gap-2 pb-4">{questionRows /* visibleQuestions.map((q, idx) => {
                     const isWeakQuestion = weakQuestionTexts.has(q.text);
                     const stats = weakQuestionStats[q.text];
                     const manualStatus = getManualQuestionStatus(gameState.selectedDifficulty, gameState.selectedLevel, q);
                     const questionKey = getQuestionStatusKey(gameState.selectedDifficulty, gameState.selectedLevel, q);
                     const isSelectedForAutoPlay = selectedQuestionKeySet.has(questionKey);
                     const learningLabel = manualStatus.learningLevel === 1 ? '学習中' : manualStatus.learningLevel === 2 ? 'もう少し' : '覚えた';
                     const autoLabel = manualStatus.battleLevel === 1 ? '学習中' : manualStatus.battleLevel === 2 ? 'もう少し' : '覚えた';
                     const isManualOverrideActive = manualStatus.manualOverrideLevel !== null;
                     const example = currentQuestionExamples.get(questionKey);
                     return (
                       <div key={`${q.text}-${idx}`} className={`p-3 rounded-lg border transition-colors group ${manualStatus.excluded ? 'bg-slate-950/80 border-slate-600 opacity-85' : isWeakQuestion ? 'bg-orange-950/40 border-orange-500/40 hover:border-orange-400/70' : 'bg-slate-900/50 border-slate-700 hover:border-blue-500/50'}`}>
                         <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                           <div className="flex items-start gap-4 min-w-0">
                             <label className="mt-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-cyan-500/40 bg-cyan-950/40 text-cyan-100 transition-colors hover:bg-cyan-900/40">
                               <input
                                 type="checkbox"
                                 checked={isSelectedForAutoPlay}
                                 onChange={() => toggleSelectedQuestion(gameState.selectedDifficulty, gameState.selectedLevel, q)}
                                 className="h-4 w-4 rounded border-slate-500 bg-slate-900 text-cyan-400"
                               />
                             </label>
                             <button onClick={() => speakWithSettings(q.text)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-blue-600 hover:text-white transition-colors flex-shrink-0"><Volume2 size={16} /></button>
                             <div className="min-w-0">
                               <div className="flex flex-wrap items-center gap-3">
                               <span className="text-lg md:text-xl font-mono text-blue-100 font-bold break-all">{q.text}</span>
                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] ${manualStatus.learningLevel === 1 ? 'border border-sky-400/35 bg-sky-500/10 text-sky-100' : manualStatus.learningLevel === 2 ? 'border border-emerald-400/35 bg-emerald-500/10 text-emerald-100' : 'border border-violet-400/35 bg-violet-500/10 text-violet-100'}`}>
                                 {learningLabel}
                               </span>
                                {isSelectedForAutoPlay && <span className="rounded-full border border-cyan-300/40 bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-cyan-100">選択中</span>}
                                {manualStatus.manualOverrideLevel !== null && <span className="rounded-full border border-fuchsia-400/40 bg-fuchsia-500/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-fuchsia-200">{'\u624b\u52d5\u512a\u5148'}</span>}
                                {manualStatus.excluded && <span className="rounded-full border border-slate-400/40 bg-slate-700/70 px-2 py-0.5 text-[10px] font-bold tracking-wide text-slate-200">{'\u9664\u5916\u4e2d'}</span>}
                               {isWeakQuestion && <span className="rounded-full border border-orange-400/40 bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-300">Weak</span>}
                               {isWeakQuestion && stats && <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-200">Miss x{stats.missCount}</span>}
                               {!isWeakQuestion && stats && <span className="rounded-full border border-slate-500/30 bg-slate-700/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-300">Past Miss x{stats.missCount}</span>}
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-3">
                                 <span className={`rounded-2xl border px-4 py-2 text-xl font-black leading-none tracking-[0.08em] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] md:text-2xl ${isManualOverrideActive ? 'border-slate-700 bg-slate-900/60 text-slate-300' : manualStatus.learningLevel === 1 ? 'border-sky-400/30 bg-sky-500/10 text-sky-100' : manualStatus.learningLevel === 2 ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100' : 'border-violet-400/30 bg-violet-500/10 text-violet-100'}`}>
                                  {learningLabel}
                                </span>
                                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${isManualOverrideActive ? 'border-slate-700 bg-slate-900/70 text-slate-400' : 'border-cyan-400/30 bg-cyan-500/10 text-cyan-100'}`}>
                                  {'\u81ea\u52d5'}: {autoLabel}
                                </span>
                              </div>
                             </div>
                            </div>
                           <div className="text-right flex-shrink-0">
                             <div className="text-slate-300 font-bold text-sm md:text-base">{q.translation}</div>
                             {q.basicMeaning && (
                               <div className="mt-0.5 text-[10px] font-medium text-slate-500 md:text-[11px]">
                                 Basic: {q.basicMeaning}
                               </div>
                             )}
                           </div>
                         </div>
                          <div className="mt-3 ml-12 flex flex-wrap items-center gap-2 md:justify-end">
                            <span className="text-[11px] font-bold text-slate-400">{'\u624b\u52d5\u8a2d\u5b9a'}</span>
                           {LEARNING_LEVELS.map(level => (
                             <button
                               key={level}
                               onClick={() => updateManualQuestionStatus(gameState.selectedDifficulty, gameState.selectedLevel, q, current => ({ ...current, manualOverrideLevel: current.manualOverrideLevel === level ? null : level }))}
                               className={`rounded-full border px-3 py-1 text-[11px] font-bold transition-colors ${manualStatus.manualOverrideLevel === level ? level === 1 ? 'border-sky-300 bg-sky-500/20 text-sky-100 shadow-[0_0_18px_rgba(56,189,248,0.24)]' : level === 2 ? 'border-emerald-300 bg-emerald-500/20 text-emerald-100 shadow-[0_0_18px_rgba(52,211,153,0.22)]' : 'border-violet-300 bg-violet-500/20 text-violet-100 shadow-[0_0_18px_rgba(167,139,250,0.24)]' : 'border-slate-600 bg-slate-900/70 text-slate-300 hover:border-slate-500 hover:text-white'}`}
                             >
                                {level === 1 ? '\u5b66\u7fd2\u4e2d' : level === 2 ? '\u3082\u3046\u5c11\u3057' : '\u899a\u3048\u305f'}
                             </button>
                           ))}
                           <button
                             onClick={() => updateManualQuestionStatus(gameState.selectedDifficulty, gameState.selectedLevel, q, current => ({ ...current, excluded: !current.excluded }))}
                             className={`rounded-full border px-3 py-1 text-[11px] font-bold transition-colors ${manualStatus.excluded ? 'border-slate-300 bg-slate-200 text-slate-900' : 'border-slate-600 bg-slate-900/70 text-slate-300 hover:border-slate-500 hover:text-white'}`}
                           >
                              {manualStatus.excluded ? '\u9664\u5916\u3092\u89e3\u9664' : '\u9664\u5916\u3059\u308b'}
                           </button>
                         </div>
                         {example && (
                           <div className="mt-3 ml-12 rounded-lg border border-slate-700/80 bg-slate-950/70 px-3 py-2">
                             <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">Example</p>
                             <p className="mt-1 text-xs md:text-sm text-slate-200">{example}</p>
                           </div>
                         )}
                       </div>
                     );
                   }) */}</div>
                   </>}</div>
               </Box>
           </div>
        </div>
        <style>{`.custom-scrollbar::-webkit-scrollbar { width: 8px; } .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }`}</style>
      </ScreenContainer>
    );
  }

  if (gameState.screen === 'settings') {
    return (
      <ScreenContainer className="bg-slate-900">
        <div className="max-w-3xl w-full p-4">
          <div className="flex justify-between items-center mb-6">
            <GameButton size="sm" variant="outline" onClick={() => setGameState(prev => ({ ...prev, screen: 'title' }))}>&larr; タイトルへ</GameButton>
            <h2 className="text-2xl font-bold text-blue-300 flex items-center gap-2"><Volume2 /> ゲーム設定</h2>
          </div>
          <Box title="BGM Volume" className="w-full">
            <div className="space-y-6">
              <p className="text-slate-300 text-sm">バトル中のBGM音量を選べます。`Off` にするとBGMを再生しません。</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['Off', '1', '2', '3', '4', '5'].map((label, index) => (
                  <button
                    key={label}
                    onClick={() => handleBgmVolumeSelect(index)}
                    className={`rounded-xl border-2 px-4 py-4 font-bold transition-all ${bgmVolumeLevel === index ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-400 hover:bg-slate-700'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 text-sm text-slate-300">
                現在の設定: <span className="font-black text-white">{['Off', '1', '2', '3', '4', '5'][bgmVolumeLevel]}</span>
              </div>
            </div>
          </Box>
          <Box title="English Voice" className="w-full mt-6">
            <div className="space-y-6">
              <p className="text-slate-300 text-sm">アメリカ英語・イギリス英語の男女4種類と、ランダム切り替えから選べます。利用できる音声はブラウザやOSによって変わるため、近い候補を自動で選びます。</p>
              <p className="text-slate-400 text-xs">American Accent / British Accent を聞き比べながら選べます。</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SPEECH_VOICE_OPTIONS.map((option) => {
                  const exactSupported = option.id === 'random' || supportedSpeechModes.includes(option.id as Exclude<SpeechVoiceMode, 'random'>);
                  const isSupported = isSpeechModeSelectable(speechVoices, option.id);
                  const isSelected = speechVoiceMode === option.id;

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleSpeechVoiceSelect(option.id)}
                      disabled={!isSupported}
                      className={`rounded-xl border-2 px-4 py-4 text-left transition-all ${!isSupported ? 'cursor-not-allowed border-slate-800 bg-slate-900/60 text-slate-500 opacity-70' : isSelected ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-400 hover:bg-slate-700'}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-bold">{SPEECH_VOICE_COPY[option.id].label}</div>
                        {!isSupported && <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300">未対応</span>}
                        {isSupported && !exactSupported && <span className="rounded-full border border-cyan-500/40 bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cyan-200">代替</span>}
                      </div>
                      <div className={`text-xs mt-1 ${isSupported && isSelected ? 'text-blue-100' : 'text-slate-400'}`}>{SPEECH_VOICE_COPY[option.id].description}</div>
                    </button>
                  );
                })}
              </div>
              <div className="rounded-xl border border-cyan-500/30 bg-slate-950/70 p-4 text-xs text-slate-300">
                <div className="font-bold text-cyan-300">Voice Debug</div>
                <div className="mt-2">Selected Mode: <span className="font-mono text-white">{selectedSpeechConfig.mode}</span></div>
                <div>Requested Lang: <span className="font-mono text-white">{selectedSpeechConfig.lang}</span></div>
                <div>Resolution: <span className="font-mono text-white">{selectedSpeechConfig.resolution}</span></div>
                <div>
                  Active Voice:
                  <span className="ml-2 font-mono text-white">
                    {selectedSpeechConfig.voice ? `${selectedSpeechConfig.voice.name} (${selectedSpeechConfig.voice.lang})` : 'none'}
                  </span>
                </div>
                <div className="mt-3 text-cyan-200">Top locale candidates</div>
                <div className="mt-2 space-y-1">
                  {speechDebugCandidates.length > 0 ? speechDebugCandidates.map(({ voice, score }) => (
                    <div key={voice.voiceURI} className="rounded border border-slate-700 bg-slate-900/70 px-3 py-2">
                      <span className="font-mono text-white">{voice.name}</span>
                      <span className="ml-2 text-slate-400">({voice.lang})</span>
                      <span className="ml-2 text-cyan-300">score: {score}</span>
                    </div>
                  )) : (
                    <div className="rounded border border-slate-700 bg-slate-900/70 px-3 py-2 text-slate-400">
                      No locale-matching voices found.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Box>
          <Box title="Speech Speed" className="w-full mt-6">
            <div className="space-y-6">
              <p className="text-slate-300 text-sm">英語読み上げのスピードを 50%〜200% の範囲で調整できます。</p>
              <input
                type="range"
                min="50"
                max="250"
                step="5"
                value={speechRatePercent}
                onChange={(e) => handleSpeechRateChange(parseInt(e.target.value, 10))}
                className="w-full accent-blue-500"
              />
              <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 text-sm text-slate-300">
                現在の設定: <span className="font-black text-white">{speechRatePercent}%</span>
              </div>
            </div>
          </Box>
          <Box title="Translation Battle" className="w-full mt-6">
            <div className="space-y-4">
              <label className="flex items-center justify-between gap-4 rounded-lg border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-200">
                <span>
                  <span className="block font-bold text-cyan-100">和訳バトル正解後に英語音声を再生</span>
                  <span className="mt-1 block text-xs text-slate-400">日本語訳だけを見て入力するバトルで、正解直後に用語の発音を確認します。</span>
                </span>
                <input
                  type="checkbox"
                  checked={translationBattleCorrectSpeechEnabled}
                  onChange={(e) => setTranslationBattleCorrectSpeechEnabled(e.target.checked)}
                  className="h-4 w-4 flex-shrink-0 rounded border-slate-500 bg-slate-900 text-cyan-400"
                />
              </label>
            </div>
          </Box>
          <div ref={playerProfilesSectionRef}>
          <Box title="Player Profiles" className="w-full mt-6">
            <div className="space-y-5">
              <div className="rounded-xl border border-violet-500/20 bg-violet-950/10 p-4 text-sm text-slate-300">
                <p className="font-bold text-violet-200">現在のプレイヤー</p>
                <p className="mt-2 text-lg font-black text-white">{getCurrentActivePlayer()?.name ?? 'Player'}</p>
                <p className="mt-1 text-xs text-slate-400">端末内でプレイヤーを切り替えて、それぞれ別の学習状態を持てます。</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  ref={newPlayerNameInputRef}
                  type="text"
                  value={newPlayerName}
                  maxLength={PLAYER_NAME_MAX_LENGTH}
                  onChange={(e) => handleNewPlayerNameChange(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      createPlayerProfile();
                    }
                  }}
                  placeholder="新しいプレイヤー名"
                  className="flex-1 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                />
                <GameButton
                  onClick={createPlayerProfile}
                  size="sm"
                  className="bg-violet-600 border-violet-400 text-white hover:bg-violet-500"
                  disabled={newPlayerName.trim().length === 0}
                >
                  新規作成
                </GameButton>
              </div>
              <div className="space-y-2">
                {playerProfiles.map((profile) => {
                  const isActive = profile.id === activePlayerId;
                  const draftName = playerNameDrafts[profile.id] ?? profile.name;
                  const canSaveName = draftName.trim().length > 0 && draftName.trim() !== profile.name;
                  return (
                    <div key={profile.id} className={`flex flex-col gap-3 rounded-xl border px-3 py-3 md:flex-row md:items-center md:justify-between ${isActive ? 'border-violet-400/40 bg-violet-500/10' : 'border-slate-700 bg-slate-950/70'}`}>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={draftName}
                            maxLength={PLAYER_NAME_MAX_LENGTH}
                            onChange={(e) => handlePlayerNameDraftChange(profile.id, e.target.value)}
                            onKeyDown={(e) => {
                              e.stopPropagation();
                              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                                e.preventDefault();
                                renamePlayerProfile(profile.id);
                              }
                            }}
                            aria-label="プレイヤー名"
                            className="w-full max-w-xs rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm font-bold text-white placeholder:text-slate-500 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-400/30"
                          />
                          {isActive && <span className="rounded-full border border-violet-300/40 bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-100">Active</span>}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">更新: {profile.updatedAt ? new Date(profile.updatedAt).toLocaleString('ja-JP') : '未使用'}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <GameButton onClick={() => renamePlayerProfile(profile.id)} size="sm" variant="outline" className="border-violet-500/40 text-violet-100 hover:bg-violet-900/20" disabled={!canSaveName}>
                          名前を保存
                        </GameButton>
                        <GameButton onClick={() => activatePlayerProfile(profile.id)} size="sm" variant="outline" className="border-cyan-500/40 text-cyan-200 hover:bg-cyan-900/20" disabled={isActive}>
                          切り替える
                        </GameButton>
                        <GameButton onClick={() => deletePlayerProfile(profile.id)} size="sm" variant="outline" className="border-red-500/40 text-red-200 hover:bg-red-900/20" disabled={playerProfiles.length <= 1}>
                          削除
                        </GameButton>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Box>
          </div>
          <div ref={progressTransferSectionRef}>
          <Box title="Progress Transfer" className="w-full mt-6">
            <div className="space-y-5">
              <p className="text-sm text-slate-300">
                学習データを JSON ファイルとして保存し、別端末で読み込めます。分かる項目だけ復元するので、将来データ項目が増減しても壊れにくい方式です。
              </p>
              <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-300">
                <p>現在のプレイヤーのみを書き出します。</p>
                <p className="mt-2">読み込むと、そのプレイヤーデータを追加または更新します。</p>
              </div>
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/10 p-4 text-sm text-slate-300">
                <p className="font-bold text-cyan-200">引き継げる主な内容</p>
                <p className="mt-2">苦手語、ミス統計、手動設定、除外設定、復習キュー、日次進捗、保存済み選択リスト、自動再生設定</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <GameButton onClick={downloadProgressSnapshot} className="sm:flex-1 bg-cyan-600 border-cyan-400 text-white hover:bg-cyan-500">
                  <ClipboardList size={18} /> 学習データを書き出す
                </GameButton>
                <GameButton onClick={openProgressImportPicker} variant="outline" className="sm:flex-1 border-emerald-500/40 text-emerald-200 hover:bg-emerald-900/20">
                  <BookOpen size={18} /> 学習データを読み込む
                </GameButton>
              </div>
              <div className="rounded-xl border border-red-500/30 bg-red-950/15 p-4">
                <p className="text-sm font-bold text-red-200">現在のプレイヤーの学習データをリセット</p>
                <p className="mt-1 text-xs text-slate-400">撃破数、スコア、苦手語、日次進捗などを消去します。必要なら先に書き出してください。</p>
                <GameButton onClick={handleResetHistory} variant="outline" size="sm" className="mt-3 border-red-600/60 text-red-200 hover:border-red-400 hover:bg-red-950/40">
                  <RotateCcw size={16} /> 履歴をリセット
                </GameButton>
              </div>
              <input
                ref={progressImportInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={handleImportProgressFile}
              />
              <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-xs text-slate-400">
                <p>保存形式: `english-typing-rpg-progress-*.json`</p>
                <p className="mt-1">読み込み時は未知の項目を無視し、足りない項目は既定値で補います。</p>
                {progressTransferStatus && (
                  <p className="mt-3 font-bold text-cyan-200">{progressTransferStatus}</p>
                )}
              </div>
            </div>
          </Box>
          </div>
          {showResetConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60" onClick={() => setShowResetConfirm(false)}></div>
              <div className="relative w-full max-w-xl rounded-xl border-2 border-red-700/60 bg-slate-900 p-6 shadow-2xl">
                <h3 className="mb-4 text-2xl font-black text-red-300">履歴をリセット</h3>
                <div className="space-y-2 text-slate-200">
                  <p>本当に現在のプレイヤーの学習データを消去して良いですか？</p>
                  <p>Are you sure you want to delete this player's learning data?</p>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <GameButton onClick={() => setShowResetConfirm(false)} variant="outline" size="sm" autoFocus>No</GameButton>
                  <GameButton onClick={confirmResetHistory} size="sm" className="bg-red-600 border-red-400 text-white hover:bg-red-500">Yes</GameButton>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScreenContainer>
    );
  }

  if (gameState.screen === 'help') {
    return (
      <HelpScreen onBack={() => setGameState(prev => ({ ...prev, screen: 'title' }))} />
    );
  }

  if (gameState.screen === 'versus-setup') {
    const isSoloSetup = versusNameDrafts.length === 1;
    const setupTitle = isSoloSetup ? 'ひとりで20問バトル！' : 'みんなで20問バトル！';
    const currentVersusRanking = versusRankings[getVersusRankingKey()] ?? [];
    const activeVersusCourses = getActiveVersusCourseSelections();
    const courseSummary = [...new Set(activeVersusCourses.map(course => `${DIFFICULTY_LABELS[course.difficulty]} Level ${course.level}`))].join(' ・ ');
    const promptSelectionLabel = ({ spelling: 'スペル表示', listening: 'リスニング', translation: '和訳', 'listening-translation': 'リスニング＋和訳', mixed: 'おまかせ' } as const)[versusPromptSelection];
    return (
      <ScreenContainer className="items-center justify-center p-4">
        <Box title={setupTitle} className="w-full max-w-5xl">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="text-center md:col-span-2">
              <Trophy size={40} className="mx-auto text-yellow-300" />
              <h1 className="mt-1 text-2xl font-black text-white md:text-3xl">{setupTitle}</h1>
              <p className="mt-2 text-sm font-bold text-slate-300">{isSoloSetup ? '20問を連続で解いて、自分の最高記録に挑戦します。' : '同じ20問で、正確さと速さを競います。普段の学習記録には残りません。'}</p>
            </div>

            <div className="rounded-xl border border-fuchsia-300/55 bg-fuchsia-950/25 p-3 text-center shadow-[0_0_22px_rgba(217,70,239,0.16)] md:col-span-2">
              <p className="mb-2 text-xs font-black text-fuchsia-100">設定ができたら、ここからすぐ開始</p>
              <GameButton onClick={startVersusMatch} size="lg" className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 border-violet-300 hover:from-violet-500 hover:to-fuchsia-500 sm:w-auto sm:min-w-80">バトルをはじめる <ArrowRight size={22} /></GameButton>
            </div>
            {versusSetupError && <p className="text-center font-bold text-red-300 md:col-span-2">{versusSetupError}</p>}

            <div className="rounded-xl border border-cyan-400/25 bg-slate-900/55 p-3">
              <p className="text-sm font-black text-cyan-200">1. 参加者ごとの教材</p>
              <p className="mt-2 text-sm font-bold text-slate-200">名前の下で、それぞれ教材とLevelを選びます。</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {versusNameDrafts.map((name, index) => {
                  const course = versusCourseSelections[index] ?? DEFAULT_VERSUS_COURSE_SELECTION;
                  return <span key={`${name}-${index}`} className="rounded-lg border border-cyan-400/30 bg-cyan-950/35 px-3 py-2 text-xs font-bold text-cyan-100">{name.trim() || `参加者${index + 1}`}：{DIFFICULTY_LABELS[course.difficulty]} Level {course.level}</span>;
                })}
              </div>
            </div>

            <div className="rounded-xl border border-sky-400/25 bg-slate-900/55 p-3">
              <p className="text-sm font-black text-sky-200">2. 出題方法を選ぶ</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {([
                  ['spelling', 'スペル表示', '英単語を見て入力'],
                  ['listening-translation', 'リスニング＋和訳', '音を聞き、日本語の意味を見て入力'],
                  ['translation', '和訳', '日本語の意味だけを見て入力'],
                  ['listening', 'リスニング', '音声だけを聞いて入力'],
                  ['mixed', 'おまかせ', '4種類を問題ごとにランダム出題'],
                ] as const).map(([mode, label, description]) => (
                  <button key={mode} onClick={() => setVersusPromptSelection(mode)} className={`rounded-lg border p-3 text-left ${mode === 'mixed' ? 'sm:col-span-2' : ''} ${versusPromptSelection === mode ? 'border-sky-300 bg-sky-600/35 text-white' : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-400'}`}>
                    <p className="font-black">{label}</p>
                    <p className="mt-1 text-xs font-bold opacity-80">{description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-violet-400/25 bg-slate-900/55 p-3 md:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-violet-200">3. 名前・教材・得点倍率を入力（1〜5人）</p>
                {versusNameDrafts.length < 5 && <GameButton size="sm" variant="outline" onClick={() => { setVersusNameDrafts(names => [...names, `プレイヤー${names.length + 1}`]); setVersusScoreMultipliers(multipliers => [...multipliers, 1]); setVersusCourseSelections(courses => [...courses, courses[0] ?? DEFAULT_VERSUS_COURSE_SELECTION]); }}>＋ 参加者を追加</GameButton>}
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {versusNameDrafts.map((name, index) => (
                  <div key={index} className="flex flex-col gap-2 rounded-lg border border-slate-700 bg-slate-950/40 p-2">
                    <div className="flex items-center gap-2">
                      <input value={name} maxLength={20} onChange={event => setVersusNameDrafts(names => names.map((currentName, currentIndex) => currentIndex === index ? event.target.value : currentName))} className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 font-bold text-white outline-none focus:border-violet-300" aria-label={`参加者${index + 1}の名前`} />
                      {versusNameDrafts.length > 1 && <button onClick={() => { setVersusNameDrafts(names => names.filter((_, currentIndex) => currentIndex !== index)); setVersusScoreMultipliers(multipliers => multipliers.filter((_, currentIndex) => currentIndex !== index)); setVersusCourseSelections(courses => courses.filter((_, currentIndex) => currentIndex !== index)); }} className="rounded-lg border border-red-500/50 px-3 py-2 font-bold text-red-200 hover:bg-red-950/40" aria-label={`${name}を外す`}>×</button>}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="min-w-0 text-xs font-bold text-violet-100">教材
                        <select value={(versusCourseSelections[index] ?? DEFAULT_VERSUS_COURSE_SELECTION).difficulty} onChange={event => setVersusCourseSelections(courses => courses.map((course, currentIndex) => currentIndex === index ? { difficulty: event.target.value as Difficulty, level: getSafeLevelForDifficulty(event.target.value as Difficulty, course.level) } : course))} className="mt-1 w-full rounded-lg border border-violet-400/45 bg-slate-900 px-2 py-1.5 text-sm font-black text-white" aria-label={`${name || `参加者${index + 1}`}の教材`}>
                          {DIFFICULTIES.map(difficulty => <option key={difficulty} value={difficulty}>{DIFFICULTY_LABELS[difficulty]}</option>)}
                        </select>
                      </label>
                      <label className="min-w-0 text-xs font-bold text-violet-100">Level
                        <select value={(versusCourseSelections[index] ?? DEFAULT_VERSUS_COURSE_SELECTION).level} onChange={event => setVersusCourseSelections(courses => courses.map((course, currentIndex) => currentIndex === index ? { ...course, level: Number(event.target.value) as Level } : course))} className="mt-1 w-full rounded-lg border border-violet-400/45 bg-slate-900 px-2 py-1.5 text-sm font-black text-white" aria-label={`${name || `参加者${index + 1}`}のLevel`}>
                          {getAvailableLevels((versusCourseSelections[index] ?? DEFAULT_VERSUS_COURSE_SELECTION).difficulty).map(level => <option key={level} value={level}>Level {level}</option>)}
                        </select>
                      </label>
                    </div>
                    <label className="flex items-center justify-between gap-2 text-xs font-bold text-violet-100">
                      得点倍率
                      <select value={versusNameDrafts.length === 1 ? 1 : versusScoreMultipliers[index] ?? 1} disabled={versusNameDrafts.length === 1} onChange={event => setVersusScoreMultipliers(multipliers => multipliers.map((multiplier, currentIndex) => currentIndex === index ? Number(event.target.value) : multiplier))} className="rounded-lg border border-violet-400/45 bg-slate-900 px-2 py-1.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60" aria-label={`${name || `参加者${index + 1}`}の得点倍率`}>
                        {VERSUS_SCORE_MULTIPLIER_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-amber-400/25 bg-amber-950/20 p-3 text-sm text-amber-100">
              <p className="font-black">採点ルール</p>
              <p className="mt-1">正解50点、ミスなしなら50点追加、速さに応じて最大50点追加です。ミスは1回につき15点減点（その問題の最低点は0点）。対戦ではプレイヤーごとの得点倍率をかけた点で順位を決めます。</p>
            </div>
            <div className="rounded-xl border border-yellow-400/30 bg-slate-900/70 p-4 md:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-base font-black text-yellow-200"><Trophy size={18} /> この設定のランキング</p>
                <p className="text-xs font-bold text-slate-300">{courseSummary || '教材未選択'} ・ {promptSelectionLabel}</p>
              </div>
              {currentVersusRanking.length > 0 ? (
                <ol className="mt-3 grid gap-2 sm:grid-cols-2">
                  {currentVersusRanking.map((entry, index) => (
                    <li key={`${entry.name}-${entry.recordedAt}`} className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-950/55 px-3 py-2">
                      <span className={`w-6 text-center text-lg font-black ${index < 3 ? 'text-yellow-300' : 'text-slate-400'}`}>{index + 1}</span>
                      <div className="min-w-0 flex-1"><p className="truncate font-black text-white">{entry.name}</p><p className="text-[11px] font-bold text-slate-400">ミスなし {entry.perfectCount}問 ・ ミス {entry.missCount}回</p></div>
                      <p className="text-right text-xl font-black text-cyan-200">{entry.score}<span className="ml-1 text-[10px] text-cyan-100">点</span></p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-3 rounded-lg border border-dashed border-slate-600 px-4 py-5 text-center text-sm font-bold text-slate-400">まだ記録がありません。最初の1戦でランキング入り！</p>
              )}
              <p className="mt-3 text-xs text-slate-400">同じ名前は最高記録だけを残します。ハンデは対戦中のみで、ランキングは基本点で公平に記録します。</p>
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between md:col-span-2">
              <GameButton variant="outline" onClick={() => setGameState(prev => ({ ...prev, screen: 'title' }))}>タイトルへ戻る</GameButton>
            </div>
          </div>
        </Box>
      </ScreenContainer>
    );
  }

  if (gameState.screen === 'versus-play') {
    const currentPlayer = versusPlayers[versusPlayerIndex];
    const currentVersusQuestion = versusQuestionOrders[versusPlayerIndex]?.[versusQuestionIndex];
    const currentQuestion = currentVersusQuestion?.question;
    const currentAdjustedScore = currentPlayer ? getAdjustedVersusScore(currentPlayer) : 0;
    const versusHint = currentQuestion?.text.slice(0, versusHintLength) ?? '';
    if (!currentPlayer || !currentQuestion || !currentVersusQuestion) {
      return <ScreenContainer className="items-center justify-center"><GameButton onClick={() => setGameState(prev => ({ ...prev, screen: 'versus-setup' }))}>対戦の準備へ戻る</GameButton></ScreenContainer>;
    }
    if (versusShowHandoff) {
      return (
        <ScreenContainer className="items-center justify-center p-4">
          <Box className="w-full max-w-xl text-center">
            <Trophy size={58} className="mx-auto text-yellow-300" />
            <p className="mt-5 text-sm font-black uppercase tracking-[0.25em] text-violet-300">Next Player</p>
            <h1 className="mt-2 text-4xl font-black text-white">{currentPlayer.name} の番！</h1>
            <p className="mt-3 text-lg font-black text-cyan-200">{DIFFICULTY_LABELS[currentPlayer.difficulty]} Level {currentPlayer.level}</p>
            <p className="mt-4 text-slate-300">20問を続けて入力します。ほかの人は答えを見ないでね。</p>
            <GameButton onClick={beginVersusTurn} size="lg" className="mt-7 w-full bg-violet-600 border-violet-300 hover:bg-violet-500" autoFocus>スタート</GameButton>
            <p className="mt-2 text-xs font-bold text-slate-400"><kbd className="rounded border border-slate-500 bg-slate-900 px-1.5 py-0.5">Enter</kbd> でも始められます</p>
            <button onClick={quitVersusMatch} className="mt-4 text-sm font-bold text-slate-400 underline underline-offset-4 hover:text-white">タイトルへ戻る</button>
          </Box>
        </ScreenContainer>
      );
    }
    return (
      <ScreenContainer className="items-center justify-center p-4">
        <Box className="w-full max-w-3xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-600 pb-4">
            <div><p className="text-sm font-black text-violet-300">{currentPlayer.name} のターン</p><p className="mt-1 text-xs font-bold text-cyan-200">{DIFFICULTY_LABELS[currentPlayer.difficulty]} Level {currentPlayer.level}</p><p className="mt-1 text-2xl font-black text-white">{versusQuestionIndex + 1} / {VERSUS_QUESTION_COUNT} 問</p></div>
            <div className="flex items-center gap-2"><div className="rounded-lg border border-yellow-400/35 bg-yellow-950/25 px-4 py-2 text-right"><p className="text-xs font-bold text-yellow-200">現在の得点</p><p className="text-2xl font-black text-white">{currentAdjustedScore}</p><p className="text-[10px] font-bold text-yellow-100/75">基本 {currentPlayer.score} × {currentPlayer.scoreMultiplier}倍</p></div><GameButton size="sm" variant="outline" onClick={quitVersusMatch}>やめる</GameButton></div>
          </div>
          <div className="py-10 text-center">
            {currentVersusQuestion.promptMode === 'spelling' && <><p className="text-sm font-bold text-cyan-200">日本語の意味</p><p className="mt-2 text-2xl font-black text-white">{currentQuestion.translation}</p><p className="mt-8 text-sm font-bold text-slate-400">この英単語を入力しよう</p><p className="mt-2 break-words text-4xl font-black tracking-wide text-cyan-200 md:text-6xl">{currentQuestion.text}</p></>}
            {currentVersusQuestion.promptMode === 'listening' && <><p className="text-sm font-bold text-cyan-200">音声を聞いて英単語を入力しよう</p><p className="mt-5 text-5xl">🔊</p><GameButton onClick={() => { speakWithSettings(currentQuestion.text); versusInputRef.current?.focus(); }} variant="outline" className="mt-5">もう一度聞く <Volume2 size={18} /></GameButton><p className="mt-2 text-xs font-bold text-slate-400">ショートカット: Right Ctrl でもう一度聞く</p></>}
            {currentVersusQuestion.promptMode === 'translation' && <><p className="text-sm font-bold text-cyan-200">日本語の意味</p><p className="mt-3 text-4xl font-black text-white md:text-5xl">{currentQuestion.translation}</p><p className="mt-8 text-sm font-bold text-slate-400">英単語を思い出して入力しよう</p></>}
            {currentVersusQuestion.promptMode === 'listening-translation' && <><p className="text-sm font-bold text-cyan-200">音を聞き、日本語の意味を見て英単語を入力しよう</p><p className="mt-3 text-4xl font-black text-white md:text-5xl">{currentQuestion.translation}</p><p className="mt-5 text-5xl">🔊</p><GameButton onClick={() => { speakWithSettings(currentQuestion.text); versusInputRef.current?.focus(); }} variant="outline" className="mt-5">もう一度聞く <Volume2 size={18} /></GameButton><p className="mt-2 text-xs font-bold text-slate-400">ショートカット: Right Ctrl でもう一度聞く</p></>}
            {versusHint && <p className="mt-5 text-sm font-bold text-amber-200">ヒント: <span className="font-mono text-xl tracking-[0.14em] text-white">{versusHint}</span><span className="ml-2 text-xs text-slate-400">ミスごとに1文字ずつ表示</span></p>}
            <input ref={versusInputRef} value={versusInput} onChange={event => handleVersusInput(event.target.value)} className="mt-8 w-full rounded-xl border-2 border-cyan-400/55 bg-slate-950 px-5 py-4 text-center text-2xl font-black text-white outline-none focus:border-cyan-200" autoCapitalize="none" autoCorrect="off" spellCheck={false} aria-label="英単語を入力" />
            <p className="mt-4 min-h-6 text-sm font-bold text-orange-200">{versusQuestionMisses > 0 ? `この問題のミス: ${versusQuestionMisses}` : 'ミスなしで50点ボーナス！'}</p>
          </div>
        </Box>
      </ScreenContainer>
    );
  }

  if (gameState.screen === 'versus-results') {
    const ranking = [...versusPlayers].sort((a, b) => getAdjustedVersusScore(b) - getAdjustedVersusScore(a) || b.perfectCount - a.perfectCount || a.missCount - b.missCount || a.totalTimeMs - b.totalTimeMs);
    const isSoloChallenge = versusPlayers.length === 1;
    const soloScore = versusPlayers[0]?.score ?? 0;
    const winner = ranking[0];
    const confettiColors = ['bg-yellow-300', 'bg-fuchsia-400', 'bg-cyan-300', 'bg-emerald-300', 'bg-orange-300'];
    return (
      <ScreenContainer className="items-center justify-center p-4">
        <Box title={isSoloChallenge ? 'ひとりで20問バトル！・結果' : 'みんなで20問バトル！・結果'} className="w-full max-w-3xl">
          {!isSoloChallenge && winner && <div className="relative isolate overflow-hidden rounded-2xl border-2 border-yellow-300/75 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.32),rgba(76,29,149,0.52)_48%,rgba(15,23,42,0.92)_100%)] px-5 py-7 text-center shadow-[0_0_38px_rgba(250,204,21,0.28)]">
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">{Array.from({ length: 20 }, (_, index) => <span key={index} className={`absolute h-2 w-2 rotate-45 ${confettiColors[index % confettiColors.length]} animate-bounce`} style={{ left: `${5 + (index * 37) % 90}%`, top: `${8 + (index * 23) % 72}%`, animationDelay: `${(index % 6) * 110}ms`, animationDuration: `${700 + (index % 4) * 120}ms` }} />)}</div>
            <p className="relative text-xs font-black tracking-[0.38em] text-yellow-100">WINNER!</p>
            <Crown size={54} className="relative mx-auto mt-2 animate-bounce text-yellow-300 drop-shadow-[0_0_14px_rgba(253,224,71,0.9)]" />
            <h1 className="relative mt-2 break-words text-4xl font-black text-white drop-shadow md:text-5xl">{winner.name}</h1>
            <p className="relative mt-2 text-sm font-black text-yellow-100">優勝おめでとう！</p>
            <p className="relative mt-3 text-2xl font-black text-cyan-100">{getAdjustedVersusScore(winner)}<span className="ml-1 text-xs tracking-wide">点（ハンデ込み）</span></p>
          </div>}
          <div className={`text-center ${isSoloChallenge ? '' : 'mt-6'}`}><Trophy size={isSoloChallenge ? 58 : 38} className="mx-auto text-yellow-300" /><h1 className={`${isSoloChallenge ? 'mt-2 text-3xl' : 'mt-1 text-xl'} font-black text-white`}>{isSoloChallenge ? 'バトル結果！' : '結果発表！'}</h1>{isSoloChallenge && <p className={`mt-3 text-lg font-black ${versusIsNewBest ? 'text-yellow-300' : 'text-cyan-200'}`}>{versusIsNewBest ? '自己ベスト更新！' : `自己ベスト: ${Math.max(soloScore, versusPreviousBestScore)} 点`}</p>}</div>
          <div className="mt-6 space-y-3">
            {ranking.map((player, index) => (
              <div key={player.id} className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border p-4 ${index === 0 ? 'border-yellow-300 bg-yellow-950/30' : 'border-slate-600 bg-slate-900/65'}`}>
                <span className={`text-3xl font-black ${index === 0 ? 'text-yellow-300' : 'text-slate-400'}`}>{index + 1}</span>
                <div><p className="text-xl font-black text-white">{player.name}</p><p className="mt-1 text-xs font-bold text-slate-300">基本 {player.score}点 × {player.scoreMultiplier}倍 = {getAdjustedVersusScore(player)}点</p><p className="mt-1 text-xs font-bold text-slate-300">ミスなし {player.perfectCount}問 ・ ミス {player.missCount}回 ・ 時間 {(player.totalTimeMs / 1000).toFixed(1)}秒</p></div>
                <p className="text-right text-3xl font-black text-cyan-200">{getAdjustedVersusScore(player)}<span className="block text-[10px] tracking-wide text-cyan-100">ハンデ込み</span></p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><GameButton variant="outline" onClick={() => setGameState(prev => ({ ...prev, screen: 'title' }))}>タイトルへ戻る</GameButton><GameButton onClick={() => setGameState(prev => ({ ...prev, screen: 'versus-setup' }))} autoFocus>もう一度バトルする</GameButton></div>
          <p className="mt-3 text-center text-xs font-bold text-slate-400"><kbd className="rounded border border-slate-500 bg-slate-900 px-1.5 py-0.5">Enter</kbd> でも次のバトル設定へ進めます</p>
        </Box>
      </ScreenContainer>
    );
  }

  if (gameState.screen === 'typing-practice') {
    const target = TYPING_PRACTICE_STEPS[typingPracticeIndex];
    const nextLetter = target?.[typingPracticeInput.length] ?? '';
    const fingerGuide = TYPING_FINGER_GUIDES[nextLetter];
    const isComplete = typingPracticeIndex >= TYPING_PRACTICE_STEPS.length;
    const practicePhase = typingPracticeIndex < 2 ? 'まんなかを見つけよう' : typingPracticeIndex < 13 ? '文字の場所を覚えよう' : '短い単語を打とう';
    return (
      <ScreenContainer className="items-center justify-center px-3 py-6">
        <Box title="はじめてのタイピング練習" className="w-full max-w-2xl">
          <p className="text-sm text-slate-200">パソコンではキーボードで、スマホでは横向きにして画面の文字を押そう。急がなくて大丈夫です。</p>
          {isComplete ? <div className="mt-6 text-center"><p className="text-3xl font-black text-emerald-300">練習クリア！</p><p className="mt-2 text-slate-200">まちがい {typingPracticeMisses} 回。ゆっくり正しく打てたね。</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><GameButton variant="outline" onClick={() => setGameState(prev => ({ ...prev, screen: 'title' }))}>タイトルへ戻る</GameButton><GameButton variant="success" onClick={startBeginnerBattle}><Sword size={19} /> つぎは はじめてバトルへ</GameButton></div></div> : <>
            <div className="mt-6 rounded-xl border border-cyan-300/35 bg-slate-950/70 p-5 text-center"><p className="text-xs font-black tracking-widest text-cyan-200">{practicePhase} ・ STEP {typingPracticeIndex + 1} / {TYPING_PRACTICE_STEPS.length}</p>{typingPracticeIndex < 2 && <p className="mt-3 rounded-lg bg-amber-400/10 px-3 py-2 text-sm font-bold text-amber-100">F と J はキーボードのまんなかの目印です。パソコンでは、この2つに小さな出っ張りがあります。</p>}<div className="mt-3 rounded-lg border border-sky-300/30 bg-sky-400/10 px-3 py-2 text-sm font-bold text-sky-100"><p>{fingerGuide ? <>{fingerGuide.finger}で <span className="text-lg text-white">{nextLetter.toUpperCase()}</span> を押そう</> : '光っている文字を押そう'}</p>{fingerGuide && <p className="mt-1 text-xs font-medium text-sky-200">打ったら指を {fingerGuide.homeKey} の位置に戻そう</p>}</div><p className="mt-3 text-sm text-slate-300">キーの色は、使う指のグループです。まずは正しい指をゆっくり覚えよう。</p><p className="mt-2 text-5xl font-black tracking-[0.22em] text-white">{target}</p><input ref={typingPracticeInputRef} autoFocus value={typingPracticeInput} onChange={event => handleTypingPracticeInput(event.target.value.toLowerCase())} className="sr-only" aria-label="typing practice input" /></div>
            <div className="mt-5"><GuidedKeyboard nextLetter={nextLetter} onPress={letter => handleTypingPracticeInput(typingPracticeInput + letter)} /></div>
            <div className="mt-4 flex justify-between text-sm font-bold text-slate-300"><span>まちがい {typingPracticeMisses} 回</span><GameButton size="sm" variant="outline" onClick={() => setGameState(prev => ({ ...prev, screen: 'title' }))}>やめる</GameButton></div>
          </>}
        </Box>
      </ScreenContainer>
    );
  }

  if (gameState.screen === 'beginner-battle') {
    const isComplete = beginnerBattleIndex >= BEGINNER_BATTLE_QUESTIONS.length;
    const safeQuestionIndex = Math.min(beginnerBattleIndex, BEGINNER_BATTLE_QUESTIONS.length - 1);
    const phaseIndex = Math.floor(safeQuestionIndex / BEGINNER_BATTLE_PHASE_SIZE);
    const phase = BEGINNER_BATTLE_PHASES[phaseIndex];
    const question = BEGINNER_BATTLE_QUESTIONS[safeQuestionIndex];
    const questionIndexInPhase = safeQuestionIndex % BEGINNER_BATTLE_PHASE_SIZE;
    const nextLetter = isComplete ? '' : question.text[beginnerBattleInput.length] ?? '';
    const currentMonster = MONSTERS[1].guide[phaseIndex] ?? MONSTERS[1].guide[0];
    const remainingQuestions = beginnerBattleClearedPhase !== null
      ? 0
      : BEGINNER_BATTLE_PHASE_SIZE - questionIndexInPhase;
    const hpPercent = beginnerBattleClearedPhase !== null
      ? 0
      : Math.max(10, (remainingQuestions / BEGINNER_BATTLE_PHASE_SIZE) * 100);

    if (isComplete) {
      return (
        <ScreenContainer className="items-center justify-center overflow-hidden bg-slate-950 px-3 py-5">
          <img src={COURSE_SELECT_ILLUSTRATION_IMAGE} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-35" />
          <div className="absolute inset-0 bg-slate-950/72" />
          <div className="relative z-10 w-full max-w-2xl rounded-2xl border-2 border-amber-300/60 bg-slate-900/94 p-6 text-center shadow-[0_28px_90px_rgba(0,0,0,0.72)] sm:p-8">
            <div className="text-6xl">🏆</div>
            <p className="mt-3 text-sm font-black tracking-[0.18em] text-amber-200">{BEGINNER_BATTLE_QUESTIONS.length}もん クリア！</p>
            <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">はじめてバトル せいこう！</h1>
            <p className="mt-3 text-base font-bold leading-7 text-slate-200">文字を見つけて、英検5級の単語まで打てました。何回でも遊んで大丈夫です。</p>
            <div className="mt-6 rounded-xl border border-cyan-300/35 bg-cyan-950/35 p-4 text-left">
              <p className="font-black text-cyan-100">つぎのおすすめ</p>
              <p className="mt-1 text-sm font-bold leading-6 text-slate-300">英検5級 Level 1の基礎練習へ進むと、もっとたくさんの英単語とモンスターに出会えます。</p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <GameButton variant="outline" onClick={restartBeginnerBattle}><RotateCcw size={18} /> もう一度あそぶ</GameButton>
              <GameButton onClick={() => startGame('Eiken5', 1, 'guide', 'voice-text')}><ArrowRight size={19} /> 英検5級へすすむ</GameButton>
              <GameButton variant="ghost" className="text-slate-300 hover:bg-slate-800 hover:text-white sm:col-span-2" onClick={leaveBeginnerBattle}>タイトルへ戻る</GameButton>
            </div>
          </div>
        </ScreenContainer>
      );
    }

    return (
      <ScreenContainer className="items-center justify-center overflow-hidden bg-slate-950 px-2 py-3 sm:px-4">
        <img src={COURSE_SELECT_ILLUSTRATION_IMAGE} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-slate-950/76" />
        <div
          className="beginner-battle-panel relative z-10 w-full max-w-5xl overflow-hidden rounded-2xl border border-cyan-300/40 bg-slate-900/94 shadow-[0_24px_80px_rgba(0,0,0,0.7)]"
          onPointerDown={event => {
            if ((event.target as HTMLElement).closest('button')) return;
            if (beginnerBattleResolving || beginnerBattleClearedPhase !== null) return;
            window.setTimeout(() => beginnerBattleInputRef.current?.focus(), 0);
          }}
        >
          <header className="beginner-battle-header flex flex-col gap-3 border-b border-slate-700 bg-slate-950/72 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black tracking-[0.16em] text-emerald-200">キーボードつき・はじめてバトル</p>
              <h1 className="mt-1 text-xl font-black text-white sm:text-2xl">{phase.title}</h1>
            </div>
            <div className="min-w-[220px] rounded-xl border border-slate-700 bg-slate-900/75 px-3 py-2">
              <div className="flex items-center justify-between text-xs font-black"><span className="text-amber-100">ステージ {phaseIndex + 1} / {BEGINNER_BATTLE_PHASES.length}</span><span className="text-slate-400">{BEGINNER_BATTLE_PHASE_SIZE}問ずつ</span></div>
              <div className="mt-2 grid grid-cols-10 gap-1" aria-label={`全${BEGINNER_BATTLE_PHASES.length}ステージ中${phaseIndex + 1}ステージ`}>
                {BEGINNER_BATTLE_PHASES.map((item, index) => <span key={item.title} title={item.shortTitle} className={`h-2 rounded-full ${index < phaseIndex ? 'bg-emerald-400' : index === phaseIndex ? 'bg-amber-300' : 'bg-slate-700'}`} />)}
              </div>
            </div>
          </header>

          <div className="beginner-battle-content grid gap-3 p-3 md:grid-cols-[0.72fr_1.28fr] md:p-4">
            <section className="beginner-battle-monster flex min-h-[205px] flex-col items-center justify-center rounded-xl border border-violet-300/25 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.18),rgba(15,23,42,0.78)_68%)] p-3 text-center">
              <p className="text-sm font-black text-violet-100">{currentMonster.name}</p>
              <div className={`beginner-battle-avatar my-1 transition duration-200 ${monsterShake ? 'scale-90 brightness-150' : 'animate-bounce-slow'} ${beginnerBattleClearedPhase !== null ? 'opacity-35 grayscale' : ''}`}>
                <MonsterAvatar type={currentMonster.type} color={currentMonster.color} emotion={beginnerBattleClearedPhase !== null ? 'win' : 'normal'} size={120} visualStyle={getMonsterVisualStyle(currentMonster)} />
              </div>
              <div className="w-full max-w-[260px] rounded-lg border border-slate-600 bg-slate-950/70 px-3 py-2">
                <div className="flex justify-between text-xs font-black text-slate-200"><span>モンスター</span><span>あと {remainingQuestions} 問</span></div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-300" style={{ width: `${hpPercent}%` }} /></div>
              </div>
            </section>

            <section className="beginner-battle-prompt flex min-h-[205px] flex-col justify-center rounded-xl border border-cyan-300/25 bg-slate-950/58 p-4 text-center">
              {beginnerBattleClearedPhase !== null ? (
                <div>
                  <div className="text-5xl">🎉</div>
                  <p className="mt-2 text-2xl font-black text-amber-200">モンスターをたおした！</p>
                  <p className="mt-2 text-sm font-bold text-slate-300">{BEGINNER_BATTLE_PHASE_SIZE}問できました。つぎも同じように、ゆっくり進めば大丈夫です。</p>
                  <GameButton className="mt-5" variant="success" onClick={continueBeginnerBattle}>つぎのモンスターへ <span className="rounded border border-white/45 bg-black/15 px-1.5 py-0.5 text-xs">Enter</span> <ArrowRight size={18} /></GameButton>
                </div>
              ) : (
                <>
                  <p className="text-xs font-black tracking-[0.14em] text-cyan-200">{phase.description}</p>
                  <div className="mt-2 flex items-center justify-center gap-3">
                    <span className="beginner-battle-emoji text-5xl" aria-hidden="true">{question.emoji}</span>
                    <div className="text-left"><p className="text-sm font-black text-slate-300">{question.translation}</p><button type="button" onClick={() => speakWithSettings(question.text)} className="mt-1 inline-flex items-center gap-1 text-xs font-black text-cyan-200 hover:text-cyan-100"><Volume2 size={15} /> 音を聞く</button></div>
                  </div>
                  <div className="mt-3 flex min-h-[64px] items-center justify-center gap-1 rounded-xl border border-slate-600 bg-slate-900/82 px-3 py-2">
                    {[...question.text].map((letter, index) => (
                      <span key={`${letter}-${index}`} className={`flex h-12 min-w-9 items-center justify-center rounded-lg border px-2 text-3xl font-black uppercase transition sm:min-w-11 ${index < beginnerBattleInput.length ? 'border-emerald-300 bg-emerald-400/20 text-emerald-100' : index === beginnerBattleInput.length ? 'border-amber-200 bg-amber-400/16 text-amber-100 shadow-[0_0_16px_rgba(251,191,36,0.28)]' : 'border-slate-700 bg-slate-950/55 text-slate-400'}`}>{letter}</span>
                    ))}
                  </div>
                  <input ref={beginnerBattleInputRef} autoFocus value={beginnerBattleInput} onChange={event => handleBeginnerBattleInput(event.target.value.toLowerCase())} className="sr-only" aria-label="はじめてバトルの入力" />
                  <p className={`mt-2 min-h-6 text-sm font-black ${beginnerBattleMessage.startsWith('だいじょうぶ') ? 'text-amber-200' : 'text-emerald-200'}`}>{beginnerBattleMessage || `${questionIndexInPhase + 1} / ${BEGINNER_BATTLE_PHASE_SIZE} 問`}</p>
                </>
              )}
            </section>

            <section className="beginner-battle-keyboard md:col-span-2">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
                <p className="text-sm font-black text-slate-200">画面のキーを押しても、パソコンのキーボードを押してもOK！</p>
                <button type="button" onClick={() => { setBeginnerBattleKeyHintsEnabled(enabled => !enabled); window.setTimeout(() => beginnerBattleInputRef.current?.focus(), 0); }} className="rounded-full border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-black text-slate-200 hover:border-amber-300">
                  キーの光：{beginnerBattleKeyHintsEnabled ? 'あり' : 'なし'}
                </button>
              </div>
              <GuidedKeyboard nextLetter={nextLetter} highlightNext={beginnerBattleKeyHintsEnabled} disabled={beginnerBattleResolving || beginnerBattleClearedPhase !== null} onPress={letter => handleBeginnerBattleInput(beginnerBattleInput + letter)} />
            </section>
          </div>

          <footer className="beginner-battle-footer flex items-center justify-between border-t border-slate-700 bg-slate-950/55 px-4 py-2">
            <p className="text-xs font-bold text-slate-400">時間制限・減点なし ・ 途中のつづきは自動保存</p>
            <GameButton size="sm" variant="outline" onClick={leaveBeginnerBattle}>やめる</GameButton>
          </footer>
        </div>
      </ScreenContainer>
    );
  }

  if (gameState.screen === 'title') {
    const allMonsterIds = Object.values(MONSTERS).flatMap(lvl => [...lvl.guide, ...lvl.challenge]).map(m => m.id);
    const uniqueDefeatedIds = new Set(gameState.defeatedMonsterIds.map(key => extractMonsterId(key)));
    const totalDefeated = [...uniqueDefeatedIds].filter(id => allMonsterIds.includes(id)).length;
    const totalMonsters = allMonsterIds.length;
    const todayQuestionCount = dailyProgress.date === getTodayKey() ? dailyProgress.questionCount : 0;
    const nextBattleMode: Extract<Mode, 'guide' | 'challenge'> = resumeMode;
    const nextBattleInputMode = resumeInputMode;
    const nextBattleList = nextBattleMode === 'guide' || nextBattleInputMode === 'voice-text'
      ? MONSTERS[gameState.selectedLevel].guide
      : MONSTERS[gameState.selectedLevel].challenge;
    const nextBattleTargetCount = nextBattleMode === 'guide'
      ? getGuideTargetCount(gameState.selectedDifficulty, gameState.selectedLevel)
      : nextBattleInputMode === 'voice-text'
        ? getListeningTargetCount(gameState.selectedDifficulty, gameState.selectedLevel)
        : nextBattleInputMode === 'voice-only'
          ? NORMAL_TARGET_COUNT
          : HARD_TARGET_COUNT;
    const nextBattleModeLabel = nextBattleMode === 'guide'
      ? '基礎練習'
      : nextBattleInputMode === 'voice-text'
        ? 'リスニング練習'
        : nextBattleInputMode === 'voice-only'
          ? '音声バトル'
          : '和訳バトル';
    const nextBattleIndices = getBattleStageIndices(nextBattleList, nextBattleTargetCount, nextBattleMode, nextBattleInputMode);
    const nextBattleStep = nextBattleIndices.findIndex(monsterIndex => (
      !matchesDefeatedMonster(
        gameState.defeatedMonsterIds,
        gameState.selectedDifficulty,
        gameState.selectedLevel,
        nextBattleMode,
        nextBattleInputMode,
        nextBattleList[monsterIndex].id
      )
    ));
    const nextBattleDisplayStep = nextBattleStep >= 0 ? nextBattleStep : 0;
    const nextBattleMonsterIndex = nextBattleIndices[nextBattleDisplayStep] ?? 0;
    const nextBattleMonster = nextBattleList[nextBattleMonsterIndex] ?? nextBattleList[0];
    const nextBattleBossStage = getBossStage(nextBattleMode, nextBattleInputMode, nextBattleDisplayStep, nextBattleIndices.length);
    const nextBattleHp = nextBattleMonster
      ? getBattleHp(
          gameState.selectedDifficulty,
          gameState.selectedLevel,
          getCourseBaseHp(gameState.selectedDifficulty, gameState.selectedLevel, nextBattleMode, nextBattleInputMode, nextBattleDisplayStep, nextBattleMonster.baseHp),
          nextBattleBossStage
        )
      : 0;
    const nextBattleProgress = nextBattleStep >= 0 ? nextBattleStep : nextBattleIndices.length;
    const nextBattleIsComplete = nextBattleStep < 0;
    const nextBattleTaunt = nextBattleMonster
      ? getTitleMonsterTaunt(
        nextBattleMonster,
        `${getTodayKey()}:${nextBattleProgress}:${todayQuestionCount}:${totalDefeated}`
      )
      : '';

    return (
      <ScreenContainer>
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#081426] p-4">
            <img
              src={COURSE_SELECT_ILLUSTRATION_IMAGE}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-[0.72] saturate-[1.22] brightness-[1.16]"
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(34,211,238,0.12),transparent_30%),radial-gradient(circle_at_78%_24%,rgba(251,191,36,0.2),transparent_32%)]"></div>
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.68)_0%,rgba(2,6,23,0.34)_38%,rgba(2,6,23,0.06)_68%,rgba(2,6,23,0.12)_100%),linear-gradient(180deg,rgba(2,6,23,0.02)_0%,rgba(2,6,23,0.24)_100%)]"></div>
            <div
              className="relative z-10 flex w-full max-w-7xl flex-col items-center gap-2 px-2 py-3"
              style={{ fontFamily: "'M PLUS Rounded 1c', 'Zen Maru Gothic', 'Kosugi Maru', 'Yu Gothic', 'Meiryo', sans-serif" }}
            >
              <GameTitleLogo />
              <div className="grid w-full items-stretch gap-8 lg:grid-cols-[minmax(0,680px)_minmax(360px,1fr)]">
              <div className="flex h-full w-full max-w-3xl flex-col items-center justify-self-center lg:items-start lg:justify-self-start">
                <div className="mb-5 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-emerald-300/35 bg-emerald-950/22 px-4 py-3 shadow-[0_12px_28px_rgba(0,0,0,0.24)] backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-emerald-200">
                      <Target size={18} />
                      <span className="text-xs font-black">今日の問題数</span>
                    </div>
                    <p className="mt-1 text-3xl font-black text-white">{todayQuestionCount}<span className="ml-1 text-base text-emerald-100">問</span></p>
                  </div>
                  <div className="rounded-lg border border-amber-300/42 bg-amber-950/24 px-4 py-3 shadow-[0_12px_28px_rgba(0,0,0,0.24)] backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-amber-200">
                      <Trophy size={18} />
                      <span className="text-xs font-black">撃破数</span>
                    </div>
                    <p className="mt-1 text-3xl font-black text-white">{totalDefeated}<span className="mx-1 text-base text-amber-100">/</span><span className="text-xl text-amber-100">{totalMonsters}</span></p>
                  </div>
                </div>

                <div className="w-full max-w-3xl overflow-hidden rounded-lg border border-sky-300/28 bg-slate-950/76 shadow-[0_24px_70px_rgba(0,0,0,0.48)] backdrop-blur-md">
                  <div className="border-b border-sky-300/18 bg-slate-900/70 px-5 py-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-300">Current Course</p>
                        <p className="mt-1 truncate text-2xl font-black text-white">
                          {DIFFICULTY_LABELS[gameState.selectedDifficulty]} Level {gameState.selectedLevel}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {playerProfiles.map((profile) => {
                          const isActive = profile.id === activePlayerId;
                          return (
                            <button
                              key={profile.id}
                              onClick={() => activatePlayerProfile(profile.id)}
                              disabled={isActive}
                              className={`rounded-lg border px-3 py-1.5 text-sm font-black transition-colors ${isActive ? 'border-violet-300 bg-violet-500/20 text-white' : 'border-slate-600 bg-slate-900/60 text-slate-200 hover:border-violet-300 hover:bg-violet-900/15'}`}
                            >
                              {profile.name}
                            </button>
                          );
                        })}
                        <button
                          onClick={openPlayerProfileSettings}
                          className="rounded-lg border border-violet-400/45 bg-violet-950/25 px-3 py-1.5 text-sm font-black text-violet-100 transition-colors hover:border-violet-300 hover:bg-violet-900/25"
                        >
                          管理
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 p-4 sm:grid-cols-2">
                    <GameButton
                      onClick={() => setShowFirstPlayGuide(true)}
                      variant="outline"
                      className="w-full min-h-[58px] border-emerald-300/70 bg-emerald-950/42 text-emerald-50 shadow-[0_0_26px_rgba(52,211,153,0.16)] hover:border-emerald-200 hover:bg-emerald-900/48 sm:col-span-2"
                      size="md"
                    >
                      <span className="flex items-center justify-center gap-2 text-base sm:text-lg">
                        <Star size={22} /> 初めて遊ぶ人はこちら
                      </span>
                    </GameButton>

                    <GameButton
                      onClick={() => startGame(gameState.selectedDifficulty, gameState.selectedLevel, nextBattleMode, nextBattleInputMode)}
                      className="w-full min-h-[72px] border-cyan-300 bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 text-xl shadow-[0_0_34px_rgba(34,211,238,0.28)] hover:from-cyan-500 hover:via-sky-500 hover:to-blue-500 sm:col-span-2"
                      size="md"
                    >
                      <ArrowRight size={26} /> 前回の続きから
                    </GameButton>
                    <GameButton
                      onClick={() => setGameState(prev => ({ ...prev, screen: 'level-select' }))}
                      variant="outline"
                      className="w-full min-h-[64px] border-amber-300/55 bg-amber-950/25 text-base text-amber-100 hover:border-amber-200 hover:bg-amber-900/35"
                      size="md"
                    >
                      <LayoutGrid size={24} /> 教材を選ぶ
                    </GameButton>

                    <GameButton
                      onClick={() => setGameState(prev => ({ ...prev, screen: 'versus-setup' }))}
                      variant="outline"
                      className="w-full min-h-[64px] border-violet-300/55 bg-violet-950/25 text-base text-violet-100 hover:border-violet-200 hover:bg-violet-900/35"
                      size="md"
                    >
                      <Trophy size={24} /> 20問バトル！（1〜5人）
                    </GameButton>

                    <GameButton
                      onClick={() => { setTypingPracticeIndex(0); setTypingPracticeInput(''); setTypingPracticeMisses(0); setGameState(prev => ({ ...prev, screen: 'typing-practice' })); }}
                      variant="outline"
                      className="w-full min-h-[64px] border-emerald-300/55 bg-emerald-950/25 text-base text-emerald-100 hover:border-emerald-200 hover:bg-emerald-900/35"
                      size="md"
                    >
                      <Keyboard size={24} /> はじめてのタイピング練習
                    </GameButton>

                    <div className="grid grid-cols-2 gap-3 sm:col-span-2 md:grid-cols-4">
                      <GameButton onClick={() => setGameState(prev => ({ ...prev, screen: 'monster-book' }))} variant="outline" className="border-slate-600 bg-slate-900/65 px-2 text-slate-200 hover:border-emerald-300 hover:bg-emerald-950/25">
                        <BookOpen size={18} /> 図鑑
                      </GameButton>
                      <GameButton onClick={() => setGameState(prev => ({ ...prev, screen: 'question-list' }))} variant="outline" className="border-slate-600 bg-slate-900/65 px-2 text-slate-200 hover:border-amber-300 hover:bg-amber-950/25">
                        <ClipboardList size={18} /> {gameState.selectedDifficulty === 'Conversation' ? '表現リスト' : '単語リスト'}
                      </GameButton>
                      <GameButton onClick={() => setGameState(prev => ({ ...prev, screen: 'settings' }))} variant="outline" className="border-slate-600 bg-slate-900/65 px-2 text-slate-200 hover:border-cyan-300 hover:bg-cyan-950/25">
                        <Volume2 size={18} /> 設定
                      </GameButton>
                      <GameButton onClick={() => setGameState(prev => ({ ...prev, screen: 'help' }))} variant="outline" className="border-slate-600 bg-slate-900/65 px-2 text-slate-200 hover:border-violet-300 hover:bg-violet-950/25">
                        <AlertCircle size={18} /> ヘルプ
                      </GameButton>
                    </div>
                  </div>
                </div>

                {showFirstPlayGuide && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/82 p-4 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="first-play-guide-title"
                    onMouseDown={(event) => {
                      if (event.target === event.currentTarget) setShowFirstPlayGuide(false);
                    }}
                  >
                    <div className="my-auto max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border-2 border-emerald-300/55 bg-slate-900 shadow-[0_28px_90px_rgba(0,0,0,0.72)]">
                      <div className="border-b border-slate-700 bg-[linear-gradient(135deg,rgba(6,78,59,0.62),rgba(15,23,42,0.96))] px-5 py-5 text-center sm:px-7">
                        <p className="text-xs font-black tracking-[0.18em] text-emerald-200">はじめて遊ぶ人へ</p>
                        <h2 id="first-play-guide-title" className="mt-2 text-2xl font-black text-white sm:text-3xl">近い方を選ぶだけでOK！</h2>
                        <p className="mt-2 text-sm font-bold text-slate-300">あとから、いつでも別のコースへ変更できます。</p>
                      </div>

                      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
                        <button
                          type="button"
                          onClick={() => {
                            setShowFirstPlayGuide(false);
                            setTypingPracticeIndex(0);
                            setTypingPracticeInput('');
                            setTypingPracticeMisses(0);
                            setGameState(prev => ({ ...prev, screen: 'typing-practice' }));
                          }}
                          className="rounded-xl border-2 border-emerald-400/55 bg-emerald-950/42 p-5 text-left transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-900/48 focus:outline-none focus:ring-4 focus:ring-emerald-300/40"
                        >
                          <span className="flex items-center gap-3 text-lg font-black text-white">
                            <Keyboard size={25} className="text-emerald-200" /> 文字入力から練習する
                          </span>
                          <span className="mt-3 block text-sm font-bold leading-6 text-slate-300">
                            キーボードに慣れていない人向け。押す場所からゆっくり覚えます。
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowFirstPlayGuide(false);
                            startGame('Eiken5', 1, 'guide', 'voice-text');
                          }}
                          className="relative rounded-xl border-2 border-cyan-300 bg-cyan-950/48 p-5 text-left shadow-[0_0_28px_rgba(34,211,238,0.13)] transition hover:-translate-y-0.5 hover:bg-cyan-900/48 focus:outline-none focus:ring-4 focus:ring-cyan-300/40"
                        >
                          <span className="absolute right-3 top-3 rounded-full bg-amber-300 px-2 py-1 text-[10px] font-black text-amber-950">おすすめ</span>
                          <span className="flex items-center gap-3 pr-16 text-lg font-black text-white">
                            <ArrowRight size={25} className="text-cyan-200" /> 文字入力はできる
                          </span>
                          <span className="mt-3 block text-sm font-black text-cyan-100">英検5級・Level 1・基礎練習</span>
                          <span className="mt-1 block text-sm font-bold leading-6 text-slate-300">
                            英単語を見ながら入力する、一番始めやすいコースです。
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowFirstPlayGuide(false);
                            startBeginnerBattle();
                          }}
                          className="rounded-lg border border-amber-300/55 bg-amber-950/28 px-4 py-3 text-left transition hover:border-amber-200 hover:bg-amber-900/38 sm:col-span-2"
                        >
                          <span className="flex items-center gap-2 text-sm font-black text-amber-100"><Sword size={18} /> タイピング練習を終えた人</span>
                          <span className="mt-1 block text-xs font-bold text-slate-300">キーボードを見ながら「はじめてバトル」に挑戦できます。</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowFirstPlayGuide(false);
                            setGameState(prev => ({ ...prev, screen: 'level-select' }));
                          }}
                          className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-sm font-black text-slate-200 transition hover:border-cyan-300 hover:bg-slate-700 sm:col-span-2"
                        >
                          英検の級やLevelを自分で選びたい
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowFirstPlayGuide(false)}
                          className="px-4 py-2 text-sm font-bold text-slate-400 transition hover:text-white sm:col-span-2"
                        >
                          閉じる
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex w-full max-w-3xl items-center justify-center text-center text-xs font-bold text-slate-400 md:justify-start">
                  Word List・保存/読み込み・履歴リセットは、教材や設定画面から使えます。
                </div>
              </div>

              <aside className="relative hidden min-h-[560px] overflow-hidden rounded-lg border border-cyan-100/45 bg-sky-950/10 shadow-[0_28px_80px_rgba(0,0,0,0.24)] lg:block">
                <img
                  src={COURSE_SELECT_ILLUSTRATION_IMAGE}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-cover object-[62%_50%] saturate-[1.22] contrast-[1.04] brightness-[1.08]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,20,38,0.04)_0%,rgba(8,20,38,0)_44%,rgba(8,20,38,0.04)_100%),linear-gradient(180deg,rgba(2,6,23,0)_0%,rgba(2,6,23,0.08)_100%)]"></div>
                <div className="absolute left-5 top-5 rounded-lg border border-amber-100/55 bg-amber-900/24 px-4 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.22)] backdrop-blur-md">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-100">Next Adventure</p>
                  <p className="mt-1 text-lg font-black text-white">教材を選んで出発</p>
                </div>
                <div className="absolute bottom-5 right-5 rounded-lg border border-cyan-100/45 bg-cyan-900/22 px-4 py-3 text-right shadow-[0_16px_40px_rgba(0,0,0,0.22)] backdrop-blur-md">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100">Today</p>
                  <p className="mt-1 text-2xl font-black text-white">{todayQuestionCount}<span className="ml-1 text-sm text-cyan-100">問</span></p>
                </div>
                {nextBattleMonster && (
                  <div className="absolute left-7 right-7 top-28 overflow-hidden rounded-lg border border-sky-100/50 bg-slate-950/46 p-5 shadow-[0_22px_54px_rgba(0,0,0,0.28)] backdrop-blur-md">
                    <div className="flex items-center gap-5">
                      <div className="relative shrink-0">
                        <div className="absolute inset-3 rounded-full bg-cyan-300/20 blur-2xl"></div>
                        <MonsterAvatar
                          type={nextBattleMonster.type}
                          color={nextBattleMonster.color}
                          size={150}
                          visualStyle={getMonsterVisualStyle(nextBattleMonster)}
                        />
                        {nextBattleBossStage > 0 && (
                          <div className="absolute right-2 top-2 rounded bg-red-600 px-2 py-0.5 text-[10px] font-black text-white">BOSS</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
                          {nextBattleIsComplete ? `${nextBattleModeLabel} Cleared` : `${nextBattleModeLabel} Next Enemy`}
                        </p>
                        <h3 className="mt-1 truncate text-2xl font-black text-white">{nextBattleMonster.name}</h3>
                        <p className="mt-1 text-xs font-bold text-slate-300">
                          Progress {nextBattleProgress} / {nextBattleIndices.length}
                        </p>
                        {nextBattleTaunt && (
                          <div className="mt-3 rounded-lg border border-cyan-100/35 bg-slate-950/42 px-3 py-2 text-[13px] font-bold leading-relaxed text-cyan-50 shadow-[0_12px_28px_rgba(0,0,0,0.2)]">
                            「{nextBattleTaunt}」
                          </div>
                        )}
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div className="rounded-lg border border-slate-600/70 bg-slate-900/72 px-3 py-2">
                            <p className="text-[10px] font-black text-slate-400">HP</p>
                            <p className="text-lg font-black text-amber-100">{nextBattleHp}</p>
                          </div>
                          <div className="rounded-lg border border-slate-600/70 bg-slate-900/72 px-3 py-2">
                            <p className="text-[10px] font-black text-slate-400">Stage</p>
                            <p className="text-lg font-black text-cyan-100">{Math.min(nextBattleDisplayStep + 1, nextBattleIndices.length)}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => startGame(gameState.selectedDifficulty, gameState.selectedLevel, nextBattleMode, nextBattleInputMode)}
                          className="mt-4 w-full rounded-lg border border-cyan-200 bg-cyan-500/20 px-4 py-3 text-sm font-black text-cyan-50 shadow-[0_0_24px_rgba(34,211,238,0.16)] transition-colors hover:bg-cyan-400/25"
                        >
                          この敵に挑む
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </aside>
              </div>
                    {showResetConfirm && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60" onClick={() => setShowResetConfirm(false)}></div>
                        <div className="relative w-full max-w-xl rounded-xl border-2 border-red-700/60 bg-slate-900 p-6 shadow-2xl">
                          <h3 className="mb-4 text-2xl font-black text-red-300">履歴をリセット</h3>
                          <div className="space-y-2 text-slate-200">
                            <p>本当にPlay履歴データを消去して良いですか？</p>
                            <p>Are you sure you want to delete your Play history data?</p>
                          </div>
                          <div className="mt-6 flex justify-end gap-3">
                            <GameButton onClick={() => setShowResetConfirm(false)} variant="outline" size="sm" autoFocus>No</GameButton>
                            <GameButton onClick={confirmResetHistory} size="sm" className="bg-red-600 border-red-400 text-white hover:bg-red-500">Yes</GameButton>
                          </div>
                        </div>
                      </div>
                    )}
                    {showHelp && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60" onClick={() => setShowHelp(false)}></div>
                        <div className="relative w-full max-w-xl rounded-xl border-2 border-slate-500 bg-slate-900 p-6 shadow-2xl">
                          <h3 className="mb-4 text-2xl font-black text-blue-300">遊び方 (How to Play)</h3>
                          <div className="space-y-2 text-slate-200">
                            <p>1. 難易度とレベルを選んでバトルを開始します。</p>
                            <p>2. 表示された英語を正しく入力するとモンスターにダメージを与えます。</p>
                            <p>3. ミスが増えるとスコアが伸びにくくなるので、正確さを意識してください。</p>
                            <p>4. 苦手特訓や図鑑を使って、単語と記録を確認できます。</p>
                          </div>
                          <div className="mt-6 flex justify-end">
                            <GameButton onClick={() => setShowHelp(false)} variant="outline" size="sm" autoFocus>閉じる</GameButton>
                          </div>
                        </div>
                      </div>
                    )}
            </div>
        </div>
      </ScreenContainer>
    );
  }

  if (gameState.screen === 'level-select') {
    const isConversationCourse = gameState.selectedDifficulty === 'Conversation';
    const availableLevels = getAvailableLevels(gameState.selectedDifficulty);
    const selectedQuestionCount = QUESTIONS[gameState.selectedDifficulty]?.[gameState.selectedLevel]?.length ?? 0;
    const selectedLearningSummary = getScopedLearningSummary(gameState.selectedDifficulty, gameState.selectedLevel);
    const levelDescriptions: Record<Level, string> = isConversationCourse
      ? {
          1: 'Quick Responses / あいさつ・反応',
          2: 'Ask & Answer / 質問・自己表現',
          3: 'Real Scenes / 場面別ミニ会話',
        }
      : {
          1: 'Short Words / 単語',
          2: 'Phrases / 熟語',
          3: 'Sentences / 文章',
        };
    const levelIcons: Record<Level, React.ReactNode> = {
      1: <Sword size={26} />,
      2: <Shield size={26} />,
      3: <BookOpen size={26} />,
    };

    return (
      <ScreenContainer className="items-center justify-center overflow-hidden bg-slate-950">
        <img
          src={COURSE_SELECT_ILLUSTRATION_IMAGE}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-70 saturate-[1.08]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.82)_0%,rgba(2,6,23,0.7)_38%,rgba(2,6,23,0.56)_100%),radial-gradient(circle_at_18%_22%,rgba(251,191,36,0.22),transparent_32%),radial-gradient(circle_at_86%_78%,rgba(56,189,248,0.24),transparent_36%)]"></div>
        <div
          className="relative z-10 w-full max-w-6xl p-4"
          style={{ fontFamily: "'M PLUS Rounded 1c', 'Zen Maru Gothic', 'Kosugi Maru', 'Yu Gothic', 'Meiryo', sans-serif" }}
        >
          <div className="mb-4 flex items-center justify-between">
            <GameButton
              size="sm"
              variant="ghost"
              onClick={() => setGameState(prev => ({ ...prev, screen: 'title' }))}
              className="text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <Home size={16} /> ホームへ
            </GameButton>
            <div className="rounded-full border border-cyan-300/30 bg-cyan-950/35 px-4 py-2 text-sm font-black text-cyan-100">
              現在: {DIFFICULTY_LABELS[gameState.selectedDifficulty]} Level {gameState.selectedLevel}
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-500/45 bg-slate-950/74 shadow-[0_24px_70px_rgba(0,0,0,0.46)] backdrop-blur-md">
            <div className="relative overflow-hidden border-b border-slate-600/50 bg-[linear-gradient(135deg,rgba(15,23,42,0.9),rgba(8,47,73,0.74),rgba(120,53,15,0.28))] px-5 py-5">
              <div className="pointer-events-none absolute -right-4 bottom-[-70px] hidden h-56 w-56 rounded-full border border-cyan-200/20 bg-cyan-300/10 blur-2xl md:block"></div>
              <div className="relative max-w-2xl">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-amber-200">Course Select</p>
                <h2 className="mt-1 text-3xl font-black text-white md:text-4xl">教材を選ぶ</h2>
                <p className="mt-2 text-sm font-bold leading-relaxed text-slate-300">
                  ふだん使う教材とLevelをここで選びます。決定すると、4つの学習モードを選ぶ画面に進みます。
                </p>
              </div>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[0.85fr_1.15fr]">
              <section className="space-y-4">
                <div>
                  <p className="mb-2 text-sm font-black text-cyan-200">1. 教材</p>
                  <div className="grid gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (isConversationCourse) updateSelectedDifficulty('Eiken4');
                      }}
                      className={`relative overflow-hidden rounded-lg border-2 p-4 text-left transition-all ${!isConversationCourse ? 'border-cyan-300 bg-cyan-500/16 shadow-[0_0_24px_rgba(34,211,238,0.14)]' : 'border-slate-700 bg-slate-900/64 hover:border-cyan-300/60 hover:bg-cyan-950/20'}`}
                    >
                      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-amber-300/18"></div>
                      <div className="pointer-events-none absolute bottom-2 right-3 text-4xl opacity-90">ABC</div>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xl font-black text-white">英検</p>
                          <p className="mt-1 text-sm font-bold text-cyan-100">級ごとに単語・熟語・文章を練習</p>
                        </div>
                        {!isConversationCourse && <CheckCircle2 className="text-cyan-200" size={24} />}
                      </div>
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 opacity-60">
                        <p className="text-base font-black text-slate-200">TOEIC</p>
                        <p className="mt-1 text-xs font-bold text-slate-500">準備中</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateSelectedDifficulty('Conversation')}
                        className={`rounded-lg border-2 p-4 text-left transition-all ${isConversationCourse ? 'border-emerald-300 bg-emerald-500/16 text-white shadow-[0_0_24px_rgba(52,211,153,0.16)]' : 'border-slate-700 bg-slate-900/64 text-slate-200 hover:border-emerald-300/60 hover:bg-emerald-950/20'}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-base font-black">英会話</p>
                            <p className="mt-1 text-xs font-bold text-emerald-200/80">聞く・返す・声に出す</p>
                          </div>
                          {isConversationCourse && <CheckCircle2 className="text-emerald-200" size={20} />}
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-lg border border-slate-700 bg-slate-900/62 p-4">
                  <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-400/12"></div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Selected Course</p>
                  <p className="mt-2 text-2xl font-black text-white">{DIFFICULTY_LABELS[gameState.selectedDifficulty]} Level {gameState.selectedLevel}</p>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg border border-sky-400/25 bg-sky-500/10 px-2 py-3">
                      <p className="text-[10px] font-black text-sky-200">{isConversationCourse ? '会話数' : '単語数'}</p>
                      <p className="mt-1 text-xl font-black text-white">{selectedQuestionCount}</p>
                    </div>
                    <div className="rounded-lg border border-violet-400/25 bg-violet-500/10 px-2 py-3">
                      <p className="text-[10px] font-black text-violet-200">覚えた</p>
                      <p className="mt-1 text-xl font-black text-white">{selectedLearningSummary.masteredCount}</p>
                    </div>
                    <div className="rounded-lg border border-amber-400/25 bg-amber-500/10 px-2 py-3">
                      <p className="text-[10px] font-black text-amber-200">学習中</p>
                      <p className="mt-1 text-xl font-black text-white">{selectedLearningSummary.learningCount}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-5">
                <div>
                  <p className="mb-2 text-sm font-black text-cyan-200">2. {isConversationCourse ? 'コース' : '級'}</p>
                  <div className={`grid grid-cols-1 gap-3 ${isConversationCourse ? '' : 'sm:grid-cols-3'}`}>
                    {(isConversationCourse ? ['Conversation'] as Difficulty[] : EIKEN_DIFFICULTIES).map(diff => {
                      const isSelected = gameState.selectedDifficulty === diff;
                      const levelCount = getAvailableLevels(diff).length;
                      return (
                        <button
                          key={diff}
                          type="button"
                          onClick={() => updateSelectedDifficulty(diff)}
                          className={`min-h-[112px] rounded-lg border-2 p-4 text-left transition-all ${isSelected ? 'border-amber-300 bg-amber-500/16 text-white shadow-[0_0_26px_rgba(251,191,36,0.18)]' : 'border-slate-700 bg-slate-900/64 text-slate-200 hover:border-amber-300/60 hover:bg-amber-950/20'}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xl font-black">{DIFFICULTY_LABELS[diff]}</p>
                              <p className="mt-2 text-xs font-bold text-slate-400">{diff === 'Conversation' ? '英検4級を終えたころから・Level 3段階' : `Level ${levelCount}段階`}</p>
                            </div>
                            {isSelected && <CheckCircle2 className="text-amber-200" size={22} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-black text-cyan-200">3. Level</p>
                  <div className={`grid grid-cols-1 gap-3 ${availableLevels.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
                    {availableLevels.map(lvl => {
                      const isSelected = gameState.selectedLevel === lvl;
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setGameState(prev => ({ ...prev, selectedLevel: lvl }))}
                          className={`rounded-lg border-2 p-4 text-left transition-all ${isSelected ? 'border-cyan-300 bg-cyan-500/16 text-white shadow-[0_0_26px_rgba(34,211,238,0.18)]' : 'border-slate-700 bg-slate-900/64 text-slate-200 hover:border-cyan-300/60 hover:bg-cyan-950/20'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-lg border ${isSelected ? 'border-cyan-200 bg-cyan-400/20 text-cyan-100' : 'border-slate-700 bg-slate-950/60 text-slate-400'}`}>
                              {levelIcons[lvl]}
                            </div>
                            <div>
                              <p className="text-xl font-black">Level {lvl}</p>
                              <p className="mt-1 text-xs font-bold text-slate-400">{levelDescriptions[lvl]}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-lg border border-slate-700 bg-slate-900/62 p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-black text-white">この教材で始めます</p>
                    <p className="mt-1 text-xs font-bold text-slate-400">
                      {isConversationCourse
                        ? '次の画面で、会話の型・聞いて返す練習・実戦バトルを選べます。'
                        : '次の画面で、基礎練習・リスニング練習・音声バトル・和訳バトルを選べます。'}
                    </p>
                  </div>
                  <GameButton
                    onClick={() => setGameState(prev => ({ ...prev, screen: 'mode-select' }))}
                    className="min-h-[54px] whitespace-nowrap border-cyan-300 bg-gradient-to-r from-cyan-600 to-blue-600 text-lg hover:from-cyan-500 hover:to-blue-500"
                    size="md"
                  >
                    決定 <ArrowRight size={20} />
                  </GameButton>
                </div>
              </section>
            </div>
          </div>
        </div>
      </ScreenContainer>
    );
  }

  if (gameState.screen === 'mode-select') {
    const isConversationCourse = gameState.selectedDifficulty === 'Conversation';
    const monstersObj = MONSTERS[gameState.selectedLevel];
    const learningSummary = getScopedLearningSummary(gameState.selectedDifficulty, gameState.selectedLevel);
    const guideTargetCount = getGuideTargetCount(gameState.selectedDifficulty, gameState.selectedLevel);
    const listeningTargetCount = getListeningTargetCount(gameState.selectedDifficulty, gameState.selectedLevel);
    const guideFinalMonsterName = monstersObj.guide[guideTargetCount - 1]?.name ?? '???';
    const listeningFinalMonsterName = monstersObj.guide[listeningTargetCount - 1]?.name ?? '???';
    const normalBattleIndices = getBattleStageIndices(monstersObj.challenge, NORMAL_TARGET_COUNT, 'challenge', 'voice-only');
    const hardBattleIndices = getBattleStageIndices(monstersObj.challenge, HARD_TARGET_COUNT, 'challenge', 'text-only');
    const normalFinalMonsterName = monstersObj.challenge[normalBattleIndices[normalBattleIndices.length - 1] ?? NORMAL_TARGET_COUNT - 1]?.name ?? '???';
    const hardFinalMonsterName = monstersObj.challenge[hardBattleIndices[hardBattleIndices.length - 1] ?? HARD_TARGET_COUNT - 1]?.name ?? '???';
    
    const getModeProgress = (list: Monster[], mode: Mode, inputMode: InputMode, targetCount: number) => {
        const targetIndices = getBattleStageIndices(list, targetCount, mode, inputMode);
        const nextMonsterIndex = targetIndices.find(monsterIndex => !matchesDefeatedMonster(
          gameState.defeatedMonsterIds,
          gameState.selectedDifficulty,
          gameState.selectedLevel,
          mode,
          inputMode,
          list[monsterIndex]?.id ?? ''
        ));
        
        return {
            nextTargetName: nextMonsterIndex == null
              ? null
              : list[nextMonsterIndex]?.name ?? null,
            isComplete: nextMonsterIndex == null,
        };
    };

    const guideStatus = getModeProgress(monstersObj.guide, 'guide', 'voice-text', guideTargetCount);
    const easyStatus = getModeProgress(monstersObj.guide, 'challenge', 'voice-text', listeningTargetCount);
    const normalStatus = getModeProgress(monstersObj.challenge, 'challenge', 'voice-only', NORMAL_TARGET_COUNT);
    const hardStatus = getModeProgress(monstersObj.challenge, 'challenge', 'text-only', HARD_TARGET_COUNT);
    const trainingMascot = monstersObj.guide[0];
    const battleMascot = monstersObj.challenge[0];

    return (
      <ScreenContainer className="items-center justify-center overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_82%,rgba(245,158,11,0.24),transparent_34%),radial-gradient(circle_at_78%_12%,rgba(56,189,248,0.26),transparent_38%)]"></div>
        <div className="pointer-events-none absolute right-0 top-0 hidden h-full w-[42%] bg-[linear-gradient(90deg,transparent,rgba(14,165,233,0.12),rgba(251,191,36,0.08))] lg:block"></div>
        <div
          className="relative z-10 w-full max-w-6xl p-4"
          style={{ fontFamily: "'M PLUS Rounded 1c', 'Zen Maru Gothic', 'Kosugi Maru', 'Yu Gothic', 'Meiryo', sans-serif" }}
        >
          <div className="overflow-hidden rounded-lg border border-slate-500/45 bg-slate-950/70 shadow-[0_24px_70px_rgba(0,0,0,0.46)] backdrop-blur-md">
            <div className="border-b border-slate-600/50 bg-slate-800/70 px-5 py-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300">Current Course</p>
                  <h2 className="mt-1 text-2xl font-black text-white md:text-3xl">
                    {DIFFICULTY_LABELS[gameState.selectedDifficulty]} Level {gameState.selectedLevel}
                  </h2>
                </div>
                <p className="rounded-full border border-cyan-300/25 bg-cyan-950/40 px-4 py-2 text-sm font-black text-cyan-50">
                  {learningSummary.playableCount}{isConversationCourse ? '表現' : '単語'}中 {learningSummary.masteredCount}{isConversationCourse ? '表現' : '単語'}を習得
                </p>
              </div>
            </div>

            <div className="relative p-5 md:p-7">
              <div className="pointer-events-none absolute right-5 top-4 hidden rounded-full border border-amber-200/45 bg-slate-950/82 px-4 py-2 text-sm font-black text-amber-100 shadow-[0_10px_28px_rgba(0,0,0,0.28)] xl:block">
                今日の冒険を選ぼう!
              </div>
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300">Mode Select</p>
                  <h1 className="mt-1 text-3xl font-black text-white md:text-4xl">モードをえらぶ</h1>
                  <p className="mt-2 text-sm font-bold text-slate-300">{isConversationCourse ? '相手のひと言を聞いて、自分の返答を英語で組み立てよう。' : '今日の気分に合わせて、練習かチャレンジを選ぼう。'}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-left sm:min-w-[420px]">
                  <div className="rounded-lg border border-sky-400/30 bg-sky-500/10 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                    <div className="flex items-center gap-2 text-sky-200"><BookOpen size={16} /><span className="text-[11px] font-black">学習中</span></div>
                    <p className="mt-2 text-3xl font-black text-white">{learningSummary.learningCount}</p>
                  </div>
                  <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                    <div className="flex items-center gap-2 text-emerald-200"><CheckCircle2 size={16} /><span className="text-[11px] font-black">もう少し</span></div>
                    <p className="mt-2 text-3xl font-black text-white">{learningSummary.cautionCount}</p>
                  </div>
                  <div className="rounded-lg border border-amber-300/35 bg-amber-400/10 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                    <div className="flex items-center gap-2 text-amber-200"><Crown size={16} /><span className="text-[11px] font-black">覚えた</span></div>
                    <p className="mt-2 text-3xl font-black text-white">{learningSummary.masteredCount}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <section className="relative overflow-hidden rounded-lg border border-emerald-400/25 bg-[linear-gradient(145deg,rgba(9,56,55,0.72),rgba(15,23,42,0.78))] p-4 shadow-[0_18px_42px_rgba(0,0,0,0.26)]">
                  {trainingMascot && (
                    <div className="pointer-events-none absolute -right-5 -top-5 opacity-20 blur-[0.2px]">
                      <MonsterAvatar type={trainingMascot.type} color={trainingMascot.color} size={128} visualStyle={getMonsterVisualStyle(trainingMascot)} />
                    </div>
                  )}
                  <div className="mb-4 flex items-center gap-3 border-b border-emerald-300/20 pb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-emerald-300/30 bg-emerald-400/15 text-emerald-200"><Brain size={24} /></div>
                    <div>
                      <h3 className="text-xl font-black text-emerald-50">TRAINING ZONE</h3>
                      <p className="text-xs font-bold text-emerald-200/75">まずはここで練習しよう！({guideTargetCount}体)</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <button onClick={() => startGame(gameState.selectedDifficulty, gameState.selectedLevel, 'guide', 'voice-text')} className={`group relative w-full overflow-hidden rounded-lg border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(16,185,129,0.16)] ${guideStatus.isComplete ? 'border-amber-300 bg-amber-400/14 shadow-[0_0_0_1px_rgba(251,191,36,0.18)]' : 'border-emerald-300/25 bg-slate-900/52 hover:border-emerald-300/60 hover:bg-emerald-950/35'}`}>
                      {guideStatus.isComplete ? <div className="absolute right-0 top-0 rounded-bl bg-amber-300 px-2 py-1 text-[10px] font-black text-amber-950">MASTERED</div> : <div className="absolute right-0 top-0 rounded-bl border-b border-l border-emerald-300/20 bg-slate-950/80 px-2 py-1 text-[10px] font-black text-emerald-100">FINAL: {guideFinalMonsterName}</div>}
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-200"><Shield size={21} /></div>
                        <div className="min-w-0">
                          <p className={`text-base font-black md:text-lg ${guideStatus.isComplete ? 'text-amber-100' : 'text-white'}`}>{isConversationCourse ? 'Conversation Basics / 会話の型練習' : 'Basic Training / 基礎練習'}</p>
                          <p className={`mt-1 text-xs font-bold ${guideStatus.isComplete ? 'text-amber-100/85' : 'text-slate-300'}`}>{isConversationCourse ? '相手のひと言と返答を見て、会話を丸ごと覚えます。' : 'スペルを見て入力。指の運動に最適！'}</p>
                        </div>
                      </div>
                      <div className={`mt-3 flex items-center gap-1 text-xs font-black ${guideStatus.isComplete ? 'text-amber-200' : 'text-emerald-200'}`}>
                        {guideStatus.isComplete ? <Crown size={14} /> : <Target size={14} />}
                        <span>{guideStatus.isComplete ? '免許皆伝！次のレベルへ！' : `NEXT: ${guideStatus.nextTargetName}`}</span>
                      </div>
                    </button>

                    <button onClick={() => startGame(gameState.selectedDifficulty, gameState.selectedLevel, 'challenge', 'voice-text')} className={`group relative w-full overflow-hidden rounded-lg border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(34,211,238,0.14)] ${easyStatus.isComplete ? 'border-amber-300 bg-amber-400/14 shadow-[0_0_0_1px_rgba(251,191,36,0.18)]' : 'border-cyan-300/25 bg-slate-900/52 hover:border-cyan-300/60 hover:bg-cyan-950/30'}`}>
                      {easyStatus.isComplete ? <div className="absolute right-0 top-0 rounded-bl bg-amber-300 px-2 py-1 text-[10px] font-black text-amber-950">MASTERED</div> : <div className="absolute right-0 top-0 rounded-bl border-b border-l border-cyan-300/20 bg-slate-950/80 px-2 py-1 text-[10px] font-black text-cyan-100">FINAL: {listeningFinalMonsterName}</div>}
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-cyan-400/15 text-cyan-200"><Volume2 size={21} /></div>
                        <div className="min-w-0">
                          <p className={`text-base font-black md:text-lg ${easyStatus.isComplete ? 'text-amber-100' : 'text-white'}`}>{isConversationCourse ? 'Reply Training / 聞いて返す練習' : 'Listening Training / リスニング練習'}</p>
                          <p className={`mt-1 text-xs font-bold ${easyStatus.isComplete ? 'text-amber-100/85' : 'text-slate-300'}`}>{isConversationCourse ? '相手の発言を聞き、日本語をヒントに英語で返します。' : '音声と日本語を見て練習。スペルは隠れます。'}</p>
                        </div>
                      </div>
                      <div className={`mt-3 flex items-center gap-1 text-xs font-black ${easyStatus.isComplete ? 'text-amber-200' : 'text-cyan-200'}`}>
                        {easyStatus.isComplete ? <Crown size={14} /> : <Target size={14} />}
                        <span>{easyStatus.isComplete ? '免許皆伝！次のレベルへ！' : `NEXT: ${easyStatus.nextTargetName}`}</span>
                      </div>
                    </button>
                  </div>
                </section>

                <section className="relative overflow-hidden rounded-lg border border-amber-400/25 bg-[linear-gradient(145deg,rgba(83,34,18,0.68),rgba(24,18,35,0.82))] p-4 shadow-[0_18px_42px_rgba(0,0,0,0.28)]">
                  {battleMascot && (
                    <div className="pointer-events-none absolute -right-5 -top-5 opacity-20 blur-[0.2px]">
                      <MonsterAvatar type={battleMascot.type} color={battleMascot.color} size={128} visualStyle={getMonsterVisualStyle(battleMascot)} />
                    </div>
                  )}
                  <div className="absolute right-0 top-0 rounded-bl-lg bg-red-500 px-3 py-1 text-[10px] font-black text-white shadow-lg">本番</div>
                  <div className="mb-4 flex items-center gap-3 border-b border-amber-300/20 pb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-amber-300/30 bg-amber-400/15 text-amber-200"><Sword size={24} /></div>
                    <div>
                      <h3 className="text-xl font-black text-amber-50">BATTLE ZONE</h3>
                      <p className="text-xs font-bold text-amber-200/75">実力を試そう！ゲームオーバーあり</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <button onClick={() => startGame(gameState.selectedDifficulty, gameState.selectedLevel, 'challenge', 'voice-only')} className={`group relative w-full overflow-hidden rounded-lg border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(251,146,60,0.16)] ${normalStatus.isComplete ? 'border-amber-300 bg-amber-400/14 shadow-[0_0_0_1px_rgba(251,191,36,0.18)]' : 'border-orange-300/28 bg-slate-900/52 hover:border-orange-300/70 hover:bg-orange-950/30'}`}>
                      {normalStatus.isComplete ? <div className="absolute right-0 top-0 rounded-bl bg-amber-300 px-2 py-1 text-[10px] font-black text-amber-950">MASTERED</div> : <div className="absolute right-0 top-0 rounded-bl border-b border-l border-orange-300/20 bg-slate-950/80 px-2 py-1 text-[10px] font-black text-orange-100">FINAL: {normalFinalMonsterName}</div>}
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-orange-400/15 text-orange-200"><Volume2 size={21} /></div>
                        <div className="min-w-0">
                          <p className={`text-base font-black md:text-lg ${normalStatus.isComplete ? 'text-amber-100' : 'text-white'}`}>{isConversationCourse ? 'Quick Reply Battle / 即答バトル' : 'Listening Battle / 音声バトル'}</p>
                          <p className={`mt-1 text-xs font-bold ${normalStatus.isComplete ? 'text-amber-100/85' : 'text-slate-300'}`}>{isConversationCourse ? '相手の音声だけを聞き、とっさに英語で返します。' : '音声だけを聞いて入力。耳を頼りに戦います。'}</p>
                        </div>
                      </div>
                      <div className={`mt-3 flex items-center gap-1 text-xs font-black ${normalStatus.isComplete ? 'text-amber-200' : 'text-orange-200'}`}>
                        {normalStatus.isComplete ? <Crown size={14} /> : <Target size={14} />}
                        <span>{normalStatus.isComplete ? '見事！次はTranslation Battle！' : `NEXT: ${normalStatus.nextTargetName}`}</span>
                      </div>
                    </button>

                    <button onClick={() => startGame(gameState.selectedDifficulty, gameState.selectedLevel, 'challenge', 'text-only')} className={`group relative w-full overflow-hidden rounded-lg border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(248,113,113,0.16)] ${hardStatus.isComplete ? 'border-amber-300 bg-amber-400/14 shadow-[0_0_0_1px_rgba(251,191,36,0.18)]' : 'border-red-300/35 bg-slate-900/52 hover:border-red-300/70 hover:bg-red-950/30'}`}>
                      {hardStatus.isComplete ? <div className="absolute right-0 top-0 rounded-bl bg-amber-300 px-2 py-1 text-[10px] font-black text-amber-950">MASTERED</div> : <div className="absolute right-0 top-0 rounded-bl border-b border-l border-red-300/20 bg-slate-950/80 px-2 py-1 text-[10px] font-black text-red-100">FINAL: {hardFinalMonsterName}</div>}
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-400/15 text-red-200"><Keyboard size={21} /></div>
                        <div className="min-w-0">
                          <p className={`text-base font-black md:text-lg ${hardStatus.isComplete ? 'text-amber-100' : 'text-white'}`}>{isConversationCourse ? 'Scene Battle / 場面バトル' : 'Translation Battle / 和訳バトル'}</p>
                          <p className={`mt-1 text-xs font-bold ${hardStatus.isComplete ? 'text-amber-100/85' : 'text-slate-300'}`}>{isConversationCourse ? '会話の場面と返したい意味から、英文を作ります。' : '和訳だけを見て入力。できればかなり実力派です。'}</p>
                        </div>
                      </div>
                      <div className={`mt-3 flex items-center gap-1 text-xs font-black ${hardStatus.isComplete ? 'text-amber-200' : 'text-red-200'}`}>
                        {hardStatus.isComplete ? <Crown size={14} /> : <Target size={14} />}
                        <span>{hardStatus.isComplete ? '伝説の英雄！おめでとう！' : `NEXT: ${hardStatus.nextTargetName}`}</span>
                      </div>
                    </button>
                  </div>
                </section>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <GameButton onClick={() => setGameState(prev => ({ ...prev, screen: 'title' }))} variant="outline" className="border-slate-600 bg-slate-900/70 text-slate-200 hover:border-slate-400 hover:bg-slate-800">
                  <Home size={18} /> ホームへ
                </GameButton>
                <GameButton onClick={() => setGameState(prev => ({ ...prev, screen: 'level-select' }))} variant="outline" className="border-cyan-500/45 bg-cyan-950/25 text-cyan-100 hover:border-cyan-300 hover:bg-cyan-900/30">
                  <LayoutGrid size={18} /> 教材を変える
                </GameButton>
                <GameButton onClick={() => setGameState(prev => ({ ...prev, screen: 'question-list' }))} variant="outline" className="border-amber-400/45 bg-amber-950/25 text-amber-100 hover:border-amber-300 hover:bg-amber-900/30">
                  <ClipboardList size={18} /> {isConversationCourse ? '表現リスト' : '単語リスト'}
                </GameButton>
              </div>
            </div>
          </div>
        </div>
      </ScreenContainer>
    );
  }

  if (gameState.screen === 'battle') {
    const actualMonsterId = gameState.challengeModeIndices[gameState.currentMonsterIndex] ?? 0;
    const currentMonster = gameState.currentMonsterList[actualMonsterId] ?? gameState.currentMonsterList[0];
    if (!currentMonster) {
      return (
        <ScreenContainer className="bg-slate-900">
          <div className="w-full max-w-xl p-6">
            <Box title="Battle Error" className="w-full">
              <div className="space-y-4 text-center">
                <p className="text-slate-300">バトルの初期化に失敗しました。モード選択へ戻ります。</p>
                <GameButton onClick={() => setGameState(prev => ({ ...prev, screen: 'mode-select' }))} variant="outline">戻る</GameButton>
              </div>
            </Box>
          </div>
        </ScreenContainer>
      );
    }
    const hpPercent = (gameState.monsterHp / gameState.maxMonsterHp) * 100;
    const isBoss = currentMonster.type === 'boss';
    const isConversationBattle = gameState.selectedDifficulty === 'Conversation';
    const showJapanese = gameState.inputMode !== 'voice-only';
    const previousQuestionExample = lastSolvedQuestion
      ? getQuestionExample(gameState.selectedDifficulty, gameState.selectedLevel, lastSolvedQuestion)
      : null;
    const previousQuestionGrammar = lastSolvedQuestion
      ? getQuestionGrammarPoint(gameState.selectedDifficulty, gameState.selectedLevel, lastSolvedQuestion)
      : null;
    const previousQuestionSynonyms = lastSolvedQuestion && !(['Eiken5', 'Eiken4', 'EikenPre1'].includes(gameState.selectedDifficulty) && gameState.selectedLevel === 3)
      ? getQuestionSynonyms(gameState.selectedDifficulty, gameState.selectedLevel, lastSolvedQuestion)
      : [];
    const showPreviousStudyCard = !!lastSolvedQuestion;
    const showGuide = gameState.mode === 'guide'; 
    const questionsLeft = gameState.maxQuestions - gameState.questionCount + 1;
    const remainingWeakCount = getScopedWeakQuestions(gameState.selectedDifficulty, gameState.selectedLevel).length;
    const bossIntroLabel = getBossIntroLabel(gameState.bossStage);
    const monsterEmotion = gameState.monsterHp <= 0 ? 'win' : flash ? 'damage' : 'normal';
    const comboLabel = getComboLabel(gameState.combo);
    const questionPresentation = getBattleQuestionPresentation(gameState.currentQuestion.text);
    const currentQuestionKey = getQuestionStatusKey(gameState.selectedDifficulty, gameState.selectedLevel, gameState.currentQuestion);
    const currentScopeKey = getReviewScopeKey(gameState.selectedDifficulty, gameState.selectedLevel);
    const isCurrentQuestionMarked = (markedQuestionKeysByScope[currentScopeKey] ?? []).includes(currentQuestionKey);
    const previousQuestionKey = lastSolvedQuestion
      ? getQuestionStatusKey(gameState.selectedDifficulty, gameState.selectedLevel, lastSolvedQuestion)
      : null;
    const isPreviousQuestionMarked = previousQuestionKey
      ? (markedQuestionKeysByScope[currentScopeKey] ?? []).includes(previousQuestionKey)
      : false;
    const monsterDialogue = getBattleBubbleDialogue(currentMonster, {
      isDefeated: gameState.monsterHp <= 0,
      isDamaged: flash,
      hpRate: hpPercent,
      combo: gameState.combo,
      missCount: gameState.missCount,
      seedKey: `${gameState.currentMonsterIndex}:${gameState.questionCount}:${gameState.monsterHp}:${gameState.combo}:${gameState.missCount}`,
    });

    return (
      <ScreenContainer className={`battle-screen ${isBoss ? "bg-red-950" : "bg-slate-900"}`}>
        <div className="mobile-landscape-notice pointer-events-none fixed inset-x-3 bottom-3 z-30 hidden items-center justify-center gap-2 rounded-xl border border-cyan-300/45 bg-slate-950/92 px-4 py-3 text-center text-sm font-black text-cyan-100 shadow-xl">
          <RotateCcw size={18} className="text-cyan-300" /> スマホでは縦向きにして遊ぼう
        </div>
        {showBossIntro && bossIntroLabel && (
          <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
            <div className="absolute inset-0 animate-[finalBossFlash_520ms_ease-out_forwards] bg-white" />
            <div className="absolute inset-0 flex items-center justify-center px-4">
              <div className="animate-[finalBossReveal_900ms_ease-out_forwards] rounded-2xl border border-red-400/60 bg-slate-950/78 px-8 py-5 text-center shadow-[0_0_40px_rgba(248,113,113,0.35)]">
                <p className="text-xs font-black tracking-[0.45em] text-red-200">WARNING</p>
                <p className="mt-3 text-3xl font-black tracking-[0.18em] text-white md:text-5xl">{bossIntroLabel}</p>
              </div>
            </div>
          </div>
        )}
        <div className="battle-topbar w-full bg-slate-900/80 border-b border-slate-700 p-2 z-20 flex justify-between items-center shadow-md">
             <GameButton
               size="sm"
               variant="ghost"
               onClick={() => {
                 soundEngine.stopBattleAmbience();
                 soundEngine.stopBattleMusic();
                 setGameState(prev => ({ ...prev, screen: 'title' }));
               }}
               className="text-slate-400 text-xs py-1"
             >
               <Home size={16} /> EXIT
             </GameButton>
             <div className="flex gap-4">
               {gameState.mode === 'weakness' && (
                 <div className="bg-orange-900/50 border border-orange-500/50 px-3 py-1 rounded-full text-orange-200 text-xs font-bold">
                   残り苦手語: {remainingWeakCount}
                 </div>
               )}
             </div>
        </div>
        <div className="battle-main w-full max-w-4xl mx-auto flex flex-col items-center justify-start mt-4 px-4 pb-20">
             <div className="battle-monster-area relative w-full flex flex-col items-center z-10 mb-4">
                {gameState.combo >= 3 && (
                   <div className="battle-combo mb-2 inline-flex items-center gap-2 rounded-full border border-yellow-400/50 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 px-4 py-1.5 text-sm font-black uppercase tracking-[0.2em] text-yellow-200 shadow-[0_0_20px_rgba(250,204,21,0.2)]">
                    <Flame size={16} className="text-yellow-300" />
                    {comboLabel} x{gameState.combo}
                  </div>
                )}
                <div className={`battle-dialogue transition-all duration-300 ${flash ? 'scale-110' : ''} mb-2`}><div className="inline-block bg-white text-slate-900 px-4 py-1.5 rounded-xl shadow-lg border-2 border-slate-200 font-bold relative text-xs">{monsterDialogue}<div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-b-2 border-r-2 border-slate-200"></div></div></div>
                <div className={`battle-avatar transition-transform duration-100 relative ${flash ? 'translate-x-2 -translate-y-2 brightness-150 saturate-150' : monsterShake ? 'animate-shake brightness-110' : 'animate-bounce-slow'}`}><MonsterAvatar type={currentMonster.type} color={currentMonster.color} emotion={monsterEmotion} size={140} visualStyle={getMonsterVisualStyle(currentMonster)} />{isBoss && <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded animate-pulse">BOSS</div>}</div>
                <div className="battle-hp w-64 mt-2 bg-slate-800/80 p-2 rounded-lg border border-slate-600"><div className="flex justify-between text-slate-300 text-[10px] font-bold mb-1 px-1"><span className="flex items-center gap-2">{currentMonster.name} <span className="bg-slate-700 px-1 rounded text-slate-400">Lv.{gameState.currentMonsterIndex + 1}</span></span><span>{gameState.monsterHp} / {gameState.maxMonsterHp}</span></div><div className="h-3 bg-slate-900 rounded-full overflow-hidden relative shadow-inner"><div className={`h-full transition-all duration-300 relative overflow-hidden ${hpPercent < 30 ? 'bg-red-600' : 'bg-green-500'}`} style={{ width: `${hpPercent}%` }}><div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent"></div></div></div></div>
            </div>
             <div className="battle-card w-full bg-slate-800/95 backdrop-blur border-4 border-slate-600 rounded-2xl shadow-xl p-4 md:p-5 mt-4 relative">
                 <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-slate-600 shadow-inner"></div><div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-slate-600 shadow-inner"></div><div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-slate-600 shadow-inner"></div><div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-slate-600 shadow-inner"></div>
                 <div className="battle-controls mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                   <div className="flex flex-wrap items-center gap-2">
                     <button
                       type="button"
                       onClick={() => {
                         speakCurrentQuestion();
                         inputRef.current?.focus();
                       }}
                       title="音声をもう一度再生 (Right Ctrl)"
                       aria-label="音声をもう一度再生"
                        className="battle-replay inline-flex items-center gap-2 rounded-xl border border-blue-400/40 bg-blue-500/10 px-4 py-2.5 text-sm font-black text-blue-100 shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all hover:border-blue-300 hover:bg-blue-500/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                     >
                       <Volume2 size={20} />
                       <span>もう一回聞く</span>
                     </button>
                      <div className="battle-shortcut inline-flex items-center gap-2 rounded-full border border-slate-600 bg-slate-900/80 px-3 py-1.5 text-[11px] font-bold text-slate-200">
                       <span className="text-slate-400">音声:</span>
                       <span>ボタン / Right Ctrl</span>
                     </div>
                   </div>
                   <div className="battle-action-buttons flex w-full flex-wrap gap-2 sm:w-auto sm:flex-nowrap sm:justify-end">
                   <div role="status" aria-live="polite" className="battle-remaining inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-xl border border-red-400/45 bg-red-950/30 px-4 py-2.5 text-sm font-black text-red-100 shadow-[0_0_18px_rgba(248,113,113,0.1)] sm:flex-none">
                     あと <span className="ml-1 text-base text-white">{questionsLeft}問</span>
                   </div>
                   <button
                     type="button"
                     onClick={() => {
                       toggleMarkedQuestion(gameState.selectedDifficulty, gameState.selectedLevel, gameState.currentQuestion);
                       inputRef.current?.focus();
                     }}
                     title={isCurrentQuestionMarked ? '復習リストから外す' : 'この用語をあとで復習する'}
                     aria-pressed={isCurrentQuestionMarked}
                      className={`battle-bookmark inline-flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-200 sm:flex-none ${isCurrentQuestionMarked ? 'border-yellow-300 bg-yellow-500/20 text-yellow-100 shadow-[0_0_24px_rgba(250,204,21,0.18)] hover:bg-yellow-500/30' : 'border-yellow-400/40 bg-yellow-950/20 text-yellow-100 hover:border-yellow-300 hover:bg-yellow-500/15'}`}
                   >
                     <Bookmark size={18} fill={isCurrentQuestionMarked ? 'currentColor' : 'none'} />
                     <span>{isCurrentQuestionMarked ? '復習に追加済み' : 'あとで復習'}</span>
                   </button>
                   <button
                     type="button"
                     onClick={handleSkip}
                     title="この問題をスキップ"
                     aria-label="この問題をスキップ"
                      className="battle-skip inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-amber-300/50 bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-black uppercase tracking-[0.18em] text-white shadow-[0_10px_30px_rgba(249,115,22,0.28)] transition-all hover:scale-[1.02] hover:from-amber-400 hover:to-orange-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 sm:flex-none"
                   >
                     <SkipForward size={18} />
                     <span>Skip</span>
                   </button>
                   </div>
                 </div>
                 <div className="battle-translation text-center mb-2 min-h-[24px]">
                   {isConversationBattle ? (
                     <div className="mx-auto max-w-3xl space-y-2">
                       {gameState.inputMode === 'voice-only' ? (
                         <p className="text-base font-black text-cyan-200 md:text-lg">相手のひと言を聞いて、英語で返そう</p>
                       ) : (
                         <div className="rounded-xl border border-violet-400/30 bg-violet-950/25 px-4 py-3 text-left">
                           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-300">Partner / 相手</p>
                           <p className="mt-1 text-lg font-black text-white md:text-xl">{gameState.currentQuestion.promptEn}</p>
                           {gameState.currentQuestion.promptJa && <p className="mt-1 text-xs font-bold text-violet-200/80">{gameState.currentQuestion.promptJa}</p>}
                         </div>
                       )}
                       {showJapanese && (
                         <div className="text-left">
                           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">You / あなたの返答</p>
                           <p className="mt-1 text-base font-bold text-blue-200 md:text-lg">{gameState.currentQuestion.translation}</p>
                           {showGuide && gameState.currentQuestion.speakingTip && <p className="mt-1 text-xs font-bold text-amber-200">💡 {gameState.currentQuestion.speakingTip}</p>}
                         </div>
                       )}
                     </div>
                   ) : showJapanese && (
                     <div>
                       <p className="text-blue-300 text-lg md:text-xl font-bold drop-shadow-md">{gameState.currentQuestion.translation}</p>
                       {gameState.currentQuestion.basicMeaning && (
                         <p className="mt-1 text-[11px] font-medium text-slate-400 md:text-xs">
                           Basic: {gameState.currentQuestion.basicMeaning}
                         </p>
                       )}
                     </div>
                   )}
                 </div>
                 <div
                   className={`battle-question-panel relative bg-black/40 rounded-xl border border-slate-700 shadow-inner ${questionPresentation.panelClass}`}
                   onClick={() => inputRef.current?.focus()}
                 >
                    <div className={`battle-question-text ${questionPresentation.textClass} ${questionPresentation.minHeightClass} font-mono text-center pointer-events-none select-none tracking-[0.08em] text-slate-600 relative z-20 flex flex-wrap items-center justify-center content-center gap-y-1 break-words px-3 md:px-4`}>
                        {gameState.currentQuestion.text.split('').map((char, index) => {
                            const isTyped = index < gameState.userInput.length;
                            const isCurrent = index === gameState.userInput.length;
                            const isHint = !isTyped && (index < gameState.userInput.length + gameState.hintLength);
                            const isAlwaysVisible = showGuide;
                            let className = "inline-block min-w-[0.56em] transition-colors duration-100 ";
                            if (isTyped) { className += "text-blue-400 drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]"; } else if (isCurrent) { className += "text-white border-b-4 border-yellow-400 animate-pulse pb-1"; if (char === ' ') className += " bg-yellow-500/30"; } else if (isHint) { className += "text-slate-400/80"; } else if (isAlwaysVisible) { className += "text-slate-300"; } else { className += "opacity-0"; }
                            return <span key={index} className={className}>{(!isTyped && !isHint && !isAlwaysVisible && isCurrent) ? '_' : (char === ' ' ? '\u00A0' : char)}</span>;
                        })}
                    </div>
                    <input ref={inputRef} type="text" value={gameState.userInput} onChange={handleInput} className="battle-input w-full h-full opacity-0 absolute inset-0 cursor-default z-10" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoFocus />
                 </div>
                 {showPreviousStudyCard && lastSolvedQuestion && (
                    <div className="battle-previous-study mx-auto mt-3 max-w-3xl rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-3 py-2 shadow-[0_0_20px_rgba(16,185,129,0.12)]">
                     <div className="flex flex-wrap items-center justify-start gap-x-2 gap-y-1 text-left leading-snug">
                       <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                         Previous
                       </span>
                       <span className="font-mono text-lg font-bold text-white md:text-xl">{lastSolvedQuestion.text}</span>
                       <div className="flex flex-col">
                         {isConversationBattle && lastSolvedQuestion.promptEn && (
                           <span className="text-xs font-bold text-violet-200 md:text-sm">相手: {lastSolvedQuestion.promptEn}</span>
                         )}
                         <span className="text-base font-bold text-emerald-100 md:text-lg">{lastSolvedQuestion.translation}</span>
                         {lastSolvedQuestion.basicMeaning && (
                           <span className="text-xs font-medium text-slate-400 md:text-sm">Basic: {lastSolvedQuestion.basicMeaning}</span>
                         )}
                       </div>
                       {isConversationBattle && (
                         <button
                           type="button"
                           onClick={() => {
                             speakWithSettings(lastSolvedQuestion.text);
                             inputRef.current?.focus();
                           }}
                           className="inline-flex items-center gap-1 rounded-full border border-cyan-300/40 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-bold text-cyan-100 transition-colors hover:bg-cyan-500/20"
                         >
                           <Volume2 size={13} /> 返答を聞いて声に出す
                         </button>
                       )}
                       <button
                         type="button"
                         onClick={() => {
                           toggleMarkedQuestion(gameState.selectedDifficulty, gameState.selectedLevel, lastSolvedQuestion);
                           inputRef.current?.focus();
                         }}
                         title={isPreviousQuestionMarked ? '復習リストから外す' : 'この用語をあとで復習する'}
                         aria-pressed={isPreviousQuestionMarked}
                         className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-200 ${isPreviousQuestionMarked ? 'border-yellow-300 bg-yellow-500/20 text-yellow-100 shadow-[0_0_18px_rgba(250,204,21,0.18)] hover:bg-yellow-500/30' : 'border-yellow-400/40 bg-yellow-950/20 text-yellow-100 hover:border-yellow-300 hover:bg-yellow-500/15'}`}
                       >
                         <Bookmark size={13} fill={isPreviousQuestionMarked ? 'currentColor' : 'none'} />
                         <span>{isPreviousQuestionMarked ? '復習に追加済み' : 'あとで復習'}</span>
                       </button>
                       {previousQuestionSynonyms.length > 0 && (
                         <>
                           <span className="hidden text-slate-500 md:inline">|</span>
                           <span className="text-[10px] font-bold tracking-[0.16em] text-cyan-300">類義/関連</span>
                           <span className="text-sm font-semibold text-cyan-50 md:text-base">{previousQuestionSynonyms.join(' / ')}</span>
                         </>
                       )}
                       {previousQuestionExample && (
                         <>
                           <span className="hidden text-slate-500 md:inline">|</span>
                           <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Example</span>
                           <span className="text-base text-slate-200 md:text-lg">{previousQuestionExample}</span>
                         </>
                       )}
                       {isConversationBattle && lastSolvedQuestion.speakingTip && (
                         <>
                           <span className="hidden text-slate-500 md:inline">|</span>
                           <span className="text-[10px] font-bold tracking-[0.16em] text-amber-300">SPEAKING TIP</span>
                           <span className="text-xs font-semibold text-amber-50 md:text-sm">{lastSolvedQuestion.speakingTip}</span>
                         </>
                       )}
                       {previousQuestionGrammar && (
                         <>
                           <span className="hidden text-slate-500 md:inline">|</span>
                           <span className="rounded-full border border-amber-300/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-black text-amber-200">
                             文法・{previousQuestionGrammar.label}
                           </span>
                           <span className="text-xs font-bold text-amber-50 md:text-sm">{previousQuestionGrammar.note}</span>
                           <span className="font-mono text-xs text-amber-200/90">型: {previousQuestionGrammar.pattern}</span>
                         </>
                       )}
                     </div>
                   </div>
                 )}
            </div>
              <div className="battle-footer-label mt-2 text-center"><span className="text-slate-500 text-[10px] uppercase tracking-widest border border-slate-700 px-2 py-0.5 rounded bg-slate-900">Type the spell to attack</span></div>
        </div>
              <style>{`@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } } .animate-shake { animation: shake 0.3s ease-in-out; } .animate-bounce-slow { animation: bounce 2s infinite; } @keyframes finalBossFlash { 0% { opacity: 0; } 12% { opacity: 0.96; } 100% { opacity: 0; } } @keyframes finalBossReveal { 0% { opacity: 0; transform: scale(0.88); } 18% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(1.04); } }
                @media (max-width: 960px) and (orientation: landscape) { .battle-screen .mobile-landscape-notice { display: flex; top: 0.75rem; bottom: auto; } }
                @media (min-width: 961px) and (max-width: 1366px) and (orientation: landscape) {
                  .battle-screen .battle-main { margin-top: 0.35rem; padding: 0 0.75rem 1rem; }
                  .battle-screen .battle-monster-area { margin-bottom: 0.35rem; }
                  .battle-screen .battle-combo { display: none; }
                  .battle-screen .battle-dialogue { display: block; position: absolute; top: 0.25rem; left: calc(50% + 3.5rem); z-index: 20; max-width: min(17rem, calc(50vw - 4.5rem)); margin: 0; }
                  .battle-screen .battle-dialogue > div { padding: 0.4rem 0.6rem; font-size: 10px; line-height: 1.35; }
                  .battle-screen .battle-dialogue > div > div { left: 1.25rem; transform: rotate(45deg); }
                  .battle-screen .battle-avatar { transform: scale(0.72); transform-origin: center; height: 104px; margin: -18px 0 -14px; }
                  .battle-screen .battle-hp { width: 220px; margin-top: 0; padding: 0.4rem; }
                  .battle-screen .battle-hp .h-3 { height: 0.5rem; }
                  .battle-screen .battle-card { margin-top: 0.4rem; padding: 0.75rem; }
                  .battle-screen .battle-controls { margin-bottom: 0.45rem; gap: 0.45rem; }
                  .battle-screen .battle-replay, .battle-screen .battle-bookmark, .battle-screen .battle-skip { padding-top: 0.5rem; padding-bottom: 0.5rem; }
                  .battle-screen .battle-translation { min-height: 0; margin-bottom: 0.25rem; }
                  .battle-screen .battle-question-panel { padding: 0.5rem 0.75rem; }
                  .battle-screen .battle-question-text { min-height: 2.3em !important; }
                  .battle-screen .battle-previous-study { margin-top: 0.5rem; padding: 0.4rem 0.65rem; }
                  .battle-screen .battle-footer-label { display: none; }
                }`}</style>
      </ScreenContainer>
    );
  }

  if (gameState.screen === 'result') {
    const isWin = gameState.battleResult === 'win';
    const learningSummary = getScopedLearningSummary(gameState.selectedDifficulty, gameState.selectedLevel);
    const actualMonsterId = gameState.challengeModeIndices[gameState.currentMonsterIndex];
    const defeatedMonster = gameState.currentMonsterList[actualMonsterId];
    const remainingHpToWin = isWin ? 0 : Math.max(gameState.monsterHp, 0);
    const missedCount = gameState.currentBattleMissedQuestions.length;
    const perfectCount = gameState.battleLog.filter(log => !log.skipped && log.missCount === 0).length;
    const recoveredCount = gameState.battleLog.filter(log => !log.skipped && log.missCount > 0).length;
    const skippedCount = gameState.battleLog.filter(log => log.skipped).length;
    const answeredCount = gameState.battleLog.length - skippedCount;
    const perfectRate = answeredCount > 0 ? Math.round((perfectCount / answeredCount) * 100) : 0;
    // Advance while the current step is still within the generated stage length.
    const isNextAvailable = gameState.currentMonsterIndex < gameState.totalMonstersInStage - 1;
    const nextMonsterIsFinal = gameState.currentMonsterIndex === gameState.totalMonstersInStage - 2;
    
    const handleNextMonster = () => initBattle(gameState.selectedDifficulty, gameState.selectedLevel, gameState.mode, gameState.inputMode, gameState.currentMonsterIndex + 1, gameState.challengeModeIndices, gameState.currentMonsterList, gameState.totalMonstersInStage, gameState.score, gameState.totalKeystrokes);
    const handleRetry = () => initBattle(gameState.selectedDifficulty, gameState.selectedLevel, gameState.mode, gameState.inputMode, gameState.currentMonsterIndex, gameState.challengeModeIndices, gameState.currentMonsterList, gameState.totalMonstersInStage, gameState.battleStartScore, gameState.battleStartKeystrokes);
    const handleBackToMode = () => {
      soundEngine.stopBattleAmbience();
      soundEngine.stopBattleMusic();
      setGameState(prev => ({ ...prev, screen: 'mode-select' }));
    };
    const handleBackToLevel = () => {
      soundEngine.stopBattleAmbience();
      soundEngine.stopBattleMusic();
      setGameState(prev => ({ ...prev, screen: 'level-select' }));
    };
    const handleBackToTitle = () => {
      soundEngine.stopBattleAmbience();
      soundEngine.stopBattleMusic();
      setGameState(prev => ({ ...prev, screen: 'title' }));
    };
    const handleOpenWeakList = () => {
      setQuestionListFilter('weak');
      setGameState(prev => ({ ...prev, screen: 'question-list' }));
    };
    const handleStartWeaknessFromResult = () => openWeakReviewHub();
    const handleStartBattleReview = () => startGame(gameState.selectedDifficulty, gameState.selectedLevel, 'weakness', 'text-only', gameState.currentBattleMissedQuestions);

    // Desktop result layout: every result and every action remains visible in two columns.
    return (
      <ScreenContainer className="items-center justify-center p-4">
        <Box className="w-full max-w-6xl border-2 border-yellow-600/50 bg-slate-800 p-4 md:p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(340px,0.85fr)_minmax(0,1.35fr)]">
            <main className="min-w-0 lg:order-2">
              <header className="flex items-center gap-4 rounded-xl border border-yellow-400/35 bg-gradient-to-r from-yellow-950/30 to-slate-900/55 p-4">
                {isWin ? <Trophy size={48} className="flex-shrink-0 text-yellow-400" /> : <Zap size={48} className="flex-shrink-0 text-slate-500" />}
                {isWin && defeatedMonster && <MonsterAvatar type={defeatedMonster.type} color={defeatedMonster.color} emotion="win" size={76} visualStyle={getMonsterVisualStyle(defeatedMonster)} />}
                <div className="min-w-0"><p className={`text-2xl font-black ${isWin ? 'text-yellow-300' : 'text-slate-400'}`}>{isWin ? 'CLEAR!' : 'おしい！'}</p><p className="mt-1 break-words text-lg font-black text-white">{isWin ? defeatedMonster?.name : `あと ${remainingHpToWin} HP`}</p><p className="mt-1 text-xs font-bold text-slate-400">今回の問題と例文を確認しよう</p></div>
              </header>

              <section className="mt-4 overflow-hidden rounded-xl border border-slate-600 bg-slate-950/35">
                <div className="flex items-center justify-between border-b border-slate-600 bg-slate-900/70 px-4 py-3"><h3 className="font-black text-white">今回の問題と結果</h3><span className="text-xs font-bold text-slate-400">{gameState.battleLog.length}問</span></div>
                <div className="divide-y divide-slate-700">
                  {gameState.battleLog.map((log, idx) => {
                    const example = getQuestionExample(gameState.selectedDifficulty, gameState.selectedLevel, log.question);
                    const grammarPoint = getQuestionGrammarPoint(gameState.selectedDifficulty, gameState.selectedLevel, log.question);
                    const resultLabel = log.skipped ? 'スキップ' : log.missCount === 0 ? '正確' : `ミス ${log.missCount}`;
                    const resultClass = log.skipped ? 'text-slate-400' : log.missCount === 0 ? 'text-emerald-300' : 'text-yellow-300';
                    return <div key={idx} className="grid gap-x-3 gap-y-1 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                      <div className="flex min-w-0 items-start gap-2"><button type="button" onClick={() => speakWithSettings(log.question.text)} aria-label={`${log.question.text} を音声で再生`} title="音声を再生" className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-300 transition-colors hover:bg-blue-600 hover:text-white"><Volume2 size={16} /></button><div className="min-w-0"><span className="font-mono text-base font-black text-cyan-100">{log.question.text}</span><span className="ml-2 text-sm font-bold text-slate-300">{log.question.translation}</span>{example && <p className="mt-1 text-sm leading-relaxed text-slate-400"><span className="mr-2 font-black text-emerald-300">例文</span>{example}</p>}{grammarPoint && <p className="mt-1 text-xs leading-relaxed text-amber-50"><span className="mr-2 font-black text-amber-300">文法・{grammarPoint.label}</span>{grammarPoint.note}<span className="ml-2 font-mono text-amber-200/90">型: {grammarPoint.pattern}</span></p>}</div></div>
                      <span className={`self-start text-sm font-black ${resultClass}`}>{resultLabel}</span>
                    </div>;
                  })}
                </div>
              </section>
            </main>

            <aside className="space-y-3 lg:order-1">
              <section className="overflow-hidden rounded-xl border border-slate-600 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(30,41,59,0.82))] p-3 shadow-[0_12px_28px_rgba(0,0,0,0.16)]">
                <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-black text-white">今回の成績</p><p className="mt-0.5 text-[11px] font-bold text-slate-400">{gameState.battleLog.length}問のバトル結果</p></div><div className="rounded-lg border border-cyan-300/30 bg-cyan-500/10 px-3 py-1.5 text-right"><p className="text-[10px] font-bold text-cyan-200">正確さ</p><p className="text-3xl font-black leading-none text-cyan-100">{perfectRate}%</p></div></div>
                <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-lg border border-slate-700/80 bg-slate-950/35"><div className="p-2 text-center"><p className="text-[10px] font-bold text-emerald-300">正確</p><p className="mt-0.5 text-2xl font-black text-white">{perfectCount}<span className="ml-0.5 text-xs text-slate-400">問</span></p></div><div className="border-x border-slate-700/80 p-2 text-center"><p className="text-[10px] font-bold text-amber-300">修正</p><p className="mt-0.5 text-2xl font-black text-white">{recoveredCount}<span className="ml-0.5 text-xs text-slate-400">問</span></p></div><div className="p-2 text-center"><p className="text-[10px] font-bold text-slate-400">スキップ</p><p className="mt-0.5 text-2xl font-black text-white">{skippedCount}<span className="ml-0.5 text-xs text-slate-400">問</span></p></div></div>
              </section>

              <section className="rounded-xl border border-cyan-500/25 bg-[linear-gradient(135deg,rgba(8,47,73,0.26),rgba(15,23,42,0.72))] p-3"><div className="flex items-end justify-between gap-3"><div><p className="text-sm font-black text-white">学習の積み上げ</p><p className="mt-0.5 text-[11px] font-bold text-slate-400">これまでに取り組んだ単語</p></div><p className="text-lg font-black text-cyan-100">{learningSummary.learningCount + learningSummary.cautionCount + learningSummary.masteredCount}<span className="ml-1 text-xs text-cyan-200">語</span></p></div><div className="mt-3 grid grid-cols-3 gap-2"><div className="rounded-lg bg-sky-950/35 p-2 text-center"><p className="text-[10px] font-bold text-sky-300">学習中</p><p className="mt-0.5 text-xl font-black text-white">{learningSummary.learningCount}</p></div><div className="rounded-lg bg-emerald-950/30 p-2 text-center"><p className="text-[10px] font-bold text-emerald-300">もう少し</p><p className="mt-0.5 text-xl font-black text-white">{learningSummary.cautionCount}</p></div><div className="rounded-lg bg-violet-950/30 p-2 text-center"><p className="text-[10px] font-bold text-violet-300">覚えた</p><p className="mt-0.5 text-xl font-black text-white">{learningSummary.masteredCount}</p></div></div></section>

              {isWin ? (isNextAvailable ? <GameButton onClick={handleNextMonster} className="w-full min-h-[62px] text-lg" variant="success" autoFocus><span className="flex flex-col items-center leading-tight"><span className="flex items-center">{nextMonsterIsFinal ? 'ラスボスのモンスターへ' : 'つぎのモンスターへ'} <ArrowRight className="ml-2" size={22}/></span><span className="mt-1 text-[11px] font-black text-emerald-50/90"><kbd className="rounded border border-emerald-100/45 bg-emerald-950/25 px-1.5 py-0.5 font-sans">Enter</kbd> でも進める</span></span></GameButton> : <GameButton onClick={handleBackToMode} className="w-full min-h-[62px] text-lg" variant="primary" autoFocus>コース選択へ戻る</GameButton>) : <GameButton onClick={handleRetry} className="w-full min-h-[62px] text-lg" variant="warning" autoFocus>もう一度挑戦する <RotateCcw className="ml-2" size={22}/></GameButton>}

              <section className="rounded-xl border border-slate-600 bg-slate-950/35 p-2"><p className="px-1 pb-2 text-xs font-black text-slate-200">移動・メニュー</p><div className="grid grid-cols-2 gap-2"><GameButton onClick={handleBackToMode} size="sm" variant="outline">コースをえらぶ</GameButton><GameButton onClick={handleBackToLevel} size="sm" variant="outline">レベルをえらぶ</GameButton><GameButton onClick={handleBackToTitle} size="sm" variant="outline">ホームへ</GameButton><GameButton onClick={() => setGameState(prev => ({ ...prev, screen: 'monster-book' }))} size="sm" variant="outline"><BookOpen size={16} className="mr-2" /> 図鑑</GameButton></div></section>

              <section className="rounded-xl border border-orange-500/30 bg-orange-950/20 p-3"><p className="mb-2 text-sm font-black text-orange-200">今回の苦手登録: {missedCount}語</p><div className="grid gap-2"><GameButton onClick={handleOpenWeakList} size="sm" variant="outline">苦手だけ見る</GameButton><GameButton onClick={handleStartBattleReview} size="sm" variant="outline" className="border-emerald-500/40 text-emerald-200">今回のミスだけ復習</GameButton><GameButton onClick={handleStartWeaknessFromResult} size="sm" className="bg-orange-600 border-orange-400 text-white hover:bg-orange-500">苦手復習へ</GameButton></div></section>
            </aside>
          </div>
        </Box>
      </ScreenContainer>
    );

    // Compact result sheet: the battle result and learning material are readable without scanning cards.
    return (
      <ScreenContainer className="items-center justify-center p-4">
        <Box className="w-full max-w-3xl border border-yellow-500/45 bg-slate-800 p-4 text-left md:p-5">
          <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-600 pb-3">
            {isWin ? <Trophy size={38} className="text-yellow-400" /> : <Zap size={38} className="text-slate-500" />}
            {isWin && defeatedMonster && <MonsterAvatar type={defeatedMonster.type} color={defeatedMonster.color} emotion="win" size={58} visualStyle={getMonsterVisualStyle(defeatedMonster)} />}
            <div className="min-w-[150px] flex-1"><p className={`text-2xl font-black ${isWin ? 'text-yellow-300' : 'text-slate-400'}`}>{isWin ? 'CLEAR!' : 'おしい！'}</p><p className="text-sm font-bold text-white">{isWin ? defeatedMonster?.name : `あと ${remainingHpToWin} HP`}</p></div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-bold"><span className="text-emerald-300">正確 {perfectCount}</span><span className="text-yellow-300">修正 {recoveredCount}</span><span className="text-slate-300">スキップ {skippedCount}</span><span className="text-cyan-200">正確さ {perfectRate}%</span></div>
          </header>

          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
            {isWin ? (isNextAvailable ? <GameButton onClick={handleNextMonster} className="min-h-[54px] text-base" variant="success" autoFocus>つぎのモンスターへ <ArrowRight className="ml-2" size={20}/></GameButton> : <GameButton onClick={handleBackToMode} className="min-h-[54px] text-base" variant="primary" autoFocus>コース選択へ戻る</GameButton>) : <GameButton onClick={handleRetry} className="min-h-[54px] text-base" variant="warning" autoFocus>もう一度挑戦する <RotateCcw className="ml-2" size={20}/></GameButton>}
            {missedCount > 0 && <GameButton onClick={handleStartBattleReview} className="border-orange-400 bg-orange-600 text-white hover:bg-orange-500" size="md"><RotateCcw size={17}/> ミス {missedCount}語を復習</GameButton>}
          </div>

          <section className="mt-4 overflow-hidden rounded-xl border border-slate-600 bg-slate-950/35">
            <div className="flex items-center justify-between border-b border-slate-600 bg-slate-900/70 px-3 py-2"><h3 className="font-black text-white">今回の問題と結果</h3><span className="text-xs font-bold text-slate-400">{gameState.battleLog.length}問</span></div>
            <div className="divide-y divide-slate-700">
              {gameState.battleLog.map((log, idx) => {
                const example = getQuestionExample(gameState.selectedDifficulty, gameState.selectedLevel, log.question);
                const resultLabel = log.skipped ? 'スキップ' : log.missCount === 0 ? '正確' : `ミス ${log.missCount}`;
                const resultClass = log.skipped ? 'text-slate-400' : log.missCount === 0 ? 'text-emerald-300' : 'text-yellow-300';
                return <div key={idx} className="grid gap-x-3 gap-y-1 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="min-w-0"><span className="font-mono font-black text-cyan-100">{log.question.text}</span><span className="ml-2 text-sm font-bold text-slate-300">{log.question.translation}</span>{example && <p className="mt-1 text-xs text-slate-400"><span className="mr-1 font-bold text-emerald-300">例文</span>{example}</p>}</div>
                  <span className={`self-start text-sm font-black ${resultClass}`}>{resultLabel}</span>
                </div>;
              })}
            </div>
            {gameState.battleLog.length > 6 && <p className="border-t border-slate-700 px-3 py-2 text-xs font-bold text-slate-400">最初の6問を表示しています。残りは単語リストから確認できます。</p>}
          </section>

          <footer className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-600 pt-3 text-sm font-bold"><span className="text-slate-300">学習中 {learningSummary.learningCount} ・ もう少し {learningSummary.cautionCount} ・ 覚えた {learningSummary.masteredCount}</span><div className="flex gap-2"><GameButton onClick={handleOpenWeakList} size="sm" variant="outline">苦手だけ見る</GameButton><GameButton onClick={handleBackToMode} size="sm" variant="ghost">コースをえらぶ</GameButton><GameButton onClick={handleBackToTitle} size="sm" variant="ghost">ホームへ</GameButton></div></footer>
        </Box>
      </ScreenContainer>
    );

    // Result screen: show the immediate result, learning state, and next action at a glance.
    return (
      <ScreenContainer className="items-center justify-center p-4">
        <Box className="w-full max-w-4xl border-2 border-yellow-600/50 bg-slate-800 p-4 text-center md:p-5">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="flex items-center gap-4 rounded-2xl border border-yellow-400/35 bg-gradient-to-r from-yellow-950/30 to-slate-900/55 p-4 text-left">
              {isWin ? <Trophy size={48} className="flex-shrink-0 text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.55)]" /> : <Zap size={48} className="flex-shrink-0 text-slate-500" />}
              {isWin && defeatedMonster && <MonsterAvatar type={defeatedMonster.type} color={defeatedMonster.color} emotion="win" size={76} visualStyle={getMonsterVisualStyle(defeatedMonster)} />}
              <div className="min-w-0">
                <p className={`text-2xl font-black ${isWin ? 'text-yellow-300' : 'text-slate-400'}`}>{isWin ? 'CLEAR!' : 'おしい！'}</p>
                {isWin && defeatedMonster ? <><p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-yellow-300">Defeated</p><p className="truncate text-lg font-black text-white">{defeatedMonster.name}</p></> : <><p className="mt-1 text-sm text-slate-300">あと {remainingHpToWin} HP でクリア</p><p className="text-xs text-slate-400">もう一度挑戦してみよう</p></>}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="rounded-xl border border-emerald-400/30 bg-emerald-950/20 p-3"><p className="text-[10px] font-bold text-emerald-300">PERFECT</p><p className="mt-1 text-2xl font-black text-white">{perfectCount}</p></div>
              <div className="rounded-xl border border-yellow-400/30 bg-yellow-950/20 p-3"><p className="text-[10px] font-bold text-yellow-300">RECOVERED</p><p className="mt-1 text-2xl font-black text-white">{recoveredCount}</p></div>
              <div className="rounded-xl border border-slate-500/30 bg-slate-900/40 p-3"><p className="text-[10px] font-bold text-slate-400">SKIP</p><p className="mt-1 text-2xl font-black text-white">{skippedCount}</p></div>
              <div className="rounded-xl border border-cyan-400/30 bg-cyan-950/20 p-3"><p className="text-[10px] font-bold text-cyan-300">ACCURACY</p><p className="mt-1 text-2xl font-black text-white">{perfectRate}%</p></div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1.35fr_0.65fr]">
            {isWin ? (
              isNextAvailable ? <GameButton onClick={handleNextMonster} className="min-h-[64px] text-lg" variant="success" autoFocus>{nextMonsterIsFinal ? 'ラスボスのモンスターへ' : 'つぎのモンスターへ'} <ArrowRight className="ml-2" size={22}/></GameButton>
                : <GameButton onClick={handleBackToMode} className="min-h-[64px] text-lg" variant="primary" autoFocus>コース選択へ戻る <LayoutGrid className="ml-2" size={22}/></GameButton>
            ) : <GameButton onClick={handleRetry} className="min-h-[64px] text-lg" variant="warning" autoFocus>もう一度挑戦する <RotateCcw className="ml-2" size={22}/></GameButton>}
            {missedCount > 0 ? <GameButton onClick={handleStartBattleReview} className="min-h-[64px] border-orange-400 bg-orange-600 text-white hover:bg-orange-500" size="lg"><RotateCcw size={20} /> ミスした {missedCount}語を復習</GameButton>
              : <div className="flex min-h-[64px] items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-950/20 px-4 font-bold text-emerald-200">ミスなし！ この調子</div>}
          </div>

          <section className="mt-4 rounded-2xl border border-slate-600 bg-slate-950/45 p-3 text-left">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-black text-white">今回の問題と結果</h3>
              <span className="text-xs font-bold text-slate-400">{gameState.battleLog.length}問</span>
            </div>
            <div className="grid gap-2 lg:grid-cols-3">
              {gameState.battleLog.map((log, idx) => {
                const example = getQuestionExample(gameState.selectedDifficulty, gameState.selectedLevel, log.question);
                const resultLabel = log.skipped ? 'スキップ' : log.missCount === 0 ? '正確' : `ミス ${log.missCount}`;
                const resultClass = log.skipped ? 'text-slate-400' : log.missCount === 0 ? 'text-emerald-300' : 'text-yellow-300';
                return <div key={idx} className="rounded-xl border border-slate-700 bg-slate-800/90 p-3">
                  <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="break-words font-mono text-sm font-black text-cyan-100">{log.question.text}</p><p className="mt-0.5 text-xs font-bold text-slate-300">{log.question.translation}</p></div><span className={`flex-shrink-0 text-xs font-black ${resultClass}`}>{resultLabel}</span></div>
                  {example && <p className="mt-2 border-t border-slate-700 pt-2 text-xs leading-relaxed text-slate-300"><span className="mr-1 font-black text-emerald-300">例文:</span>{example}</p>}
                </div>;
              })}
            </div>
            {gameState.battleLog.length > 6 && <details className="mt-2 rounded-lg border border-slate-700 bg-slate-900/60"><summary className="cursor-pointer list-none px-3 py-2 text-xs font-bold text-slate-300 marker:content-none"><span className="mr-2 text-slate-500">＋</span>残り {gameState.battleLog.length - 6}問を見る</summary><div className="border-t border-slate-700 px-3 py-2 text-xs text-slate-300">残りの問題は、単語リストからも確認できます。</div></details>}
          </section>

          <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-cyan-500/20 bg-slate-950/45 p-3">
            <div><p className="text-[10px] font-bold text-sky-300">学習中</p><p className="mt-1 text-xl font-black text-white">{learningSummary.learningCount}</p></div>
            <div className="border-x border-slate-700"><p className="text-[10px] font-bold text-emerald-300">もう少し</p><p className="mt-1 text-xl font-black text-white">{learningSummary.cautionCount}</p></div>
            <div><p className="text-[10px] font-bold text-violet-300">覚えた</p><p className="mt-1 text-xl font-black text-white">{learningSummary.masteredCount}</p></div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <GameButton onClick={handleOpenWeakList} size="sm" variant="outline">苦手だけ見る</GameButton>
            <GameButton onClick={handleBackToMode} size="sm" variant="outline">コースをえらぶ</GameButton>
            <GameButton onClick={handleBackToLevel} size="sm" variant="outline">レベルをえらぶ</GameButton>
            <GameButton onClick={handleBackToTitle} size="sm" variant="ghost">ホームへ <LogOut className="ml-1" size={14}/></GameButton>
          </div>

          <div className="hidden">
            <summary className="cursor-pointer list-none p-3 text-sm font-bold text-slate-300 marker:content-none"><span className="mr-2 text-slate-500">＋</span>今回の問題と結果を見る（{gameState.battleLog.length}問）</summary>
            <div className="space-y-1 border-t border-slate-700 p-2">
              {gameState.battleLog.map((log, idx) => <div key={idx} className="flex items-center justify-between gap-3 rounded-lg bg-slate-800 px-3 py-2 text-sm"><span className="min-w-0 truncate font-mono text-cyan-100">{log.question.text}<span className="ml-2 font-sans text-slate-300">{log.question.translation}</span></span><span className={log.skipped ? 'text-slate-400' : log.missCount === 0 ? 'text-emerald-300' : 'text-yellow-300'}>{log.skipped ? 'スキップ' : log.missCount === 0 ? '正確' : `ミス ${log.missCount}`}</span></div>)}
            </div>
          </div>
        </Box>
      </ScreenContainer>
    );

    return (
      <ScreenContainer className="items-center justify-center p-4">
        {/* Main Result Box - Scrollable if content is long, but constrained to viewport */}
        <Box className="max-w-5xl w-full text-center border-4 border-yellow-600/50 bg-slate-800 relative flex flex-col max-h-full">
          {gameState.isNewRecord && (<div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 px-6 py-2 rounded-full font-black text-xl shadow-[0_0_20px_rgba(250,204,21,0.8)] animate-bounce z-50 whitespace-nowrap">👑 NEW RECORD! 👑</div>)}
          
          <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
          <div className="mb-4 flex-shrink-0">
              {isWin ? (
                <>
                  <div className="mb-2 animate-bounce"><Trophy size={60} className="text-yellow-400 mx-auto drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]" /></div>
                  <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 mb-1">CLEAR!</h2>
                  <p className="text-slate-400 text-sm">モンスターをやっつけた！</p>
                  {defeatedMonster && (
                    <div className="mt-4 rounded-xl border border-yellow-500/40 bg-gradient-to-b from-yellow-900/30 to-slate-900/40 p-4">
                      <div className="flex flex-col items-center gap-2">
                        <MonsterAvatar type={defeatedMonster.type} color={defeatedMonster.color} emotion="win" size={110} visualStyle={getMonsterVisualStyle(defeatedMonster)} />
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-300">Defeated Monster</p>
                        <p className="text-xl font-black text-white">{defeatedMonster.name}</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                 <>
                  <div className="mb-2"><Zap size={60} className="text-slate-600 mx-auto" /></div>
                  <h2 className="text-3xl font-black text-slate-400 mb-1">ざんねん...</h2>
                  <p className="text-slate-500 text-sm">にげられてしまった！</p>
                  <div className="mt-4 rounded-xl border border-red-500/40 bg-red-950/25 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-300">Remaining HP</p>
                    <p className="mt-2 text-3xl font-black text-white">{remainingHpToWin}</p>
                    <p className="mt-2 text-sm text-red-100">あと {remainingHpToWin} HP へらせばクリア！</p>
                  </div>
                </>
              )}
              {missedCount > 0 && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-orange-500/40 bg-orange-900/30 px-4 py-2 text-sm font-bold text-orange-200">
                  <AlertCircle size={16} className="text-orange-300" />
                  今回の苦手登録: {missedCount}語
                </div>
              )}
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3 flex-shrink-0">
            <div className="rounded-xl border border-green-500/30 bg-green-950/20 p-3 text-left">
              <p className="text-[10px] font-bold uppercase tracking-widest text-green-300">Perfect</p>
              <p className="mt-1 text-2xl font-black text-white">{perfectCount}</p>
            </div>
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-950/20 p-3 text-left">
              <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-300">Recovered</p>
              <p className="mt-1 text-2xl font-black text-white">{recoveredCount}</p>
            </div>
            <div className="rounded-xl border border-slate-500/30 bg-slate-900/40 p-3 text-left">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Skip</p>
              <p className="mt-1 text-2xl font-black text-white">{skippedCount}</p>
            </div>
            <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-3 text-left">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Perfect Rate</p>
              <p className="mt-1 text-2xl font-black text-white">{perfectRate}%</p>
            </div>
          </div>
          </div>

          <div className="mb-4 rounded-2xl border border-emerald-400/35 bg-emerald-950/20 p-4 shadow-[0_0_30px_rgba(34,197,94,0.08)]">
            {isWin ? (
              isNextAvailable ? (
                <GameButton onClick={handleNextMonster} className="w-full text-lg py-4" variant="success" autoFocus>{nextMonsterIsFinal ? 'ラスボスのモンスターへ' : 'つぎのモンスターへ'} <ArrowRight className="ml-2" size={22}/></GameButton>
              ) : (
                <GameButton onClick={handleBackToMode} className="w-full text-lg py-4" variant="primary" autoFocus>コース選択へ戻る <LayoutGrid className="ml-2" size={22}/></GameButton>
              )
            ) : (
              <GameButton onClick={handleRetry} className="w-full text-lg py-4" variant="warning" autoFocus>もう一度挑戦する <RotateCcw className="ml-2" size={22}/></GameButton>
            )}
            {missedCount > 0 && (
              <p className="mt-3 text-sm font-bold text-orange-200">今回ミスした {missedCount}語は、この下の「復習に進む」から確認できます。</p>
            )}
          </div>

          <details className="mb-4 rounded-2xl border border-cyan-500/20 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_58%),linear-gradient(145deg,rgba(15,23,42,0.98),rgba(12,18,32,0.92))] shadow-[0_0_30px_rgba(34,211,238,0.08)]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-left font-black text-cyan-100 marker:content-none">
              <span><span className="mr-2 text-cyan-300">＋</span>学習全体の状況を見る</span>
              <span className="text-sm font-bold text-cyan-200">{learningSummary.masteredCount}語 覚えた</span>
            </summary>
            <div className="border-t border-cyan-500/20 p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="text-left">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300">Learning Progress</p>
                <h3 className="mt-1 text-xl font-black text-white">{'\u3053\u3053\u307e\u3067\u306e\u5b66\u7fd2\u72b6\u6cc1'}</h3>
              </div>
              <div className="rounded-full border border-cyan-400/25 bg-cyan-950/40 px-4 py-2 text-sm font-bold text-cyan-100">
                {learningSummary.playableCount}{'\u5358\u8a9e\u4e2d'} {learningSummary.masteredCount}{'\u5358\u8a9e\u304c\u899a\u3048\u305f'}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-sky-400/30 bg-sky-500/12 p-4 text-left shadow-[0_0_24px_rgba(56,189,248,0.12)]">
                <div className="flex items-center gap-2 text-sky-200">
                  <BookOpen size={18} className="text-sky-300" />
                  <p className="text-[12px] font-black tracking-[0.16em]">{'\u5b66\u7fd2\u4e2d'}</p>
                </div>
                <p className="mt-3 text-4xl font-black leading-none text-white">{learningSummary.learningCount}</p>
              </div>
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/12 p-4 text-left shadow-[0_0_24px_rgba(52,211,153,0.12)]">
                <div className="flex items-center gap-2 text-emerald-200">
                  <CheckCircle2 size={18} className="text-emerald-300" />
                  <p className="text-[12px] font-black tracking-[0.16em]">{'\u3082\u3046\u5c11\u3057'}</p>
                </div>
                <p className="mt-3 text-4xl font-black leading-none text-white">{learningSummary.cautionCount}</p>
              </div>
              <div className="rounded-2xl border border-violet-400/30 bg-violet-500/12 p-4 text-left shadow-[0_0_28px_rgba(167,139,250,0.16)]">
                <div className="flex items-center gap-2 text-violet-200">
                  <Crown size={18} className="text-violet-300" />
                  <p className="text-[12px] font-black tracking-[0.16em]">{'\u899a\u3048\u305f'}</p>
                </div>
                <p className="mt-3 bg-gradient-to-r from-violet-100 via-white to-violet-200 bg-clip-text text-4xl font-black leading-none text-transparent">{learningSummary.masteredCount}</p>
              </div>
            </div>
            </div>
          </details>

          <details className="mb-4 rounded-xl border border-slate-600 bg-slate-900/55 p-2 text-left">
              <summary className="cursor-pointer list-none p-2 text-sm font-bold text-slate-200 marker:content-none"><span className="mr-2 text-slate-500">＋</span>復習・コース選択など、ほかの操作</summary>
              {missedCount > 0 && (
                <div className="rounded-xl border border-orange-500/30 bg-orange-950/20 p-3 text-left">
                  <p className="mb-3 text-sm font-bold text-orange-200">復習に進む</p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <GameButton onClick={handleOpenWeakList} size="sm" variant="outline" className="border-orange-500/40 text-orange-200 hover:bg-orange-900/30">
                      <ClipboardList size={16} className="mr-2" /> 苦手だけ見る
                    </GameButton>
                    <GameButton onClick={handleStartBattleReview} size="sm" variant="outline" className="border-emerald-500/40 text-emerald-200 hover:bg-emerald-900/20">
                      <RotateCcw size={16} className="mr-2" /> 今回のミスだけ復習
                    </GameButton>
                    <GameButton onClick={handleStartWeaknessFromResult} size="sm" className="bg-orange-600 border-orange-400 text-white hover:bg-orange-500 md:col-span-2">
                      <Flame size={16} className="mr-2" /> 苦手復習へ
                    </GameButton>
                  </div>
                </div>
              )}
              {isWin ? (
                  isNextAvailable ? (
                    <GameButton onClick={handleNextMonster} className="w-full text-lg py-3" variant="success" autoFocus>{nextMonsterIsFinal ? '最後のモンスターへ' : 'つぎのモンスターへ'} <ArrowRight className="ml-2" size={20}/></GameButton>
                  ) : (
                    // Course Cleared!
                    <GameButton onClick={handleBackToMode} className="w-full text-lg py-3" variant="primary" autoFocus>コース選択へ戻る <LayoutGrid className="ml-2" size={20}/></GameButton>
                  )
              ) : (
                  <GameButton onClick={handleRetry} className="w-full text-lg py-3" variant="warning" autoFocus>もういちど！ <RotateCcw className="ml-2" size={20}/></GameButton>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                 <GameButton onClick={handleBackToMode} size="sm" variant="outline">コースをえらぶ</GameButton>
                 <GameButton onClick={handleBackToLevel} size="sm" variant="outline">レベルをえらぶ</GameButton>
                 <GameButton onClick={handleBackToTitle} size="sm" variant="ghost">ホームへ <LogOut className="ml-1" size={14}/></GameButton>
                 <GameButton onClick={() => setGameState(prev => ({ ...prev, screen: 'monster-book' }))} size="sm" variant="ghost"><BookOpen size={16} className="mr-2" /> 図鑑</GameButton>
              </div>
          </details>

          <details className="mb-4 rounded-lg border border-slate-700/50 bg-slate-900/50 p-2 text-left">
             <summary className="cursor-pointer list-none p-2 text-sm font-bold text-slate-200 marker:content-none"><span className="mr-2 text-slate-500">＋</span>今回の問題と結果を見る（{gameState.battleLog.length}問）</summary>
             <div className="space-y-1">
                 {gameState.battleLog.map((log, idx) => {
                     const example = getQuestionExample(gameState.selectedDifficulty, gameState.selectedLevel, log.question);
                     const resultQuestionSynonyms = ['Eiken5', 'Eiken4', 'EikenPre1'].includes(gameState.selectedDifficulty) && gameState.selectedLevel !== 3
                       ? getQuestionSynonyms(gameState.selectedDifficulty, gameState.selectedLevel, log.question)
                       : [];
                     return (
                       <div key={idx} className="rounded bg-slate-800 p-2 text-xs border border-slate-700">
                         <div className="flex items-center justify-between gap-3">
                           <div className="flex min-w-0 flex-1 items-start gap-3">
                               <button onClick={() => speakWithSettings(log.question.text)} className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-slate-400 transition-colors hover:bg-blue-600 hover:text-white">
                                 <Volume2 size={14} />
                               </button>
                               <div className="min-w-0 flex-1">
                                   <span className="block font-mono text-blue-200 font-bold break-all">{log.question.text}</span>
                                   <span className="block text-slate-300">{log.question.translation}</span>
                                   {resultQuestionSynonyms.length > 0 && (
                                     <span className="mt-0.5 block truncate text-[10px] font-semibold text-cyan-300/90">
                                       類義/関連: <span className="text-cyan-100/90">{resultQuestionSynonyms.join(' / ')}</span>
                                     </span>
                                   )}
                               </div>
                           </div>
                           <div className="flex items-center flex-shrink-0">
                               {log.skipped ? 
                                  <span className="text-slate-500 flex items-center gap-1"><FastForward size={14}/> Skip</span> :
                                  log.missCount === 0 ? 
                                  <span className="text-green-400 flex items-center gap-1"><CheckCircle2 size={14}/> Perfect</span> :
                                  <span className="text-yellow-500 flex items-center gap-1"><AlertCircle size={14}/> Miss x{log.missCount}</span>
                               }
                           </div>
                         </div>
                         {example && (
                           <div className="mt-2 ml-11 rounded-lg border border-slate-700/80 bg-slate-950/70 px-3 py-2">
                             <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">Example</p>
                             <p className="mt-1 text-xs text-slate-200">{example}</p>
                           </div>
                         )}
                       </div>
                     );
                 })}
             </div>
          </details>
        </Box>
      </ScreenContainer>
    );
  }
  return <div>Loading...</div>;
}
