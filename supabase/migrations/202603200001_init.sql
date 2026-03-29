create extension if not exists "pgcrypto";

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  path text not null,
  transaction_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  receipt_id uuid references public.receipts(id) on delete set null,
  type text not null check (type in ('expense','revenue')),
  description text not null,
  amount numeric(12,2) not null check (amount >= 0),
  date date not null,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'receipts_transaction_id_fkey'
      and conrelid = 'public.receipts'::regclass
  ) then
    alter table public.receipts
      add constraint receipts_transaction_id_fkey
      foreign key (transaction_id) references public.transactions(id) on delete set null;
  end if;
end $$;

alter table public.categories enable row level security;
alter table public.receipts enable row level security;
alter table public.transactions enable row level security;

create policy "Users manage own categories" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own receipts" on public.receipts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own transactions" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

drop policy if exists "Users upload own receipts" on storage.objects;
create policy "Users upload own receipts" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users view own receipts" on storage.objects;
create policy "Users view own receipts" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users update own receipts" on storage.objects;
create policy "Users update own receipts" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users delete own receipts" on storage.objects;
create policy "Users delete own receipts" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Rollback / recovery notes:
-- Snapshot before rollback:
--   create table if not exists public._snapshot_202603200001_categories as table public.categories;
--   create table if not exists public._snapshot_202603200001_transactions as table public.transactions;
--   create table if not exists public._snapshot_202603200001_receipts as table public.receipts;
--   create table if not exists public._snapshot_202603200001_storage_policies as
--     select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
--     from pg_policies
--     where schemaname in ('public', 'storage')
--       and ((schemaname = 'public' and tablename in ('categories', 'transactions', 'receipts'))
--         or (schemaname = 'storage' and tablename = 'objects'));
-- Recovery rollback (destructive for current objects):
--   drop table if exists public.transactions cascade;
--   drop table if exists public.receipts cascade;
--   drop table if exists public.categories cascade;
--   delete from storage.buckets where id = 'receipts';
-- Re-verify after rollback or restore:
--   select to_regclass('public.categories') as categories_table,
--          to_regclass('public.transactions') as transactions_table,
--          to_regclass('public.receipts') as receipts_table;
--   select policyname, schemaname, tablename, cmd
--   from pg_policies
--   where schemaname in ('public', 'storage')
--     and tablename in ('categories', 'transactions', 'receipts', 'objects')
--   order by schemaname, tablename, policyname;

