"use server";

import { revalidatePath } from "next/cache";
import { isPlatformAdmin } from "@/lib/platform/get-platform-admin";
import { createPlatformServiceClient } from "@/lib/platform/service-role-client";
import { loadOrphanUsers } from "@/lib/platform/orphan-users-server";

export type OrphanActionState = {
  error?: string;
  success?: boolean;
  deleted?: number;
};

// Em ambas as ações o conjunto de órfãos é RECALCULADO no servidor no momento
// de excluir: o que veio da tela não é confiável (a pessoa pode ter criado uma
// loja entretanto), e administrador/dono de loja nunca entram na lista.

export async function deleteOrphanUser(userId: string): Promise<OrphanActionState> {
  if (!(await isPlatformAdmin())) {
    return { error: "Acesso restrito ao administrador da plataforma." };
  }

  const client = createPlatformServiceClient();
  const orphans = await loadOrphanUsers(client, new Date());

  if (!orphans.some((user) => user.id === userId)) {
    return { error: "Esse login tem loja ou é administrador (ou já foi removido). Nada foi excluído." };
  }

  const { error } = await client.auth.admin.deleteUser(userId);
  if (error) {
    console.error("[deleteOrphanUser]", error.message);
    return { error: "Não foi possível excluir o login. Tente novamente." };
  }

  console.info("[deleteOrphanUser] excluído", { userId });
  revalidatePath("/admin-plataforma");
  return { success: true, deleted: 1 };
}

// Limpeza em lote: só logins órfãos há mais de 24 h, para não derrubar quem
// está no meio do cadastro ou aguardando o e-mail de confirmação.
export async function deleteStaleOrphanUsers(): Promise<OrphanActionState> {
  if (!(await isPlatformAdmin())) {
    return { error: "Acesso restrito ao administrador da plataforma." };
  }

  const client = createPlatformServiceClient();
  const stale = (await loadOrphanUsers(client, new Date())).filter((user) => !user.isRecent);

  let deleted = 0;
  for (const user of stale) {
    const { error } = await client.auth.admin.deleteUser(user.id);
    if (error) {
      console.error("[deleteStaleOrphanUsers]", user.id, error.message);
      continue;
    }
    deleted += 1;
  }

  console.info("[deleteStaleOrphanUsers] excluídos", { deleted, total: stale.length });
  revalidatePath("/admin-plataforma");

  if (deleted < stale.length) {
    return { error: `Excluídos ${deleted} de ${stale.length}. Tente novamente para os restantes.`, deleted };
  }
  return { success: true, deleted };
}
