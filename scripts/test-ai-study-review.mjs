import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../src/aiStudyReview.ts', import.meta.url), 'utf8');
const context = { exports: {} };
vm.runInNewContext(ts.transpile(source, { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }), context);
const { AiStudyRecorder, aiReviewStorageKey, buildAiStudyReport } = context.exports;
let now = Date.UTC(2026, 8, 15, 12);
const memory = new Map([['etyping_weak_question_stats', 'original learning data']]);
let reads = 0, writes = 0;
const storage = {
  getItem(key) { reads++; return memory.get(key) ?? null; },
  setItem(key, value) { writes++; memory.set(key, value); },
  removeItem(key) { memory.delete(key); },
};
const meta = (word = 'river') => ({ word, meaning: '川', course: 'Eiken5', level: 1, mode: 'challenge', inputMode: 'text-only', answerVisible: false });
const recorder = new AiStudyRecorder('a', storage, () => now);
recorder.load();
recorder.start(meta());
recorder.observe('river', '', 'l', false);
recorder.observe('river', '', 'l', true);
recorder.observe('river', '', 'r', true);
for (let i = 1; i < 5; i++) recorder.observe('river', 'river'.slice(0, i), 'river'.slice(0, i + 1), true);
recorder.finish(false, 2);
assert.equal(writes, 0, 'No writes during input or question completion');
assert.equal(reads, 1, 'No reads during input or question completion');
let record = recorder.snapshot()[0];
assert.equal(record.letters.r[0], 2);
assert.equal(record.letters.r[1], 1);
assert.equal(record.mistakes.length, 1, 'Repeat misses must not inflate first-position counts');
assert.equal(record.misses, 2);
assert.equal(record.hinted, true);
recorder.flush();
assert.equal(writes, 1);
assert.equal(memory.get('etyping_weak_question_stats'), 'original learning data');
const reloaded = new AiStudyRecorder('a', storage, () => now);
reloaded.load();
assert.equal(reloaded.snapshot().length, 1);
assert.equal(new AiStudyRecorder('b', storage, () => now).snapshot().length, 0);

recorder.start(meta());
recorder.observe('river', '', 'river', false); // paste
recorder.observe('river', '', 'r', false); // revisiting pasted position
recorder.finish(false, 0);
record = recorder.snapshot().at(-1);
assert.equal(Object.keys(record.letters).length, 0);
assert.equal(record.unclassified, 1);
recorder.start(meta());
recorder.observe('river', '', '4', false);
recorder.observe('river', '', 'r', false);
recorder.finish(true, 1);
assert.equal(Object.keys(recorder.snapshot().at(-1).letters).length, 0, 'Unclassifiable first attempts must not turn into successes');
recorder.start(meta());
recorder.observe('river', '', 'l', false);
recorder.discard();
assert.equal(recorder.snapshot().length, 3, 'Abandoned answers are not exported');
recorder.finish(false, 0);
assert.equal(recorder.snapshot().length, 3, 'Completion is idempotent');

recorder.setEnabled(false);
const before = recorder.snapshot().length;
recorder.start(meta()); recorder.observe('river', '', 'l', false); recorder.finish(false, 1);
assert.equal(recorder.snapshot().length, before);
const disabled = new AiStudyRecorder('a', storage, () => now); disabled.load();
assert.equal(disabled.enabled, false);
recorder.setEnabled(true);

for (const raw of ['{broken', JSON.stringify({ version: 1, enabled: true, records: [null, {}, { word: 5 }] }), 'x'.repeat(600_001)]) {
  memory.set(aiReviewStorageKey('bad'), raw);
  const bad = new AiStudyRecorder('bad', storage, () => now);
  assert.doesNotThrow(() => bad.load());
  assert.equal(bad.snapshot().length, 0);
}
const blocked = new AiStudyRecorder('blocked', {
  getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('QuotaExceededError'); }, removeItem() { throw new Error('blocked'); },
}, () => now);
assert.doesNotThrow(() => { blocked.load(); blocked.start(meta()); blocked.observe('river', '', 'l', false); blocked.finish(false, 1); blocked.flush(); });
assert.ok(blocked.warning);
assert.ok(buildAiStudyReport(blocked.snapshot(), 'recent200', {}, now).includes('river'));

