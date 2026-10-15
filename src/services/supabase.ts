import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://supabase.guembri.tn';
export const SUPABASE_ANON_KEY = 'sb_publishable_6Q3wnQa48OhFkP-0x7QThA_sMcwiED-';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    db: { schema: 'bardoflow' },
  }
);
