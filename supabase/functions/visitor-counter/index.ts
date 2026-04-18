// ================================================================
// Une Voix Intérieure — Edge Function : visitor-counter
// Compteur de visiteurs en temps réel
// ================================================================
// POST → incrémenter (nouvelle visite)
// GET  → lire le compteur courant
// ================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  const supabase = createClient(supabaseUrl, supabaseKey);

  // POST → incrémenter le compteur global + logger la visite
  if (req.method === "POST") {
    // Lire le body pour récupérer les données de géoloc passées par le client
    let body: Record<string, string | null> = {};
    try {
      body = await req.json();
    } catch (_) {
      // Body vide ou invalide — on continue sans données
    }

    // Incrémenter le compteur global
    const { error } = await supabase.rpc("incrementer_visiteurs");
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Logger la visite dans visites_log (service_role — contourne le RLS)
    try {
      await supabase.from("visites_log").insert({
        ip: body.ip ?? null,
        ville: body.ville ?? null,
        pays: body.pays ?? null,
        region: body.region ?? null,
        navigateur: body.navigateur ?? null,
        page: body.page ?? null,
      });
    } catch (_) {
      // Silencieux — le tracking ne doit pas bloquer le compteur
    }

    // Lire le total après incrément
    const { data: row } = await supabase
      .from("visiteurs")
      .select("total")
      .eq("id", 1)
      .maybeSingle();
    return new Response(JSON.stringify({ count: row?.total ?? 0 }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // GET → lire le compteur sans incrémenter
  if (req.method === "GET") {
    const { data: row, error } = await supabase
      .from("visiteurs")
      .select("total")
      .eq("id", 1)
      .maybeSingle();
    if (error) {
      return new Response(JSON.stringify({ count: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ count: row?.total ?? 0 }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

