import {withLegacyPre2Level3} from './legacy-pre2-question-snapshot.mjs';
import {load} from './load-typescript-data.mjs';
// Reconstruct only explicitly reviewed historical scopes for immutable old audit reports.
export function withHistoricalReviewedQuestions(questions){
 const restored=withLegacyPre2Level3(questions);
 const {legacyGrade5Sentences}=load('src/data/questionSets/eiken/grade5.ts');
 return {...restored,Eiken5:{...restored.Eiken5,3:legacyGrade5Sentences}};
}
