"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteStoreAndAccount } from "@/lib/platform/delete-account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Zona de perigo: exclusão definitiva. O botão final só habilita depois de
// digitar o endereço (slug) exato da loja.
export function DeleteAccountSection({
  storeId,
  slug,
  storeName,
  blocker,
}: {
  storeId: string;
  slug: string;
  storeName: string;
  blocker: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteStoreAndAccount(storeId, typed);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/admin-plataforma");
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-4 rounded-[var(--radius-image)] border border-destructive/40 p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-destructive">Zona de perigo</h2>
        <p className="text-sm text-muted-foreground">
          Exclui <strong>definitivamente</strong> a loja {storeName}, todos os dados (produtos, pedidos,
          clientes, assinatura, estatísticas), as imagens e vídeos enviados e o login do proprietário. Não há
          como desfazer.
        </p>
      </div>

      {blocker ? (
        <p role="note" className="rounded-md bg-secondary px-3 py-2 text-sm">
          {blocker}
        </p>
      ) : !open ? (
        <Button type="button" variant="destructive" className="w-fit" onClick={() => setOpen(true)}>
          Excluir loja e conta…
        </Button>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm-slug">
              Para confirmar, digite o endereço da loja: <strong>{slug}</strong>
            </Label>
            <Input
              id="confirm-slug"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
            />
          </div>

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="destructive"
              disabled={isPending || typed.trim() !== slug}
              onClick={handleDelete}
            >
              {isPending ? "Excluindo..." : "Excluir definitivamente"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => {
                setOpen(false);
                setTyped("");
                setError(null);
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
