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

function loadTsModuleWithResolver(filePath, resolver) {
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
  const customRequire = (specifier) => {
    const resolved = resolver(specifier);
    if (resolved !== undefined) {
      return resolved;
    }

    return require(specifier);
  };

  const context = vm.createContext({
    module,
    exports: module.exports,
    require: customRequire,
    __dirname: path.dirname(filePath),
    __filename: filePath,
    process
  });
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

test('dashboard trend and expense outputs preserve very large monetary values as cents strings', async () => {
  const decimals = loadTsModule('src/lib/finance-decimals.ts');
  const moneyFormat = loadTsModuleWithResolver('src/lib/money-format.ts', (specifier) => {
    if (specifier === '@/lib/finance-decimals') {
      return decimals;
    }
    return undefined;
  });

  const dashboard = loadTsModuleWithResolver('src/lib/dashboard-data.ts', (specifier) => {
    if (specifier === '@/lib/finance-decimals') {
      return decimals;
    }
    if (specifier === '@/lib/money-format') {
      return moneyFormat;
    }
    return undefined;
  });

  const currentMonth = new Date().toISOString().slice(0, 7);
  const revenueAmount = '9007199254740993.99';
  const expenseAmount = '1234567890123456.78';
  const revenueCents = decimals.decimalStringToCentsBigInt(revenueAmount).toString();
  const expenseCents = decimals.decimalStringToCentsBigInt(expenseAmount).toString();

  const supabase = {
    from(table) {
      if (table === 'transactions') {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          order() {
            return this;
          },
          limit() {
            return Promise.resolve({
              data: [
                {
                  id: 'txn-revenue',
                  amount: revenueAmount,
                  date: `${currentMonth}-10`,
                  description: 'Large revenue',
                  type: 'revenue',
                  category_id: null,
                  receipt_id: null
                },
                {
                  id: 'txn-expense',
                  amount: expenseAmount,
                  date: `${currentMonth}-11`,
                  description: 'Large expense',
                  type: 'expense',
                  category_id: 'cat-1',
                  receipt_id: null
                }
              ]
            });
          }
        };
      }

      if (table === 'categories') {
        return {
          select() {
            return this;
          },
          eq() {
            return Promise.resolve({
              data: [{ id: 'cat-1', name: 'Operations' }]
            });
          }
        };
      }

      if (table === 'company_settings') {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          maybeSingle() {
            return Promise.resolve({
              data: { base_currency: 'DKK' }
            });
          }
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }
  };

  const data = await dashboard.getDashboardFinanceData(supabase, 'user-1', 'company-1');
  const currentMonthPoint = data.trendData.find((point) => point.label === new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(new Date()));
  assert.ok(currentMonthPoint);

  assert.equal(currentMonthPoint.revenueCents, revenueCents);
  assert.equal(currentMonthPoint.expensesCents, expenseCents);
  assert.equal(currentMonthPoint.profitCents, (BigInt(revenueCents) - BigInt(expenseCents)).toString());

  assert.equal(
    JSON.stringify(data.expenseBreakdown),
    JSON.stringify([{ name: 'Operations', amountCents: expenseCents }])
  );
});

test('dashboard formatter regression: avoids Number(cents) conversion path', () => {
  const dashboardDataSource = read('src/lib/dashboard-data.ts');

  assert.doesNotMatch(dashboardDataSource, /Number\s*\(\s*cents\s*\)/);
});

test('dashboard currency formatter preserves precision above JS safe integer cents', () => {
  const decimals = loadTsModule('src/lib/finance-decimals.ts');
  const moneyFormat = loadTsModuleWithResolver('src/lib/money-format.ts', (specifier) => {
    if (specifier === '@/lib/finance-decimals') {
      return decimals;
    }
    return undefined;
  });

  const dashboard = loadTsModuleWithResolver('src/lib/dashboard-data.ts', (specifier) => {
    if (specifier === '@/lib/finance-decimals') {
      return decimals;
    }
    if (specifier === '@/lib/money-format') {
      return moneyFormat;
    }
    return undefined;
  });

  assert.equal(dashboard.formatCurrencyFromCents('900719925474099312', 'DKK'), 'DKK\u00A09,007,199,254,740,993.12');
  assert.equal(dashboard.formatCurrencyFromCents('-900719925474099312', 'DKK'), '-DKK\u00A09,007,199,254,740,993.12');
});


test('money formatter normalizes company currency codes with DKK fallback and formats decimal amounts', () => {
  const decimals = loadTsModule('src/lib/finance-decimals.ts');
  const moneyFormat = loadTsModuleWithResolver('src/lib/money-format.ts', (specifier) => {
    if (specifier === '@/lib/finance-decimals') {
      return decimals;
    }
    return undefined;
  });

  assert.equal(moneyFormat.normalizeCurrencyCode(' eur '), 'EUR');
  assert.equal(moneyFormat.normalizeCurrencyCode(null), 'DKK');
  assert.equal(moneyFormat.normalizeCurrencyCode('invalid'), 'DKK');

  assert.equal(
    moneyFormat.formatCurrencyFromDecimalAmount('1234.56', 'EUR'),
    moneyFormat.formatCurrencyFromCents('123456', 'EUR')
  );
  assert.equal(moneyFormat.formatCurrencyFromDecimalAmount('abc', 'EUR'), 'abc');
});

test('transactions workspace uses shared company-derived currency formatter contract', () => {
  const source = read('src/components/transactions/transactions-workspace.tsx');

  assert.match(source, /formatCurrencyFromDecimalAmount\(transaction.amount, currencyCode\)/);
  assert.match(source, /fetch\("\/api\/companies"/);
  assert.match(source, /normalizeCurrencyCode\(body\?\.settings\?\.base_currency\)/);
  assert.doesNotMatch(source, /currency:\s*"USD"/);
});
