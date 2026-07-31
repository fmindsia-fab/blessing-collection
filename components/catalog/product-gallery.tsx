"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useState } from "react";
import { XIcon, ChevronLeftIcon, ChevronRightIcon, ExpandIcon } from "lucide-react";

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

  const go = useCallback(
    (delta: number) => {
      setActiveIndex((current) => (current + delta + images.length) % images.length);
    },
    [images.length],
  );

  // Teclado no lightbox: Esc fecha, setas navegam.
  useEffect(() => {
    if (!isOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    };

    window.addEventListener("keydown", onKey);
    // Trava o scroll do fundo enquanto o lightbox está aberto.
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, go]);

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

      {/* Portal no body: a coluna da galeria fica dentro de um container com
          `position: sticky`, que cria contexto de posicionamento e prenderia o
          `fixed` do overlay à própria coluna em vez de cobrir a tela. */}
      {isOpen && typeof document !== "undefined"
        ? createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Fotos de ${productName}`}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/92 p-4 backdrop-blur-sm sm:p-10"
        >
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Fechar"
            className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-full bg-background/15 text-background outline-none transition-colors hover:bg-background/25 focus-visible:ring-2 focus-visible:ring-background sm:right-8 sm:top-8"
          >
            <XIcon className="size-5" />
          </button>

          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                aria-label="Foto anterior"
                className="absolute left-3 flex size-11 items-center justify-center rounded-full bg-background/15 text-background outline-none transition-colors hover:bg-background/25 focus-visible:ring-2 focus-visible:ring-background sm:left-8"
              >
                <ChevronLeftIcon className="size-5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                aria-label="Próxima foto"
                className="absolute right-3 flex size-11 items-center justify-center rounded-full bg-background/15 text-background outline-none transition-colors hover:bg-background/25 focus-visible:ring-2 focus-visible:ring-background sm:right-8"
              >
                <ChevronRightIcon className="size-5" />
              </button>
            </>
          ) : null}

          {/* stopPropagation: clicar na própria foto não fecha o lightbox. */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative h-full max-h-[85vh] w-full max-w-4xl"
          >
            <Image
              src={active.url}
              alt={active.alt_text ?? productName}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>

          {images.length > 1 ? (
            <span className="absolute bottom-6 text-[0.6875rem] uppercase tracking-[0.16em] text-background/80">
              {activeIndex + 1} / {images.length}
            </span>
          ) : null}
        </div>,
        document.body,
      )
        : null}
    </div>
  );
}
