import type { Metadata } from "next";
import { ActionLink } from "@/components/ui/action";

export const metadata: Metadata = {
  title: "Blessing Collection | Catálogo digital para artesãs e lojistas",
  description:
    "Monte seu catálogo digital em minutos e receba pedidos pelo WhatsApp. Para artesãs, boutiques de roupas e lojas de calçados.",
};

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-24 text-center sm:px-10">
      <div className="flex flex-col items-center gap-6">
        <span className="text-[0.625rem] uppercase tracking-[0.22em] text-muted-foreground">
          Blessing Collection
        </span>
        <h1 className="text-[2.5rem] leading-[1.05] tracking-tight sm:text-6xl">
          Seu catálogo digital,
          <br />
          pronto para vender pelo WhatsApp
        </h1>
        <p className="max-w-md text-[0.9375rem] leading-relaxed text-muted-foreground">
          Para artesãs, boutiques de roupas e lojas de calçados. Cadastre suas peças, organize por
          categoria e coleção, e receba pedidos direto no WhatsApp — sem mensalidade de plataforma.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <ActionLink href="/cadastro" variant="solid" arrow>
          Criar minha loja
        </ActionLink>
      </div>
    </main>
  );
}
