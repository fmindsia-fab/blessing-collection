import { SignupForm } from "./signup-form";

export default async function CadastroPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const platformDomain = process.env.PLATFORM_DOMAIN ?? "";

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-sm flex-col gap-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-3xl leading-none tracking-tight">Crie sua loja</h1>
          <p className="text-sm text-muted-foreground">
            Catálogo digital para suas peças, em poucos minutos.
          </p>
        </div>

        {erro === "link-invalido" ? (
          <p role="alert" className="text-center text-sm text-destructive">
            O link de confirmação expirou ou já foi usado. Se você já confirmou o e-mail, entre pelo login;
            senão, cadastre-se de novo para receber outro link.
          </p>
        ) : null}
        {erro === "sessao" ? (
          <p role="alert" className="text-center text-sm text-destructive">
            Sua sessão expirou. Comece o cadastro novamente.
          </p>
        ) : null}

        <SignupForm platformDomain={platformDomain} />
      </div>
    </main>
  );
}
