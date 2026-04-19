// ================================================================
// Une Voix Intérieure — Edge Function : visitor-counter
// Compteur de visiteurs en temps réel
// ================================================================
// POST → incrémenter (atomique via RPC) + logger la visite
// GET  → lire le compteur courant
// ================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const restHeaders = {
    "apikey": supabaseKey,
    "Authorization": `Bearer ${supabaseKey}`,
    "Content-Type": "application/json",
  };

  // ── Lire le compteur actuel ──
  async function lireTotal(): Promise<number> {
    const resp = await fetch(`${supabaseUrl}/rest/v1/visiteurs?id=eq.1&select=total`, {
      headers: restHeaders,
    });
    if (!resp.ok) return 0;
    const rows = await resp.json();
    return rows?.[0]?.total ?? 0;
  }

  // ── GET → retourner le compteur sans incrémenter ──
  if (req.method === "GET") {
    const count = await lireTotal();
    return new Response(JSON.stringify({ count }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── POST → incrémenter (atomique) + logger la visite ──
  if (req.method === "POST") {
    // Lire le body géoloc envoyé par le client
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch (_) {
      // Body vide ou invalide — on continue sans géoloc
    }

    // Incrément atomique via RPC (UPDATE total = total + 1 côté Postgres)
    const rpcResp = await fetch(`${supabaseUrl}/rest/v1/rpc/incrementer_visiteurs`, {
      method: "POST",
      headers: { ...restHeaders, "Prefer": "return=minimal" },
      body: "{}",
    });

    if (!rpcResp.ok) {
      const err = await rpcResp.text();
      return new Response(JSON.stringify({ error: "rpc_failed", detail: err }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Lire le nouveau total après incrément
    const newCount = await lireTotal();

    // Logger la visite dans visites_log (non-bloquant)
    fetch(`${supabaseUrl}/rest/v1/visites_log`, {
      method: "POST",
      headers: { ...restHeaders, "Prefer": "return=minimal" },
      body: JSON.stringify({
        ip:          body.ip          ? String(body.ip).substring(0, 45)  : null,
        ville:       body.ville       ? String(body.ville).substring(0, 100) : null,
        pays:        body.pays        ? String(body.pays).substring(0, 100) : null,
        region:      body.region      ? String(body.region).substring(0, 100) : null,
        latitude:    body.latitude  != null ? Number(body.latitude)  : null,
        longitude:   body.longitude != null ? Number(body.longitude) : null,
        code_postal: body.code_postal ? String(body.code_postal).substring(0, 20) : null,
        isp:         body.isp         ? String(body.isp).substring(0, 150) : null,
        navigateur:  body.navigateur  ? String(body.navigateur).substring(0, 250) : null,
        page:        body.page        ? String(body.page).substring(0, 100) : null,
      }),
    }).catch(() => {/* silencieux */});

    return new Response(JSON.stringify({ count: newCount }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
