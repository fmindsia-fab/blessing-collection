import Link from "next/link";
import { LockIcon } from "lucide-react";
import { ShareButton } from "@/components/shared/share-button";

type SiteFooterProps = {
  storeName: string;
  instagramUrl: string | null;
  siteUrl: string;
};

export function SiteFooter({ storeName, instagramUrl, siteUrl }: SiteFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border px-6 py-12 sm:px-10 lg:px-16">
      <div className="flex flex-col gap-10">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-2">
            <span className="font-[family-name:var(--font-brand)] text-xl leading-none">{storeName}</span>
            <span className="text-[0.6875rem] uppercase tracking-[0.16em] text-muted-foreground">
              Bolsas e acessórios artesanais
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <ShareButton
              url={siteUrl}
              title={storeName}
              message={`Conheça o catálogo da ${storeName}:`}
              label="Compartilhar catálogo"
            />
            {instagramUrl ? (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[0.6875rem] uppercase tracking-[0.16em] text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:underline focus-visible:underline-offset-4"
              >
                Instagram ↗
              </a>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
          <span className="text-[0.6875rem] text-muted-foreground">
            © {year} {storeName}. Todos os direitos reservados.
          </span>

          {/* Acesso da proprietária: discreto, não compete com o catálogo.
              Não é controle de segurança — a proteção real é a RLS. */}
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-[0.6875rem] uppercase tracking-[0.14em] text-muted-foreground/70 outline-none transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:underline focus-visible:underline-offset-4"
          >
            <LockIcon className="size-3" />
            Área da proprietária
          </Link>
        </div>
      </div>
    </footer>
  );
}
