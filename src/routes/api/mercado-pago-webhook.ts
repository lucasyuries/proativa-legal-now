// ============================================================================
// SERVER ROUTE — Webhook do Mercado Pago
// POST /api/mercado-pago-webhook
// ----------------------------------------------------------------------------
// Recebe notificações de pagamento do MP, valida (assinatura quando o secret
// estiver configurado), consulta o pagamento na API do MP, e — se aprovado —:
//   1) Atualiza a subscription para status='approved'
//   2) Gera senha temporária e aplica via auth.admin.updateUserById
//   3) Promove o usuário para admin (RPC promote_to_admin)
//   4) Cria/atualiza system_accounts vinculando ao plano
//   5) Marca temp_password_sent_at (e-mail real virá pelo SMTP do Supabase
//      configurado no dashboard ou por job futuro)
//
// O endpoint SEMPRE responde 200 rapidamente (boa prática: o MP reentrega
// quando recebe não-2xx, mas processamento longo bloqueia retries em vão).
// ============================================================================

import { createFileRoute } from "@tanstack/react-router";
import crypto from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/admin.server";

const MP_PAYMENT_API = "https://api.mercadopago.com/v1/payments";

interface MpPayment {
  id: number;
  status: string; // 'approved' | 'pending' | 'rejected' | ...
  status_detail?: string;
  external_reference?: string;
  metadata?: Record<string, unknown>;
  payer?: { email?: string };
  transaction_amount?: number;
}

/**
 * Valida assinatura `x-signature` enviada pelo MP.
 * Formato: `ts=...,v1=<hmac_sha256(secret, "id:<dataId>;request-id:<xRequestId>;ts:<ts>;")>`
 * Se `MERCADO_PAGO_WEBHOOK_SECRET` não estiver setado, pula validação (modo dev).
 */
