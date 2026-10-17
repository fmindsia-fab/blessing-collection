"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteOrphanUser,
  deleteStaleOrphanUsers,
  type OrphanActionState,
} from "@/lib/platform/orphan-users-actions";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/admin/status-pill";

export type OrphanRow = {
  id: string;
  email: string | null;
  createdAt: string;
  confirmed: boolean;
  isRecent: boolean;
};

function formatAge(createdAt: string) {
  const hours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  if (hours < 1) return "há menos de 1 h";
  if (hours < 48) return `há ${Math.floor(hours)} h`;
  return `há ${Math.floor(hours / 24)} dias`;
}

// Logins sem loja: o mesmo e-mail não consegue se cadastrar de novo enquanto o
// login antigo existir. A confirmação é em dois cliques (nada de excluir de
// primeira), e o servidor recalcula quem é órfão antes de apagar.
export function OrphanUsersSection({ orphans }: { orphans: OrphanRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmingAll, setConfirmingAll] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const stale = orphans.filter((o) => !o.isRecent);

  function run(action: () => Promise<OrphanActionState>, successText: (deleted: number) => string) {
    setFeedback(null);
    startTransition(async () => {
      const result = await action();
      setConfirmingId(null);
      setConfirmingAll(false);
      if (result.error) {
        setFeedback({ ok: false, text: result.error });
      } else {
        setFeedback({ ok: true, text: successText(result.deleted ?? 0) });
      }
      router.refresh();
    });
  }

  return (
    <section aria-labelledby="orphans-heading" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="orphans-heading" className="text-lg font-semibold tracking-tight">
          Logins sem loja ({orphans.length})
        </h2>
        <p className="max-w-prose text-sm text-muted-foreground">
          Contas de login que não são dono de nenhuma loja (por exemplo, depois de excluir uma loja de teste).
          Enquanto existirem, o mesmo e-mail não consegue se cadastrar de novo. Administradores e donos de
          loja nunca aparecem aqui.
        </p>
      </div>

      {feedback ? (
        <p role={feedback.ok ? "status" : "alert"} className={feedback.ok ? "text-sm" : "text-sm text-destructive"}>
          {feedback.text}
        </p>
      ) : null}

      {orphans.length === 0 ? (
        <p className="rounded-[var(--radius-image)] border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nenhum login sem loja.
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {orphans.map((orphan) => (
              <li
                key={orphan.id}
                className="flex flex-col gap-3 rounded-[var(--radius-image)] border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate font-medium">{orphan.email ?? "(sem e-mail)"}</span>
                  <span className="text-sm text-muted-foreground">
                    criado {formatAge(orphan.createdAt)}
                    {orphan.confirmed ? "" : " · e-mail não confirmado"}
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {orphan.isRecent ? <StatusPill tone="accent">Cadastro recente</StatusPill> : null}

                  {confirmingId === orphan.id ? (
                    <>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={isPending}
                        onClick={() => run(() => deleteOrphanUser(orphan.id), () => "Login excluído.")}
                      >
                        {isPending ? "Excluindo..." : "Confirmar exclusão"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() => setConfirmingId(null)}
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => {
                        setConfirmingAll(false);
                        setConfirmingId(orphan.id);
                      }}
                    >
                      Excluir
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {stale.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {confirmingAll ? (
                <>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isPending}
                    onClick={() =>
                      run(deleteStaleOrphanUsers, (n) => `${n} login${n === 1 ? "" : "s"} excluído${n === 1 ? "" : "s"}.`)
                    }
                  >
                    {isPending ? "Excluindo..." : `Confirmar: excluir ${stale.length}`}
                  </Button>
                  <Button type="button" variant="outline" disabled={isPending} onClick={() => setConfirmingAll(false)}>
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => {
                    setConfirmingId(null);
                    setConfirmingAll(true);
                  }}
                >
                  Excluir todos com mais de 24 h ({stale.length})
                </Button>
              )}
              <span className="text-xs text-muted-foreground">
                Cadastros recentes ficam de fora para não derrubar quem está se cadastrando.
              </span>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
