import { getStoreBySlug } from "@/lib/store/get-store-by-slug";
import { BackLink } from "@/components/shared/back-link";
import { SelectionReview } from "./selection-review";

export default async function SelectionPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const store = await getStoreBySlug(storeSlug);

  return (
    <main className="flex flex-1 flex-col gap-8 px-6 py-12 sm:px-10 lg:px-16">
      <BackLink href={`/loja/${storeSlug}/produtos`}>Continuar navegando</BackLink>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Minha seleção</h1>
        <p className="text-sm text-zinc-600">
          Revise as peças escolhidas e envie tudo de uma vez pelo WhatsApp.
        </p>
      </div>

      <SelectionReview
        storeId={store.id}
        storeSlug={storeSlug}
        storeName={store.name}
        storeWhatsapp={store.whatsapp_number}
        siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? ""}
      />
    </main>
  );
}
