// Edge Function temporaire — nettoyage des lignes de test dans visites_log
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const headers = {
    "apikey": supabaseKey,
    "Authorization": `Bearer ${supabaseKey}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation",
  };
  const delResp = await fetch(
    `${supabaseUrl}/rest/v1/visites_log?or=(navigateur.like.*DIAGNOSTIC*,navigateur.like.*TEST-SERVER-GEOCODE*,navigateur.like.*test-validation*)&select=id`,
    { method: "DELETE", headers }
  );
  const deleted = delResp.ok ? await delResp.json() : [];
  return new Response(
    JSON.stringify({ deleted_count: deleted.length }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
