import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const questions=JSON.parse(readFileSync(new URL('../src/data/questionSets/eiken/grade5.json',import.meta.url),'utf8')).levels['1'];
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({channel:'chrome',headless:true,args:['--mute-audio']});
try {
 for (const config of [{external:true,android:false},{external:false,android:false},{external:true,android:true}]) {
 const page = await browser.newPage(config.android ? {userAgent:'Mozilla/5.0 (Linux; Android 13; Tablet) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36'} : {});
 await page.addInitScript(({questions,config}) => {
   speechSynthesis.speak=()=>{};
   localStorage.setItem('etyping_external_keyboard_mode',String(config.external));
   localStorage.setItem('etyping_manual_question_statuses',JSON.stringify(Object.fromEntries(questions.map(q=>[`Eiken5:1:${q.text}:${q.translation}`,{practiceLevel:1,listeningLevel:1,battleLevel:1,manualOverrideLevel:null,excluded:q.text!=='apple',updatedAt:0}]))));
 },{questions,config});
 await page.goto('http://127.0.0.1:5178');
 await page.getByRole('button',{name:'教材を選んではじめる',exact:true}).click();
 await page.getByRole('button',{name:'決定',exact:true}).click();
 await page.getByRole('button',{name:/Basic Training/}).click();
 await page.locator('.battle-input').waitFor();
 await page.keyboard.press('a');
 await page.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'p',code:'KeyP',bubbles:true,cancelable:true})));
 await page.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keyup',{key:'p',code:'',bubbles:true,cancelable:true})));
 assert.equal(await page.locator('.battle-input').inputValue(),'ap','A changed keyup code must not type the same key twice');
 await page.keyboard.down('p');
 await page.keyboard.down('p');
 assert.equal(await page.locator('.battle-input').inputValue(),'app','Holding one key must not add repeated characters');
 await page.keyboard.up('p');
 await page.keyboard.press('Backspace');
 await page.keyboard.press('Backspace');
 for (const key of ['Process','ａ']) {
   await page.evaluate(key=>window.dispatchEvent(new KeyboardEvent('keydown',{key,code:'KeyA',isComposing:true,bubbles:true,cancelable:true})),key);
   await page.evaluate(key=>window.dispatchEvent(new KeyboardEvent('keyup',{key,code:'KeyA',isComposing:true,bubbles:true,cancelable:true})),key);
   assert.equal(await page.locator('.battle-input').inputValue(),'a','IME/full-width physical press is accepted once');
   await page.keyboard.press('Backspace');
 }
 await page.keyboard.press('Backspace');
 for(let q=0;q<1;q++) {
   const word=(await page.locator('.battle-question-text').textContent()).replaceAll('\u00a0',' ');
   console.log('Typing',JSON.stringify(word));
   for(let i=0;i<word.length;i++) {
     await page.keyboard.type(word[i]);
     if(i<word.length-1) assert.equal(await page.locator('.battle-input').inputValue(),word.slice(0,i+1));
   }
   await page.waitForTimeout(350);
 }
 console.log('PASS physical typing',config);
 await page.close();
 }
} finally {await browser.close();}
