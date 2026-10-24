import { getActiveStore, getSiteUrl } from "@/lib/store/get-active-store";
import { BackLink } from "@/components/shared/back-link";
import { SelectionReview } from "./selection-review";

// "Sacola": as peças que a cliente separou para pedir. Não há pagamento no site: ela revisa e
// envia a lista pelo WhatsApp para combinar valores, prazo e entrega com a loja.
export default async function BagPage() {
  const store = await getActiveStore();

  return (
    <main className="flex flex-1 flex-col gap-10 px-6 py-12 sm:px-10 lg:px-16">
      <BackLink href="/produtos">Continuar vendo peças</BackLink>

      <div className="flex flex-col items-center gap-3 text-center">
        <span className="kicker">Suas escolhas</span>
        <h1 className="font-[family-name:var(--font-brand)] text-4xl leading-none tracking-tight sm:text-5xl">
          Minha sacola
        </h1>
        <span aria-hidden className="h-px w-12 rounded-full bg-[var(--gold)]" />
        <p className="max-w-md text-base leading-relaxed text-muted-foreground">
          Revise as peças que você escolheu e envie tudo de uma vez pelo WhatsApp para combinar com a loja.
        </p>
      </div>

      <SelectionReview
        storeId={store.id}
        storeName={store.name}
        storeWhatsapp={store.whatsapp_number}
        siteUrl={await getSiteUrl()}
      />
    </main>
  );
}
