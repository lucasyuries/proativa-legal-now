// ============================================================================
// CATÁLOGO DE PLANOS — Proativa
// ----------------------------------------------------------------------------
// Fonte única de verdade dos planos no FRONT. Os mesmos valores estão na
// tabela `public.plans` (migrations-manual/2026-04-18_sales_provisioning.sql).
// Sempre que alterar preço/feature, lembre de atualizar AMBOS.
// ============================================================================

export type BillingCycle = "monthly" | "annual";

export type PlanId = "starter" | "professional" | "enterprise";

export interface PlanFeatures {
  relatorios_pdf: boolean;
  heatmap: boolean;
  planos_acao: boolean;
  api: boolean;
  white_label: boolean;
  suporte_prioritario: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  /** Limite de usuários do sistema (admin + colaboradores). */
  max_users: number;
  features: PlanFeatures;
  /** Preço em REAIS (R$), valor numérico. */
  price: {
    monthly: number;
    annual: number;
  };
}

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    description: "Pequenas empresas e consultores independentes.",
    max_users: 5,
    features: {
      relatorios_pdf: true,
      heatmap: true,
      planos_acao: true,
      api: false,
      white_label: false,
      suporte_prioritario: false,
    },
    price: { monthly: 1, annual: 1 },
  },
  professional: {
    id: "professional",
    name: "Profissional",
    description: "Empresas e consultorias SST em crescimento.",
    max_users: 25,
    features: {
      relatorios_pdf: true,
      heatmap: true,
      planos_acao: true,
      api: false,
      white_label: false,
      suporte_prioritario: true,
    },
    price: { monthly: 1, annual: 1 },
  },
  enterprise: {
    id: "enterprise",
    name: "Empresarial",
    description: "Grandes operações, redes e consultorias.",
    max_users: 999,
    features: {
      relatorios_pdf: true,
      heatmap: true,
      planos_acao: true,
      api: true,
      white_label: true,
      suporte_prioritario: true,
    },
    price: { monthly: 59.97, annual: 599.1 },
  },
};

export function getPlan(id: string | undefined): Plan | null {
  if (!id) return null;
  return (PLANS as Record<string, Plan>)[id] ?? null;
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
