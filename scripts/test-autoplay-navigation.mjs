import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Exercise the actual playback function with controlled speech and timers.
const source = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const body = source.slice(source.indexOf('  const startAutoPlaySequence = ('), source.indexOf('  const startAutoPlayForQuestions = ('));
const stopBody = source.slice(source.indexOf('  const stopAutoPlay = useCallback('), source.indexOf('\n  useEffect(', source.indexOf('  const stopAutoPlay = useCallback(')));
const compiled = ts.transpile('(() => { const autoPlaySettings = globalThis.autoPlaySettings;\n' + stopBody + body + '\nglobalThis.start = startAutoPlaySequence; globalThis.stop = stopAutoPlay; })();', { target: ts.ScriptTarget.ES2022 });
function setup(repeat = false) {
  let utterance;
  let timerId = 0;
  const timers = new Map();
  const spoken = [];
  const ctx = {
    LOCAL_SILENT_CHECK: false,
    autoPlayRunIdRef: { current: 0 }, autoPlayNavigateRef: { current: null },
    autoPlayResumeRef: { current: null },
    autoPlayRemoveCurrentRef: { current: null },
    autoPlayRepeatRef: { current: repeat }, autoPlaySpeechCleanupRef: { current: null },
    autoPlayTimeoutRef: { current: null }, autoPlayWakeLockWantedRef: { current: false },
    autoPlaySettings: { repeat, playbackRatePercent: 100 },
    MIN_AUTO_PLAY_QUESTION_GAP_SECONDS: 0.3, MIN_AUTO_PLAY_ITEM_GAP_SECONDS: 0.3,
    clearAutoPlayTimeout() { ctx.autoPlaySpeechCleanupRef.current?.(); timers.delete(ctx.autoPlayTimeoutRef.current); ctx.autoPlayTimeoutRef.current = null; },
    setAutoPlayNowPlaying(value) { ctx.now = value; },
    setIsAutoPlaying(value) { ctx.playing = value; },
    setIsAutoPlayPaused(value) { ctx.paused = value; },
    useCallback(fn) { return fn; },
    setAutoPlayStatusText() {}, requestAutoPlayWakeLock() {}, releaseAutoPlayWakeLock() {},
    stopAutoPlay() { ctx.playing = false; ctx.autoPlayRunIdRef.current++; ctx.autoPlayRemoveCurrentRef.current = null; ctx.autoPlayNavigateRef.current = null; ctx.now = null; },
    speakAutoPlayEntry(text, options) { spoken.push(text); utterance = options; return () => {}; },
    window: {
      speechSynthesis: { cancel() { utterance?.onend(); } },
      setTimeout(callback) { timers.set(++timerId, callback); return timerId; },
    },
  };
  vm.createContext(ctx); vm.runInContext(compiled, ctx);
  return {
    ctx, spoken, timers,
    end() { utterance.onend(); const pending = [...timers.values()]; timers.clear(); pending.forEach(fn => fn()); },
    get utterance() { return utterance; },
    nav(direction) { ctx.autoPlayNavigateRef.current(direction); },
  };
}
const entries = [
  [9, 'A-word'], [9, 'A-translation'], [9, 'A-example'],
  [2, 'B-example'], [2, 'B-word'], [2, 'B-example-again'],
  [7, 'C-translation'],
].map(([questionIndex, text]) => ({ questionIndex, text, label: text, lang: 'en-US', voice: null, gapAfterSeconds: 1, nowPlaying: text }));
const t = setup(); t.ctx.start(entries);
t.end(); assert.equal(t.ctx.now, 'A-translation');
const stale = t.utterance;
t.nav(1); assert.equal(t.ctx.now, 'B-example');
stale.onend(); stale.onfailure(); assert.equal(t.timers.size, 0);
t.end(); assert.equal(t.ctx.now, 'B-word');
t.nav(-1); assert.equal(t.ctx.now, 'A-word');
t.nav(-1); assert.equal(t.ctx.now, 'A-word');
// A scheduled gap must not advance after manual navigation.
t.utterance.onend(); const staleTimer = [...t.timers.values()][0];
t.nav(1); staleTimer(); assert.equal(t.ctx.now, 'B-example');
t.nav(1); assert.equal(t.ctx.now, 'C-translation');
t.nav(1); assert.equal(t.ctx.playing, false); assert.equal(t.ctx.autoPlayNavigateRef.current, null);
const r = setup(true); r.ctx.start(entries); r.nav(1); r.nav(1); r.nav(1);
assert.equal(r.ctx.now, 'A-word'); assert.equal(r.ctx.playing, true);
for (let i = 0; i < 30; i++) r.nav(i % 2 ? -1 : 1);
assert.equal(r.timers.size, 0);
const single = setup(true); single.ctx.start(entries.slice(-1)); single.nav(-1); single.nav(1);
assert.equal(single.ctx.now, 'C-translation');
const oldRun = single.utterance; single.ctx.start(entries); oldRun.onend();
assert.equal(single.timers.size, 0); assert.equal(single.ctx.now, 'A-word');
// React retains the old settings object in a running playback closure.
const toggled = setup(false); toggled.ctx.start(entries.slice(-1));
toggled.ctx.autoPlaySettings = { repeat: true, playbackRatePercent: 100 };
toggled.ctx.autoPlayRepeatRef.current = true;
toggled.end();
assert.equal(toggled.ctx.playing, true, 'Turning repeat on during playback must affect the current run');
toggled.ctx.autoPlayRepeatRef.current = false;
toggled.end(); assert.equal(toggled.ctx.playing, false, 'Turning repeat off finishes the current cycle');
const cycles = setup(true); cycles.ctx.start(entries);
for (let i = 0; i < entries.length * 100; i++) cycles.end();
assert.equal(cycles.ctx.now, 'A-word'); assert.equal(cycles.timers.size, 0);
console.log('PASS: question navigation, repeated examples, shuffled order, boundaries, repeat, rapid clicks, stale speech/timers, replacement session');

