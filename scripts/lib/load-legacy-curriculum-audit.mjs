import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
import { beforeConversationRelease } from './conversation-release-audit.mjs';

// Only frozen Eiken material audits use this released view. All Eiken data and
// modules remain live except the independently checked pick-up follow-up metadata. Conversation's current five Levels use the real loader
// in test-conversation-curriculum / listening / UI tests.
const root = fileURLToPath(new URL('../../', import.meta.url));
const cache = new Map();
export function load(relative) {
  let file = path.resolve(root, relative);
  if (!path.extname(file)) file += '.ts';
  if (cache.has(file)) return cache.get(file).exports;
  if (file.endsWith('.json')) {
    const name = path.relative(root, file).replaceAll('\\', '/');
    const source = fs.readFileSync(file, 'utf8');
    return JSON.parse(['src/data/additionalMeaningCorrections.json', 'src/data/level2PhraseReview.json'].includes(name) ? beforeConversationRelease(source, name) : source);
  }
  const module = { exports: {} }; cache.set(file, module);
  const name = path.relative(root, file).replaceAll('\\', '/');
  const current = fs.readFileSync(file, 'utf8');
  const source = ['src/data/questions.ts', 'src/data/questionMeaning.ts', 'src/data/questionExamples.ts', 'src/data/questionSynonyms.ts', 'src/data/translationBattlePrompts.ts', 'src/data/vocabularyUsageNotes.ts'].includes(name) ? beforeConversationRelease(current, name) : current;
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInNewContext(js, { module, exports: module.exports, require: name => load(path.resolve(path.dirname(file), name)) }, { filename: file });
  return module.exports;
}
