import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {load} from '../../scripts/lib/load-typescript-data.mjs';
import {trackTestBrowser} from '../../scripts/lib/test-browser-cleanup.mjs';
import {withLegacyPre2Level3} from '../../scripts/lib/legacy-pre2-question-snapshot.mjs';
const dir=path.dirname(fileURLToPath(import.meta.url));
const p=JSON.parse(fs.readFileSync(path.join(dir,'proposal.json'),'utf8'));
const sha=v=>createHash('sha256').update(v).digest('hex');
const {QUESTIONS}=load('src/data/questions.ts');
const integrated=fs.existsSync(path.join(dir,'release.json'));
assert.equal(sha(JSON.stringify(integrated?withLegacyPre2Level3(QUESTIONS):QUESTIONS)),p.sourceQuestionsSha256,'All scopes outside the approved rebuild stay unchanged');
if(!integrated)assert.equal(sha(fs.readFileSync(path.resolve(dir,'../../src/data/translationBattlePrompts.json'))),p.sourcePromptsSha256,'Live prompts must stay unchanged before approval');
const originalQuestions=withLegacyPre2Level3(QUESTIONS).EikenPre2[3];
assert.equal(p.status,'proposal-only');
assert.equal(p.existing.length,173);assert.equal(p.proposed.length,158);
assert.equal(new Set(p.existing.map(q=>q.number)).size,173);
assert.equal(new Set(p.proposed.map(q=>q.text)).size,158);
assert.equal(p.existing.filter(q=>q.status==='keep').length,93);
assert.equal(p.existing.filter(q=>q.status==='remove').length,66);
assert.equal(p.existing.filter(q=>q.status==='rewrite').length,14);
assert.equal(p.proposed.filter(q=>q.origin==='add').length,51);
for(const q of p.existing){
 const current=originalQuestions[q.number-1];assert.equal(q.text,current.text);assert.equal(q.translation,current.translation);assert.ok(q.reason);
 const matching=p.proposed.filter(v=>v.sourceNumber===q.number);
 assert.equal(matching.length,q.status==='remove'?0:1);
 if(q.status==='keep')assert.equal(matching[0].text,q.text);
 if(q.status==='rewrite')assert.notEqual(matching[0].text,q.text);
}
for(const t of p.topics)assert.equal(p.proposed.filter(q=>q.topic===t.id).length,t.total);
console.log('PASS: 173 explicit decisions; 93 kept, 66 removed, 14 rewritten, 51 added; 158 unique targets / 31 fields; original snapshot preserved.');
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--mute-audio']});
const cleanup=await trackTestBrowser(browser),out=path.resolve(dir,'../../node_modules/.tmp/pre2-grammar-proposal');fs.mkdirSync(out,{recursive:true});
try{
 const context=await browser.newContext({viewport:{width:1366,height:1000}}),page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base=process.env.TEST_URL||'http://127.0.0.1:5196';
 await page.goto(base+'/docs/pre2-level3-grammar-proposal-2026-10-19/index.html');
 await page.locator('.card').first().waitFor();assert.equal(await page.locator('.card').count(),158);
 await page.screenshot({path:path.join(out,'desktop.png')});
 await page.locator('#topic').selectOption('11');assert.equal(await page.locator('.card').count(),4);
 await page.locator('#hide').check();assert.equal(await page.locator('.answer').first().evaluate(el=>getComputedStyle(el).visibility),'hidden');
 await page.locator('#hide').uncheck();await page.locator('#search').fill('locking');assert.equal(await page.locator('.card').count(),1);
 await page.locator('#search').fill('');await page.locator('#topic').selectOption('all');await page.locator('#kind').selectOption('add');assert.equal(await page.locator('.card').count(),51);
 await page.locator('[data-view=existing]').click();assert.equal(await page.locator('.card').count(),173);
 await page.locator('#kind').selectOption('remove');assert.equal(await page.locator('.card').count(),66);
 await page.locator('#kind').selectOption('rewrite');assert.equal(await page.locator('.pair').count(),14);
 await page.locator('[data-view=coverage]').click();assert.equal(await page.locator('tbody tr').count(),31);
 await page.locator('tbody a[href*="topic=11"]').click();await page.locator('.card').first().waitFor();assert.equal(await page.locator('.card').count(),4);
 await page.reload();await page.locator('.card').first().waitFor();assert.equal(await page.locator('#topic').inputValue(),'11');
 for(const width of [820,390,320]){
  await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  if(width===390)await page.screenshot({path:path.join(out,'mobile.png'),fullPage:true});
 }
 await page.locator('[data-view=coverage]').click();await page.locator('#topic').selectOption('all');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);await context.close();console.log('PASS review UI: filters, before/after, 31 fields, answer hiding, URL/reload, 1366/820/390/320px and no JS errors.');
}finally{await cleanup();}
process.exit(0);
