import { AlertTriangle } from "lucide-react";

export function AlertBar() {
  return (
    <div className="bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 py-2.5 flex items-center justify-center gap-2 text-[11px] sm:text-xs font-medium tracking-tight">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warning" />
        <p className="text-pretty text-center">
          NR-01: fiscalização de Riscos Psicossociais começa em <span className="font-semibold">26/05/2026</span>. Evite multas.
        </p>
      </div>
    </div>
  );
}
