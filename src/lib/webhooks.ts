import { supabase } from "@/lib/supabase";

const WEBHOOK_SEND_URL = "https://webhook.starmetaia6.com.br/webhook/send";
const WEBHOOK_PAUSE_URL = "https://webhook.starmetaia6.com.br/webhook/pause";
const WEBHOOK_NEW_USER_URL = "https://webhook.starmetaia6.com.br/webhook/new-user";

export const sendMessageWebhook = async (payload: {
  organization_id: string;
  contact_id: string;
  conversation_id: string;
  text: string;
  metadata?: any;
}) => {
  const response = await fetch(WEBHOOK_SEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Webhook failed: ${response.statusText}`);
  }

  return response.json();
};

export const pauseAIWebhook = async (conversationId: string, organizationId?: string) => {
  const response = await fetch(WEBHOOK_PAUSE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      organization_id: organizationId,
      conversation_id: conversationId,
      paused: true,
      duration_minutes: 30,
      reason: "manual",
    }),
  });

  if (!response.ok) {
    throw new Error(`Webhook failed: ${response.statusText}`);
  }

  return response.json();
};

// Send via Edge Function to avoid browser CORS/network issues
export const newUserWebhook = async (userId: string, orgName: string) => {
  const { data, error } = await supabase.functions.invoke("new-user-webhook", {
    body: { user_id: userId, org_name: orgName },
  });

  if (error) {
    throw new Error(`Webhook failed: ${error.message}`);
  }

  return data;
};
