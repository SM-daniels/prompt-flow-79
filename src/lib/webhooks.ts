const WEBHOOK_SEND_URL = 'https://n8n.starmetaia6.com.br/webhook-test/legacy_send';
const WEBHOOK_PAUSE_URL = 'https://webhook.starmetaia6.com.br/webhook/legacy_pause';

export const sendMessageWebhook = async (payload: {
  organization_id: string;
  contact_id: string;
  conversation_id: string;
  text: string;
  metadata?: any;
}) => {
  const response = await fetch(WEBHOOK_SEND_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Webhook failed: ${response.statusText}`);
  }

  return response.json();
};

export const pauseAIWebhook = async (conversationId: string, organizationId?: string) => {
  const response = await fetch(WEBHOOK_PAUSE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      organization_id: organizationId,
      conversation_id: conversationId,
      paused: true,
      duration_minutes: 30,
      reason: 'manual'
    })
  });

  if (!response.ok) {
    throw new Error(`Webhook failed: ${response.statusText}`);
  }

  return response.json();
};
