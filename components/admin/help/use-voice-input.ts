"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

// Entrada por voz da Ajuda, usando o reconhecimento de fala do próprio navegador
// (Chrome, Edge e Safari; não existe no Firefox nem dentro do navegador do Instagram/WhatsApp).
// Em vez de falhar em silêncio, cada problema vira um "motivo" que a tela explica à pessoa.

export type VoiceIssue =
  | "blocked" // permissão do microfone negada
  | "unsupported" // navegador sem reconhecimento de voz
  | "insecure" // página fora de https
  | "no-mic" // nenhum microfone encontrado
  | "no-speech" // não ouviu nada
  | "network" // serviço de voz do navegador sem conexão
  | "other";

type SpeechAlternative = { transcript: string };
type SpeechResultItem = ArrayLike<SpeechAlternative> & { isFinal: boolean };
type SpeechResultEvent = { results: ArrayLike<SpeechResultItem> };
type SpeechErrorEvent = { error?: string };

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const subscribeToNothing = () => () => {};

function issueFromError(error: string | undefined): VoiceIssue {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
      return "blocked";
    case "audio-capture":
      return "no-mic";
    case "no-speech":
      return "no-speech";
    case "network":
      return "network";
    default:
      return "other";
  }
}

// Pergunta ao navegador, sem abrir nenhum aviso, se o microfone já está bloqueado.
// Nem todo navegador sabe responder: nesse caso devolve null e a tentativa segue normalmente.
async function readMicrophonePermission(): Promise<PermissionState | null> {
  try {
    const status = await navigator.permissions.query({ name: "microphone" as PermissionName });
    return status.state;
  } catch {
    return null;
  }
}

export function useVoiceInput(onText: (text: string, isFinal: boolean) => void) {
  const supported = useSyncExternalStore(
    subscribeToNothing,
    () => getSpeechRecognition() !== null,
    () => false,
  );

  const [listening, setListening] = useState(false);
  const [issue, setIssue] = useState<VoiceIssue | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onTextRef = useRef(onText);
  // Quando a própria pessoa para (ou fecha a janela), não é falha: não mostrar aviso.
  const stoppedByUserRef = useRef(false);

  useEffect(() => {
    onTextRef.current = onText;
  }, [onText]);

  const stop = useCallback(() => {
    stoppedByUserRef.current = true;
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setListening(false);
  }, []);

  // Não deixa o microfone aberto se a janela fechar ou a pessoa sair da tela.
  useEffect(() => stop, [stop]);

  const start = useCallback(async () => {
    setIssue(null);
    stoppedByUserRef.current = false;

    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setIssue("unsupported");
      return;
    }
    if (!window.isSecureContext) {
      setIssue("insecure");
      return;
    }
    if ((await readMicrophonePermission()) === "denied") {
      setIssue("blocked");
      return;
    }

    let heardSomething = false;
    let failed = false;

    const recognition = new Recognition();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    // Mostra o texto aparecendo enquanto a pessoa fala: ela vê que o aparelho está ouvindo.
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let text = "";
      let isFinal = false;
      for (let i = 0; i < event.results.length; i += 1) {
        text += event.results[i][0]?.transcript ?? "";
        isFinal = event.results[i].isFinal;
      }
      text = text.trim();
      if (text) {
        heardSomething = true;
        onTextRef.current(text, isFinal);
      }
    };
    recognition.onerror = (event) => {
      failed = true;
      setIssue(issueFromError(event.error));
    };
    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
      if (!heardSomething && !failed && !stoppedByUserRef.current) setIssue("no-speech");
    };

    recognitionRef.current = recognition;
    setListening(true);
    try {
      recognition.start();
    } catch {
      setListening(false);
      setIssue("other");
    }
  }, []);

  const clearIssue = useCallback(() => setIssue(null), []);

  return { supported, listening, issue, start, stop, clearIssue };
}
