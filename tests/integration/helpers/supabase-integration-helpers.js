const assert = require('node:assert/strict');
const { createClient } = require('@supabase/supabase-js');
const { GOLDEN_DATASET_FIXTURES } = require('../../fixtures/golden-datasets');

const REQUIRED_ENV = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

function hasIntegrationEnv() {
  return REQUIRED_ENV.every((key) => Boolean(process.env[key]));
}

function getAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function getAnonClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

async function createAuthedClient(email, password) {
  const client = getAnonClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(`Unable to sign in test user ${email}: ${error.message}`);
  }
  return client;
}

async function seedIntegrationFixture() {
  const admin = getAdminClient();
  const base = GOLDEN_DATASET_FIXTURES.dataset_1_freelancer_non_vat;
  const other = GOLDEN_DATASET_FIXTURES.dataset_4_single_owner_aps;

  const users = {
    ownerA: { email: 'integration.owner-a@example.test', password: 'Passw0rd!ownerA' },
    staffA: { email: 'integration.staff-a@example.test', password: 'Passw0rd!staffA' },
    readOnlyA: { email: 'integration.readonly-a@example.test', password: 'Passw0rd!readonlyA' },
    ownerB: { email: 'integration.owner-b@example.test', password: 'Passw0rd!ownerB' }
  };

  const userIds = {};

  for (const [key, user] of Object.entries(users)) {
    const { data, error } = await admin.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true
    });

    if (error && !error.message.toLowerCase().includes('already')) {
      throw new Error(`Failed to create ${user.email}: ${error.message}`);
    }

    let userId = data?.user?.id;
    if (!userId) {
      const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      userId = listed.data?.users?.find((entry) => entry.email === user.email)?.id;
    }

    assert.ok(userId, `Expected user id for ${user.email}`);
    userIds[key] = userId;

    const { error: profileError } = await admin.from('profiles').upsert({ id: userId, email: user.email });
    if (profileError) {
      throw new Error(`Failed to upsert profile for ${user.email}: ${profileError.message}`);
    }
  }

  const companyAId = base.company_id;
  const companyBId = other.company_id;

  const { error: companyAError } = await admin.from('companies').upsert({
    id: companyAId,
    name: 'Integration Company A',
    created_by: userIds.ownerA,
    vat_registered: false
  });
  if (companyAError) throw new Error(companyAError.message);

  const { error: companyBError } = await admin.from('companies').upsert({
    id: companyBId,
    name: 'Integration Company B',
    created_by: userIds.ownerB,
    vat_registered: true
  });
  if (companyBError) throw new Error(companyBError.message);

  const memberships = [
    { company_id: companyAId, user_id: userIds.ownerA, role: 'owner' },
    { company_id: companyAId, user_id: userIds.staffA, role: 'staff' },
    { company_id: companyAId, user_id: userIds.readOnlyA, role: 'read_only' },
    { company_id: companyBId, user_id: userIds.ownerB, role: 'owner' }
  ];

  const { error: membershipError } = await admin.from('company_memberships').upsert(memberships, { onConflict: 'company_id,user_id' });
  if (membershipError) throw new Error(membershipError.message);

  const { error: activeCompanyError } = await admin
    .from('profiles')
    .update({ active_company_id: companyAId })
    .in('id', [userIds.ownerA, userIds.staffA, userIds.readOnlyA]);
  if (activeCompanyError) throw new Error(activeCompanyError.message);

  const { error: activeCompanyBError } = await admin
    .from('profiles')
    .update({ active_company_id: companyBId })
    .eq('id', userIds.ownerB);
  if (activeCompanyBError) throw new Error(activeCompanyBError.message);

  const initialCategoryId = '22222222-2222-4222-8222-222222222222';
  const initialReceiptId = '33333333-3333-4333-8333-333333333333';

  const { error: categoryError } = await admin.from('categories').upsert({
    id: initialCategoryId,
    name: 'Seeded Office',
    user_id: userIds.ownerA,
    company_id: companyAId
  });
  if (categoryError) throw new Error(categoryError.message);

  const { error: receiptError } = await admin.from('receipts').upsert({
    id: initialReceiptId,
    user_id: userIds.ownerA,
    company_id: companyAId,
    path: `${userIds.ownerA}/${companyAId}/seeded.pdf`
  });
  if (receiptError) throw new Error(receiptError.message);

  const { error: txError } = await admin.from('transactions').upsert({
    id: base.transactions[0].id,
    user_id: userIds.ownerA,
    company_id: companyAId,
    description: 'Seeded Integration Transaction',
    amount: base.transactions[0].amount,
    type: 'revenue',
    date: base.transactions[0].date,
    category_id: initialCategoryId,
    receipt_id: initialReceiptId
  });
  if (txError) throw new Error(txError.message);

  return {
    users,
    userIds,
    companyAId,
    companyBId,
    initialCategoryId,
    initialReceiptId,
    decimalAmount: base.transactions[1].amount
  };
}

module.exports = {
  hasIntegrationEnv,
  seedIntegrationFixture,
  createAuthedClient,
  getAdminClient
};
