"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Loader2Icon, VideoIcon } from "lucide-react";
import { uploadProductVideo, deleteProductVideo, type VideoUploadState } from "@/lib/products/video-actions";
import { Button } from "@/components/ui/button";
import { readVideoMetadata } from "@/lib/videos/read-video-metadata";

type ProductVideoProps = {
  productId: string;
  videoUrl: string | null;
  videoPosterUrl: string | null;
};

const initialState: VideoUploadState = {};

/**
 * Vídeo curto da peça (pedido do usuário) — um vídeo opcional, separado do
 * limite de 8 imagens (PRD 3.7). Duração validada no navegador antes do
 * envio: o servidor não tem como inspecionar duração de vídeo sem uma
 * extensão de processamento de mídia.
 */
export function ProductVideo({ productId, videoUrl, videoPosterUrl }: ProductVideoProps) {
  const uploadAction = uploadProductVideo.bind(null, productId);
  const [state, formAction, isUploading] = useActionState(uploadAction, initialState);
  const [isPending, startTransition] = useTransition();
  const [isPreparing, setIsPreparing] = useState(false);
  const [prepareError, setPrepareError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isBusy = isPreparing || isUploading;

  const wasUploading = useRef(false);
  useEffect(() => {
    if (isUploading) {
      wasUploading.current = true;
      return;
    }
    if (wasUploading.current && inputRef.current) {
      inputRef.current.value = "";
      wasUploading.current = false;
    }
  }, [isUploading]);

  async function submitFile(file: File) {
    setPrepareError(null);
    setIsPreparing(true);

    let metadata;
    try {
      metadata = await readVideoMetadata(file);
    } catch {
      setIsPreparing(false);
      setPrepareError("Não foi possível ler este vídeo. Tente outro arquivo.");
      return;
    }
    setIsPreparing(false);

    if (metadata.durationSeconds > 60) {
      setPrepareError(
        `Este vídeo tem ${Math.ceil(metadata.durationSeconds)}s — o limite é 1 minuto. Corte o vídeo e tente de novo.`,
      );
      return;
    }

    const data = new FormData();
    data.set("file", file);
    data.set("duration", String(metadata.durationSeconds));
    if (metadata.poster) data.set("poster", metadata.poster);

    startTransition(() => formAction(data));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-medium">Vídeo</h2>
        <p className="text-xs text-muted-foreground">
          Um vídeo curto opcional, separado das fotos — até 1 minuto.
        </p>
      </div>

      {videoUrl ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <video
            src={videoUrl}
            poster={videoPosterUrl ?? undefined}
            controls
            playsInline
            className="aspect-[4/5] w-full max-w-56 rounded-[var(--radius)] bg-secondary object-cover shadow-sm"
          />
          <Button
            type="button"
            variant="outline"
            size="xs"
            disabled={isPending}
            onClick={() => startTransition(() => deleteProductVideo(productId))}
          >
            Remover vídeo
          </Button>
        </div>
      ) : (
        <label
          htmlFor="product-video-input"
          className="flex cursor-pointer flex-col items-center gap-3 rounded-[var(--radius)] border border-dashed border-input px-6 py-6 text-center transition-colors hover:border-foreground/40 hover:bg-secondary/50"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-foreground">
            {isBusy ? <Loader2Icon className="size-5 animate-spin" /> : <VideoIcon className="size-5" />}
          </span>
          <span className="text-sm font-medium">
            {isPreparing ? "Lendo vídeo…" : isUploading ? "Enviando…" : "Toque para adicionar um vídeo"}
          </span>
          {/* Input visível (não escondido por CSS/opacity/size-0): esconder um
              input de arquivo assim quebra o seletor no Chrome Android — ver
              histórico de app/(admin)/admin/produtos/[id]/editar/product-images.tsx. */}
          <input
            ref={inputRef}
            id="product-video-input"
            type="file"
            name="file"
            accept="video/mp4,video/webm"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void submitFile(file);
            }}
            className="max-w-full text-sm"
          />
          <span className="text-xs text-muted-foreground">MP4 ou WebM, até 1 min e 40MB</span>
        </label>
      )}

      {prepareError ? <p className="text-sm text-destructive">{prepareError}</p> : null}
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
    </div>
  );
}
