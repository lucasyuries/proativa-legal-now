// ============================================================================
// API — Criação de preferência de pagamento no Mercado Pago
// ----------------------------------------------------------------------------
// Endpoint: POST /api/checkout
// Body: { planId: "starter" | "professional" | "enterprise", cycle: "monthly" | "annual" }
//
// Resposta: { init_point: string }  → URL para redirecionar o cliente ao
// checkout hospedado do Mercado Pago (Checkout Pro).
//
// 🔐 REQUER a variável de ambiente (secret) MERCADO_PAGO_ACCESS_TOKEN.
//    - Em produção: token APP_USR-... do app real
//    - Em testes: token de TESTE (TEST-...) gerado no painel do Mercado Pago
//
// 📝 Para alterar os DADOS DA EMPRESA exibidos no checkout (razão social,
//    e-mail de notificação, etc.), ajuste o objeto `payer` / `metadata` abaixo.
// ============================================================================

import { createFileRoute } from "@tanstack/react-router";
import { getPlan, type BillingCycle } from "@/lib/plans";

const MP_API = "https://api.mercadopago.com/checkout/preferences";

export const Route = createFileRoute("/api/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // 1) Lê e valida o corpo da requisição
        const body = (await request.json().catch(() => null)) as {
          planId?: string;
          cycle?: BillingCycle;
        } | null;

        if (!body?.planId || !body?.cycle) {
          return Response.json(
            { error: "planId e cycle são obrigatórios" },
            { status: 400 },
          );
        }

        const plan = getPlan(body.planId);
        if (!plan) {
          return Response.json({ error: "Plano inválido" }, { status: 400 });
        }

        const unitPrice =
          body.cycle === "annual" ? plan.price.annual : plan.price.monthly;

        // 2) Verifica credencial do Mercado Pago
        const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
        if (!accessToken) {
          return Response.json(
            {
              error:
                "MERCADO_PAGO_ACCESS_TOKEN não configurado. Adicione o token em Lovable Cloud → Secrets.",
            },
            { status: 500 },
          );
        }

        // 3) Determina URLs absolutas para back_urls (obrigatório no Checkout Pro)
        const origin =
          request.headers.get("origin") ??
          new URL(request.url).origin;

        // 4) Monta a preferência
        // 📚 Docs: https://www.mercadopago.com.br/developers/pt/reference/preferences/_checkout_preferences/post
        const preference = {
          items: [
            {
              id: `${plan.id}-${body.cycle}`,
              title: `Proativa — Plano ${plan.name} (${
                body.cycle === "annual" ? "Anual" : "Mensal"
              })`,
              description: plan.description,
              quantity: 1,
              unit_price: unitPrice,
              currency_id: "BRL",
              category_id: "services",
            },
          ],
          // 🔧 Personalize aqui os DADOS DO RECEBEDOR / METADADOS
          metadata: {
            plan_id: plan.id,
            cycle: body.cycle,
            product: "proativa",
          },
          statement_descriptor: "PROATIVA",
          back_urls: {
            success: `${origin}/checkout/sucesso?plan=${plan.id}`,
            failure: `${origin}/checkout/erro?plan=${plan.id}`,
            pending: `${origin}/checkout/pendente?plan=${plan.id}`,
          },
          auto_return: "approved",
          // notification_url: `${origin}/api/mercado-pago-webhook`, // (opcional, futuro)
        };

        // 5) Chama API do Mercado Pago
        const mpRes = await fetch(MP_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(preference),
        });

        const data = (await mpRes.json()) as {
          init_point?: string;
          sandbox_init_point?: string;
          message?: string;
        };

        if (!mpRes.ok || !data.init_point) {
          return Response.json(
            {
              error:
                data.message ?? "Falha ao criar preferência no Mercado Pago",
              details: data,
            },
            { status: 502 },
          );
        }

        // 6) Retorna a URL do Checkout Pro
        // Em ambiente de TESTE, use sandbox_init_point automaticamente.
        const isTestToken = accessToken.startsWith("TEST-");
        return Response.json({
          init_point: isTestToken
            ? data.sandbox_init_point ?? data.init_point
            : data.init_point,
        });
      },
    },
  },
});
