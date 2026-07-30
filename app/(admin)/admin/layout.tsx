import Link from "next/link";
import { LogoutButton } from "./logout-button";
import { AdminNavLink } from "./admin-nav-link";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/categorias", label: "Categorias" },
  { href: "/admin/colecoes", label: "Coleções" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/configuracoes", label: "Configurações" },
];

export default function AdminAreaLayout({ children }: { children: React.ReactNode }) {
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
            <Link
              href="/"
              className="hidden text-[0.6875rem] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground sm:inline"
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
