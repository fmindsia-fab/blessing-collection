"use client";

import { useState, useTransition } from "react";
import { AlertCircleIcon, Trash2Icon } from "lucide-react";
import { deleteProductPermanently } from "@/lib/products/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

// Área de perigo no fim da edição da peça. Excluir de vez é irreversível, então fica separado
// do salvar, explica o que se perde e lembra que "Desativar" só esconde a peça do catálogo.
export function DeleteProductSection({ productId, productName }: { productId: string; productName: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await deleteProductPermanently(productId);
      // Em caso de sucesso a ação redireciona para a lista; só chega aqui quando há erro.
      if (result?.error) setError(result.error);
    });
  }

  return (
    <section
      id="excluir"
      className="scroll-mt-24 flex flex-col gap-4 rounded-2xl border border-destructive/40 bg-card p-5 shadow-sm sm:p-6"
    >
      <h2 className="text-xl font-semibold tracking-tight text-destructive">Excluir esta peça</h2>
      <p className="text-sm text-muted-foreground">
        Só quer tirar a peça do catálogo? Mude o Status para <strong className="text-foreground">Inativo</strong> (ou
        use &quot;Desativar&quot; na lista): ela some para as clientes, mas continua guardada e dá para voltar.
      </p>
      <p className="text-sm text-muted-foreground">
        Excluir <strong className="text-foreground">apaga para sempre</strong> a peça, as fotos, o vídeo, as
        variações e os materiais dela. Não dá para desfazer. Peças que já estão em algum pedido não podem ser
        excluídas.
      </p>

      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive"
        >
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        variant="destructive"
        disabled={isPending}
        onClick={() => setOpen(true)}
        className="w-full sm:w-fit"
        data-help="product-delete"
      >
        <Trash2Icon />
        {isPending ? "Excluindo..." : "Excluir peça para sempre"}
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Excluir "${productName}" para sempre?`}
        description="Isso apaga a peça, as fotos, o vídeo, as variações e os materiais dela. Não dá para desfazer. Se você só quer escondê-la do catálogo, escolha Voltar e use o Status Inativo."
        confirmLabel="Excluir para sempre"
        cancelLabel="Voltar"
        onConfirm={remove}
      />
    </section>
  );
}
