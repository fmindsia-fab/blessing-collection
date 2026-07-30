"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveStore } from "@/lib/store/get-active-store";
import type { Database } from "@/types/database.types";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB, conforme PRD seção 13.1
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGES_PER_PRODUCT = 8;

export type ImageUploadState = {
  error?: string;
};

// O client de @supabase/ssr monta `storage` com os headers fixados no
// momento da construção (this.headers no SupabaseClient), sem nunca
// reavaliar a sessão — diferente de .from() (PostgREST), que resolve o
// token a cada request via accessToken(). Isso faz todo storage.upload()
// rodar como anon e ser rejeitado pela RLS de storage.objects (403),
// mesmo com uma sessão válida nos cookies. A correção suportada é criar
// um client dedicado já nascendo com o Authorization do usuário.
async function getAuthenticatedStorage(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const authedClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );

  return authedClient.storage.from("product-images");
}

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
  const bucket = await getAuthenticatedStorage(supabase);

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
  const bucket = await getAuthenticatedStorage(supabase);

  const path = url.split("/product-images/")[1];
  if (path) {
    await bucket.remove([path]);
  }

  await supabase.from("product_images").delete().eq("id", imageId);

  revalidatePath(`/admin/produtos/${productId}/editar`);
}
