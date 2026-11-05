import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { load } from './lib/load-typescript-data.mjs';

// Execute the actual playback callback, including its guide-mode continuation.
// No browser, device settings or learner storage is accessed by this test.
const source = readFileSync('src/App.tsx', 'utf8');
const ast = ts.createSourceFile('App.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let callback;
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'speakBattleQuestion') {
    assert.ok(ts.isCallExpression(node.initializer));
    callback = node.initializer.arguments[0].getText(ast);
  }
  ts.forEachChild(node, visit);
}
visit(ast);
assert.ok(callback, 'Find the production battle playback callback');
const spoken = [];
const context = {
  speechVoices: [], speechVoiceMode: 'auto', speechRatePercent: 75,
  resolveSpeechConfig: () => ({ voice: null, lang: 'en-US' }),
  speakWithSettings: text => spoken.push({ text }),
  speakText: (text, options) => spoken.push({ text, ...options }),
};
vm.createContext(context);
vm.runInContext(ts.transpileModule(`globalThis.play = ${callback};`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText, context);
const { QUESTIONS } = load('src/data/questions.ts');
let conversation = 0, other = 0;
for (const [course, levels] of Object.entries(QUESTIONS)) {
  for (const [level, questions] of Object.entries(levels)) {
    for (const question of questions) {
      spoken.length = 0;
      context.play(question, course, 'challenge');
      assert.deepEqual(spoken.map(u => u.text), [question.text],
        `${course} Level ${level}: listening audio must match the graded English: ${question.text}`);
      assert.equal(spoken[0].onend, undefined, 'Listening must not cue an unrelated partner line afterwards');
      spoken.length = 0;
      context.play(question, course, 'guide');
      const hasDialogue = course === 'Conversation' && question.promptEn;
      assert.deepEqual(spoken.map(u => u.text), [hasDialogue ? question.promptEn : question.text]);
      if (hasDialogue) {
        spoken[0].onend();
        assert.deepEqual(spoken.map(u => u.text), [question.promptEn, question.text],
          'Guided practice retains the partner → model-answer dialogue');
        assert.equal(spoken[1].interrupt, false);
        assert.equal(spoken[1].rate, 0.75);
      }
      if (course === 'Conversation') conversation++;
      else other++;
    }
  }
}
assert.equal(conversation, 500);
assert.equal(other, 7434);
console.log(`PASS: all ${conversation} conversation items play the graded reply in listening; guide dialogue retained; ${other} other items retain playback.`);
