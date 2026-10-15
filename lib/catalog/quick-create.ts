"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveStore } from "@/lib/store/get-active-store";
import { slugify } from "@/lib/utils";
import { getNotOwnerError } from "@/lib/store/ownership";

// Criação rápida (só pelo nome) de categoria, coleção ou modelo a partir do
// formulário de produto, para a pessoa não precisar sair do cadastro. As
// telas próprias de cada cadastro continuam sendo o lugar para editar
// descrição e demais detalhes.

export type QuickCreateKind = "category" | "collection" | "model";

export type QuickCreateResult =
  | { ok: true; item: { id: string; name: string } }
  | { ok: false; error: string };

const TABLE = {
  category: { table: "categories", noun: "categoria", article: "a", path: "/admin/categorias" },
  collection: { table: "collections", noun: "coleção", article: "a", path: "/admin/colecoes" },
  model: { table: "models", noun: "modelo", article: "o", path: "/admin/modelos" },
} as const;

const nameSchema = z.string().trim().min(2, "Informe o nome (mínimo 2 letras)").max(80, "Use no máximo 80 caracteres");

export async function quickCreateCatalogItem(kind: QuickCreateKind, rawName: string): Promise<QuickCreateResult> {
  const config = TABLE[kind];
  if (!config) return { ok: false, error: "Tipo inválido." };

  const parsed = nameSchema.safeParse(rawName);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const slug = slugify(parsed.data);
  if (!slug) return { ok: false, error: "Use letras ou números no nome." };

  // A loja vem do servidor (nunca do client) e toda query filtra por store_id.
  const store = await getActiveStore();
  const notOwnerError = await getNotOwnerError(store);
  if (notOwnerError) return { ok: false, error: notOwnerError };
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from(config.table)
    .insert({ store_id: store.id, name: parsed.data, slug })
    .select("id, name")
    .single();

  if (error) {
    // 23505 = unique(store_id, slug): já existe um item com esse nome.
    if (error.code === "23505") {
      return { ok: false, error: `Já existe um${config.article === "a" ? "a" : ""} ${config.noun} com esse nome.` };
    }
    return { ok: false, error: `Não foi possível criar ${config.article} ${config.noun}.` };
  }

  revalidatePath(config.path);
  revalidatePath("/produtos");
  return { ok: true, item: { id: data.id, name: data.name } };
}
