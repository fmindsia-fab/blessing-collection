import Link from "next/link";

// Links para os documentos legais. Usados no rodapé da landing e nas telas de
// login e cadastro. Caminhos relativos: funcionam no domínio da plataforma e nos
// subdomínios das lojas.
export function LegalLinks({ className }: { className?: string }) {
  const linkClass =
    "underline underline-offset-4 outline-none transition-colors hover:text-foreground focus-visible:text-foreground";

  return (
    <nav aria-label="Documentos legais" className={className}>
      <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <li>
          <Link href="/termos" className={linkClass}>
            Termos de Uso
          </Link>
        </li>
        <li>
          <Link href="/privacidade" className={linkClass}>
            Política de Privacidade
          </Link>
        </li>
      </ul>
    </nav>
  );
}
