import Link from "next/link";
import { LockIcon } from "lucide-react";
import { ShareButton } from "@/components/shared/share-button";
import { InstagramGlyph, WhatsappGlyph } from "@/components/shared/social-icons";
import { buildWhatsappLink } from "@/lib/whatsapp/build-message";

type SiteFooterProps = {
  storeName: string;
  instagramUrl: string | null;
  whatsappNumber: string;
  siteUrl: string;
};

// Link social: pílula com ícone, rótulo e a mesma elevação dos CTAs.
function SocialLink({
  href,
  icon,
  label,
  hint,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3 outline-none transition-all duration-300 hover:border-foreground/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-foreground transition-colors duration-300 group-hover:bg-[var(--gold)] group-hover:text-background">
        {icon}
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[0.6875rem] uppercase tracking-[0.16em]">{label}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </span>
    </a>
  );
}

export function SiteFooter({ storeName, instagramUrl, whatsappNumber, siteUrl }: SiteFooterProps) {
  const year = new Date().getFullYear();

  const whatsappHref = buildWhatsappLink(
    whatsappNumber,
    `Olá! Vim pelo catálogo da ${storeName} e gostaria de mais informações.`,
  );

  // Handle do Instagram a partir da URL, para exibir "@marca" em vez do link cru.
  const instagramHandle = instagramUrl
    ? `@${instagramUrl.replace(/\/+$/, "").split("/").pop()}`
    : null;

  return (
    <footer className="mt-24 border-t border-border px-6 py-16 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-10 text-center">
        <div className="flex flex-col items-center gap-2">
          <span className="font-[family-name:var(--font-brand)] text-2xl leading-none">{storeName}</span>
          <span aria-hidden className="mt-1 h-px w-12 rounded-full bg-[var(--gold)]" />
          <span className="pt-1 text-[0.6875rem] uppercase tracking-[0.18em] text-muted-foreground">
            Bolsas e acessórios artesanais
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <SocialLink
            href={whatsappHref}
            icon={<WhatsappGlyph className="size-4" />}
            label="WhatsApp"
            hint="Fale com a gente"
          />
          {instagramUrl ? (
            <SocialLink
              href={instagramUrl}
              icon={<InstagramGlyph className="size-4" />}
              label="Instagram"
              hint={instagramHandle ?? "Siga a marca"}
            />
          ) : null}
          <ShareButton
            url={siteUrl}
            title={storeName}
            message={`Conheça o catálogo da ${storeName}:`}
            label="Compartilhar"
          />
        </div>

        <div className="flex w-full flex-col items-center gap-4 border-t border-border pt-8 sm:flex-row sm:justify-between">
          <span className="text-[0.6875rem] text-muted-foreground">
            © {year} {storeName}. Todos os direitos reservados.
          </span>

          {/* Acesso da proprietária: discreto, não compete com o catálogo.
              Não é controle de segurança — a proteção real é a RLS. */}
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[0.6875rem] uppercase tracking-[0.14em] text-muted-foreground/70 outline-none transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
          >
            <LockIcon className="size-3" />
            Área da proprietária
          </Link>
        </div>
      </div>
    </footer>
  );
}
