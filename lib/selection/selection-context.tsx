"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "blessing:selection";

export type SelectedItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  coverImageUrl: string | null;
};

type SelectionContextValue = {
  items: SelectedItem[];
  isSelected: (productId: string) => boolean;
  toggle: (item: SelectedItem) => void;
  remove: (productId: string) => void;
  clear: () => void;
  isHydrated: boolean;
};

const SelectionContext = createContext<SelectionContextValue | null>(null);

function readStoredItems(): SelectedItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<SelectedItem[]>([]);
  // A leitura do localStorage só acontece no cliente; até lá o botão
  // flutuante não renderiza, evitando divergência com o HTML do servidor.
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setItems(readStoredItems());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Modo privado ou storage cheio: a seleção segue funcionando em memória.
    }
  }, [items, isHydrated]);

  const isSelected = useCallback(
    (productId: string) => items.some((item) => item.productId === productId),
    [items],
  );

  const toggle = useCallback((item: SelectedItem) => {
    setItems((current) =>
      current.some((existing) => existing.productId === item.productId)
        ? current.filter((existing) => existing.productId !== item.productId)
        : [...current, item],
    );
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((current) => current.filter((item) => item.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({ items, isSelected, toggle, remove, clear, isHydrated }),
    [items, isSelected, toggle, remove, clear, isHydrated],
  );

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (!context) throw new Error("useSelection precisa estar dentro de SelectionProvider");
  return context;
}
