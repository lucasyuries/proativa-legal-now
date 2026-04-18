// ============================================================================
// Supabase BROWSER client — conectado ao banco do SISTEMA Proativa
// ----------------------------------------------------------------------------
// URL e chave PUBLISHABLE são públicas por design (RLS protege os dados).
// A service role NUNCA aparece aqui — só em admin.server.ts.
// ============================================================================

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://pmoofkgrqcgtcrrgyzsu.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_2eSpgen_FuENNYJbFVXhbw_62kNeZfs";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    storageKey: "proativa-landing-auth",
  },
});
