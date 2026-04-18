// ============================================================================
// Schemas Zod — validação de inputs (cliente + servidor)
// ============================================================================

import { z } from "zod";

export const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Informe seu nome completo").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(255),
  phone: z
    .string()
    .trim()
    .min(8, "Telefone inválido")
    .max(20)
    .regex(/^[\d\s()+-]+$/, "Use apenas números e ( ) + -"),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .max(72, "Máximo 72 caracteres"),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(255),
  password: z.string().min(1, "Informe sua senha").max(72),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const contactSchema = z.object({
  fullName: z.string().trim().min(2, "Informe seu nome completo").max(200),
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(255),
  phone: z
    .string()
    .trim()
    .min(8, "Telefone inválido")
    .max(30)
    .regex(/^[\d\s()+-]+$/, "Use apenas números e ( ) + -"),
  message: z
    .string()
    .trim()
    .min(10, "Conte-nos um pouco mais (mín. 10 caracteres)")
    .max(5000, "Mensagem muito longa"),
});
export type ContactInput = z.infer<typeof contactSchema>;
