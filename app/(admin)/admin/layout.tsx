import Link from "next/link";
import { LogoutButton } from "./logout-button";
import { AdminNavLink } from "./admin-nav-link";
import { ShareButton } from "@/components/shared/share-button";
import { getActiveStore } from "@/lib/store/get-active-store";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/categorias", label: "Categorias" },
  { href: "/admin/colecoes", label: "Coleções" },
  { href: "/admin/modelos", label: "Modelos" },
  { href: "/admin/cores", label: "Cores" },
  { href: "/admin/precificacao", label: "Precificação" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/configuracoes", label: "Configurações" },
];

export default async function AdminAreaLayout({ children }: { children: React.ReactNode }) {
  const store = await getActiveStore();
  const storeName = store.name;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="flex items-center justify-between gap-6 px-6 py-4 lg:px-10">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="flex flex-col leading-none">
              <span className="font-[family-name:var(--font-brand)] text-base tracking-tight">
                Blessing
              </span>
              <span className="text-[0.5625rem] uppercase tracking-[0.2em] text-muted-foreground">
                Painel
              </span>
            </Link>

            <nav className="hidden flex-wrap gap-6 md:flex">
              {NAV_ITEMS.map((item) => (
                <AdminNavLink key={item.href} href={item.href} label={item.label} />
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <ShareButton
              url={siteUrl}
              title={storeName}
              message={`Conheça o catálogo da ${storeName}:`}
              label="Compartilhar"
              variant="ghost"
              className="hidden sm:inline-flex"
            />
            <Link
              href="/"
              className="hidden text-[0.6875rem] uppercase tracking-[0.14em] text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:underline focus-visible:underline-offset-4 sm:inline"
            >
              Ver catálogo ↗
            </Link>
            <LogoutButton />
          </div>
        </div>

        {/* Navegação em telas pequenas: rolagem horizontal em vez de quebrar. */}
        <nav className="flex gap-5 overflow-x-auto border-t border-border px-6 py-3 md:hidden">
          {NAV_ITEMS.map((item) => (
            <AdminNavLink key={item.href} href={item.href} label={item.label} className="whitespace-nowrap" />
          ))}
        </nav>
      </header>

      <div className="flex flex-1 flex-col px-6 py-10 lg:px-10">{children}</div>
    </div>
  );
}
