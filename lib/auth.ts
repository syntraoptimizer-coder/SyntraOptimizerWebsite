import { useEffect, useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from './supabase';

export type PlanType = 'free' | 'premium';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<PlanType>('free');
  const [loading, setLoading] = useState(true);

  const fetchPlan = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setPlan('free');
      return;
    }
    const sb = getSupabase();
    if (!sb) {
      setPlan('free');
      return;
    }

    try {
      const { data, error } = await sb
        .from('licenses')
        .select('plan')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (!error && data?.plan === 'premium') {
        setPlan('premium');
        return;
      }

      const metaPlan = currentUser.user_metadata?.plan || currentUser.app_metadata?.plan;
      if (metaPlan === 'premium') {
        setPlan('premium');
        return;
      }

      setPlan('free');
    } catch {
      setPlan('free');
    }
  }, []);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      return;
    }

    let active = true;

    sb.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      const u = session?.user ?? null;
      setUser(u);
      void fetchPlan(u).then(() => {
        if (active) setLoading(false);
      });
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      const u = session?.user ?? null;
      setUser(u);
      await fetchPlan(u);
      if (active) setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [fetchPlan]);

  const signInWithOAuth = async (provider: 'google' | 'discord' | 'azure' | 'github') => {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase client not initialized');
    const { error } = await sb.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const signInWithOtp = async (email: string, isSignUp = false) => {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase client not initialized');
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: isSignUp,
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const sb = getSupabase();
    if (!sb) return;
    await sb.auth.signOut();
    setUser(null);
    setPlan('free');
  };

  return {
    user,
    plan,
    loading,
    signInWithOAuth,
    signInWithOtp,
    signOut,
    refreshPlan: () => fetchPlan(user),
  };
}
