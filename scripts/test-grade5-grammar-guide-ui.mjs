import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { load } from './lib/load-typescript-data.mjs';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { QUESTIONS } = load('src/data/questions.ts');
const course = process.env.TEST_GRAMMAR_COURSE || 'Eiken5';
assert.ok(['Eiken5','Eiken4'].includes(course));
const questions = QUESTIONS[course][3];
const {grammarGuides} = load('src/data/grammarGuides.ts');
const {cards,grade} = grammarGuides[course];
const is4 = course === 'Eiken4';
const slug = course.toLowerCase();
const savedId = is4 ? 'past-be' : 'be';
const secondSavedId = is4 ? 'future-will' : 'verb';
const questionId = is4 ? 'questions' : 'do-question';
const firstIds = is4 ? ['foundation','questions','noun-phrases','present-progressive','past-be','past-verb'] : ['subjects','word-types','be','word-order','demonstratives','contractions'];
const url = process.env.TEST_URL || 'http://127.0.0.1:5178';
const shots = process.env.GRAMMAR_SCREENSHOT_DIR;
const server = await chromium.launchServer({ channel:'chrome', headless:true, args:['--mute-audio'] });
const browser = await chromium.connect(server.wsEndpoint());
const bounded = async promise => {
  let timer;
  try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Cleanup timeout')), 7000); })]); }
  finally { clearTimeout(timer); }
};
let passed = false;
try {
  for (const width of [1366, 390, 320]) {
    const target = is4 ? (width === 1366 ? {text:'Ken is as tall as Tom.',id:'as'}
      : width === 390 ? {text:'I stayed home because I was sick.',id:'connectors'}
      : {text:'You must not use your phone here.',id:'must'}) : width === 1366 ? {text:"I'm a student.",id:'contractions'}
      : width === 390 ? {text:'These are books.',id:'demonstratives'}
      : {text:'Yes, I am.',id:'short-answers'};
    const context = await browser.newContext({ viewport:{width,height:900} });
    const page = await context.newPage(); page.setDefaultTimeout(15000);
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(({questions, target, course}) => {
      speechSynthesis.speak = () => {}; Math.random = () => 0;
      localStorage.setItem('etyping_external_keyboard_mode','true');
      localStorage.setItem('etyping_daily_progress',JSON.stringify({date:new Date().toISOString().slice(0,10),questionCount:1}));
      localStorage.setItem('etyping_last_selected_course',JSON.stringify({difficulty:course,level:3,resumeMode:'challenge',resumeInputMode:'text-only'}));
      localStorage.setItem('etyping_manual_question_statuses',JSON.stringify(Object.fromEntries(questions.map(q => [`${course}:3:${q.text}:${q.translation}`,{practiceLevel:1,listeningLevel:1,battleLevel:1,manualOverrideLevel:null,excluded:q.text!==target.text,updatedAt:1}]))));
    }, {questions, target, course});
    await page.goto(url + '/?guide='+slug);
    const guide = page.getByRole('dialog');
    try { await guide.waitFor(); } catch (error) { console.log('Guide failure',errors,await page.locator('body').innerText()); throw error; }
    assert.equal(await guide.locator('[data-grammar-card]').count(),cards.length);
    assert.deepEqual(await guide.locator('[data-grammar-card]').evaluateAll(els=>els.slice(0,6).map(el=>el.dataset.grammarCard)),firstIds);
    assert.equal(await guide.locator('.grammar-guide-chunks>div').count(),is4 ? 6 : 3);
    for (const id of is4 ? ['foundation','questions','noun-phrases','past-be','past-verb','must'] : ['subjects','word-types','be','word-order','demonstratives','contractions','short-answers','amounts','pronouns','articles','negative','modifiers','conjunctions','place','noun','third']) {
      const comparison = guide.locator(`[data-grammar-card="${id}"] .grammar-guide-compare`);
      assert.ok(await comparison.locator('dt').count() >= 3);
      assert.ok(await comparison.evaluate(el => el.scrollWidth <= el.clientWidth+1), `${id} comparison fits ${width}px`);
    }
    assert.ok(await guide.evaluate(el => el.matches(':modal')));
    assert.ok(await guide.evaluate(el => el.scrollWidth <= el.clientWidth + 1));
    const toc = guide.locator('.grammar-guide-toc');
    assert.equal(await guide.getAttribute('data-course'),course);
    if (is4) {
      assert.equal(await toc.locator('button strong').count(),33);
      assert.equal(await toc.locator('button span').count(),33);
      for (const item of cards) {
        const button = toc.locator(`[data-grammar-target="${item.id}"]`);
        assert.equal(await button.locator('strong').innerText(),item.title);
        assert.equal(await button.locator('span').innerText(),item.subtitle);
        const heading = guide.locator(`[data-grammar-card="${item.id}"] .grammar-guide-card-heading`);
        assert.equal(await heading.locator('h3').innerText(),item.title);
        assert.equal(await heading.locator('span').innerText(),item.subtitle);
      }
      assert.ok(await toc.locator('button').evaluateAll(els=>els.every(el=>el.scrollWidth<=el.clientWidth+1)),'All headings fit');
      const widths = await toc.locator('button').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().width));
      assert.ok(Math.max(...widths)-Math.min(...widths)<1,'Equal-width navigation buttons');
      await toc.locator('[data-grammar-target="must"]').click();
      assert.equal(await guide.locator('[data-grammar-card="must"]').evaluate(el=>el===document.activeElement),true);
      await guide.getByRole('button',{name:'目次',exact:true}).click();
    } else {
      assert.equal(await toc.locator('button strong').count(),0,'Grade 5 retains original headings');
    }
    if (shots && width === 1366) await page.screenshot({path:`${shots}/${slug}-grammar-desktop.png`});
    if (shots && width === 390) {
      await toc.scrollIntoViewIfNeeded();
      await page.screenshot({path:`${shots}/${slug}-grammar-toc-mobile.png`});
    }
    await toc.locator(`[data-grammar-target="${questionId}"]`).click();
    const doCard = guide.locator(`[data-grammar-card="${questionId}"]`);
    assert.equal(await doCard.evaluate(el => el === document.activeElement), true);
    assert.ok((await doCard.boundingBox()).y >= 50);
    assert.ok((await doCard.boundingBox()).y < 140);
    if (shots && width === 390) await page.screenshot({path:`${shots}/${slug}-grammar-mobile.png`});
    await guide.locator(`[data-grammar-card="${is4?'foundation':'word-order'}"]`).scrollIntoViewIfNeeded();
    assert.ok(await guide.locator('.grammar-guide-chunks').evaluateAll(els=>els.every(el=>el.scrollWidth<=el.clientWidth+1)));
    if (shots && width === 390) await page.screenshot({path:`${shots}/${slug}-grammar-beginner-mobile.png`});
    await doCard.getByText('もうひとつヒント',{exact:true}).click();
    assert.ok(await doCard.locator('details').first().evaluate(el => el.open));
    await guide.getByRole('button',{name:'目次',exact:true}).click();
    assert.equal(await guide.locator('.grammar-guide-content').evaluate(el => el.scrollTop),0);
    await guide.locator(`[data-grammar-card="${savedId}"] .grammar-guide-save`).click();
    await guide.locator(`[data-grammar-card="${secondSavedId}"] .grammar-guide-save`).click();
    await guide.getByRole('button',{name:'目次',exact:true}).click();
    await guide.getByRole('button',{name:'保存したカード 2',exact:true}).click();
    assert.equal(await guide.locator('[data-grammar-card]').count(),2);
    await page.reload(); await guide.waitFor();
    await guide.getByRole('button',{name:'保存したカード 2',exact:true}).click();
    assert.equal(await guide.locator('[data-grammar-card]').count(),2,'Bookmarks survive reload');
    if (shots && width === 1366) await page.screenshot({path:`${shots}/${slug}-grammar-saved.png`});
    await guide.locator(`[data-grammar-card="${secondSavedId}"] .grammar-guide-save`).click();
    assert.equal(await guide.locator('[data-grammar-card]').count(),1);
    assert.equal(await guide.getByRole('button',{name:'保存したカード 1',exact:true}).evaluate(el => el === document.activeElement),true);
    await guide.getByRole('button',{name:`すべて ${cards.length}`,exact:true}).click();
    await page.keyboard.press('Escape'); await guide.waitFor({state:'detached'});
    assert.equal(await page.evaluate(() => document.body.classList.contains('grammar-guide-open')), false);
    // A URL preview never changes course or progress. Navigate without the query
    // before testing the ordinary title/result entry points.
    await page.goto(url);
    await page.getByRole('button',{name:`${grade}・文のしくみ`,exact:true}).click();
    await guide.waitFor(); await guide.getByRole('button',{name:'閉じる',exact:true}).click();
    const start = page.getByRole('button',{name:'この敵に挑む',exact:true});
    if (await start.isVisible()) await start.click();
    else await page.getByRole('button',{name:/前回の続きから/}).click();
    await page.locator('.battle-screen').waitFor();
    await page.keyboard.type(target.text,{delay:15});
    await page.waitForTimeout(1100);
    for (let i=0; i<40 && await page.locator('.battle-screen').isVisible(); i++) {
      await page.getByRole('button',{name:'この問題をスキップ',exact:true}).click();
      await page.waitForTimeout(300);
    }
    await page.locator('.result-today').waitFor();
    const title = cards.find(c=>c.id===target.id).title;
    const link = page.getByRole('button',{name:`文のしくみ：${title}`,exact:true}).first();
    assert.ok(await link.locator('..').locator('..').getByText('正確',{exact:true}).count(), `New question completed without mistakes: ${target.text}`);
    await link.scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => ({scroll:scrollY, save:JSON.stringify({...localStorage})}));
    const resultText = await page.locator('#root').innerText();
    await link.click(); await guide.waitFor();
    const card = guide.locator(`[data-grammar-card="${target.id}"]`);
    assert.equal(await card.evaluate(el => el === document.activeElement),true);
    assert.ok((await card.boundingBox()).y < 140);
    assert.ok((await card.innerText()).includes('今回の文'));
    if (shots && width === 1366) await page.screenshot({path:`${shots}/${slug}-grammar-result-link.png`});
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('.battle-screen').count(),0,'Enter inside reference must not retry');
    for (let i=0;i<25;i++) {
      await page.keyboard.press('Tab');
      assert.ok(await page.evaluate(() => !!document.activeElement?.closest('dialog')), `Focus stays inside reference: tab ${i}, ${await page.evaluate(() => document.activeElement?.outerHTML.slice(0,200))}`);
    }
    await guide.getByRole('button',{name:'結果へ戻る',exact:true}).click();
    await guide.waitFor({state:'detached'});
    assert.equal(await link.evaluate(el => el === document.activeElement),true,'Restore originating button focus');
    assert.equal(await page.locator('#root').innerText(),resultText,'Result remains intact');
    const after = await page.evaluate(() => ({scroll:scrollY, save:JSON.stringify({...localStorage})}));
    assert.ok(Math.abs(after.scroll-before.scroll)<=1, 'Restore result scroll');
    assert.equal(after.save,before.save,'Reference must not write learning data');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1));
    assert.deepEqual(errors,[]);
    if (width === 1366) {
      const originalPlayer = await page.evaluate(() => {
        const profiles=JSON.parse(localStorage.getItem('etyping_player_profiles'));
        const original=localStorage.getItem('etyping_active_player_id');
        profiles.push({...profiles[0],id:'grammar-test-other',name:'別のプレイヤー'});
        localStorage.setItem('etyping_player_profiles',JSON.stringify(profiles));
        localStorage.setItem('etyping_active_player_id','grammar-test-other');
        return original;
      });
      await page.goto(url+'/?guide='+slug); await guide.waitFor();
      await guide.getByRole('button',{name:'保存したカード 0',exact:true}).click();
      assert.equal(await guide.locator('[data-grammar-card]').count(),0,'Other player starts empty');
      assert.ok(await guide.getByText('あとで見たいカードを集めましょう！').isVisible());
      await page.evaluate(id=>localStorage.setItem('etyping_active_player_id',id),originalPlayer);
      await page.reload(); await guide.waitFor();
      await guide.getByRole('button',{name:'保存したカード 1',exact:true}).click();
      assert.equal(await guide.locator(`[data-grammar-card="${savedId}"]`).count(),1);
      await page.evaluate(() => {
        const original=Storage.prototype.setItem;
        Storage.prototype.setItem=function(key,value) { if(key.startsWith('etyping_grammar_bookmarks_'))throw new Error('test quota'); return original.call(this,key,value); };
      });
      await guide.locator(`[data-grammar-card="${savedId}"] .grammar-guide-save`).click();
      assert.ok(await guide.getByRole('alert').isVisible());
      assert.equal(await guide.locator(`[data-grammar-card="${savedId}"] .grammar-guide-save`).getAttribute('aria-pressed'),'true','Failed save does not pretend to succeed');
    }
    console.log(`PASS ${course} ${width}px: overview, exact anchor, hints, Escape, actual battle -> result link, focus trap, Enter isolation, return scroll and unchanged save`);
    await bounded(context.close());
  }
  passed = true;
} finally {
  try { await bounded(browser.close()); } catch { /* Owned muted test browser only. */ }
  try { await bounded(server.close()); } catch { try { await bounded(server.kill()); } catch { /* Best-effort owned process cleanup. */ } }
}
if (passed) process.exit(0);
