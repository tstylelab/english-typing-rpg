import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const masterCsvPath = path.join(repoRoot, 'data-source', 'eiken', 'gradepre1', 'gradepre1_master.csv');

const parseCsv = (input) => {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ',') {
      row.push(cell);
      cell = '';
      continue;
    }

    if (char === '\n') {
      row.push(cell.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.replace(/\r$/, ''));
    rows.push(row);
  }

  return rows.filter((candidate) => candidate.some((value) => value.trim() !== ''));
};

const rows = parseCsv(fs.readFileSync(masterCsvPath, 'utf8'));
const [headerRow, ...dataRows] = rows;
const headerIndex = Object.fromEntries(headerRow.map((name, index) => [name, index]));

for (const column of ['text', 'level', 'part', 'translation', 'status']) {
  if (!(column in headerIndex)) {
    throw new Error(`Master CSV is missing required column: ${column}`);
  }
}

const getValue = (row, column) => String(row[headerIndex[column]] ?? '').trim();
const readyRows = dataRows.filter((row) => getValue(row, 'status') === 'ready');
const problems = [];
const warnings = [];
const seenReadyTexts = new Map();
const allowDuplicateText = (value) => value.split('|').map((part) => part.trim()).includes('allow_duplicate_text');
const isWordOrPhraseText = (value) => /^[A-Za-z][A-Za-z' -]*[A-Za-z]$/.test(value);
const isSentenceText = (value) => /^[A-Za-z][A-Za-z0-9'",.?! -]*[.?!]$/.test(value);

for (const row of readyRows) {
  const sourceText = getValue(row, 'sourceText');
  const text = getValue(row, 'text');
  const level = getValue(row, 'level');
  const part = getValue(row, 'part');
  const translation = getValue(row, 'translation');
  const exampleEn = getValue(row, 'exampleEn');
  const exampleJa = getValue(row, 'exampleJa');
  const issues = getValue(row, 'issues');
  const notes = getValue(row, 'notes');
  const isLevel3Sentence = level === '3';

  if (!text) problems.push(`ready row missing text: ${sourceText || '(blank sourceText)'}`);
  if (!['1', '2', '3'].includes(level)) problems.push(`ready row has invalid level for ${text || sourceText}`);
  if (!['1', '2'].includes(part)) problems.push(`ready row has invalid part for ${text || sourceText}`);
  if (!translation) problems.push(`ready row missing translation: ${text || sourceText}`);
  if (!isLevel3Sentence && !exampleEn) problems.push(`ready row missing exampleEn: ${text || sourceText}`);
  if (text && !(isLevel3Sentence ? isSentenceText(text) : isWordOrPhraseText(text))) {
    problems.push(`ready row has unsafe text: ${text}`);
  }
  if (exampleEn && !/[.!?]$/.test(exampleEn)) problems.push(`ready row example lacks end punctuation: ${text}`);
  if (issues) warnings.push(`ready row keeps source issues metadata: ${text || sourceText} -> ${issues}`);
  if (!isLevel3Sentence && !exampleJa) warnings.push(`ready row missing exampleJa: ${text || sourceText}`);

  if (text) {
    const key = text.toLowerCase();
    const previous = seenReadyTexts.get(key);
    if (previous) {
      const duplicateAllowed = allowDuplicateText(notes) || allowDuplicateText(previous.notes);
      if (!duplicateAllowed) {
        problems.push(`duplicate ready text: ${text} (rows: ${previous.label} / ${sourceText || text})`);
      }
    } else {
      seenReadyTexts.set(key, { label: sourceText || text, notes });
    }
  }
}

const summary = {
  totalRows: dataRows.length,
  readyRows: readyRows.length,
  draftRows: dataRows.filter((row) => getValue(row, 'status') === 'draft').length,
  needsReviewRows: dataRows.filter((row) => getValue(row, 'status') === 'needs_review').length,
  readyWithExampleJa: readyRows.filter((row) => getValue(row, 'exampleJa')).length,
  splitCounts: {
    1: Object.fromEntries(['1', '2', '3'].map((level) => [level, readyRows.filter((row) => getValue(row, 'part') === '1' && getValue(row, 'level') === level).length])),
    2: Object.fromEntries(['1', '2', '3'].map((level) => [level, readyRows.filter((row) => getValue(row, 'part') === '2' && getValue(row, 'level') === level).length])),
  },
};

for (const level of ['1', '2', '3']) {
  const part1Count = summary.splitCounts[1][level];
  const part2Count = summary.splitCounts[2][level];
  if (Math.abs(part1Count - part2Count) > 1) {
    problems.push(`level ${level} is not split evenly: ${part1Count} / ${part2Count}`);
  }
}

console.log(JSON.stringify({ summary, problems, warnings }, null, 2));

if (problems.length > 0) {
  process.exitCode = 1;
}
