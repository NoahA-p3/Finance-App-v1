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
const { GOLDEN_DATASET_FIXTURES } = require('../fixtures/golden-datasets');

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
  let ownerB;
  let readOnlyA;
  let ownerCookie;
  let ownerBCookie;
  let readOnlyCookie;
  let nextServer;
  let baseUrl;

  test.before(async () => {
    fixture = await seedIntegrationFixture();
    ownerA = await createAuthedClient(fixture.users.ownerA.email, fixture.users.ownerA.password);
    await createAuthedClient(fixture.users.ownerA.email, fixture.users.ownerA.password);
    ownerB = await createAuthedClient(fixture.users.ownerB.email, fixture.users.ownerB.password);
    readOnlyA = await createAuthedClient(fixture.users.readOnlyA.email, fixture.users.readOnlyA.password);

    ownerCookie = await buildSessionCookie(ownerA);
    ownerBCookie = await buildSessionCookie(ownerB);
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



  test('/api/transactions/{id} patch validates UUIDs, permissions, and cross-company receipt ownership', async () => {
    const admin = getAdminClient();
    const transactionId = crypto.randomUUID();
    const categoryId = crypto.randomUUID();
    const receiptId = crypto.randomUUID();
    const crossCompanyReceiptId = crypto.randomUUID();

    const { error: categoryInsertError } = await admin.from('categories').insert({
      id: categoryId,
      name: 'Patch target category',
      user_id: fixture.userIds.ownerA,
      company_id: fixture.companyAId
    });
    assert.equal(categoryInsertError, null, categoryInsertError?.message);

    const { error: receiptInsertError } = await admin.from('receipts').insert({
      id: receiptId,
      user_id: fixture.userIds.ownerA,
      company_id: fixture.companyAId,
      path: `${fixture.userIds.ownerA}/${fixture.companyAId}/patch-target.pdf`
    });
    assert.equal(receiptInsertError, null, receiptInsertError?.message);

    const { error: otherReceiptInsertError } = await admin.from('receipts').insert({
      id: crossCompanyReceiptId,
      user_id: fixture.userIds.ownerB,
      company_id: fixture.companyBId,
      path: `${fixture.userIds.ownerB}/${fixture.companyBId}/cross-company.pdf`
    });
    assert.equal(otherReceiptInsertError, null, otherReceiptInsertError?.message);

    const { error: txInsertError } = await admin.from('transactions').insert({
      id: transactionId,
      user_id: fixture.userIds.ownerA,
      company_id: fixture.companyAId,
      description: 'Patch endpoint target',
      amount: '22.00',
      type: 'expense',
      date: '2026-03-15'
    });
    assert.equal(txInsertError, null, txInsertError?.message);

    const invalidIdResponse = await fetch(`${baseUrl}/api/transactions/not-a-uuid`, {
      method: 'PATCH',
      headers: {
        Cookie: ownerCookie,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ notes: 'invalid uuid path' })
    });

    assert.equal(invalidIdResponse.status, 400);

    const deniedResponse = await fetch(`${baseUrl}/api/transactions/${transactionId}`, {
      method: 'PATCH',
      headers: {
        Cookie: readOnlyCookie,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ notes: 'should be denied' })
    });

    assert.equal(deniedResponse.status, 403);

    const crossCompanyResponse = await fetch(`${baseUrl}/api/transactions/${transactionId}`, {
      method: 'PATCH',
      headers: {
        Cookie: ownerCookie,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ receipt_id: crossCompanyReceiptId })
    });

    assert.equal(crossCompanyResponse.status, 400);
    const crossCompanyPayload = await crossCompanyResponse.json();
    assert.match(crossCompanyPayload.error, /receipt_id does not exist in active company context/);

    const validUpdateResponse = await fetch(`${baseUrl}/api/transactions/${transactionId}`, {
      method: 'PATCH',
      headers: {
        Cookie: ownerCookie,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        category_id: categoryId,
        receipt_id: receiptId,
        notes: 'Updated via integration test'
      })
    });

    assert.equal(validUpdateResponse.status, 200);
    const validPayload = await validUpdateResponse.json();
    assert.equal(validPayload.id, transactionId);
    assert.equal(validPayload.category_id, categoryId);
    assert.equal(validPayload.receipt_id, receiptId);
    assert.equal(validPayload.notes, 'Updated via integration test');
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

  test('/api/vat/reviews/preview is company-isolated and decimal-correct for deterministic VAT fixture', async () => {
    const admin = getAdminClient();
    const dataset2 = GOLDEN_DATASET_FIXTURES.dataset_2_freelancer_vat_registered;

    const companyATransactions = dataset2.transactions.map((transaction) => ({
      id: transaction.id,
      user_id: fixture.userIds.ownerA,
      company_id: fixture.companyAId,
      description: `VAT dataset company A ${transaction.id.slice(-4)}`,
      amount: transaction.amount,
      type: transaction.type,
      date: transaction.date
    }));

    const companyBSeed = {
      id: crypto.randomUUID(),
      user_id: fixture.userIds.ownerB,
      company_id: fixture.companyBId,
      description: 'Cross-company VAT seed row',
      amount: '1000.00',
      type: 'revenue',
      date: dataset2.vat_period.period_start
    };

    const { error: seedCompanyAError } = await admin.from('transactions').upsert(companyATransactions);
    assert.equal(seedCompanyAError, null, seedCompanyAError?.message);

    const { error: seedCompanyBError } = await admin.from('transactions').upsert(companyBSeed);
    assert.equal(seedCompanyBError, null, seedCompanyBError?.message);

    const previewResponse = await fetch(`${baseUrl}/api/vat/reviews/preview`, {
      method: 'POST',
      headers: {
        Cookie: ownerCookie,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        period_start: dataset2.vat_period.period_start,
        period_end: dataset2.vat_period.period_end
      })
    });

    assert.equal(previewResponse.status, 200);
    const previewPayload = await previewResponse.json();

    assert.equal(previewPayload.totals.output_vat_total, dataset2.expected_preview.output_vat_total);
    assert.equal(previewPayload.totals.input_vat_total, dataset2.expected_preview.input_vat_total);
    assert.equal(previewPayload.totals.net_vat_decimal, dataset2.expected_preview.net_vat_decimal);

    const lineIds = new Set(previewPayload.explainability.lines.map((line) => line.transaction_id));
    for (const transaction of dataset2.transactions) {
      assert.ok(lineIds.has(transaction.id), `Expected preview lines to include ${transaction.id}`);
    }
    assert.ok(!lineIds.has(companyBSeed.id), 'Expected cross-company transaction to be excluded from preview output');
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

  test('/api/me/account and /api/me/devices cover unauthorized + minimal success contracts', async () => {
    const unauthorizedAccount = await fetch(`${baseUrl}/api/me/account`);
    assert.equal(unauthorizedAccount.status, 401);
    assert.deepEqual(await unauthorizedAccount.json(), { error: 'Unauthorized' });

    const authorizedAccount = await fetch(`${baseUrl}/api/me/account`, {
      headers: { Cookie: ownerCookie }
    });
    assert.equal(authorizedAccount.status, 200);
    const accountPayload = await authorizedAccount.json();
    assert.ok(accountPayload?.profile);
    assert.equal(typeof accountPayload.profile.name, 'string');
    assert.equal(typeof accountPayload.profile.email, 'string');
    assert.equal(typeof accountPayload.profile.securityStatus, 'string');
    assert.equal(typeof accountPayload.profile.activeSessions, 'number');
    assert.equal(typeof accountPayload.profile.mfaEnabled, 'boolean');
    assert.equal(typeof accountPayload.profile.emailVerified, 'boolean');

    const unauthorizedDevices = await fetch(`${baseUrl}/api/me/devices`);
    assert.equal(unauthorizedDevices.status, 401);
    assert.deepEqual(await unauthorizedDevices.json(), { error: 'Unauthorized' });

    const authorizedDevices = await fetch(`${baseUrl}/api/me/devices`, {
      headers: { Cookie: ownerCookie }
    });
    assert.equal(authorizedDevices.status, 200);
    const devicesPayload = await authorizedDevices.json();
    assert.ok(Array.isArray(devicesPayload.devices));
  });

  test('/api/me/login-alerts covers unauthorized + minimal success contracts', async () => {
    const unauthorized = await fetch(`${baseUrl}/api/me/login-alerts`);
    assert.equal(unauthorized.status, 401);
    assert.deepEqual(await unauthorized.json(), { error: 'Unauthorized' });

    const authorized = await fetch(`${baseUrl}/api/me/login-alerts`, {
      headers: { Cookie: ownerCookie }
    });
    assert.equal(authorized.status, 200);
    const payload = await authorized.json();
    assert.ok(Array.isArray(payload.alerts));
  });

  test('/api/me/mfa/* covers GET + POST + DELETE contracts and unauthorized branches', async () => {
    const unauthorizedGet = await fetch(`${baseUrl}/api/me/mfa`);
    assert.equal(unauthorizedGet.status, 401);
    assert.deepEqual(await unauthorizedGet.json(), { error: 'Unauthorized' });

    const authorizedGet = await fetch(`${baseUrl}/api/me/mfa`, {
      headers: { Cookie: ownerCookie }
    });
    assert.equal(authorizedGet.status, 200);
    const mfaPayload = await authorizedGet.json();
    assert.equal(typeof mfaPayload.mfaEnabled, 'boolean');
    assert.ok(Array.isArray(mfaPayload.factors));

    const unauthorizedEnroll = await fetch(`${baseUrl}/api/me/mfa/enroll`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ friendlyName: 'Integration test factor' })
    });
    assert.equal(unauthorizedEnroll.status, 401);
    assert.deepEqual(await unauthorizedEnroll.json(), { error: 'Unauthorized' });

    const challengeMissingFactor = await fetch(`${baseUrl}/api/me/mfa/challenge`, {
      method: 'POST',
      headers: {
        Cookie: ownerCookie,
        'content-type': 'application/json'
      },
      body: JSON.stringify({})
    });
    assert.equal(challengeMissingFactor.status, 400);
    assert.deepEqual(await challengeMissingFactor.json(), { error: 'factorId is required.' });

    const verifyMissingFields = await fetch(`${baseUrl}/api/me/mfa/verify`, {
      method: 'POST',
      headers: {
        Cookie: ownerCookie,
        'content-type': 'application/json'
      },
      body: JSON.stringify({})
    });
    assert.equal(verifyMissingFields.status, 400);
    assert.deepEqual(await verifyMissingFields.json(), { error: 'factorId, challengeId, and code are required.' });

    const authorizedEnroll = await fetch(`${baseUrl}/api/me/mfa/enroll`, {
      method: 'POST',
      headers: {
        Cookie: ownerCookie,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ friendlyName: 'Integration test factor' })
    });

    assert.ok([200, 400].includes(authorizedEnroll.status));
    const enrollPayload = await authorizedEnroll.json();
    if (authorizedEnroll.status === 200) {
      assert.equal(typeof enrollPayload.factorId, 'string');
      assert.equal(typeof enrollPayload.uri, 'string');
      assert.equal(typeof enrollPayload.qrCode, 'string');

      const deleteEnrolledFactor = await fetch(`${baseUrl}/api/me/mfa/${enrollPayload.factorId}`, {
        method: 'DELETE',
        headers: { Cookie: ownerCookie }
      });
      assert.equal(deleteEnrolledFactor.status, 200);
      assert.deepEqual(await deleteEnrolledFactor.json(), { success: true });
    } else {
      assert.deepEqual(enrollPayload, { error: 'Unable to start MFA enrollment.' });
    }

    const unauthorizedDelete = await fetch(`${baseUrl}/api/me/mfa/11111111-1111-4111-8111-111111111111`, {
      method: 'DELETE'
    });
    assert.equal(unauthorizedDelete.status, 401);
    assert.deepEqual(await unauthorizedDelete.json(), { error: 'Unauthorized' });

    const deleteUnknownFactor = await fetch(`${baseUrl}/api/me/mfa/11111111-1111-4111-8111-111111111111`, {
      method: 'DELETE',
      headers: { Cookie: ownerCookie }
    });
    assert.equal(deleteUnknownFactor.status, 400);
    assert.deepEqual(await deleteUnknownFactor.json(), { error: 'Unable to disable MFA.' });
  });

  test('/api/me/sessions/:session_id covers revoke success/failure and audit fallback contract', async () => {
    const ownerASessionsResponse = await fetch(`${baseUrl}/api/me/sessions`, {
      headers: { Cookie: ownerCookie }
    });
    assert.equal(ownerASessionsResponse.status, 200);
    const ownerASessionsPayload = await ownerASessionsResponse.json();
    assert.ok(Array.isArray(ownerASessionsPayload.sessions));
    assert.ok(ownerASessionsPayload.sessions.length >= 2, 'Expected at least two owner sessions for revoke test');

    const currentSession = ownerASessionsPayload.sessions.find((entry) => entry.isCurrent);
    assert.ok(currentSession, 'Expected to resolve current session');

    const otherSession = ownerASessionsPayload.sessions.find((entry) => entry.id !== currentSession.id);
    assert.ok(otherSession, 'Expected a revocable non-current session');

    const unauthorizedDelete = await fetch(`${baseUrl}/api/me/sessions/${otherSession.id}`, {
      method: 'DELETE'
    });
    assert.equal(unauthorizedDelete.status, 401);
    assert.deepEqual(await unauthorizedDelete.json(), { error: 'Unauthorized' });

    const invalidIdDelete = await fetch(`${baseUrl}/api/me/sessions/not-a-uuid`, {
      method: 'DELETE',
      headers: { Cookie: ownerCookie }
    });
    assert.equal(invalidIdDelete.status, 400);
    assert.deepEqual(await invalidIdDelete.json(), { error: 'Invalid session id.' });

    const ownerBSessionsResponse = await fetch(`${baseUrl}/api/me/sessions`, {
      headers: { Cookie: ownerBCookie }
    });
    assert.equal(ownerBSessionsResponse.status, 200);
    const ownerBSessionsPayload = await ownerBSessionsResponse.json();
    const ownerBSession = ownerBSessionsPayload.sessions[0];
    assert.ok(ownerBSession?.id);

    const forbiddenCrossUserDelete = await fetch(`${baseUrl}/api/me/sessions/${ownerBSession.id}`, {
      method: 'DELETE',
      headers: { Cookie: ownerCookie }
    });
    assert.equal(forbiddenCrossUserDelete.status, 403);
    assert.deepEqual(await forbiddenCrossUserDelete.json(), { error: 'Forbidden' });

    const successfulDelete = await fetch(`${baseUrl}/api/me/sessions/${otherSession.id}`, {
      method: 'DELETE',
      headers: { Cookie: ownerCookie }
    });
    assert.equal(successfulDelete.status, 200);
    assert.deepEqual(await successfulDelete.json(), { success: true });

    const admin = getAdminClient();
    const { data: securityEvents, error: securityEventsError } = await admin
      .from('security_session_events')
      .select('id')
      .eq('actor_user_id', fixture.userIds.ownerA)
      .eq('target_session_id', otherSession.id)
      .eq('event_type', 'session.revoked');
    assert.equal(securityEventsError, null, securityEventsError?.message);

    const { data: retryQueueEvents, error: retryQueueError } = await admin
      .from('security_event_retry_queue')
      .select('id')
      .eq('actor_user_id', fixture.userIds.ownerA)
      .eq('target_session_id', otherSession.id)
      .eq('event_type', 'session.revoked');
    assert.equal(retryQueueError, null, retryQueueError?.message);

    assert.ok(
      securityEvents.length > 0 || retryQueueEvents.length > 0,
      'Expected session revoke to create security audit event or fallback retry-queue event'
    );
  });
}
