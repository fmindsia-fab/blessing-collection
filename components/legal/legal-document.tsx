import Image from "next/image";
import Link from "next/link";
import { PALETTE_VARS } from "@/app/(marketing)/craft-palette";
import { LEGAL_EFFECTIVE_DATE } from "@/lib/legal/versions";
import type { LegalSection } from "@/lib/legal/types";

// Página de documento legal (Termos de Uso, Política de Privacidade) no visual da
// landing. Conteúdo vem de lib/legal/*-content.ts: um texto só, sem duplicar.
export function LegalDocument({
  title,
  version,
  intro,
  sections,
  otherDocument,
}: {
  title: string;
  version: string;
  intro: string;
  sections: LegalSection[];
  otherDocument: { href: string; label: string };
}) {
  return (
    <main
      style={PALETTE_VARS}
      className="flex flex-1 flex-col bg-[var(--craft-bg)] text-[var(--craft-ink)]"
    >
      <header className="px-6 pt-5 pb-1 lg:px-10">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" aria-label="AteliFácil, página inicial" className="relative block h-16 w-56">
            <Image
              src="/marketing/logo-atelifacil.png"
              alt="AteliFácil"
              fill
              priority
              className="object-contain object-left"
              sizes="224px"
            />
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-[var(--craft-terracotta)] underline underline-offset-4 outline-none transition-colors hover:text-[var(--craft-ink)] focus-visible:text-[var(--craft-ink)]"
          >
            Voltar ao início
          </Link>
        </div>
      </header>

      <article className="mx-auto w-full max-w-3xl px-6 pt-8 pb-16 lg:px-10">
        <h1 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-[var(--craft-muted)]">
          Versão {version} · em vigor desde {LEGAL_EFFECTIVE_DATE}
        </p>
        <p className="mt-6 text-lg leading-relaxed text-[var(--craft-muted)]">{intro}</p>

        <nav
          aria-label="Neste documento"
          className="mt-8 rounded-2xl border border-[var(--craft-border)] bg-[var(--craft-card)] p-5"
        >
          <p className="mb-2 text-sm font-semibold">Neste documento</p>
          <ol className="grid gap-1 text-sm sm:grid-cols-2">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-[var(--craft-muted)] underline-offset-4 outline-none transition-colors hover:text-[var(--craft-terracotta)] hover:underline focus-visible:text-[var(--craft-terracotta)] focus-visible:underline"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 flex flex-col gap-10">
          {sections.map((section) => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-titulo`} className="scroll-mt-6">
              <h2 id={`${section.id}-titulo`} className="mb-3 text-xl font-semibold tracking-tight">
                {section.title}
              </h2>
              <div className="flex flex-col gap-3 text-base leading-relaxed">
                {section.blocks.map((block, index) =>
                  block.type === "p" ? (
                    <p key={index}>{block.text}</p>
                  ) : (
                    <ul key={index} className="ml-5 list-disc space-y-1.5 marker:text-[var(--craft-terracotta)]">
                      {block.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ),
                )}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-14 border-t border-[var(--craft-border)] pt-6 text-sm text-[var(--craft-muted)]">
          Veja também:{" "}
          <Link
            href={otherDocument.href}
            className="font-semibold text-[var(--craft-terracotta)] underline underline-offset-4 outline-none transition-colors hover:text-[var(--craft-ink)] focus-visible:text-[var(--craft-ink)]"
          >
            {otherDocument.label}
          </Link>
        </p>
      </article>
    </main>
  );
}
