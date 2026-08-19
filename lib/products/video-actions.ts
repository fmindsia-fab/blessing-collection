"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveStore } from "@/lib/store/get-active-store";

// Vídeo pesa mais que foto — 60s em boa qualidade facilmente passa de 20MB.
// Acima do bodySizeLimit das Server Actions (next.config.ts) precisa ficar
// alinhado aqui, senão o Next aborta a requisição sem erro nenhum na tela
// (mesmo problema já visto com upload de imagem).
const MAX_FILE_SIZE = 40 * 1024 * 1024;
const ALLOWED_TYPES = ["video/mp4", "video/webm"];
// Rede de segurança: a duração de fato é validada no navegador antes do
// envio (lê `<video>.duration`), porque inspecionar o arquivo no Postgres
// exigiria uma extensão de processamento de mídia. Um pouco de folga sobre os
// 60s pedidos cobre pequena imprecisão de metadata sem abrir brecha real.
const MAX_DURATION_SECONDS = 65;
const BUCKET = "product-videos";
const POSTER_BUCKET = "product-images";

export type VideoUploadState = {
  error?: string;
};

async function assertProductBelongsToStore(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  productId: string,
) {
  const store = await getActiveStore();
  const { data } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("store_id", store.id)
    .maybeSingle();

  return data !== null;
}

export async function uploadProductVideo(
  productId: string,
  _prevState: VideoUploadState,
  formData: FormData,
): Promise<VideoUploadState> {
  const file = formData.get("file");
  const poster = formData.get("poster");
  const durationRaw = formData.get("duration");

  if (!(file instanceof File) || file.size === 0) return { error: "Selecione um vídeo." };
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Formato inválido. Use MP4 ou WebM." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { error: "O vídeo deve ter no máximo 40MB." };
  }

  const duration = Number(durationRaw);
  if (!Number.isFinite(duration) || duration <= 0) {
    return { error: "Não foi possível ler a duração do vídeo." };
  }
  if (duration > MAX_DURATION_SECONDS) {
    return { error: "O vídeo deve ter até 1 minuto." };
  }

  const store = await getActiveStore();
  const supabase = await createServerSupabaseClient();

  if (!(await assertProductBelongsToStore(supabase, productId))) {
    return { error: "Produto não encontrado." };
  }

  const videoBucket = supabase.storage.from(BUCKET);
  const extension = file.type === "video/webm" ? "webm" : "mp4";
  const videoPath = `${store.id}/${productId}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await videoBucket.upload(videoPath, file, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) {
    console.error("[uploadProductVideo]", uploadError);
    return { error: "Falha ao enviar o vídeo. Tente novamente." };
  }

  const {
    data: { publicUrl: videoUrl },
  } = videoBucket.getPublicUrl(videoPath);

  // O poster é opcional: se o navegador não conseguir capturar o frame (ou o
  // usuário estiver num navegador sem suporte), o vídeo é salvo sem miniatura
  // e a galeria cai para o próprio elemento <video> como preview.
  let posterUrl: string | null = null;
  if (poster instanceof File && poster.size > 0) {
    const posterBucket = supabase.storage.from(POSTER_BUCKET);
    const posterPath = `${store.id}/${productId}/${crypto.randomUUID()}-video-poster.jpg`;

    const { error: posterError } = await posterBucket.upload(posterPath, poster, {
      contentType: "image/jpeg",
      upsert: false,
    });

    if (!posterError) {
      posterUrl = posterBucket.getPublicUrl(posterPath).data.publicUrl;
    }
  }

  // Substitui o vídeo anterior, se houver — um vídeo por peça (pedido do
  // usuário: separado do limite de 8 imagens, não uma lista).
  const { data: current } = await supabase
    .from("products")
    .select("video_url, video_poster_url")
    .eq("id", productId)
    .single();

  const { error: updateError } = await supabase
    .from("products")
    .update({ video_url: videoUrl, video_poster_url: posterUrl })
    .eq("id", productId);

  if (updateError) {
    await videoBucket.remove([videoPath]);
    if (posterUrl) {
      const posterPath = posterUrl.split(`/${POSTER_BUCKET}/`)[1];
      if (posterPath) await supabase.storage.from(POSTER_BUCKET).remove([posterPath]);
    }
    return { error: "Vídeo enviado, mas houve falha ao salvar no banco." };
  }

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
