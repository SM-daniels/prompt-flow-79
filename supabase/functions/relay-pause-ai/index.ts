import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch conversation with related contact data
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select(`
        *,
        contact:contacts(*)
      `)
      .eq("id", conversation_id)
      .single();

    if (convError || !conversation) {
      console.error("[relay-pause-ai] Error fetching conversation:", convError);
      return new Response(
        JSON.stringify({ error: "Conversation not found", details: convError }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare webhook payload with full data
    const webhookPayload = {
      conversation_id: conversation.id,
      organization_id,
      contact_id: conversation.contact_id,
      paused: true,
      duration_minutes,
      reason,
      paused_ai: conversation.paused_ai,
      paused_at: conversation.paused_at,
      paused_until: conversation.paused_until,
      contact: {
        id: conversation.contact.id,
        name: conversation.contact.name,
        phone: conversation.contact.phone,
        email: conversation.contact.email,
        channel: conversation.contact.channel,
      },
    };

    console.log("[relay-pause-ai] Sending payload:", JSON.stringify(webhookPayload, null, 2));

    const externalResp = await fetch("https://webhook.starmetaia6.com.br/webhook/pause", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(webhookPayload),
    });

    const text = await externalResp.text();
    let payload: unknown;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }

    console.log("[relay-pause-ai] External response:", externalResp.status, payload);

    return new Response(
      JSON.stringify({ ok: externalResp.ok, status: externalResp.status, payload }),
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