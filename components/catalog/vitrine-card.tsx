import Image from "next/image";
import Link from "next/link";

type VitrineCardProps = {
  href: string;
  name: string;
  coverImageUrl: string | null;
  /** Coleções usam proporção mais alta — mais presença de vitrine. */
  tall?: boolean;
};

/**
 * Card clicável de categoria/coleção com foto de fundo — a "vitrine" da home.
 * A foto vem de um produto sorteado do grupo (lib/catalog/group-covers.ts),
 * já que categorias/coleções não têm upload de imagem própria hoje.
 *
 * Sem foto (grupo ainda sem peça com capa), cai num fundo em textura da
 * marca em vez de um card vazio — mantém a linha de vitrine mesmo assim.
 */
export function VitrineCard({ href, name, coverImageUrl, tall }: VitrineCardProps) {
  return (
    <Link
      href={href}
      className={`group relative block overflow-hidden rounded-[var(--radius-image)] bg-secondary shadow-sm outline-none transition-all duration-500 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-4 focus-visible:ring-offset-background ${
        tall ? "aspect-[3/4]" : "aspect-square"
      }`}
    >
      {coverImageUrl ? (
        <Image
          src={coverImageUrl}
          alt=""
          fill
          className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.08]"
          sizes="(min-width: 1024px) 20vw, (min-width: 640px) 30vw, 50vw"
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 opacity-70 transition-transform duration-[1200ms] ease-out group-hover:scale-[1.08]"
          style={{
            background:
              "radial-gradient(circle at 30% 20%, var(--gold) 0%, transparent 55%), radial-gradient(circle at 80% 80%, oklch(0.42 0.03 40) 0%, transparent 60%)",
          }}
        />
      )}

      {/* Véu sempre presente (mais forte sem foto) — garante contraste do
          nome sobre qualquer imagem, clara ou escura. */}
      <div
        aria-hidden
        className={`absolute inset-0 bg-gradient-to-t transition-colors duration-500 ${
          coverImageUrl
            ? "from-foreground/75 via-foreground/10 to-transparent group-hover:from-foreground/85"
            : "from-foreground/55 via-foreground/15 to-transparent"
        }`}
      />

      <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4 sm:p-5">
        <span className="font-[family-name:var(--font-brand)] text-base leading-tight text-background sm:text-lg">
          {name}
        </span>
        <span className="h-px w-8 origin-left scale-x-75 bg-[var(--gold)] transition-transform duration-500 ease-out group-hover:scale-x-100" />
      </span>
    </Link>
  );
}
