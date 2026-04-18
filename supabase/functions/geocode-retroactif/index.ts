// Edge Function temporaire — géocodage rétroactif des visites sans coordonnées
// Appelée une seule fois manuellement, puis supprimée

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const headers = {
    "apikey": supabaseKey,
    "Authorization": `Bearer ${supabaseKey}`,
    "Content-Type": "application/json",
  };

  // Récupérer toutes les visites avec IP et ville mais sans coordonnées
  const getResp = await fetch(
    `${supabaseUrl}/rest/v1/visites_log?latitude=is.null&ville=not.is.null&select=id,ip,ville`,
    { headers }
  );
  const rows = await getResp.json();

  // Dédupliquer par IP
  const ipToIds: Record<string, string[]> = {};
  for (const row of rows) {
    if (!row.ip) continue;
    if (!ipToIds[row.ip]) ipToIds[row.ip] = [];
    ipToIds[row.ip].push(row.id);
  }

  const skipPrefixes = ["10.", "192.168.", "127.", "172.", "1.2.3.", "5.6.7.", "9.10.", "2a03:2880", "2600:3c"];
  let ok = 0, skip = 0, fail = 0;
  const results: string[] = [];

  for (const [ip, ids] of Object.entries(ipToIds)) {
    if (skipPrefixes.some(p => ip.startsWith(p))) { skip++; continue; }

    try {
      const geoResp = await fetch(`https://ipwho.is/${ip}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(6000),
      });
      const geo = await geoResp.json();

      if (!geo.success || !geo.latitude) { skip++; continue; }

      const patch: Record<string, unknown> = {
        latitude: geo.latitude,
        longitude: geo.longitude,
      };
      if (geo.postal) patch.code_postal = geo.postal;
      if (geo.connection?.isp) patch.isp = geo.connection.isp;

      // PATCH toutes les lignes avec cette IP et sans coordonnées
      const patchResp = await fetch(
        `${supabaseUrl}/rest/v1/visites_log?ip=eq.${encodeURIComponent(ip)}&latitude=is.null`,
        { method: "PATCH", headers: { ...headers, "Prefer": "return=minimal" }, body: JSON.stringify(patch) }
      );

      if (patchResp.ok) {
        ok++;
        results.push(`✅ ${ip} → ${geo.latitude},${geo.longitude} (${ids.length} lignes)`);
      } else {
        fail++;
        results.push(`❌ ${ip} → PATCH failed: ${await patchResp.text()}`);
      }

      // Petit délai pour respecter les limites de ipwho.is
      await new Promise(r => setTimeout(r, 120));
    } catch (e) {
      fail++;
      results.push(`❌ ${ip} → ${e}`);
    }
  }

  return new Response(
    JSON.stringify({ ok, skip, fail, total_ips: Object.keys(ipToIds).length, results }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});

