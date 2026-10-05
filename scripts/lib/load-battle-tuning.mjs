import vm from 'node:vm';
import ts from 'typescript';
import { load } from './load-typescript-data.mjs';

export function loadBattleTuning(source) {
  const file = ts.createSourceFile('App.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const names = ['DIFFICULTY_HP_MULTIPLIERS', 'GUIDE_DAMAGE_MULTIPLIER', 'LISTENING_TRAINING_DAMAGE_MULTIPLIER', 'getBattleDamageMultiplier'];
  const declarations = file.statements.filter(s => ts.isVariableStatement(s)
    && s.declarationList.declarations.some(d => names.includes(d.name.getText(file))))
    .map(s => s.getText(file)).join('\n');
  const tuning = source.slice(source.indexOf('const DEFAULT_BATTLE_QUESTION_LIMIT'), source.indexOf('const getBattleStageIndices'));
  const roster = source.slice(source.indexOf('const BASE_MONSTERS:'), source.indexOf('// --- Components ---', source.indexOf('const BASE_MONSTERS:')));
  const context = { ...load('src/data/grade3Balance.ts'), ...load('src/data/pre2Balance.ts'), ...load('src/data/grade2Balance.ts') };
  vm.runInNewContext(ts.transpileModule(`${declarations}\n${tuning}\n${roster}\nglobalThis.tune=getBattleTuning;globalThis.roster=MONSTERS;globalThis.boss=getBossStage;globalThis.courses=Object.keys(DIFFICULTY_HP_MULTIPLIERS);`,
    { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, context);
  return context;
}
