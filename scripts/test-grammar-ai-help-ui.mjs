import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--mute-audio']});
const url=process.env.TEST_URL || 'http://127.0.0.1:5178';
try {
  for (const course of ['eiken4','eiken5']) for (const width of [1366,390,320]) {
    const context=await browser.newContext({viewport:{width,height:900}});
    const page=await context.newPage();
    const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>{
      speechSynthesis.speak=()=>{};
      window.opens=[];window.copied='';
      window.open=(...args)=>{window.opens.push({args,text:window.copied});return null;};
      navigator.clipboard.writeText=async text=>{window.copied=text;};
    });
    await page.goto(url+'/?guide='+course);
    const guide=page.getByRole('dialog');await guide.waitFor();
    const id=course==='eiken4'?'must':'be';
    const card=guide.locator(`[data-grammar-card="${id}"]`);
    await guide.locator(`[data-grammar-target="${id}"]`).click();
    const initialSave=await page.evaluate(()=>JSON.stringify({...localStorage}));
    assert.equal(await guide.locator('.grammar-ai-actions').count(),0,'No action panels or prompts on initial render');
    const help=card.locator('.grammar-ai-help');
    const summary=help.locator(':scope > summary');
    await summary.click();
    const safety=help.locator('.grammar-ai-safety');
    assert.equal(await safety.evaluate(el=>el.open),false,'Detailed terms start collapsed');
    assert.equal(await safety.locator('p').isVisible(),false);
    await safety.locator('summary').click();
    assert.ok(await safety.locator('p').isVisible());
    await safety.locator('summary').click();
    assert.equal(await safety.locator('p').isVisible(),false);
    assert.ok(await help.getByRole('button',{name:'質問文をコピー',exact:true}).isVisible(),'Closing terms keeps AI actions open');
    if (process.env.GRAMMAR_SCREENSHOT_DIR && width===390)
      await page.screenshot({path:process.env.GRAMMAR_SCREENSHOT_DIR+'/'+course+'-grammar-ai-compact.png'});
    assert.equal(await help.getByRole('textbox').count(),0,'No prompt generation on expansion');
    await help.getByRole('button',{name:'質問文を確認する',exact:true}).click();
    const text=await help.getByRole('textbox').inputValue();
    assert.ok(text.includes(`英検${course==='eiken4'?'4級':'5級'}に挑戦する学習者`));
    assert.ok(!text.includes('小学生にも分かる'));
    assert.ok(text.includes('参考書の一節') && text.includes('基本ルールと作り方'));
    assert.ok(!text.includes('400字') && !text.includes('確認問題を1問'));
    assert.ok(await help.getByText('この文法を詳しく学ぶ質問文をコピーします。貼り付け・送信はご自身で。',{exact:true}).isVisible());
    assert.ok(text.includes(course==='eiken4'?'must・have to':'be動詞'));
    assert.equal(await page.evaluate(()=>window.copied),'','Preview does not touch clipboard');
    await help.getByRole('button',{name:'質問文を閉じる',exact:true}).click();
    await help.getByRole('button',{name:'質問文をコピー',exact:true}).click();
    await help.getByRole('status').filter({hasText:'コピーしました'}).waitFor();
    assert.equal(await page.evaluate(()=>window.copied),text);
    for (const [target,href] of [['ChatGPT','https://chatgpt.com/'],['Gemini','https://gemini.google.com/app']]) {
      await help.getByRole('button',{name:`コピーして${target}を開く`,exact:true}).click();
      await help.getByRole('status').filter({hasText:target}).waitFor();
      const last=await page.evaluate(()=>window.opens.at(-1));
      assert.deepEqual(last.args,[href,'_blank','noopener,noreferrer']);
      assert.equal(last.text,text,'Copy before navigation; no prompt in URL');
      assert.equal(await help.getByRole('link',{name:`${target}を開く（開かない場合）`}).getAttribute('href'),href);
    }
    await page.evaluate(()=>{navigator.clipboard.writeText=async()=>{throw Error('denied');};});
    const openCount=await page.evaluate(()=>window.opens.length);
    await help.getByRole('button',{name:'コピーしてChatGPTを開く',exact:true}).click();
    await help.getByRole('status').filter({hasText:'自動コピーが使えませんでした'}).waitFor();
    assert.equal(await help.getByRole('textbox').inputValue(),text);
    assert.equal(await page.evaluate(()=>window.opens.length),openCount);
    assert.equal(await help.getByRole('link',{name:/開かない場合/}).count(),0);
    assert.ok(await card.evaluate(el=>el.scrollWidth<=el.clientWidth+1));
    assert.ok(await guide.evaluate(el=>el.scrollWidth<=el.clientWidth+1));
    assert.equal(await page.evaluate(()=>JSON.stringify({...localStorage})),initialSave);
    if (process.env.GRAMMAR_SCREENSHOT_DIR && width===390)
      await card.screenshot({path:process.env.GRAMMAR_SCREENSHOT_DIR+'/'+course+'-grammar-ai-mobile.png'});
    await summary.click();await summary.click();
    await page.evaluate(()=>{navigator.clipboard.writeText=text=>new Promise(resolve=>{window.finishCopy=()=>{window.copied=text;resolve();};});});
    await help.getByRole('button',{name:'コピーしてChatGPTを開く',exact:true}).click();
    await summary.click();
    await page.evaluate(()=>window.finishCopy());
    assert.equal(await page.evaluate(()=>window.opens.length),openCount,'No late popup after closing');
    await page.keyboard.press('Escape');await guide.waitFor({state:'detached'});
    assert.deepEqual(errors,[]);
    console.log('PASS '+course+' '+width+'px: lazy preview, copy, fixed safe URLs, fallback, no late popup, unchanged storage');
    await context.close();
  }
} finally {await browser.close();}
