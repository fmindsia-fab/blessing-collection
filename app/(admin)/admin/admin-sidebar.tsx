"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDownIcon,
  ExternalLinkIcon,
  LogOutIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  SettingsIcon,
} from "lucide-react";
import { ADMIN_NAV_GROUPS, isNavItemActive, type AdminNavItem } from "@/components/admin/nav-config";
import { PlatformMark } from "@/components/shared/platform-logo";
import { ShareButton } from "@/components/shared/share-button";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export const SIDEBAR_COOKIE = "atelifacil-sidebar";

type SidebarProps = {
  storeName: string;
  siteUrl: string;
  /** Fecha o drawer no mobile ao navegar. */
  onNavigate?: () => void;
  collapsed?: boolean;
};

const itemBase =
  "group/item relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[var(--gold)]";

const itemIdle = "text-sidebar-foreground/75 hover:bg-[var(--brand-soft)] hover:text-sidebar-foreground";

function NavItem({
  item,
  collapsed,
  onNavigate,
}: {
  item: AdminNavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = isNavItemActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        itemBase,
        collapsed && "justify-center px-0",
        active ? "bg-[var(--gold)] text-primary-foreground shadow-sm" : itemIdle,
      )}
    >
      <Icon className="size-[1.125rem] shrink-0" aria-hidden />
      {collapsed ? <span className="sr-only">{item.label}</span> : <span className="truncate">{item.label}</span>}
    </Link>
  );
}

