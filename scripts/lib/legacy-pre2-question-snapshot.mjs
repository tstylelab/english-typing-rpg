import {load} from './load-typescript-data.mjs';
// Historical prompt audits refer to the 173-question curriculum before the approved rebuild.
// Substitute only that scope; all other current scopes must still match their recorded hashes.
export function withLegacyPre2Level3(questions){
 const {legacyPre2Sentences}=load('src/data/questionSets/eiken/pre2.ts');
 return {...questions,EikenPre2:{...questions.EikenPre2,3:legacyPre2Sentences}};
}
