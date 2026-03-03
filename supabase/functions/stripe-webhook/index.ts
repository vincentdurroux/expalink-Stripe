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
      const userId = session.client_reference_id // C'est ton ID utilisateur Supabase

      if (!userId) {
        console.error("❌ Erreur: client_reference_id manquant dans la session Stripe")
        return new Response("No user ID", { status: 400 })
      }

      console.log(`🚀 Tentative d'activation PRO pour l'ID: ${userId}`)

      // MISE À JOUR SIMPLE : On utilise uniquement des colonnes standards
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_pro: true,           // Bascule le statut
          role_selected: true,    // Confirme le rôle
          pro_plan: 'Founding Member',      // Nom du plan
          plan_status: 'active',  // Statut pour l'UI
          updated_at: new Date().toISOString()
        })
        .eq('id', userId) // On cible l'utilisateur par son ID unique

      if (error) {
        console.error("❌ Erreur SQL Supabase:", error.message)
        throw error
      }
      
      console.log(`✅ Statut mis à jour avec succès pour l'utilisateur ${userId}`)
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })

  } catch (err) {
    console.error(`❌ Erreur Webhook: ${err.message}`)
    return new Response(`Error: ${err.message}`, { status: 400 })
  }
})