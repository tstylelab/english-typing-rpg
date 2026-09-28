import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--mute-audio']});
try {
  for (const width of [1366,390,320]) {
    const context=await browser.newContext({viewport:{width,height:900}});
    const page=await context.newPage();const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>{
      window.spoken=[];
      speechSynthesis.speak=u=>window.spoken.push(u);
      speechSynthesis.cancel=()=>{};
      if(!sessionStorage.getItem('autoplay-test-seeded')) {
        localStorage.setItem('etyping_auto_play_settings',JSON.stringify({source:'all',playText:true,playTranslation:false,playExample:false,repeat:false,shuffle:false}));
        sessionStorage.setItem('autoplay-test-seeded','1');
      }
    });
    await page.goto(process.env.TEST_URL || 'http://127.0.0.1:5178');
    await page.getByRole('button',{name:'連続再生の設定',exact:true}).click();
    const start=page.getByRole('button',{name:'この設定で連続再生を開始',exact:true});
    const controls=page.getByRole('group',{name:'リピート・シャッフル',exact:true});
    const repeat=controls.getByRole('checkbox',{name:'リピート再生',exact:true});
    const shuffle=controls.getByRole('checkbox',{name:'シャッフル再生',exact:true});
    assert.ok(await repeat.isVisible());assert.ok(await shuffle.isVisible());
    const details=page.locator('details').filter({has:page.locator('summary').filter({hasText:'速度・間隔の設定'})});
    assert.equal(await details.count(),1);assert.equal(await details.evaluate(el=>el.open),false);
    assert.equal(await details.getByRole('checkbox').count(),0);
    await controls.scrollIntoViewIfNeeded();
    const a=await start.boundingBox(),b=await controls.boundingBox();
    assert.ok(b.y>=a.y+a.height && b.y-a.y-a.height<30,'Controls directly below start');
    assert.ok(await controls.evaluate(el=>el.scrollWidth<=el.clientWidth+1));
    await start.click();
    assert.ok(await page.evaluate(()=>window.spoken.length>0));
    await repeat.check();await shuffle.check();
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('etyping_auto_play_settings')).repeat),true);
    const previous=await page.evaluate(()=>window.spoken.length);
    await page.getByRole('button',{name:'次の用語 →',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.spoken.length),previous+1);
    await page.getByRole('button',{name:'停止',exact:true}).click();
    assert.equal(await start.isEnabled(),true);
    await page.reload();await page.getByRole('button',{name:'連続再生の設定',exact:true}).click();
    assert.equal(await repeat.isChecked(),true);assert.equal(await shuffle.isChecked(),true);
    if(process.env.AUTOPLAY_SCREENSHOT_DIR) {
      await controls.scrollIntoViewIfNeeded();
      await page.screenshot({path:process.env.AUTOPLAY_SCREENSHOT_DIR+`/autoplay-controls-${width}.png`});
    }
    assert.deepEqual(errors,[]);
    console.log(`PASS ${width}px: visible controls beneath start, collapsed speed/gap, playback/stop/navigation, saved preferences`);
    await context.close();
  }
} finally {await browser.close();}
