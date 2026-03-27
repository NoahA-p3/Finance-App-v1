const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

test('same-company cross-user visibility uses company_id instead of user_id filters', () => {
  const transactionsRoute = read('src/app/api/transactions/route.ts');
  const categoriesRoute = read('src/app/api/categories/route.ts');
  const receiptsRoute = read('src/app/api/receipts/route.ts');
  const dashboardData = read('src/lib/dashboard-data.ts');

  assert.doesNotMatch(transactionsRoute, /\.eq\("user_id", authContext\.user\.id\)/);
  assert.match(transactionsRoute, /\.eq\("company_id", membership\.companyId\)/);

  assert.doesNotMatch(categoriesRoute, /\.eq\("user_id", authContext\.user\.id\)/);
  assert.match(categoriesRoute, /\.eq\("company_id", membership\.companyId\)/);

  assert.match(receiptsRoute, /\.eq\("company_id", membership\.companyId\)/);

  assert.doesNotMatch(dashboardData, /\.eq\("user_id", userId\)/);
  assert.match(dashboardData, /\.eq\("company_id", companyId\)/);
});

test('cross-company denial remains enforced by membership-based RLS policies', () => {
  const migration = read('supabase/migrations/202603270001_company_shared_finance_rls.sql');
  const [activePolicies] = migration.split('-- Rollback / recovery notes:');

  assert.match(activePolicies, /Members manage company categories/);
  assert.match(activePolicies, /Members manage company receipts/);
  assert.match(activePolicies, /Members manage company transactions/);

  assert.match(activePolicies, /where cm\.company_id = categories\.company_id\s+and cm\.user_id = auth\.uid\(\)/);
  assert.match(activePolicies, /where cm\.company_id = receipts\.company_id\s+and cm\.user_id = auth\.uid\(\)/);
  assert.match(activePolicies, /where cm\.company_id = transactions\.company_id\s+and cm\.user_id = auth\.uid\(\)/);

  assert.doesNotMatch(activePolicies, /using \(\s*user_id = auth\.uid\(\)/);
  assert.doesNotMatch(activePolicies, /with check \(\s*user_id = auth\.uid\(\)/);
});
