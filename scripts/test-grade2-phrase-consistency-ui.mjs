import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { load } from './lib/load-typescript-data.mjs';
import { trackTestBrowser } from './lib/test-browser-cleanup.mjs';

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { QUESTIONS } = load('src/data/questions.ts');
const { getTranslationBattlePrompt } = load('src/data/translationBattlePrompts.ts');
const { getQuestionSynonymLabels } = load('src/data/questionSynonyms.ts');
const { getQuestionMeaning } = load('src/data/questionMeaning.ts');
const { getVocabularyUsageNote } = load('src/data/vocabularyUsageNotes.ts');
const qs=QUESTIONS.Eiken2[2], key=q=>`Eiken2:2:${q.text}:${q.translation}`;
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--mute-audio']});
const cleanup=await trackTestBrowser(browser);
let count=0;
try {
  for(const width of [390,820]) for(const text of ['as long as','speak out','come up with','come across','one by one','look through','prohibit A from doing','pick up']) {
    const q=qs.find(q=>q.text===text), expected=getQuestionSynonymLabels('Eiken2',2,q);
    const context=await browser.newContext({viewport:{width,height:width===390?844:1180}});
    try {
      await context.addInitScript(({qs,q})=>{
        Math.random=()=>0;window.testNow=100000;Date.now=()=>window.testNow;
        Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{cancel(){},resume(){},getVoices:()=>[],addEventListener(){},removeEventListener(){},speak(){}}});
        Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:class{constructor(text){this.text=text;}}});
        if(sessionStorage.getItem('phrase-fixture'))return;
        sessionStorage.setItem('phrase-fixture','1');
        const key=q=>`Eiken2:2:${q.text}:${q.translation}`;
        const statuses=Object.fromEntries(qs.map(x=>[key(x),{practiceLevel:1,listeningLevel:1,battleLevel:1,excluded:x.text!==q.text,updatedAt:123}]));
        const marks={'Eiken2:2':[key(q)]};
        const data={manualQuestionStatuses:statuses,markedQuestionKeysByScope:marks,defeatedMonsterIds:['Eiken5:1:challenge:text-only:c1_1']};
        localStorage.setItem('etyping_external_keyboard_mode','true');
        localStorage.setItem('etyping_last_selected_course',JSON.stringify({difficulty:'Eiken2',level:2,resumeMode:'challenge',resumeInputMode:'text-only'}));
        localStorage.setItem('etyping_manual_question_statuses',JSON.stringify(statuses));
        localStorage.setItem('etyping_marked_question_keys_by_scope',JSON.stringify(marks));
        localStorage.setItem('etyping_defeated_monsters',JSON.stringify(data.defeatedMonsterIds));
        localStorage.setItem('etyping_player_profiles',JSON.stringify([{id:'phrase-check',name:'検証用',updatedAt:123,data},{id:'other-player',name:'保持対象',updatedAt:123,data:{maxKeystrokes:987,defeatedMonsterIds:data.defeatedMonsterIds}}]));
        localStorage.setItem('etyping_active_player_id','phrase-check');
      },{qs,q});
      const page=await context.newPage();page.setDefaultTimeout(15000);
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(process.env.TEST_URL||'http://127.0.0.1:5212/');
      await page.getByRole('button',{name:'教材を選ぶ',exact:true}).first().click();
      await page.getByRole('button',{name:'学習方法を選ぶ',exact:true}).click();
      await page.locator('.journey-mode-start').filter({has:page.getByRole('heading',{name:'和訳バトル',exact:true})}).click();
      const input=page.locator('.battle-input');await input.waitFor();
      const other=await page.evaluate(()=>JSON.parse(localStorage.getItem('etyping_player_profiles')).find(p=>p.id==='other-player').data);
      const hints=getTranslationBattlePrompt(q,'Eiken2',2)?.alternatives??[];
      if(hints.length){const before=await page.locator('.battle-vocabulary-synonyms').innerText();for(const e of hints){assert.ok(before.includes(e.text));assert.ok(before.includes(e.note));}assert.ok(before.includes('類義・関連'));}
      else assert.equal(await page.locator('.battle-vocabulary-synonyms').count(),0,'No hints added to pick up');
      const meaning=getQuestionMeaning(q,'Eiken2');
      assert.ok((await page.locator('.battle-translation').innerText()).includes(meaning));
      const note=getVocabularyUsageNote('Eiken2',2,q);
      if(note)assert.equal(await page.getByText(note,{exact:true}).count(),0,'Feedback supplement never leaks before answering');
      if(text==='speak out')await page.getByRole('button',{name:'音声をもう一度再生',exact:true}).click();
      await input.fill(q.text[0]);await page.evaluate(()=>window.testNow+=10000);await page.keyboard.type(q.text.slice(1));
      const previous=page.locator('.battle-previous-study');await previous.waitFor();
      const feedback=await previous.innerText();
      for(const label of expected)assert.ok(feedback.includes(label),text+': previous feedback includes '+label);
      if(note)assert.ok(feedback.includes(note));
      assert.ok(feedback.includes(meaning));
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'No horizontal overflow during battle');
      for(let i=0;i<12&&await input.isVisible();i++){
        await page.getByRole('button',{name:'この問題をスキップ',exact:true}).click();
        await page.waitForTimeout(100);
      }
      const results=page.locator('[data-result-question]');await results.first().waitFor();
      const answered=results.first();const resultText=await answered.innerText();
      for(const label of expected)assert.ok(resultText.includes(label),text+': result includes '+label);
      assert.ok(resultText.includes(meaning));if(note)assert.ok(resultText.includes(note));
      if(text==='speak out')assert.ok(resultText.includes('音声ヒント'));
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'No horizontal overflow in results');
      assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('etyping_player_profiles')).find(p=>p.id==='other-player').data),other);
      assert.ok(await page.evaluate(k=>JSON.parse(localStorage.getItem('etyping_marked_question_keys_by_scope'))['Eiken2:2'].includes(k),key(q)));
      await page.reload();await page.getByRole('button',{name:'教材を選ぶ',exact:true}).first().waitFor();
      assert.ok(await page.evaluate(k=>JSON.parse(localStorage.getItem('etyping_marked_question_keys_by_scope'))['Eiken2:2'].includes(k),key(q)),'Original review key survives reload');
      assert.deepEqual(errors,[]);console.log('PASS',++count,width,text);
    }finally{await context.close();}
  }
}finally{await cleanup();}
console.log(`PASS: ${count} isolated phone/tablet cases; before/after/result, audio-hint result, notes, original keys, other player and layout.`);
process.exit(0);
