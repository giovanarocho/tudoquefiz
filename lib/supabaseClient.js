import { createClient } from '@supabase/supabase-js';

// Cliente usado no navegador — respeita as políticas de Row Level Security
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
