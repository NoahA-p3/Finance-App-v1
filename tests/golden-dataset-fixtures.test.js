const test = require('node:test');
const assert = require('node:assert/strict');

const { GOLDEN_DATASET_FIXTURES } = require('./fixtures/golden-datasets');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DECIMAL_AMOUNT_PATTERN = /^\d+\.\d{2}$/;

test('golden fixtures include deterministic keys aligned to documented scenario names', () => {
  assert.deepEqual(Object.keys(GOLDEN_DATASET_FIXTURES), [
    'dataset_1_freelancer_non_vat',
    'dataset_2_freelancer_vat_registered',
    'dataset_4_single_owner_aps',
    'dataset_5_refund_reversal'
  ]);

  assert.equal(
    GOLDEN_DATASET_FIXTURES.dataset_1_freelancer_non_vat.name,
    'Dataset 1 — Freelancer, not VAT registered'
  );
  assert.equal(
    GOLDEN_DATASET_FIXTURES.dataset_2_freelancer_vat_registered.name,
    'Dataset 2 — Freelancer, VAT registered'
  );
  assert.equal(
    GOLDEN_DATASET_FIXTURES.dataset_4_single_owner_aps.name,
    'Dataset 4 — Single-owner ApS'
  );
  assert.equal(
    GOLDEN_DATASET_FIXTURES.dataset_5_refund_reversal.name,
    'Dataset 5 — Invoice, bill, refund, reversal scenario'
  );
});

test('golden fixtures use fixed IDs and timestamps', () => {
  for (const fixture of Object.values(GOLDEN_DATASET_FIXTURES)) {
    assert.match(fixture.id, UUID_PATTERN);
    assert.match(fixture.company_id, UUID_PATTERN);
    assert.match(fixture.user_id, UUID_PATTERN);
    assert.equal(fixture.generated_at, '2026-01-15T10:00:00.000Z');
  }
});

test('finance fixture amounts are decimal-safe strings and event dates are deterministic', () => {
  const dataset1 = GOLDEN_DATASET_FIXTURES.dataset_1_freelancer_non_vat;
  const dataset2 = GOLDEN_DATASET_FIXTURES.dataset_2_freelancer_vat_registered;
  const dataset5 = GOLDEN_DATASET_FIXTURES.dataset_5_refund_reversal;

  assert.equal(dataset1.transactions.length, 8);

  const receiptAttachedCount = dataset1.transactions.filter((tx) => tx.receipt_attached).length;
  const receiptMissingCount = dataset1.transactions.filter((tx) => !tx.receipt_attached).length;
  assert.equal(receiptAttachedCount, 6);
  assert.equal(receiptMissingCount, 2);

  for (const tx of dataset1.transactions) {
    assert.match(tx.id, UUID_PATTERN);
    assert.match(tx.amount, DECIMAL_AMOUNT_PATTERN);
    assert.match(tx.date, DATE_PATTERN);
    assert.ok(tx.type === 'revenue' || tx.type === 'expense');
  }

  assert.equal(dataset2.transactions.length, 4);
  for (const tx of dataset2.transactions) {
    assert.match(tx.id, UUID_PATTERN);
    assert.match(tx.amount, DECIMAL_AMOUNT_PATTERN);
    assert.match(tx.date, DATE_PATTERN);
    assert.ok(tx.type === 'revenue' || tx.type === 'expense');
  }

  assert.deepEqual(dataset2.expected_preview, {
    output_vat_total: '30.00',
    input_vat_total: '14.00',
    net_vat_decimal: '16.00'
  });

  for (const event of dataset5.events) {
    assert.match(event.amount, DECIMAL_AMOUNT_PATTERN);
    assert.match(event.date, DATE_PATTERN);
  }
});
