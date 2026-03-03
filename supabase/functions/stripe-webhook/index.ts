import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@11.1.0?target=deno"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (req) => {
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    return new Response("Missing signature", { status: 400 })
  }

  try {
    const body = await req.text()
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET") as string,
      undefined,
      cryptoProvider
    )

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") as string,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string
    )

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const userId = session.client_reference_id

      if (!userId) {
        console.error("No user ID found in client_reference_id")
        return new Response("No user ID", { status: 400 })
      }

      // --- CAS 1 : ABONNEMENT (Founding Member / Monthly) ---
      if (session.mode === 'subscription') {
        console.log(`🔔 Processing subscription for user: ${userId}`)
        
        const { error } = await supabase
          .from('profiles')
          .update({ 
            is_pro: true,
            role_selected: true,
            pro_plan: 'early', // ou récupérer dynamiquement via metadata si besoin
            plan_status: 'trialing', 
            subscription_id: session.subscription,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (error) throw error
        console.log("✅ Pro profile activated via subscription")
      } 

      // --- CAS 2 : PAIEMENT UNIQUE (Crédits) ---
      else if (session.mode === 'payment') {
        console.log(`💰 Processing credit payment for user: ${userId}`)
        
        const amountTotal = session.amount_total || 0
        // Logique de calcul des crédits selon le montant (en centimes)
        // 200 = 2€ (1 crédit), 700 = 7€ (5 crédits) - À ajuster selon tes prix Stripe
        const creditsToAdd = amountTotal > 500 ? 5 : 1

        // 1. Récupérer les crédits actuels
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', userId)
          .single()

        const currentCredits = profile?.credits || 0

        // 2. Mettre à jour avec le nouveau solde
        const { error } = await supabase
          .from('profiles')
          .update({ 
            credits: currentCredits + creditsToAdd,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (error) throw error
        console.log(`✅ Added ${creditsToAdd} credits to user ${userId}`)
      }
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200,
      headers: { "Content-Type": "application/json" } 
    })

  } catch (err) {
    console.error(`❌ Webhook Error: ${err.message}`)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
})