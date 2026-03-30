const GOLDEN_DATASET_FIXTURES = Object.freeze({
  dataset_1_freelancer_non_vat: {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Dataset 1 — Freelancer, not VAT registered",
    legal_form: "enkeltmandsvirksomhed",
    vat_registered: false,
    company_id: "aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    user_id: "bbbbbbb1-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
    generated_at: "2026-01-15T10:00:00.000Z",
    transactions: [
      { id: "10000001-0000-4000-8000-000000000001", type: "revenue", amount: "12500.00", date: "2026-01-02", receipt_attached: true },
      { id: "10000001-0000-4000-8000-000000000002", type: "revenue", amount: "8100.00", date: "2026-01-09", receipt_attached: true },
      { id: "10000001-0000-4000-8000-000000000003", type: "revenue", amount: "5000.00", date: "2026-01-19", receipt_attached: true },
      { id: "10000001-0000-4000-8000-000000000004", type: "expense", amount: "400.00", date: "2026-01-06", receipt_attached: true },
      { id: "10000001-0000-4000-8000-000000000005", type: "expense", amount: "1200.00", date: "2026-01-10", receipt_attached: false },
      { id: "10000001-0000-4000-8000-000000000006", type: "expense", amount: "950.00", date: "2026-01-13", receipt_attached: true },
      { id: "10000001-0000-4000-8000-000000000007", type: "expense", amount: "2200.00", date: "2026-01-21", receipt_attached: false },
      { id: "10000001-0000-4000-8000-000000000008", type: "expense", amount: "310.00", date: "2026-01-27", receipt_attached: true }
    ]
  },
  dataset_2_freelancer_vat_registered: {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Dataset 2 — Freelancer, VAT registered",
    legal_form: "enkeltmandsvirksomhed",
    vat_registered: true,
    company_id: "aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
    user_id: "bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
    generated_at: "2026-01-15T10:00:00.000Z",
    vat_period: {
      period_start: "2026-01-01",
      period_end: "2026-01-31"
    },
    transactions: [
      { id: "20000002-0000-4000-8000-000000000001", type: "revenue", amount: "99.99", date: "2026-01-04" },
      { id: "20000002-0000-4000-8000-000000000002", type: "revenue", amount: "50.00", date: "2026-01-10" },
      { id: "20000002-0000-4000-8000-000000000003", type: "expense", amount: "49.99", date: "2026-01-12" },
      { id: "20000002-0000-4000-8000-000000000004", type: "expense", amount: "20.00", date: "2026-01-18" }
    ],
    expected_preview: {
      output_vat_total: "30.00",
      input_vat_total: "14.00",
      net_vat_decimal: "16.00"
    }
  },
  dataset_4_single_owner_aps: {
    id: "44444444-4444-4444-8444-444444444444",
    name: "Dataset 4 — Single-owner ApS",
    legal_form: "aps",
    vat_registered: true,
    company_id: "aaaaaaa4-aaaa-4aaa-8aaa-aaaaaaaaaaa4",
    user_id: "bbbbbbb4-bbbb-4bbb-8bbb-bbbbbbbbbbb4",
    generated_at: "2026-01-15T10:00:00.000Z",
    memberships: [
      { user_id: "bbbbbbb4-bbbb-4bbb-8bbb-bbbbbbbbbbb4", role: "owner" },
      { user_id: "ccccccc4-cccc-4ccc-8ccc-ccccccccccc4", role: "accountant" }
    ],
    expected: {
      non_member_access_blocked: true,
      company_scoped_reports_only: true
    }
  },
  dataset_5_refund_reversal: {
    id: "55555555-5555-4555-8555-555555555555",
    name: "Dataset 5 — Invoice, bill, refund, reversal scenario",
    legal_form: "enkeltmandsvirksomhed",
    vat_registered: true,
    company_id: "aaaaaaa5-aaaa-4aaa-8aaa-aaaaaaaaaaa5",
    user_id: "bbbbbbb5-bbbb-4bbb-8bbb-bbbbbbbbbbb5",
    generated_at: "2026-01-15T10:00:00.000Z",
    events: [
      { type: "invoice_issued", amount: "25000.00", date: "2026-01-04" },
      { type: "supplier_bill_recorded", amount: "5500.00", date: "2026-01-07" },
      { type: "customer_refund", amount: "1300.00", date: "2026-01-20" },
      { type: "expense_reversal", amount: "250.00", date: "2026-01-28" }
    ],
    expected: {
      audit_trail_requires_original_and_reversal: true
    }
  }
});

module.exports = {
  GOLDEN_DATASET_FIXTURES
};
