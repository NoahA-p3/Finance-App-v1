-- Non-destructive legacy-schema inventory helper.
-- Purpose: provide a repeatable query surface to detect divergent schema artifacts.
-- This migration does not drop, rename, or mutate runtime data.

create or replace view public.legacy_schema_inventory as
select *
from (
  values
    (
      'table_public_users',
      'table',
      to_regclass('public.users') is not null,
      jsonb_build_object('schema', 'public', 'table', 'users')
    ),
    (
      'table_public_accounts',
      'table',
      to_regclass('public.accounts') is not null,
      jsonb_build_object('schema', 'public', 'table', 'accounts')
    ),
    (
      'column_transactions_account_id',
      'column',
      exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'transactions'
          and column_name = 'account_id'
      ),
      jsonb_build_object('schema', 'public', 'table', 'transactions', 'column', 'account_id')
    ),
    (
      'column_transactions_merchant',
      'column',
      exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'transactions'
          and column_name = 'merchant'
      ),
      jsonb_build_object('schema', 'public', 'table', 'transactions', 'column', 'merchant')
    ),
    (
      'column_transactions_category',
      'column',
      exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'transactions'
          and column_name = 'category'
      ),
      jsonb_build_object('schema', 'public', 'table', 'transactions', 'column', 'category')
    ),
    (
      'column_receipts_file_url',
      'column',
      exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'receipts'
          and column_name = 'file_url'
      ),
      jsonb_build_object('schema', 'public', 'table', 'receipts', 'column', 'file_url')
    ),
    (
      'column_receipts_merchant',
      'column',
      exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'receipts'
          and column_name = 'merchant'
      ),
      jsonb_build_object('schema', 'public', 'table', 'receipts', 'column', 'merchant')
    ),
    (
      'column_receipts_vat',
      'column',
      exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'receipts'
          and column_name = 'vat'
      ),
      jsonb_build_object('schema', 'public', 'table', 'receipts', 'column', 'vat')
    ),
    (
      'policy_receipts_through_transactions',
      'policy',
      exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'receipts'
          and policyname = 'Users manage own receipts through transactions'
      ),
      jsonb_build_object('schema', 'public', 'table', 'receipts', 'policy', 'Users manage own receipts through transactions')
    )
) as inventory(artifact_key, artifact_type, is_present, details);

comment on view public.legacy_schema_inventory is
  'Non-destructive inventory of divergent legacy schema artifacts for convergence planning.';

-- Rollback / recovery notes:
-- - This migration is additive and metadata-only.
-- - To roll back, drop the view:
--   drop view if exists public.legacy_schema_inventory;
