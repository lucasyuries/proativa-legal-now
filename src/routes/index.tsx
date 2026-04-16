import { createFileRoute } from "@tanstack/react-router";
import { AlertBar } from "@/components/AlertBar";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Risk } from "@/components/Risk";
import { Solution } from "@/components/Solution";
import { HowItWorks } from "@/components/HowItWorks";
import { SocialProof } from "@/components/SocialProof";
import { Pricing } from "@/components/Pricing";
import { FAQ } from "@/components/FAQ";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Proativa — Conformidade NR-01 sem planilhas" },
      {
        name: "description",
        content:
          "Mapeie, analise e gere relatórios de Riscos Psicossociais prontos para o PGR. 70% OFF no lançamento — adeque sua empresa antes de 26/05/2026.",
      },
      { property: "og:title", content: "Proativa — Conformidade NR-01 sem planilhas" },
      {
        property: "og:description",
        content:
          "Plataforma com metodologia Proart para Gestão de Riscos Psicossociais. Heatmap, planos de ação e PDF pronto para o PGR.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <AlertBar />
      <Navbar />
      <main>
        <Hero />
        <Risk />
        <Solution />
        <HowItWorks />
        <SocialProof />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
