// ============================================================================
// /checkout/sucesso?ref=<external_reference>
// ----------------------------------------------------------------------------
// Confirmação visual após retorno do Mercado Pago. Lê dados da compra na
// tabela subscriptions e mostra plano/ciclo/valor. Não há provisionamento
// automático — o comprador usa o login criado no cadastro prévio.
// ============================================================================

import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCheckoutStatus, type CheckoutStatusOutput } from "@/lib/checkout-status";
import { formatBRL } from "@/lib/plans";

type Search = { ref?: string };

export const Route = createFileRoute("/checkout/sucesso")({
  validateSearch: (s: Record<string, unknown>): Search => ({ ref: s.ref as string | undefined }),
  head: () => ({
    meta: [
      { title: "Pagamento confirmado — Proativa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const { ref } = Route.useSearch();
  const [data, setData] = useState<CheckoutStatusOutput | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ref) {
      setLoading(false);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const res = await getCheckoutStatus({ data: { ref } });
        if (alive) setData(res);
      } catch {
        /* mostra estado padrão */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [ref]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
            {loading ? (
              <Loader2 className="h-7 w-7 text-emerald-500 animate-spin" />
            ) : (
              <CheckCircle2 className="h-7 w-7 text-emerald-500" />
            )}
          </div>
          <h1 className="mt-6 font-display text-3xl sm:text-4xl text-foreground">
            Compra confirmada!
          </h1>
          <p className="mt-3 text-muted-foreground">
            Recebemos a confirmação do Mercado Pago. Use o login que você criou no
            cadastro para acessar o sistema.
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-[var(--shadow-soft)] space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Resumo da compra
          </h2>

          <dl className="space-y-3 text-sm">
            <Row label="Plano" value={data?.plan_name ?? data?.plan_id ?? "—"} />
            <Row
              label="Ciclo"
              value={
                data?.cycle === "annual" ? "Anual" : data?.cycle === "monthly" ? "Mensal" : "—"
              }
            />
            <Row
              label="Valor"
              value={typeof data?.amount === "number" ? formatBRL(data.amount) : "—"}
            />
            <Row label="E-mail" value={data?.user_email ?? "—"} />
            <Row
              label="Status"
              value={
                data?.status === "approved"
                  ? "Aprovado"
                  : data?.status === "pending"
                    ? "Em análise"
                    : data?.status === "rejected"
                      ? "Recusado"
                      : "—"
              }
            />
          </dl>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button asChild className="flex-1">
              <Link to="/login">
                <LogIn className="h-4 w-4" /> Acessar minha conta
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to="/">Voltar para o site</Link>
            </Button>
          </div>

          {!ref && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              Não recebemos a referência da compra. Se o pagamento foi feito, ele
              continua válido — basta acessar com seu login.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground text-right break-all">{value}</dd>
    </div>
  );
}
