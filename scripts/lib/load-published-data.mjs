import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { execFileSync } from 'node:child_process';

// Independent published-source oracle; never substitutes the live application.
export function publishedData(revision) {
  const cache = new Map();
  function load(file) {
    file = path.posix.normalize(file);
    if (!path.posix.extname(file)) file += '.ts';
    if (cache.has(file)) return cache.get(file).exports;
    const source = execFileSync('git', ['show', `${revision}:${file}`], { encoding: 'utf8', maxBuffer: 15000000 });
    if (file.endsWith('.json')) return JSON.parse(source);
    const module = { exports: {} }; cache.set(file, module);
    vm.runInNewContext(ts.transpileModule(source, { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
    } }).outputText, { module, exports: module.exports,
      require: name => load(path.posix.join(path.posix.dirname(file), name)),
    }, { filename: file });
    return module.exports;
  }
  return load;
}
