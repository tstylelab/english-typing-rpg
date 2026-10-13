import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { trackTestBrowser } from './lib/test-browser-cleanup.mjs';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5178';
// Isolated fixture renders the real production dialogs. No user data or AI calls.
await mkdir('tmp/backdrop-test', { recursive: true });
await writeFile('tmp/backdrop-test/index.html', '<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root" style="padding:40px"></div><script type="module" src="/tmp/backdrop-test/main.tsx"></script></body></html>');
await writeFile('tmp/backdrop-test/main.tsx', `
import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import '/src/index.css';
import QuestionAiHelp from '/src/QuestionAiHelp';
import GrammarGuide from '/src/GrammarGuide';
import MonsterPreview from '/src/MonsterPreview';
import AiStudyReviewPanel from '/src/AiStudyReviewPanel';
import {AiStudyRecorder} from '/src/aiStudyReview';
import BackupReminder from '/src/BackupReminder';
import {useBackdropDismiss} from '/src/useBackdropDismiss';
const recorder = new AiStudyRecorder('test', localStorage);
function Overlay() {
 const [open,setOpen]=useState(true);
 const backdrop=useBackdropDismiss(()=>setOpen(false));
 return open && <div {...backdrop} style={{position:'fixed',inset:0,background:'#0009',display:'grid',placeItems:'center'}}>
  <div role="dialog" style={{background:'#123',padding:30,width:200}}><p>Inside panel</p><button onClick={()=>setOpen(false)}>Close</button></div>
 </div>;
}
const kind=new URLSearchParams(location.search).get('kind');
createRoot(document.getElementById('root')).render(<React.StrictMode>
 <button id="underneath" aria-label="underneath" style={{position:'fixed',inset:0,width:8,height:8}} onClick={()=>window.underlyingClicks++}></button>
 {kind==='question' && <QuestionAiHelp course="英検3級" level={3} text="This is the camera that I bought." meaning="これは私が買ったカメラです。" />}
 {kind==='grammar' && <GrammarGuide playerId="test" course="Eiken3" initialOpen />}
 {kind==='monster' && <MonsterPreview name="Test monster"><span>Monster</span></MonsterPreview>}
 {kind==='review' && <AiStudyReviewPanel recorder={recorder} courseLabels={{Eiken3:'英検3級'}} />}
 {kind==='backup' && <BackupReminder playerId="test" date="2026-10-13" answered={201} onExport={()=>{window.exports++;return true;}} />}
 {kind==='overlay' && <Overlay />}
</React.StrictMode>);
`);
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
const cleanup = await trackTestBrowser(browser);
try {
 for (const touch of [false,true]) {
  const context=await browser.newContext({viewport:{width:touch?390:1366,height:900},hasTouch:touch});
  const page=await context.newPage(); page.setDefaultTimeout(12000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{localStorage.clear();window.underlyingClicks=0;window.exports=0;});
  const click=async(x,y)=>touch?page.touchscreen.tap(x,y):page.mouse.click(x,y);
  for (const kind of ['question','grammar','monster','review','backup','overlay']) {
   await page.goto(base+'/tmp/backdrop-test/index.html?kind='+kind);
   // Vite may reload a newly written fixture while optimizing its imports.
   await page.waitForTimeout(1000);
   if(kind==='question') await page.getByRole('button',{name:/についてAIに相談/}).click();
   if(kind==='monster') await page.getByRole('button',{name:'Test monsterを拡大表示'}).click();
   if(kind==='review') await page.getByRole('button',{name:/AIに学習相談/}).click();
   const dialog=page.getByRole('dialog');await dialog.waitFor();
   // Let the monster's opening animation settle before measuring its padding.
   if(kind==='monster')await page.waitForTimeout(400);
   const b=await dialog.boundingBox();
   await click(b.x+5,b.y+5);
   assert.equal(await dialog.isVisible(),true,kind+' padding must stay open');
   if(touch && kind==='grammar') {
    // The existing mobile guide is full-screen; there is no exposed backdrop.
    await dialog.getByRole('button',{name:'閉じる',exact:true}).click();
    await dialog.waitFor({state:'detached'});
    console.log('PASS touch grammar: full-screen interior stays open, close button retained');
    continue;
   }
   if(!touch) {
    // Starting inside and releasing outside is selection, not dismissal.
    await page.mouse.move(b.x+8,b.y+8);await page.mouse.down();await page.mouse.move(2,2,{steps:8});await page.mouse.up();
    assert.equal(await dialog.isVisible(),true,kind+' inside-to-outside drag');
    await page.mouse.move(2,2);await page.mouse.down();await page.mouse.move(30,2,{steps:5});await page.mouse.up();
    assert.equal(await dialog.isVisible(),true,kind+' backdrop drag');
    await page.mouse.click(2,2,{button:'right'});
    assert.equal(await dialog.isVisible(),true,kind+' right click');
    await page.keyboard.press('Escape'); // close the browser context menu, if any
    // Escape may also close native dialogs; reopen this case before outside click.
    if(!await dialog.isVisible()) {
     await page.reload();
     if(kind==='question')await page.getByRole('button',{name:/についてAIに相談/}).click();
     if(kind==='monster')await page.getByRole('button',{name:'Test monsterを拡大表示'}).click();
     if(kind==='review')await page.getByRole('button',{name:/AIに学習相談/}).click();
     await dialog.waitFor();
    }
   }
   await click(2,2);await dialog.waitFor({state:'detached'});
   assert.equal(await page.evaluate(()=>window.underlyingClicks),0,'No click-through: '+kind);
   assert.equal(await page.evaluate(()=>window.exports),0,'Outside never exports: '+kind);
   if(kind==='backup') assert.equal(await page.evaluate(()=>localStorage.getItem('etyping_backup_reminder:test')),'2026-10-13');
   console.log('PASS',touch?'touch':'mouse',kind,'inside/drag protection, outside dismiss, no click-through');
  }
  assert.deepEqual(errors,[]);
  await context.close();
 }
 // Check the in-app custom overlays too, including canceling a destructive action.
 const context=await browser.newContext({viewport:{width:1366,height:900}});
 const page=await context.newPage(); await page.addInitScript(()=>{speechSynthesis.speak=()=>{};});
 await page.goto(base);
 await page.getByRole('button',{name:'今月の学習記録を見る'}).click();
 await page.getByRole('dialog').waitFor();await page.mouse.click(2,2);await page.getByRole('dialog').waitFor({state:'detached'});
 await page.getByRole('button',{name:/タイピングに慣れていない方へ/}).click();
 await page.getByRole('dialog').waitFor();await page.mouse.click(2,2);await page.getByRole('dialog').waitFor({state:'detached'});
 await page.getByRole('button',{name:'設定',exact:true}).click();
 await page.getByRole('button',{name:'履歴をリセット',exact:true}).click();
 await page.getByRole('button',{name:'Yes',exact:true}).waitFor();
 const saved=await page.evaluate(()=>JSON.stringify({...localStorage}));
 await page.mouse.click(2,2);
 await page.getByRole('button',{name:'Yes',exact:true}).waitFor({state:'detached'});
 assert.equal(await page.evaluate(()=>JSON.stringify({...localStorage})),saved,'Outside cancels reset without deleting data');
 console.log('PASS app monthly activity / first-play guide / reset cancellation');
 await context.close();
} finally {await cleanup();}
