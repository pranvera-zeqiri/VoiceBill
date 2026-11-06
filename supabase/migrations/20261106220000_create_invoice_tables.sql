create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete restrict,
  number text not null,
  title text not null,
  date date not null default current_date,
  due_date date not null default (current_date + 14),
  vat_rate numeric not null default 0,
  status text not null default 'draft',
  from_voice boolean not null default false,
  audio_seconds numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.invoices
  add column if not exists user_id uuid,
  add column if not exists customer_id uuid,
  add column if not exists number text,
  add column if not exists title text,
  add column if not exists date date default current_date,
  add column if not exists due_date date default (current_date + 14),
  add column if not exists vat_rate numeric default 0,
  add column if not exists status text default 'draft',
  add column if not exists from_voice boolean default false,
  add column if not exists audio_seconds numeric,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.invoices
set number = numbered.number
from (
  select id, lpad(row_number() over (
    partition by user_id order by created_at nulls first, id
  )::text, 4, '0') as number
  from public.invoices
  where number is null
) as numbered
where public.invoices.id = numbered.id;

update public.invoices
set title = 'Faturë'
where title is null;

update public.invoices as invoice
set user_id = customer.user_id
from public.customers as customer
where invoice.customer_id = customer.id
  and invoice.user_id is null;

do $$
begin
  if exists (
    select 1
    from public.invoices
    where user_id is null or customer_id is null
  ) then
    raise exception
      'Cannot migrate invoices: existing rows need valid user_id and customer_id values.';
  end if;
end
$$;

alter table public.invoices
  alter column user_id set not null,
  alter column customer_id set not null,
  alter column number set not null,
  alter column title set not null,
  alter column date set not null,
  alter column due_date set not null,
  alter column vat_rate set not null,
  alter column status set not null,
  alter column from_voice set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.invoices'::regclass
      and conname = 'invoices_user_id_fkey'
  ) then
    alter table public.invoices
      add constraint invoices_user_id_fkey
      foreign key (user_id) references auth.users (id) on delete cascade;
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.invoices'::regclass
      and conname = 'invoices_customer_id_fkey'
  ) then
    alter table public.invoices
      add constraint invoices_customer_id_fkey
      foreign key (customer_id) references public.customers (id) on delete restrict;
  end if;
end
$$;

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  title text not null,
  quantity numeric not null,
  unit_price numeric not null,
  unit text not null default 'shërbim',
  needs_confirm boolean not null default false
);

alter table public.invoice_items
  add column if not exists invoice_id uuid,
  add column if not exists title text,
  add column if not exists quantity numeric,
  add column if not exists unit_price numeric,
  add column if not exists unit text default 'shërbim',
  add column if not exists needs_confirm boolean default false;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'invoice_items'
      and column_name = 'description'
  ) then
    execute $migration$
      update public.invoice_items
      set title = coalesce(title, description, '')
      where title is null
    $migration$;
    execute 'alter table public.invoice_items alter column description drop not null';
  else
    update public.invoice_items
    set title = ''
    where title is null;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from public.invoice_items
    where invoice_id is null
      or quantity is null
      or unit_price is null
  ) then
    raise exception
      'Cannot migrate invoice_items: existing rows need invoice_id, quantity, and unit_price values.';
  end if;
end
$$;

alter table public.invoice_items
  alter column invoice_id set not null,
  alter column title set not null,
  alter column quantity set not null,
  alter column unit_price set not null,
  alter column unit set not null,
  alter column needs_confirm set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.invoice_items'::regclass
      and conname = 'invoice_items_invoice_id_fkey'
  ) then
    alter table public.invoice_items
      add constraint invoice_items_invoice_id_fkey
      foreign key (invoice_id) references public.invoices (id) on delete cascade;
  end if;
end
$$;

create index if not exists invoices_user_created_at_idx
  on public.invoices (user_id, created_at desc);
create index if not exists invoice_items_invoice_id_idx
  on public.invoice_items (invoice_id);

alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;

drop policy if exists "Users can read their invoices" on public.invoices;
create policy "Users can read their invoices"
  on public.invoices for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their invoices" on public.invoices;
create policy "Users can create their invoices"
  on public.invoices for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.customers
      where customers.id = invoices.customer_id
        and customers.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update their invoices" on public.invoices;
create policy "Users can update their invoices"
  on public.invoices for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their invoices" on public.invoices;
create policy "Users can delete their invoices"
  on public.invoices for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read their invoice items" on public.invoice_items;
create policy "Users can read their invoice items"
  on public.invoice_items for select
  using (
    exists (
      select 1
      from public.invoices
      where invoices.id = invoice_items.invoice_id
        and invoices.user_id = auth.uid()
    )
  );

drop policy if exists "Users can create their invoice items" on public.invoice_items;
create policy "Users can create their invoice items"
  on public.invoice_items for insert
  with check (
    exists (
      select 1
      from public.invoices
      where invoices.id = invoice_items.invoice_id
        and invoices.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update their invoice items" on public.invoice_items;
create policy "Users can update their invoice items"
  on public.invoice_items for update
  using (
    exists (
      select 1
      from public.invoices
      where invoices.id = invoice_items.invoice_id
        and invoices.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.invoices
      where invoices.id = invoice_items.invoice_id
        and invoices.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete their invoice items" on public.invoice_items;
create policy "Users can delete their invoice items"
  on public.invoice_items for delete
  using (
    exists (
      select 1
      from public.invoices
      where invoices.id = invoice_items.invoice_id
        and invoices.user_id = auth.uid()
    )
  );
