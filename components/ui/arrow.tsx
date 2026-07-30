import { cn } from "@/lib/utils";

/**
 * Seta em SVG traçado, não o caractere "→".
 * O glyph muda de desenho e peso conforme a fonte da marca escolhida pela
 * proprietária (Playfair, Montserrat, Inter…), então o mesmo link ficava
 * visualmente diferente entre lojas. O traço aqui é sempre o mesmo.
 *
 * A haste cresce no hover do grupo pai — o movimento vem do traço, não de
 * deslocar o ícone inteiro.
 */
export function Arrow({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 12"
      fill="none"
      className={cn("h-2.5 w-6 overflow-visible", className)}
    >
      {/* Haste: estica de 14 para 22 no hover. */}
      <line
        x1="1"
        y1="6"
        x2="14"
        y2="6"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="square"
        className="origin-left transition-[x2] duration-400 ease-out group-hover:[x2:22]"
      />
      {/* Ponta: acompanha a haste. */}
      <polyline
        points="10,1.5 14.5,6 10,10.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="square"
        strokeLinejoin="miter"
        className="transition-transform duration-400 ease-out group-hover:translate-x-[8px]"
      />
    </svg>
  );
}
