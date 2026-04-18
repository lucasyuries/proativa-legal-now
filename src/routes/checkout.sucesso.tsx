// ============================================================================
// /checkout/sucesso?ref=<external_reference>
// ----------------------------------------------------------------------------
// Página pública de confirmação. Faz polling no servidor (a cada 3s) até o
// webhook do MP marcar `provisioned_at`. Mostra a senha temporária como
// fallback caso o e-mail demore a chegar.
// ============================================================================

import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2, Mail, KeyRound, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCheckoutStatus, type CheckoutStatusOutput } from "@/lib/checkout-status";

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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!ref) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;

    async function tick() {
      try {
        const res = await getCheckoutStatus({ data: { ref: ref! } });
        if (!alive) return;
        setData(res);
        if (!res.provisioned_at && res.status !== "rejected") {
          timer = setTimeout(tick, 3000);
        }
      } catch {
        if (alive) timer = setTimeout(tick, 5000);
      }
    }
    tick();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [ref]);

  if (!ref) {
    return (
      <FallbackBox
        title="Referência ausente"
        message="Não conseguimos identificar sua compra. Se você acabou de pagar, aguarde alguns minutos e verifique seu e-mail."
      />
    );
  }

  const provisioned = !!data?.provisioned_at;
  const tempPassword = data?.temp_password;

  async function copyPassword() {
    if (!tempPassword) return;
    await navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
            {provisioned ? (
              <CheckCircle2 className="h-7 w-7 text-emerald-500" />
            ) : (
              <Loader2 className="h-7 w-7 text-emerald-500 animate-spin" />
            )}
          </div>
          <h1 className="mt-6 font-display text-3xl sm:text-4xl text-foreground">
            {provisioned ? "Tudo certo!" : "Confirmando seu pagamento…"}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {provisioned
              ? "Sua assinatura foi ativada e seu acesso de administrador foi criado."
              : "Estamos sincronizando o pagamento com o Mercado Pago. Isso pode levar até 2 minutos."}
          </p>
        </div>

        {provisioned && (
          <div className="mt-10 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-[var(--shadow-soft)] space-y-6">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  E-mail enviado para {data?.user_email ?? "seu endereço"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Contém seu login e a senha temporária. Verifique também a caixa de spam.
                </p>
              </div>
            </div>

            {tempPassword && (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                  <KeyRound className="h-3.5 w-3.5" /> Senha temporária (fallback)
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <code className="flex-1 font-mono text-sm bg-background border border-border rounded px-3 py-2 text-foreground break-all">
                    {tempPassword}
                  </code>
                  <Button size="sm" variant="outline" onClick={copyPassword}>
                    <Copy className="h-3.5 w-3.5" />
                    {copied ? "Copiado" : "Copiar"}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Use enquanto o e-mail não chega. Recomendamos trocar no primeiro acesso.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button asChild className="flex-1">
                <a href="https://sistema.proativa.app" target="_blank" rel="noreferrer">
                  Acessar o sistema <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link to="/">Voltar para o site</Link>
              </Button>
            </div>
          </div>
        )}

        {!provisioned && (
          <div className="mt-10 text-center text-xs text-muted-foreground">
            Pode fechar esta página — o acesso será enviado por e-mail assim que confirmado.
          </div>
        )}
      </div>
    </div>
  );
}

function FallbackBox({ title, message }: { title: string; message: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl text-foreground">{title}</h1>
        <p className="mt-2 text-muted-foreground">{message}</p>
        <Link to="/" className="mt-6 inline-block text-primary underline">
          Voltar para a página inicial
        </Link>
      </div>
    </div>
  );
}
