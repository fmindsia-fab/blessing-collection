"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getOwnerStore } from "@/lib/store/get-owner-store";
import { revalidateStorePaths } from "@/lib/store/revalidate-store-paths";

// 10MB — ampliado do limite original de 5MB do PRD 13.1 a pedido do usuário,
// para acomodar fotos de câmera sem recompressão prévia.
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGES_PER_PRODUCT = 8;
const BUCKET = "product-images";

export type ImageUploadState = {
  error?: string;
};

// O productId vem do formulário: confirma que pertence à loja ativa antes de
// gravar no Storage ou no banco. A RLS já bloquearia, mas a checagem explícita
// é a defesa da aplicação (regra do CLAUDE.md).
async function assertProductBelongsToStore(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  productId: string,
) {
  const store = await getOwnerStore();
  const { data } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("store_id", store.id)
    .maybeSingle();

  return data !== null;
}

export async function uploadProductImage(
  productId: string,
  _prevState: ImageUploadState,
  formData: FormData,
): Promise<ImageUploadState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Selecione uma imagem." };

  if (!ALLOWED_TYPES.includes(file.type)) {
    // HEIC/HEIF é o padrão da câmera do iPhone e navegador nenhum exibe:
    // vale orientar em vez de só recusar.
    const isAppleFormat = /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
    return {
      error: isAppleFormat
        ? "Formato HEIC não é exibido pelos navegadores. No iPhone: Ajustes › Câmera › Formatos › Mais Compatível, ou compartilhe a foto como JPEG."
        : "Formato inválido. Use JPEG, PNG ou WebP.",
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { error: "A imagem deve ter no máximo 10MB." };
  }

  const store = await getOwnerStore();
  const supabase = await createServerSupabaseClient();

  if (!(await assertProductBelongsToStore(supabase, productId))) {
    return { error: "Produto não encontrado." };
  }

  const bucket = supabase.storage.from(BUCKET);

  const { count } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  if ((count ?? 0) >= MAX_IMAGES_PER_PRODUCT) {
    return { error: `Este produto já tem o máximo de ${MAX_IMAGES_PER_PRODUCT} imagens.` };
  }

  const extension = file.name.split(".").pop() ?? "jpg";
  const path = `${store.id}/${productId}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await bucket.upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) {
    console.error("[uploadProductImage]", uploadError);
    return { error: "Falha ao enviar a imagem. Tente novamente." };
  }

  const {
    data: { publicUrl },
  } = bucket.getPublicUrl(path);

  const isFirstImage = (count ?? 0) === 0;

  const { error: insertError } = await supabase.from("product_images").insert({
    product_id: productId,
    url: publicUrl,
    is_cover: isFirstImage,
    sort_order: count ?? 0,
  });

  if (insertError) return { error: "Imagem enviada, mas houve falha ao salvar no banco." };

  revalidatePath(`/admin/produtos/${productId}/editar`);
  return {};
}

/**
 * Texto alternativo da imagem (PRD seção 15: "imagens com texto alternativo").
 * Sem ele o catálogo depende do nome do produto como alt, que descreve a peça
 * mas não a foto — leitores de tela anunciam a mesma coisa em todas as fotos.
 */
export async function updateImageAltText(productId: string, imageId: string, altText: string) {
  const supabase = await createServerSupabaseClient();
  if (!(await assertProductBelongsToStore(supabase, productId))) return;

  const trimmed = altText.trim().slice(0, 200);

  await supabase
    .from("product_images")
    .update({ alt_text: trimmed || null })
    .eq("id", imageId)
    .eq("product_id", productId);

  revalidatePath(`/admin/produtos/${productId}/editar`);
}

/**
 * Move uma imagem uma posição para trás ou para frente (PRD 3.7).
 *
 * Botões em vez de arrastar: funciona no toque, é operável por teclado e não
 * exige biblioteca de drag-and-drop. Reescreve o `sort_order` de todas as
 * imagens do produto para manter a sequência 0..n densa — sem isso, exclusões
 * deixariam buracos que quebram a troca por índice.
 */
export async function moveProductImage(productId: string, imageId: string, direction: "up" | "down") {
  const store = await getOwnerStore();
  const supabase = await createServerSupabaseClient();
  if (!(await assertProductBelongsToStore(supabase, productId))) return;

  const { data: images } = await supabase
    .from("product_images")
    .select("id, sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });

  if (!images || images.length < 2) return;

  const index = images.findIndex((img) => img.id === imageId);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || target < 0 || target >= images.length) return;

  const reordered = [...images];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

  await Promise.all(
    reordered.map((img, position) =>
      supabase
        .from("product_images")
        .update({ sort_order: position })
        .eq("id", img.id)
        .eq("product_id", productId),
    ),
  );

  revalidatePath(`/admin/produtos/${productId}/editar`);
  revalidateStorePaths(store.slug);
}

export async function setCoverImage(productId: string, imageId: string) {
  const supabase = await createServerSupabaseClient();
  if (!(await assertProductBelongsToStore(supabase, productId))) return;

  await supabase.from("product_images").update({ is_cover: false }).eq("product_id", productId);
  await supabase.from("product_images").update({ is_cover: true }).eq("id", imageId).eq("product_id", productId);

  revalidatePath(`/admin/produtos/${productId}/editar`);
}

// Exceção consciente ao "sem exclusão definitiva": a imagem é um arquivo no
// Storage, não um registro de negócio com histórico. Manter linhas órfãs
// apontando para arquivos removidos só quebraria a galeria.
export async function deleteProductImage(productId: string, imageId: string, url: string) {
  const supabase = await createServerSupabaseClient();
  if (!(await assertProductBelongsToStore(supabase, productId))) return;

  const bucket = supabase.storage.from(BUCKET);

  const path = url.split(`/${BUCKET}/`)[1];
  if (path) {
    await bucket.remove([path]);
  }

  await supabase.from("product_images").delete().eq("id", imageId).eq("product_id", productId);

  revalidatePath(`/admin/produtos/${productId}/editar`);
}
