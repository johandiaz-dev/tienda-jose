import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://jaitppjyxspiuqfxnbzb.supabase.co';

export const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_KoEcl49t5rzWM30J0yoopQ_at8EGtHv';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
