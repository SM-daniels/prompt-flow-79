// new-user-webhook Edge Function
// Proxies the public signup webhook to avoid browser CORS issues

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const WEBHOOK_NEW_USER_URL = "https://webhook.starmetaia6.com.br/webhook/new-user";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return new Response(
        JSON.stringify({ error: "Invalid content-type. Use application/json" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const body = await req.json();
    const user_id = body?.user_id as string | undefined;
    const org_name = body?.org_name as string | undefined;

    if (!user_id || !org_name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: user_id, org_name" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Forward to external webhook
    const forwardResp = await fetch(WEBHOOK_NEW_USER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, org_name }),
    });

    const text = await forwardResp.text();
    const isJson = (forwardResp.headers.get("content-type") || "").includes("application/json");
    const payload = isJson ? JSON.parse(text || "{}") : { raw: text };

    const response = new Response(
      JSON.stringify({ ok: forwardResp.ok, status: forwardResp.status, data: payload }),
      { status: forwardResp.ok ? 200 : 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

    return response;
  } catch (err) {
    console.error("[new-user-webhook] Error:", err);
    return new Response(
      JSON.stringify({ error: "Webhook proxy failed", details: `${err}` }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});