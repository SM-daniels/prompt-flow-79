const WEBHOOK_SEND_URL = 'https://webhook.starmetaia17.com.br/webhook/legacy_send';
const WEBHOOK_PAUSE_URL = 'https://webhook.starmetaia6.com.br/webhook/legacy_pause';

export const sendMessageWebhook = async (payload: {
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

export const pauseAIWebhook = async (conversationId: string) => {
  const response = await fetch(WEBHOOK_PAUSE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      conversation_id: conversationId,
      paused: true,
      reason: 'manual'
    })
  });

  if (!response.ok) {
    throw new Error(`Webhook failed: ${response.statusText}`);
  }

  return response.json();
};
