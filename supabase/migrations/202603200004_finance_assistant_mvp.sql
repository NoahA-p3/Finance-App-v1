create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  bank_name text not null,
  balance numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid,
  file_url text not null,
  merchant text,
  amount numeric(12,2),
  vat numeric(12,2),
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  amount numeric(12,2) not null,
  merchant text not null,
  date date not null,
  category text,
  receipt_id uuid references public.receipts(id) on delete set null,
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

alter table public.users enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.receipts enable row level security;

drop policy if exists "Users view own user record" on public.users;
create policy "Users view own user record" on public.users
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users manage own accounts" on public.accounts;
create policy "Users manage own accounts" on public.accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own categories" on public.categories;
create policy "Users manage own categories" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own transactions" on public.transactions;
create policy "Users manage own transactions" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own receipts through transactions" on public.receipts;
create policy "Users manage own receipts through transactions" on public.receipts
  for all
  using (
    exists (
      select 1 from public.transactions t
      where t.id = receipts.transaction_id and t.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.transactions t
      where t.id = receipts.transaction_id and t.user_id = auth.uid()
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts',
  'receipts',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set allowed_mime_types = excluded.allowed_mime_types,
    file_size_limit = excluded.file_size_limit;
