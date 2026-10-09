import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {load} from './load-typescript-data.mjs';
// Original display adapter, with only this review's precedence removed.
const source=fs.readFileSync('src/data/questionMeaning.ts','utf8')
 .replace(/^import .*getReviewedTranslationMeaning.*\r?\n/m,'')
 .replace('  getReviewedTranslationMeaning(question, difficulty)\n  ?? getGrade3VocabularyMeaning(question, difficulty)','  getGrade3VocabularyMeaning(question, difficulty)')
 .replace('  getReviewedTranslationMeaning(question, difficulty)\r\n  ?? getGrade3VocabularyMeaning(question, difficulty)','  getGrade3VocabularyMeaning(question, difficulty)');
const mod={exports:{}};
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{exports:mod.exports,require:name=>load('src/data/'+name.slice(2))});
export const getPriorMeaning=mod.exports.getQuestionMeaning;
