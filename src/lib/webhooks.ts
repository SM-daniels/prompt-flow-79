import { supabase } from "@/lib/supabase";

const WEBHOOK_SEND_URL = "https://webhook.starmetaia6.com.br/webhook/send";
const WEBHOOK_PAUSE_URL = "https://webhook.starmetaia6.com.br/webhook/pause";
const WEBHOOK_NEW_USER_URL = "https://webhook.starmetaia6.com.br/webhook/new-user";

export const sendMessageWebhook = async (payload: { message_id: string }) => {
  const { data, error } = await supabase.functions.invoke("relay-send-message", {
    body: payload,
  });
  if (error) throw new Error(error.message || "Falha ao chamar webhook");
  return data;
};

export const pauseAIWebhook = async (conversationId: string, organizationId?: string) => {
  const { data, error } = await supabase.functions.invoke("relay-pause-ai", {
    body: {
      conversation_id: conversationId,
      organization_id: organizationId,
    },
  });
  if (error) throw new Error(error.message || "Falha ao pausar via webhook");
  return data;
};

// Send via Edge Function with robust fallbacks to guarantee delivery
export const newUserWebhook = async (userId: string, orgName: string) => {
  // 1) Try via Edge Function (preferred)
  try {
    const { data, error } = await supabase.functions.invoke("new-user-webhook", {
      body: { user_id: userId, org_name: orgName },
    });

    if (!error) {
      return data;
    }

    console.error("[newUserWebhook] Edge Function error:", error);
  } catch (err) {
    console.error("[newUserWebhook] Edge Function invocation failed:", err);
  }

  // 2) Fallback: call external webhook directly (CORS must be enabled server-side)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const directResp = await fetch(WEBHOOK_NEW_USER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, org_name: orgName }),
      keepalive: true,
      signal: controller.signal,
      mode: "cors",
    });

    clearTimeout(timeout);

    if (directResp.ok) {
      const isJson = (directResp.headers.get("content-type") || "").includes("application/json");
      return isJson ? await directResp.json() : { ok: true };
    } else {
      console.error("[newUserWebhook] Direct webhook call failed", directResp.status, await directResp.text());
    }
  } catch (err) {
    console.error("[newUserWebhook] Direct webhook call threw:", err);
  }

  // 3) Last resort: try to fire-and-forget using sendBeacon (no CORS, opaque)
  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([JSON.stringify({ user_id: userId, org_name: orgName })], {
        type: "text/plain",
      });
      const sent = navigator.sendBeacon(WEBHOOK_NEW_USER_URL, blob);
      if (sent) {
        console.warn("[newUserWebhook] Sent via sendBeacon fallback (opaque).");
        return { ok: true, via: "beacon" };
      }
    }
  } catch (err) {
    console.error("[newUserWebhook] sendBeacon fallback failed:", err);
  }

  throw new Error("Webhook delivery failed after all attempts");
};
