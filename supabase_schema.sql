-- =====================================================================
-- PAINEL DE TRANSIÇÃO GOVERNAMENTAL 2026/2027 - SAGEP / SEDUC-PA
-- SCRIPT DE CRIAÇÃO DA TABELA DE REGISTRO DE ACESSOS (SUPABASE)
-- Execute este script no SQL Editor do seu projeto Supabase
-- =====================================================================

-- 1. Criação da tabela de logs de acesso
create table if not exists public.acessos_painel (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  nome text,
  data_hora timestamptz not null default now(),
  user_agent text,
  criado_em timestamptz default now()
);

-- Comentários descritivos
comment on table public.acessos_painel is 'Registros de login e acesso ao Painel de Transição SAGEP / SEDUC-PA';
comment on column public.acessos_painel.email is 'E-mail do usuário autenticado';
comment on column public.acessos_painel.data_hora is 'Data e horário em que o acesso foi registrado';

-- 2. Habilitação de Row Level Security (RLS) para proteção de dados
alter table public.acessos_painel enable row level security;

-- 3. Políticas de Segurança (RLS)
-- Permitir que qualquer usuário autenticado insira seu próprio registro de acesso
create policy "Usuários autenticados podem registrar seu acesso"
  on public.acessos_painel
  for insert
  with check (auth.role() = 'authenticated');

-- Permitir que usuários autenticados visualizem o histórico de acessos
create policy "Usuários autenticados podem visualizar acessos"
  on public.acessos_painel
  for select
  using (auth.role() = 'authenticated');

-- 4. Índice para consultas rápidas por data e por usuário
create index if not exists idx_acessos_painel_data_hora on public.acessos_painel (data_hora desc);
create index if not exists idx_acessos_painel_user_id on public.acessos_painel (user_id);
