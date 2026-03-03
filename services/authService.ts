import { supabase } from '../supabaseClient';

export interface LocalUser {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
  };
}

export const authService = {
  getSession: async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    } catch (err: any) {
      console.warn("[authService] Session retrieval failed:", err.message);
      return null;
    }
  },

  signIn: async (email: string, password?: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password || ''
      });
      if (error) throw error;
      return { user: data.user, session: data.session, error: null };
    } catch (e: any) {
      console.error("[Auth] SignIn error:", e);
      return { user: null, session: null, error: e.message };
    }
  },

  signInWithGoogle: async () => {
    try {
      const redirectTo = window.location.origin;
      console.log("[Auth] Initiating Google login with redirect to:", redirectTo);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });
      if (error) throw error;
      return { data, error: null };
    } catch (e: any) {
      console.error("[Auth] Google OAuth Error:", e);
      return { data: null, error: e.message };
    }
  },

  signUp: async (email: string, password?: string) => {
    try {
      const trimmedEmail = email.trim().toLowerCase();
      // Le profil sera créé et l'email synchronisé automatiquement par le trigger DB.
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: password || '',
        options: { 
          data: { 
            full_name: email.split('@')[0],
            email: trimmedEmail 
          },
          emailRedirectTo: window.location.origin 
        }
      });
      if (error) throw error;
      return { user: data.user, session: data.session, error: null };
    } catch (e: any) {
      console.error("[Auth] SignUp error:", e);
      return { user: null, session: null, error: e.message };
    }
  },

  resetPassword: async (email: string) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (e: any) {
      console.error("[Auth] Reset password error:", e);
      return { data: null, error: e.message };
    }
  },

  updatePassword: async (newPassword: string) => {
    try {
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return { data, error: null };
    } catch (e: any) {
      return { data: null, error: e.message };
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
    } catch (err) {
      localStorage.clear();
    }
  },

  onAuthStateChange: (callback: (session: any) => void) => {
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED', 'TOKEN_REFRESHED'].includes(event)) {
          callback(session);
        }
      });
      return subscription;
    } catch (err) {
      return null;
    }
  }
};