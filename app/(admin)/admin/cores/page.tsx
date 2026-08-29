import { getActiveStore } from "@/lib/store/get-active-store";
import { listAllColorsForAdmin } from "@/lib/colors/queries";
import { ColorForm } from "./color-form";
import { ColorRow } from "./color-row";
import { PageHeading } from "@/components/admin/page-heading";

export default async function AdminColorsPage() {
  const store = await getActiveStore();
  const colors = await listAllColorsForAdmin(store.id);

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        kicker="Organização"
        title="Cores"
        description="A amostra aparece no filtro do catálogo — ajuste o tom para ficar fiel à peça."
      />

      <div className="mx-auto w-full max-w-md rounded-[var(--radius-image)] border border-border bg-card p-6 shadow-sm">
        <ColorForm />
      </div>

      <div className="flex flex-col gap-3">
        {colors.length === 0 ? (
          <p className="rounded-[var(--radius-image)] border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            Nenhuma cor cadastrada ainda.
          </p>
        ) : (
          colors.map((color) => <ColorRow key={color.id} color={color} />)
        )}
      </div>
    </div>
  );
}
