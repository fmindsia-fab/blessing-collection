import { cookies } from "next/headers";
import { AdminSidebar, SIDEBAR_COOKIE } from "./admin-sidebar";
import { AdminThemeProvider } from "./theme-provider";
import { ThemeToggle } from "./theme-toggle";
import { TextSizeControl } from "./text-size-control";
import { MobileNav } from "./mobile-nav";
import { PlatformMark } from "@/components/shared/platform-logo";
import { getActiveStore, getSiteUrl } from "@/lib/store/get-active-store";
import {
  DARK_MODE_COOKIE,
  TEXT_SIZE_COOKIE,
  TEXT_SIZE_PERCENT,
  parseTextSize,
} from "@/lib/store/admin-theme";
import { SubscriptionBanner } from "./subscription-banner";
import { OwnershipBanner } from "./ownership-banner";
import { TrialDaysBadge } from "./trial-days-badge";

export default async function AdminAreaLayout({ children }: { children: React.ReactNode }) {
  const store = await getActiveStore();
  const storeName = store.name;
  const siteUrl = await getSiteUrl();

  // Preferências visuais lidas no servidor: o primeiro paint já sai com o tema e a
  // sidebar certos (sem "piscar" claro→escuro).
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get(DARK_MODE_COOKIE)?.value;
  const initialDark = themeCookie === "dark" ? true : themeCookie === "light" ? false : null;
  const textSize = parseTextSize(cookieStore.get(TEXT_SIZE_COOKIE)?.value);
  const sidebarCollapsed = cookieStore.get(SIDEBAR_COOKIE)?.value === "collapsed";

  return (
    <AdminThemeProvider initialDark={initialDark}>
      {/* Tamanho do texto escolhido: escala o rem de toda a página já no primeiro paint. */}
      {textSize !== "normal" ? <style>{`html{font-size:${TEXT_SIZE_PERCENT[textSize]}%}`}</style> : null}
      <div className="flex min-h-screen flex-1">
        <AdminSidebar storeName={storeName} siteUrl={siteUrl} initialCollapsed={sidebarCollapsed} />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-10">
            <div className="flex items-center gap-2 md:hidden">
              <MobileNav storeName={storeName} siteUrl={siteUrl} />
              <span className="flex items-center gap-2 text-base font-semibold tracking-tight">
                <PlatformMark className="size-7 text-foreground [--mark-accent:var(--gold)]" />
                <span className="max-w-[9rem] truncate">{storeName}</span>
              </span>
            </div>
            <div className="hidden min-w-0 flex-col leading-tight md:flex">
              <span className="text-xs text-muted-foreground">Painel da loja</span>
              <span className="truncate text-sm font-semibold">{storeName}</span>
            </div>

            <div className="flex items-center gap-2">
              <TrialDaysBadge storeId={store.id} />
              <TextSizeControl initial={textSize} />
              <ThemeToggle />
            </div>
          </header>

          <OwnershipBanner store={store} />
          <SubscriptionBanner storeId={store.id} />

          <main className="flex flex-1 flex-col px-4 py-8 sm:px-6 lg:px-10 lg:py-10">{children}</main>
        </div>
      </div>
    </AdminThemeProvider>
  );
}
