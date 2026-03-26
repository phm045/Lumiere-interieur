import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@13.3.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2023-10-16",
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Utilisateur non authentifié" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { service, montant, coupon_code, success_url, cancel_url } = await req.json();

    if (!service || !montant || !success_url) {
      return new Response(
        JSON.stringify({ error: "Paramètres manquants" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let finalAmount = Number(montant);
    let couponId: string | null = null;
    let couponDescription = "";

    // Validate and apply coupon if provided
    if (coupon_code) {
      const { data: coupon, error: couponError } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", coupon_code.toUpperCase())
        .eq("actif", true)
        .maybeSingle();

      if (couponError || !coupon) {
        return new Response(
          JSON.stringify({ error: "Code coupon invalide" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check expiry
      if (coupon.valide_jusqu_au && new Date(coupon.valide_jusqu_au) < new Date()) {
        return new Response(
          JSON.stringify({ error: "Ce coupon a expiré" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check usage limit
      if (coupon.usage_max && coupon.usage_actuel >= coupon.usage_max) {
        return new Response(
          JSON.stringify({ error: "Ce coupon a atteint son nombre maximum d'utilisations" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if applicable to services
      if (coupon.applicable_a !== "services" && coupon.applicable_a !== "services_boutique") {
        return new Response(
          JSON.stringify({ error: "Ce coupon n'est pas applicable aux services" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if already used by this user
      const { data: alreadyUsed } = await supabase
        .from("coupons_utilises")
        .select("id")
        .eq("user_id", user.id)
        .eq("coupon_id", coupon.id)
        .maybeSingle();

      if (alreadyUsed) {
        return new Response(
          JSON.stringify({ error: "Vous avez déjà utilisé ce coupon" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Calculate discounted amount
      if (coupon.reduction_pourcent) {
        finalAmount = finalAmount * (1 - coupon.reduction_pourcent / 100);
      } else if (coupon.reduction_montant) {
        finalAmount = finalAmount - Number(coupon.reduction_montant);
      }

      // Ensure minimum 0.50 EUR (Stripe minimum)
      finalAmount = Math.max(finalAmount, 0.5);
      finalAmount = Math.round(finalAmount * 100) / 100;

      couponId = coupon.id;
      couponDescription = coupon.reduction_pourcent
        ? `-${coupon.reduction_pourcent}%`
        : `-${Number(coupon.reduction_montant).toFixed(2)} EUR`;
    }

    // Create Stripe Checkout Session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: service,
              description: couponDescription
                ? `${service} (coupon ${coupon_code}: ${couponDescription})`
                : service,
            },
            unit_amount: Math.round(finalAmount * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      success_url: success_url + (success_url.includes("?") ? "&" : "?") +
        "session_id={CHECKOUT_SESSION_ID}&service=" + encodeURIComponent(service) +
        "&montant=" + finalAmount +
        (couponId ? "&coupon_id=" + couponId : ""),
      cancel_url: cancel_url || success_url,
      metadata: {
        user_id: user.id,
        service,
        original_amount: String(montant),
        final_amount: String(finalAmount),
        coupon_code: coupon_code || "",
        coupon_id: couponId || "",
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(
      JSON.stringify({ url: session.url, final_amount: finalAmount }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Erreur create-checkout:", err);
    return new Response(
      JSON.stringify({ error: "Erreur serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
