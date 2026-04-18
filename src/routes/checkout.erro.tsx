// ============================================================================
// /checkout/erro?ref=<external_reference>
// ----------------------------------------------------------------------------
// Pagamento não aprovado. Mostra resumo + CTA para tentar de novo.
// ============================================================================

import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCheckoutStatus, type CheckoutStatusOutput } from "@/lib/checkout-status";
import { formatBRL } from "@/lib/plans";

type Search = { ref?: string };

export const Route = createFileRoute("/checkout/erro")({
  validateSearch: (s: Record<string, unknown>): Search => ({ ref: s.ref as string | undefined }),
  head: () => ({
    meta: [
      { title: "Pagamento não aprovado — Proativa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ErrorPage,
});

function ErrorPage() {
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
        /* noop */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [ref]);

  const hasData = data && (data.plan_id || data.amount);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
            {loading ? (
              <Loader2 className="h-7 w-7 text-destructive animate-spin" />
            ) : (
              <XCircle className="h-7 w-7 text-destructive" />
            )}
          </div>
          <h1 className="mt-6 font-display text-3xl sm:text-4xl text-foreground">
            Pagamento não aprovado
          </h1>
          <p className="mt-3 text-muted-foreground">
            O Mercado Pago não conseguiu concluir a transação. Nenhum valor foi
            cobrado. Você pode tentar novamente com outro cartão ou método.
          </p>
        </div>

        {hasData && (
          <div className="mt-10 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-[var(--shadow-soft)] space-y-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Tentativa registrada
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
            </dl>
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link to="/">Tentar novamente</Link>
          </Button>
          <Button asChild variant="outline">
            <a href="mailto:contato@proativa.app">Falar com o suporte</a>
          </Button>
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
