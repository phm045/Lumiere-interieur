import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Endpoints Brevo autorisés (toujours des appels POST vers le proxy,
// mais le proxy peut faire GET/POST vers Brevo selon le champ `method`)
const ALLOWED_PREFIXES = [
  "/v3/contacts",
  "/v3/smtp/email",
  "/v3/emailCampaigns",
];

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

  const apiKey = Deno.env.get("BREVO_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "BREVO_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { endpoint?: string; method?: string; body?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { endpoint, method, body: payload } = body;

  if (!endpoint || !ALLOWED_PREFIXES.some((p) => endpoint.startsWith(p))) {
    return new Response(JSON.stringify({ error: "Endpoint not allowed" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const httpMethod = (method || "POST").toUpperCase();

  const fetchHeaders: Record<string, string> = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "api-key": apiKey,
  };

  const fetchOptions: RequestInit = {
    method: httpMethod,
    headers: fetchHeaders,
  };

  if (payload && httpMethod !== "GET" && httpMethod !== "DELETE") {
    fetchOptions.body = JSON.stringify(payload);
  }

  try {
    const response = await fetch(`https://api.brevo.com${endpoint}`, fetchOptions);

    // Brevo retourne 204 sans body pour les mises à jour de contacts (updateEnabled=true).
    // On ne peut pas lire le body d'un 204 — on renvoie un JSON explicite.
    if (response.status === 204) {
      return new Response(JSON.stringify({ updated: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pour toutes les autres réponses, lire le body
    const responseBody = await response.text();

    return new Response(responseBody || '{}', {
      status: response.status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Upstream fetch failed", detail: String(err) }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
