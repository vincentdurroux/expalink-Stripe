import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

// On n'importe PAS Stripe au début pour éviter les bugs de microtasks
// On va juste parser le JSON nous-mêmes

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');

  // Sécurité simple si tu n'arrives pas à valider la signature : 
  // On peut l'ajouter plus tard, testons d'abord si l'ID arrive.
  
  try {
    const body = await req.json();
    const eventType = body.type;

    console.log("Événement reçu :", eventType);

    if (eventType === 'checkout.session.completed') {
      const session = body.data.object;
      const userId = session.client_reference_id;
      const amountPaid = session.amount_total || 0;
      
      // Calcul des crédits : 100 centimes = 1, 300 centimes = 5
      const creditsToAdd = amountPaid >= 300 ? 5 : 1;

      console.log(`Paiement reçu pour l'user: ${userId}, Montant: ${amountPaid}`);

      if (userId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Récupérer les crédits actuels
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', userId)
          .single();

        if (fetchError) throw fetchError;

        // 2. Additionner et mettre à jour
        const newTotal = (profile?.credits || 0) + creditsToAdd;
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ credits: newTotal })
          .eq('id', userId);

        if (updateError) throw updateError;

        console.log(`SUCCÈS : ${creditsToAdd} crédits ajoutés. Nouveau total: ${newTotal}`);
      } else {
        console.error("ERREUR : Pas de client_reference_id trouvé dans la session Stripe");
      }
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });

  } catch (err) {
    console.error("Erreur critique webhook :", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
})