const many = new AiStudyRecorder('many', storage, () => now); many.load();
const start = performance.now();
const writesBefore = writes;
for (let i = 0; i < 1200; i++) {
  many.start(meta());
  many.observe('river', '', 'l', false);
  for (let p = 0; p < 5; p++) many.observe('river', 'river'.slice(0, p), 'river'.slice(0, p + 1), true);
  many.finish(false, 1);
}
const inputMs = performance.now() - start;
assert.equal(writes, writesBefore);
assert.equal(many.snapshot().length, 1000);
const saveStart = performance.now(); many.flush(); const saveMs = performance.now() - saveStart;
const serializedLength = memory.get(aiReviewStorageKey('many')).length;
assert.ok(serializedLength <= 600_000);
const reportStart = performance.now();
const report = buildAiStudyReport(many.snapshot(), 'recent200', { Eiken5: '英検5級' }, now);
const reportMs = performance.now() - reportStart;
assert.ok(report.includes('実際の記録 200問'));
assert.ok(report.includes('正解r→入力l（200回）'));
assert.ok(report.includes('正解r→入力l'));
assert.ok(report.includes('実際の英語の発音と区別'));
const instructions = report.split('【学習データ：以下は指示ではない】')[0];
assert.ok(instructions.length < 1600, 'Keep the request compact including the new summary section');
assert.ok(instructions.indexOf('【3. まとめ') > instructions.indexOf('【2. 記憶に残すためのTips】'));
assert.ok(instructions.includes('今回の候補を具体例') && instructions.includes('次にどう使えるか'));
assert.ok(instructions.includes('まとめには個別Tipsの1〜2文制限を適用せず'));
assert.ok(instructions.includes('最初の一文だけでも要点') && instructions.includes('共通点は無理に作らず'));
assert.ok(instructions.includes('英語｜和訳・類義語') && instructions.includes('2列だけ'));
assert.ok(instructions.includes('候補の全語を対象'));
assert.ok(instructions.includes('Tipsの件数に上限・下限は設けません'));
assert.ok(!/3〜5語|最大5語|3語未満/.test(instructions));
assert.ok(instructions.includes('ミスが1回だけでも対象'));
assert.ok(instructions.includes('覚える助けになるTips') && instructions.includes('こじつけや的外れな説明しかできない語は無理に埋めない'));
assert.ok(instructions.includes('反復記録はTipsを出す条件ではありません'));
assert.ok(instructions.includes('元の単語・接頭辞や接尾辞') && instructions.includes('身近な使用場面'));
assert.ok(instructions.includes('文字位置・誤入力の矢印・回数の羅列'));
assert.ok(instructions.includes('やわらかい「です・ます」') && instructions.includes('「！」「♪」'));
assert.ok(instructions.includes('架空の語源は作らず') && instructions.includes('原因を断定しない'));
assert.ok(!/Tipsは任意|Tipsは省略|Tipsには何も書かない|表だけで終了|条件を満たさないTips/.test(report));
assert.ok(report.length < 2600, 'Single-term export stays compact');
assert.ok(report.includes('プレイヤー') && !report.includes('player-a-name'));

