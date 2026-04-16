import { ShieldCheck, Lock } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ShieldCheck className="h-4.5 w-4.5" strokeWidth={2.2} />
              </span>
              <span className="font-display text-xl text-foreground">Proativa</span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Gestão de Riscos Psicossociais com metodologia Proart. Prepare-se para a NR-01 antes de 26/05/2026.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground">
                <Lock className="h-3 w-3" /> SSL seguro
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground">
                LGPD
              </span>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-foreground">Produto</p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li><a href="#solucao" className="hover:text-foreground">Recursos</a></li>
              <li><a href="#como" className="hover:text-foreground">Como funciona</a></li>
              <li><a href="#precos" className="hover:text-foreground">Planos</a></li>
              <li><a href="#faq" className="hover:text-foreground">FAQ</a></li>
            </ul>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-foreground">Contato</p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li><a href="mailto:contato@magoweb.com.br" className="hover:text-foreground">contato@magoweb.com.br</a></li>
              <li><a href="tel:+5567992875364" className="hover:text-foreground">(67) 99287-5364</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© 2026 Proativa. Todos os direitos reservados.</p>
          <p>CNPJ: 12.345.678/0001-90</p>
        </div>
      </div>
    </footer>
  );
}
