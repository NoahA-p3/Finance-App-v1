-- Add optional user notes for transaction bookkeeping context.

alter table public.transactions
  add column if not exists notes text;

-- Rollback / recovery notes:
-- Snapshot before rollback:
--   create table if not exists public._snapshot_202603300001_transactions_notes as
--     select id, notes from public.transactions where notes is not null;
-- Recovery rollback:
--   alter table public.transactions drop column if exists notes;
-- Re-verify after rollback or restore:
--   select column_name from information_schema.columns
--   where table_schema = 'public' and table_name = 'transactions' and column_name = 'notes';
