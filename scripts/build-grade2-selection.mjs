// One-time mechanical extraction from the user-supplied headword list.
// The attachment is never required by the shipped game.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseGrade2Source } from './lib/parse-grade2-source.mjs';
import { load } from './lib/load-typescript-data.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = parseGrade2Source(process.argv[2]);
if (source.length !== 1738) throw new Error(`Expected 1738 headings, found ${source.length}`);
const norm = text => text.toLowerCase().replace(/[^a-z0-9]/g, '');
const { QUESTIONS } = load('src/data/questions.ts');
const lower = new Set(['Eiken5', 'Eiken4', 'Eiken3', 'EikenPre2'].flatMap(key => Object.values(QUESTIONS[key]).flat()).map(q => norm(q.text)));
const pre1 = new Map(['EikenPre1Part1', 'EikenPre1Part2'].flatMap(key => Object.values(QUESTIONS[key]).flat()).map(q => [norm(q.text), q]));
// A few older Pre-1 prompts list different parts of speech/senses together.
// For Grade 2, keep only the sense actually illustrated by its example.
const meaningForExample = {
  account: '出来事の詳しい説明', scholarship: '奨学金', overall: '全体としては',
  potential: '将来の発展の可能性', ban: '禁止令', promotion: '昇進',
  physical: '身体の', current: '現在の', inspire: 'やる気を起こさせる',
  launch: '新しい事業や商品を始める', appeal: '人に魅力を感じさせる',
  sacrifice: '犠牲', technically: '厳密には',
  demand: '需要', transportation: '交通機関', adopt: '採用する',
  individual: '一人ひとりの人', process: '過程',
  resident: 'その地域に住む人', anxiety: '試験などを前にした不安',
  indicate: '兆候として示す', strengthen: '強くする',
  artificial: '自然ではなく人工の', duty: '守るべき義務',
  species: '生物の種類・種', foundation: '学習などの基礎',
  constantly: '絶えず・常に', demonstrate: '実演・証拠で明らかに示す',
  focus: '最も重視する点', effective: '効果のある',
  income: '収入・所得', creature: '生き物',
  medical: '医療に関する', ingredient: '料理に使う材料',
  region: '一つの地域', assignment: '学校で出される課題',
  vehicle: '車などの乗り物', environmental: '環境に関する',
  positive: '前向きな', transfer: '別の場所へ移す',
  impact: '大きな影響', expense: '必要な支出・経費',
  mental: '精神的な', poverty: '貧しい状態',
  fund: '活動に使う資金', structure: '建物などの構造物',
  council: '議会・評議会', requirement: '必要条件・要件',
  recover: '病気やけがから回復する', renew: '有効期限を更新する',
  determine: '（事実などを）突き止める', struggle: '苦労しながら取り組む',
  household: '一つの世帯', luxury: 'ぜいたく品',
  session: '会議の一つの区切り', commit: '責任を持って取り組む',
  restore: '元の状態に戻す', contribution: '貢献',
  authority: '公的な権限', checkup: '定期的な健康診断',
  status: '現在の状況・状態', alternative: '代わりの選択肢',
  complaint: '苦情・不満', applicant: '応募者・申請者',
  widespread: '広範囲に及ぶ', ideal: '理想的な',
  permanent: '一時的でない・永続的な', vital: '極めて重要な',
  commute: '通勤する', substitute: '別のものの代用品',
  interfere: '（他人の活動に）干渉する', reminder: '忘れないための通知',
  exclusive: '（特定の人だけに）限定された', protest: '不服を表して抗議する',
  argument: '人と人との口論', victim: '事件や災害の被害者',
  Arctic: '北極の', nuclear: '原子力に関する',
  witness: '目撃者・証人', prescription: '薬の処方箋',
  extreme: '極端な・非常に激しい', resource: '利用できる資源',
  employment: '雇用', consequence: '行動がもたらす結果',
  criminal: '犯罪を犯した人', procedure: '決まった手順',
  reputation: '店などの評判', dump: '廃棄物を投棄する',
  reduction: 'ごみなどの削減', reasonable: '理にかなった・妥当な',
  definitely: '間違いなく', imply: '言外にほのめかす',
  stimulate: '経済を活性化する', accompany: '（出来事に）伴う',
  confess: '過ちを告白する', fulfill: '義務・約束を果たす',
  burst: '風船などが破裂する', critic: '作品を評価する批評家',
  corporation: '法人としての企業',
};
const rows = (file, exportName) => load(`src/data/questionSets/eiken/${file}.ts`)[exportName].split('\n').map(line => line.split('|'));
const manualWords = new Set(rows('grade2Vocabulary', 'grade2VocabularyRows').map(row => norm(row[1])));
const manualPhrases = new Map(rows('grade2Phrases', 'grade2PhraseRows').map(row => [Number(row[1]), row[2]]));
const manualSentences = new Set(rows('grade2Sentences', 'grade2SentenceRows').map(row => Number(row[1])).filter(Boolean));
const borrowed = [];
const audit = source.map(entry => {
  const key = norm(entry.text);
  let decision = 'not-selected';
  let answer = null;
  if (entry.kind === '単語編') {
    if (manualWords.has(key)) { decision = 'new-entry'; answer = entry.text; }
    else if (lower.has(key)) decision = 'lower-grade-overlap';
    else if (pre1.has(key)) {
      const q = pre1.get(key);
      if (q.translation && q.exampleEn) {
        decision = 'reused-existing-meaning'; answer = q.text;
        borrowed.push({ band: entry.rank === 'A' ? 1 : entry.rank === 'B' ? 2 : 3, sourceId: entry.id, question: {
          text: q.text, translation: meaningForExample[q.text] ?? q.translation, exampleEn: q.exampleEn,
        } });
      }
    }
  } else if (entry.kind === '熟語編') {
    if (manualPhrases.has(entry.id)) { decision = 'concretized'; answer = manualPhrases.get(entry.id); }
    else if (lower.has(key)) decision = 'lower-grade-overlap';
  } else if (manualSentences.has(entry.id)) {
    decision = 'expanded-writing-pattern';
  }
  return { ...entry, decision, ...(answer ? { answer } : {}) };
});
for (const word of manualWords) {
  if (!source.some(entry => entry.kind === '単語編' && norm(entry.text) === word)) throw new Error(`Word not in source: ${word}`);
  if (lower.has(word)) throw new Error(`Word already taught below Grade 2: ${word}`);
}
for (const id of manualPhrases.keys()) if (source[id - 1]?.kind !== '熟語編') throw new Error(`Invalid phrase source id: ${id}`);
for (const id of manualSentences) if (source[id - 1]?.kind !== '英作文編') throw new Error(`Invalid writing source id: ${id}`);
if (new Set(borrowed.map(row => norm(row.question.text))).size !== borrowed.length) throw new Error('Duplicate borrowed word');
fs.writeFileSync(path.join(root, 'src/data/questionSets/eiken/grade2BorrowedVocabulary.json'), JSON.stringify(borrowed, null, 2) + '\n');
const decisionCounts = Object.fromEntries([...new Set(audit.map(row => row.decision))].map(key => [key, audit.filter(row => row.decision === key).length]));
fs.writeFileSync(path.join(root, 'docs/grade2-source-selection.json'), JSON.stringify({
  note: 'User-supplied Grade 2 headings only; repeated example headings are not separate content. Only selected IDs/answers are retained here, not the full source list.',
  sourceCount: source.length,
  sourceKinds: Object.fromEntries(['単語編', '熟語編', '英作文編'].map(kind => [kind, source.filter(row => row.kind === kind).length])),
  decisionCounts,
  selected: audit.filter(row => !['lower-grade-overlap', 'not-selected'].includes(row.decision)).map(({ id, kind, decision, answer }) => ({ id, kind, decision, ...(answer ? { answer } : {}) })),
}, null, 2) + '\n');
console.log(JSON.stringify({ source: source.length, manualWords: manualWords.size, borrowedWords: borrowed.length,
  phrases: manualPhrases.size, writingPatterns: manualSentences.size,
  decisions: decisionCounts }, null, 2));
