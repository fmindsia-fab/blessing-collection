"use client";

import Image from "next/image";
import { useState } from "react";
import { ExpandIcon } from "lucide-react";
import { MediaLightbox } from "./media-lightbox";

type GalleryImage = {
  id: string;
  url: string;
  alt_text: string | null;
};

/**
 * Galeria da peça: clicar numa miniatura troca a foto principal; clicar na
 * foto principal abre em tela cheia, com navegação por setas e Esc.
 *
 * Antes as miniaturas eram estáticas — a cliente via a foto pequena e não
 * tinha como ampliar, o que pesa num catálogo onde a foto é o produto.
 */
export function ProductGallery({ images, productName }: { images: GalleryImage[]; productName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const active = images[activeIndex] ?? images[0];

  if (!active) return null;

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={`Ampliar foto de ${productName}`}
        className="group relative aspect-[4/5] w-full cursor-zoom-in overflow-hidden rounded-[var(--radius-image)] bg-secondary shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-4 focus-visible:ring-offset-background"
      >
        <Image
          src={active.url}
          alt={active.alt_text ?? productName}
          fill
          priority
          className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          sizes="(min-width: 1024px) 55vw, 100vw"
        />
        <span className="absolute bottom-3 right-3 flex size-9 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 shadow-sm backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
          <ExpandIcon className="size-4" />
        </span>
      </button>

      {images.length > 1 ? (
        <div className="grid grid-cols-4 gap-3">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Ver foto ${index + 1} de ${images.length}`}
              aria-current={index === activeIndex}
              className={`relative aspect-square overflow-hidden rounded-[var(--radius)] bg-secondary outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[var(--gold)] ${
                index === activeIndex
                  ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={image.url}
                alt={image.alt_text ?? `${productName} — foto ${index + 1}`}
                fill
                className="object-cover"
                sizes="14vw"
              />
            </button>
          ))}
        </div>
      ) : null}

      {isOpen ? (
        <MediaLightbox
          items={images.map((image, index) => ({
            id: image.id,
            url: image.url,
            alt: image.alt_text ?? `${productName} — foto ${index + 1}`,
          }))}
          activeIndex={activeIndex}
          onIndexChange={setActiveIndex}
          onClose={() => setIsOpen(false)}
          label={`Fotos de ${productName}`}
        />
      ) : null}
    </div>
  );
}
