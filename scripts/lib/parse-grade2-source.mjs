import fs from 'node:fs';

export const parseGrade2Source = (path) => {
  const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const entries = [];
  for (let i = 0; i < lines.length - 1; i++) {
    const section = lines[i + 1].match(/^(単語編|熟語編)\s+でる度([ABC])\s+Section(\d+)/);
    const writing = lines[i + 1] === '英作文編 - 単語';
    if ((!section && !writing) || lines[i].endsWith(' - 例文')) continue;
    entries.push({ id: entries.length + 1, text: lines[i], kind: writing ? '英作文編' : section[1], rank: writing ? '-' : section[2], section: writing ? 0 : Number(section[3]) });
  }
  return entries;
};
