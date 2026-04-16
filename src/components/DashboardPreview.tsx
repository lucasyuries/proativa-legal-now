export function DashboardPreview() {
  // Simulated heatmap (P x S matrix)
  const cells = [
    [1, 1, 2, 2, 3],
    [1, 2, 2, 3, 3],
    [2, 2, 3, 4, 4],
    [2, 3, 4, 4, 5],
    [3, 4, 4, 5, 5],
  ];

  const colorFor = (v: number) => {
    if (v <= 1) return "bg-success/15";
    if (v === 2) return "bg-success/35";
    if (v === 3) return "bg-warning/40";
    if (v === 4) return "bg-warning/70";
    return "bg-destructive/70";
  };

  return (
    <div className="relative rounded-2xl border border-border bg-card shadow-[var(--shadow-elevated)] overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-surface">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
        <span className="ml-3 text-xs text-muted-foreground">
          proativa.app · Dashboard de Riscos Psicossociais
        </span>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 p-4 sm:p-6">
        {/* KPIs */}
        <div className="sm:col-span-1 flex flex-col gap-3">
          {[
            { label: "Respondentes", value: "1.247", sub: "+12% vs. mês ant." },
            { label: "Risco crítico", value: "8", sub: "GHEs sinalizados" },
            { label: "Conformidade", value: "94%", sub: "Pronto p/ PGR" },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-border bg-background p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{k.label}</p>
              <p className="mt-1 font-display text-2xl text-foreground">{k.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Heatmap */}
        <div className="sm:col-span-2 rounded-xl border border-border bg-background p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Matriz de Risco</p>
              <p className="font-display text-lg text-foreground">Probabilidade × Severidade</p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-success/10 text-success px-2.5 py-1 text-[11px] font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Atualizado agora
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {cells.flatMap((row, ri) =>
              row.map((v, ci) => (
                <div
                  key={`${ri}-${ci}`}
                  className={`aspect-square rounded-md ${colorFor(v)}`}
                  title={`P${ci + 1} × S${ri + 1}`}
                />
              )),
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Probabilidade →</span>
            <div className="flex items-center gap-1.5">
              <span>Baixo</span>
              <span className="h-2 w-6 rounded-full bg-gradient-to-r from-success/30 via-warning/60 to-destructive/70" />
              <span>Crítico</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
