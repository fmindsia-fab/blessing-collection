"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getOwnerStore } from "@/lib/store/get-owner-store";

const BUCKET = "product-videos";
const POSTER_BUCKET = "product-images";

export type VideoUploadState = {
  error?: string;
};

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

/**
 * Grava no banco o vídeo que o navegador já enviou direto ao Supabase Storage.
 *
 * O upload não passa por aqui: Server Actions na Vercel têm o corpo da
 * requisição limitado a 4.5MB pela própria infraestrutura (Serverless
 * Functions), teto que nenhum `bodySizeLimit` do Next consegue elevar — um
 * vídeo de 40MB estourava isso e a página inteira caía com "This page
 * couldn't load" (erro 413). Por isso o upload roda no navegador via
 * `lib/videos/upload-video-client.ts`, autenticado com a sessão da dona; a
 * RLS do bucket (migration 0021) já garante que só ela grava no path da
 * própria loja. Esta action só confirma o resultado e atualiza `products`.
 */
export async function confirmProductVideo(
  productId: string,
  videoUrl: string,
  videoPosterUrl: string | null,
): Promise<VideoUploadState> {
  if (!videoUrl) return { error: "Vídeo não encontrado." };

  const supabase = await createServerSupabaseClient();
  if (!(await assertProductBelongsToStore(supabase, productId))) {
    // O arquivo já subiu ao Storage nesse ponto — sem o vínculo ao produto
    // certo, é órfão. Remove para não deixar lixo pago no bucket.
    await removeVideoFiles(supabase, videoUrl, videoPosterUrl);
    return { error: "Produto não encontrado." };
  }

  const { data: current } = await supabase
    .from("products")
    .select("video_url, video_poster_url")
    .eq("id", productId)
    .single();

  const { error: updateError } = await supabase
    .from("products")
    .update({ video_url: videoUrl, video_poster_url: videoPosterUrl })
    .eq("id", productId);

  if (updateError) {
    await removeVideoFiles(supabase, videoUrl, videoPosterUrl);
    return { error: "Vídeo enviado, mas houve falha ao salvar no banco." };
  }

  // Substitui o vídeo anterior, se houver — um vídeo por peça (pedido do
  // usuário: separado do limite de 8 imagens, não uma lista).
  await removeVideoFiles(supabase, current?.video_url, current?.video_poster_url);

  revalidatePath(`/admin/produtos/${productId}/editar`);
  revalidatePath("/produtos");
  return {};
}

export async function deleteProductVideo(productId: string) {
  const supabase = await createServerSupabaseClient();
  if (!(await assertProductBelongsToStore(supabase, productId))) return;

  const { data: current } = await supabase
    .from("products")
    .select("video_url, video_poster_url")
    .eq("id", productId)
    .single();

  await supabase
    .from("products")
    .update({ video_url: null, video_poster_url: null })
    .eq("id", productId);

  await removeVideoFiles(supabase, current?.video_url, current?.video_poster_url);

  revalidatePath(`/admin/produtos/${productId}/editar`);
  revalidatePath("/produtos");
}

async function removeVideoFiles(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  videoUrl: string | null | undefined,
  posterUrl: string | null | undefined,
) {
  if (videoUrl) {
    const path = videoUrl.split(`/${BUCKET}/`)[1];
    if (path) await supabase.storage.from(BUCKET).remove([path]);
  }
  if (posterUrl) {
    const path = posterUrl.split(`/${POSTER_BUCKET}/`)[1];
    if (path) await supabase.storage.from(POSTER_BUCKET).remove([path]);
  }
}
