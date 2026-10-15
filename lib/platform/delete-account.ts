"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/platform/get-platform-admin";
import { createPlatformServiceClient } from "@/lib/platform/service-role-client";
import { getDeletionBlocker } from "@/lib/platform/deletion-guards";

export type DeleteAccountState = {
  error?: string;
  success?: boolean;
};

// Todos os arquivos de uma loja vivem sob o prefixo `<store_id>/` nestes
// buckets (imagens, logo e pôster de vídeo; vídeos; fontes da marca).
const STORE_BUCKETS = ["product-images", "product-videos", "brand-fonts"] as const;

type ServiceClient = ReturnType<typeof createPlatformServiceClient>;

// A listagem do Storage não é recursiva: itens sem `id` são "pastas".
async function removeFolder(client: ServiceClient, bucket: string, prefix: string): Promise<string | null> {
  const storage = client.storage.from(bucket);

  for (;;) {
    const { data: entries, error } = await storage.list(prefix, { limit: 100 });
    if (error) return error.message;
    if (!entries || entries.length === 0) return null;

    const files: string[] = [];
    for (const entry of entries) {
      const path = `${prefix}/${entry.name}`;
      if (entry.id === null) {
        const nestedError = await removeFolder(client, bucket, path);
        if (nestedError) return nestedError;
      } else {
        files.push(path);
      }
    }

    if (files.length > 0) {
      const { error: removeError } = await storage.remove(files);
      if (removeError) return removeError.message;
    } else {
      // Só havia pastas e já foram esvaziadas; nada mais a listar.
      return null;
    }
  }
}

// EXCLUSÃO DEFINITIVA e irreversível: loja + todos os dados (cascade pelo
// banco) + arquivos do Storage + usuário do Auth. É a única exceção à regra
// "sem exclusão definitiva", restrita ao administrador da plataforma e
// protegida por confirmação digitada do slug.
export async function deleteStoreAndAccount(
  storeId: string,
  confirmSlug: string,
): Promise<DeleteAccountState> {
  if (!(await isPlatformAdmin())) {
    return { error: "Acesso restrito ao administrador da plataforma." };
  }

  const session = await createServerSupabaseClient();
  const {
    data: { user: currentUser },
  } = await session.auth.getUser();

  const client = createPlatformServiceClient();

  const { data: store } = await client
    .from("stores")
    .select("id, slug, owner_user_id, store_subscriptions(status, billing_type, stripe_subscription_id)")
    .eq("id", storeId)
    .maybeSingle();

  if (!store) return { error: "Loja não encontrada." };

  if (confirmSlug.trim() !== store.slug) {
    return { error: "O endereço digitado não confere. Nada foi excluído." };
  }

  const subscription = Array.isArray(store.store_subscriptions)
    ? (store.store_subscriptions[0] ?? null)
    : store.store_subscriptions;

  const { data: ownerProfile } = await client
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", store.owner_user_id)
    .maybeSingle();

  const blocker = getDeletionBlocker({
    ownerIsCurrentUser: currentUser?.id === store.owner_user_id,
    ownerIsPlatformAdmin: ownerProfile?.is_platform_admin ?? false,
    subscription,
  });
  if (blocker) return { error: blocker };

  // 1) Arquivos primeiro: se falhar, o banco ainda está intacto e dá para
  // tentar de novo (o contrário deixaria arquivos órfãos sem dono).
  for (const bucket of STORE_BUCKETS) {
    const storageError = await removeFolder(client, bucket, store.id);
    if (storageError) {
      console.error("[deleteStoreAndAccount] storage", bucket, storageError);
      return { error: `Falha ao apagar arquivos (${bucket}). Nada do banco foi excluído; tente novamente.` };
    }
  }

  // 2) Loja: as FKs com ON DELETE CASCADE levam produtos, pedidos, clientes,
  // categorias, assinatura, analytics etc.
  const { error: storeError } = await client.from("stores").delete().eq("id", store.id);
  if (storeError) {
    console.error("[deleteStoreAndAccount] stores", storeError);
    return { error: "Não foi possível excluir a loja. Os arquivos já foram removidos; tente novamente." };
  }

  // 3) Usuário do Auth (e, em cascata, o profile) — só se não tiver outra loja.
  const { count: otherStores } = await client
    .from("stores")
    .select("id", { count: "exact", head: true })
    .eq("owner_user_id", store.owner_user_id);

  if (!otherStores) {
    const { error: userError } = await client.auth.admin.deleteUser(store.owner_user_id);
    if (userError) {
      console.error("[deleteStoreAndAccount] auth", userError);
      return { error: "Loja excluída, mas não foi possível remover o usuário de login. Remova-o no Supabase Auth." };
    }
  }

  console.info("[deleteStoreAndAccount] excluída", { storeId: store.id, slug: store.slug, by: currentUser?.id });

  revalidatePath("/admin-plataforma");
  return { success: true };
}
