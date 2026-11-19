import type { PerSheet, PrintPage, PrintProduct } from "@/lib/catalog/print-sheet";

// Folhas A4 do catálogo impresso. Cores fixas (papel branco), independentes do tema
// claro/escuro do painel; só o destaque vem da cor da marca da loja.
const INK = "#2a2420";
const MUTED = "#7b7068";
const LINE = "#e8dfd6";
const DEFAULT_ACCENT = "#b5703f";

const STATUS_LABEL: Record<PrintProduct["status"], string> = {
  available: "Pronta entrega",
  made_to_order: "Sob encomenda",
};

const formatPrice = (price: number) => price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Na impressão só as folhas aparecem: o resto do painel fica invisível. As folhas saem do
// fluxo (absolute) para não herdar a altura do painel e gerar páginas em branco.
const PRINT_CSS = `
@page { size: A4 portrait; margin: 0; }
.print-sheet { break-after: page; page-break-after: always; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.print-sheet:last-child { break-after: auto; page-break-after: auto; }
@media print {
  html, body { height: auto !important; min-height: 0 !important; background: #fff !important; }
  body * { visibility: hidden !important; }
  .print-sheets, .print-sheets * { visibility: visible !important; }
  .print-sheets { position: absolute !important; left: 0; top: 0; width: 210mm; margin: 0 !important; padding: 0 !important; gap: 0 !important; background: #fff !important; overflow: visible !important; }
  .print-sheet { zoom: 1 !important; margin: 0 !important; box-shadow: none !important; }
}
`;

function ProductCell({ product, stacked }: { product: PrintProduct; stacked: boolean }) {
  return (
    <div className="flex min-h-0 flex-col gap-[2mm]">
      <div
        className="relative min-h-0 flex-1 overflow-hidden rounded-[3mm]"
        style={{ backgroundColor: LINE }}
      >
        {product.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- <img> comum: o next/image carrega sob demanda e a foto poderia faltar na impressão.
          <img
            src={product.coverUrl}
            alt={product.name}
            loading="eager"
            decoding="sync"
            className="size-full object-cover"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-[3mm]" style={{ color: MUTED }}>
            Sem imagem
          </span>
        )}
        <span
          className="absolute left-[2.5mm] top-[2.5mm] rounded-full bg-white/95 px-[2.5mm] py-[0.8mm] text-[2.6mm] font-medium uppercase tracking-[0.08em]"
          style={{ color: INK }}
        >
          {STATUS_LABEL[product.status]}
        </span>
      </div>
      <div className={stacked ? "flex flex-col gap-[0.5mm]" : "flex items-baseline justify-between gap-[3mm]"}>
        <p className="line-clamp-2 min-w-0 font-[family-name:var(--font-brand)] text-[4mm] leading-tight" style={{ color: INK }}>
          {product.name}
        </p>
        <p className="shrink-0 text-[3.8mm] font-semibold tabular-nums" style={{ color: INK }}>
          {product.fromPrice ? <span className="mr-[1mm] text-[2.6mm] font-normal" style={{ color: MUTED }}>a partir de</span> : null}
          {formatPrice(product.price)}
        </p>
      </div>
    </div>
  );
}

export type PrintClosing = {
  /** QR do endereço do catálogo. */
  catalog: { qrSrc: string; label: string };
  /** QR do Pix (copia e cola) e a chave por extenso; ausente quando a loja não tem chave Pix. */
  pix?: { qrSrc: string; keyLabel: string };
};

function QrBlock({ src, title, line, hint }: { src: string; title: string; line: string; hint: string }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-[4mm]">
      {/* eslint-disable-next-line @next/next/no-img-element -- QR em SVG embutido; <img> comum garante que saia na impressão. */}
      <img src={src} alt={`QR Code: ${title}`} className="size-[32mm] shrink-0 rounded-[1.5mm] border bg-white p-[1mm]" style={{ borderColor: LINE }} />
      <div className="flex min-w-0 flex-col gap-[1mm]">
        <span className="text-[4mm] font-semibold leading-tight" style={{ color: INK }}>{title}</span>
        <span className="break-all text-[3.2mm] font-medium leading-tight" style={{ color: INK }}>{line}</span>
        <span className="text-[2.8mm] leading-tight" style={{ color: MUTED }}>{hint}</span>
      </div>
    </div>
  );
}

