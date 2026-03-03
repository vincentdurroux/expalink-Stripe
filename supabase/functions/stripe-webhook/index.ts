if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      
      // PRIORITÉ 1: Récupérer l'ID utilisateur (indispensable)
      // On le cherche dans client_reference_id (standard Payment Links) 
      // ou dans metadata (si configuré manuellement)
      const userId = session.client_reference_id || session.metadata?.userId

      if (!userId) {
        console.error("Pas d'ID utilisateur trouvé dans la session Stripe")
        return new Response("No User ID", { status: 400 })
      }

      // PRIORITÉ 2: Déterminer le type (Abonnement ou Crédits)
      // Si session.mode est 'subscription', c'est un abonnement
      const isSubscription = session.mode === 'subscription'
      const type = session.metadata?.type || (isSubscription ? 'subscription' : 'credits')

      if (type === 'credits') {
        const { data: profile } = await supabaseAdmin.from('profiles').select('credits').eq('id', userId).single()
        
        // CALCUL AUTOMATIQUE DU NOMBRE DE CRÉDITS
        // Si session.metadata.amount existe on l'utilise, 
        // sinon on calcule selon le prix payé (ex: 500 centimes = 5€ = 5 crédits)
        const creditsToSave = session.metadata?.amount 
          ? parseInt(session.metadata.amount) 
          : Math.floor(session.amount_total / 100) // 1 crédit par Euro payé

        const newCredits = (profile?.credits || 0) + creditsToSave
        
        await supabaseAdmin.from('profiles').update({ credits: newCredits }).eq('id', userId)
        console.log(`Crédits ajoutés : ${creditsToSave} pour ${userId}`)
      } 
      else if (type === 'subscription') {
        await supabaseAdmin.from('profiles').update({ 
          is_subscribed: true, 
          pro_plan: session.metadata?.planName || 'Pro Plan',
          plan_status: 'active'
        }).eq('id', userId)
      }

      // Logger la transaction (On garde ton code qui est excellent)
      await supabaseAdmin.from('transactions').insert({
        user_id: userId,
        stripe_session_id: session.id,
        amount_total: session.amount_total,
        currency: session.currency,
        status: 'completed',
        type: type,
        metadata: session.metadata || {}
      })
    }