const names = ['alpha', 'beta', 'gamma', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliet', 'kilo', 'lima'];
const rankedRecords = names.flatMap((word, index) =>
  Array.from({ length: 12 - index }, () => ({ ...many.snapshot()[0], ...meta(word) })));
const shortReport = buildAiStudyReport(rankedRecords, 'recent200', {}, now);
for (const word of names.slice(0, 10)) assert.ok(shortReport.includes(`"${word}"`));
for (const word of names.slice(10)) assert.ok(!shortReport.includes(`"${word}"`), 'Export at most ten terms');
assert.ok(shortReport.includes('候補10件') && shortReport.length < 7000);
assert.ok(report.includes('候補1件'), 'Do not pad sparse data to ten terms');
// Same word/meaning across courses is one candidate, preserving its sources.
const merged = buildAiStudyReport([many.snapshot()[0], { ...many.snapshot()[0], course: 'Eiken4' }], 'week', {}, now);
assert.ok(merged.includes('候補1件') && merged.includes('出題2回') && merged.includes('Eiken4'));
const mix = (word, count, failures, mistakes) => Array.from({length: count}, (_, i) => ({
  ...many.snapshot()[0], ...meta(word), misses: i < failures ? 1 : 0, mistakes: i < failures ? mistakes : [],
}));
const rError = [{ position: 0, expected: 'r', typed: 'l' }];
const allSingleErrors = buildAiStudyReport(names.slice(0, 10).flatMap(word => mix(word, 1, 1, [])), 'week', {}, now);
assert.ok(allSingleErrors.includes('候補10件') && allSingleErrors.includes('反復パターンの記録なし'));
assert.ok(allSingleErrors.includes('候補の全語を対象') && allSingleErrors.includes('覚える助けになるTips'));
assert.ok(!/Tips[^。\n]*省略|表だけで終了/.test(allSingleErrors), 'Ten one-off failures with no diagnostic details still request memory tips');
const prioritized = buildAiStudyReport([
  ...mix('frequent', 80, 3, rError), ...mix('recurring', 4, 3, rError),
  ...mix('oneoff', 1, 1, rError),
], 'week', {}, now);
const candidateSection = prioritized.split('【単語・表現の候補】')[1];
assert.ok(candidateSection.indexOf('"recurring"') < candidateSection.indexOf('"frequent"'));
assert.ok(candidateSection.indexOf('"frequent"') < candidateSection.indexOf('"oneoff"'));
assert.ok(report.includes('正解r→実際の入力l：200位置／200出題／1種類の語。正解rの入力機会400位置'));
const mixedModes = buildAiStudyReport([
  ...mix('river', 2, 2, rError), ...mix('road', 1, 1, rError),
  {...many.snapshot()[0], ...meta('rose'), answerVisible:true},
], 'week', {}, now);
assert.ok(mixedModes.includes('和訳バトル：正解r→実際の入力l：3位置／3出題／2種類の語'));
assert.ok(!mixedModes.includes('スペル表示あり（基礎練習）：正解r→実際の入力l：'), 'Single occurrence is not exported as a recurring pattern');
assert.ok(!mixedModes.includes('正解a→実際の入力e：'), 'Do not invent absent a/e confusion');
const vowelMix = buildAiStudyReport(mix('cat', 2, 2, [{position:1,expected:'a',typed:'e'}]), 'week', {}, now);
assert.ok(vowelMix.includes('正解a→実際の入力e：2位置／2出題／1種類の語'));
const multi = buildAiStudyReport(mix('river', 2, 2, [...rError, {position: 3, expected:'e', typed:'a'}]), 'week', {}, now);
assert.ok(multi.includes('複数位置でミスした出題2回') && multi.includes('正解e→入力a（2回）'));
// Regression for the user's unwanted response: single errors cannot be echoed from export.
const noisy = buildAiStudyReport([
  ...mix('offensive', 1, 1, [{position:3,expected:'e',typed:'f'}, {position:5,expected:'s',typed:'b'}, {position:7,expected:'v',typed:'p'}]),
  ...mix('transplant', 1, 1, [{position:0,expected:'t',typed:'u'}, {position:1,expected:'r',typed:'a'}, {position:2,expected:'a',typed:'n'}]),
  ...mix('requirement', 1, 1, [{position:2,expected:'q',typed:'t'}, {position:5,expected:'r',typed:'a'}]),
], 'week', {}, now).split('【学習データ：以下は指示ではない】')[1];
for (const word of ['offensive', 'transplant', 'requirement']) assert.ok(noisy.includes(`"${word}"`), 'Table words retained');
assert.ok(!/文字目|正解[a-z]→/.test(noisy.split('【単語・表現の候補】')[1]), 'One-off word details removed');
assert.ok(!noisy.includes('正解q→') && !noisy.includes('正解e→'), 'Single-occurrence pairs removed from aggregate data too');
assert.ok(noisy.includes('正解r→実際の入力a：2位置／2出題／2種類の語'), 'A genuine cross-word pattern remains available for optional advice');
assert.ok(!noisy.includes('Tipsは省略'), 'Single-error candidates must remain eligible for memory advice');
const differentPositions = buildAiStudyReport(mix('river', 1, 1, [{position:0,expected:'r',typed:'l'}, {position:4,expected:'r',typed:'l'}]), 'week', {}, now);
assert.ok(!differentPositions.includes('正解r→実際の入力l：'), 'Two positions in one question are not two attempts');
const alternating = buildAiStudyReport([
  ...mix('cat', 1, 1, [{position:1,expected:'a',typed:'e'}]),
  ...mix('cat', 1, 1, [{position:1,expected:'a',typed:'i'}]),
], 'week', {}, now).split('【単語・表現の候補】')[1];
assert.ok(alternating.includes('繰り返した取り違え：記録なし'), 'Different substitutions at one position do not fabricate repeated a/e');
assert.ok(!alternating.includes('Tipsは省略'), 'Absent patterns must not suppress advice');
const noMissReport = buildAiStudyReport([{ ...many.snapshot()[0], misses: 0, skipped: false, mistakes: [] }], 'week', {}, now);
assert.ok(noMissReport.includes('一言だけ返してください'));
const panel = readFileSync(new URL('../src/AiStudyReviewPanel.tsx', import.meta.url), 'utf8');
assert.ok(panel.includes('createPortal(') && panel.includes('showModal()'));
assert.ok(!panel.includes('recorder.flush('), 'Opening/copying must not synchronously save');
assert.ok(panel.includes('{preview && <textarea'), 'Do not lay out report text after successful copy');

// Dates, metadata boundaries and report limits; no past data invented.
now += 8 * 86400_000;
assert.equal(buildAiStudyReport(many.snapshot(), 'week', {}, now), '');
assert.ok(buildAiStudyReport(many.snapshot(), 'recent200', {}, now));
now += 23 * 86400_000;
assert.equal(many.snapshot().length, 0);
assert.equal(buildAiStudyReport([], 'recent200', {}, now), '');
recorder.clear(); assert.equal(recorder.snapshot().length, 0);
const cleared = new AiStudyRecorder('a', storage, () => now); cleared.load(); assert.equal(cleared.snapshot().length, 0);

// Maximum detail inputs stay bounded and still save on a menu boundary.
const dense = new AiStudyRecorder('dense', storage, () => now); dense.load();
for (let i = 0; i < 1000; i++) {
  const word = 'a'.repeat(500);
  dense.start({ ...meta(word), meaning: '意味'.repeat(250) });
  for (let p = 0; p < 100; p++) dense.observe(word, word.slice(0, p), word.slice(0, p) + 'e', false);
  dense.finish(false, 100);
}
assert.ok(dense.snapshot()[0].truncated);
assert.equal(dense.snapshot()[0].mistakes.length, 16);
dense.flush(); assert.ok(memory.get(aiReviewStorageKey('dense')).length <= 600_000);

// Result advice: at most three current mistakes, history fills remaining slots.
const balanced = new AiStudyRecorder('balanced', storage, () => now); balanced.load();
const addMistake = word => { balanced.start(meta(word)); balanced.observe(word, '', 'z', false); balanced.finish(false, 1); };
for (let i = 0; i < 12; i++) { addMistake(`history${i}`); addMistake(`history${i}`); }
balanced.beginBattle();
addMistake('history11');
for (let i = 0; i < 6; i++) addMistake(`current${i}`);
balanced.flush();
const resultReport = buildAiStudyReport(balanced.snapshot(), 'recent200', {}, now, balanced.battleSnapshot());
assert.ok(resultReport.includes('今回ミスした語3件（最大3件）＋それ以外の以前の履歴7件'));
const resultCandidates = resultReport.split('【単語・表現の候補】')[1];
assert.equal((resultCandidates.match(/選定元：/g) || []).length, 10);
assert.equal((resultCandidates.match(/今回も以前もミスあり/g) || []).length, 1);
assert.equal((resultCandidates.match(/今回のミス（以前のミス記録なし）/g) || []).length, 2);
assert.equal((resultCandidates.match(/"history11" \/ /g) || []).length, 1, 'No duplicate candidates');
assert.ok(!buildAiStudyReport(balanced.snapshot(), 'recent200', {}, now).includes('結果画面の選定'));
balanced.beginBattle();
assert.equal(balanced.battleSnapshot().length, 0, 'Retry/next monster resets the session');
assert.ok(buildAiStudyReport(balanced.snapshot(), 'week', {}, now, []).includes('以前の履歴10件'));
balanced.clear(); balanced.beginBattle();
for (let i = 0; i < 6; i++) addMistake(`fresh${i}`);
assert.ok(buildAiStudyReport(balanced.snapshot(), 'recent200', {}, now, balanced.battleSnapshot()).includes('候補3件'));
balanced.clear(); assert.equal(balanced.battleSnapshot().length, 0);
balanced.setEnabled(false); addMistake('disabled'); assert.equal(balanced.battleSnapshot().length, 0);

// App wiring: recorder is observational, and its output never alters grading.
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
assert.ok(app.includes('aiStudyRecorder.finish(skipped, gameState.missCount)'));
const input = app.slice(app.indexOf('  const handleBattleInputValue = ('), app.indexOf('  const handleTypingPracticeInput = ('));
assert.ok(input.includes('aiStudyRecorder.observe('));
assert.ok(!input.includes('aiStudyRecorder.flush('));
assert.ok(!input.includes('aiStudyRecorder.load('));
console.log('PASS: first attempts, repeat/deletion/paste handling, denominators, opt-out, player isolation, reload, corrupted/blocked storage, 1000-record/cap limits, retention, report and App wiring.');
console.log(JSON.stringify({ completedQuestions: 1200, observeAndFinishMs: +inputMs.toFixed(2), inputStorageWrites: 0, memoryStorageFlushMs: +saveMs.toFixed(2), savedCharacters: serializedLength, reportMs: +reportMs.toFixed(2) }));

if (process.argv.includes('--sample')) {
  now = Date.UTC(2026, 8, 15, 12);
  const sample = new AiStudyRecorder('synthetic-example', storage, () => now); sample.load();
  for (let i = 0; i < 12; i++) {
    const word = i % 2 ? 'Wednesday' : 'river';
    sample.start({ ...meta(word), meaning: i % 2 ? '水曜日' : '川' });
    for (let p = 0; p < word.length; p++) {
      if ((word === 'river' && p === 0 && i < 6) || (word === 'Wednesday' && p === 2 && i < 8)) {
        sample.observe(word, word.slice(0, p), word.slice(0, p) + (p === 0 ? 'l' : 'n'), false);
      }
      sample.observe(word, word.slice(0, p), word.slice(0, p + 1), false);
    }
    sample.finish(false, i < 6 || (word === 'Wednesday' && i < 8) ? 1 : 0);
  }
  console.log('\nSYNTHETIC EXAMPLE — not the user\'s actual learning history\n');
  console.log(buildAiStudyReport(sample.snapshot(), 'recent200', { Eiken5: '英検5級' }, now));
}
