import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const masterCsvPath = path.join(repoRoot, 'data-source', 'eiken', 'gradepre1', 'gradepre1_master.csv');

const parseCsv = (input) => {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.replace(/\r$/, ''));
    rows.push(row);
  }

  return rows.filter((candidate) => candidate.some((value) => value.trim() !== ''));
};

const csvEscape = (value) => {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const rows = parseCsv(fs.readFileSync(masterCsvPath, 'utf8'));
const [originalHeader, ...dataRows] = rows;
if (!originalHeader) throw new Error('Master CSV is empty.');

const existingPartIndex = originalHeader.indexOf('part');
const levelIndex = originalHeader.indexOf('level');
const statusIndex = originalHeader.indexOf('status');
if (levelIndex === -1 || statusIndex === -1) throw new Error('Master CSV is missing level or status.');

const header = existingPartIndex === -1
  ? [...originalHeader.slice(0, levelIndex + 1), 'part', ...originalHeader.slice(levelIndex + 1)]
  : [...originalHeader];
const partIndex = header.indexOf('part');
const normalizedRows = dataRows.map((row) => {
  const nextRow = existingPartIndex === -1
    ? [...row.slice(0, levelIndex + 1), '', ...row.slice(levelIndex + 1)]
    : [...row];
  while (nextRow.length < header.length) nextRow.push('');
  return nextRow;
});

for (const level of ['1', '2', '3']) {
  const readyRows = normalizedRows.filter((row) => (
    String(row[levelIndex] ?? '').trim() === level
    && String(row[header.indexOf('status')] ?? '').trim() === 'ready'
  ));
  const part1Count = Math.floor(readyRows.length / 2);

  readyRows.forEach((row, index) => {
    const existingPart = String(row[partIndex] ?? '').trim();
    if (existingPart && !['1', '2'].includes(existingPart)) {
      throw new Error(`Invalid existing part value: ${existingPart}`);
    }
    if (!existingPart) row[partIndex] = index < part1Count ? '1' : '2';
  });
}

const csvLines = [
  header.map(csvEscape).join(','),
  ...normalizedRows.map((row) => header.map((_, index) => csvEscape(row[index] ?? '')).join(',')),
];
fs.writeFileSync(masterCsvPath, `${csvLines.join('\n')}\n`, 'utf8');

console.log(JSON.stringify({
  masterCsvPath,
  counts: Object.fromEntries(['1', '2', '3'].map((level) => [
    level,
    Object.fromEntries(['1', '2'].map((part) => [
      part,
      normalizedRows.filter((row) => (
        String(row[levelIndex] ?? '').trim() === level
        && String(row[header.indexOf('status')] ?? '').trim() === 'ready'
        && String(row[partIndex] ?? '').trim() === part
      )).length,
    ])),
  ])),
}, null, 2));
