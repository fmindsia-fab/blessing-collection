"use client";

import { useActionState, useTransition } from "react";
import Image from "next/image";
import { uploadProductImage, setCoverImage, deleteProductImage, type ImageUploadState } from "@/lib/products/image-actions";
import { Button } from "@/components/ui/button";

type ProductImagesProps = {
  productId: string;
  images: { id: string; url: string; alt_text: string | null; is_cover: boolean }[];
};

const initialState: ImageUploadState = {};

export function ProductImages({ productId, images }: ProductImagesProps) {
  const uploadAction = uploadProductImage.bind(null, productId);
  const [state, formAction, isUploading] = useActionState(uploadAction, initialState);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-medium">Imagens ({images.length}/8)</h2>
        <p className="text-xs text-zinc-500">JPEG, PNG ou WebP, até 5MB. Marque a imagem principal do produto.</p>
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-4 gap-3">
          {images.map((image) => (
            <div key={image.id} className="flex flex-col gap-2">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100">
                <Image src={image.url} alt={image.alt_text ?? ""} fill className="object-cover" sizes="150px" />
                {image.is_cover ? (
                  <span className="absolute left-1 top-1 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium">
                    Capa
                  </span>
                ) : null}
              </div>
              <div className="flex gap-1">
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
          <input
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp"
            required
            className="text-sm"
          />
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" variant="outline" size="sm" disabled={isUploading} className="w-fit">
            {isUploading ? "Enviando..." : "Enviar imagem"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
