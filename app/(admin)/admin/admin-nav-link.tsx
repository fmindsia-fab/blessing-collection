"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function AdminNavLink({
  href,
  label,
  className,
  onClick,
}: {
  href: string;
  label: string;
  className?: string;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  // "/admin" só está ativo na raiz exata; as demais também nas subrotas.
  const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors",
        isActive ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
        className,
      )}
    >
      {label}
    </Link>
  );
}
