const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const crypto = require('node:crypto');

const {
  hasIntegrationEnv,
  seedIntegrationFixture,
  createAuthedClient,
  getAdminClient
} = require('./helpers/supabase-integration-helpers');

function getAuthCookieName() {
  const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
  return `sb-${url.hostname.split('.')[0]}-auth-token`;
}

async function buildSessionCookie(client) {
  const { data, error } = await client.auth.getSession();
  if (error || !data?.session) {
    throw new Error(`Unable to resolve session for HTTP integration test: ${error?.message ?? 'missing session'}`);
  }

  const cookieName = getAuthCookieName();
  const encoded = Buffer.from(JSON.stringify(data.session)).toString('base64url');
  return `${cookieName}=base64-${encoded}`;
}

async function waitForServerReady(baseUrl, timeoutMs = 60_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/api/categories`);
      if (response.status === 401 || response.status === 404) {
        return;
      }
    } catch {
      // retry until timeout
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for Next.js server at ${baseUrl}`);
}

if (!hasIntegrationEnv()) {
  test('next route integration env is configured', { skip: 'Missing Supabase integration env vars.' }, () => {});
} else {
  let fixture;
  let ownerA;
  let readOnlyA;
  let ownerCookie;
  let readOnlyCookie;
  let nextServer;
  let baseUrl;

  test.before(async () => {
    fixture = await seedIntegrationFixture();
    ownerA = await createAuthedClient(fixture.users.ownerA.email, fixture.users.ownerA.password);
    readOnlyA = await createAuthedClient(fixture.users.readOnlyA.email, fixture.users.readOnlyA.password);

    ownerCookie = await buildSessionCookie(ownerA);
    readOnlyCookie = await buildSessionCookie(readOnlyA);

    const port = 3300 + Math.floor(Math.random() * 200);
    baseUrl = `http://127.0.0.1:${port}`;

    nextServer = spawn(process.execPath, ['./node_modules/next/dist/bin/next', 'dev', '-p', String(port)], {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'pipe'
    });

    nextServer.stdout.on('data', () => {});
    nextServer.stderr.on('data', () => {});

    await waitForServerReady(baseUrl);
  });

  test.after(async () => {
    if (nextServer && !nextServer.killed) {
      nextServer.kill('SIGTERM');
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  });

  test('/api/transactions covers validation and entitlement lock branches', async () => {
    const invalidResponse = await fetch(`${baseUrl}/api/transactions`, {
      method: 'POST',
      headers: {
        Cookie: ownerCookie,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        description: 'Invalid amount branch',
        amount: 'bad-amount',
        type: 'expense',
        date: '2026-03-01'
      })
    });

    assert.equal(invalidResponse.status, 400);
    const invalidPayload = await invalidResponse.json();
    assert.match(invalidPayload.error, /Amount must be a non-negative decimal string/);

    const admin = getAdminClient();

    const { data: subscription, error: subscriptionError } = await admin
      .from('company_subscriptions')
      .select('plan_id')
      .eq('company_id', fixture.companyAId)
      .in('status', ['active', 'trialing'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    assert.equal(subscriptionError, null, subscriptionError?.message);

    const { error: entitlementUpdateError } = await admin
      .from('plan_entitlements')
      .update({ limit_value: '0', is_enforced: true })
      .eq('plan_id', subscription.plan_id)
      .eq('entitlement_key', 'monthly_vouchers');

    assert.equal(entitlementUpdateError, null, entitlementUpdateError?.message);

    const limitedResponse = await fetch(`${baseUrl}/api/transactions`, {
      method: 'POST',
      headers: {
        Cookie: ownerCookie,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        description: 'Entitlement should soft-lock',
        amount: '10.00',
        type: 'expense',
        date: '2026-03-02'
      })
    });

    assert.equal(limitedResponse.status, 429);
    const limitedPayload = await limitedResponse.json();
    assert.equal(limitedPayload?.soft_lock?.code, 'monthly_voucher_limit_reached');
    assert.ok(limitedPayload?.upgrade_prompt);
  });

  test('/api/categories denies read_only and allows owner', async () => {
    const denied = await fetch(`${baseUrl}/api/categories`, {
      method: 'POST',
      headers: {
        Cookie: readOnlyCookie,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ name: 'Denied Category' })
    });

    assert.equal(denied.status, 403);

    const allowed = await fetch(`${baseUrl}/api/categories`, {
      method: 'POST',
      headers: {
        Cookie: ownerCookie,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ name: `Allowed Category ${crypto.randomUUID().slice(0, 8)}` })
    });

    assert.equal(allowed.status, 200);
    const allowedPayload = await allowed.json();
    assert.ok(allowedPayload.id);
    assert.ok(allowedPayload.name.startsWith('Allowed Category'));
  });

  test('/api/receipts validates missing file and unsupported file type', async () => {
    const missingFileForm = new FormData();
    const missingFileResponse = await fetch(`${baseUrl}/api/receipts`, {
      method: 'POST',
      headers: { Cookie: ownerCookie },
      body: missingFileForm
    });

    assert.equal(missingFileResponse.status, 400);
    const missingFilePayload = await missingFileResponse.json();
    assert.equal(missingFilePayload.code, 'receipt_file_missing');

    const unsupportedFileForm = new FormData();
    unsupportedFileForm.set('file', new File(['x'], 'script.sh', { type: 'application/x-sh' }));

    const unsupportedFileResponse = await fetch(`${baseUrl}/api/receipts`, {
      method: 'POST',
      headers: { Cookie: ownerCookie },
      body: unsupportedFileForm
    });

    assert.equal(unsupportedFileResponse.status, 400);
    const unsupportedFilePayload = await unsupportedFileResponse.json();
    assert.equal(unsupportedFilePayload.code, 'receipt_file_type_not_allowed');
  });

  test('/api/postings/* covers permission-denied and period-lock branches', async () => {
    const deniedPosting = await fetch(`${baseUrl}/api/postings`, {
      method: 'POST',
      headers: {
        Cookie: readOnlyCookie,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ transaction_id: fixture.initialCategoryId })
    });

    assert.equal(deniedPosting.status, 403);

    const lockedDate = '2026-02-24';
    const transactionId = crypto.randomUUID();

    const admin = getAdminClient();
    const { error: transactionError } = await admin.from('transactions').insert({
      id: transactionId,
      user_id: fixture.userIds.ownerA,
      company_id: fixture.companyAId,
      description: 'Posting lock branch transaction',
      amount: '55.00',
      type: 'expense',
      date: lockedDate
    });
    assert.equal(transactionError, null, transactionError?.message);

    const lockResponse = await fetch(`${baseUrl}/api/postings/period-locks`, {
      method: 'POST',
      headers: {
        Cookie: ownerCookie,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ start_date: '2026-02-01', end_date: '2026-02-28', reason: 'HTTP harness lock' })
    });

    assert.equal(lockResponse.status, 201);

    const createPostingResponse = await fetch(`${baseUrl}/api/postings`, {
      method: 'POST',
      headers: {
        Cookie: ownerCookie,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ transaction_id: transactionId })
    });

    assert.equal(createPostingResponse.status, 400);
    const createPostingPayload = await createPostingResponse.json();
    assert.match(createPostingPayload.error, /inside a locked accounting period/);
  });
}
