// ============================================================================
// Supabase ADMIN client (SERVER ONLY) — bypass RLS
// ----------------------------------------------------------------------------
// Usa a SERVICE ROLE KEY. NUNCA importar este arquivo em código de cliente.
// Usado em server functions para gravar subscriptions após criar preferência
// no Mercado Pago e (futuramente) em webhooks que confirmam o pagamento.
// ============================================================================

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SYSTEM_SUPABASE_URL;
const SERVICE_ROLE = process.env.SYSTEM_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  throw new Error(
    "SYSTEM_SUPABASE_URL e SYSTEM_SUPABASE_SERVICE_ROLE_KEY são obrigatórios no servidor.",
  );
}

export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});
