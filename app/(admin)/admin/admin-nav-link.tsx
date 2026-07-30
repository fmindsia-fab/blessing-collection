"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function AdminNavLink({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  const pathname = usePathname();
  // "/admin" só está ativo na raiz exata; as demais também nas subrotas.
  const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative pb-1 text-[0.6875rem] uppercase tracking-[0.14em] outline-none transition-colors duration-300 focus-visible:text-foreground",
        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      {label}
      {/* Fio dourado: fixo no item ativo, cresce no hover dos demais. */}
      <span
        aria-hidden
        className={cn(
          "absolute bottom-0 left-0 h-px bg-[var(--gold)] transition-all duration-400 ease-out",
          isActive ? "w-full" : "w-0 group-hover:w-full group-focus-visible:w-full",
        )}
      />
    </Link>
  );
}
