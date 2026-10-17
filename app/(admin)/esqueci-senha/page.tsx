import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-password-form";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="reveal flex w-full max-w-sm flex-col gap-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-xs font-medium text-muted-foreground">AteliFácil</span>
          <h1 className="text-3xl leading-none font-semibold tracking-tight">Esqueci minha senha</h1>
          <span aria-hidden className="h-px w-10 bg-[var(--gold)]" />
          <p className="text-sm text-muted-foreground">
            Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha.
          </p>
        </div>

        {erro === "link-invalido" ? (
          <p role="alert" className="text-center text-sm text-destructive">
            Esse link expirou ou já foi usado. Peça um novo abaixo.
          </p>
        ) : null}

        <ForgotPasswordForm />

        <Link href="/login" className="text-center text-sm text-muted-foreground underline underline-offset-4">
          Voltar para o login
        </Link>
      </div>
    </main>
  );
}
