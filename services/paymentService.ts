import { supabase } from '../supabaseClient';

export const paymentService = {
  /**
   * Service désactivé temporairement.
   * La mise à jour des crédits et plans se fait directement via userService.
   */
  createCheckoutSession: async (priceId: string, metadata: any = {}) => {
    console.warn('Payment Service: Stripe connection is currently disabled. Using direct DB update instead.');
    return null;
  }
};