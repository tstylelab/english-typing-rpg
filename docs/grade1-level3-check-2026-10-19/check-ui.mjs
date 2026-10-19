import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {trackTestBrowser} from '../../scripts/lib/test-browser-cleanup.mjs';
const {chromium}=createRequire(import.meta.url)('C:/Users/tsuyoshi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.TEST_URL||'http://127.0.0.1:5196';assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
const dir='docs/grade1-level3-check-2026-10-19',r=JSON.parse(fs.readFileSync(dir+'/review.json'));
const out='node_modules/.tmp/grade1-level3-inspection';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--mute-audio']});const cleanup=await trackTestBrowser(browser);
try{
 const ctx=await browser.newContext({viewport:{width:1366,height:950}}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/'+dir+'/index.html');await page.locator('article').first().waitFor();assert.equal(await page.locator('article').count(),23);
 await page.locator('#view').selectOption('existing');assert.equal(await page.locator('article').count(),80);
 const actual=await page.locator('article').evaluateAll(es=>es.map(el=>({text:el.dataset.text,meaning:el.querySelector('.ja').textContent.slice('現在の表示和訳：'.length)})));
 assert.deepEqual(actual,r.courses.flatMap(c=>c.rows.map(q=>({text:q.question.text,meaning:q.meaning}))));
 await page.locator('#view').selectOption('proposal');assert.equal(await page.locator('article').count(),120);
 const additions=await page.locator('article').evaluateAll(es=>es.map(el=>({text:el.querySelector('.en').textContent,meaning:el.querySelector('.ja').textContent,hint:el.querySelector('.hint').textContent})));
 assert.deepEqual(additions,r.courses.flatMap(c=>c.proposed.map(q=>({text:q.text,meaning:q.meaning,hint:'表現の形：'+q.formNote}))));
 await page.locator('#priority').selectOption('優先');assert.equal(await page.locator('article').count(),96);
 await page.locator('#priority').selectOption('発展');assert.equal(await page.locator('article').count(),24);
 await page.locator('#view').selectOption('targets');assert.equal(await page.locator('article').count(),8);
 await page.locator('#priority').selectOption('all');assert.equal(await page.locator('article').count(),40);
 await page.locator('#course').selectOption('Eiken1Part1');assert.equal(await page.locator('article').count(),20);
 await page.locator('#view').selectOption('proposal');assert.equal(await page.locator('article').count(),60);
 await page.locator('#search').fill('The agency may have underestimated');assert.equal(await page.locator('article').count(),1);
 await page.locator('#hide').check();assert.equal(await page.locator('article .en').isVisible(),false);assert.equal(await page.locator('article .answer').last().isVisible(),false);
 await page.reload();await page.locator('article').first().waitFor();assert.equal(await page.locator('article').count(),1);assert.equal(await page.locator('#hide').isChecked(),true);
 await page.locator('#hide').uncheck();
 for(const width of [1366,820,390,320]){await page.setViewportSize({width,height:950});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'No horizontal overflow '+width);await page.locator('article').first().scrollIntoViewIfNeeded();if([1366,390].includes(width))await page.screenshot({path:out+'/proposal-'+width+'.png'});}
 await page.setViewportSize({width:1366,height:950});await page.locator('#search').fill('');await page.locator('#view').selectOption('candidate');assert.equal(await page.locator('article').count(),11);
 await page.locator('#course').selectOption('Eiken1Part2');assert.equal(await page.locator('article').count(),12);
 const whose=page.locator('article').filter({has:page.getByText('The families whose homes were flooded received support.',{exact:true})});await whose.locator('summary').click();assert.match(await whose.innerText(),/whose/);
 for(const c of r.courses){await page.goto(base+'/?guide='+c.course.toLowerCase());await page.locator('.grammar-guide [data-grammar-card]').first().waitFor();assert.equal(await page.locator('.grammar-guide [data-grammar-card]').count(),c.cards+20);}
 assert.deepEqual(errors,[]);await ctx.close();console.log('PASS UI: all 80/120 displayed meanings and new form notes exact; 23 candidates, 40 targets, 96/24 priorities; 11/12 per-course candidates; search, hidden answer/pattern, URL reload; 1366/820/390/320 widths; current 37/41 guide cards; no JS errors.');
}finally{await cleanup();}
process.exit(0);
