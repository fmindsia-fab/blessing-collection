import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./reset-password-form";

// Só chega aqui com sessão: o link do e-mail passa por /auth/confirm, que
// valida o token e grava a sessão de recuperação nos cookies deste host.
export default async function ResetPasswordPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="reveal flex w-full max-w-sm flex-col gap-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-xs font-medium text-muted-foreground">AteliFácil</span>
          <h1 className="text-3xl leading-none font-semibold tracking-tight">Nova senha</h1>
          <span aria-hidden className="h-px w-10 bg-[var(--gold)]" />
        </div>

        {user ? (
          <ResetPasswordForm />
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <p role="alert" className="text-sm text-destructive">
              Esse link expirou ou já foi usado.
            </p>
            <Link href="/esqueci-senha" className="text-sm underline underline-offset-4">
              Pedir um novo link
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
