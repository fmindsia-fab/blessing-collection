"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveStore } from "@/lib/store/get-active-store";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB, conforme PRD seção 13.1
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGES_PER_PRODUCT = 8;
const BUCKET = "product-images";

export type ImageUploadState = {
  error?: string;
};

export async function uploadProductImage(
  productId: string,
  _prevState: ImageUploadState,
  formData: FormData,
): Promise<ImageUploadState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Selecione uma imagem." };

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Formato inválido. Use JPEG, PNG ou WebP." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { error: "A imagem deve ter no máximo 5MB." };
  }

  const store = await getActiveStore();
  const supabase = await createServerSupabaseClient();
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

export async function setCoverImage(productId: string, imageId: string) {
  const supabase = await createServerSupabaseClient();

  await supabase.from("product_images").update({ is_cover: false }).eq("product_id", productId);
  await supabase.from("product_images").update({ is_cover: true }).eq("id", imageId);

  revalidatePath(`/admin/produtos/${productId}/editar`);
}

export async function deleteProductImage(productId: string, imageId: string, url: string) {
  const supabase = await createServerSupabaseClient();
  const bucket = supabase.storage.from(BUCKET);

  const path = url.split(`/${BUCKET}/`)[1];
  if (path) {
    await bucket.remove([path]);
  }

  await supabase.from("product_images").delete().eq("id", imageId);

  revalidatePath(`/admin/produtos/${productId}/editar`);
}
