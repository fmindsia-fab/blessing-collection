"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleHelpIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HELP_TASKS, type HelpTask } from "@/lib/help/tasks";
import { searchHelp } from "@/lib/help/search";
import { usePortalThemeProps } from "@/app/(admin)/admin/theme-provider";
import { cn } from "@/lib/utils";

// Ajuda do painel: a pessoa escreve o que quer fazer, escolhe o roteiro e o painel
// a leva passo a passo, destacando na tela o botão ou o campo de cada passo.
// Tudo local: sem IA, sem envio de dados e sem registrar nada do que foi pesquisado.

type HelpContextValue = { openHelp: () => void };
const HelpContext = createContext<HelpContextValue | null>(null);

export function useHelp() {
  const ctx = useContext(HelpContext);
  if (!ctx) throw new Error("useHelp precisa estar dentro de HelpProvider");
  return ctx;
}

const SUGGESTED_IDS = ["cadastrar-peca", "mudar-preco", "fotos", "novo-pedido", "logo", "texto-maior"];

export function HelpProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const portalTheme = usePortalThemeProps();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<HelpTask | null>(null);
  const [tour, setTour] = useState<{ task: HelpTask; index: number } | null>(null);

  const results = useMemo(() => (query.trim() ? searchHelp(query) : []), [query]);
  const suggestions = useMemo(
    () => SUGGESTED_IDS.map((id) => HELP_TASKS.find((task) => task.id === id)).filter((t): t is HelpTask => Boolean(t)),
    [],
  );

  const step = tour ? tour.task.steps[tour.index] : null;

  // Ao entrar num passo com `href`, leva a pessoa até a tela (se ela ainda não estiver nela).
  useEffect(() => {
    if (step?.href && window.location.pathname !== step.href) router.push(step.href);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reage à troca de passo
  }, [tour?.task.id, tour?.index]);

  // Destaca o elemento do passo. Tenta por alguns segundos: a tela pode ainda estar abrindo.
  // Roda de novo quando a rota muda (a pessoa clicou e foi para outra tela).
  useEffect(() => {
    const selector = step?.target;
    if (!selector) return;

    let found: Element | null = null;
    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      // Só elementos visíveis: o mesmo atalho pode existir no topo e no menu, e um deles fica oculto.
      const element = Array.from(document.querySelectorAll(selector)).find((el) => el.getClientRects().length > 0);
      if (element) {
        found = element;
        element.classList.add("help-pulse");
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        element.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
        window.clearInterval(timer);
      } else if (tries > 25) {
        window.clearInterval(timer);
      }
    }, 300);

    return () => {
      window.clearInterval(timer);
      found?.classList.remove("help-pulse");
    };
  }, [step, pathname]);

  function close() {
    setOpen(false);
    setSelected(null);
    setQuery("");
  }

  function startTour(task: HelpTask) {
    close();
    setTour({ task, index: 0 });
  }

  return (
    <HelpContext.Provider value={{ openHelp: () => setOpen(true) }}>
      {children}

      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <DialogContent {...portalTheme} className={cn(portalTheme.className, "max-h-[90vh] max-w-lg overflow-y-auto")}>
          {selected ? (
            <>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="flex w-fit items-center gap-1.5 rounded-lg text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
              >
                <ArrowLeftIcon className="size-4" aria-hidden /> Voltar
              </button>
              <DialogTitle>{selected.title}</DialogTitle>
              <DialogDescription>Veja os passos. Eu posso te guiar na tela, mostrando cada botão.</DialogDescription>
              <ol className="flex flex-col gap-3">
                {selected.steps.map((item, index) => (
                  <li key={index} className="flex gap-3 text-base">
                    <span
                      aria-hidden
                      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)] text-sm font-semibold text-[var(--gold)]"
                    >
                      {index + 1}
                    </span>
                    <span className="pt-0.5">{item.text}</span>
                  </li>
                ))}
              </ol>
              <Button type="button" size="lg" onClick={() => startTour(selected)}>
                Me guie passo a passo
              </Button>
            </>
          ) : (
            <>
              <DialogTitle>Como posso ajudar?</DialogTitle>
              <DialogDescription>
                Escreva o que você quer fazer. Por exemplo: &quot;cadastrar produto&quot; ou &quot;mudar preço&quot;.
              </DialogDescription>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <SearchIcon
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="O que você quer fazer?"
                    aria-label="O que você quer fazer?" enterKeyHint="search"
                    autoFocus
                    className="h-12 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-base outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-[var(--gold)]/40"
                  />
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Dica: no celular, toque no <strong>microfone do teclado</strong> para falar em vez de digitar.
              </p>

              <div className="flex flex-col gap-2">
                {query.trim() && results.length === 0 ? (
                  <p className="rounded-xl bg-secondary px-4 py-3 text-sm text-muted-foreground">
                    Não achei esse assunto. Tente outras palavras (ex.: &quot;foto&quot;, &quot;pedido&quot;, &quot;preço&quot;) ou escolha uma das
                    ajudas abaixo.
                  </p>
                ) : null}

                <span className="text-sm font-semibold text-muted-foreground">
                  {results.length > 0 ? "Encontrei isto:" : "Ajudas mais procuradas:"}
                </span>
                {(results.length > 0 ? results : suggestions).map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => setSelected(task)}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left text-base font-medium outline-none transition-colors hover:border-[var(--gold)]/60 focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
                  >
                    {task.title}
                    <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                  </button>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {tour && step ? (
        <section
          role="region"
          aria-label="Guia passo a passo"
          aria-live="polite"
          className="fixed top-[4.5rem] left-1/2 z-[60] flex w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-3 rounded-2xl border border-[var(--gold)]/50 bg-card p-4 shadow-xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[var(--gold)]">
                {tour.task.title} · passo {tour.index + 1} de {tour.task.steps.length}
              </span>
              <p className="pt-1 text-base font-medium">{step.text}</p>
            </div>
            <button
              type="button"
              onClick={() => setTour(null)}
              aria-label="Fechar o guia"
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
            >
              <XIcon className="size-5" />
            </button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={tour.index === 0}
              onClick={() => setTour({ ...tour, index: tour.index - 1 })}
            >
              <ChevronLeftIcon /> Voltar
            </Button>
            {tour.index === tour.task.steps.length - 1 ? (
              <Button type="button" size="sm" onClick={() => setTour(null)}>
                Concluir
              </Button>
            ) : (
              <Button type="button" size="sm" onClick={() => setTour({ ...tour, index: tour.index + 1 })}>
                Próximo <ChevronRightIcon />
              </Button>
            )}
          </div>
        </section>
      ) : null}
    </HelpContext.Provider>
  );
}

export function HelpButton() {
  const { openHelp } = useHelp();
  return (
    <button
      type="button"
      onClick={openHelp}
      data-help="help"
      aria-label="Ajuda: me mostre como fazer"
      className="flex h-10 items-center gap-2 rounded-full border border-border bg-card px-3 text-sm font-semibold text-foreground outline-none transition-colors hover:border-[var(--gold)] focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
    >
      <CircleHelpIcon className="size-[1.125rem] text-[var(--gold)]" aria-hidden />
      <span className="hidden sm:inline">Ajuda</span>
    </button>
  );
}