export function PrintCatalogSheets({
  pages,
  perSheet,
  storeName,
  logoUrl,
  whatsapp,
  siteUrl,
  accentColor,
  dateLabel,
  closing,
}: {
  pages: PrintPage[];
  perSheet: PerSheet;
  storeName: string;
  logoUrl: string | null;
  whatsapp: string;
  siteUrl: string;
  accentColor: string | null;
  dateLabel: string;
  /** QR Codes da última folha; sem ele a última folha é igual às outras. */
  closing?: PrintClosing;
}) {
  const accent = accentColor || DEFAULT_ACCENT;
  const gridClass = perSheet === 6 ? "grid-cols-3" : "grid-cols-2";
  const hasMadeToOrder = (page: PrintPage) => page.products.some((product) => product.status === "made_to_order");

  return (
    <>
      <style>{PRINT_CSS}</style>
      <div className="print-sheets flex flex-col items-center gap-6 overflow-x-auto rounded-[var(--radius-image)] bg-neutral-200 p-4 print:p-0">
        {pages.map((page, index) => (
          <section
            key={`${page.categoryName}-${index}`}
            className="print-sheet flex h-[296mm] w-[210mm] shrink-0 flex-col overflow-hidden bg-white px-[12mm] py-[10mm] shadow-lg max-md:[zoom:0.45]"
            style={{ color: INK }}
          >
            <header className="flex items-center justify-between gap-[6mm] border-b pb-[4mm]" style={{ borderColor: accent }}>
              <div className="flex min-w-0 items-center gap-[4mm]">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- ver acima.
                  <img src={logoUrl} alt="" loading="eager" decoding="sync" className="h-[12mm] w-auto max-w-[30mm] object-contain" />
                ) : null}
                <span className="truncate font-[family-name:var(--font-brand)] text-[6mm] leading-none">{storeName}</span>
              </div>
              <span className="shrink-0 text-[3.2mm] font-medium uppercase tracking-[0.2em]" style={{ color: MUTED }}>
                {page.categoryName}
              </span>
            </header>

            <div className={`mt-[5mm] grid min-h-0 flex-1 grid-rows-2 gap-x-[6mm] gap-y-[5mm] ${gridClass}`}>
              {page.products.map((product) => (
                <ProductCell key={product.id} product={product} stacked={perSheet === 6} />
              ))}
            </div>

            {closing && index === pages.length - 1 ? (
              <div className="mt-[5mm] flex items-center gap-[6mm] border-t pt-[4mm]" style={{ borderColor: accent }}>
                <QrBlock
                  src={closing.catalog.qrSrc}
                  title="Veja o catálogo completo"
                  line={closing.catalog.label}
                  hint="Aponte a câmera do celular para abrir."
                />
                {closing.pix ? (
                  <QrBlock
                    src={closing.pix.qrSrc}
                    title="Pague com Pix"
                    line={closing.pix.keyLabel}
                    hint="Aponte no aplicativo do seu banco e informe o valor."
                  />
                ) : null}
              </div>
            ) : null}

            <footer
              className="mt-[4mm] flex items-end justify-between gap-[6mm] border-t pt-[3mm] text-[2.8mm]"
              style={{ borderColor: LINE, color: MUTED }}
            >
              <div className="flex min-w-0 flex-col gap-[0.6mm]">
                <span>
                  WhatsApp <strong style={{ color: INK }}>{whatsapp}</strong>
                  {siteUrl ? <> · {siteUrl.replace(/^https?:\/\//, "")}</> : null}
                </span>
                {hasMadeToOrder(page) ? (
                  <span>Peças sob encomenda: valores de referência, sujeitos a confirmação conforme os materiais.</span>
                ) : null}
              </div>
              <span className="shrink-0 tabular-nums">
                {dateLabel} · folha {index + 1} de {pages.length}
              </span>
            </footer>
          </section>
        ))}
      </div>
    </>
  );
}
