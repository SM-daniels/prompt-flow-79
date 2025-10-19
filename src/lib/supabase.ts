import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://upllwofomoktxnuaffee.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwbGx3b2ZvbW9rdHhudWFmZmVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDUzODIsImV4cCI6MjA3NjIyMTM4Mn0.pOk_nHBYDF8rlv_yoPZ2UHQHyWGklCQeWaxeKAZecVE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export type Contact = {
  id: string;
  owner_id: string;
  name: string;
  phone?: string;
  email?: string;
  channel: 'whatsapp' | 'instagram' | 'site' | 'outro';
  metadata?: any;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  owner_id: string;
  conversation_id: string;
  contact_id: string;
  direction: 'inbound' | 'outbound';
  body?: string;
  attachments?: any;
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  error?: string;
  mig?: string;
  media?: any[];
  interpretations?: any;
  chat?: string;
  sequence_id?: number;
  created_at: string;
  updated_at: string;
};

export type Conversation = {
  id: string;
  organization_id: string;
  contact_id: string;
  paused_ai: boolean;
  paused_at?: string;
  paused_until?: string;
  created_at: string;
  updated_at: string;
};
