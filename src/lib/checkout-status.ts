// ============================================================================
// SERVER FUNCTION — Status público da compra (consulta por external_reference)
// ----------------------------------------------------------------------------
// Usada pelas páginas /checkout/sucesso, /checkout/erro e /checkout/pendente
// apenas para mostrar dados da compra (plano, ciclo, valor, status).
// Não há provisionamento automático: o usuário usa o login que criou no
// cadastro prévio.
//
// SEGURANÇA: o `ref` é um UUID v4 imprevisível, entregue apenas ao comprador
// na URL de retorno do Mercado Pago.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/admin.server";

export interface CheckoutStatusOutput {
  status: "pending" | "approved" | "rejected" | "unknown";
  plan_id: string | null;
  plan_name: string | null;
  cycle: "monthly" | "annual" | null;
  amount: number | null;
  user_email: string | null;
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
      .select("status, plan_id, cycle, amount, user_id, metadata")
      .eq("mp_external_reference", data.ref)
      .maybeSingle();

    if (!sub) {
      return {
        status: "unknown",
        plan_id: null,
        plan_name: null,
        cycle: null,
        amount: null,
        user_email: null,
      };
    }

    let user_email: string | null = null;
    if (sub.user_id) {
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(sub.user_id);
      user_email = u.user?.email ?? null;
    }

    const meta = (sub.metadata ?? {}) as Record<string, unknown>;
    const plan_name = typeof meta.plan_name === "string" ? meta.plan_name : null;

    const normalizedStatus: CheckoutStatusOutput["status"] =
      sub.status === "approved" || sub.status === "pending" || sub.status === "rejected"
        ? sub.status
        : "unknown";

    const normalizedCycle: CheckoutStatusOutput["cycle"] =
      sub.cycle === "monthly" || sub.cycle === "annual" ? sub.cycle : null;

    return {
      status: normalizedStatus,
      plan_id: sub.plan_id ?? null,
      plan_name,
      cycle: normalizedCycle,
      amount: typeof sub.amount === "number" ? sub.amount : null,
      user_email,
    };
  });
