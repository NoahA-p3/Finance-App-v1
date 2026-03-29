const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function loadTsModule(filePath) {
  const source = read(filePath);
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true
    },
    fileName: filePath
  });

  const module = { exports: {} };
  const context = vm.createContext({ module, exports: module.exports, require, __dirname: path.dirname(filePath), __filename: filePath, process });
  vm.runInContext(transpiled.outputText, context, { filename: filePath });
  return module.exports;
}

test('transactions amount parser regression: no float conversion helpers are used', () => {
  const route = read('src/app/api/transactions/route.ts');

  assert.match(route, /function parseAmount\(value: unknown\)/);
  assert.match(route, /decimalStringToCentsBigInt\(normalized\)/);
  assert.match(route, /centsBigIntToDecimalString\(cents\)/);

  assert.doesNotMatch(route, /Number\s*\(/);
  assert.doesNotMatch(route, /parseFloat\s*\(/);
  assert.doesNotMatch(route, /Math\.round\s*\(/);
});

test('finance decimal utilities provide deterministic bigint-safe conversions', () => {
  const decimals = loadTsModule('src/lib/finance-decimals.ts');

  assert.equal(decimals.centsBigIntToDecimalString(decimals.decimalStringToCentsBigInt('0')), '0.00');
  assert.equal(decimals.centsBigIntToDecimalString(decimals.decimalStringToCentsBigInt('0.1')), '0.10');
  assert.equal(decimals.centsBigIntToDecimalString(decimals.decimalStringToCentsBigInt('12.34')), '12.34');
  assert.equal(decimals.centsBigIntToDecimalString(decimals.decimalStringToCentsBigInt('999999999999999999999999.99')), '999999999999999999999999.99');

  assert.throws(() => decimals.decimalStringToCentsBigInt('1.999'));
  assert.throws(() => decimals.decimalStringToCentsBigInt('-1.00'));
  assert.throws(() => decimals.decimalStringToCentsBigInt('1e6'));
});
