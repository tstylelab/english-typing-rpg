import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {load} from './lib/load-typescript-data.mjs';
import {getPriorMeaning} from './lib/translation-prompt-baseline.mjs';
const dir='docs/pre2-level3-grammar-proposal-2026-10-19';
const p=JSON.parse(fs.readFileSync(dir+'/proposal.json','utf8'));
const {QUESTIONS}=load('src/data/questions.ts');
const sha=v=>createHash('sha256').update(v).digest('hex');
assert.equal(sha(JSON.stringify(QUESTIONS)),p.sourceQuestionsSha256,'Run only against the approved source curriculum');
const file='src/data/translationBattlePrompts.json';
assert.equal(sha(fs.readFileSync(file)),p.sourcePromptsSha256);
const patterns=[
 'have / has + 過去分詞 ／ 動詞の過去形','have / has been + 動詞ing','had + 過去分詞',
 'must / might / could / cannot + 動詞の原形','助動詞 + be + 過去分詞','be動詞 + being + 過去分詞',
 '動詞 + 人 + to + 原形','It is + 形容詞 + (for 人) + to + 原形','動詞 + to不定詞 / 動名詞',
 '前置詞 + 動名詞 ／ used to + 原形','stop / remember + to不定詞 / 動名詞',
 'let / make / help + 人 + 原形','see / hear / watch + 人 + 原形 / 動詞ing','動詞 + 目的語 + 補語',
 '名詞 + 動詞ing / 過去分詞','名詞 + who / which / that + 節','名詞 + whose + 名詞 + 動詞',
 '場所 / 時 + where / when + 節','疑問詞 + 主語 + 動詞 ／ 疑問詞 + to + 原形','if / whether + 主語 + 動詞',
 'as ... as ／ 比較級 + than ／ 最上級','too + 形容詞 + to ／ 形容詞 + enough + to',
 'if / when / before など + 主語 + 現在形','because / although / while / but + 節',
 'so that + 節 ／ so + 形容詞 + that + 節','If + 過去形, 主語 + would + 原形',
 'wish / as if + 主語 + 過去形 / could','said / told / asked + 内容の節','動詞 / be動詞 + that節',
 'neither / so + 助動詞 + 主語 ／ both A and B','Would you mind + 動詞ing? ／ Do you mind if + 文?'
];
const hints=['完了形と過去形','現在完了進行形','過去完了','助動詞による推量','助動詞と受け身','進行形の受け身','人に行動を求める形','仮の主語と不定詞','不定詞・動名詞','前置詞の後ろ・過去の習慣との比較','後ろの形で変わる意味','人に行動させる・助ける形','知覚動詞の後ろの形','目的語の状態を説明する形','分詞による名詞の説明','関係代名詞','所有を表す関係詞','場所・時を説明する関係詞','間接疑問の語順','〜かどうかを表す節','比較の形','程度と不定詞','時・条件を表す節','理由・譲歩・対比','目的と結果の表し分け','現実と違う仮定','現実と違う願い・様子','発言・質問を伝える形','内容を表す節と否定の範囲','並列・省略・同意の語順','依頼と許可の区別'];
const cardByTopic=['perfect-experience-result','perfect-continuous','past-perfect','modal-inference','passive','passive','object-to','it-to','infinitive-gerund-choice','preposition-ing','stop-remember','help-action','perception','object-complement','participle','relative','whose','where-when','indirect-question','indirect-if','comparison','too-enough','condition','connectors','purpose-result','unreal','wish-asif','reported','opinion','addition','mind'];
const assignments={};
const oldAssignments=load('src/data/pre2GrammarAssignments.ts').pre2GrammarAssignments;
const foundation=new Set(['01','05','07','08','09','10','12','16','21','22','23']);
const advanced=new Set(['03','11','26','27','28']);
const runtime=p.proposed.map(q=>{
 const t=p.topics.find(t=>t.id===q.topic),index=Number(q.topic)-1;
 const old=q.origin==='keep'?p.existing.find(e=>e.number===q.sourceNumber):null;
 const question={text:q.text,translation:old?.translation??q.ja,grammarPoint:{label:hints[index],pattern:patterns[index],note:q.focus+(q.comparison?' '+q.comparison:'')}};
 let band=foundation.has(q.topic)?1:advanced.has(q.topic)?3:2;
 if(old&&[149,162,171].includes(old.number))band=3;
 let card=old?oldAssignments[q.text]:cardByTopic[index];
 if(q.text==='I lost my key yesterday.'||q.text.startsWith('I have lost my key'))card='perfect-past';
 if(q.topic==='09'&&q.text.startsWith('There is no reason'))card='noun-infinitive';
 if(q.topic==='09'&&q.text.startsWith('Taking the bus'))card='gerund-subject';
 if(q.topic==='10'&&q.text==='I used to walk to school.')card='used-to';
 if(q.topic==='30'&&q.text.includes('can I.'))card='neither';
 if(q.topic==='30'&&q.text.startsWith('Both '))card='both-and';
 if(q.topic==='24'&&q.text.includes('because'))card='reasons';
 if(q.topic==='29'&&q.text.startsWith('One advantage'))card='reasons';
 assignments[q.text]=card;
 return {band,topic:q.topic,question};
});
const prompts=JSON.parse(fs.readFileSync(file,'utf8'));
for(const q of p.proposed.filter(q=>q.origin!=='keep')){
 const question=runtime.find(e=>e.question.text===q.text).question;
 assert.ok(!prompts.some(e=>e.course==='EikenPre2'&&e.level===3&&e.text===q.text));
 prompts.push({course:'EikenPre2',level:3,text:q.text,translation:question.translation,previousMeaning:getPriorMeaning(question,'EikenPre2'),meaning:q.ja,alternatives:[],contrasts:[],formNote:hints[Number(q.topic)-1],reason:'承認済み文法再編案：'+q.focus});
}
fs.writeFileSync('src/data/questionSets/eiken/pre2GrammarCurriculum.json',JSON.stringify(runtime,null,2)+'\n');
fs.writeFileSync('src/data/pre2GrammarCurriculumAssignments.json',JSON.stringify(assignments,null,2)+'\n');
fs.writeFileSync(file,JSON.stringify(prompts,null,2)+'\n');
fs.writeFileSync(dir+'/release.json',JSON.stringify({status:'approved-runtime',approvedDate:'2026-10-19',counts:p.counts,sourceQuestionsSha256:p.sourceQuestionsSha256,sourcePromptsSha256:p.sourcePromptsSha256,retained:p.proposed.filter(q=>q.origin==='keep').map(q=>q.text),newTargets:p.proposed.filter(q=>q.origin!=='keep').map(q=>q.text),bands:[1,2,3].map(b=>runtime.filter(e=>e.band===b).length)},null,2)+'\n');
console.log('Prepared',runtime.length,'questions;',p.counts.keep,'identities retained;',p.counts.rewrite+p.counts.add,'new targets. Bands', [1,2,3].map(b=>runtime.filter(e=>e.band===b).length));
