const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');

const exts = new Set(['.js', '.jsx', '.ts', '.tsx']);

async function walk(dir) {
  let results = [];
  const list = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const d of list) {
    const res = path.resolve(dir, d.name);
    if (d.isDirectory()) {
      results = results.concat(await walk(res));
    } else if (d.isFile() && exts.has(path.extname(d.name))) {
      results.push(res);
    }
  }
  return results;
}

function parseFile(file) {
  const ext = path.extname(file).toLowerCase();
  const src = fs.readFileSync(file, 'utf8');
  const plugins = [
    'jsx',
    'classProperties',
    'optionalChaining',
    'nullishCoalescingOperator',
    'dynamicImport',
    'decorators-legacy',
    'topLevelAwait',
    'optionalCatchBinding',
    'bigInt',
    'numericSeparator'
  ];

  if (ext === '.ts' || ext === '.tsx') {
    plugins.push('typescript');
  }

  try {
    parser.parse(src, {
      sourceType: 'module',
      plugins,
      errorRecovery: false,
    });
    return null; // ok
  } catch (err) {
    const loc = err.loc || {};
    return {
      file,
      message: err.message,
      line: loc.line || null,
      column: loc.column || null,
    };
  }
}

(async () => {
  try {
    const root = path.resolve(__dirname);
    const files = await walk(root);
    const errors = [];
    for (const f of files) {
      const res = parseFile(f);
      if (res) errors.push(res);
    }

    if (errors.length === 0) {
      console.log('OK: No syntax parse errors found by @babel/parser.');
      process.exit(0);
    }

    console.log('PARSE ERRORS:');
    for (const e of errors) {
      console.log(`- ${e.file}`);
      console.log(`  message: ${e.message}`);
      if (e.line !== null) console.log(`  at: ${e.line}:${e.column}`);
    }

    process.exit(2);
  } catch (err) {
    console.error('Script failure:', err);
    process.exit(3);
  }
})();
