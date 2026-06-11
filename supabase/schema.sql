-- supabase/schema.sql
-- Personal Accounting Web Application Schema

-- Overwrites existing conflicting tables:
drop table if exists public.attachments, public.bills, public.goals, public.budgets, public.transactions, public.parties, public.categories, public.accounts cascade;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. ACCOUNTS
create table public.accounts (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    type text not null, -- 'Cash', 'Bank', 'Mobile Wallet', 'Credit Card', 'Other'
    balance numeric(15, 2) default 0.00 not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.accounts enable row level security;

create policy "Users can perform all actions on their own accounts"
    on public.accounts for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);


-- 2. CATEGORIES
create table public.categories (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    type text not null, -- 'income' or 'expense'
    color text default '#6366f1' not null, -- Hex color code for premium UI
    icon text default 'Tag' not null, -- Lucide icon name
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, name, type)
);

alter table public.categories enable row level security;

create policy "Users can perform all actions on their own categories"
    on public.categories for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);


-- 3. PARTIES
create table public.parties (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    phone text,
    email text,
    balance numeric(15, 2) default 0.00 not null, -- calculated give/take balance: positive means they owe us (take), negative means we owe them (give)
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.parties enable row level security;

create policy "Users can perform all actions on their own parties"
    on public.parties for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);


-- 4. TRANSACTIONS
create table public.transactions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    account_id uuid references public.accounts(id) on delete cascade not null,
    to_account_id uuid references public.accounts(id) on delete cascade, -- for transfers
    type text not null, -- 'income', 'expense', 'transfer'
    amount numeric(15, 2) not null check (amount > 0),
    category_id uuid references public.categories(id) on delete set null,
    party_id uuid references public.parties(id) on delete set null, -- nullable
    note text,
    date date default current_date not null,
    recurring_interval text default 'none' not null, -- 'none', 'daily', 'weekly', 'monthly', 'yearly'
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.transactions enable row level security;

create policy "Users can perform all actions on their own transactions"
    on public.transactions for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);


-- 5. BUDGETS
create table public.budgets (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    category_id uuid references public.categories(id) on delete cascade not null,
    limit_amount numeric(15, 2) not null check (limit_amount > 0),
    month text not null, -- Format: 'YYYY-MM'
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, category_id, month)
);

alter table public.budgets enable row level security;

create policy "Users can perform all actions on their own budgets"
    on public.budgets for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);


-- 6. GOALS
create table public.goals (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    target_amount numeric(15, 2) not null check (target_amount > 0),
    current_amount numeric(15, 2) default 0.00 not null,
    deadline date,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.goals enable row level security;

create policy "Users can perform all actions on their own goals"
    on public.goals for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);


-- 7. BILLS
create table public.bills (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    amount numeric(15, 2) not null check (amount > 0),
    due_date date not null,
    status text default 'unpaid' not null, -- 'paid', 'unpaid'
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.bills enable row level security;

create policy "Users can perform all actions on their own bills"
    on public.bills for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);


-- 8. ATTACHMENTS
create table public.attachments (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    transaction_id uuid references public.transactions(id) on delete cascade not null,
    file_url text not null,
    file_name text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.attachments enable row level security;

create policy "Users can perform all actions on their own attachments"
    on public.attachments for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);


-- FUNCTIONS & TRIGGERS FOR BALANCES

