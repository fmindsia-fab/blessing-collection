import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Rodapé padrão dos formulários do painel: mensagem de erro/sucesso bem visível (ícone,
// cor e texto, nunca só cor) e o botão de salvar que não deixa clicar duas vezes.
// Em formulários longos, `sticky` mantém o botão sempre à vista na parte de baixo da tela.
export function FormFooter({
  isPending,
  error,
  success,
  successMessage = "Alterações salvas.",
  submitLabel = "Salvar",
  pendingLabel = "Salvando...",
  variant = "default",
  sticky = false,
}: {
  isPending: boolean;
  error?: string;
  success?: boolean;
  successMessage?: string;
  submitLabel?: string;
  pendingLabel?: string;
  variant?: "default" | "outline";
  sticky?: boolean;
}) {
  const showSuccess = Boolean(success) && !isPending && !error;

  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        sticky &&
          "sticky bottom-3 z-30 rounded-2xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur",
      )}
    >
      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive"
        >
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}
      {showSuccess ? (
        <p
          role="status"
          className="flex items-start gap-2 rounded-xl bg-[var(--brand-soft)] px-3 py-2.5 text-sm font-medium text-foreground"
        >
          <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-[var(--gold)]" aria-hidden />
          {successMessage}
        </p>
      ) : null}

      <Button type="submit" variant={variant} disabled={isPending} className="w-full sm:w-fit">
        {isPending ? pendingLabel : submitLabel}
      </Button>
    </div>
  );
}
