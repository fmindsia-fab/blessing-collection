import { getActiveStore, getSiteUrl } from "@/lib/store/get-active-store";
import { listAllCategoriesForAdmin } from "@/lib/categories/queries";
import { listProductsForPrint } from "@/lib/products/print-queries";
import {
  PRINT_AVAILABILITY_OPTIONS,
  PRINT_PER_SHEET_OPTIONS,
  buildPrintPages,
  matchesAvailability,
  parsePerSheet,
  parsePrintAvailability,
} from "@/lib/catalog/print-sheet";
import { formatWhatsappBR } from "@/lib/customers/phone-mask";
import { PageHeading } from "@/components/admin/page-heading";
import { PrintButton } from "@/components/admin/print-button";
import { PrintCatalogSheets } from "@/components/admin/print-catalog-sheets";
import { ActionLink } from "@/components/ui/action";
import { cn } from "@/lib/utils";

// Pílula de escolha: o input fica escondido e o rótulo marca o selecionado.
const CHOICE_CLASS =
  "inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:border-foreground has-[:checked]:border-foreground has-[:checked]:bg-foreground has-[:checked]:text-background has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--gold)]";

export default async function PrintCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ disponibilidade?: string; porFolha?: string; categoria?: string | string[] }>;
}) {
  const params = await searchParams;
  const availability = parsePrintAvailability(params.disponibilidade);
  const perSheet = parsePerSheet(params.porFolha);

  const store = await getActiveStore();
  const [products, allCategories, siteUrl] = await Promise.all([
    listProductsForPrint(store.id),
    listAllCategoriesForAdmin(store.id),
    getSiteUrl(),
  ]);

  // Só tipos ativos e com peça à venda aparecem como opção; ids desconhecidos na URL são ignorados.
  const categories = allCategories
    .filter((category) => category.status === "active")
    .map((category) => ({ id: category.id, name: category.name }));
  const categoriesWithProducts = categories.filter((category) =>
    products.some((product) => product.categoryId === category.id && matchesAvailability(product, availability)),
  );
  const rawSelected = params.categoria === undefined ? [] : Array.isArray(params.categoria) ? params.categoria : [params.categoria];
  const selectedIds = rawSelected.filter((id) => categories.some((category) => category.id === id));

  const pages = buildPrintPages({ products, categories, availability, categoryIds: selectedIds, perSheet });
  const totalProducts = pages.reduce((sum, page) => sum + page.products.length, 0);
  const counts = {
    todas: products.length,
    "pronta-entrega": products.filter((product) => product.status === "available").length,
    "sob-encomenda": products.filter((product) => product.status === "made_to_order").length,
  };
  const dateLabel = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

  return (
    <div className="flex flex-col gap-6">
      <div className="print:hidden flex flex-col gap-6">
        <PageHeading
          kicker="Catálogo"
          title="Catálogo para imprimir"
          description="Folhas A4 com foto, nome e valor das peças, separadas por tipo. Escolha o que entra e imprima ou salve em PDF."
          action={
            <div className="flex flex-wrap items-center gap-3">
              <ActionLink href="/admin/produtos" variant="outline" className="h-11 px-6">
                Voltar aos produtos
              </ActionLink>
              {pages.length > 0 ? <PrintButton /> : null}
            </div>
          }
        />

        <form className="flex flex-col gap-5 rounded-[var(--radius-image)] border border-border bg-card p-5">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">Quais peças</legend>
            <div className="flex flex-wrap gap-2">
              {PRINT_AVAILABILITY_OPTIONS.map((option) => (
                <label key={option.value} className={CHOICE_CLASS}>
                  <input type="radio" name="disponibilidade" value={option.value} defaultChecked={availability === option.value} className="sr-only" />
                  {option.label}
                  <span className="text-xs opacity-60">{counts[option.value]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {categoriesWithProducts.length > 0 ? (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-medium">
                Tipos <span className="font-normal text-muted-foreground">(nenhum marcado = todos)</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {categoriesWithProducts.map((category) => (
                  <label key={category.id} className={CHOICE_CLASS}>
                    <input type="checkbox" name="categoria" value={category.id} defaultChecked={selectedIds.includes(category.id)} className="sr-only" />
                    {category.name}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">Peças por folha</legend>
            <div className="flex flex-wrap gap-2">
              {PRINT_PER_SHEET_OPTIONS.map((option) => (
                <label key={option} className={CHOICE_CLASS}>
                  <input type="radio" name="porFolha" value={option} defaultChecked={perSheet === option} className="sr-only" />
                  {option} por folha
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              className={cn(
                "inline-flex h-11 items-center rounded-full border border-foreground px-6 text-sm font-medium outline-none transition-colors hover:bg-foreground hover:text-background focus-visible:ring-2 focus-visible:ring-[var(--gold)]",
              )}
            >
              Atualizar prévia
            </button>
            <span className="text-sm text-muted-foreground">
              {totalProducts} {totalProducts === 1 ? "peça" : "peças"} em {pages.length} {pages.length === 1 ? "folha" : "folhas"}
            </span>
          </div>
        </form>

        <p className="text-sm text-muted-foreground">
          Na janela de impressão, escolha &ldquo;Salvar como PDF&rdquo; para gerar o arquivo. Peças esgotadas e inativas não entram.
        </p>
      </div>

      {pages.length === 0 ? (
        <div className="print:hidden flex flex-col items-center gap-2 rounded-[var(--radius-image)] border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma peça para esses filtros.</p>
        </div>
      ) : (
        <PrintCatalogSheets
          pages={pages}
          perSheet={perSheet}
          storeName={store.name}
          logoUrl={store.logo_url}
          whatsapp={formatWhatsappBR(store.whatsapp_number)}
          siteUrl={siteUrl}
          accentColor={store.color_primary}
          dateLabel={dateLabel}
        />
      )}
    </div>
  );
}
