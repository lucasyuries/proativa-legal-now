const stats = [
  { value: "+10.000", label: "avaliações processadas" },
  { value: "Proart", label: "metodologia validada" },
  { value: "NR-01", label: "adequação imediata ao PGR" },
];

const quotes = [
  {
    name: "Mariana Costa",
    role: "Diretora de RH · Indústria de autopeças",
    text: "Economizamos semanas de tabulação e evitamos um processo trabalhista grave usando os planos de ação do Proativa.",
  },
  {
    name: "Ricardo Almeida",
    role: "Consultor SST · Campo Grande/MS",
    text: "Antes eram três dias fechando Excel. Hoje o PDF sai em minutos — o cliente vê o heatmap e já entende onde agir.",
  },
];

export function SocialProof() {
  return (
    <section className="py-20 sm:py-28 bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Stats — mobile carrossel */}
        <div className="sm:hidden -mx-4">
          <div className="snap-row">
            {stats.map((s) => (
              <div key={s.label} className="snap-item rounded-2xl border border-border bg-card p-6 text-center">
                <p className="font-display text-3xl text-foreground">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Stats — desktop grid */}
        <div className="hidden sm:grid gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-6 text-center">
              <p className="font-display text-3xl sm:text-4xl text-foreground">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quotes — mobile carrossel */}
        <div className="mt-10 sm:hidden -mx-4">
          <div className="snap-row">
            {quotes.map((q) => (
              <figure key={q.name} className="snap-item rounded-2xl border border-border bg-card p-6">
                <blockquote className="font-display text-lg text-foreground text-balance leading-snug">
                  “{q.text}”
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    {q.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{q.name}</p>
                    <p className="text-xs text-muted-foreground">{q.role}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        {/* Quotes — desktop grid */}
        <div className="mt-10 hidden sm:grid gap-4 sm:grid-cols-2">
          {quotes.map((q) => (
            <figure key={q.name} className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <blockquote className="font-display text-lg sm:text-xl text-foreground text-balance leading-snug">
                “{q.text}”
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                  {q.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{q.name}</p>
                  <p className="text-xs text-muted-foreground">{q.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
