const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

test('key API routes enforce authenticated-user guard before data access', () => {
  const routePaths = [
    'src/app/api/transactions/route.ts',
    'src/app/api/categories/route.ts',
    'src/app/api/receipts/route.ts',
    'src/app/api/companies/route.ts',
    'src/app/api/companies/members/route.ts',
    'src/app/api/companies/invitations/route.ts',
    'src/app/api/companies/invitations/accept/route.ts',
    'src/app/api/companies/switch/route.ts'
  ];

  for (const path of routePaths) {
    const source = read(path);
    assert.match(source, /requireAuthenticatedApiUser/);
    assert.match(source, /Unauthorized/);
    assert.match(source, /status:\s*401/);
  }
});

test('company routes enforce membership and role permissions with explicit 403/404 branches', () => {
  const companiesRoute = read('src/app/api/companies/route.ts');
  const membersRoute = read('src/app/api/companies/members/route.ts');
  const invitationsRoute = read('src/app/api/companies/invitations/route.ts');
  const switchRoute = read('src/app/api/companies/switch/route.ts');

  assert.match(companiesRoute, /getCompanyMembershipContext/);
  assert.match(companiesRoute, /COMPANY_PERMISSIONS\.SETTINGS_MANAGE/);
  assert.match(companiesRoute, /Missing required permission: company\.settings\.manage/);

  assert.match(membersRoute, /COMPANY_PERMISSIONS\.MEMBERS_READ/);
  assert.match(membersRoute, /COMPANY_PERMISSIONS\.MEMBERS_MANAGE/);
  assert.match(membersRoute, /status:\s*403/);
  assert.match(membersRoute, /\.eq\("company_id", actingMembership\.companyId\)/);

  assert.match(invitationsRoute, /COMPANY_PERMISSIONS\.INVITATIONS_READ/);
  assert.match(invitationsRoute, /COMPANY_PERMISSIONS\.INVITATIONS_MANAGE/);
  assert.match(invitationsRoute, /\.eq\("company_id", membership\.companyId\)/);

  assert.match(switchRoute, /getCompanyMembershipContext\(authContext\.supabase, authContext\.user\.id, company_id\)/);
  assert.match(switchRoute, /No active membership for requested company\./);
  assert.match(switchRoute, /status:\s*403/);
});

test('finance routes use active company scoping instead of trusting client ownership fields', () => {
  const transactionsRoute = read('src/app/api/transactions/route.ts');
  const categoriesRoute = read('src/app/api/categories/route.ts');
  const receiptsRoute = read('src/app/api/receipts/route.ts');

  assert.match(transactionsRoute, /company_id:\s*membership\.companyId/);
  assert.match(transactionsRoute, /user_id:\s*authContext\.user\.id/);
  assert.doesNotMatch(transactionsRoute, /company_id:\s*payload\./);
  assert.doesNotMatch(transactionsRoute, /user_id:\s*payload\./);

  assert.match(categoriesRoute, /company_id:\s*membership\.companyId/);
  assert.doesNotMatch(categoriesRoute, /company_id:\s*payload\./);

  assert.match(receiptsRoute, /company_id:\s*membership\.companyId/);
  assert.match(receiptsRoute, /user_id:\s*authContext\.user\.id/);
  assert.doesNotMatch(receiptsRoute, /company_id:\s*formData\./);
});

test('finance mutation routes enforce explicit finance write permissions', () => {
  const transactionsRoute = read('src/app/api/transactions/route.ts');
  const categoriesRoute = read('src/app/api/categories/route.ts');
  const receiptsRoute = read('src/app/api/receipts/route.ts');
  const postingsRoute = read('src/app/api/postings/route.ts');
  const reverseRoute = read('src/app/api/postings/[posting_id]/reverse/route.ts');
  const periodLocksRoute = read('src/app/api/postings/period-locks/route.ts');

  assert.match(transactionsRoute, /COMPANY_PERMISSIONS\.FINANCE_TRANSACTIONS_WRITE/);
  assert.match(transactionsRoute, /Missing required permission: finance\.transactions\.write/);
  assert.match(transactionsRoute, /status:\s*403/);

  assert.match(categoriesRoute, /COMPANY_PERMISSIONS\.FINANCE_CATEGORIES_WRITE/);
  assert.match(categoriesRoute, /Missing required permission: finance\.categories\.write/);
  assert.match(categoriesRoute, /status:\s*403/);

  assert.match(receiptsRoute, /COMPANY_PERMISSIONS\.FINANCE_RECEIPTS_WRITE/);
  assert.match(receiptsRoute, /Missing required permission: finance\.receipts\.write/);
  assert.match(receiptsRoute, /status:\s*403/);

  assert.match(postingsRoute, /COMPANY_PERMISSIONS\.FINANCE_POSTINGS_WRITE/);
  assert.match(postingsRoute, /Missing required permission: finance\.postings\.write/);
  assert.match(postingsRoute, /status:\s*403/);

  assert.match(reverseRoute, /COMPANY_PERMISSIONS\.FINANCE_POSTINGS_WRITE/);
  assert.match(reverseRoute, /Missing required permission: finance\.postings\.write/);
  assert.match(reverseRoute, /status:\s*403/);

  assert.match(periodLocksRoute, /COMPANY_PERMISSIONS\.FINANCE_PERIOD_LOCKS_MANAGE/);
  assert.match(periodLocksRoute, /Missing required permission: finance\.period_locks\.manage/);
  assert.match(periodLocksRoute, /status:\s*403/);
});
