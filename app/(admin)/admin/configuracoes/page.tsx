import { getActiveStore } from "@/lib/store/get-active-store";
import { StoreSettingsForm } from "./store-settings-form";
import { StoreLogoForm } from "./store-logo-form";
import { PageHeading } from "@/components/admin/page-heading";

export default async function AdminSettingsPage() {
  const store = await getActiveStore();

  return (
    <div className="flex max-w-xl flex-col gap-8">
      <PageHeading
        kicker="Sua loja"
        title="Configurações"
        description="WhatsApp, redes sociais e identidade visual."
      />
      <StoreSettingsForm store={store} />
      <StoreLogoForm logoUrl={store.logo_url} />
    </div>
  );
}
