"use client";

import { useState, useTransition } from "react";
import { reorderProducts } from "@/lib/products/actions";
import { ProductRow, type AdminProduct } from "./product-row";

/**
 * Lista de peças reordenável por arrastar e soltar, com a HTML Drag and Drop
 * API.
 *
 * Sem biblioteca: a lista é vertical, de um nível e sem arraste entre grupos —
 * a API nativa cobre o caso, e uma dependência custaria mais em peso e
 * manutenção do que resolve aqui.
 *
 * Monta as linhas em vez de receber uma função de render: a página é Server
 * Component, e função não atravessa a fronteira servidor→cliente.
 *
 * A ordem fica em estado local durante o arraste para a linha acompanhar o
 * cursor; ao soltar, grava no servidor.
 */
export function SortableList({
  items,
  statusLabels,
}: {
  items: AdminProduct[];
  statusLabels: Record<string, string>;
}) {
  const [order, setOrder] = useState(items);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // O servidor é a fonte da verdade: quando a página revalida (após gravar, ou
  // ao desativar uma peça), a ordem local precisa acompanhar. Ajustar durante o
  // render em vez de num efeito evita o render extra com a lista defasada — e
  // não pode acontecer no meio de um arraste, que descartaria o movimento.
  //
  // Compara os ids, não a referência: o servidor devolve um array novo a cada
  // render, e comparar por identidade recriaria o estado sem necessidade.
  const signature = items.map((item) => item.id).join("|");
  const [syncedWith, setSyncedWith] = useState(signature);
  if (signature !== syncedWith && !draggingId) {
    setSyncedWith(signature);
    setOrder(items);
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
      {order.map((product, index) => (
        <ProductRow
          key={product.id}
          product={product}
          statusLabel={statusLabels[product.status]}
          // Primeiro/último dentro do grupo: é entre vizinhos da mesma
          // categoria que `moveProduct` troca as posições.
          isFirst={index === 0}
          isLast={index === order.length - 1}
          drag={{
            isDragging: draggingId === product.id,
            isOver: overId === product.id,
            onDragStart: (event) => {
              // Firefox só inicia o arraste se houver dado no dataTransfer.
              event.dataTransfer.setData("text/plain", product.id);
              event.dataTransfer.effectAllowed = "move";
              setDraggingId(product.id);
            },
            onDragOver: (event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              handleDragOver(product.id);
            },
            onDrop: (event) => event.preventDefault(),
            onDragEnd: handleDragEnd,
          }}
        />
      ))}
    </>
  );
}

export type DragHandlers = {
  isDragging: boolean;
  isOver: boolean;
  onDragStart: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
  onDragEnd: () => void;
};
