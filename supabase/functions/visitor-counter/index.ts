// ================================================================
// Une Voix Intérieure — Edge Function : visitor-counter
// Compteur de visiteurs en temps réel
// ================================================================
// POST → incrémenter + logger la visite
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

  const headers = {
    "apikey": supabaseKey,
    "Authorization": `Bearer ${supabaseKey}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation",
  };

  // ── Fonction utilitaire : lire le compteur actuel ──
  async function lireCompteur(): Promise<number> {
    const resp = await fetch(`${supabaseUrl}/rest/v1/visiteurs?id=eq.1&select=total`, {
      headers,
    });
    if (!resp.ok) return 0;
    const rows = await resp.json();
    return rows?.[0]?.total ?? 0;
  }

  // POST → incrémenter le compteur + logger la visite
  if (req.method === "POST") {
    // Lire le body (données géoloc passées par le client)
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch (_) {
      // Body vide — on continue
    }

    // Lire le compteur actuel puis incrémenter atomiquement
    const current = await lireCompteur();
    const newCount = current + 1;

    const updateResp = await fetch(`${supabaseUrl}/rest/v1/visiteurs?id=eq.1`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ total: newCount, updated_at: new Date().toISOString() }),
    });

    if (!updateResp.ok) {
      const err = await updateResp.text();
      return new Response(JSON.stringify({ error: err }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Logger la visite dans visites_log
    try {
      await fetch(`${supabaseUrl}/rest/v1/visites_log`, {
        method: "POST",
        headers: { ...headers, "Prefer": "return=minimal" },
        body: JSON.stringify({
          ip: body.ip ?? null,
          ville: body.ville ?? null,
          pays: body.pays ?? null,
          region: body.region ?? null,
          latitude: body.latitude ? Number(body.latitude) : null,
          longitude: body.longitude ? Number(body.longitude) : null,
          code_postal: body.code_postal ?? null,
          isp: body.isp ?? null,
          navigateur: body.navigateur ?? null,
          page: body.page ?? null,
        }),
      });
    } catch (_) {
      // Silencieux — le tracking ne bloque pas le compteur
    }

    return new Response(JSON.stringify({ count: newCount }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // GET → lire le compteur sans incrémenter
  if (req.method === "GET") {
    const count = await lireCompteur();
    return new Response(JSON.stringify({ count }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
