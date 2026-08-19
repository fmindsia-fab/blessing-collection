import { createBrowserSupabaseClient } from "@/lib/supabase/client";

// Vídeo pesa mais que foto — 60s em boa qualidade facilmente passa de 20MB, o
// que estouraria o corpo de uma Server Action na Vercel (limite de 4.5MB da
// infraestrutura). Por isso o envio é feito direto daqui, do navegador, para
// o Supabase Storage — a RLS do bucket product-videos (migration 0021) exige
// sessão autenticada da dona da loja, então não há upload não autorizado
// mesmo sem passar pelo servidor Next.
const MAX_FILE_SIZE = 40 * 1024 * 1024;
const ALLOWED_TYPES = ["video/mp4", "video/webm"];
const MAX_DURATION_SECONDS = 65; // folga sobre o limite de 60s pedido pelo usuário
const BUCKET = "product-videos";
const POSTER_BUCKET = "product-images";

export type UploadVideoResult =
  | { ok: true; videoUrl: string; posterUrl: string | null }
  | { ok: false; error: string };

export async function uploadVideoDirect({
  file,
  storeId,
  productId,
  durationSeconds,
  poster,
}: {
  file: File;
  storeId: string;
  productId: string;
  durationSeconds: number;
  poster: File | null;
}): Promise<UploadVideoResult> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, error: "Formato inválido. Use MP4 ou WebM." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, error: "O vídeo deve ter no máximo 40MB." };
  }
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return { ok: false, error: "Não foi possível ler a duração do vídeo." };
  }
  if (durationSeconds > MAX_DURATION_SECONDS) {
    return { ok: false, error: "O vídeo deve ter até 1 minuto." };
  }

  const supabase = createBrowserSupabaseClient();
  const extension = file.type === "video/webm" ? "webm" : "mp4";
  const videoPath = `${storeId}/${productId}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(videoPath, file, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) {
    return { ok: false, error: "Falha ao enviar o vídeo. Tente novamente." };
  }

  const { data: videoData } = supabase.storage.from(BUCKET).getPublicUrl(videoPath);

  // O poster é opcional: se falhar, o vídeo é salvo sem miniatura e a galeria
  // cai para o próprio elemento <video> como preview.
  let posterUrl: string | null = null;
  if (poster) {
    const posterPath = `${storeId}/${productId}/${crypto.randomUUID()}-video-poster.jpg`;
    const { error: posterError } = await supabase.storage.from(POSTER_BUCKET).upload(posterPath, poster, {
      contentType: "image/jpeg",
      upsert: false,
    });

    if (!posterError) {
      posterUrl = supabase.storage.from(POSTER_BUCKET).getPublicUrl(posterPath).data.publicUrl;
    }
  }

  return { ok: true, videoUrl: videoData.publicUrl, posterUrl };
}
