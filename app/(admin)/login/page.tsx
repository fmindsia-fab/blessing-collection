import { LoginForm } from "./login-form";
import { LegalLinks } from "@/components/legal/legal-links";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="reveal flex w-full max-w-sm flex-col gap-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-xs font-medium text-muted-foreground">
            AteliFácil
          </span>
          <h1 className="text-3xl leading-none font-semibold tracking-tight">
            Painel
          </h1>
          <span aria-hidden className="h-px w-10 bg-[var(--gold)]" />
          <p className="text-sm text-muted-foreground">Acesse a administração da sua loja.</p>
        </div>
        <LoginForm redirectTo={redirectTo} />
        <LegalLinks className="text-xs text-muted-foreground" />
      </div>
    </main>
  );
}
