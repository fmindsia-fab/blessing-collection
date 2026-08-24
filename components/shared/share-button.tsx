"use client";

import { LinkIcon, Share2Icon } from "lucide-react";
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
  async function handleShare() {
    // Sem `url` (ex: NEXT_PUBLIC_SITE_URL não configurada em produção), cai
    // para a URL da própria página em vez de compartilhar um link vazio —
    // pior um link relativo ao ambiente do que nenhum link.
    const effectiveUrl = url || window.location.href;
    const shareText = message ?? title;

    // Web Share API: no celular abre a folha nativa (WhatsApp, Instagram…).
    // Só existe em contexto seguro e nem todo desktop implementa.
    //
    // Manda só `text` (mensagem + link concatenados), sem `title` nem `url`
    // separados: confirmado num aparelho real que `{ title, text, url }` e
    // `{ title, text }` faziam o WhatsApp nem abrir — a folha aparecia, o
    // WhatsApp era escolhido, e voltava direto pro navegador sem erro
    // (compartilhar a mesma foto/link direto do app de Fotos do Android, pelo
    // "compartilhar" nativo, funcionou normalmente no mesmo aparelho — ou
    // seja, o WhatsApp dela funciona, é o formato do payload que falhava). Só
    // `text` isolado é o formato mais universalmente aceito entre apps.
    if (navigator.share) {
      try {
        await navigator.share({ text: `${shareText}\n${effectiveUrl}` });
        return;
      } catch {
        // Usuário cancelou de verdade, ou o navegador recusou: cai para o
        // WhatsApp Web.
      }
    }

    // Sem Web Share API (a maioria dos navegadores desktop): abre o
    // WhatsApp Web/app direto com a mensagem e o link já prontos — é o canal
    // que a loja mais usa para falar com cliente, então adianta o passo de
    // colar em vez de só copiar para a área de transferência.
    const text = `${shareText}\n${effectiveUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={cn(
        "group inline-flex items-center justify-center gap-2.5 whitespace-nowrap text-[0.6875rem] uppercase tracking-[0.16em] outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-4 focus-visible:ring-offset-background",
        VARIANTS[variant],
        className,
      )}
    >
      {variant === "ghost" ? <LinkIcon className="size-3.5" /> : <Share2Icon className="size-3.5" />}
      {label}
    </button>
  );
}
