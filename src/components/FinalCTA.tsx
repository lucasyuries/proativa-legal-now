import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FinalCTA() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-foreground text-background p-8 sm:p-16">
          <div className="absolute inset-0 bg-grid opacity-[0.05]" />
          <div className="relative max-w-2xl">
            <h2 className="font-display text-3xl sm:text-5xl text-background text-balance leading-[1.05]">
              Sua empresa não pode esperar até 2026.
            </h2>
            <p className="mt-5 text-base sm:text-lg text-background/70 text-pretty">
              Cada mês sem medição é exposição. Entre para a leva com 70% OFF antes que o cronômetro zere.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 bg-background text-foreground hover:bg-background/90 group"
            >
              <a href="#precos">
                Quero o Proativa com 70% OFF
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