-- Update account balance helper function
create or replace function public.handle_transaction_balance_change()
returns trigger as $$
begin
    -- 1. Handle Deletions
    if tg_op = 'DELETE' then
        -- Revert source account balance
        if old.type = 'income' then
            update public.accounts set balance = balance - old.amount where id = old.account_id;
        elsif old.type = 'expense' then
            update public.accounts set balance = balance + old.amount where id = old.account_id;
        elsif old.type = 'transfer' then
            update public.accounts set balance = balance + old.amount where id = old.account_id;
            if old.to_account_id is not null then
                update public.accounts set balance = balance - old.amount where id = old.to_account_id;
            end if;
        end if;

        -- Revert party balance if applicable
        if old.party_id is not null then
            if old.type = 'income' then
                -- Income from party means they paid us, so their balance towards us decreases (their credit goes down, meaning they owe us less)
                update public.parties set balance = balance + old.amount where id = old.party_id;
            elsif old.type = 'expense' then
                -- Expense to party means we paid them, so our debt to them decreases or their debt to us increases
                update public.parties set balance = balance - old.amount where id = old.party_id;
            end if;
        end if;
        
        return old;
    end if;

    -- 2. Handle Insertions
    if tg_op = 'INSERT' then
        -- Update source account balance
        if new.type = 'income' then
            update public.accounts set balance = balance + new.amount where id = new.account_id;
        elsif new.type = 'expense' then
            update public.accounts set balance = balance - new.amount where id = new.account_id;
        elsif new.type = 'transfer' then
            update public.accounts set balance = balance - new.amount where id = new.account_id;
            if new.to_account_id is not null then
                update public.accounts set balance = balance + new.amount where id = new.to_account_id;
            end if;
        end if;

        -- Update party balance if applicable
        if new.party_id is not null then
            if new.type = 'income' then
                -- Party paid us. They owe us less.
                update public.parties set balance = balance - new.amount where id = new.party_id;
            elsif new.type = 'expense' then
                -- We paid party. They owe us more / we owe them less.
                update public.parties set balance = balance + new.amount where id = new.party_id;
            end if;
        end if;

        return new;
    end if;

    -- 3. Handle Updates
    if tg_op = 'UPDATE' then
        -- Revert old values
        if old.type = 'income' then
            update public.accounts set balance = balance - old.amount where id = old.account_id;
        elsif old.type = 'expense' then
            update public.accounts set balance = balance + old.amount where id = old.account_id;
        elsif old.type = 'transfer' then
            update public.accounts set balance = balance + old.amount where id = old.account_id;
            if old.to_account_id is not null then
                update public.accounts set balance = balance - old.amount where id = old.to_account_id;
            end if;
        end if;

        if old.party_id is not null then
            if old.type = 'income' then
                update public.parties set balance = balance + old.amount where id = old.party_id;
            elsif old.type = 'expense' then
                update public.parties set balance = balance - old.amount where id = old.party_id;
            end if;
        end if;

        -- Apply new values
        if new.type = 'income' then
            update public.accounts set balance = balance + new.amount where id = new.account_id;
        elsif new.type = 'expense' then
            update public.accounts set balance = balance - new.amount where id = new.account_id;
        elsif new.type = 'transfer' then
            update public.accounts set balance = balance - new.amount where id = new.account_id;
            if new.to_account_id is not null then
                update public.accounts set balance = balance + new.amount where id = new.to_account_id;
            end if;
        end if;

        if new.party_id is not null then
            if new.type = 'income' then
                update public.parties set balance = balance - new.amount where id = new.party_id;
            elsif new.type = 'expense' then
                update public.parties set balance = balance + new.amount where id = new.party_id;
            end if;
        end if;

        return new;
    end if;

    return null;
end;
$$ language plpgsql;

create trigger trg_transactions_balance_change
after insert or update or delete on public.transactions
for each row execute function public.handle_transaction_balance_change();


-- ==========================================
-- STORAGE BUCKETS & POLICIES SETUP
-- ==========================================

-- 1. Create the receipts bucket
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

-- 2. Allow authenticated users to upload files to the receipts bucket
create policy "Allow authenticated uploads to receipts"
on storage.objects for insert
to authenticated
with check (
    bucket_id = 'receipts'
);

-- 3. Allow public read access to files in the receipts bucket
create policy "Allow public read access to receipts"
on storage.objects for select
using (
    bucket_id = 'receipts'
);

-- 4. Allow users to update/delete their own files in the receipts bucket
create policy "Allow authenticated delete/update from receipts"
on storage.objects for delete
to authenticated
using (
    bucket_id = 'receipts'
);
