import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({channel:'chrome',headless:true,args:['--mute-audio']});
try {
 const page=await browser.newPage({viewport:{width:1366,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  speechSynthesis.speak=()=>{};
  if(localStorage.getItem('nav-seeded'))return;
  localStorage.setItem('nav-seeded','1');
  const date=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo'}).format(new Date());
  localStorage.setItem('etyping_daily_activity_history',JSON.stringify({[date]:{answered:7,skipped:0}}));
  localStorage.setItem('etyping_defeated_monsters',JSON.stringify([
   'Eiken5:1:challenge:text-only:c1_1','Eiken4:1:challenge:text-only:c1_1',
   'Eiken4:2:challenge:text-only:c1_1','Eiken4:1:challenge:voice-only:c1_1',
   'Eiken4:1:challenge:text-only:c1_1'
  ]));
 });
 await page.goto('http://127.0.0.1:5178');
 const defeat=page.getByText('撃破数',{exact:true}).locator('../..');
 assert.match(await defeat.innerText(),/4体/);
 assert.ok(!(await defeat.innerText()).includes('129'));
 await page.getByRole('button',{name:'この敵に挑む',exact:true}).click();
 await page.locator('.battle-status-row').waitFor();
 for(const width of [1366,820,390]){
  await page.setViewportSize({width,height:900});
  const nav=await page.locator('.battle-navigation').boundingBox();
  const hp=await page.locator('.battle-hp').boundingBox();
  assert.equal(await page.locator('.battle-topbar').count(),0);
  assert.ok(nav.x>=0 && nav.x+nav.width<=width+1);
  assert.equal(await page.locator('.battle-status-row').evaluate(e=>e.scrollWidth>e.clientWidth),false);
  if(width>=640) assert.ok(nav.x<hp.x && nav.y<hp.y+hp.height && hp.y<nav.y+nav.height);
  console.log('PASS layout',width);
 }
 await page.setViewportSize({width:1366,height:900});
 await page.screenshot({path:'node_modules/.tmp/battle-navigation.png'});
 await page.getByRole('button',{name:'コース選択に戻る',exact:true}).click();
 await page.getByRole('heading',{name:'モードをえらぶ',exact:true}).waitFor();
 console.log('PASS course navigation');
 await page.getByRole('button',{name:/Basic Training/}).click();
 await page.getByRole('button',{name:'次のキーが光る',exact:true}).click();
 for(const width of [1366,820,390]){
  await page.setViewportSize({width,height:900});
  assert.equal(await page.locator('.battle-status-row').evaluate(e=>e.scrollWidth>e.clientWidth),false);
 }
 await page.getByRole('button',{name:'非表示',exact:true}).click();
 await page.setViewportSize({width:1366,height:900});
 const word=(await page.locator('.battle-question-text').textContent()).replaceAll('\u00a0',' ').trim();
 await page.locator('.battle-input').fill(word);
 await page.waitForTimeout(1000);
 for(let i=0;i<10 && await page.locator('.battle-screen').count();i++){
  await page.getByRole('button',{name:'この問題をスキップ',exact:true}).click();
  await page.waitForTimeout(150);
 }
 await page.locator('.result-today').waitFor();
 assert.match(await page.locator('.result-today').innerText(),/8問/);
 await page.getByRole('button',{name:'ホームへ',exact:true}).click();
 const daily=page.getByRole('button',{name:'今月の学習記録を見る',exact:true});
 assert.match(await daily.innerText(),/8問/);
 await page.getByRole('button',{name:'この敵に挑む',exact:true}).click();
 await page.getByRole('button',{name:'トップに戻る',exact:true}).click();
 await daily.waitFor();
 await page.waitForTimeout(1000);
 assert.equal(await page.locator('.result-today').count(),0);
 console.log('PASS guide layouts, result/title answered counts (skip excluded), top navigation');
 assert.deepEqual(errors,[]);
} finally {await browser.close();}
