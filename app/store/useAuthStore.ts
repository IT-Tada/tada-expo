import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { Session } from '@supabase/supabase-js';

export type UserPlan = 'free' | 'premium';
export type AuthStatus = 'guest' | 'authenticated';

interface Profile {
  id: string;
  email: string;
  plan: UserPlan;
  credits: number;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  status: AuthStatus;
  session: Session | null;
  profile: Profile | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  purchaseCredits: (amount: number, isSubscription: boolean) => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'guest',
  session: null,
  profile: null,

  initialize: async () => {
    try {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;

        set({
          status: 'authenticated',
          session,
          profile,
        });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          try {
            // Wait a moment for the trigger to create the profile
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Fetch user profile
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError) throw profileError;

            set({
              status: 'authenticated',
              session,
              profile,
            });
          } catch (error) {
            console.error('Error fetching profile:', error);
            // Sign out if profile fetch fails
            await supabase.auth.signOut();
            set({
              status: 'guest',
              session: null,
              profile: null,
            });
          }
        } else if (event === 'SIGNED_OUT') {
          set({
            status: 'guest',
            session: null,
            profile: null,
          });
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({
        status: 'guest',
        session: null,
        profile: null,
      });
    }
  },

  login: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Profile will be automatically updated via onAuthStateChange
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  signup: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      // Add a delay to allow the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify profile was created
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user?.id)
        .single();

      if (profileError) {
        // If profile creation failed, delete the auth user and throw error
        await supabase.auth.signOut();
        throw new Error('Failed to create user profile. Please try again.');
      }

      // Profile will be automatically updated via onAuthStateChange
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // State will be automatically updated via onAuthStateChange
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },
  purchaseCredits: async (amount: number, isSubscription: boolean) => {
    const { session, profile } = get();
    if (!session?.user || !profile) throw new Error('Not authenticated');

    try {
      // This would typically integrate with a payment processor
      // For now, we'll just update the credits in the profile
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          credits: profile.credits + amount,
          // If it's a subscription, we'd also update the subscription status
          ...(isSubscription && { plan: 'premium' })
        })
        .eq('id', session.user.id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        ...state,
        profile: data,
      }));
      
      return data;
    } catch (error) {
      console.error('Purchase error:', error);
      throw error;
    }
  }
}));
