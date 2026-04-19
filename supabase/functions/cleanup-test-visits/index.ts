import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
serve(async () => {
  const u = Deno.env.get("SUPABASE_URL")!;
  const k = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const h = { "apikey": k, "Authorization": `Bearer ${k}`, "Prefer": "return=representation" };
  // Supprimer la ligne de test iPhone simulée (IP sandbox + UA iPhone, 2026-04-19 après 18:55)
  const r = await fetch(
    `${u}/rest/v1/visites_log?ip=eq.34.105.40.145&ville=eq.The%20Dalles&select=id`,
    { method: "DELETE", headers: h }
  );
  const d = r.ok ? await r.json() : [];
  return new Response(JSON.stringify({ deleted: d.length }), { headers: { "Content-Type": "application/json" } });
});
