import { getActiveStore } from "@/lib/store/get-active-store";
import { BackLink } from "@/components/shared/back-link";
import { SelectionReview } from "./selection-review";

export default async function SelectionPage() {
  const store = await getActiveStore();

  return (
    <main className="flex flex-1 flex-col gap-8 px-6 py-12 sm:px-10 lg:px-16">
      <BackLink href="/produtos">Continuar navegando</BackLink>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Minha seleção</h1>
        <p className="text-sm text-zinc-600">
          Revise as peças escolhidas e envie tudo de uma vez pelo WhatsApp.
        </p>
      </div>

      <SelectionReview
        storeId={store.id}
        storeName={store.name}
        storeWhatsapp={store.whatsapp_number}
        siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? ""}
      />
    </main>
  );
}
