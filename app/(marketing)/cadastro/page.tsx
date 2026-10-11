import { SignupForm } from "./signup-form";

export default function CadastroPage() {
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
        <SignupForm platformDomain={platformDomain} />
      </div>
    </main>
  );
}