function SecondaryGroup({
  label,
  items,
  collapsed,
  onNavigate,
}: {
  label: string;
  items: AdminNavItem[];
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const hasActive = items.some((item) => isNavItemActive(pathname, item.href));
  const [open, setOpen] = useState(false);

  // Sidebar recolhida: os ícones aparecem direto (não há espaço para um disclosure).
  if (collapsed) {
    return (
      <>
        {items.map((item) => (
          <NavItem key={item.href} item={item} collapsed onNavigate={onNavigate} />
        ))}
      </>
    );
  }

  const expanded = open || hasActive;

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={expanded}
        className={cn(itemBase, "text-sidebar-foreground/60 hover:bg-[var(--brand-soft)] hover:text-sidebar-foreground")}
      >
        <ChevronDownIcon
          className={cn("size-[1.125rem] shrink-0 transition-transform duration-200", !expanded && "-rotate-90")}
          aria-hidden
        />
        <span className="truncate">{label}</span>
      </button>
      {expanded ? (
        <div className="ml-4 flex flex-col gap-1 border-l border-sidebar-border pl-2">
          {items.map((item) => (
            <NavItem key={item.href} item={item} collapsed={false} onNavigate={onNavigate} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <Link
      href="/admin"
      aria-label="AteliFácil: início do painel"
      className="flex items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
    >
      {collapsed ? (
        <PlatformMark className="size-9 text-foreground [--mark-accent:var(--gold)]" />
      ) : (
        <>
          {/* Logo oficial (texto marrom escuro): modo claro. */}
          <Image
            src="/marketing/logo-atelifacil.png"
            alt="AteliFácil"
            width={176}
            height={59}
            priority
            className="h-auto w-40 dark:hidden"
          />
          {/* Modo escuro: monograma + palavra, legíveis sobre fundo escuro. */}
          <span className="hidden items-center gap-2 text-xl font-semibold tracking-tight dark:flex">
            <PlatformMark className="size-8 text-foreground [--mark-accent:var(--gold)]" />
            <span>
              Ateli<span className="text-[var(--gold)]">Fácil</span>
            </span>
          </span>
        </>
      )}
    </Link>
  );
}

export function SidebarContent({ storeName, siteUrl, onNavigate, collapsed = false }: SidebarProps) {
  const router = useRouter();
  const initial = storeName.trim().charAt(0).toUpperCase() || "A";

  async function handleLogout() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className={cn("px-1 pt-1", collapsed && "flex justify-center")}>
        <Brand collapsed={collapsed} />
      </div>

      {/* Loja conectada: o nome vem do tenant autenticado, nunca fixo no código. */}
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border border-sidebar-border bg-card/70 p-2.5",
          collapsed && "justify-center border-transparent bg-transparent p-0",
        )}
        title={collapsed ? storeName : undefined}
      >
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-sm font-semibold text-[var(--gold)]"
        >
          {initial}
        </span>
        {collapsed ? null : (
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="text-xs text-sidebar-foreground/60">Loja conectada</span>
            <span className="truncate text-sm font-semibold">{storeName}</span>
          </span>
        )}
      </div>

      <nav aria-label="Menu do painel" className="flex flex-1 flex-col gap-4 overflow-y-auto pr-0.5">
        {ADMIN_NAV_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            {collapsed ? (
              <span aria-hidden className="mx-3 mb-1 h-px bg-sidebar-border" />
            ) : (
              <span className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/55">
                {group.label}
              </span>
            )}
            {group.items.map((item) => (
              <NavItem key={item.href} item={item} collapsed={collapsed} onNavigate={onNavigate} />
            ))}
            {group.secondary ? (
              <SecondaryGroup
                label={group.secondary.label}
                items={group.secondary.items}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ) : null}
          </div>
        ))}
      </nav>

      <div className="flex flex-col gap-1 border-t border-sidebar-border pt-3">
        <NavItem
          item={{ href: "/admin/configuracoes", label: "Configurações", icon: SettingsIcon }}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          title={collapsed ? "Ver catálogo" : undefined}
          className={cn(itemBase, collapsed && "justify-center px-0", itemIdle)}
        >
          <ExternalLinkIcon className="size-[1.125rem] shrink-0" aria-hidden />
          {collapsed ? <span className="sr-only">Ver catálogo</span> : <span>Ver catálogo</span>}
        </a>
        {collapsed ? null : (
          <ShareButton
            url={siteUrl}
            title={storeName}
            message={`Olha o catálogo da ${storeName}, que peças lindas!`}
            label="Compartilhar loja"
            variant="ghost"
            className="h-auto justify-start gap-3 rounded-xl px-3 py-2 text-sm font-medium normal-case tracking-normal text-sidebar-foreground/75 hover:bg-[var(--brand-soft)] hover:text-sidebar-foreground [&_svg]:size-[1.125rem]"
          />
        )}
        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? "Sair" : undefined}
          className={cn(
            itemBase,
            collapsed && "justify-center px-0",
            "text-sidebar-foreground/75 hover:bg-destructive/10 hover:text-destructive",
          )}
        >
          <LogOutIcon className="size-[1.125rem] shrink-0" aria-hidden />
          {collapsed ? <span className="sr-only">Sair</span> : <span>Sair</span>}
        </button>
      </div>
    </div>
  );
}

/** Sidebar fixa do desktop (md+), recolhível; a escolha fica num cookie lido pelo servidor. */
export function AdminSidebar({
  storeName,
  siteUrl,
  initialCollapsed,
}: {
  storeName: string;
  siteUrl: string;
  initialCollapsed: boolean;
}) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "collapsed" : "open"}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 text-sidebar-foreground transition-[width] duration-200 motion-reduce:transition-none md:flex",
        collapsed ? "w-[5.25rem]" : "w-64",
      )}
    >
      <div className="min-h-0 flex-1">
        <SidebarContent storeName={storeName} siteUrl={siteUrl} collapsed={collapsed} />
      </div>
      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
        aria-pressed={collapsed}
        className="mt-3 flex size-9 items-center justify-center self-end rounded-lg text-sidebar-foreground/60 outline-none transition-colors hover:bg-[var(--brand-soft)] hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
      >
        {collapsed ? <PanelLeftOpenIcon className="size-4" /> : <PanelLeftCloseIcon className="size-4" />}
      </button>
    </aside>
  );
}
