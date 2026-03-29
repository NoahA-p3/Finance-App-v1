const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

test('transactions route validates boundary inputs and normalizes decimal-safe amounts', () => {
  const route = read('src/app/api/transactions/route.ts');

  assert.match(route, /DECIMAL_2DP_PATTERN/);
  assert.match(route, /Amount must be a non-negative decimal string with up to 2 decimal places\./);
  assert.match(route, /centsBigIntToDecimalString\(cents\)/);

  assert.match(route, /type must be either 'expense' or 'revenue'\./);
  assert.match(route, /date must be a valid ISO date in YYYY-MM-DD format\./);
  assert.match(route, /parseOptionalUuid\("category_id", raw\.category_id\)/);
  assert.match(route, /parseOptionalUuid\("receipt_id", raw\.receipt_id\)/);
  assert.match(route, /must be a UUID string or null\./);

  assert.match(route, /Request body must be a JSON object\./);
  assert.match(route, /Invalid JSON body\./);
});

test('transactions route enforces company-context entitlement and reference checks', () => {
  const route = read('src/app/api/transactions/route.ts');

  assert.match(route, /evaluateTransactionWriteLimit/);
  assert.match(route, /getCompanyEntitlementsState/);
  assert.match(route, /upsertUsageCounters/);

  assert.match(route, /\.from\("categories"\)[\s\S]*\.eq\("company_id", membership\.companyId\)/);
  assert.match(route, /\.from\("receipts"\)[\s\S]*\.eq\("company_id", membership\.companyId\)/);
  assert.match(route, /category_id does not exist in active company context\./);
  assert.match(route, /receipt_id does not exist in active company context\./);

  assert.match(route, /soft_lock/);
  assert.match(route, /upgrade_prompt/);
  assert.match(route, /status:\s*429/);
});

test('entitlements library uses decimal-safe bigint math and company-scoped usage metrics', () => {
  const entitlements = read('src/lib/entitlements.ts');

  assert.match(entitlements, /function decimalToCents/);
  assert.match(entitlements, /return whole \* 100n \+ fraction;/);
  assert.match(entitlements, /function centsToDecimalString/);
  assert.match(entitlements, /rollingTurnover12mDkk: centsToDecimalString\(turnoverCents\)/);

  assert.match(entitlements, /\.eq\("company_id", companyId\)/);
  assert.match(entitlements, /rolling_turnover_cap_reached/);
  assert.match(entitlements, /monthly_voucher_limit_reached/);
  assert.match(entitlements, /isEntitlementEnforcementEnabledForPlan/);
});
