// ============================================================================
// /cadastro — criação de conta (email + senha + nome + telefone)
// O trigger handle_new_landing_user cria profile + role automaticamente.
// ============================================================================

import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signupSchema } from "@/lib/validations";

type Search = { redirect?: string };

export const Route = createFileRoute("/cadastro")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Criar conta — Proativa" },
      { name: "description", content: "Crie sua conta Proativa em segundos." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/cadastro" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });

  function set<K extends keyof typeof form>(k: K) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = signupSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    setLoading(true);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: parsed.data.fullName,
          phone: parsed.data.phone,
        },
      },
    });
    setLoading(false);

    if (authError) {
      setError(
        authError.message.includes("already registered")
          ? "Este e-mail já está cadastrado. Faça login."
          : authError.message,
      );
      return;
    }

    // Se confirmação de email estiver desativada, já terá session — redireciona.
    if (authData.session) {
      navigate({ to: redirect ?? "/", search: {} as never });
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
          <h1 className="mt-4 font-display text-2xl text-foreground">Confira seu e-mail</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enviamos um link de confirmação para <strong>{form.email}</strong>. Clique nele para
            ativar sua conta e voltar ao Proativa.
          </p>
          <Button asChild variant="outline" className="mt-6 w-full">
            <Link to="/login" search={{ redirect } as never}>
              Já confirmei, ir para o login
            </Link>
          </Button>
        </div>
      </div>
    );
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
          <h1 className="font-display text-2xl text-foreground text-center">Criar conta</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Comece sua jornada de conformidade
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="fullName">Nome completo</Label>
              <Input
                id="fullName"
                autoComplete="name"
                value={form.fullName}
                onChange={set("fullName")}
                disabled={loading}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={set("email")}
                disabled={loading}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="(11) 99999-0000"
                value={form.phone}
                onChange={set("phone")}
                disabled={loading}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                value={form.password}
                onChange={set("password")}
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
              Criar conta
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link
              to="/login"
              search={{ redirect } as never}
              className="text-foreground underline underline-offset-4 hover:text-primary"
            >
              Entrar
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            ← Voltar para o site
          </Link>
        </p>
      </div>
    </div>
  );
}
