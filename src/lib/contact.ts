// ============================================================================
// Server fn — Form "Fale Conosco"
// Insere em public.contact_messages (RLS permite anon insert).
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/admin.server";
import { contactSchema } from "./validations";

export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => contactSchema.parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("contact_messages").insert({
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      message: data.message,
      status: "new",
    });
    if (error) {
      console.error("[contact] erro ao salvar:", error);
      throw new Error("Não foi possível enviar sua mensagem. Tente novamente.");
    }
    return { ok: true };
  });
