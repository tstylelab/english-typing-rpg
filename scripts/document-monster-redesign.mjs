import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const [course='Eiken4',levelText='1'] = process.argv.slice(2);
const level = Number(levelText);
const prefix = `${course.toLowerCase()}-redesign-level${level}`;
const report = JSON.parse(readFileSync(`docs/monster-redesign/${course.toLowerCase()}-level${level}.json`,'utf8'));
const profiles = JSON.parse(readFileSync('src/monsterProfiles.json','utf8'));
const app = readFileSync('src/App.tsx','utf8');
const start = app.indexOf('const BASE_MONSTERS:');
const end = app.indexOf('// --- Components ---',start);
const context = {};
vm.runInNewContext(ts.transpileModule(app.slice(start,end)+'\nthis.roster=MONSTERS;',{
  compilerOptions:{target:ts.ScriptTarget.ES2022},
}).outputText,context);
const before = [...context.roster[level].guide,...context.roster[level].challenge];
const labels = {comic:'コミカル',cool:'かっこいい',cute:'かわいい',beautiful:'きれい'};
if (report.count !== 43 || profiles.filter(p=>p.course===course&&p.monsterId[1]===levelText).length !== 43) throw Error('Level not fully activated');
let text = `# ${course} Level ${level}：新名称・新画像43体（2026-10-05）\n\n`;
text += '- 練習20＋バトル23（裏ボス3を含む）＝43キャラ。出題方法で倍に数えていません。\n';
text += '- 新しい名称に合わせてbuilt-in image_genで各キャラを個別制作。以前の4級以降の画像を改名して使っていません。\n';
text += '- 同じprofileから級＋既存IDで名前・タイプ・色・台詞・画像を取得。図鑑・トップ・戦闘・勝利・拡大へ反映。\n';
text += '- 既存ID・HP・登場順・撃破保存キーを維持。5級の名簿と画像は維持。\n';
text += '- 目・表情・体形・素材・画風を分散。最新指示の約4体に1体の大きく笑えるデザインを重点枠として制作。笑えるかどうかには個人差があります。\n\n';
text += '## 画像と読み込み\n\n';
for (const size of [256,384,1024]) text += `- ${size}px：43枚合計${(report.totalBytes[size]/1024).toFixed(1)}KiB、平均${(report.totalBytes[size]/43/1024).toFixed(1)}KiB。\n`;
text += '- 静止透過WebP、元画像を拡大せず変換。図鑑は遅延取得、戦闘は次の敵だけ先読み、高解像度は拡大した1体だけ取得。追加ライブラリなし。\n';
text += '- 旧画像を保全する別URLフォルダを使用し、古い画像キャッシュとの混同を防止。\n\n';
text += '## 修正一覧\n\n| 区域・順 | ID | 旧名称 | 新名称 | デザインの方向 |\n| --- | --- | --- | --- | --- |\n';
for (const row of report.assets) {
  const old = before.find(m=>m.id===row.monsterId);
  if (!old) throw Error(row.monsterId);
  text += `| ${row.area==='training'?'練習':'バトル'} ${row.stage} | ${row.monsterId} | ${old.name} | ${row.name} | ${labels[row.mood]} |\n`;
}
text += '\n## 43体の見本\n\n';
for (let page=1;page<=3;page++) {
  const name = `${course.toLowerCase()}-level${level}-preview-${page}.png`;
  copyFileSync(`design/monster-samples/${prefix}-contact-${page}.png`,`docs/monster-redesign/${name}`);
  text += `![見本${page}](${name})\n\n`;
}
text += '## 再確認\n\n';
text += '- `node scripts/test-monster-redesign.mjs`：共通名簿・ID・HP・保存キー、新名称と画像URL・実ファイルの対応。\n';
text += '- `python scripts/export-monster-redesign.py`：元画像ハッシュ、透過、サイズ、四辺、静止画像、拡大せず変換したこと。\n';
text += '- UI検査：実際の名前表示、図鑑43画像、トップ/戦闘/勝利/次の敵/練習、拡大/矢印/スワイプ、PC/スマホ幅、読み込み数、撃破記録保持。実機Pixel Tabletの確認は含みません。\n';
text += '- [個別制作プロンプト・画像ハッシュ・サイズ・台詞](./'+course.toLowerCase()+'-level'+level+'.json)。\n';
writeFileSync(`docs/monster-redesign/${course.toLowerCase()}-level${level}.md`,text);
console.log(`Documented ${course} Level ${level}: 43 before/after entries`);
