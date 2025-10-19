import { supabase } from "@/lib/supabase";

const WEBHOOK_SEND_URL = "https://webhook.starmetaia6.com.br/webhook/send";
const WEBHOOK_PAUSE_URL = "https://webhook.starmetaia6.com.br/webhook/pause";
const WEBHOOK_NEW_USER_URL = "https://webhook.starmetaia6.com.br/webhook/new-user";

export const sendMessageWebhook = async (payload: { message_id: string }) => {
  // 1) Try via Edge Function (recommended)
  try {
    const { data, error } = await supabase.functions.invoke("relay-send-message", {
      body: payload,
    });
    if (!error) return data;
    console.warn("[sendMessageWebhook] invoke error:", error);
  } catch (err) {
    console.warn("[sendMessageWebhook] invoke failed:", err);
  }

  // 2) Fallback: call function URL directly (avoids auth header CORS)
  try {
    const resp = await fetch("https://upllwofomoktxnuaffee.functions.supabase.co/relay-send-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      mode: "cors",
    });
    const text = await resp.text();
    const isJson = (resp.headers.get("content-type") || "").includes("application/json");
    return isJson ? JSON.parse(text || "{}") : { ok: resp.ok, raw: text };
  } catch (err) {
    console.error("[sendMessageWebhook] direct function call failed:", err);
    // 3) Last resort: fire-and-forget using sendBeacon (no CORS, opaque)
    try {
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        const blob = new Blob([JSON.stringify(payload)], { type: "text/plain" });
        const sent = navigator.sendBeacon(WEBHOOK_SEND_URL, blob);
        if (sent) {
          console.warn("[sendMessageWebhook] Sent via sendBeacon fallback (opaque)");
          return { ok: true, via: "beacon" } as any;
        }
      }
    } catch (beaconErr) {
      console.error("[sendMessageWebhook] sendBeacon fallback failed:", beaconErr);
    }
    throw new Error("Falha ao chamar webhook (todas as tentativas)");
  }
};

export const pauseAIWebhook = async (conversationId: string, organizationId?: string) => {
  // 1) Try via Edge Function
  try {
    const { data, error } = await supabase.functions.invoke("relay-pause-ai", {
      body: {
        conversation_id: conversationId,
        organization_id: organizationId,
      },
    });
    if (!error) return data;
    console.warn("[pauseAIWebhook] invoke error:", error);
  } catch (err) {
    console.warn("[pauseAIWebhook] invoke failed:", err);
  }

  // 2) Fallback: call function URL directly (no auth header)
  try {
    const resp = await fetch("https://upllwofomoktxnuaffee.functions.supabase.co/relay-pause-ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_id: conversationId, organization_id: organizationId }),
      mode: "cors",
    });
    const text = await resp.text();
    const isJson = (resp.headers.get("content-type") || "").includes("application/json");
    return isJson ? JSON.parse(text || "{}") : { ok: resp.ok, raw: text };
  } catch (err) {
    console.error("[pauseAIWebhook] direct function call failed:", err);
    // 3) Last resort: fire-and-forget using sendBeacon (no CORS, opaque)
    try {
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        const blob = new Blob([JSON.stringify({ conversation_id: conversationId, organization_id: organizationId })], {
          type: "text/plain",
        });
        const sent = navigator.sendBeacon(WEBHOOK_PAUSE_URL, blob);
        if (sent) {
          console.warn("[pauseAIWebhook] Sent via sendBeacon fallback (opaque)");
          return { ok: true, via: "beacon" } as any;
        }
      }
    } catch (beaconErr) {
      console.error("[pauseAIWebhook] sendBeacon fallback failed:", beaconErr);
    }
    throw new Error("Falha ao pausar via webhook (todas as tentativas)");
  }
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
