/**
 * Lê a duração do vídeo e captura um frame como poster (thumbnail), tudo no
 * navegador — o servidor não tem como inspecionar duração de vídeo sem uma
 * extensão de processamento de mídia, então a validação de "até 1 minuto"
 * acontece aqui antes do envio.
 */

export type VideoMetadata = {
  durationSeconds: number;
  /** JPEG do frame em ~1s (ou o mais próximo do início) — null se falhar. */
  poster: File | null;
};

export async function readVideoMetadata(file: File): Promise<VideoMetadata> {
  const url = URL.createObjectURL(file);

  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.src = url;

    const durationSeconds = await new Promise<number>((resolve, reject) => {
      video.onloadedmetadata = () => resolve(video.duration);
      video.onerror = () => reject(new Error("Não foi possível ler o vídeo."));
    });

    const poster = await capturePoster(video).catch(() => null);

    return { durationSeconds, poster };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function capturePoster(video: HTMLVideoElement): Promise<File | null> {
  // Busca um frame perto do início, não o frame 0: muitos vídeos abrem com
  // uma transição em preto, e o quadro em ~1s costuma já mostrar o produto.
  const seekTo = Math.min(1, video.duration / 2);

  await new Promise<void>((resolve, reject) => {
    video.onseeked = () => resolve();
    video.onerror = () => reject(new Error("Falha ao buscar frame do vídeo."));
    video.currentTime = seekTo;
  });

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  if (canvas.width === 0 || canvas.height === 0) return null;

  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  if (!blob) return null;

  return new File([blob], "video-poster.jpg", { type: "image/jpeg" });
}
