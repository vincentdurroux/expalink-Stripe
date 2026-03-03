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
  if (!signature) return new Response("No signature", { status: 400 })

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
        return new Response("No user ID", { status: 400 })
      }

      // 1. On vérifie si c'est un abonnement (Founding Member) ou un paiement unique (Crédits)
      const isSubscription = session.mode === 'subscription';

      if (isSubscription) {
        console.log(`🚀 Activation PRO (Founding Member) pour: ${userId}`)
        
        const { error } = await supabase
          .from('profiles')
          .update({ 
            is_pro: true,
            is_expat: false,       // 👈 CRUCIAL: Désactive Expat pour respecter la contrainte SQL
            role_selected: true,
            pro_plan: 'Founding Member',
            plan_status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (error) throw error
      } 
      else {
        console.log(`💰 Ajout de crédits pour: ${userId}`)
        
        // 2. Pour les crédits, on récupère d'abord le solde actuel
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', userId)
          .single()

        // Calcul du nombre de crédits à ajouter (basé sur le montant en centimes)
        // Ajuste ces chiffres selon tes prix Stripe (ex: 500 = 5€)
        const amount = session.amount_total;
        let creditsToAdd = 1;
        if (amount >= 1000) creditsToAdd = 5; // Exemple: si > 10€, on donne 5 crédits

        const { error } = await supabase
          .from('profiles')
          .update({ 
            credits: (profile?.credits || 0) + creditsToAdd,
            updated_at: new Date().toISOString()
            // 👈 Note: Ici on ne touche ni à is_pro ni à is_expat, donc pas d'erreur SQL !
          })
          .eq('id', userId)

        if (error) throw error
      }
      
      console.log(`✅ Opération Stripe traitée avec succès pour ${userId}`)
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })

  } catch (err) {
    console.error(`❌ Erreur Webhook: ${err.message}`)
    return new Response(`Error: ${err.message}`, { status: 400 })
  }
})