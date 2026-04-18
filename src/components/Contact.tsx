// ============================================================================
// Componente Contact — formulário "Fale Conosco"
// ============================================================================

import { useState, type FormEvent } from "react";
import { Loader2, CheckCircle2, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { contactSchema } from "@/lib/validations";

export function Contact() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", message: "" });

  function set<K extends keyof typeof form>(k: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Verifique os campos.");
      return;
    }
    setLoading(true);
    try {
      const { submitContactMessage } = await import("@/lib/contact");
      await submitContactMessage({ data: parsed.data });
      setDone(true);
      setForm({ fullName: "", email: "", phone: "", message: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="contato" className="py-20 sm:py-28 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            Fale conosco
          </span>
          <h2 className="mt-4 font-display text-3xl sm:text-4xl text-foreground text-balance">
            Tire suas dúvidas com nossa equipe
          </h2>
          <p className="mt-4 text-muted-foreground">
            Envie sua mensagem e retornamos em até 1 dia útil.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-5">
          {/* Info lateral */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <Mail className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">E-mail</p>
                <a href="mailto:contato@magoweb.com.br" className="text-sm text-muted-foreground hover:text-foreground">
                  contato@magoweb.com.br
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <Phone className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">Telefone</p>
                <a href="tel:+5567992875364" className="text-sm text-muted-foreground hover:text-foreground">
                  (67) 99287-5364
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <MapPin className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">Atendimento</p>
                <p className="text-sm text-muted-foreground">Seg–Sex · 9h às 18h (BRT)</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-[var(--shadow-soft)]">
            {done ? (
              <div className="text-center py-8">
                <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
                <h3 className="mt-4 font-display text-xl text-foreground">Mensagem enviada!</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Recebemos sua mensagem e responderemos em breve.
                </p>
                <Button variant="outline" className="mt-6" onClick={() => setDone(false)}>
                  Enviar outra
                </Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="c-name">Nome completo</Label>
                    <Input
                      id="c-name"
                      value={form.fullName}
                      onChange={set("fullName")}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="c-phone">Telefone</Label>
                    <Input
                      id="c-phone"
                      type="tel"
                      placeholder="(11) 99999-0000"
                      value={form.phone}
                      onChange={set("phone")}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="c-email">E-mail</Label>
                  <Input
                    id="c-email"
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    disabled={loading}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="c-msg">Mensagem</Label>
                  <Textarea
                    id="c-msg"
                    rows={5}
                    placeholder="Conte-nos sobre sua empresa e como podemos ajudar..."
                    value={form.message}
                    onChange={set("message")}
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
                  Enviar mensagem
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
