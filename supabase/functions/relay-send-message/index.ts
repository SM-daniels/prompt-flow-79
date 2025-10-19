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

    const { message_id } = await req.json();

    if (!message_id) {
      return new Response(
        JSON.stringify({ error: "message_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch message with related data
    const { data: message, error: msgError } = await supabase
      .from("messages")
      .select(`
        *,
        contact:contacts(*),
        conversation:conversations(*)
      `)
      .eq("id", message_id)
      .single();

    if (msgError || !message) {
      console.error("[relay-send-message] Error fetching message:", msgError);
      return new Response(
        JSON.stringify({ error: "Message not found", details: msgError }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare webhook payload with full data
    const webhookPayload = {
      message_id: message.id,
      conversation_id: message.conversation_id,
      contact_id: message.contact_id,
      organization_id: message.organization_id,
      direction: message.direction,
      body: message.body,
      status: message.status,
      sequence_id: message.sequence_id,
      created_at: message.created_at,
      contact: {
        id: message.contact.id,
        name: message.contact.name,
        phone: message.contact.phone,
        email: message.contact.email,
        channel: message.contact.channel,
      },
      conversation: {
        id: message.conversation.id,
        paused_ai: message.conversation.paused_ai,
        paused_at: message.conversation.paused_at,
        paused_until: message.conversation.paused_until,
      },
    };

    console.log("[relay-send-message] Sending payload:", JSON.stringify(webhookPayload, null, 2));

    const externalResp = await fetch("https://webhook.starmetaia6.com.br/webhook/send", {
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

    console.log("[relay-send-message] External response:", externalResp.status, payload);

    return new Response(
      JSON.stringify({ ok: externalResp.ok, status: externalResp.status, payload }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[relay-send-message] Error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});