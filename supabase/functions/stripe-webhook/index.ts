
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1'
import Stripe from 'https://esm.sh/stripe@14.16.0?target=deno'

// Fix: Added @ts-ignore for Deno global access during Stripe initialization
// @ts-ignore
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')!
  // Fix: Added @ts-ignore for Deno environment variable access
  // @ts-ignore
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
  const body = await req.text()

  try {
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    // Fix: Added @ts-ignore for Deno globals when creating Supabase admin client
    // @ts-ignore
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const { userId, type, amount } = session.metadata

      if (type === 'credits') {
        const { data: profile } = await supabaseAdmin.from('profiles').select('credits').eq('id', userId).single()
        const newCredits = (profile?.credits || 0) + parseInt(amount)
        await supabaseAdmin.from('profiles').update({ credits: newCredits }).eq('id', userId)
      } 
      else if (type === 'subscription') {
        await supabaseAdmin.from('profiles').update({ 
          is_subscribed: true, 
          pro_plan: session.metadata.planName,
          plan_status: 'active'
        }).eq('id', userId)
      }

      // Logger la transaction
      await supabaseAdmin.from('transactions').insert({
        user_id: userId,
        stripe_session_id: session.id,
        amount_total: session.amount_total,
        currency: session.currency,
        status: 'completed',
        type: type,
        metadata: session.metadata
      })
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
})
