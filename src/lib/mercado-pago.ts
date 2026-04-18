// ============================================================================
// SERVER FUNCTION — Mercado Pago Checkout Pro
// ----------------------------------------------------------------------------
// 1) Valida o usuário a partir do accessToken (Supabase JWT) enviado no input
// 2) Cria registro de subscription PENDING vinculado ao usuário
// 3) Cria preferência no Mercado Pago com external_reference correlacionável
// 4) Retorna init_point para o frontend redirecionar
// ----------------------------------------------------------------------------
// Webhook (futuro): /api/mercado-pago-webhook receberá notificação e atualizará
// status da subscription para 'approved' usando mp_external_reference.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { getPlan, type BillingCycle } from "./plans";
import { supabaseAdmin } from "@/integrations/supabase/admin.server";

const MP_API = "https://api.mercadopago.com/checkout/preferences";

export interface CheckoutInput {
  planId: string;
  cycle: BillingCycle;
  origin: string;
  accessToken: string;
}

export const createMercadoPagoCheckout = createServerFn({ method: "POST" })
  .inputValidator((input: unknown): CheckoutInput => {
    const i = input as Partial<CheckoutInput> | null;
    if (!i?.planId || !i?.cycle || !i?.origin || !i?.accessToken) {
      throw new Error("planId, cycle, origin e accessToken são obrigatórios.");
    }
    if (i.cycle !== "monthly" && i.cycle !== "annual") {
      throw new Error("cycle deve ser 'monthly' ou 'annual'.");
    }
    return {
      planId: i.planId,
      cycle: i.cycle,
      origin: i.origin,
      accessToken: i.accessToken,
    };
  })
  .handler(async ({ data }) => {
    const plan = getPlan(data.planId);
    if (!plan) throw new Error("Plano inválido.");

    const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!mpToken) throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado.");

    // ---- 1) Valida usuário pelo JWT ----
    const supaPub = createClient(
      "https://pmoofkgrqcgtcrrgyzsu.supabase.co",
      "sb_publishable_2eSpgen_FuENNYJbFVXhbw_62kNeZfs",
    );
    const { data: userData, error: userErr } = await supaPub.auth.getUser(data.accessToken);
    if (userErr || !userData.user) {
      throw new Error("Sessão inválida. Faça login novamente.");
    }
    const user = userData.user;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle();

    const unitPrice = data.cycle === "annual" ? plan.price.annual : plan.price.monthly;
    const externalRef = crypto.randomUUID();

    // ---- 2) Subscription PENDING ----
    const { data: subRow, error: subErr } = await supabaseAdmin
      .from("subscriptions")
      .insert({
        user_id: user.id,
        plan_id: plan.id,
        cycle: data.cycle,
        amount: unitPrice,
        status: "pending",
        mp_external_reference: externalRef,
        metadata: { plan_name: plan.name },
      })
      .select("id")
      .single();
    if (subErr) {
      console.error("[checkout] erro ao gravar subscription:", subErr);
      throw new Error("Falha ao registrar a compra. Tente novamente.");
    }

    // ---- 3) Cria preferência no Mercado Pago ----
    const preference = {
      items: [
        {
          id: `${plan.id}-${data.cycle}`,
          title: `Proativa — Plano ${plan.name} (${
            data.cycle === "annual" ? "Anual" : "Mensal"
          })`,
          description: plan.description,
          quantity: 1,
          unit_price: unitPrice,
          currency_id: "BRL",
          category_id: "services",
        },
      ],
      payer: {
        email: user.email,
        name: profile?.full_name ?? undefined,
      },
      external_reference: externalRef,
      metadata: {
        plan_id: plan.id,
        cycle: data.cycle,
        user_id: user.id,
        subscription_id: subRow.id,
        product: "proativa",
      },
      statement_descriptor: "PROATIVA",
      back_urls: {
        success: `${data.origin}/checkout/sucesso?ref=${externalRef}`,
        failure: `${data.origin}/checkout/erro?ref=${externalRef}`,
        pending: `${data.origin}/checkout/pendente?ref=${externalRef}`,
      },
      auto_return: "approved",
    };

    const res = await fetch(MP_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mpToken}`,
      },
      body: JSON.stringify(preference),
    });
    const json = (await res.json()) as {
      id?: string;
      init_point?: string;
      sandbox_init_point?: string;
      message?: string;
    };
    if (!res.ok || !json.init_point) {
      console.error("[checkout] MP error:", json);
      throw new Error(json.message ?? `Falha ao criar preferência (HTTP ${res.status}).`);
    }

    await supabaseAdmin
      .from("subscriptions")
      .update({ mp_preference_id: json.id })
      .eq("id", subRow.id);

    const isTestToken = mpToken.startsWith("TEST-");
    return {
      init_point:
        isTestToken && json.sandbox_init_point ? json.sandbox_init_point : json.init_point,
    };
  });
