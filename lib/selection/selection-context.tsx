"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

const STORAGE_KEY = "blessing:selection";

// A seleção não muda por evento externo — só precisamos do contraste entre o
// snapshot do servidor e o do cliente para detectar a hidratação.
const subscribeToNothing = () => () => {};

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
  // `useSyncExternalStore` devolve o snapshot do servidor (false) no HTML e
  // no primeiro render do cliente, virando true logo após a hidratação —
  // sem setState em efeito, que dispara render em cascata.
  const isHydrated = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );

  // Inicialização preguiçosa: lê o localStorage uma única vez, já no primeiro
  // render do cliente. Até a hidratação terminar o botão flutuante não
  // renderiza, então não há divergência com o HTML do servidor.
  const [items, setItems] = useState<SelectedItem[]>(() =>
    typeof window === "undefined" ? [] : readStoredItems(),
  );

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
