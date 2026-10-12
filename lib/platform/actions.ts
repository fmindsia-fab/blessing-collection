"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/platform/get-platform-admin";

export type PlatformActionState = {
  error?: string;
  success?: boolean;
};

// Suspender/reativar manualmente (escopo mínimo do painel, ver plano do
// Milestone 4) — reaproveita a mesma coluna stores.status que o webhook do
// Stripe sincroniza (ver app/api/webhooks/stripe/route.ts), sem criar um
// segundo mecanismo paralelo de "a loja está ativa". A RLS
// (stores_platform_admin_update) é quem de fato garante que só um platform
// admin consegue escrever aqui; esta checagem é defesa em profundidade.
export async function setStoreStatus(
  storeId: string,
  status: "active" | "inactive",
): Promise<PlatformActionState> {
  if (!(await isPlatformAdmin())) {
    return { error: "Acesso restrito ao administrador da plataforma." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("stores").update({ status }).eq("id", storeId);

  if (error) return { error: "Não foi possível atualizar o status da loja." };

  revalidatePath("/admin-plataforma");
  revalidatePath(`/admin-plataforma/lojas/${storeId}`);
  return { success: true };
}
