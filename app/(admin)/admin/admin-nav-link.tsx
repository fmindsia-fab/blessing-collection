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
        "relative pb-0.5 text-[0.6875rem] uppercase tracking-[0.14em] transition-colors",
        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      {label}
      {isActive ? (
        <span aria-hidden className="absolute -bottom-0.5 left-0 h-px w-full bg-[var(--gold)]" />
      ) : null}
    </Link>
  );
}
