// ============================================================================
// SERVER FUNCTION — Mercado Pago Checkout Pro
// ----------------------------------------------------------------------------
// Cria preferência no Mercado Pago E grava subscription PENDING vinculada
// ao usuário autenticado. O webhook (futuro) atualizará para 'approved'.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { getPlan, type BillingCycle } from "./plans";
import { supabaseAdmin } from "@/integrations/supabase/admin.server";

const MP_API = "https://api.mercadopago.com/checkout/preferences";

export interface CheckoutInput {
  planId: string;
  cycle: BillingCycle;
  origin: string;
}

export const createMercadoPagoCheckout = createServerFn({ method: "POST" })
  .inputValidator((input: unknown): CheckoutInput => {
    const i = input as Partial<CheckoutInput> | null;
    if (!i?.planId || !i?.cycle || !i?.origin) {
      throw new Error("planId, cycle e origin são obrigatórios.");
    }
    if (i.cycle !== "monthly" && i.cycle !== "annual") {
      throw new Error("cycle deve ser 'monthly' ou 'annual'.");
    }
    return { planId: i.planId, cycle: i.cycle, origin: i.origin };
  })
  .handler(async ({ data }) => {
    const plan = getPlan(data.planId);
    if (!plan) throw new Error("Plano inválido.");

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado.");
    }

    // ----- 1) Identificar usuário autenticado a partir do JWT no header -----
    const authHeader = getRequestHeader("authorization");
    const accessJwt = authHeader?.replace(/^Bearer\s+/i, "");
    if (!accessJwt) {
      throw new Error("Você precisa estar logado para finalizar a compra.");
    }
    const supaUser = createClient(
      process.env.SYSTEM_SUPABASE_URL!,
      process.env.SYSTEM_SUPABASE_PUBLISHABLE_KEY!,
      { global: { headers: { Authorization: `Bearer ${accessJwt}` } } },
    );
    const { data: userData, error: userErr } = await supaUser.auth.getUser(accessJwt);
    if (userErr || !userData.user) {
      throw new Error("Sessão inválida. Faça login novamente.");
    }
    const user = userData.user;

    // Profile (nome) — usado no payer
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle();

    const unitPrice = data.cycle === "annual" ? plan.price.annual : plan.price.monthly;
    const externalRef = crypto.randomUUID();

    // ----- 2) Criar registro PENDING no banco ANTES de chamar o MP -----
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

    // ----- 3) Criar preferência no Mercado Pago -----
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
      // notification_url: `${data.origin}/api/mercado-pago-webhook`, // futuro
    };

    const res = await fetch(MP_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
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

    // Atualiza preference_id na subscription
    await supabaseAdmin
      .from("subscriptions")
      .update({ mp_preference_id: json.id })
      .eq("id", subRow.id);

    const isTestToken = accessToken.startsWith("TEST-");
    return {
      init_point:
        isTestToken && json.sandbox_init_point ? json.sandbox_init_point : json.init_point,
    };
  });
