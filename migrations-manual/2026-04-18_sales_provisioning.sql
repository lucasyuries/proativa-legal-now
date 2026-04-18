-- ============================================================================
-- Vendas + Provisionamento de Admins — Proativa
-- ----------------------------------------------------------------------------
-- COMO APLICAR:
-- 1) Acesse o painel do Supabase do projeto SISTEMA
--    (URL definida no secret SYSTEM_SUPABASE_URL).
-- 2) Vá em SQL Editor → New query.
-- 3) Cole TODO este arquivo e clique em Run.
-- 4) É 100% idempotente: pode rodar quantas vezes quiser.
-- ============================================================================

-- ---- ENUM de papel ----
do $$ begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'moderator', 'user');
  end if;
end $$;

-- ---- TABELA: user_roles ----
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

drop policy if exists "Users can view own roles" on public.user_roles;
create policy "Users can view own roles"
  on public.user_roles for select
  to authenticated
  using (auth.uid() = user_id);

-- ---- FUNÇÃO: has_role (SECURITY DEFINER, evita recursão de RLS) ----
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

-- ---- TABELA: plans (catálogo) ----
create table if not exists public.plans (
  id text primary key,
  name text not null,
  description text,
  max_users integer not null default 1,
  features jsonb not null default '{}'::jsonb,
  price_monthly numeric(10,2) not null default 0,
  price_annual  numeric(10,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.plans enable row level security;

drop policy if exists "Plans are publicly readable" on public.plans;
create policy "Plans are publicly readable"
  on public.plans for select
  to anon, authenticated
  using (active = true);

-- Seed dos planos
insert into public.plans (id, name, description, max_users, features, price_monthly, price_annual)
values
  ('starter',      'Starter',      'Pequenas empresas e consultores independentes.', 5,
    '{"relatorios_pdf": true, "heatmap": true, "planos_acao": true, "api": false, "white_label": false, "suporte_prioritario": false}'::jsonb,
    1, 1),
  ('professional', 'Profissional', 'Empresas e consultorias SST em crescimento.',    25,
    '{"relatorios_pdf": true, "heatmap": true, "planos_acao": true, "api": false, "white_label": false, "suporte_prioritario": true}'::jsonb,
    1, 1),
  ('enterprise',   'Empresarial',  'Grandes operações, redes e consultorias.',       999,
    '{"relatorios_pdf": true, "heatmap": true, "planos_acao": true, "api": true,  "white_label": true,  "suporte_prioritario": true}'::jsonb,
    59.97, 599.10)
on conflict (id) do update set
  name           = excluded.name,
  description    = excluded.description,
  max_users      = excluded.max_users,
  features       = excluded.features,
  price_monthly  = excluded.price_monthly,
  price_annual   = excluded.price_annual,
  updated_at     = now();

-- ---- TABELA: system_accounts ----
create table if not exists public.system_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  plan_id text not null references public.plans(id),
  status text not null default 'active'
    check (status in ('active','suspended','cancelled')),
  subscription_id uuid,
  activated_at timestamptz not null default now(),
  expires_at   timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.system_accounts enable row level security;

drop policy if exists "Owners read their account" on public.system_accounts;
create policy "Owners read their account"
  on public.system_accounts for select
  to authenticated
  using (auth.uid() = user_id);

-- ---- COLUNAS extra em subscriptions ----
alter table public.subscriptions
  add column if not exists provisioned_at timestamptz,
  add column if not exists provisioned_user_id uuid references auth.users(id),
  add column if not exists temp_password_sent_at timestamptz;

-- ---- FUNÇÃO: promote_to_admin ----
create or replace function public.promote_to_admin(_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_roles (user_id, role)
  values (_user_id, 'admin')
  on conflict (user_id, role) do nothing;
end;
$$;

-- ---- TRIGGER: updated_at automático ----
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists set_updated_at on public.plans;
create trigger set_updated_at before update on public.plans
  for each row execute function public.tg_set_updated_at();

drop trigger if exists set_updated_at on public.system_accounts;
create trigger set_updated_at before update on public.system_accounts
  for each row execute function public.tg_set_updated_at();
