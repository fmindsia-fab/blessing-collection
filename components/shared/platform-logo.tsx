// Marca da plataforma (não confundir com o logo de cada loja/tenant, em
// lib/store/get-active-store.ts — este é sempre "AteliFácil", fixo).
// Monograma simplificado (um "A" com um laço em forma de coração) pensado
// para funcionar pequeno — favicon, header, ícone de app — diferente da
// referência visual mais ornamental usada só como inspiração.

export function PlatformMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <path
        d="M24 6 14 40"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M24 6c6 10 10 22 10 30"
        stroke="var(--mark-accent, currentColor)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M14 40c6-7 14-7 20 0"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M19 26c-2.5-2.6-2.4-5.6.1-7 2-.9 3.9 0 4.9 1.7 1-1.7 2.9-2.6 4.9-1.7 2.5 1.4 2.6 4.4.1 7-1.6 1.7-3.3 3-5 4.3-1.7-1.3-3.4-2.6-5-4.3Z"
        fill="var(--mark-accent, currentColor)"
      />
    </svg>
  );
}

export function PlatformLogo({
  className,
  tagline = false,
}: {
  className?: string;
  tagline?: boolean;
}) {
  return (
    <span className={`inline-flex flex-col ${className ?? ""}`}>
      <span className="inline-flex items-center gap-2">
        <PlatformMark className="size-6 shrink-0 text-[#6b4a3a] [--mark-accent:#c96f4a]" />
        <span className="text-lg font-semibold tracking-tight text-[#6b4a3a]">
          Ateli<span className="text-[#c96f4a]">Fácil</span>
        </span>
      </span>
      {tagline ? (
        <span className="pl-8 text-[0.6875rem] uppercase tracking-[0.12em] text-[#9c7b63]">
          Seu talento merece ser visto. E valorizado.
        </span>
      ) : null}
    </span>
  );
}
