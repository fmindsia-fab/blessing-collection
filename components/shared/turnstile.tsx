"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// CAPTCHA (Cloudflare Turnstile) dos formulários de autenticação. É OPCIONAL
// por ambiente: sem NEXT_PUBLIC_TURNSTILE_SITE_KEY nada é exibido nem exigido,
// e os formulários funcionam como antes. Com a chave, o token é enviado ao
// Supabase Auth (captchaToken) — que, com CAPTCHA ligado no painel, EXIGE o
// token em cadastro, login, reenvio de confirmação e recuperação de senha.
// Por isso os quatro formulários usam este mesmo componente.

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
export const isTurnstileEnabled = Boolean(SITE_KEY);

type TurnstileApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Não foi possível carregar o CAPTCHA."));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

function Turnstile({
  onToken,
  resetCounter,
}: {
  onToken: (token: string | null) => void;
  resetCounter: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);

  useEffect(() => {
    onTokenRef.current = onToken;
  });

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile || widgetIdRef.current) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          theme: "auto",
          callback: (token: string) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": () => onTokenRef.current(null),
        });
      })
      .catch(() => onTokenRef.current(null));

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, []);

  // Cada token vale uma única verificação: depois de enviar o formulário (com
  // sucesso ou erro) o pai incrementa o contador e o widget pede um novo.
  useEffect(() => {
    if (resetCounter > 0 && widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, [resetCounter]);

  return <div ref={containerRef} className="min-h-[65px]" />;
}

// Uso: const captcha = useCaptcha();
//   {captcha.widget}                      -> dentro do formulário
//   disabled={captcha.required}           -> no botão de enviar
//   captchaToken: captcha.token           -> na chamada ao Supabase
//   captcha.reset()                       -> depois de cada tentativa
export function useCaptcha() {
  const [token, setToken] = useState<string | null>(null);
  const [resetCounter, setResetCounter] = useState(0);

  const reset = useCallback(() => {
    setToken(null);
    setResetCounter((n) => n + 1);
  }, []);

  return {
    token: token ?? undefined,
    // Habilitado e ainda sem token resolvido: o envio deve ficar bloqueado.
    required: isTurnstileEnabled && !token,
    reset,
    widget: isTurnstileEnabled ? <Turnstile onToken={setToken} resetCounter={resetCounter} /> : null,
  };
}