// Remove all speech parts of a bookmarked question, even midway through it.
const removable = entries.map(entry => ({ ...entry, nowPlaying: { questionKey: `scope:${entry.questionIndex}`, questionText: entry.text } }));
const removal = setup(true); removal.ctx.start(removable); removal.end();
const oldSpeech = removal.utterance;
oldSpeech.onend(); const oldTimer = [...removal.timers.values()][0];
assert.equal(removal.ctx.autoPlayRemoveCurrentRef.current('scope:9'), true);
assert.equal(removal.ctx.now.questionText, 'B-example');
assert.equal(removal.ctx.autoPlayRemoveCurrentRef.current('scope:9'), false, 'A stale click must not remove the next question');
oldSpeech.onend(); oldSpeech.onfailure(); oldTimer();
assert.equal(removal.ctx.now.questionText, 'B-example'); assert.equal(removal.timers.size, 0);
removal.nav(-1); assert.equal(removal.ctx.now.questionText, 'B-example', 'Previous must skip removed questions');
removal.nav(1); assert.equal(removal.ctx.now.questionText, 'C-translation');
removal.nav(1); assert.equal(removal.ctx.now.questionText, 'B-example', 'Repeat must skip removed questions');
removal.ctx.autoPlayRemoveCurrentRef.current('scope:2');
assert.equal(removal.ctx.now.questionText, 'C-translation');
removal.ctx.autoPlayRemoveCurrentRef.current('scope:7');
assert.equal(removal.ctx.playing, false, 'Removing the final question stops, even with repeat on');
assert.equal(removal.ctx.autoPlayRemoveCurrentRef.current, null);
const lastRemoval = setup(false); lastRemoval.ctx.start(removable); lastRemoval.nav(1); lastRemoval.nav(1);
lastRemoval.ctx.autoPlayRemoveCurrentRef.current('scope:7');
assert.equal(lastRemoval.ctx.playing, false, 'Removing the last queued question honors repeat off');
console.log('PASS: review removal, all speech parts, repeat/previous, stale clicks/callbacks, last and empty queue');

// Stop uses the real App callback; resume keeps the exact shuffled queue and
// restarts the current question, including repeated examples, not question A.
const paused = setup(true); paused.ctx.start(entries); paused.nav(1); paused.end();
assert.equal(paused.ctx.now, 'B-word');
const cancelledSpeech = paused.utterance;
paused.utterance.onend(); const cancelledGap = [...paused.timers.values()][0];
paused.ctx.stop('paused', true, true);
assert.equal(paused.ctx.playing, false); assert.equal(paused.ctx.paused, true);
assert.equal(paused.ctx.now, 'B-word', 'Stopping retains displayed question');
assert.equal(paused.ctx.autoPlayNavigateRef.current, null);
assert.equal(paused.timers.size, 0);
cancelledSpeech.onend(); cancelledSpeech.onfailure(); cancelledGap();
assert.equal(paused.ctx.now, 'B-word'); assert.equal(paused.timers.size, 0);
paused.ctx.autoPlayResumeRef.current();
assert.equal(paused.ctx.now, 'B-example'); assert.equal(paused.ctx.paused, false);
assert.equal(paused.ctx.playing, true);
paused.nav(1); assert.equal(paused.ctx.now, 'C-translation', 'Resume preserves shuffled order');
for (let i = 0; i < 20; i++) { paused.ctx.stop('paused', true, true); paused.ctx.autoPlayResumeRef.current(); }
assert.equal(paused.ctx.now, 'C-translation'); assert.equal(paused.timers.size, 0);
paused.ctx.stop('settings changed');
assert.equal(paused.ctx.autoPlayResumeRef.current, null); assert.equal(paused.ctx.paused, false);
assert.equal(paused.ctx.now, null);
paused.ctx.start(entries); assert.equal(paused.ctx.now, 'A-word', 'Explicit restart starts at the beginning');
const afterRemoval = setup(true); afterRemoval.ctx.start(removable);
afterRemoval.ctx.autoPlayRemoveCurrentRef.current('scope:9');
afterRemoval.ctx.stop('paused', true, true); afterRemoval.ctx.autoPlayResumeRef.current();
assert.equal(afterRemoval.ctx.now.questionText, 'B-example');
afterRemoval.nav(-1); assert.equal(afterRemoval.ctx.now.questionText, 'B-example', 'Resume does not restore removed questions');
const completed = setup(false); completed.ctx.start(entries.slice(-1)); completed.end();
assert.equal(completed.ctx.autoPlayResumeRef.current, null, 'Natural completion clears resume position');
completed.ctx.stop('paused', true, true); assert.equal(completed.ctx.paused, false);
console.log('PASS: stop/resume at current question, shuffle retention, stale speech/gaps, rapid repeated resumes, restart, invalidation, removal and completion');
