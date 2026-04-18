// ============================================================================
// /checkout/pendente?ref=<external_reference>
// ----------------------------------------------------------------------------
// Pagamento aguardando confirmação (Pix, boleto, etc). Faz polling como a
// página de sucesso e redireciona internamente quando o status mudar.
// ============================================================================

import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCheckoutStatus, type CheckoutStatusOutput } from "@/lib/checkout-status";

type Search = { ref?: string };

export const Route = createFileRoute("/checkout/pendente")({
  validateSearch: (s: Record<string, unknown>): Search => ({ ref: s.ref as string | undefined }),
  head: () => ({
    meta: [
      { title: "Pagamento pendente — Proativa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PendingPage,
});

function PendingPage() {
  const { ref } = Route.useSearch();
  const navigate = useNavigate();
  const [data, setData] = useState<CheckoutStatusOutput | null>(null);

  useEffect(() => {
    if (!ref) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;

    async function tick() {
      try {
        const res = await getCheckoutStatus({ data: { ref: ref! } });
        if (!alive) return;
        setData(res);
        if (res.status === "approved") {
          navigate({ to: "/checkout/sucesso", search: { ref } });
          return;
        }
        if (res.status === "rejected") {
          navigate({ to: "/checkout/erro", search: { ref } });
          return;
        }
        timer = setTimeout(tick, 5000);
      } catch {
        if (alive) timer = setTimeout(tick, 8000);
      }
    }
    tick();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [ref, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full text-center">
        <div className="mx-auto h-14 w-14 rounded-full bg-amber-500/10 flex items-center justify-center">
          {data?.status === "pending" ? (
            <Clock className="h-7 w-7 text-amber-500" />
          ) : (
            <Loader2 className="h-7 w-7 text-amber-500 animate-spin" />
          )}
        </div>
        <h1 className="mt-6 font-display text-3xl sm:text-4xl text-foreground">
          Pagamento em análise
        </h1>
        <p className="mt-3 text-muted-foreground">
          Estamos aguardando a confirmação do Mercado Pago. Pix costuma levar
          poucos segundos; boleto pode levar até 2 dias úteis. Você receberá
          o acesso por e-mail assim que for aprovado.
        </p>

        <div className="mt-8">
          <Button asChild variant="outline">
            <Link to="/">Voltar para o site</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
