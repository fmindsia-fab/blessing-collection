"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, VideoIcon } from "lucide-react";
import { confirmProductVideo, deleteProductVideo } from "@/lib/products/video-actions";
import { Button } from "@/components/ui/button";
import { readVideoMetadata } from "@/lib/videos/read-video-metadata";
import { uploadVideoDirect } from "@/lib/videos/upload-video-client";

type ProductVideoProps = {
  productId: string;
  storeId: string;
  videoUrl: string | null;
  videoPosterUrl: string | null;
};

type Step = "idle" | "reading" | "uploading" | "saving";

/**
 * Vídeo curto da peça (pedido do usuário) — um vídeo opcional, separado do
 * limite de 8 imagens (PRD 3.7). Duração validada no navegador antes do
 * envio, e o arquivo sobe direto ao Supabase Storage a partir daqui: uma
 * Server Action não aguenta o corpo de um vídeo (limite de 4.5MB da Vercel),
 * então o servidor só entra depois, para confirmar a URL e gravar no banco.
 */
export function ProductVideo({ productId, storeId, videoUrl, videoPosterUrl }: ProductVideoProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const isBusy = step !== "idle";

  useEffect(() => {
    if (step === "idle" && inputRef.current) inputRef.current.value = "";
  }, [step]);

  async function submitFile(file: File) {
    setError(null);
    setStep("reading");

    let metadata;
    try {
      metadata = await readVideoMetadata(file);
    } catch {
      setStep("idle");
      setError("Não foi possível ler este vídeo. Tente outro arquivo.");
      return;
    }

    if (metadata.durationSeconds > 60) {
      setStep("idle");
      setError(
        `Este vídeo tem ${Math.ceil(metadata.durationSeconds)}s — o limite é 1 minuto. Corte o vídeo e tente de novo.`,
      );
      return;
    }

    setStep("uploading");
    const uploaded = await uploadVideoDirect({
      file,
      storeId,
      productId,
      durationSeconds: metadata.durationSeconds,
      poster: metadata.poster,
    });

    if (!uploaded.ok) {
      setStep("idle");
      setError(uploaded.error);
      return;
    }

    setStep("saving");
    const result = await confirmProductVideo(productId, uploaded.videoUrl, uploaded.posterUrl);
    setStep("idle");

    if (result.error) {
      setError(result.error);
      return;
    }

    // `revalidatePath` na Server Action invalida o cache no servidor, mas a
    // árvore já renderizada no cliente só busca a página de novo com um
    // refresh explícito do router.
    router.refresh();
  }

  const statusLabel =
    step === "reading"
      ? "Lendo vídeo…"
      : step === "uploading"
        ? "Enviando…"
        : step === "saving"
          ? "Salvando…"
          : "Toque para adicionar um vídeo";

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
          <span className="text-sm font-medium">{statusLabel}</span>
          {/* Input visível (não escondido por CSS/opacity/size-0): esconder um
              input de arquivo assim quebra o seletor no Chrome Android — ver
              histórico de app/(admin)/admin/produtos/[id]/editar/product-images.tsx. */}
          <input
            ref={inputRef}
            id="product-video-input"
            type="file"
            name="file"
            accept="video/mp4,video/webm"
            disabled={isBusy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void submitFile(file);
            }}
            className="max-w-full text-sm"
          />
          <span className="text-xs text-muted-foreground">MP4 ou WebM, até 1 min e 40MB</span>
        </label>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
