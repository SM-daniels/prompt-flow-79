import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { conversation_id, organization_id, duration_minutes = 30, reason = "manual" } = await req.json();

    if (!conversation_id || !organization_id) {
      return new Response(
        JSON.stringify({ error: "conversation_id and organization_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = {
      conversation_id,
      organization_id,
      paused: true,
      duration_minutes,
      reason,
    };

    console.log("[relay-pause-ai] Sending payload:", JSON.stringify(payload));

    const externalResp = await fetch("https://webhook.starmetaia6.com.br/webhook/pause", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await externalResp.text();
    let responsePayload: unknown;
    try {
      responsePayload = JSON.parse(text);
    } catch {
      responsePayload = { raw: text };
    }

    console.log("[relay-pause-ai] External response:", externalResp.status, responsePayload);

    return new Response(
      JSON.stringify({ ok: externalResp.ok, status: externalResp.status, payload: responsePayload }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[relay-pause-ai] Error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});