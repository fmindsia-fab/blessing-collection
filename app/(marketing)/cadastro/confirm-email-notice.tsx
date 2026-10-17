"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useCaptcha } from "@/components/shared/turnstile";

const RESEND_COOLDOWN_SECONDS = 60;

// Mostrada quando o projeto exige confirmação de e-mail: o signUp cria a conta
// mas não devolve sessão. Quem clicar no link do e-mail cai em /auth/confirm
// e segue para /cadastro/loja para criar a loja.
export function ConfirmEmailNotice({
  email,
  emailRedirectTo,
  onChangeEmail,
}: {
  email: string;
  emailRedirectTo: string;
  onChangeEmail: () => void;
}) {
  const [cooldownUntil, setCooldownUntil] = useState(() => Date.now() + RESEND_COOLDOWN_SECONDS * 1000);
  const [now, setNow] = useState(() => Date.now());
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [sending, setSending] = useState(false);
  const captcha = useCaptcha();

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));

  async function resend() {
    setFeedback(null);
    setSending(true);
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo, captchaToken: captcha.token },
    });
    setSending(false);
    captcha.reset();

    if (error) {
      setFeedback({
        ok: false,
        text:
          error.status === 429
            ? "Aguarde um pouco antes de pedir outro e-mail."
            : "Não foi possível reenviar o e-mail. Tente novamente.",
      });
      return;
    }

    setCooldownUntil(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);
    setNow(Date.now());
    setFeedback({ ok: true, text: "E-mail reenviado." });
  }

  return (
    <div role="status" className="flex flex-col gap-4 text-center">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold tracking-tight">Confirme seu e-mail</h2>
        <p className="text-sm text-muted-foreground">
          Enviamos um link de confirmação para <strong className="text-foreground">{email}</strong>. Clique
          nele para continuar criando a sua loja. Confira também a caixa de spam.
        </p>
      </div>

      <div className="flex flex-col items-center gap-2">
        {captcha.widget}
        <Button
          type="button"
          variant="outline"
          onClick={resend}
          disabled={sending || remaining > 0 || captcha.required}
        >
          {sending ? "Reenviando..." : remaining > 0 ? `Reenviar e-mail (${remaining}s)` : "Reenviar e-mail"}
        </Button>
        {feedback ? (
          <p role={feedback.ok ? "status" : "alert"} className={feedback.ok ? "text-xs" : "text-xs text-destructive"}>
            {feedback.text}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onChangeEmail}
          className="text-sm text-muted-foreground underline underline-offset-4"
        >
          Usar outro e-mail
        </button>
      </div>
    </div>
  );
}
