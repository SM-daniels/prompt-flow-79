# Migration 003: Criar tabelas conversations e users_organizations

Execute as seguintes queries SQL no Supabase para corrigir os erros de "tabela não encontrada":

## 1. Criar tabela conversations

```sql
-- Create conversations table
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  contact_id uuid references public.contacts(id) on delete cascade not null,
  paused_ai boolean default false,
  paused_at timestamptz,
  paused_until timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(contact_id)
);

-- Enable RLS
alter table public.conversations enable row level security;

-- Create policies for conversations
create policy "Users can view their organization's conversations"
  on public.conversations
  for select
  to authenticated
  using (
    organization_id in (
      select organization_id from public.contacts where owner_id = auth.uid()
    )
  );

create policy "Users can insert conversations for their contacts"
  on public.conversations
  for insert
  to authenticated
  with check (
    contact_id in (
      select id from public.contacts where owner_id = auth.uid()
    )
  );

create policy "Users can update their organization's conversations"
  on public.conversations
  for update
  to authenticated
  using (
    organization_id in (
      select organization_id from public.contacts where owner_id = auth.uid()
    )
  );

-- Create index for better performance
create index if not exists conversations_contact_id_idx on public.conversations(contact_id);
create index if not exists conversations_organization_id_idx on public.conversations(organization_id);

-- Create trigger to update updated_at
create or replace function public.update_conversations_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_conversations_updated_at
  before update on public.conversations
  for each row
  execute function public.update_conversations_updated_at();
```

## 2. Criar tabela users_organizations

```sql
-- Create users_organizations table
create table if not exists public.users_organizations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  organization_id uuid not null,
  created_at timestamptz default now(),
  unique(user_id, organization_id)
);

-- Enable RLS
alter table public.users_organizations enable row level security;

-- Create policies
create policy "Users can view their own organization memberships"
  on public.users_organizations
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert their own organization memberships"
  on public.users_organizations
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Create index
create index if not exists users_organizations_user_id_idx on public.users_organizations(user_id);
create index if not exists users_organizations_organization_id_idx on public.users_organizations(organization_id);
```

## 3. Auto-criar associação usuário-organização

```sql
-- Function to auto-create user organization on first contact creation
create or replace function public.auto_create_user_organization()
returns trigger as $$
declare
  v_org_id uuid;
begin
  -- Check if user already has an organization
  select organization_id into v_org_id
  from public.users_organizations
  where user_id = auth.uid()
  limit 1;
  
  -- If no organization exists, use the contact's organization
  if v_org_id is null and new.organization_id is not null then
    insert into public.users_organizations (user_id, organization_id)
    values (auth.uid(), new.organization_id)
    on conflict (user_id, organization_id) do nothing;
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger on contacts table
drop trigger if exists auto_create_user_organization_trigger on public.contacts;
create trigger auto_create_user_organization_trigger
  after insert on public.contacts
  for each row
  execute function public.auto_create_user_organization();
```

## Como executar

1. Abra o Supabase Dashboard (Cloud tab no Lovable)
2. Vá para SQL Editor
3. Execute cada bloco SQL acima na ordem (1, 2, 3)
4. Verifique se as tabelas foram criadas com sucesso

Após executar estas migrations, os erros "Could not find the table" devem desaparecer e:
- O envio de mensagens funcionará corretamente
- O botão Pausar IA funcionará corretamente
