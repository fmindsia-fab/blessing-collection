"use client";

import { useEffect, useState } from "react";
import { CheckIcon, Share2Icon } from "lucide-react";

/**
 * Compartilha a lista que a cliente está vendo. No celular abre a folha nativa
 * (WhatsApp, Instagram etc.); onde ela não existe, copia o link.
 */
export function ShareButton({ title, label }: { title: string; label: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2500);
    return () => clearTimeout(timer);
  }, [copied]);

  async function handleShare() {
    // A paginação ("Carregar mais") não entra: quem recebe o link começa do início.
    const url = new URL(window.location.href);
    url.searchParams.delete("page");
    url.hash = "";

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text: title, url: url.toString() });
      } catch {
        // Cancelar a folha de compartilhar não é erro.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
    } catch {
      window.prompt("Copie o link:", url.toString());
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-xs tracking-wide text-muted-foreground outline-none transition-all duration-300 hover:border-foreground hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {copied ? <CheckIcon className="size-3.5" /> : <Share2Icon className="size-3.5" />}
      <span aria-live="polite">{copied ? "Link copiado" : label}</span>
    </button>
  );
}
