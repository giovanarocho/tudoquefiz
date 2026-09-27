import { createClient } from '@supabase/supabase-js';

// Cliente só pra uso dentro das rotas de servidor (pages/api/*).
// Usa a service role key, que ignora RLS — por isso NUNCA importe
// este arquivo em nada que rode no navegador.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
