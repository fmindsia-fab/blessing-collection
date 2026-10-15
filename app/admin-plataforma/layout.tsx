import { notFound } from "next/navigation";
import Link from "next/link";
import { isPlatformAdmin } from "@/lib/platform/get-platform-admin";
import { LogoutButton } from "@/app/(admin)/admin/logout-button";
import { PlatformMark } from "@/components/shared/platform-logo";

// Área do dono da plataforma (não de uma loja) — nunca dentro do domínio ou
// subdomínio de uma loja. proxy.ts já bloqueia /admin-plataforma para quem
// não é platform admin; esta checagem aqui é defesa em profundidade (ex. um
// Server Component chamado diretamente, sem passar pelo proxy de alguma
// forma inesperada).
export default async function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await isPlatformAdmin();
  if (!isAdmin) notFound();

  return (
    <div className="flex min-h-full flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="flex items-center justify-between gap-6 px-6 py-4 lg:px-10">
          <Link href="/admin-plataforma" className="flex flex-col gap-1 leading-none">
            <span className="flex items-center gap-2">
              <PlatformMark className="size-5 shrink-0 text-foreground [--mark-accent:var(--gold)]" />
              <span className="text-base font-semibold tracking-tight">AteliFácil</span>
            </span>
            <span className="text-xs text-muted-foreground">Administração da plataforma</span>
          </Link>
          <LogoutButton />
        </div>
      </header>
      <div className="flex flex-1 flex-col px-6 py-10 lg:px-10">{children}</div>
    </div>
  );
}
