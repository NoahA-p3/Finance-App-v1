const test = require('node:test');
const assert = require('node:assert/strict');

const {
  hasIntegrationEnv,
  seedIntegrationFixture,
  createAuthedClient,
  getAdminClient
} = require('./helpers/supabase-integration-helpers');

if (!hasIntegrationEnv()) {
  test('integration env is configured', { skip: 'Missing Supabase integration env vars.' }, () => {});
} else {
  let fixture;
  let ownerA;
  let staffA;
  let readOnlyA;
  let ownerB;

  test.before(async () => {
    fixture = await seedIntegrationFixture();
    ownerA = await createAuthedClient(fixture.users.ownerA.email, fixture.users.ownerA.password);
    staffA = await createAuthedClient(fixture.users.staffA.email, fixture.users.staffA.password);
    readOnlyA = await createAuthedClient(fixture.users.readOnlyA.email, fixture.users.readOnlyA.password);
    ownerB = await createAuthedClient(fixture.users.ownerB.email, fixture.users.ownerB.password);
  });

  test('cross-tenant denial and same-company allow for transactions/categories/receipts backing finance APIs', async () => {
    const inCompanyCategory = '44444444-4444-4444-8444-444444444440';
    const inCompanyReceipt = '55555555-5555-4555-8555-555555555550';

    const { error: categoryInsertError } = await ownerA.from('categories').insert({
      id: inCompanyCategory,
      name: 'Integration Category A',
      user_id: fixture.userIds.ownerA,
      company_id: fixture.companyAId
    });
    assert.equal(categoryInsertError, null, categoryInsertError?.message);

    const { error: receiptInsertError } = await ownerA.from('receipts').insert({
      id: inCompanyReceipt,
      user_id: fixture.userIds.ownerA,
      company_id: fixture.companyAId,
      path: `${fixture.userIds.ownerA}/${fixture.companyAId}/integration-a.pdf`
    });
    assert.equal(receiptInsertError, null, receiptInsertError?.message);

    const { error: txInsertError } = await ownerA.from('transactions').insert({
      user_id: fixture.userIds.ownerA,
      company_id: fixture.companyAId,
      description: 'Owner A same-company transaction',
      amount: fixture.decimalAmount,
      type: 'revenue',
      date: '2026-02-14',
      category_id: inCompanyCategory,
      receipt_id: inCompanyReceipt
    });
    assert.equal(txInsertError, null, txInsertError?.message);

    const { error: crossTenantTxError } = await ownerA.from('transactions').insert({
      user_id: fixture.userIds.ownerA,
      company_id: fixture.companyBId,
      description: 'Cross tenant should fail',
      amount: '42.00',
      type: 'expense',
      date: '2026-02-15'
    });
    assert.ok(crossTenantTxError, 'Expected cross-tenant transaction insert to be denied');

    const { error: crossTenantCategoryError } = await ownerA.from('categories').insert({
      name: 'Cross tenant category fail',
      user_id: fixture.userIds.ownerA,
      company_id: fixture.companyBId
    });
    assert.ok(crossTenantCategoryError, 'Expected cross-tenant category insert to be denied');

    const { error: crossTenantReceiptError } = await ownerA.from('receipts').insert({
      user_id: fixture.userIds.ownerA,
      company_id: fixture.companyBId,
      path: `${fixture.userIds.ownerA}/${fixture.companyBId}/cross-tenant.pdf`
    });
    assert.ok(crossTenantReceiptError, 'Expected cross-tenant receipt insert to be denied');

    const { data: visibleTransactions, error: visibleTransactionsError } = await ownerA
      .from('transactions')
      .select('company_id');

    assert.equal(visibleTransactionsError, null, visibleTransactionsError?.message);
    assert.ok((visibleTransactions ?? []).length >= 1);
    assert.ok((visibleTransactions ?? []).every((row) => row.company_id === fixture.companyAId));
  });

  test('read_only role is denied writes while staff can still write', async () => {
    const { error: staffInsertError } = await staffA.from('transactions').insert({
      user_id: fixture.userIds.staffA,
      company_id: fixture.companyAId,
      description: 'Staff write should pass',
      amount: '99.99',
      type: 'expense',
      date: '2026-02-16'
    });
    assert.equal(staffInsertError, null, staffInsertError?.message);

    const attempts = await Promise.all([
      readOnlyA.from('transactions').insert({
        user_id: fixture.userIds.readOnlyA,
        company_id: fixture.companyAId,
        description: 'Read only tx should fail',
        amount: '10.00',
        type: 'expense',
        date: '2026-02-17'
      }),
      readOnlyA.from('categories').insert({
        name: 'Read only category should fail',
        user_id: fixture.userIds.readOnlyA,
        company_id: fixture.companyAId
      }),
      readOnlyA.from('receipts').insert({
        user_id: fixture.userIds.readOnlyA,
        company_id: fixture.companyAId,
        path: `${fixture.userIds.readOnlyA}/${fixture.companyAId}/readonly.pdf`
      })
    ]);

    for (const attempt of attempts) {
      assert.ok(attempt.error, 'Expected read_only write attempt to fail due role permissions');
    }
  });

  test('posting reversal + period-lock + append-only immutability enforcement', async () => {
    const admin = getAdminClient();

    const txId = '66666666-6666-4666-8666-666666666666';
    const { error: insertTxError } = await admin.from('transactions').insert({
      id: txId,
      user_id: fixture.userIds.ownerA,
      company_id: fixture.companyAId,
      description: 'Posting source transaction',
      amount: '250.00',
      type: 'expense',
      date: '2026-02-20'
    });
    assert.equal(insertTxError, null, insertTxError?.message);

    const { data: postedEntry, error: postedEntryError } = await ownerA
      .from('journal_entries')
      .insert({
        company_id: fixture.companyAId,
        source_transaction_id: txId,
        status: 'posted',
        posting_date: '2026-02-20',
        description: 'Posted integration entry',
        posted_by: fixture.userIds.ownerA,
        posted_at: '2026-02-20T10:00:00.000Z'
      })
      .select('id')
      .single();
    assert.equal(postedEntryError, null, postedEntryError?.message);

    const { error: reverseEntryError } = await ownerA.from('journal_entries').insert({
      company_id: fixture.companyAId,
      source_transaction_id: txId,
      reversal_of_journal_entry_id: postedEntry.id,
      status: 'posted',
      posting_date: '2026-02-20',
      description: 'Reversal integration entry',
      posted_by: fixture.userIds.ownerA,
      posted_at: '2026-02-20T11:00:00.000Z'
    });
    assert.equal(reverseEntryError, null, reverseEntryError?.message);

    const { error: markReversedError } = await ownerA
      .from('journal_entries')
      .update({
        status: 'reversed',
        reversed_by: fixture.userIds.ownerA,
        reversed_at: '2026-02-20T11:01:00.000Z'
      })
      .eq('id', postedEntry.id);
    assert.equal(markReversedError, null, markReversedError?.message);

    const { error: forbiddenMutationError } = await ownerA
      .from('journal_entries')
      .update({ description: 'This mutation must be blocked' })
      .eq('id', postedEntry.id);
    assert.ok(forbiddenMutationError, 'Expected append-only trigger to block mutation on finalized entry');

    const { error: lockError } = await ownerA.from('period_locks').insert({
      company_id: fixture.companyAId,
      start_date: '2026-02-01',
      end_date: '2026-02-28',
      reason: 'Month-end lock',
      locked_by: fixture.userIds.ownerA
    });
    assert.equal(lockError, null, lockError?.message);

    const { data: lockMatch, error: lockMatchError } = await ownerA
      .from('period_locks')
      .select('id')
      .eq('company_id', fixture.companyAId)
      .lte('start_date', '2026-02-20')
      .gte('end_date', '2026-02-20')
      .maybeSingle();
    assert.equal(lockMatchError, null, lockMatchError?.message);
    assert.ok(lockMatch, 'Expected period lock query to find lock for posting date (service precondition)');

    const { data: ownerBPostedView, error: ownerBPostedViewError } = await ownerB
      .from('journal_entries')
      .select('id')
      .eq('id', postedEntry.id);

    assert.equal(ownerBPostedViewError, null, ownerBPostedViewError?.message);
    assert.equal(ownerBPostedView.length, 0, 'Cross-tenant user should not read company A posting rows');
  });

  test(
    'session revocation audit failure is tracked for async replay (future integration placeholder)',
    { skip: 'TODO: enable once retry queue + session revocation endpoint integration harness is implemented.' },
    () => {}
  );
}
