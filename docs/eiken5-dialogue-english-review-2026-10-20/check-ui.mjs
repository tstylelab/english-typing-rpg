import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const {chromium}=createRequire(import.meta.url)('C:/Users/tsuyoshi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const review=JSON.parse(fs.readFileSync(path.join(here,'review.json'),'utf8'));
const base='http://127.0.0.1:5196/docs/eiken5-dialogue-english-review-2026-10-20/index.html';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--mute-audio']});
try{
 const ctx=await browser.newContext({viewport:{width:1366,height:950}}),page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.locator('article').first().waitFor();
 assert.equal(await page.locator('article').count(),129);
 assert.equal(await page.locator('.showcase .english').count(),546);
 for(const r of review.records){const article=page.locator(`article#${r.id}`);assert.equal(await article.locator('h2').textContent(),r.name);assert.deepEqual(await article.locator('.showcase .english').allTextContents(),r.lines.filter(l=>l.language==='en').map(l=>l.after));assert.deepEqual(await article.locator('.showcase .meaning').allTextContents(),r.lines.filter(l=>l.language==='en').map(l=>'意味：'+l.meaning));}
 for(const r of review.records){const response=await page.request.get('http://127.0.0.1:5196'+r.image);assert.equal(response.status(),200,r.id);assert.ok(response.headers()['content-type'].includes('image/'));}
 for(const level of ['1','2','3']){await page.locator('#level').selectOption(level);assert.equal(await page.locator('article').count(),43);assert.equal(await page.locator('.showcase .english').count(),182);}
 await page.locator('#level').selectOption('all');await page.locator('#role').selectOption('boss');assert.equal(await page.locator('article').count(),15);
 await page.locator('#role').selectOption('regular');assert.equal(await page.locator('article').count(),114);
 await page.locator('#reset').click();await page.locator('#group').selectOption('training');assert.equal(await page.locator('article').count(),60);
 await page.locator('#group').selectOption('battle');assert.equal(await page.locator('article').count(),69);
 await page.locator('#reset').click();await page.locator('#q').fill('朝ねぼうベルクロック');assert.equal(await page.locator('article').count(),1);
 await page.locator('#meaning').uncheck();assert.equal(await page.locator('.showcase .meaning').first().isVisible(),false);
 await page.locator('#before').uncheck();assert.equal(await page.locator('.showcase .old').first().isVisible(),false);
 await page.reload();await page.locator('article').first().waitFor();assert.equal(await page.locator('article').count(),1);assert.equal(await page.locator('#meaning').isChecked(),false);assert.equal(await page.locator('#before').isChecked(),false);
 await page.locator('#meaning').check();await page.locator('#before').check();
 for(const width of [1366,820,390,320]){await page.setViewportSize({width,height:950});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
 await page.setViewportSize({width:1366,height:950});await page.screenshot({path:path.join(here,'review-desktop.png')});
 await page.setViewportSize({width:390,height:844});await page.locator('article details').last().locator('summary').click();
 await page.locator('.preview-controls button').click();assert.equal(await page.locator('.play .english').textContent(),"I'm awake! Well... half awake.");
 await page.locator('.play').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(here,'review-mobile.png')});
 await page.locator('#reset').click();await page.locator('#q').fill('炎門のケルベロス');await page.locator('article details').first().locator('summary').click();
 for(const width of [820,390,320]){await page.setViewportSize({width,height:950});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
 await page.locator('#q').fill('no such monster 98765');assert.equal(await page.locator('article').count(),0);assert.equal(await page.locator('.empty').count(),1);
 assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>({local:localStorage.length,session:sessionStorage.length})),{local:0,session:0});
 await ctx.close();const result={pass:true,monsters:129,englishLines:546,images:129,widths:[1366,820,390,320],allTextAndMeaningsMatch:true,filtersSearchAndReload:true,meaningAndOriginalToggles:true,preview:true,pageErrors:errors,storageUntouched:true};fs.writeFileSync(path.join(here,'ui-verification.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
}finally{await browser.close();}
