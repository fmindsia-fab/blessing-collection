"use client";

import { useState } from "react";
import { CheckIcon, LinkIcon, Share2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

type ShareButtonProps = {
  url: string;
  title: string;
  /** Texto que acompanha o link no compartilhamento nativo e no WhatsApp. */
  message?: string;
  label?: string;
  className?: string;
  variant?: "solid" | "outline" | "ghost";
};

const VARIANTS = {
  solid: "h-11 bg-foreground px-6 text-background hover:bg-[var(--gold)]",
  outline:
    "h-11 border border-foreground/30 px-6 text-foreground hover:border-foreground hover:bg-foreground hover:text-background",
  ghost: "text-muted-foreground hover:text-foreground",
} as const;

export function ShareButton({
  url,
  title,
  message,
  label = "Compartilhar",
  className,
  variant = "outline",
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const shareText = message ?? title;

    // Web Share API: no celular abre a folha nativa (WhatsApp, Instagram…).
    // Só existe em contexto seguro e nem todo desktop implementa.
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url });
        return;
      } catch {
        // Usuário cancelou ou o navegador recusou: cai para a cópia do link.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // clipboard bloqueado (http, permissão negada): abre o link em prompt.
      window.prompt("Copie o link do catálogo:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-live="polite"
      className={cn(
        "group inline-flex items-center justify-center gap-2.5 whitespace-nowrap text-[0.6875rem] uppercase tracking-[0.16em] outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-4 focus-visible:ring-offset-background",
        VARIANTS[variant],
        className,
      )}
    >
      {copied ? (
        <>
          <CheckIcon className="size-3.5" />
          Link copiado
        </>
      ) : (
        <>
          {variant === "ghost" ? <LinkIcon className="size-3.5" /> : <Share2Icon className="size-3.5" />}
          {label}
        </>
      )}
    </button>
  );
}
