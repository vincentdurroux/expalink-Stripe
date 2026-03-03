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
      const session = event.data.object as any
      const userId = session.client_reference_id

      if (!userId) {
        console.error("❌ Erreur: Aucun client_reference_id trouvé dans la session Stripe")
        return new Response("No user ID", { status: 400 })
      }

      // --- CAS 1 : ABONNEMENT (Founding Member / Monthly) ---
      // On détecte soit le mode 'subscription', soit un montant à 0€ (essai gratuit)
      if (session.mode === 'subscription' || session.amount_total === 0) {
        console.log(`🔔 Activation de l'abonnement pour l'utilisateur: ${userId}`)
        
        const { error } = await supabase
          .from('profiles')
          .update({ 
            is_pro: true,
            role_selected: true,
            pro_plan: 'early', 
            plan_status: 'active', // On force 'active' pour débloquer l'interface
            subscription_id: session.subscription || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (error) throw error
        console.log("✅ Profil Pro activé avec succès")
      } 

      // --- CAS 2 : PAIEMENT UNIQUE (Crédits) ---
      else if (session.mode === 'payment' && session.amount_total > 0) {
        console.log(`💰 Traitement du paiement de crédits pour l'utilisateur: ${userId}`)
        
        const amountTotal = session.amount_total || 0
        // Calcul : 200 (2€) = 1 crédit, 700 (7€) = 5 crédits
        const creditsToAdd = amountTotal > 500 ? 5 : 1

        // 1. Récupérer le solde actuel
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', userId)
          .single()

        if (fetchError) throw fetchError
        const currentCredits = profile?.credits || 0

        // 2. Mise à jour du solde
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            credits: currentCredits + creditsToAdd,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (updateError) throw updateError
        console.log(`✅ Ajout de ${creditsToAdd} crédits terminé. Nouveau solde: ${currentCredits + creditsToAdd}`)
      }
    }

    // Gestion de la résiliation (Optionnel mais recommandé)
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as any
      console.log(`📡 Désactivation de l'abonnement: ${subscription.id}`)
      
      await supabase
        .from('profiles')
        .update({ 
          plan_status: 'expired',
          is_pro: false // Optionnel : selon si tu veux couper l'accès immédiatement
        })
        .eq('subscription_id', subscription.id)
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200,
      headers: { "Content-Type": "application/json" } 
    })

  } catch (err) {
    console.error(`❌ Erreur Webhook Stripe: ${err.message}`)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
})