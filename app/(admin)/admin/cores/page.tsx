import { getActiveStore } from "@/lib/store/get-active-store";
import { listAllColorsForAdmin } from "@/lib/colors/queries";
import { ColorForm } from "./color-form";
import { ColorRow } from "./color-row";
import { PageHeading } from "@/components/admin/page-heading";
import { PageSection } from "@/components/admin/page-section";
import { EmptyState } from "@/components/admin/empty-state";
import { PaletteIcon } from "lucide-react";

export default async function AdminColorsPage() {
  const store = await getActiveStore();
  const colors = await listAllColorsForAdmin(store.id);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeading
        kicker="Organização"
        title="Cores"
        description="A amostra aparece no filtro do catálogo — ajuste o tom para ficar fiel à peça."
      />

      <PageSection id="novo" title="Nova cor">
        <ColorForm />
      </PageSection>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">
          Suas cores{" "}
          <span className="text-sm font-normal text-muted-foreground">({colors.length})</span>
        </h2>
        {colors.length === 0 ? (
          <EmptyState icon={PaletteIcon}>Nenhuma cor ainda. Cadastre a primeira acima, por exemplo: Marsala, Nude.</EmptyState>
        ) : (
          colors.map((color) => <ColorRow key={color.id} color={color} />)
        )}
      </section>
    </div>
  );
}
