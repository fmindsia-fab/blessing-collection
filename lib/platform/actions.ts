"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/platform/get-platform-admin";

export type PlatformActionState = {
  error?: string;
  success?: boolean;
};

// Suspender/reativar manualmente: bloqueio ADMINISTRATIVO da plataforma
// (fraude, violação etc.), em stores.status. Não tem relação com cobrança —
// trial expirado/inadimplência vivem em store_subscriptions e não passam por
// aqui (ver migration 0032). A RLS
// (stores_platform_admin_update) é quem de fato garante que só um platform
// admin consegue escrever aqui; esta checagem é defesa em profundidade.
export async function setStoreStatus(
  storeId: string,
  status: "active" | "suspended",
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
