import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './supabase-config';
let client: SupabaseClient | null = null;
export function getSupabase(){
 if(!client)client=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{
  auth: {
   persistSession: true,
   autoRefreshToken: true,
   detectSessionInUrl: true,
   // mfa.recoveryCodes.* is experimental in auth-js and off by default: every call throws until the
   // flag is set. Without it, turning on the authenticator app fails right after the code is accepted,
   // which is the worst possible moment — the factor is already enrolled, with no codes to fall back on.
   experimental: { recoveryCodes: true },
  },
 });
 return client;
}
