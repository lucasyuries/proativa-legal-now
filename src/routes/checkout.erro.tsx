// ============================================================================
// /checkout/erro?ref=<external_reference>
// ----------------------------------------------------------------------------
// Pagamento não aprovado. Mostra mensagem clara e CTA para tentar de novo.
// ============================================================================

import { createFileRoute, Link } from "@tanstack/react-router";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full text-center">
        <div className="mx-auto h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
          <XCircle className="h-7 w-7 text-destructive" />
        </div>
        <h1 className="mt-6 font-display text-3xl sm:text-4xl text-foreground">
          Pagamento não aprovado
        </h1>
        <p className="mt-3 text-muted-foreground">
          O Mercado Pago não conseguiu concluir a transação. Nenhum valor foi cobrado.
          Você pode tentar novamente com outro cartão ou método de pagamento.
        </p>

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
