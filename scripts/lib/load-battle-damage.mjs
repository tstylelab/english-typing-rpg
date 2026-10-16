import vm from 'node:vm';
import ts from 'typescript';
import { loadBattleTuning } from './load-battle-tuning.mjs';

// Execute the actual answer handler's calculation, with a fixed clock and no UI/storage.
export function loadBattleDamage(app) {
  const ctx = loadBattleTuning(app);
  const ast = ts.createSourceFile('App.tsx', app, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const names = ['getSpeedMultiplier', 'getEikenLongTextGuideSpeedMultiplier', 'getEikenLongTextGuideDamageMultiplier', 'getPerfectClearDamageFloor'];
  const declarations = ast.statements.filter(s => ts.isVariableStatement(s)
    && s.declarationList.declarations.some(d => names.includes(d.name.getText(ast)))).map(s => s.getText(ast)).join('\n');
  const start = app.indexOf('const handleCorrectAnswer');
  const body = app.slice(app.indexOf('    const now = Date.now();', start), app.indexOf('    const willDefeatMonster', start));
  if (body.length < 1000) throw new Error('Answer calculation was not found');
  ctx.Date = { now: () => 1000000 };
  ctx.audioHintUsedRef = { current: false };
  vm.runInNewContext(ts.transpile(`${declarations}\nglobalThis.damage=(gameState, finalInput)=>{${body}; return finalDamage;};`, { target: ts.ScriptTarget.ES2022 }), ctx);
  return ctx;
}
