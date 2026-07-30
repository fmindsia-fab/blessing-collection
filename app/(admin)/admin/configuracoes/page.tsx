import { getActiveStore } from "@/lib/store/get-active-store";
import { StoreSettingsForm } from "./store-settings-form";
import { StoreLogoForm } from "./store-logo-form";

export default async function AdminSettingsPage() {
  const store = await getActiveStore();

  return (
    <div className="flex max-w-md flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-sm text-zinc-600">WhatsApp, redes sociais e identidade visual da loja.</p>
      </div>
      <StoreSettingsForm store={store} />
      <StoreLogoForm logoUrl={store.logo_url} />
    </div>
  );
}
