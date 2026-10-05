import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import ts from 'typescript';

// Produces review documents only. It does not edit runtime data or generate art.
const folder = 'docs/monster-name-proposals-2026-10-05';
const authorization = JSON.parse(readFileSync(`${folder}/authorization.json`, 'utf8'));
const courses = [
  ['Eiken4', 'eiken4', '英検4級'],
  ['Eiken3', 'eiken3', '英検3級'],
  ['EikenPre2', 'eikenpre2', '英検準2級'],
  ['Eiken2', 'eiken2', '英検2級'],
  ['EikenPre1Part1', 'eikenpre1part1', '英検準1級①'],
  ['EikenPre1Part2', 'eikenpre1part2', '英検準1級②'],
  ['Eiken1Part1', 'eiken1part1', '英検1級①'],
  ['Eiken1Part2', 'eiken1part2', '英検1級②'],
];
const levels = [1, 2, 3];
const lanes = [['training', 'guide', 20], ['battle', 'challenge', 23]];
const app = readFileSync('src/App.tsx', 'utf8');
const start = app.indexOf('const BASE_MONSTERS:');
const end = app.indexOf('// --- Components ---', start);
if (start < 0 || end < 0) throw new Error('Current roster source boundaries not found');
const context = {};
vm.runInNewContext(ts.transpileModule(app.slice(start, end) + '\nthis.roster = MONSTERS;', {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText, context);
const roster = context.roster;
const retained = levels.flatMap(level => lanes.flatMap(([, lane]) => roster[level][lane]));
if (retained.length !== 129) throw new Error(`Unexpected retained roster count: ${retained.length}`);

const normalize = value => value.normalize('NFKC').toLowerCase().replace(/[\s・･\-–—]/gu, '');
const kanaNormalize = value => normalize(value)
  .replace(/[ぁ-ゖ]/gu, char => String.fromCharCode(char.charCodeAt(0) + 0x60))
  .replace(/ー/gu, '');
const exactSeen = new Map();
const kanaSeen = new Map();
const errors = [];
const claimName = (name, owner) => {
  for (const [seen, key, label] of [
    [exactSeen, normalize(name), '表記'],
    [kanaSeen, kanaNormalize(name), 'かな・記号差'],
  ]) {
    if (seen.has(key)) errors.push(`${label}の重複: ${name} (${owner}) / ${seen.get(key)}`);
    else seen.set(key, `${name} (${owner})`);
  }
};
for (const monster of retained) claimName(monster.name, `Eiken5:${monster.id}`);

const entries = [];
const sourceHashes = {};
for (const [course, slug] of courses) {
  const source = readFileSync(`${folder}/${slug}.txt`, 'utf8');
  sourceHashes[slug] = createHash('sha256').update(source).digest('hex');
  const blocks = new Map();
  let currentLevel;
  let currentLane;
  for (const rawLine of source.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('# ')) {
      if (line !== `# ${course}`) errors.push(`Course heading mismatch: ${slug}`);
    } else if (/^## Level [123]$/u.test(line)) {
      currentLevel = Number(line.at(-1));
      currentLane = undefined;
    } else if (/^### (training|battle)$/u.test(line)) {
      currentLane = line.slice(4);
      const key = `${currentLevel}:${currentLane}`;
      if (!levels.includes(currentLevel) || blocks.has(key)) errors.push(`Invalid/duplicate block: ${slug} ${key}`);
      blocks.set(key, []);
    } else {
      const key = `${currentLevel}:${currentLane}`;
      if (!blocks.has(key)) throw new Error(`Name outside a block: ${slug} ${line}`);
      blocks.get(key).push(line);
    }
  }
  if (blocks.size !== 6) errors.push(`Expected six blocks: ${slug}, found ${blocks.size}`);
  for (const level of levels) {
    for (const [area, lane, expected] of lanes) {
      const names = blocks.get(`${level}:${area}`) || [];
      const sourceMonsters = roster[level][lane];
      if (names.length !== expected || sourceMonsters.length !== expected) {
        errors.push(`${slug} Level${level} ${area}: ${names.length} names; expected ${expected}`);
        continue;
      }
      names.forEach((name, index) => {
        if ([...name].length > 20) errors.push(`Name longer than 20 characters: ${name}`);
        if (/[0-9０-９|<>]/u.test(name)) errors.push(`Invalid name characters: ${name}`);
        const monsterId = sourceMonsters[index].id;
        const key = `${course}:${monsterId}`;
        claimName(name, key);
        entries.push({
          key, course, level, area, stage: index + 1, monsterId, name,
          role: area === 'battle' && index >= 20 ? 'hidden-boss'
            : index === 19 ? 'final-boss' : 'regular',
        });
      });
    }
  }
}
if (entries.length !== 1032) errors.push(`Expected 1,032 new names; found ${entries.length}`);
if (new Set(entries.map(entry => entry.key)).size !== entries.length) errors.push('Duplicate course/monster ID');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  const validation = {
    date: '2026-10-05', status: 'passed', newNameCount: entries.length,
    retainedEiken5NameCount: retained.length, combinedUniqueNameCount: exactSeen.size,
    exactOrFormattingDuplicateCount: 0, kanaOrLongVowelDuplicateCount: 0,
    duplicateAssignmentCount: 0, sourceAppSha256: createHash('sha256').update(app).digest('hex'),
    sourceHashes,
    counts: courses.map(([course]) => ({
      course, total: entries.filter(entry => entry.course === course).length,
      levels: levels.map(level => ({ level, training: 20, battle: 23, total: 43 })),
    })),
  };
  writeFileSync(`${folder}/validation.json`, JSON.stringify(validation, null, 2) + '\n');
  writeFileSync(`${folder}/names.json`, JSON.stringify({
    date: '2026-10-05', status: authorization.artGenerationAuthorized ? 'names_accepted_artwork_in_progress' : 'draft_names_only',
    scope: 'Eiken4 through Eiken1Part2, eight courses, three levels, 43 characters per level',
    nameCount: entries.length, retainedCourse: 'Eiken5',
    sharedInputModes: 'Training/listening share 20 characters; voice/meaning battles share 23 characters',
    artGenerationAuthorized: authorization.artGenerationAuthorized, runtimeIntegrated: false,
    oldArtAndPlans: 'Superseded for these eight courses. Not used to derive these names. Originals preserved.',
    entries,
  }, null, 2) + '\n');
  for (const [course, slug, label] of courses) {
    let markdown = `# ${label}：モンスター名案\n\n`;
    markdown += '新規制作の名称一覧です。2026-10-05に4級からの画像制作依頼を受領。完成・公開の状況は級別の制作記録で管理します。各Levelは練習20体＋バトル23体＝43体。\n\n';
    markdown += '[全体一覧へ](README.md)\n\n';
    for (const level of levels) {
      markdown += `## Level ${level}（43体）\n\n`;
      for (const [area, , expected] of lanes) {
        markdown += `### ${area === 'training' ? '練習' : 'バトル'}（${expected}体）\n\n`;
        markdown += '| 登場順 | 名前案 | 区分 | 既存ID |\n| ---: | --- | --- | --- |\n';
        for (const entry of entries.filter(e => e.course === course && e.level === level && e.area === area)) {
          const role = entry.role === 'hidden-boss' ? `裏ボス${entry.stage - 20}`
            : entry.role === 'final-boss' ? '最終ボス' : '通常';
          markdown += `| ${entry.stage} | ${entry.name} | ${role} | ${entry.monsterId} |\n`;
        }
        markdown += '\n';
      }
    }
    writeFileSync(`${folder}/${slug}.md`, markdown.trimEnd() + '\n');
  }
  let readme = '# 英検4級以降のモンスター名案（2026-10-05）\n\n';
  readme += '**新規1,032名称の一覧です。2026-10-05に英検4級からの作り直し依頼を受領。画像・実装の完成数とは異なります。完成・公開の状況は級別の制作記録で管理します。**\n\n';
  readme += '## 対象と数え方\n\n';
  readme += '- 英検4級〜1級②の8コース。各Levelは練習20体＋バトル23体（裏ボス3体を含む）の43体。\n';
  readme += '- 各コース3Levelで129体、8コースで新規1,032名称。英検5級129名称を残すと英検全体で1,161名称。\n';
  readme += '- 練習とリスニング練習、音声バトルと和訳バトルでは、それぞれキャラを共用します。出題方法別の撃破記録を倍のキャラ数として数えません。\n';
  readme += '- 今回の対象は英検です。英会話はじめての名称は含めていません。\n\n';
  readme += '## 級別の一覧\n\n| コース | Level 1 | Level 2 | Level 3 | 合計 |\n| --- | ---: | ---: | ---: | ---: |\n';
  for (const [, slug, label] of courses) readme += `| [${label}](${slug}.md) | 43 | 43 | 43 | 129 |\n`;
  readme += '\n## 命名方針\n\n';
  readme += '- 笑える・かっこいい・きれい・かわいいキャラを混ぜ、姿や性格が想像できる名前にします。\n';
  readme += '- 級名・Level番号・「改」だけを付けて別名にする方式は使っていません。既存の4級以降の画像を改名して再利用する案ではありません。\n';
  readme += '- 5級の129名称とも重複しない独立した名前です。かな・カナ、空白、区切り記号、長音だけの違いも検査しました。\n';
  readme += '- 名前の一意性は、完成する絵の見た目の一意性を保証しません。後の画像制作では輪郭・表情・目・素材・画風も比較します。\n\n';
  readme += '## 検査結果\n\n';
  readme += '- 全24Levelが43名称ずつ（練習20＋バトル23）。全コースが129名称ずつ。\n';
  readme += '- 新規1,032名称と5級129名称を合わせて1,161名称。検査対象の重複0。\n';
  readme += '- 現在のApp.tsxから取得した既存IDと図鑑順を使って割り当て、欠落・二重割り当て0。既存IDを変更する提案ではありません。\n';
  readme += '- 名前の文字数は20文字以内。数字・表の区切り文字の混入なし。\n\n';
  readme += '## 保存ファイルと再確認\n\n';
  readme += '- 級別.md：読むための全名称一覧。\n- 級別.txt：手作業で作った名前案の入力。\n- [names.json](names.json)：全1,032名称と級・Level・登場順・既存IDの対応。\n- [validation.json](validation.json)：検査結果と入力ファイルのハッシュ。\n';
  readme += '- 再確認：`node scripts/build-monster-name-proposals.mjs`。検査に失敗した場合、出力一覧は更新せず終了します。\n\n';
  readme += '## 現在の公開版との関係\n\n';
  readme += 'この一覧を保存しただけで修正・公開が済んだとは扱いません。4級・3級・制作途中の準2級の旧画像と旧planは保全し、この新規制作計画には採用しません。画像が揃って検査済みのLevelから、名前・タイプ・色・台詞・画像の対応を合わせて反映します。既存のモンスターIDと撃破記録は維持します。\n';
  writeFileSync(`${folder}/README.md`, readme);
  console.log(JSON.stringify(validation, null, 2));
}
