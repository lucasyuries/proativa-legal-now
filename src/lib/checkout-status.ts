// ============================================================================
// SERVER FUNCTION — Status público da compra (consulta por external_reference)
// ----------------------------------------------------------------------------
// Usada pelas páginas /checkout/sucesso, /checkout/erro e /checkout/pendente.
// Recebe o `ref` (UUID gerado no checkout, salvo em mp_external_reference) e
// devolve status + (se aprovado) senha temporária pra exibir como fallback
// caso o e-mail demore.
//
// SEGURANÇA: o `ref` é um UUID v4 imprevisível. Não vaza dados sensíveis sem
// posse desse UUID, que só é entregue ao próprio comprador (URL de retorno).
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/admin.server";

export interface CheckoutStatusOutput {
  status: "pending" | "approved" | "rejected" | "unknown";
  plan_id: string | null;
  cycle: string | null;
  user_email: string | null;
  temp_password: string | null;
  provisioned_at: string | null;
}

export const getCheckoutStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown): { ref: string } => {
    const i = input as { ref?: string } | null;
    if (!i?.ref || typeof i.ref !== "string" || i.ref.length < 8) {
      throw new Error("ref obrigatório");
    }
    return { ref: i.ref };
  })
  .handler(async ({ data }): Promise<CheckoutStatusOutput> => {
    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("status, plan_id, cycle, user_id, provisioned_at, metadata")
      .eq("mp_external_reference", data.ref)
      .maybeSingle();

    if (!sub) {
      return {
        status: "unknown",
        plan_id: null,
        cycle: null,
        user_email: null,
        temp_password: null,
        provisioned_at: null,
      };
    }

    let user_email: string | null = null;
    if (sub.user_id) {
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(sub.user_id);
      user_email = u.user?.email ?? null;
    }

    const meta = (sub.metadata ?? {}) as Record<string, unknown>;
    const tempPassword =
      typeof meta.temp_password === "string" ? (meta.temp_password as string) : null;

    const normalizedStatus: CheckoutStatusOutput["status"] =
      sub.status === "approved" || sub.status === "pending" || sub.status === "rejected"
        ? sub.status
        : "unknown";

    return {
      status: normalizedStatus,
      plan_id: sub.plan_id ?? null,
      cycle: sub.cycle ?? null,
      user_email,
      temp_password: sub.provisioned_at ? tempPassword : null,
      provisioned_at: sub.provisioned_at ?? null,
    };
  });
