import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { 
      type = 'subscription', // 'subscription' ou 'payment'
      planType, 
      includesFeatured, 
      creditAmount, 
      priceId,
      userId, 
      userEmail 
    } = req.json ? await req.json() : req.body;

    let line_items = [];
    let session_config = {
      customer_email: userEmail,
      mode: type,
      metadata: { userId },
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/credits`,
    };

    // --- MODE PAIEMENT UNIQUE (CRÉDITS) ---
    if (type === 'payment') {
      line_items.push({
        price: priceId,
        quantity: 1,
      });
      
      session_config.success_url = `${process.env.NEXT_PUBLIC_APP_URL}/expat-dashboard?payment=success&type=credits`;
      session_config.metadata.creditAmount = creditAmount.toString();
      session_config.metadata.purchaseType = 'credits';
    } 
    
    // --- MODE ABONNEMENT (PLANS PRO) ---
    else {
      let subscription_data = {
        metadata: {
          userId,
          planType,
          includesFeatured: String(includesFeatured)
        }
      };

      // Normalisation du nom pour le switch
      const normalizedPlan = (planType || '').toLowerCase().trim();

      if (normalizedPlan.includes('founding') || normalizedPlan.includes('early')) {
          line_items.push({ price: process.env.STRIPE_PRICE_FOUNDING, quantity: 1 });
          // GARANTIE PÉRIODE GRATUITE À 1 AN (365 JOURS)
          subscription_data.trial_period_days = 365;
      } else if (normalizedPlan.includes('monthly')) {
          line_items.push({ price: process.env.STRIPE_PRICE_MONTHLY, quantity: 1 });
          if (includesFeatured) {
            line_items.push({ price: process.env.STRIPE_PRICE_FEATURED_MONTHLY, quantity: 1 });
          }
      } else if (normalizedPlan.includes('annual') || normalizedPlan.includes('elite')) {
          line_items.push({ price: process.env.STRIPE_PRICE_ANNUAL, quantity: 1 });
          if (includesFeatured) {
            line_items.push({ price: process.env.STRIPE_PRICE_FEATURED_ANNUAL, quantity: 1 });
          }
      } else {
          return res.status(400).json({ error: 'Plan invalide' });
      }

      session_config.subscription_data = subscription_data;
      session_config.success_url = `${process.env.NEXT_PUBLIC_APP_URL}/pro-dashboard?session_id={CHECKOUT_SESSION_ID}`;
      session_config.cancel_url = `${process.env.NEXT_PUBLIC_APP_URL}/subscription`;
    }

    session_config.line_items = line_items;

    const session = await stripe.checkout.sessions.create(session_config);
    return res.status(200).json({ url: session.url });

  } catch (error) {
    console.error('[Stripe Error]:', error);
    return res.status(500).json({ error: error.message });
  }
}