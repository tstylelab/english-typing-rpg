// Authoring helper only. Review each source row; runtime uses frozen exact-text links.
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { load } from './lib/load-typescript-data.mjs';
const { pre2SentenceRows } = load('src/data/questionSets/eiken/pre2Sentences.ts');
const bySourceId = {
  1502:'either',1503:'responses',1504:'imperatives',1506:'responses',1507:'imperatives',1508:'reactions',
  1509:'requests',1510:'indirect-question',1511:'mind',1512:'confirm',1513:'requests',1516:'greetings',
  1520:'how-come',1521:'impressions',1522:'impressions',1524:'help-good',1525:'responses',1526:'phone',
  1527:'indirect-question',1529:'indirect-if',1531:'will-modal',1532:'will-modal',1533:'will-modal',
  1534:'polite-news',1535:'daily',1536:'greetings',1537:'daily',1538:'uncertainty',1539:'infinitive-feeling',
  1540:'indirect-if',1541:'invitations',1542:'invitations',1543:'permission',1544:'daily',1545:'will-modal',
  1547:'daily',1550:'offers',1554:'phone',1556:'phone',1558:'neither',1560:'responses',1562:'nothing',
  1564:'invitations',1565:'invitations',1566:'greetings',1573:'uncertainty',1574:'offers',1575:'responses',
  1576:'infinitive-feeling',1578:'greetings',1580:'imperatives',1582:'reactions',1583:'preposition-ing',
  1584:'impressions',1585:'impressions',1587:'greetings',1589:'questions',1590:'preposition-ing',1594:'mind',
  1595:'requests',1596:'responses',1599:'confirm',1600:'will-modal',
  1601:'opinion',1602:'opinion',1603:'opinion',1604:'reasons',1606:'order-example',1609:'order-example',
  1611:'reasons',1612:'reasons',1613:'reasons',1615:'order-example',1616:'opinion',1617:'it-to',
  1619:'addition',1620:'addition',1621:'contrast',1622:'contrast',1623:'connectors',1624:'sources',
  1626:'result-conclusion',1627:'result-conclusion',1628:'sources',1629:'reported',1630:'passive-report',
  1631:'result-conclusion',1632:'result-conclusion',
  1105:'used-to',1118:'help-good',1119:'preposition-ing',1144:'ensure',1145:'happen-to',1155:'take-for',
  1162:'purpose-result',1207:'addition',1240:'addition',1246:'object-to',1336:'indirect-if',1354:'connectors',
  1403:'nothing',1420:'wish-asif',
};
const groups = {
  'perfect-duration': ['How long have you lived in this neighborhood?', 'She has worked here since she graduated.'],
  'perfect-experience-result': ['Have you ever taken part in a debate?', 'I have just finished my application.', 'He has not replied to my message yet.'],
  'perfect-continuous': ['We have been waiting for thirty minutes.'],
  'past-perfect': ['The train had left when we arrived.', 'I had never seen snow before I moved here.', 'She had already eaten when I called.'],
  'passive': ['These products are made from recycled paper.', 'The concert was canceled because of the storm.', 'This form must be signed by a parent.', 'The new hospital will be built next year.', 'The room is being cleaned now.', 'Why was the meeting put off?', 'When will the results be announced?'],
  'relative': ['The woman who lives next door is a nurse.', 'This is the camera that I bought yesterday.'],
  'whose': ['I know a boy whose father is a pilot.'],
  'where-when': ['This is the town where I grew up.', 'I remember the day when we first met.'],
  'participle': ['Look at the girl carrying a red bag.', 'The language spoken in Brazil is Portuguese.', 'The broken window must be replaced.'],
  'object-to': ['My teacher encouraged me to enter the contest.', 'They do not allow us to use phones here.', 'Please remind me to send the invitation.'],
  'let-make': ['My parents let me choose my own clothes.', 'The movie made me feel happy.'],
  'perception': ['I saw him crossing the street.'],
  'gerund': ['She avoided driving in heavy snow.', 'The book is worth reading twice.'],
  'mind': ['Would you mind waiting outside?'],
  'preposition-ing': ['We look forward to hearing from you.', 'He left without saying goodbye.'],
  'infinitive-feeling': ['I was surprised to hear the news.'],
  'infinitive-purpose': ['She went to the library to do research.'],
  'too-enough': ['The box is too heavy for me to carry.', 'He is old enough to travel alone.'],
  'comparison': ['This method is much easier than the old one.', 'The new train is twice as fast as the bus.', 'This is one of the oldest temples in Japan.'],
  'the-more': ['The more you practice, the better you get.'],
  'preference': ['I prefer reading to watching television.'],
  'condition': ['We will stay inside unless the rain stops.', 'Please call me as soon as you arrive.', 'If I have time tomorrow, I will help you.'],
  'connectors': ['Although it was cold, we enjoyed the walk.', 'I listened to music while I was cooking.'],
  'purpose-result': ['The bag was so heavy that I could not lift it.'],
  'unreal': ['If I were you, I would ask the teacher.', 'If I had more time, I would travel abroad.', 'What would you do in this situation?'],
  'wish-asif': ['I wish I could speak French.'],
  'reported': ['She said that she was looking for a job.', 'He told me that he would return soon.', 'She asked me where I lived.'],
  'indirect-question': ['Do you know how much this ticket costs?', 'I wonder why he changed his mind.'],
  'wh-to': ["We haven't decided which bus to take."],
  'questions': ['How often should I water this plant?', 'Who is in charge of this project?', 'Where can I apply for the volunteer program?'],
  'opinion': ['I believe that learning languages broadens our world.', 'I agree that we should protect local nature.'],
  'order-example': ['For example, we can talk with people abroad.'],
  'reasons': ['One advantage is that we can save energy.'],
  'contrast': ['However, we also need to consider the cost.'],
  'negative-opinion': ['I do not think that all homework is unnecessary.'],
  'it-to': ['It is important to respect different opinions.'],
  'result-conclusion': ['In conclusion, small actions can make a difference.'],
};
const explicit = Object.fromEntries(Object.entries(groups).flatMap(([id, texts]) => texts.map(text => [text,id])));
assert.equal(Object.keys(explicit).length, Object.values(groups).flat().length, 'Duplicate explicit text');
const assignments = {};
for (const line of pre2SentenceRows.split('\n')) {
  const [, sourceId, , text] = line.split('|');
  const id = Number(sourceId) ? bySourceId[sourceId] : explicit[text];
  assert.ok(id, 'Unreviewed sentence: ' + text);
  assert.equal(assignments[text], undefined, 'Duplicate source text');
  assignments[text] = id;
}
assert.equal(Object.keys(assignments).length,173);
writeFileSync('src/data/pre2GrammarAssignments.ts', '// Exact-text links reviewed against all Pre-2 Level 3 sentences.\nexport const pre2GrammarAssignments: Record<string, string> = '+JSON.stringify(assignments,null,2)+';\n');
console.log(`Prepared ${Object.keys(assignments).length} exact-text links across ${new Set(Object.values(assignments)).size} topics.`);
