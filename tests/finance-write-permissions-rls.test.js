const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

test('finance write permission seeds grant owner/staff and omit read_only for same-company writes', () => {
  const migration = read('supabase/migrations/202603270003_finance_write_permissions_and_rls_alignment.sql');

  assert.match(migration, /'finance\.transactions\.write'/);
  assert.match(migration, /'finance\.receipts\.write'/);
  assert.match(migration, /'finance\.postings\.write'/);
  assert.match(migration, /'finance\.period_locks\.manage'/);

  assert.match(migration, /\('owner', 'finance\.transactions\.write'\)/);
  assert.match(migration, /\('owner', 'finance\.receipts\.write'\)/);
  assert.match(migration, /\('owner', 'finance\.postings\.write'\)/);
  assert.match(migration, /\('owner', 'finance\.period_locks\.manage'\)/);

  assert.match(migration, /\('staff', 'finance\.transactions\.write'\)/);
  assert.match(migration, /\('staff', 'finance\.receipts\.write'\)/);
  assert.match(migration, /\('staff', 'finance\.postings\.write'\)/);
  assert.match(migration, /\('staff', 'finance\.period_locks\.manage'\)/);

  assert.doesNotMatch(migration, /\('read_only', 'finance\.transactions\.write'\)/);
  assert.doesNotMatch(migration, /\('read_only', 'finance\.receipts\.write'\)/);
  assert.doesNotMatch(migration, /\('read_only', 'finance\.postings\.write'\)/);
  assert.doesNotMatch(migration, /\('read_only', 'finance\.period_locks\.manage'\)/);
});

test('finance table mutation RLS checks role_permissions for write actions', () => {
  const migration = read('supabase/migrations/202603270003_finance_write_permissions_and_rls_alignment.sql');

  assert.match(migration, /create policy "Members mutate company transactions"/);
  assert.match(migration, /rp\.permission_key = 'finance\.transactions\.write'/);

  assert.match(migration, /create policy "Members mutate company receipts"/);
  assert.match(migration, /rp\.permission_key = 'finance\.receipts\.write'/);

  assert.match(migration, /create policy "Members mutate journal entries"/);
  assert.match(migration, /create policy "Members mutate journal lines"/);
  assert.match(migration, /create policy "Members insert audit events"/);
  assert.match(migration, /rp\.permission_key = 'finance\.postings\.write'/);

  assert.match(migration, /create policy "Members mutate period locks"/);
  assert.match(migration, /rp\.permission_key = 'finance\.period_locks\.manage'/);
});
