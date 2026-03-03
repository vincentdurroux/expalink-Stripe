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
        console.error("❌ Erreur: client_reference_id manquant")
        return new Response("No user ID", { status: 400 })
      }

      const isSubscription = session.mode === 'subscription';

      if (isSubscription) {
        // --- LOGIQUE ABONNEMENT (FOUNDING MEMBER) ---
        console.log(`🚀 Activation PRO (Founding Member) pour: ${userId}`)
        
        const { error } = await supabase
          .from('profiles')
          .update({ 
            is_pro: true,
            is_expat: false,       // Respect de la contrainte check_exclusive_role
            role_selected: true,
            pro_plan: 'Founding Member',
            plan_status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (error) throw error
      } 
      else {
        // --- LOGIQUE ACHAT DE CRÉDITS ---
        const amount = session.amount_total; // Montant reçu en centimes
        
        // Calcul : 1€ (100cts) -> 1 crédit | 3€ (300cts) -> 5 crédits
        // On fixe le seuil à 200cts (2€)
        const creditsToAdd = amount >= 200 ? 5 : 1;
        
        console.log(`💰 Paiement unique reçu: ${amount} cts. Ajout de ${creditsToAdd} crédits pour: ${userId}`)
        
        // Récupération du solde actuel
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', userId)
          .single()
        
        if (fetchError) throw fetchError;

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            credits: (profile?.credits || 0) + creditsToAdd,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (updateError) throw updateError
      }
      
      console.log(`✅ Opération Stripe traitée avec succès pour ${userId}`)
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })

  } catch (err) {
    console.error(`❌ Erreur Webhook: ${err.message}`)
    return new Response(`Error: ${err.message}`, { status: 400 })
  }
})