"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
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

type ProductImagesProps = {
  productId: string;
  images: { id: string; url: string; alt_text: string | null; is_cover: boolean }[];
};

const initialState: ImageUploadState = {};

export function ProductImages({ productId, images }: ProductImagesProps) {
  const uploadAction = uploadProductImage.bind(null, productId);
  const [state, formAction, isUploading] = useActionState(uploadAction, initialState);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Limpa o input ao terminar o envio: sem isso o arquivo continua selecionado
  // e escolher a mesma foto de novo não dispara `change`.
  useEffect(() => {
    if (!isUploading && inputRef.current) inputRef.current.value = "";
  }, [isUploading]);

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
        <form ref={formRef} action={formAction} className="relative flex flex-col gap-2">
          {/* O input fica fora de tela em vez de `sr-only` (width:1px +
              clip-path), que impede o Safari iOS de abrir o seletor, e é
              acionado por `.click()` a partir de um <button> real.

              Sem `required`: num input invisível o navegador tentaria exibir
              "Preencha este campo" apontando para um elemento que não existe
              na tela. O servidor já recusa envio sem arquivo. */}
          <input
            ref={inputRef}
            type="file"
            name="file"
            // `image/*` em vez da lista de MIMEs: alguns Androids escondem a
            // câmera e filtram demais a galeria quando o accept é restrito.
            // O servidor rejeita formato inválido de qualquer forma.
            accept="image/*"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              if (e.target.files?.length) formRef.current?.requestSubmit();
            }}
            className="absolute left-[-9999px] size-px opacity-0"
          />
          <button
            type="button"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            className="flex min-h-32 w-full flex-col items-center justify-center gap-2 rounded-[var(--radius)] border border-dashed border-input px-6 py-8 text-center outline-none transition-colors hover:border-foreground/40 hover:bg-secondary/50 focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-[var(--gold)]/40 disabled:opacity-60"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-foreground">
              {isUploading ? (
                <Loader2Icon className="size-5 animate-spin" />
              ) : (
                <ImagePlusIcon className="size-5" />
              )}
            </span>
            <span className="text-sm font-medium">
              {isUploading ? "Enviando…" : "Toque para adicionar uma foto"}
            </span>
            <span className="text-xs text-muted-foreground">
              {images.length}/8 · JPEG, PNG ou WebP, até 10MB
            </span>
          </button>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
