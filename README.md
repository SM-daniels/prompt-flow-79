# Inbox Chatwoot-Style (Supabase + Realtime)

Sistema de inbox multi-tenant estilo Chatwoot com:
- ✅ Autenticação Supabase
- ✅ Multi-tenant com organizações
- ✅ Pausa de IA temporária (30 min) com auto-despausa
- ✅ Suporte a MIG, mídias e interpretações
- ✅ Realtime para mensagens e conversas
- ✅ Design cinza + roxo glow + fonte Cairo

---

## 🚀 Setup Rápido

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar Supabase

#### a) Executar Migrations
Execute os SQL scripts no **Supabase SQL Editor** na ordem:

1. **Migration 002** (multi-tenant) - veja `MIGRATION_002.md` **← IMPORTANTE!**

#### b) Configurar Auto-Unpause
Execute no SQL Editor:
```sql
select cron.schedule(
  'auto-unpause-conversations',
  '* * * * *',
  $$select public.auto_unpause_conversations();$$
);
```

### 3. Criar Organização e Usuário

Após fazer login, execute no SQL Editor (substitua `SEU-USER-ID` pelo seu ID):

```sql
-- 1. Criar organização
insert into public.organizations (name) 
values ('Minha Empresa') 
returning *;

-- 2. Associar usuário (copie o org ID da query acima)
insert into public.users_organizations (user_id, organization_id, role)
values ('SEU-USER-ID', 'ORG-ID-AQUI', 'org_admin');
```

### 4. Rodar aplicação
```bash
npm run dev
```

---

## 📋 Funcionalidades

### ✅ Implementado

- **Multi-tenant**: organizações isoladas com RLS
- **Roles**: super_admin, org_admin, agent
- **Pausa de IA (30 min)**: auto-despausa via pg_cron
- **Webhook atualizado**: `https://n8n.starmetaia6.com.br/webhook-test/legacy_send`
- **Toast otimizado**: removido sucesso de envio, mantido IA pausada com timer
- **Estrutura de dados**: MIG, mídias, interpretações preparadas

### 🚧 Próximos Passos (Opcional)

- Interface de admin para gerenciar organizações
- Upload de mídias (Supabase Storage)
- Processamento de interpretações (ASR/OCR/Vision via edge functions)
- Filtros por organização no frontend

---

## 🎨 Design System

- **Paleta**: Cinza (#0F1115 → #222938) + Roxo (#6D5EF0) com glow
- **Fonte**: Cairo (400-700)
- **Ícones**: Lucide React com hover glow

---

## 📦 Estrutura

```
src/
├── lib/
│   ├── supabase.ts       # Cliente + tipos
│   ├── webhooks.ts       # Webhooks atualizados
│   ├── dateUtils.ts      # Formatação PT-BR
│   └── chatParser.ts     # Parser do campo chat
├── contexts/
│   └── AuthContext.tsx   # Auth Supabase
├── components/inbox/
│   ├── ContactsSidebar.tsx
│   ├── ConversationsList.tsx
│   ├── MessagesThread.tsx
│   └── MessageComposer.tsx  # Pausa 30 min + envio
└── pages/
    ├── Auth.tsx
    └── InboxLayout.tsx
```

---

## 🔐 Segurança

- RLS por organização via `public.user_in_org()`
- Policies separadas para contacts, conversations, messages
- Security definer functions para evitar recursão RLS

---

## 🐛 Troubleshooting

### "User not in organization"
Execute o SQL de associação (passo 3 do setup)

### Auto-unpause não funciona
Verifique se o cron job foi criado:
```sql
select * from cron.job where jobname = 'auto-unpause-conversations';
```

### Mensagens não aparecem
Verifique RLS: usuário deve estar associado à organização

---

## 📞 Suporte

Consulte `MIGRATION_002.md` para detalhes completos da estrutura multi-tenant.

---

# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/7f6a886f-e17c-4957-affe-c5216c64c45d

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/7f6a886f-e17c-4957-affe-c5216c64c45d) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/7f6a886f-e17c-4957-affe-c5216c64c45d) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
