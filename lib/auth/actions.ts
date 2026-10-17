"use server";

import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/store/get-active-store";

export type PasswordResetRequestState = {
  error?: string;
  success?: boolean;
};

const emailSchema = z.string().trim().toLowerCase().email("Informe um e-mail válido");

// Pede o e-mail de recuperação. A resposta é a MESMA exista ou não uma conta
// com esse e-mail: confirmar a existência deixaria qualquer pessoa descobrir
// quem tem cadastro. Só a limitação de frequência do Supabase (429) é
// informada, pois não revela nada sobre a conta.
export async function requestPasswordReset(
  _prevState: PasswordResetRequestState,
  formData: FormData,
): Promise<PasswordResetRequestState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createServerSupabaseClient();

  // O link do e-mail volta para o host de onde o pedido saiu (apex ou
  // subdomínio da loja), porque a sessão de login é por host.
  const siteUrl = await getSiteUrl();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${siteUrl}/auth/confirm?next=${encodeURIComponent("/redefinir-senha")}`,
  });

  if (error?.status === 429) {
    return { error: "Muitas tentativas. Aguarde um minuto e tente de novo." };
  }
  if (error) {
    console.error("[requestPasswordReset]", error.status, error.message);
  }

  return { success: true };
}
