import { ActionLink } from "@/components/ui/action";

// Link antigo de uma peça que foi desativada ou excluída (muito comum em links enviados pelo
// WhatsApp). A mensagem fala da peça, não de "erro", e oferece o caminho para outras peças.
export default function ProductNotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="flex max-w-md flex-col items-center gap-5 text-center">
        <span className="kicker">Peça indisponível</span>
        <h1 className="font-[family-name:var(--font-brand)] text-3xl leading-tight tracking-tight sm:text-4xl">
          Esta peça não está mais disponível
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          Ela pode ter saído do catálogo ou o link pode estar antigo. Veja as outras peças: talvez você encontre algo
          parecido.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <ActionLink href="/produtos" variant="solid">
            Ver outras peças
          </ActionLink>
          <ActionLink href="/" variant="quiet">
            Página inicial
          </ActionLink>
        </div>
      </div>
    </main>
  );
}
