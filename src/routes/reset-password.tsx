// ============================================================================
// /reset-password — define uma nova senha após o usuário clicar no link de
// recuperação enviado por e-mail. O Supabase converte o token em sessão
// automaticamente via onAuthStateChange (evento PASSWORD_RECOVERY).
// ============================================================================

import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — Proativa" },
      { name: "description", content: "Defina uma nova senha para sua conta Proativa." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Quando o usuário chega via link de recuperação, o Supabase emite o
  // evento PASSWORD_RECOVERY assim que a sessão temporária é montada.
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted && data.session) setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setReady(true);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
    setTimeout(() => navigate({ to: "/", search: {} as never }), 1500);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <span className="font-display text-2xl text-foreground">Proativa</span>
        </Link>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-[var(--shadow-soft)]">
          {done ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
              <h1 className="mt-4 font-display text-2xl text-foreground">Senha atualizada</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Tudo certo! Você já está logado e será redirecionado.
              </p>
            </div>
          ) : !ready ? (
            <div className="text-center py-8">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                Validando link de recuperação…
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Se nada acontecer em alguns segundos, o link pode ter expirado.
                <br />
                <Link
                  to="/esqueci-senha"
                  className="text-foreground underline underline-offset-4"
                >
                  Solicitar novo link
                </Link>
              </p>
            </div>
          ) : (
            <>
              <h1 className="font-display text-2xl text-foreground text-center">Nova senha</h1>
              <p className="mt-1 text-center text-sm text-muted-foreground">
                Defina uma senha forte para sua conta.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="password">Nova senha</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="confirm">Confirmar nova senha</Label>
                  <Input
                    id="confirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button type="submit" disabled={loading} size="lg" className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Salvar nova senha
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/login" className="hover:text-foreground">
            ← Voltar para o login
          </Link>
        </p>
      </div>
    </div>
  );
}
