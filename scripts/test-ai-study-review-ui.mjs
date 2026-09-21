// Optional UI test: provide PLAYWRIGHT_MODULE when Playwright is not installed locally.
// Run against a local Vite development server; all data and clipboard calls are isolated.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const terms = JSON.parse(readFileSync(new URL('../src/data/questionSets/eiken/gradepre1-part1.json', import.meta.url), 'utf8')).levels['1'].slice(0, 20);
const url = process.env.AI_REVIEW_TEST_URL || 'http://127.0.0.1:5178';
if (!['127.0.0.1', 'localhost'].includes(new URL(url).hostname)) throw new Error('Use a local test server only');
(async () => {
 const browser = await chromium.launch({channel:'chrome',headless:true,args:['--mute-audio']});
 try {
  for(const count of [100,1000]) {
   const page = await browser.newPage({viewport:{width:1366,height:900}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{
    speechSynthesis.speak=()=>{};
    navigator.clipboard.writeText=async text=>{window.copied=text;};
    window.openCalls=[];
    window.open=(...args)=>{window.openCalls.push({args,copied:window.copied});return null;};
   });
   await page.goto(url);
   await page.getByRole('button',{name:'単語リスト',exact:true}).click();
   await page.getByRole('button',{name:/AIに学習相談/}).click();
   await page.getByRole('button',{name:'コピーしてChatGPTを開く',exact:true}).click();
   assert.equal(await page.evaluate(()=>window.openCalls.length),0,'No data: no external tab');
   await page.keyboard.press('Escape');
   await page.evaluate(async ({count,terms})=>{
    const {AiStudyRecorder}=await import('/src/aiStudyReview.ts');
    const r=new AiStudyRecorder(localStorage.getItem('etyping_active_player_id'),localStorage);r.load();
    for(let i=0;i<count;i++){
     const q=terms[i%terms.length];
     r.start({word:q.text,meaning:q.translation,course:'EikenPre1Part1',level:1,mode:'challenge',inputMode:'text-only',answerVisible:false});
     for(const pos of [0,2])r.observe(q.text,q.text.slice(0,pos),q.text.slice(0,pos)+(q.text[pos]==='e'?'a':'e'),false);
     r.finish(false,2);
    }r.flush();
   },{count,terms});
   await page.reload();await page.getByRole('button',{name:'単語リスト',exact:true}).click();
   await page.getByRole('button',{name:'英検準1級①',exact:true}).click();
   await page.evaluate(()=>{window.writes=0;const set=Storage.prototype.setItem;Storage.prototype.setItem=function(...args){window.writes++;return set.apply(this,args);};});
   const opener=page.getByRole('button',{name:/AIに学習相談/});
   await opener.click();
   const dialog=page.getByRole('dialog',{name:'AIに学習相談'});await dialog.waitFor();
   assert.equal(await dialog.getByRole('combobox',{name:'AI相談の対象期間'}).inputValue(),'week');
   assert.ok(await dialog.getByText(`保存対象 ${count}問`,{exact:true}).isVisible());
   const originalHeight=await page.evaluate(()=>document.documentElement.scrollHeight);
   await dialog.getByRole('button',{name:'相談文を作ってコピー',exact:true}).click();
   await dialog.getByRole('status').filter({hasText:'コピーしました'}).waitFor();
   assert.equal(await page.getByRole('textbox',{name:'AIへの相談文'}).count(),0);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight),originalHeight);
   assert.equal(await page.evaluate(()=>window.writes),0,'No storage during open/copy');
   await dialog.getByRole('button',{name:'相談文を確認する'}).click();
   const report=await dialog.getByRole('textbox',{name:'AIへの相談文'}).inputValue();
   assert.equal(report,await page.evaluate(()=>window.copied));
   assert.ok(report.includes('候補15件') && report.includes('過去7日間') && report.includes('英語｜和訳・類義語') && report.includes('Tipsの件数に上限・下限は設けません'));
   assert.ok(report.includes('【3. まとめ：次の単語にも使える覚え方】'));
   assert.ok(report.length<9000, 'Twenty distinct terms yield bounded candidates and five patterns');
   for(const [name,target] of [['ChatGPT','https://chatgpt.com/'],['Gemini','https://gemini.google.com/app']]) {
    await dialog.getByRole('button',{name:`コピーして${name}を開く`,exact:true}).click();
    const last=await page.evaluate(()=>window.openCalls.at(-1));
    assert.deepEqual(last.args,[target,'_blank','noopener,noreferrer']);
    assert.equal(last.copied,report,'Copy completed before opening; prompt never included in URL');
    const link=dialog.getByRole('link',{name:`${name}を開く（開かない場合）`});
    assert.equal(await link.getAttribute('href'),target);
    assert.equal(await link.getAttribute('rel'),'noopener noreferrer');
   }
   await page.evaluate(()=>{window.open=()=>{throw new Error('test popup denied');};});
   await dialog.getByRole('button',{name:'コピーしてChatGPTを開く',exact:true}).click();
   assert.ok(await dialog.getByRole('status').filter({hasText:'コピーしました'}).isVisible());
   assert.ok(await dialog.getByRole('link').isVisible());
   assert.equal(await page.evaluate(()=>window.writes),0);
   await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
   assert.equal(await opener.evaluate(e=>e===document.activeElement),true);
   await opener.click();await dialog.waitFor();
   await page.setViewportSize({width:390,height:844});
   const bounds=await dialog.boundingBox();assert.ok(bounds.x>=0 && bounds.width<=390 && bounds.height<=844);
   assert.equal(await dialog.evaluate(e=>e.scrollWidth>e.clientWidth),false);
   if(process.env.AI_REVIEW_SCREENSHOT) await dialog.screenshot({path:process.env.AI_REVIEW_SCREENSHOT});
   await page.evaluate(()=>{navigator.clipboard.writeText=async()=>{throw new Error('test denied');};});
   const opensBefore=await page.evaluate(()=>window.openCalls.length);
   await page.evaluate(()=>{window.open=(...args)=>{window.openCalls.push({args});return null;};});
   await dialog.getByRole('button',{name:'コピーしてGeminiを開く',exact:true}).click();
   assert.equal(await page.evaluate(()=>window.openCalls.length),opensBefore,'Failed copy must not open AI');
   assert.equal(await dialog.getByRole('link').count(),0);
   await dialog.getByRole('button',{name:'相談文を作ってコピー',exact:true}).click();
   await dialog.getByRole('textbox',{name:'AIへの相談文'}).waitFor();
   assert.ok(await dialog.getByRole('status').filter({hasText:'自動コピーが使えませんでした'}).isVisible());
   await dialog.getByRole('combobox').selectOption('week');
   assert.equal(await dialog.getByRole('textbox').count(),0);
   await dialog.getByRole('button',{name:'相談文を作ってコピー',exact:true}).click();
   assert.ok((await dialog.getByRole('textbox').inputValue()).includes(`実際の記録 ${count}問`));
   await dialog.getByRole('checkbox').uncheck();assert.ok(await dialog.getByRole('status').filter({hasText:'記録を停止'}).isVisible());
   await dialog.getByRole('button',{name:'閉じる',exact:true}).click();await dialog.waitFor({state:'detached'});
   const lastRow=page.locator('.question-list-row').last();await lastRow.scrollIntoViewIfNeeded();
   assert.ok(await lastRow.isVisible());await lastRow.getByRole('checkbox').check();
   assert.ok(await lastRow.getByText('選択中',{exact:true}).isVisible());
   assert.deepEqual(errors,[]);console.log(`PASS ${count}: copy, lazy preview, zero writes, stable background, close/reopen/Escape/focus, mobile, fallback, period, opt-out, offscreen row interaction`);
   await page.close();
  }
 } finally {await browser.close();}
})();
