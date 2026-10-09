import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {load} from './lib/load-typescript-data.mjs';
const {QUESTIONS}=load('src/data/questions.ts');
const {getGrade3VocabularyMeaning,getGrade3VocabularyAnswerCue}=load('src/data/grade3VocabularyPrompts.ts');
const a=JSON.parse(fs.readFileSync('src/data/grade3Level1Prompts.json','utf8'));
const qs=QUESTIONS.Eiken3[1];assert.equal(qs.length,514);assert.equal(a.length,247);
assert.equal(createHash('sha256').update(JSON.stringify(qs)).digest('hex'),'1514b432902ba3931d3cf618afa76ca02bc10f35df8bfcc1e349b86fdecb1552');
for(const e of a){assert.equal(getGrade3VocabularyMeaning(e,'Eiken3'),e.meaning);assert.equal(getGrade3VocabularyMeaning(e,'Conversation'),undefined);}
for(const q of qs)assert.equal(getGrade3VocabularyAnswerCue(q,'Eiken3',1),undefined);
console.log('PASS 514 preserved Grade 3 vocabulary identities, 247 historical meanings, spelling cues retired.');
