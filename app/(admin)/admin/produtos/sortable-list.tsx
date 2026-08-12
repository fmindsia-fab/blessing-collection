"use client";

import { useState, useTransition } from "react";
import { reorderProducts } from "@/lib/products/actions";

type Item = { id: string };

/**
 * Lista reordenável por arrastar e soltar, com a HTML Drag and Drop API.
 *
 * Sem biblioteca: a API nativa cobre o caso (lista vertical, um nível, sem
 * arrastar entre grupos) e uma dependência de drag-and-drop custaria mais em
 * peso e manutenção do que resolve aqui.
 *
 * A ordem fica em estado local durante o arraste para o item acompanhar o
 * cursor; ao soltar, grava no servidor. As setas continuam funcionando e são
 * o caminho de quem usa teclado — `draggable` não é operável sem mouse.
 */
export function SortableList<T extends Item>({
  items,
  children,
}: {
  items: T[];
  children: (item: T, index: number, dragHandlers: DragHandlers) => React.ReactNode;
}) {
  const [order, setOrder] = useState(items);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // O servidor é a fonte da verdade: quando a página revalida (após gravar, ou
  // ao desativar uma peça), a ordem local precisa acompanhar. Ajustar durante o
  // render em vez de num efeito evita o render extra com a lista defasada —
  // e não pode acontecer no meio de um arraste, que descartaria o movimento.
  // Compara os ids, não a referência: o servidor devolve um array novo a cada
  // render, e comparar por identidade recriaria o estado sem necessidade.
  const signature = items.map((item) => item.id).join("|");
  const [syncedWith, setSyncedWith] = useState(signature);
  if (signature !== syncedWith && !draggingId) {
    setSyncedWith(signature);
    setOrder(items);
  }

  function handleDragStart(id: string) {
    setDraggingId(id);
  }

  function handleDragOver(id: string) {
    if (!draggingId || draggingId === id) return;
    setOverId(id);

    setOrder((current) => {
      const from = current.findIndex((item) => item.id === draggingId);
      const to = current.findIndex((item) => item.id === id);
      if (from === -1 || to === -1 || from === to) return current;

      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function handleDragEnd() {
    setDraggingId(null);
    setOverId(null);

    const ids = order.map((item) => item.id);
    const unchanged = ids.every((id, index) => id === items[index]?.id);
    if (unchanged) return;

    startTransition(() => reorderProducts(ids));
  }

  return (
    <>
      {order.map((item, index) =>
        children(item, index, {
          draggable: true,
          isDragging: draggingId === item.id,
          isOver: overId === item.id,
          onDragStart: (event) => {
            // Firefox só inicia o arraste se houver dado no dataTransfer.
            event.dataTransfer.setData("text/plain", item.id);
            event.dataTransfer.effectAllowed = "move";
            handleDragStart(item.id);
          },
          onDragOver: (event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            handleDragOver(item.id);
          },
          onDrop: (event) => event.preventDefault(),
          onDragEnd: handleDragEnd,
        }),
      )}
    </>
  );
}

export type DragHandlers = {
  draggable: boolean;
  isDragging: boolean;
  isOver: boolean;
  onDragStart: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
  onDragEnd: () => void;
};
