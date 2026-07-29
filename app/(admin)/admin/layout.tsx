import Link from "next/link";
import { LogoutButton } from "./logout-button";

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
      <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
        <nav className="flex flex-wrap gap-4 text-sm">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="text-zinc-600 hover:text-zinc-900">
              {item.label}
            </Link>
          ))}
        </nav>
        <LogoutButton />
      </header>
      <div className="flex flex-1 flex-col px-6 py-8">{children}</div>
    </div>
  );
}
