"use client";

import Image from "next/image";
import { useState } from "react";
import { ExpandIcon, PlayIcon } from "lucide-react";
import { MediaLightbox, type LightboxItem } from "./media-lightbox";

type GalleryImage = {
  id: string;
  url: string;
  alt_text: string | null;
};

type GalleryVideo = {
  url: string;
  posterUrl: string | null;
};

/**
 * Galeria da peça: clicar numa miniatura troca a mídia principal; clicar na
 * mídia principal abre em tela cheia, com navegação por setas e Esc.
 *
 * O vídeo (pedido do usuário) entra como o último item, junto das fotos —
 * mesma miniatura, mesmo lightbox, sem seção separada. Nunca é a mídia
 * inicial: a capa (primeira foto) segue sendo o que abre a página e alimenta
 * o preview de link (Open Graph).
 */
export function ProductGallery({
  images,
  video,
  productName,
}: {
  images: GalleryImage[];
  video?: GalleryVideo | null;
  productName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const items: LightboxItem[] = [
    ...images.map((image, index) => ({
      id: image.id,
      type: "image" as const,
      url: image.url,
      alt: image.alt_text ?? `${productName} — foto ${index + 1}`,
    })),
    ...(video
      ? [{ id: "video", type: "video" as const, url: video.url, alt: `Vídeo de ${productName}` }]
      : []),
  ];

  const active = items[activeIndex] ?? items[0];

  if (!active) return null;

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={active.type === "video" ? `Ver vídeo de ${productName}` : `Ampliar foto de ${productName}`}
        className="group relative aspect-[4/5] w-full cursor-zoom-in overflow-hidden rounded-[var(--radius-image)] bg-secondary shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-4 focus-visible:ring-offset-background"
      >
        <Image
          src={active.type === "video" ? video?.posterUrl || images[0]?.url || "" : active.url}
          alt={active.alt}
          fill
          priority
          className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          sizes="(min-width: 1024px) 55vw, 100vw"
        />
        <span className="absolute bottom-3 right-3 flex size-9 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 shadow-sm backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
          {active.type === "video" ? <PlayIcon className="size-4" /> : <ExpandIcon className="size-4" />}
        </span>
      </button>

      {items.length > 1 ? (
        <div className="grid grid-cols-4 gap-3">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={
                item.type === "video" ? `Ver vídeo de ${productName}` : `Ver foto ${index + 1} de ${productName}`
              }
              aria-current={index === activeIndex}
              className={`relative aspect-square overflow-hidden rounded-[var(--radius)] bg-secondary outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[var(--gold)] ${
                index === activeIndex
                  ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={item.type === "video" ? video?.posterUrl || images[0]?.url || "" : item.url}
                alt={item.alt}
                fill
                className="object-cover"
                sizes="14vw"
              />
              {item.type === "video" ? (
                <span className="absolute inset-0 flex items-center justify-center bg-foreground/20">
                  <PlayIcon className="size-4 text-background" />
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      {isOpen ? (
        <MediaLightbox
          items={items}
          activeIndex={activeIndex}
          onIndexChange={setActiveIndex}
          onClose={() => setIsOpen(false)}
          label={`Fotos e vídeo de ${productName}`}
        />
      ) : null}
    </div>
  );
}
