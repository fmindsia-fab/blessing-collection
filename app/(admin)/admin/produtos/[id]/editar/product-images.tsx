"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ImagePlusIcon, Loader2Icon } from "lucide-react";
import {
  uploadProductImage,
  setCoverImage,
  deleteProductImage,
  updateImageAltText,
  moveProductImage,
  type ImageUploadState,
} from "@/lib/products/image-actions";
import { Button } from "@/components/ui/button";
import { ReorderButtons } from "@/components/admin/reorder-buttons";
import { compressImage } from "@/lib/images/compress-image";

type ProductImagesProps = {
  productId: string;
  images: { id: string; url: string; alt_text: string | null; is_cover: boolean }[];
};

const initialState: ImageUploadState = {};

export function ProductImages({ productId, images }: ProductImagesProps) {
  const uploadAction = uploadProductImage.bind(null, productId);
  const [state, formAction, isUploading] = useActionState(uploadAction, initialState);
  const [isPending, startTransition] = useTransition();
  // A compressão acontece antes do `formAction`, então `isUploading` ainda é
  // falso enquanto ela roda — sem este estado o botão fica mudo nesse intervalo,
  // que é justamente o mais longo no celular.
  const [isCompressing, setIsCompressing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isBusy = isCompressing || isUploading;

  // Limpa o input ao terminar o envio: sem isso o arquivo continua selecionado
  // e escolher a mesma foto de novo não dispara `change`. Só age depois de um
  // envio de verdade — mexer no input na montagem é desnecessário e, em alguns
  // navegadores, atrapalha a abertura do seletor.
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
    setIsCompressing(true);
    let payload = file;
    try {
      payload = await compressImage(file);
    } catch {
      // best-effort — envia o original se a compressão falhar
    }
    setIsCompressing(false);

    const data = new FormData();
    data.set("file", payload);
    startTransition(() => formAction(data));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-medium">Imagens ({images.length}/8)</h2>
        <p className="text-xs text-muted-foreground">
          Marque a imagem principal e descreva cada foto para leitores de tela.
        </p>
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image, index) => (
            <div key={image.id} className="flex flex-col gap-2">
              <div className="relative aspect-square overflow-hidden rounded-[var(--radius)] bg-secondary shadow-sm">
                <Image
                  src={image.url}
                  alt={image.alt_text ?? "Foto do produto"}
                  fill
                  className="object-cover"
                  sizes="150px"
                />
                {image.is_cover ? (
                  <span className="absolute left-2 top-2 rounded-full bg-background/92 px-2.5 py-1 text-[0.625rem] uppercase tracking-wider shadow-sm backdrop-blur-sm">
                    Capa
                  </span>
                ) : null}

                {/* Ordem das fotos na galeria pública (PRD 3.7). */}
                {images.length > 1 ? (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-background/92 p-1 shadow-sm backdrop-blur-sm">
                    <ReorderButtons
                      orientation="horizontal"
                      label={`imagem ${index + 1}`}
                      isFirst={index === 0}
                      isLast={index === images.length - 1}
                      disabled={isPending}
                      onMove={(direction) =>
                        startTransition(() => moveProductImage(productId, image.id, direction))
                      }
                    />
                  </div>
                ) : null}
              </div>

              {/* Salva ao sair do campo: evita um botão por imagem. */}
              <input
                type="text"
                defaultValue={image.alt_text ?? ""}
                placeholder="Descreva a foto…"
                maxLength={200}
                aria-label="Texto alternativo da imagem"
                onBlur={(e) => {
                  if (e.target.value.trim() === (image.alt_text ?? "").trim()) return;
                  startTransition(() => updateImageAltText(productId, image.id, e.target.value));
                }}
                className="w-full rounded-[var(--radius)] border border-input bg-background px-2.5 py-1.5 text-xs outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-[var(--gold)]/40"
              />

              <div className="flex flex-wrap gap-1">
                {!image.is_cover ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    disabled={isPending}
                    onClick={() => startTransition(() => setCoverImage(productId, image.id))}
                  >
                    Definir capa
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  disabled={isPending}
                  onClick={() => startTransition(() => deleteProductImage(productId, image.id, image.url))}
                >
                  Remover
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {images.length < 8 ? (
        <form action={formAction} className="flex flex-col gap-2">
          {/* Input de arquivo nativo, sem CSS escondendo-o e sem nenhuma lógica
              no caminho do clique — nem log, nem setState antes do onChange.
              É o mínimo que o HTML garante: tocar aqui abre a escolha do
              sistema (câmera, galeria ou arquivos), sem exigir nada do site. */}
          <div className="flex flex-col items-center gap-3 rounded-[var(--radius)] border border-dashed border-input px-6 py-6 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-foreground">
              {isBusy ? (
                <Loader2Icon className="size-5 animate-spin" />
              ) : (
                <ImagePlusIcon className="size-5" />
              )}
            </span>
            <span className="text-sm font-medium">
              {isCompressing ? "Preparando foto…" : isUploading ? "Enviando…" : "Escolha uma foto do produto"}
            </span>
            <input
              ref={inputRef}
              id="product-image-input"
              type="file"
              name="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void submitFile(file);
              }}
              aria-label="Adicionar uma foto do produto"
              className="max-w-full text-sm"
            />
            <span className="text-xs text-muted-foreground">
              {images.length}/8 · JPEG, PNG ou WebP, até 10MB
            </span>
          </div>

          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
