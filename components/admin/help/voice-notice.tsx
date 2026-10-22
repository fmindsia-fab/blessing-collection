import { MicIcon, TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VoiceIssue } from "./use-voice-input";

// Explica à pessoa, em linguagem simples, por que a voz não funcionou e o que fazer.
const MESSAGES: Record<Exclude<VoiceIssue, "blocked">, { title: string; text: string }> = {
  unsupported: {
    title: "Falar não funciona neste navegador",
    text: "Isso acontece no Firefox e dentro do Instagram ou do WhatsApp. Abra o painel no Chrome para poder falar, ou escreva sua pergunta no campo.",
  },
  insecure: {
    title: "A voz só funciona em conexão segura",
    text: "Abra o painel pelo endereço que começa com https para poder falar.",
  },
  "no-mic": {
    title: "Não encontrei um microfone",
    text: "Confira se o microfone do aparelho está ligado e conectado, e tente de novo.",
  },
  "no-speech": {
    title: "Não ouvi nada",
    text: "Toque no microfone e fale logo em seguida, perto do aparelho.",
  },
  network: {
    title: "Sem conexão com o serviço de voz",
    text: "O reconhecimento de voz do navegador precisa de internet. Confira a conexão e tente de novo.",
  },
  other: {
    title: "Não consegui ouvir",
    text: "Tente de novo, ou escreva sua pergunta no campo.",
  },
};

export function VoiceNotice({ issue, onRetry }: { issue: VoiceIssue; onRetry: () => void }) {
  if (issue === "blocked") {
    return (
      <div role="alert" className="flex flex-col gap-3 rounded-xl border border-[var(--gold)]/40 bg-[var(--brand-soft)] p-4">
        <p className="flex items-center gap-2 text-base font-semibold">
          <TriangleAlertIcon className="size-5 shrink-0 text-[var(--gold)]" aria-hidden />
          O microfone está bloqueado neste navegador
        </p>
        <p className="text-sm">Para falar com a Ajuda, é preciso permitir o uso do microfone. É rápido:</p>
        <ol className="flex flex-col gap-2 text-sm">
          <li>
            <strong>1.</strong> Olhe a barra de endereço, lá em cima, e toque no ícone à esquerda do endereço do site
            (um cadeado ou dois risquinhos).
          </li>
          <li>
            <strong>2.</strong> Toque em <strong>Permissões</strong> (ou <strong>Configurações do site</strong>) e depois
            em <strong>Microfone</strong>.
          </li>
          <li>
            <strong>3.</strong> Escolha <strong>Permitir</strong>.
          </li>
          <li>
            <strong>4.</strong> Volte aqui, atualize a página e toque no microfone de novo.
          </li>
        </ol>
        <p className="text-xs text-muted-foreground">
          No iPhone: Ajustes &gt; Safari &gt; Microfone &gt; Permitir. Se preferir, é só escrever sua pergunta no campo.
        </p>
        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={onRetry}>
          <MicIcon /> Tentar de novo
        </Button>
      </div>
    );
  }

  const message = MESSAGES[issue];
  return (
    <div role="alert" className="flex flex-col gap-2 rounded-xl bg-secondary px-4 py-3">
      <p className="text-sm font-semibold">{message.title}</p>
      <p className="text-sm text-muted-foreground">{message.text}</p>
      {issue !== "unsupported" && issue !== "insecure" ? (
        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={onRetry}>
          <MicIcon /> Tentar de novo
        </Button>
      ) : null}
    </div>
  );
}
