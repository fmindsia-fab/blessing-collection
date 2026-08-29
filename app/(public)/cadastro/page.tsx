import { SignupForm } from "./signup-form";

export default function CadastroPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="reveal flex w-full max-w-sm flex-col gap-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-[0.625rem] uppercase tracking-[0.22em] text-muted-foreground">
            Blessing Collection
          </span>
          <h1 className="text-3xl leading-none tracking-tight">Crie sua loja</h1>
          <span aria-hidden className="h-px w-10 bg-[var(--gold)]" />
          <p className="text-sm text-muted-foreground">
            Monte seu catálogo digital e comece a receber pedidos pelo WhatsApp.
          </p>
        </div>
        <SignupForm />
      </div>
    </main>
  );
}
