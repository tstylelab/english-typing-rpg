import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { load } from './lib/load-typescript-data.mjs';
import { loadAppFunctions } from './lib/load-app-functions.mjs';
import { publishedData } from './lib/load-published-data.mjs';

const plain = value => JSON.parse(JSON.stringify(value));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const approved = JSON.parse(fs.readFileSync('src/data/conversationCurriculum.json', 'utf8'));
assert.equal(hash(approved), 'c0ef392379085f775946d63401f6eab601c71dd3b8371d413c5b686c358d823a', 'Exactly the 500 items approved in the review preview');
const archiveText = fs.readFileSync('src/data/questionSets/conversation/beginner.json', 'utf8');
assert.equal(createHash('sha256').update(archiveText).digest('hex'), '4dad706233dd75a8c921585c1fdc6e79aaa8a1f93048b93d6c758b9c1d33cb94', 'Released 216-item archive retained');
const archive = JSON.parse(archiveText);
const { QUESTIONS } = load('src/data/questions.ts');
const course = load('src/data/conversationCurriculum.ts');
const { getQuestionMeaning } = load('src/data/questionMeaning.ts');
const { getQuestionExample } = load('src/data/questionExamples.ts');
const { api, storage } = loadAppFunctions(['getQuestionStatusKey', 'getAvailableLevels', 'normalizePlayerProfiles', 'writeProfileDataToWorkingSet', 'readLegacyWorkingSetFromLocalStorage', 'normalizeReviewQueue', 'getCourseMonsters', 'getBattleTuning', 'getBattleQuestionLimit', 'getPerfectClearDamageFloor']);
const items = Object.values(QUESTIONS.Conversation).flat();
const releasedView = Object.fromEntries(Object.entries(QUESTIONS).map(([name, levels]) => [name, name === 'Conversation' ? Object.fromEntries([1, 2, 3].map(level => [level, archive.levels[level]])) : Object.fromEntries([1, 2, 3].map(level => [level, levels[level]]))]));
assert.equal(hash(releasedView), '8af479f03894bf6c225aabdc2e38bc56fadaa5d0259402a83fdf6f0f11482ca1', 'All 7,434 Eiken questions and the original conversation archive are unchanged');
assert.equal(items.length, 500);
// Compare the live Eiken meaning/example/synonym/note/prompt path to the latest
// published release, including pick up. Frozen historical audits are separate.
const released = publishedData('55cde8323e9ea812d558a205eec89f0a0618a094');
const selectors = [
  ['src/data/questionMeaning.ts', 'getQuestionMeaning', (c,l,q) => [q,c]],
  ['src/data/questionExamples.ts', 'getQuestionExample', (c,l,q) => [c,l,q]],
  ['src/data/questionSynonyms.ts', 'getQuestionSynonymLabels', (c,l,q) => [c,l,q]],
  ['src/data/vocabularyUsageNotes.ts', 'getVocabularyUsageNote', (c,l,q) => [c,l,q]],
  ['src/data/translationBattlePrompts.ts', 'getTranslationBattlePrompt', (c,l,q) => [q,c,l]],
].map(([file,name,args]) => ({ live: load(file)[name], old: released(file)[name], args, name }));
for (const [name, levels] of Object.entries(QUESTIONS)) if (name !== 'Conversation') {
  for (const level of [1,2,3]) for (const q of levels[level]) for (const selector of selectors) {
    const args = selector.args(name,level,q);
    assert.equal(JSON.stringify(selector.live(...args)), JSON.stringify(selector.old(...args)), `${name}:${level}:${q.text}:${selector.name}: published Eiken display unchanged`);
  }
}
assert.equal(new Set(items.map(q => q.text.toLowerCase().replace(/[.,!?]/g, ''))).size, 500);
assert.deepEqual(plain(api.getAvailableLevels('Conversation')), [1, 2, 3, 4, 5]);
for (const courseName of Object.keys(QUESTIONS).filter(c => c !== 'Conversation')) {
  assert.deepEqual(plain(api.getAvailableLevels(courseName)), [1, 2, 3]);
  assert.equal(QUESTIONS[courseName][4].length + QUESTIONS[courseName][5].length, 0);
}
const legacyKeys = [], allKeys = [];
for (const level of [1, 2, 3, 4, 5]) {
  assert.equal(QUESTIONS.Conversation[level].length, 100);
  for (const q of QUESTIONS.Conversation[level]) {
    const item = approved.items.find(r => r.question.text === q.text);
    assert.ok(item && item.level === level);
    assert.equal(getQuestionMeaning(q, 'Conversation'), item.question.translation);
    assert.equal(getQuestionExample('Conversation', level, q), item.question.exampleEn);
    for (const field of ['promptEn', 'promptJa', 'sceneJa', 'speakingTip']) assert.equal(q[field] || undefined, item.question[field] || undefined);
    const key = api.getQuestionStatusKey('Conversation', level, q);
    allKeys.push(key);
    assert.equal(api.getQuestionStatusKey('Conversation', level, plain(q)), key);
    if (item.sourceLevel !== null) {
      const old = archive.levels[item.sourceLevel][item.sourceIndex];
      const oldKey = `Conversation:${item.sourceLevel}:${old.text}:${old.translation}`;
      assert.equal(q.text, old.text); assert.equal(q.translation, old.translation); assert.equal(q.exampleEn, old.exampleEn);
      assert.equal(key, oldKey); assert.equal(api.getQuestionStatusKey('Conversation', item.sourceLevel, old), oldKey);
      legacyKeys.push(oldKey);
    }
  }
}
assert.equal(legacyKeys.length, 216); assert.equal(new Set(legacyKeys).size, 216); assert.equal(new Set(allKeys).size, 500);
const statuses = Object.fromEntries(legacyKeys.map((key, i) => [key, { practiceLevel: i % 3 + 1, listeningLevel: i % 3 + 1, battleLevel: i % 3 + 1, excluded: i % 11 === 0, manualOverrideLevel: null, updatedAt: 1000 + i }]));
const oldScopes = Object.fromEntries([1, 2, 3].map(level => [`Conversation:${level}`, legacyKeys.filter(key => key.startsWith(`Conversation:${level}:`))]));
oldScopes['Conversation:1'].push('Conversation:1:retired:旧教材');
oldScopes['Eiken5:1'] = ['Eiken5:1:apple:りんご'];
const victories = ['Conversation:1:challenge:voice-only:c1_1', 'Conversation:2:guide:voice-text:m2_1', 'Conversation:3:challenge:text-only:c3_13', 'Eiken5:1:guide:voice-text:m1_1'];
const queue = approved.items.filter(r => r.sourceLevel !== null).map(r => ({ difficulty: 'Conversation', level: r.sourceLevel, question: archive.levels[r.sourceLevel][r.sourceIndex], remainingQuestions: 2, missCount: 4 }));
const profile = { id: 'legacy-player', name: '既存プレイヤー', updatedAt: 123, data: { manualQuestionStatuses: statuses, markedQuestionKeysByScope: oldScopes, selectedQuestionKeysByScope: oldScopes, reviewHistoryKeysByScope: oldScopes, defeatedMonsterIds: victories, bestScores: { [victories[0]]: 1234 }, weakQuestions: Object.values(archive.levels).flat(), weakQuestionStats: { 'Come again?': { missCount: 9, lastMissedAt: 123, consecutiveCorrect: 2 } }, reviewQueue: queue, savedSelectionLists: [{ id: 'old-list', name: '既存リスト', difficulty: 'Conversation', level: 1, questionKeys: oldScopes['Conversation:1'], updatedAt: 123 }] } };
const normalized = plain(api.normalizePlayerProfiles([profile, { id: 'second-player', name: '別プレイヤー', updatedAt: 123, data: { defeatedMonsterIds: victories, maxKeystrokes: 456 } }]));
const data = normalized[0].data;
for (const [key, old] of Object.entries(statuses)) for (const field of ['practiceLevel', 'listeningLevel', 'battleLevel', 'excluded', 'manualOverrideLevel', 'updatedAt']) assert.equal(data.manualQuestionStatuses[key][field], old[field], key + ' ' + field);
assert.deepEqual(data.defeatedMonsterIds, victories); assert.equal(data.bestScores[victories[0]], 1234);
assert.equal(data.weakQuestions.length, 216); assert.equal(data.weakQuestionStats['Come again?'].missCount, 9);
for (const key of allKeys.filter(key => !legacyKeys.includes(key))) assert.equal(data.manualQuestionStatuses[key], undefined, 'New questions start without inheriting an old item’s record');
assert.deepEqual(data.savedSelectionLists, profile.data.savedSelectionLists);
for (const field of ['markedQuestionKeysByScope', 'selectedQuestionKeysByScope', 'reviewHistoryKeysByScope']) {
  assert.deepEqual([...new Set(Object.values(data[field]).flat())].sort(), [...new Set(Object.values(oldScopes).flat())].sort());
  assert.ok(data[field]['Conversation:1'].includes('Conversation:1:retired:旧教材'));
  assert.deepEqual(data[field]['Eiken5:1'], oldScopes['Eiken5:1']);
  for (const item of approved.items.filter(r => r.sourceLevel !== null)) {
    const old = archive.levels[item.sourceLevel][item.sourceIndex];
    const key = `Conversation:${item.sourceLevel}:${old.text}:${old.translation}`;
    assert.ok(data[field][`Conversation:${item.level}`].includes(key));
  }
}
assert.equal(data.reviewQueue.length, 216);
for (const entry of data.reviewQueue) {
  assert.equal(entry.level, course.getConversationQuestionLevel(entry.question));
  assert.equal(entry.remainingQuestions, 2); assert.equal(entry.missCount, 4);
  assert.equal(entry.question.promptEn || undefined, course.getConversationQuestionDisplay(entry.question).promptEn || undefined);
}
assert.deepEqual(plain(api.normalizePlayerProfiles(normalized)), normalized, 'Idempotent profile normalization');
for (const p of normalized) { api.writeProfileDataToWorkingSet(p.data); assert.deepEqual(plain(api.readLegacyWorkingSetFromLocalStorage()), p.data, 'Profile/export/import working-set round trip'); }
assert.equal(normalized[1].data.maxKeystrokes, 456);
assert.ok(storage.size > 0);
// Old Eiken functions must produce the same real encounter tuning after widening
// the course Level type. Compare all nine courses, lanes, inputs and encounters.
const previousSource = execFileSync('git', ['show', '2e8755b:src/App.tsx'], { encoding: 'utf8', maxBuffer: 8_000_000 });
const previous = loadAppFunctions(['getCourseMonsters', 'getBattleTuning'], previousSource).api;
let encounters = 0;
for (const courseName of Object.keys(QUESTIONS).filter(c => c !== 'Conversation')) for (const level of [1, 2, 3]) {
  const now = api.getCourseMonsters(courseName, level), before = previous.getCourseMonsters(courseName, level);
  assert.deepEqual(plain(now), plain(before), 'All existing monster IDs/profiles retained');
  for (const lane of ['guide', 'challenge']) for (const input of lane === 'guide' ? ['voice-text'] : ['voice-text', 'voice-only', 'text-only']) for (const [index, monster] of now[lane].entries()) for (const boss of [0, 1, 2, 3, 4]) {
    assert.deepEqual(plain(api.getBattleTuning(courseName, level, lane, input, index, monster.baseHp, boss)), plain(previous.getBattleTuning(courseName, level, lane, input, index, monster.baseHp, boss)));
    encounters++;
  }
}
for (const level of [4, 5]) {
  const monsters = api.getCourseMonsters('Conversation', level);
  assert.equal(monsters.guide.length, 20); assert.equal(monsters.challenge.length, 23);
  assert.equal(new Set([...monsters.guide, ...monsters.challenge].map(m => m.id)).size, 43);
  assert.ok([...monsters.guide, ...monsters.challenge].every(m => m.id.startsWith('m' + level + '_') || m.id.startsWith('c' + level + '_')));
}
console.log(`PASS: 500 approved conversation questions; 216 original keys, all learning/review/selection/queue/victory records preserved; 5x100 levels; ${encounters} unchanged Eiken encounter configurations.`);
