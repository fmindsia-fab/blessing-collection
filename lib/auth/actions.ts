"use server";

import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/store/get-active-store";
import { signupSchema } from "@/lib/onboarding/schema";
import { recordLegalAcceptance } from "@/lib/legal/acceptance";

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
  // Com CAPTCHA ligado no Supabase Auth o token é obrigatório; sem ele (CAPTCHA
  // desligado) o campo vem vazio e é ignorado.
  const captchaToken = String(formData.get("captchaToken") ?? "") || undefined;

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${siteUrl}/auth/confirm?next=${encodeURIComponent("/redefinir-senha")}`,
    captchaToken,
  });

  // CAPTCHA recusado não pode virar o "verifique seu e-mail" genérico: nada foi
  // enviado, e a pessoa ficaria esperando um e-mail que não vem.
  if (error?.message?.toLowerCase().includes("captcha")) {
    return { error: "Não foi possível verificar o CAPTCHA. Recarregue a página e tente de novo." };
  }

  if (error?.status === 429) {
    return { error: "Muitas tentativas. Aguarde um minuto e tente de novo." };
  }
  if (error) {
    console.error("[requestPasswordReset]", error.status, error.message);
  }

  return { success: true };
}

export type RegisterAccountInput = {
  email: string;
  password: string;
  acceptTerms: boolean;
  captchaToken?: string;
};

export type RegisterAccountResult =
  | { status: "ok"; hasSession: boolean } // sem sessão = falta confirmar o e-mail
  | { status: "email-exists" }
  | { status: "error"; message: string };

// Cria a conta NO SERVIDOR (e não direto do navegador) para poder registrar o aceite
// dos Termos com as evidências reais da requisição (IP e navegador) no instante em
// que a conta nasce. Sem o aceite marcado, a conta nem é criada.
export async function registerAccount(input: RegisterAccountInput): Promise<RegisterAccountResult> {
  if (input.acceptTerms !== true) {
    return {
      status: "error",
      message: "Para criar a conta, marque que leu e concorda com os Termos de Uso e a Política de Privacidade.",
    };
  }

  const parsed = signupSchema.safeParse({ email: input.email, password: input.password });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message };

  const supabase = await createServerSupabaseClient();
  const siteUrl = await getSiteUrl();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // O link do e-mail volta para este mesmo host (/auth/confirm) e segue para a loja.
      emailRedirectTo: `${siteUrl}/auth/confirm?next=${encodeURIComponent("/cadastro/loja")}`,
      captchaToken: input.captchaToken || undefined,
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("captcha")) {
      return { status: "error", message: "Não foi possível verificar o CAPTCHA. Recarregue a página e tente de novo." };
    }
    if (error.message.includes("already registered")) return { status: "email-exists" };
    console.error("[registerAccount]", error.status, error.message);
    return { status: "error", message: "Não foi possível criar sua conta. Tente novamente." };
  }

  // Com confirmação de e-mail ligada, o Supabase não devolve erro para um e-mail já
  // cadastrado (evita revelar quem tem conta): vem um usuário sem identidades. Nesse
  // caso NÃO se registra aceite nenhum em nome de outra pessoa.
  if (!data.user || data.user.identities?.length === 0) return { status: "email-exists" };

  // Se o registro falhar, a conta já existe: o aceite é exigido de novo na criação da
  // loja (lib/onboarding/actions.ts), então ninguém fica sem o aceite registrado.
  await recordLegalAcceptance(data.user.id, "signup");

  return { status: "ok", hasSession: Boolean(data.session) };
}
