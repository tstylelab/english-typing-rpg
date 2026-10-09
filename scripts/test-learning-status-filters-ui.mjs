import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { load } from './lib/load-typescript-data.mjs';
import { trackTestBrowser } from './lib/test-browser-cleanup.mjs';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { QUESTIONS } = load('src/data/questions.ts');
const questions = QUESTIONS.Eiken5[1];
const sample = questions.slice(0, 6);
const key = (q, level=1) => `Eiken5:${level}:${q.text}:${q.translation}`;
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
const cleanup = await trackTestBrowser(browser);
try {
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  const errors=[]; page.on('pageerror', e=>errors.push(e.message));
  await page.addInitScript(({ questions, sample }) => {
    window.spoken=[];
    speechSynthesis.speak=u=>window.spoken.push(u.text);
    speechSynthesis.cancel=()=>{};
    if (sessionStorage.getItem('status-filter-seeded')) return;
    sessionStorage.setItem('status-filter-seeded','true');
    localStorage.setItem('etyping_last_selected_course',JSON.stringify({difficulty:'Eiken5',level:1}));
    const states=[
      {battleLevel:1,listeningLevel:1,manualOverrideLevel:null},
      {battleLevel:3,listeningLevel:3,manualOverrideLevel:1},
      {battleLevel:2,listeningLevel:1,manualOverrideLevel:null},
      {battleLevel:1,listeningLevel:1,manualOverrideLevel:2},
      {battleLevel:1,listeningLevel:1,manualOverrideLevel:3},
      {battleLevel:3,listeningLevel:3,manualOverrideLevel:null},
    ];
    localStorage.setItem('etyping_manual_question_statuses',JSON.stringify(Object.fromEntries(questions.map((q,i)=>[
      `Eiken5:1:${q.text}:${q.translation}`,
      {practiceLevel:1,battleLevel:1,listeningLevel:1,manualOverrideLevel:null,updatedAt:0,...states[i],excluded:i>=5},
    ]))));
    localStorage.setItem('etyping_weak_questions',JSON.stringify([sample[2]]));
    localStorage.setItem('etyping_weak_question_stats',JSON.stringify({[sample[2].text]:{missCount:2,lastMissedAt:1,consecutiveCorrect:0}}));
    localStorage.setItem('etyping_marked_question_keys_by_scope',JSON.stringify({'Eiken5:1':[`Eiken5:1:${sample[3].text}:${sample[3].translation}`]}));
    localStorage.setItem('etyping_auto_play_settings',JSON.stringify({source:'learning',playText:true,playTranslation:false,playExample:false,repeat:false,shuffle:false,itemGapSeconds:0,questionGapSeconds:0}));
  },{questions,sample});
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:5178');
  await page.getByRole('button',{name:'単語リスト',exact:true}).click();
  const filters=page.getByRole('group',{name:'問題リストの絞り込み',exact:true});
  const rows=page.locator('.question-list-row');
  const expected=[['学習中','learning',[sample[0],sample[1]]],['もう少し','caution',[sample[2],sample[3]]],['覚えた','mastered',[sample[4]]]];
  async function verifyRows(items) {
    await page.waitForFunction(texts=>JSON.stringify([...document.querySelectorAll('.question-list-row .word-list-term')].map(el=>el.textContent))===JSON.stringify(texts),items.map(q=>q.text));
  }
  for(const [label,,items] of expected) {await filters.getByRole('button',{name:label,exact:true}).click();await verifyRows(items);}
  for(const [label,items] of [['苦手だけ',[sample[2]]],['ミスランキング',[sample[2]]],['あとで復習',[sample[3]]]]) {
    await filters.getByRole('button',{name:label,exact:true}).click();await verifyRows(items);
  }
  await filters.getByRole('button',{name:'すべて',exact:true}).click();
  assert.ok(await rows.count()>5,'All view retains excluded rows for management');
  // Saved settings open from the title, and each status source ignores the list filter.
  console.log('PASS three status filters and existing filters');
  await page.getByRole('button',{name:/タイトルへ/}).click();
  for(const [label,source,items] of expected) {
    await page.getByRole('button',{name:'連続再生の設定',exact:true}).click();
    const choice=page.getByRole('button',{name:new RegExp(`^${label}だけ`)});
    await choice.click();
    assert.ok((await choice.innerText()).includes(`${items.length}語`));
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('etyping_auto_play_settings')).source),source);
    await filters.getByRole('button',{name:label==='学習中'?'覚えた':'学習中',exact:true}).click();
    await page.evaluate(()=>{window.spoken=[];});
    await page.getByRole('button',{name:'この設定で連続再生を開始',exact:true}).click();
    await page.waitForFunction(()=>window.spoken.length>0);
    assert.equal(await page.evaluate(()=>window.spoken[0]),items[0].text);
    if(items.length>1) {
      await page.getByRole('button',{name:'次の用語 →',exact:true}).click();
      assert.equal(await page.evaluate(()=>window.spoken.at(-1)),items[1].text);
    }
    // Switching a source stops the old sequence instead of silently mixing groups.
    await page.getByRole('button',{name:/^自分で選んだ語/}).click();
    assert.ok(await page.getByRole('button',{name:'この設定で連続再生を開始',exact:true}).isDisabled());
    await choice.click();
    await page.getByRole('button',{name:/タイトルへ/}).click();
    await page.reload();
    await page.getByRole('button',{name:'連続再生',exact:true}).waitFor();
    await page.waitForFunction(source=>JSON.parse(localStorage.getItem('etyping_auto_play_settings')).source===source,source);
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('etyping_auto_play_settings')).source),source);
    await page.evaluate(()=>{window.spoken=[];});
    await page.getByRole('button',{name:'連続再生',exact:true}).click();
    await page.waitForFunction(()=>window.spoken.length>0);
    assert.equal(await page.evaluate(()=>window.spoken[0]),items[0].text,'Title playback uses saved status target');
    await page.getByRole('button',{name:'停止',exact:true}).click();
    await page.getByRole('button',{name:/タイトルへ/}).click();
  }
  await page.getByRole('button',{name:'単語リスト',exact:true}).click();
  await filters.getByRole('button',{name:'覚えた',exact:true}).click();
  await rows.first().getByRole('button',{name:'学習中',exact:true}).click();
  await verifyRows([]);
  assert.ok(await page.getByText('「覚えた」の用語はありません', {exact:true}).isVisible());
  await page.getByRole('button',{name:'Level 2',exact:true}).click();
  await verifyRows([]);
  await filters.getByRole('button',{name:'学習中',exact:true}).click();
  assert.ok(await rows.count()>0,'Fresh Level 2 has its own learning state');
  for(const width of [1366,390,320]) {
    await page.setViewportSize({width,height:900});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.equal(await filters.evaluate(el=>el.scrollWidth>el.clientWidth),false);
    if(process.env.STATUS_FILTER_SCREENSHOT_DIR) {
      await filters.scrollIntoViewIfNeeded();
      await filters.screenshot({path:`${process.env.STATUS_FILTER_SCREENSHOT_DIR}/status-filters-${width}.png`});
    }
    for(const [label] of expected) assert.ok(await filters.getByRole('button',{name:label,exact:true}).isVisible());
  }
  assert.deepEqual(errors,[]);
  // Filtering and playback must not rewrite learning records; only the explicit manual change above does.
  const status=await page.evaluate(()=>JSON.parse(localStorage.getItem('etyping_manual_question_statuses')));
  assert.equal(status[key(sample[1])].manualOverrideLevel,1);
  assert.equal(status[key(sample[5])].excluded,true);
  console.log('PASS status filters, automatic/manual state, exclusion, existing filters, live state changes, scoped levels, list/title playback, saved sources, empty target, source-change stop, 1366/390/320px');
} finally { await cleanup(); }
