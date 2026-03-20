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

alter table public.receipts
  add constraint receipts_transaction_id_fkey
  foreign key (transaction_id) references public.transactions(id) on delete set null;

alter table public.categories enable row level security;
alter table public.receipts enable row level security;
alter table public.transactions enable row level security;

create policy "Users manage own categories" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own receipts" on public.receipts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own transactions" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
