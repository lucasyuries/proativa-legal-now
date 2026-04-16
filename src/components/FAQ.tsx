import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "A pesquisa tem validade jurídica?",
    a: "Sim. O fluxo segue boas práticas de documentação para o PGR, com rastreabilidade e relatórios exportáveis.",
  },
  {
    q: "Como garantem o anonimato dos colaboradores?",
    a: "Separação de identidade, controles LGPD e agregação mínima para evitar reidentificação.",
  },
  {
    q: "Serve para clínicas de SST e consultorias?",
    a: "Sim, com modo multi-empresas, padronização e white label nos planos superiores.",
  },
  {
    q: "Quão rápido consigo colocar para rodar?",
    a: "Em poucos dias — disparo, acompanhamento e exportação sem projeto longo de TI.",
  },
  {
    q: "Onde ficam armazenados os dados?",
    a: "Práticas alinhadas à LGPD, controle de acesso e backup regular.",
  },
  {
    q: "O desconto de 70% vale para sempre?",
    a: "Não. É condição de lançamento com vagas limitadas.",
  },
  {
    q: "Posso migrar de plano depois?",
    a: "Sim, conforme o crescimento da operação ou da carteira.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 sm:py-28 bg-surface">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-accent-foreground/70">FAQ</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl text-foreground text-balance">
            Perguntas frequentes
          </h2>
        </div>

        <Accordion type="single" collapsible className="mt-10 w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-border">
              <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
