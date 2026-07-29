import { getActiveStore } from "@/lib/store/get-active-store";
import { StoreSettingsForm } from "./store-settings-form";

export default async function AdminSettingsPage() {
  const store = await getActiveStore();

  return (
    <div className="flex max-w-md flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-sm text-zinc-600">WhatsApp e redes sociais da loja.</p>
      </div>
      <StoreSettingsForm store={store} />
    </div>
  );
}
