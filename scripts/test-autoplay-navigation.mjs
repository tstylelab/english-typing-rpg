import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Exercise the actual playback function with controlled speech and timers.
const source = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const body = source.slice(source.indexOf('  const startAutoPlaySequence = ('), source.indexOf('  const startAutoPlayForQuestions = ('));
const compiled = ts.transpile(body + '\nglobalThis.start = startAutoPlaySequence;', { target: ts.ScriptTarget.ES2022 });
function setup(repeat = false) {
  let utterance;
  let timerId = 0;
  const timers = new Map();
  const spoken = [];
  const ctx = {
    autoPlayRunIdRef: { current: 0 }, autoPlayNavigateRef: { current: null },
    autoPlayTimeoutRef: { current: null }, autoPlayWakeLockWantedRef: { current: false },
    autoPlaySettings: { repeat, playbackRatePercent: 100 },
    MIN_AUTO_PLAY_QUESTION_GAP_SECONDS: 0.3, MIN_AUTO_PLAY_ITEM_GAP_SECONDS: 0.3,
    clearAutoPlayTimeout() { timers.delete(ctx.autoPlayTimeoutRef.current); ctx.autoPlayTimeoutRef.current = null; },
    setAutoPlayNowPlaying(value) { ctx.now = value; },
    setIsAutoPlaying(value) { ctx.playing = value; },
    setAutoPlayStatusText() {}, requestAutoPlayWakeLock() {}, releaseAutoPlayWakeLock() {},
    stopAutoPlay() { ctx.playing = false; },
    speakText(text, options) { spoken.push(text); utterance = options; },
    window: {
      speechSynthesis: { cancel() { utterance?.onerror(); } },
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
stale.onend(); stale.onerror(); assert.equal(t.timers.size, 0);
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
console.log('PASS: question navigation, repeated examples, shuffled order, boundaries, repeat, rapid clicks, stale speech/timers, replacement session');
