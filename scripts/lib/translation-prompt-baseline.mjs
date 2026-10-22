import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {load} from './load-typescript-data.mjs';
// Original display adapter, with only this review's precedence removed.
const source=fs.readFileSync('src/data/questionMeaning.ts','utf8')
 // Later Grade 2 headword glosses are independent of the historical review.
 .replace(/^import grade2VocabularyCorrections.*\r?\n/m,'')
 .replace(/\/\/ Broaden the Grade 2 headword gloss[^\n]*\r?\n\/\/ or the same question[^\n]*\r?\nconst grade2VocabularyMeanings[^\n]*\r?\n/,'')
 .replace(/  \(difficulty === 'Eiken2' \? grade2VocabularyMeanings.get\(identity\(question\)\) : undefined\)\r?\n  \?\? getReviewedTranslationMeaning/,'  getReviewedTranslationMeaning')
 .replace(/^import .*getReviewedTranslationMeaning.*\r?\n/m,'')
 .replace('  getReviewedTranslationMeaning(question, difficulty)\n  ?? getGrade3VocabularyMeaning(question, difficulty)','  getGrade3VocabularyMeaning(question, difficulty)')
 .replace('  getReviewedTranslationMeaning(question, difficulty)\r\n  ?? getGrade3VocabularyMeaning(question, difficulty)','  getGrade3VocabularyMeaning(question, difficulty)');
const mod={exports:{}};
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{exports:mod.exports,require:name=>load('src/data/'+name.slice(2))});
export const getPriorMeaning=mod.exports.getQuestionMeaning;
