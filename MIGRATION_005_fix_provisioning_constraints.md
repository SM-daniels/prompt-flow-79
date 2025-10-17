# MIGRATION 005 - Fix provisioning constraints and defaults

-- 1) Ensure unique constraint for organizations.name (required for ON CONFLICT (name))
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE c.conname = 'organizations_name_key'
      AND n.nspname = 'public'
  ) THEN
    ALTER TABLE public.organizations
      ADD CONSTRAINT organizations_name_key UNIQUE (name);
  END IF;
END
$$;

-- 2) Ensure unique constraint for users_organizations(user_id, organization_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE c.conname = 'users_organizations_user_id_organization_id_key'
      AND n.nspname = 'public'
  ) THEN
    ALTER TABLE public.users_organizations
      ADD CONSTRAINT users_organizations_user_id_organization_id_key UNIQUE (user_id, organization_id);
  END IF;
END
$$;

-- 3) Recreate bootstrap_org_defaults to use channel 'site' (to match app types)
CREATE OR REPLACE FUNCTION public.bootstrap_org_defaults(p_org_id uuid, p_owner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _contact_id uuid;
  _conv_id uuid;
BEGIN
  -- default contact (idempotent)
  INSERT INTO contacts (id, owner_id, organization_id, name, phone, email, channel)
  VALUES (gen_random_uuid(), p_owner_id, p_org_id, 'Minha Empresa', NULL, NULL, 'site')
  ON CONFLICT DO NOTHING
  RETURNING id INTO _contact_id;

  IF _contact_id IS NULL THEN
    SELECT id INTO _contact_id
    FROM contacts
    WHERE organization_id = p_org_id AND name = 'Minha Empresa'
    LIMIT 1;
  END IF;

  -- welcome conversation (idempotent)
  INSERT INTO conversations (id, organization_id, contact_id, paused_ai)
  VALUES (gen_random_uuid(), p_org_id, _contact_id, FALSE)
  ON CONFLICT DO NOTHING
  RETURNING id INTO _conv_id;

  IF _conv_id IS NULL THEN
    SELECT id INTO _conv_id
    FROM conversations
    WHERE organization_id = p_org_id AND contact_id = _contact_id
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  -- welcome message (idempotent)
  INSERT INTO messages (
    id, organization_id, conversation_id, contact_id,
    direction, body, status, mig, media, interpretations, chat
  )
  VALUES (
    gen_random_uuid(), p_org_id, _conv_id, _contact_id,
    'outbound',
    'Bem-vinda(o)! Sua conta foi configurada.',
    'sent',
    'system_welcome',
    '[]'::jsonb, NULL,
    '{"actor":"system","reason":"org_bootstrap"}'::jsonb
  )
  ON CONFLICT DO NOTHING;
END;
$$;

-- Notes:
-- - Run this migration in your SQL editor. After this, the provision_user RPC with ON CONFLICT (name)
--   will work correctly, and defaults will match the app's channel enum.
-- - If you still get RLS errors, ensure the SECURITY DEFINER functions are owned by a role with proper privileges.
