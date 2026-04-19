// ================================================================
// Une Voix Intérieure — Edge Function : visitor-counter
// Compteur de visiteurs en temps réel + géolocalisation côté serveur
// ================================================================
// POST → incrémenter (atomique via RPC) + géocoder l'IP + logger la visite
// GET  → lire le compteur courant
// ================================================================
// NOTE : la géolocalisation se fait ici (côté serveur) pour contourner
// les blocages CORS/Cloudflare qui empêchent les clients mobiles (iOS
// notamment) d'appeler ipapi.co ou ipwho.is depuis le navigateur.
// Le client peut toujours envoyer des données pré-géocodées ; si elles
// manquent, on géocode à partir de l'IP réelle du visiteur.
// ================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// ── Validation robuste d'une coordonnée ──
function safeCoord(v: unknown, min: number, max: number): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  if (!isFinite(n)) return null;
  if (n < min || n > max) return null;
  return n;
}

// ── Extraction de l'IP du visiteur depuis les headers Supabase/Cloudflare ──
function extractClientIp(req: Request): string | null {
  // Supabase/Edge pose x-forwarded-for = "client, proxy1, proxy2..."
  // On prend le premier qui est l'IP du client.
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0].trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return null;
}

// ── Géolocalisation serveur ──
// Stratégie multi-providers : ipwho.is → ip-api.com (fallback) → null
// Les deux sont gratuits, sans Cloudflare, appelés depuis Deno donc pas de CORS
async function geocodeIp(ip: string): Promise<Record<string, unknown> | null> {
  // Ignorer les IP privées, locales, et IPv6 link-local
  if (
    ip.startsWith("10.") || ip.startsWith("192.168.") ||
    ip.startsWith("127.") || ip.startsWith("172.") ||
    ip.startsWith("::1") || ip.startsWith("fe80:") ||
    ip === "unknown" || ip === ""
  ) {
    return null;
  }

  // Provider 1 : ipwho.is (format identique au client, préférentiel)
  try {
    const resp = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      headers: { "User-Agent": "une-voix-interieure-edge/1.0" },
      signal: AbortSignal.timeout(4000),
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data && data.success) return data;
    }
  } catch (_) {
    // timeout ou réseau — passer au provider suivant
  }

  // Provider 2 : ip-api.com (fallback, champs différents — on normalise)
  try {
    const resp = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,regionName,city,zip,lat,lon,isp,query`,
      {
        headers: { "User-Agent": "une-voix-interieure-edge/1.0" },
        signal: AbortSignal.timeout(4000),
      }
    );
    if (resp.ok) {
      const d = await resp.json();
      if (d && d.status === "success") {
        return {
          success:    true,
          ip:         d.query,
          city:       d.city,
          country:    d.country,
          region:     d.regionName,
          latitude:   d.lat,
          longitude:  d.lon,
          postal:     d.zip,
          connection: { isp: d.isp },
        };
      }
    }
  } catch (_) {
    // échec des deux providers
  }

  return null;
}

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

  // ── POST → incrémenter (atomique) + géocoder + logger la visite ──
  if (req.method === "POST") {
    // Lire le body géoloc envoyé par le client (peut être vide/partiel)
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch (_) {
      // Body vide ou invalide — on continue, on géocodera côté serveur
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

    // ─── Détermination de la source de géoloc ───
    // 1. On prend ce que le client nous envoie (si non vide)
    // 2. Sinon, on géocode serveur à partir de l'IP détectée
    let geo: Record<string, unknown> = {};

    const clientLat = safeCoord(body.latitude,  -90,  90);
    const clientLon = safeCoord(body.longitude, -180, 180);
    const clientOk = clientLat !== null && clientLon !== null &&
                     !(clientLat === 0 && clientLon === 0) &&
                     body.ville && body.pays;

    if (clientOk) {
      // Client a fourni des données valides : on les utilise
      geo = {
        ip:          body.ip,
        ville:       body.ville,
        pays:        body.pays,
        region:      body.region,
        latitude:    clientLat,
        longitude:   clientLon,
        code_postal: body.code_postal,
        isp:         body.isp,
      };
    } else {
      // Données client incomplètes → géocoder serveur à partir de l'IP
      const clientIp = extractClientIp(req);
      if (clientIp) {
        const ipGeo = await geocodeIp(clientIp);
        if (ipGeo) {
          const gLat = safeCoord(ipGeo.latitude,  -90,  90);
          const gLon = safeCoord(ipGeo.longitude, -180, 180);
          const gOk  = gLat !== null && gLon !== null && !(gLat === 0 && gLon === 0);
          geo = {
            ip:          clientIp,
            ville:       ipGeo.city          ?? null,
            pays:        ipGeo.country       ?? null,
            region:      ipGeo.region        ?? null,
            latitude:    gOk ? gLat : null,
            longitude:   gOk ? gLon : null,
            code_postal: ipGeo.postal        ?? null,
            isp:         (ipGeo.connection as { isp?: string } | undefined)?.isp ?? null,
          };
        } else {
          // Géocodage échoué : au moins on garde l'IP pour rétro-correction ultérieure
          geo = { ip: clientIp };
        }
      }
    }

    // Validation finale des coordonnées (défense en profondeur)
    const finalLat = safeCoord(geo.latitude,  -90,  90);
    const finalLon = safeCoord(geo.longitude, -180, 180);
    const coordsOk = finalLat !== null && finalLon !== null &&
                     !(finalLat === 0 && finalLon === 0);

    // Logger la visite dans visites_log (non-bloquant)
    fetch(`${supabaseUrl}/rest/v1/visites_log`, {
      method: "POST",
      headers: { ...restHeaders, "Prefer": "return=minimal" },
      body: JSON.stringify({
        ip:          geo.ip          ? String(geo.ip).substring(0, 45)  : null,
        ville:       geo.ville       ? String(geo.ville).substring(0, 100) : null,
        pays:        geo.pays        ? String(geo.pays).substring(0, 100) : null,
        region:      geo.region      ? String(geo.region).substring(0, 100) : null,
        latitude:    coordsOk ? finalLat : null,
        longitude:   coordsOk ? finalLon : null,
        code_postal: geo.code_postal ? String(geo.code_postal).substring(0, 20) : null,
        isp:         geo.isp         ? String(geo.isp).substring(0, 150) : null,
        navigateur:  body.navigateur ? String(body.navigateur).substring(0, 250) : null,
        page:        body.page       ? String(body.page).substring(0, 100) : null,
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
