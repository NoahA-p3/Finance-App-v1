const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');
const { missingRuntimeEnv, runtimeTestsEnabled } = require('./runtime-env');

const runtimeEnabled = runtimeTestsEnabled();
const suite = runtimeEnabled ? test : test.skip;

const runId = crypto.randomUUID().slice(0, 8);
const seed = {
  ownerEmail: `runtime-owner-${runId}@example.test`,
  ownerPassword: `RuntimePass!${runId}Aa1`,
  outsiderEmail: `runtime-outsider-${runId}@example.test`,
  outsiderPassword: `RuntimePass!${runId}Bb1`,
  companyName: `Runtime Co ${runId}`
};

const appBaseUrl = process.env.RUNTIME_TEST_APP_BASE_URL;
const supabaseUrl = process.env.RUNTIME_TEST_SUPABASE_URL;
const supabaseAnonKey = process.env.RUNTIME_TEST_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.RUNTIME_TEST_SUPABASE_SERVICE_ROLE_KEY;

async function loginAndReadCookie({ email, password }) {
  const response = await fetch(`${appBaseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  assert.equal(response.status, 200, 'Login should return 200 for seeded runtime user');

  const cookieHeader = response.headers.get('set-cookie') || '';
  const authCookie = cookieHeader
    .split(',')
    .map((segment) => segment.trim())
    .find((segment) => segment.startsWith('sb-'));

  assert.ok(authCookie, 'Expected Supabase auth cookie in login response');

  return authCookie.split(';')[0];
}

suite('runtime integration harness (seeded Supabase db + API route checks)', async (t) => {
  const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const ownerAuth = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const outsiderAuth = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  if (!runtimeEnabled) {
    t.diagnostic(`runtime tests skipped; missing env: ${missingRuntimeEnv().join(', ')}`);
    return;
  }

  const createdUserIds = [];
  let seededCompanyId = null;
  let seededTransactionId = null;

  t.after(async () => {
    if (seededTransactionId) {
      await admin.from('transactions').delete().eq('id', seededTransactionId);
    }

    if (seededCompanyId) {
      await admin.from('company_memberships').delete().eq('company_id', seededCompanyId);
      await admin.from('companies').delete().eq('id', seededCompanyId);
    }

    for (const userId of createdUserIds) {
      await admin.auth.admin.deleteUser(userId);
    }
  });

  const ownerCreate = await admin.auth.admin.createUser({
    email: seed.ownerEmail,
    password: seed.ownerPassword,
    email_confirm: true
  });
  assert.ifError(ownerCreate.error);
  const ownerId = ownerCreate.data.user.id;
  createdUserIds.push(ownerId);

  const outsiderCreate = await admin.auth.admin.createUser({
    email: seed.outsiderEmail,
    password: seed.outsiderPassword,
    email_confirm: true
  });
  assert.ifError(outsiderCreate.error);
  const outsiderId = outsiderCreate.data.user.id;
  createdUserIds.push(outsiderId);

  const companyInsert = await admin
    .from('companies')
    .insert({ created_by: ownerId, name: seed.companyName, vat_registered: false })
    .select('id')
    .single();
  assert.ifError(companyInsert.error);
  seededCompanyId = companyInsert.data.id;

  const membershipsInsert = await admin.from('company_memberships').insert([
    { company_id: seededCompanyId, user_id: ownerId, role: 'owner' },
    { company_id: seededCompanyId, user_id: outsiderId, role: 'read_only' }
  ]);
  assert.ifError(membershipsInsert.error);

  const profileOwner = await admin.from('profiles').upsert({ id: ownerId, active_company_id: seededCompanyId });
  assert.ifError(profileOwner.error);

  const profileOutsider = await admin.from('profiles').upsert({ id: outsiderId, active_company_id: seededCompanyId });
  assert.ifError(profileOutsider.error);

  const unauthResponse = await fetch(`${appBaseUrl}/api/transactions`);
  assert.equal(unauthResponse.status, 401, 'Auth boundary: unauthenticated request should return 401');

  const loginCookie = await loginAndReadCookie({
    email: seed.ownerEmail,
    password: seed.ownerPassword
  });

  const postTransactionResponse = await fetch(`${appBaseUrl}/api/transactions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: loginCookie
    },
    body: JSON.stringify({
      description: 'Runtime seeded expense',
      amount: '120.50',
      type: 'expense',
      date: '2026-03-29'
    })
  });

  assert.equal(postTransactionResponse.status, 201, 'Finance write path should allow seeded owner transaction insert');
  const createdTransaction = await postTransactionResponse.json();
  seededTransactionId = createdTransaction.id;
  assert.equal(createdTransaction.company_id, seededCompanyId);
  assert.equal(createdTransaction.user_id, ownerId);

  const signInOutsider = await outsiderAuth.auth.signInWithPassword({
    email: seed.outsiderEmail,
    password: seed.outsiderPassword
  });
  assert.ifError(signInOutsider.error);

  const outsiderView = await outsiderAuth
    .from('transactions')
    .select('id,user_id,company_id,description')
    .eq('id', seededTransactionId)
    .maybeSingle();
  assert.ifError(outsiderView.error);
  assert.equal(outsiderView.data, null, 'Tenancy/runtime RLS: read_only member cannot read owner-owned transaction row');

  const journalInsert = await admin
    .from('journal_entries')
    .insert({
      company_id: seededCompanyId,
      source_transaction_id: seededTransactionId,
      status: 'posted',
      posting_date: '2026-03-29',
      description: 'Runtime posted journal entry',
      posted_at: new Date().toISOString(),
      posted_by: ownerId
    })
    .select('id')
    .single();
  assert.ifError(journalInsert.error);

  const immutabilityUpdate = await admin
    .from('transactions')
    .update({ description: 'Should be blocked by posting immutability trigger' })
    .eq('id', seededTransactionId);
  assert.ok(immutabilityUpdate.error, 'Posting immutability: update should fail once transaction has posted journal entry');
  assert.match(immutabilityUpdate.error.message, /Cannot mutate transaction with posted journal entries/i);
});
