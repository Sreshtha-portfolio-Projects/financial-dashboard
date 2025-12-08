import { create } from 'zustand';
import { supabase } from '../../../lib/supabaseClient';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  loading: true,
  error: null,

  initSession: async () => {
    try {
      set({ loading: true, error: null });
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (session) {
        set({
          user: session.user,
          token: session.access_token,
          loading: false,
        });
      } else {
        set({ user: null, token: null, loading: false });
      }
    } catch (error) {
      console.error('Init session error:', error);
      set({ error: error.message, loading: false });
    }
  },

  login: async (email, password) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      set({
        user: data.user,
        token: data.session.access_token,
        loading: false,
      });
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  signup: async (email, password) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (data.session) {
        set({
          user: data.user,
          token: data.session.access_token,
          loading: false,
        });
      } else {
        // Email confirmation required
        set({ loading: false });
      }
      
      return { success: true, requiresConfirmation: !data.session };
    } catch (error) {
      console.error('Signup error:', error);
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  logout: async () => {
    try {
      await supabase.auth.signOut();
      set({ user: null, token: null, loading: false, error: null });
    } catch (error) {
      console.error('Logout error:', error);
      set({ error: error.message });
    }
  },
}));

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    useAuthStore.getState().initSession();
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({ user: null, token: null });
  }
});

