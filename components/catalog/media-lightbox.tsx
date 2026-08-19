"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { useCallback, useEffect } from "react";
import { XIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

export type LightboxItem = {
  id: string;
  url: string;
  alt: string;
  /** Padrão "image" — mantém quem só usa foto (admin) sem precisar do campo. */
  type?: "image" | "video";
};

/**
 * Visualizador em tela cheia com navegação por setas/teclado — extraído de
 * `ProductGallery` para ser reutilizado no admin (PRD: ampliar foto ao clicar,
 * igual à visualização do cliente).
 */
export function MediaLightbox({
  items,
  activeIndex,
  onIndexChange,
  onClose,
  label,
}: {
  items: LightboxItem[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  label: string;
}) {
  const active = items[activeIndex];

  const go = useCallback(
    (delta: number) => {
      onIndexChange((activeIndex + delta + items.length) % items.length);
    },
    [activeIndex, items.length, onIndexChange],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
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
  }, [onClose, go]);

  if (!active || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/92 p-4 backdrop-blur-sm sm:p-10"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-full bg-background/15 text-background outline-none transition-colors hover:bg-background/25 focus-visible:ring-2 focus-visible:ring-background sm:right-8 sm:top-8"
      >
        <XIcon className="size-5" />
      </button>

      {items.length > 1 ? (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            aria-label="Anterior"
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
            aria-label="Próximo"
            className="absolute right-3 flex size-11 items-center justify-center rounded-full bg-background/15 text-background outline-none transition-colors hover:bg-background/25 focus-visible:ring-2 focus-visible:ring-background sm:right-8"
          >
            <ChevronRightIcon className="size-5" />
          </button>
        </>
      ) : null}

      {/* stopPropagation: clicar na própria mídia não fecha o lightbox. */}
      <div onClick={(e) => e.stopPropagation()} className="relative h-full max-h-[85vh] w-full max-w-4xl">
        {active.type === "video" ? (
          <video
            src={active.url}
            controls
            autoPlay
            playsInline
            className="size-full object-contain"
          />
        ) : (
          <Image src={active.url} alt={active.alt} fill className="object-contain" sizes="90vw" />
        )}
      </div>

      {items.length > 1 ? (
        <span className="absolute bottom-6 text-[0.6875rem] uppercase tracking-[0.16em] text-background/80">
          {activeIndex + 1} / {items.length}
        </span>
      ) : null}
    </div>,
    document.body,
  );
}
