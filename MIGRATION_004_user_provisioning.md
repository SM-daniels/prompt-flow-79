# Migration 004: Sistema de Provisionamento de Usuários

Esta migração adiciona o sistema completo de provisionamento de usuários com multi-tenancy, incluindo funções RPC para criação idempotente de organizações e dados padrão.

## Passo 1: Adicionar coluna role em users_organizations

```sql
-- Criar enum para roles
create type public.app_role as enum ('owner', 'admin', 'member', 'agent');

-- Adicionar coluna role
alter table public.users_organizations 
add column role app_role not null default 'member';

-- Criar índice para otimizar queries por role
create index idx_users_organizations_role on public.users_organizations(role);
```

## Passo 2: Função RPC para provisionar organização e vínculo

```sql
-- RPC 1: provisiona organização e vínculo (idempotente)
create or replace function public.provision_user(
  p_user_id uuid,
  p_org_name text default null,      -- usar quando NÃO existe invite_token
  p_join_org_id uuid default null,   -- usar quando existe invite_token
  p_role text default 'member'
)
returns table (organization_id uuid, effective_role text)
language plpgsql
security definer
set search_path = public
as $$
declare
  _org_id uuid;
  _app_role app_role;
begin
  -- Converter texto para enum
  _app_role := p_role::app_role;

  if p_join_org_id is null then
    -- Caso 1: Criar nova organização
    if p_org_name is null then
      raise exception 'org_name obrigatório quando não há invite_token';
    end if;

    -- Inserir ou recuperar organização
    insert into organizations (name)
    values (p_org_name)
    on conflict (name) do update set updated_at = now()
    returning id into _org_id;

    -- Vincular usuário como owner
    insert into users_organizations (user_id, organization_id, role)
    values (p_user_id, _org_id, 'owner')
    on conflict (user_id, organization_id) do nothing;

    return query select _org_id, 'owner'::text;

  else
    -- Caso 2: Associar a organização existente via invite
    _org_id := p_join_org_id;

    -- Vincular usuário com role especificada
    insert into users_organizations (user_id, organization_id, role)
    values (p_user_id, _org_id, _app_role)
    on conflict (user_id, organization_id) do nothing;

    return query select _org_id, _app_role::text;
  end if;
end;
$$;
```

## Passo 3: Função RPC para provisionar dados padrão

```sql
-- RPC 2: provisiona dados padrão da org (idempotente)
create or replace function public.bootstrap_org_defaults(
  p_org_id uuid, 
  p_owner_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _contact_id uuid;
  _conv_id uuid;
begin
  -- Contato padrão (se já existe, ignora)
  insert into contacts (id, owner_id, organization_id, name, phone, email, channel)
  values (
    gen_random_uuid(), 
    p_owner_id, 
    p_org_id, 
    'Minha Empresa', 
    null, 
    null, 
    'site'
  )
  on conflict do nothing
  returning id into _contact_id;

  -- Se já existia, recuperar o ID
  if _contact_id is null then
    select id into _contact_id 
    from contacts
    where organization_id = p_org_id 
      and name = 'Minha Empresa' 
    limit 1;
  end if;

  -- Se encontrou ou criou contato, criar conversa
  if _contact_id is not null then
    -- Conversa de boas-vindas
    insert into conversations (id, organization_id, contact_id, paused_ai)
    values (gen_random_uuid(), p_org_id, _contact_id, false)
    on conflict do nothing
    returning id into _conv_id;

    -- Se já existia, recuperar o ID
    if _conv_id is null then
      select id into _conv_id 
      from conversations
      where organization_id = p_org_id 
        and contact_id = _contact_id
      order by created_at asc 
      limit 1;
    end if;

    -- Mensagem de boas-vindas
    if _conv_id is not null then
      insert into messages (
        id, 
        owner_id,
        organization_id, 
        conversation_id, 
        contact_id,
        direction, 
        body, 
        status,
        mig,
        media,
        chat
      )
      values (
        gen_random_uuid(),
        p_owner_id,
        p_org_id, 
        _conv_id, 
        _contact_id,
        'outbound',
        'Bem-vindo(a)! Sua conta foi configurada com sucesso.',
        'sent',
        'system_welcome',
        '[]'::jsonb,
        '{"actor":"system","reason":"org_bootstrap"}'::jsonb
      )
      on conflict do nothing;
    end if;
  end if;
end;
$$;
```

## Passo 4: Função de segurança para verificar roles

```sql
-- Função para verificar se usuário tem determinada role
create or replace function public.has_role(
  _user_id uuid, 
  _role app_role
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users_organizations
    where user_id = _user_id
      and role = _role
  )
$$;
```

## Passo 5: Atualizar políticas RLS

```sql
-- Política para users_organizations permitir insert durante signup
drop policy if exists "Users can view their own organizations" on users_organizations;
drop policy if exists "Users can insert their own organization memberships" on users_organizations;

create policy "Users can view their own organizations"
  on users_organizations for select
  using (auth.uid() = user_id);

create policy "Service role can insert organization memberships"
  on users_organizations for insert
  with check (true);  -- A função RPC com SECURITY DEFINER fará a validação
```

## Como executar

1. Copie todo o SQL acima
2. Acesse o Supabase SQL Editor
3. Cole e execute
4. Verifique se não há erros

## Verificação

Após executar, você pode testar com:

```sql
-- Teste: criar usuário e provisionar
select * from provision_user(
  'user-uuid-aqui'::uuid,
  'Minha Organização',
  null,
  'owner'
);

-- Verificar dados criados
select * from organizations;
select * from users_organizations;
```