function validateSignature(opts: {
  signature: string | null;
  requestId: string | null;
  dataId: string | null;
}): { valid: boolean; reason?: string } {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[mp-webhook] MERCADO_PAGO_WEBHOOK_SECRET ausente — assinatura NÃO validada.");
    return { valid: true };
  }
  if (!opts.signature || !opts.dataId) {
    return { valid: false, reason: "missing signature or data.id" };
  }
  const parts = Object.fromEntries(
    opts.signature.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k.trim(), (v ?? "").trim()];
    }),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return { valid: false, reason: "malformed signature" };

  const manifest = `id:${opts.dataId};request-id:${opts.requestId ?? ""};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  const ok =
    expected.length === v1.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
  return ok ? { valid: true } : { valid: false, reason: "hmac mismatch" };
}

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
  const arr = new Uint32Array(16);
  crypto.webcrypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join("");
}

async function handlePayment(paymentId: string) {
  const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!mpToken) throw new Error("MERCADO_PAGO_ACCESS_TOKEN ausente");

  // 1) Busca o pagamento detalhado no MP
  const res = await fetch(`${MP_PAYMENT_API}/${paymentId}`, {
    headers: { Authorization: `Bearer ${mpToken}` },
  });
  if (!res.ok) {
    console.error("[mp-webhook] erro ao buscar pagamento:", paymentId, res.status);
    return;
  }
  const payment = (await res.json()) as MpPayment;
  const externalRef = payment.external_reference;
  if (!externalRef) {
    console.warn("[mp-webhook] pagamento sem external_reference:", payment.id);
    return;
  }

  // 2) Localiza subscription
  const { data: sub, error: subErr } = await supabaseAdmin
    .from("subscriptions")
    .select("id, user_id, plan_id, status, provisioned_at")
    .eq("mp_external_reference", externalRef)
    .maybeSingle();

  if (subErr || !sub) {
    console.error("[mp-webhook] subscription não encontrada:", externalRef, subErr);
    return;
  }

  // 3) Atualiza status conforme pagamento
  const newStatus =
    payment.status === "approved"
      ? "approved"
      : payment.status === "rejected"
        ? "rejected"
        : payment.status === "pending" || payment.status === "in_process"
          ? "pending"
          : payment.status;

  await supabaseAdmin
    .from("subscriptions")
    .update({
      status: newStatus,
      mp_payment_id: String(payment.id),
      mp_status_detail: payment.status_detail ?? null,
    })
    .eq("id", sub.id);

  if (payment.status !== "approved") {
    console.log("[mp-webhook] pagamento não aprovado:", payment.id, payment.status);
    return;
  }

  // Já provisionado? evita reprocessar
  if (sub.provisioned_at) {
    console.log("[mp-webhook] já provisionado:", sub.id);
    return;
  }

  // 4) Gera senha temporária e aplica no usuário
  const tempPassword = generateTempPassword();
  const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(sub.user_id, {
    password: tempPassword,
    email_confirm: true,
  });
  if (updErr) {
    console.error("[mp-webhook] erro ao definir senha:", updErr);
    return;
  }

  // 5) Promove a admin
  const { error: roleErr } = await supabaseAdmin.rpc("promote_to_admin", {
    _user_id: sub.user_id,
  });
  if (roleErr) console.error("[mp-webhook] erro promote_to_admin:", roleErr);

  // 6) Cria system_account
  const { error: accErr } = await supabaseAdmin.from("system_accounts").upsert(
    {
      user_id: sub.user_id,
      plan_id: sub.plan_id,
      subscription_id: sub.id,
      status: "active",
    },
    { onConflict: "user_id" },
  );
  if (accErr) console.error("[mp-webhook] erro system_accounts:", accErr);

  // 7) Marca como provisionado e armazena senha temporária para o front buscar
  //    (será limpa pelo backend quando o e-mail for enviado / após X horas)
  await supabaseAdmin
    .from("subscriptions")
    .update({
      provisioned_at: new Date().toISOString(),
      provisioned_user_id: sub.user_id,
      temp_password_sent_at: new Date().toISOString(),
      metadata: { temp_password: tempPassword },
    })
    .eq("id", sub.id);

  console.log("[mp-webhook] provisionado com sucesso:", sub.id);
}

export const Route = createFileRoute("/api/mercado-pago-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const queryDataId = url.searchParams.get("data.id") ?? url.searchParams.get("id");
          const topic = url.searchParams.get("topic") ?? url.searchParams.get("type");

          const bodyText = await request.text();
          let body: Record<string, unknown> = {};
          try {
            body = bodyText ? JSON.parse(bodyText) : {};
          } catch {
            /* ignore — alguns testes do MP enviam corpo vazio */
          }

          const dataObj = (body.data ?? {}) as Record<string, unknown>;
          const dataId =
            queryDataId ??
            (typeof dataObj.id === "string" || typeof dataObj.id === "number"
              ? String(dataObj.id)
              : null);
          const eventType = (body.type as string | undefined) ?? topic;

          // Validação de assinatura
          const sigCheck = validateSignature({
            signature: request.headers.get("x-signature"),
            requestId: request.headers.get("x-request-id"),
            dataId,
          });
          if (!sigCheck.valid) {
            console.warn("[mp-webhook] assinatura inválida:", sigCheck.reason);
            return new Response(JSON.stringify({ ok: false, reason: sigCheck.reason }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (eventType === "payment" && dataId) {
            await handlePayment(dataId);
          } else {
            console.log("[mp-webhook] evento ignorado:", eventType, dataId);
          }

          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("[mp-webhook] erro inesperado:", err);
          // Responde 200 mesmo em erro pra evitar retries infinitos do MP em
          // bugs de aplicação. O log fica registrado para diagnóstico.
          return new Response(JSON.stringify({ ok: false }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
      GET: async () =>
        new Response(JSON.stringify({ ok: true, hint: "POST only" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    },
  },
});
