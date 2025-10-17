# Migration 002 - Multi-Tenant & Auto-Unpause (30 min)

## ⚠️ IMPORTANTE: Execute este SQL no Supabase SQL Editor

Esta migration adiciona:
- ✅ Estrutura multi-tenant com organizations
- ✅ Pausa temporária de IA com auto-despausa em 30 minutos
- ✅ Suporte a MIG (ID do provedor)
- ✅ Suporte a mídias e interpretações
- ✅ Sistema de roles (super_admin, org_admin, agent)

---

## 📋 SQL para executar no Supabase

Copie e cole o código abaixo no **Supabase SQL Editor**:

```sql
-- Multi-tenant structure with organizations
create extension if not exists pgcrypto;

-- 1) Organizations table
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) User-Organization relationship with roles
create table if not exists public.users_organizations (
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role text not null check (role in ('super_admin','org_admin','agent')),
  created_at timestamptz not null default now(),
  primary key (user_id, organization_id)
);

create index on public.users_organizations (organization_id);
create index on public.users_organizations (user_id);

-- 3) Add organization_id to existing tables
alter table public.contacts add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
create index if not exists contacts_organization_idx on public.contacts (organization_id);

-- 4) Create conversations table
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  paused_ai boolean not null default false,
  paused_at timestamptz,
  paused_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.conversations (organization_id, contact_id);
create index on public.conversations (paused_ai, paused_until);

-- 5) Update messages table structure
alter table public.messages add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.messages add column if not exists mig text;
alter table public.messages add column if not exists media jsonb default '[]'::jsonb;
alter table public.messages add column if not exists interpretations jsonb default '{}'::jsonb;
alter table public.messages drop column if exists paused_ai;

create index if not exists messages_organization_idx on public.messages (organization_id);
create index if not exists messages_media_idx on public.messages using gin (media);
create index if not exists messages_interpretations_idx on public.messages using gin (interpretations);

-- 6) Helper function for RLS
create or replace function public.user_in_org(org_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.users_organizations uo
    where uo.organization_id = org_id and uo.user_id = auth.uid()
  );
$$;

-- 7) Enable RLS on new tables
alter table public.organizations enable row level security;
alter table public.users_organizations enable row level security;
alter table public.conversations enable row level security;

-- 8) RLS Policies for organizations
create policy "Users can view their organizations" on public.organizations
  for select using (
    exists (
      select 1 from public.users_organizations uo
      where uo.organization_id = id and uo.user_id = auth.uid()
    )
  );

-- 9) RLS Policies for users_organizations
create policy "Users can view their org memberships" on public.users_organizations
  for select using (user_id = auth.uid());

-- 10) Update RLS policies for existing tables
drop policy if exists "Users can view their contacts" on public.contacts;
drop policy if exists "Users can insert their contacts" on public.contacts;
drop policy if exists "Users can update their contacts" on public.contacts;
drop policy if exists "Users can delete their contacts" on public.contacts;

create policy "Users can view org contacts" on public.contacts
  for select using (organization_id is null or public.user_in_org(organization_id));

create policy "Users can manage org contacts" on public.contacts
  for all using (organization_id is null or public.user_in_org(organization_id));

-- 11) RLS Policies for conversations
create policy "Users can view org conversations" on public.conversations
  for select using (public.user_in_org(organization_id));

create policy "Users can manage org conversations" on public.conversations
  for all using (public.user_in_org(organization_id));

-- 12) Update messages RLS
drop policy if exists "Users can view their messages" on public.messages;
drop policy if exists "Users can insert their messages" on public.messages;
drop policy if exists "Users can update their messages" on public.messages;
drop policy if exists "Users can delete their messages" on public.messages;

create policy "Users can view org messages" on public.messages
  for select using (organization_id is null or public.user_in_org(organization_id));

create policy "Users can manage org messages" on public.messages
  for all using (organization_id is null or public.user_in_org(organization_id));

-- 13) Auto-unpause function (executa automaticamente após 30 min)
create or replace function public.auto_unpause_conversations()
returns void language plpgsql security definer as $$
begin
  update public.conversations
     set paused_ai = false, 
         paused_at = null, 
         paused_until = null, 
         updated_at = now()
   where paused_ai = true 
     and paused_until is not null 
     and paused_until <= now();
end;
$$;

-- 14) Updated_at triggers
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger conversations_updated_at before update on public.conversations
  for each row execute function public.handle_updated_at();

create trigger organizations_updated_at before update on public.organizations
  for each row execute function public.handle_updated_at();

-- 15) Enable realtime for conversations
alter publication supabase_realtime add table public.conversations;
```

---

## 🔄 Configurar Auto-Unpause (pg_cron)

**IMPORTANTE**: O pg_cron já está habilitado no Supabase. Execute este SQL para agendar a tarefa:

```sql
-- Agendar auto-unpause a cada minuto
select cron.schedule(
  'auto-unpause-conversations',
  '* * * * *', -- a cada minuto
  $$select public.auto_unpause_conversations();$$
);
```

---

## 🧪 Testar a Migration

Após executar a migration:

1. **Criar uma organização de teste**:
```sql
insert into public.organizations (name) 
values ('Minha Empresa') 
returning *;
```

2. **Associar seu usuário à organização** (substitua os UUIDs):
```sql
insert into public.users_organizations (user_id, organization_id, role)
values (
  'SEU-USER-ID-AQUI', 
  'ORG-ID-DA-QUERY-ACIMA', 
  'org_admin'
);
```

3. **Testar pausa de 30 minutos**:
   - Pause a IA em uma conversa
   - Verifique que `paused_until` está 30 min à frente
   - Aguarde 1-2 minutos e verifique que o cron despausa automaticamente

---

## ✅ Checklist

- [ ] SQL da migration executado sem erros
- [ ] Tabelas `organizations`, `users_organizations`, `conversations` criadas
- [ ] Colunas `organization_id`, `mig`, `media`, `interpretations` adicionadas
- [ ] Cron job `auto-unpause-conversations` agendado
- [ ] RLS policies atualizadas
- [ ] Realtime habilitado em `conversations`
- [ ] Organização de teste criada
- [ ] Usuário associado à organização

---

## 🎯 Próximos Passos (Opcional)

Esta migration prepara a estrutura base. Para funcionalidade completa:

1. **Interface de Admin**: criar/gerenciar organizações
2. **Upload de Mídias**: integrar com Supabase Storage
3. **Processamento de Interpretações**: edge functions para ASR/OCR/Vision
4. **Dashboard Multi-Tenant**: filtrar por organização no frontend

---

## 📞 Suporte

Se encontrar erros durante a migration:
1. Verifique se a migration anterior (001) foi executada
2. Confira os logs no Supabase SQL Editor
3. Verifique se pg_cron está habilitado (deveria estar por padrão)
