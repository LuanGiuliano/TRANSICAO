-- =====================================================================
-- PAINEL DE TRANSIÇÃO GOVERNAMENTAL 2026/2027 - SAGEP / SEDUC-PA
-- CADASTRO COM APROVAÇÃO + REGISTRO DE ACESSOS (SUPABASE)
--
-- Pode ser executado várias vezes (é idempotente): não dá erro de
-- "already exists". Execute inteiro no SQL Editor do Supabase.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Log de acessos
-- ---------------------------------------------------------------------
create table if not exists public.acessos_painel (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  nome text,
  data_hora timestamptz not null default now(),
  user_agent text,
  criado_em timestamptz default now()
);
alter table public.acessos_painel enable row level security;
create index if not exists idx_acessos_painel_data_hora on public.acessos_painel (data_hora desc);
create index if not exists idx_acessos_painel_user_id on public.acessos_painel (user_id);

-- ---------------------------------------------------------------------
-- 2. Perfis: cada pessoa que se cadastra nasce como "pendente"
-- ---------------------------------------------------------------------
create table if not exists public.perfis (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nome text,
  unidade text,
  papel text not null default 'usuario' check (papel in ('usuario', 'admin')),
  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'rejeitado')),
  criado_em timestamptz not null default now(),
  decidido_em timestamptz,
  decidido_por text
);
alter table public.perfis enable row level security;
create index if not exists idx_perfis_status on public.perfis (status, criado_em desc);

-- Quem já se cadastrou antes desta atualização entra como pendente
insert into public.perfis (user_id, email, nome)
select u.id, coalesce(u.email, ''), coalesce(u.raw_user_meta_data->>'nome', split_part(coalesce(u.email, ''), '@', 1))
from auth.users u
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------
-- 3. Funções auxiliares (security definer evita recursão nas políticas)
-- ---------------------------------------------------------------------
create or replace function public.eh_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.perfis
    where user_id = auth.uid() and papel = 'admin' and status = 'aprovado'
  );
$$;

create or replace function public.eh_aprovado()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.perfis
    where user_id = auth.uid() and status = 'aprovado'
  );
$$;

-- ---------------------------------------------------------------------
-- 4. Todo novo usuário do Auth ganha um perfil "pendente" automaticamente
-- ---------------------------------------------------------------------
create or replace function public.criar_perfil_novo_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (user_id, email, nome, unidade)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'unidade'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.criar_perfil_novo_usuario();

-- ---------------------------------------------------------------------
-- 4b. Ao aprovar no painel, confirma o e-mail no Auth automaticamente
--     (evita erro "Email not confirmed" quando o e-mail corporativo bloqueia)
-- ---------------------------------------------------------------------
create or replace function public.confirmar_email_ao_aprovar()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  if new.status = 'aprovado' then
    update auth.users
       set email_confirmed_at = coalesce(email_confirmed_at, now())
     where id = new.user_id and email_confirmed_at is null;
  end if;
  return new;
end;
$$;

drop trigger if exists on_perfil_aprovado on public.perfis;
create trigger on_perfil_aprovado
  after insert or update on public.perfis
  for each row execute function public.confirmar_email_ao_aprovar();

-- Desbloqueia usuários que já estavam aprovados antes desta trigger
update auth.users u
   set email_confirmed_at = coalesce(u.email_confirmed_at, now())
  from public.perfis p
 where p.user_id = u.id
   and p.status = 'aprovado'
   and u.email_confirmed_at is null;

-- ---------------------------------------------------------------------
-- 5. Políticas de segurança (RLS)
--    Remove políticas antigas das duas tabelas e recria do zero.
--    O usuário comum NÃO consegue alterar o próprio status.
-- ---------------------------------------------------------------------
do $$
declare r record;
begin
  for r in (
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('acessos_painel', 'perfis')
  ) loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

create policy "perfis: ver o proprio" on public.perfis
  for select using (user_id = auth.uid());

create policy "perfis: admin ve todos" on public.perfis
  for select using (public.eh_admin());

create policy "perfis: admin decide" on public.perfis
  for update using (public.eh_admin()) with check (public.eh_admin());

-- Acessos: só quem está aprovado registra; admin vê tudo; cada um vê o seu
create policy "acessos: aprovado registra o proprio" on public.acessos_painel
  for insert with check (user_id = auth.uid() and public.eh_aprovado());

create policy "acessos: admin ve todos" on public.acessos_painel
  for select using (public.eh_admin());

create policy "acessos: ver o proprio" on public.acessos_painel
  for select using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 6. PASSO MANUAL: torne a SUA conta administradora.
--    1) Cadastre-se no painel (Solicitar Acesso) ou crie o usuário em Auth -> Users
--    2) Troque o e-mail abaixo pelo seu e rode estes 2 comandos:
-- ---------------------------------------------------------------------
-- update auth.users
--    set email_confirmed_at = coalesce(email_confirmed_at, now())
--  where lower(email) = lower('SEU_EMAIL_AQUI');
--
-- insert into public.perfis (user_id, email, nome, papel, status, decidido_em, decidido_por)
-- select id, email, coalesce(raw_user_meta_data->>'nome', split_part(email, '@', 1)), 'admin', 'aprovado', now(), 'inicial'
--   from auth.users
--  where lower(email) = lower('SEU_EMAIL_AQUI')
-- on conflict (user_id) do update
--    set papel = 'admin', status = 'aprovado', decidido_em = now(), decidido_por = 'inicial'
-- returning user_id, email, papel, status;
