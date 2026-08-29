"use server";

import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isReservedSlug } from "@/lib/store/reserved-slugs";
import { slugify } from "@/lib/utils";
import type { BusinessType } from "@/types/database.types";

const signupSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres"),
  storeName: z.string().trim().min(2, "Informe o nome da loja"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "A URL da loja precisa ter pelo menos 3 letras")
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen"),
  businessType: z.enum(["artisan", "clothing", "footwear"] satisfies BusinessType[]),
  whatsappNumber: z.string().min(8, "Informe um número de WhatsApp válido"),
});

export type SignupFormState = {
  error?: string;
  success?: boolean;
};

function parseSignupForm(formData: FormData) {
  return signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    storeName: formData.get("storeName"),
    slug: formData.get("slug") || slugify(String(formData.get("storeName") ?? "")),
    businessType: formData.get("businessType"),
    whatsappNumber: formData.get("whatsappNumber"),
  });
}

/**
 * Cria a conta e a loja no mesmo fluxo (signup self-service, sem aprovação
 * manual). owner_user_id vem sempre da resposta do signUp, nunca do
 * formulário — o client não decide a quem a loja pertence.
 *
 * Se o INSERT em stores falhar (ex: corrida de slug), a conta de auth já
 * existe sem loja associada: não há service_role aqui para desfazer o
 * signUp, então esse caso vira uma conta órfã. getOwnerStore() trata isso
 * redirecionando para /cadastro em vez de quebrar (ver PLAN.md M12, risco 9).
 */
export async function signUpStoreOwner(
  _prevState: SignupFormState,
  formData: FormData,
): Promise<SignupFormState> {
  const parsed = parseSignupForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { email, password, storeName, slug, businessType, whatsappNumber } = parsed.data;

  if (isReservedSlug(slug)) {
    return { error: "Essa URL não está disponível. Escolha outra." };
  }

  const supabase = await createServerSupabaseClient();

  // Checagem prévia só de UX — a corrida real é resolvida pela constraint
  // unique(slug) no INSERT abaixo.
  const { data: existing } = await supabase.from("stores").select("id").eq("slug", slug).maybeSingle();
  if (existing) return { error: "Essa URL já está em uso. Escolha outra." };

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
  if (signUpError || !signUpData.user) {
    return {
      error:
        signUpError?.code === "user_already_exists" || signUpError?.message.includes("registered")
          ? "Este e-mail já tem uma conta."
          : "Não foi possível criar a conta. Tente novamente.",
    };
  }

  const { error: storeError } = await supabase.from("stores").insert({
    owner_user_id: signUpData.user.id,
    slug,
    name: storeName,
    whatsapp_number: whatsappNumber.replace(/\D/g, ""),
    business_type: businessType,
  });

  if (storeError) {
    return {
      error:
        storeError.code === "23505"
          ? "Essa URL já está em uso. Escolha outra."
          : "Conta criada, mas houve falha ao criar a loja. Fale com o suporte.",
    };
  }

  return { success: true };
}
