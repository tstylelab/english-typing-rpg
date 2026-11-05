import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { load } from './load-typescript-data.mjs';

// Execute production functions and their actual dependencies with fake storage.
// Only selected declarations are loaded, so this never mounts the application.
export function loadAppFunctions(names, source = fs.readFileSync('src/App.tsx', 'utf8')) {
  const ast = ts.createSourceFile('App.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const variables = new Map(), imports = new Map();
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && !variables.has(node.name.text)) variables.set(node.name.text, node);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  const top = new Set(ast.statements.filter(ts.isVariableStatement).flatMap(s => s.declarationList.declarations.filter(d => ts.isIdentifier(d.name)).map(d => d.name.text)));
  for (const s of ast.statements) if (ts.isImportDeclaration(s) && s.importClause?.namedBindings && ts.isNamedImports(s.importClause.namedBindings)) {
    for (const item of s.importClause.namedBindings.elements) if (!item.isTypeOnly) imports.set(item.name.text, { file: s.moduleSpecifier.text, name: item.propertyName?.text ?? item.name.text });
  }
  const selected = new Set(), usedImports = new Set();
  function select(name) {
    if (name === 'useCallback') return;
    if (!top.has(name) && !names.includes(name)) { if (imports.has(name)) usedImports.add(name); return; }
    const node = variables.get(name);
    if (!node || selected.has(name)) return;
    selected.add(name);
    function refs(n) { if (ts.isIdentifier(n) && n !== node.name) select(n.text); ts.forEachChild(n, refs); }
    refs(node.initializer);
  }
  names.forEach(select);
  const storage = new Map();
  const context = { useCallback: f => f, localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: key => storage.delete(key) }, window: {}, console };
  for (const name of usedImports) {
    const item = imports.get(name);
    context[name] = load(path.posix.join('src', item.file))[item.name];
  }
  const declarations = [...selected].map(name => variables.get(name)).sort((a, b) => a.pos - b.pos).map(n => `const ${n.getText(ast)};`).join('\n');
  const loop = selected.has('LEGACY_PRE1_QUESTION_KEY_MAP') ? ast.statements.find(s => ts.isForOfStatement(s) && s.getText(ast).includes('LEGACY_PRE1_QUESTION_KEY_MAP.set'))?.getText(ast) ?? '' : '';
  const code = declarations + '\n' + loop + '\nglobalThis.api={' + names.join(',') + '};';
  vm.runInNewContext(ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, context);
  return { api: context.api, storage };
}
