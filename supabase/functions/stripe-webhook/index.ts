import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, stripe-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const stripeKey   = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!stripeKey || !supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: "Missing environment variables" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature") || "";

  // ── Vérification de la signature Stripe (si STRIPE_WEBHOOK_SECRET configuré) ──
  if (webhookSecret && signature) {
    try {
      const isValid = await verifyStripeSignature(body, signature, webhookSecret);
      if (!isValid) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch (err) {
      return new Response(JSON.stringify({ error: "Signature verification failed", detail: String(err) }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    event = JSON.parse(body);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // ── Gérer checkout.session.completed ────────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      id: string;
      customer_email?: string;
      amount_total?: number;
      metadata?: Record<string, string>;
      payment_status?: string;
      client_reference_id?: string;
    };

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ received: true, skipped: "not paid" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Vérifier doublon (idempotence)
    const { data: existing } = await supabase
      .from("commandes")
      .select("id")
      .eq("stripe_session_id", session.id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ received: true, skipped: "already_recorded" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Retrouver le user_id via client_reference_id ou l'email
    let userId: string | null = session.client_reference_id || null;

    if (!userId && session.customer_email) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", session.customer_email)
        .maybeSingle();
      if (profile) userId = profile.id;
    }

    const serviceKey   = session.metadata?.service || "";
    const serviceName  = session.metadata?.service_name || serviceKey || "Paiement Stripe";
    const montant      = (session.amount_total || 0) / 100;

    // Enregistrer la commande avec service_role (contourne RLS)
    const { error } = await supabase.from("commandes").insert({
      user_id:          userId,
      service:          serviceName,
      montant:          montant,
      methode_paiement: "stripe",
      statut:           "payé",
      stripe_session_id: session.id,
    });

    if (error) {
      console.error("[stripe-webhook] Erreur insert commande:", error.message);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[stripe-webhook] Commande enregistrée: ${serviceName} ${montant}€ (session: ${session.id})`);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

// ── Vérification signature HMAC-SHA256 Stripe ────────────────────────────────
async function verifyStripeSignature(
  payload: string,
  header: string,
  secret: string
): Promise<boolean> {
  const parts = header.split(",").reduce((acc: Record<string, string>, part) => {
    const [k, v] = part.split("=");
    acc[k] = v;
    return acc;
  }, {});

  const timestamp = parts["t"];
  const sig       = parts["v1"];
  if (!timestamp || !sig) return false;

  const signed = `${timestamp}.${payload}`;
  const key    = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac    = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signed));
  const hex    = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hex === sig;
}
