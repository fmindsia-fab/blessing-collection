import Image from "next/image";

type ThankYouItem = {
  name: string;
  variantName: string | null;
  coverImageUrl: string | null;
};

/**
 * Cartão de agradecimento pós-venda, pronto para print — pedido do usuário:
 * uma peça visual (não um e-mail/texto) para enviar como imagem no WhatsApp
 * depois de uma compra, sem depender de gerar um arquivo de imagem de fato
 * (fora do alcance daqui): a proprietária tira o print desta página.
 *
 * Estilo autocontido (não herda o tema claro/escuro do painel): o resultado
 * do print precisa ser sempre o mesmo cartão pergaminho/dourado, independente
 * do tema que a proprietária estiver usando no admin no momento.
 */
export function ThankYouCard({
  storeName,
  storeLogoUrl,
  customerName,
  items,
  couponCode,
  couponPercent,
  pixKey,
  instagramHandle,
}: {
  storeName: string;
  storeLogoUrl: string | null;
  customerName: string;
  items: ThankYouItem[];
  couponCode: string;
  couponPercent: number;
  pixKey: string | null;
  instagramHandle: string | null;
}) {
  const firstItem = items[0];
  const extraCount = items.length - 1;
  // Cupom = primeiro nome da cliente + percentual, sem espaço (ex: FABIO10).
  const couponLabel = `${couponCode.trim().split(/\s+/)[0].toUpperCase()}${couponPercent}`;

  return (
    <div
      className="relative w-full max-w-xl overflow-hidden rounded-[4px] border px-8 py-12 sm:px-10 sm:py-14"
      style={{
        background: "#fffaf3",
        borderColor: "#e2d2b8",
        color: "#3d2b22",
        fontFamily: "var(--font-card-body), Georgia, 'Times New Roman', serif",
        boxShadow: "0 30px 60px -30px rgba(61, 43, 34, 0.35)",
        backgroundImage:
          "radial-gradient(circle at 8% 6%, rgba(176, 141, 87, 0.06), transparent 40%), radial-gradient(circle at 94% 92%, rgba(181, 113, 74, 0.07), transparent 45%)",
      }}
    >
      {/* Cantos florais em SVG traçado — decorativo, ecoa o material de divulgação da marca. */}
      <Corner className="left-[-18px] top-[-18px]" />
      <Corner className="bottom-[-18px] right-[-18px] rotate-180" />

      <p
        className="text-center text-[10.5px] font-semibold uppercase"
        style={{ letterSpacing: "0.32em", color: "#9c5c3a" }}
      >
        Peça artesanal única
      </p>

      <div className="mt-3.5 flex justify-center">
        {storeLogoUrl ? (
          <Image
            src={storeLogoUrl}
            alt={storeName}
            width={160}
            height={72}
            className="h-16 w-auto max-w-[220px] object-contain"
          />
        ) : (
          <span
            className="relative inline-block text-[2.6rem] leading-none sm:text-[3.4rem]"
            style={{ fontFamily: "var(--font-card-script), cursive", color: "#3d2b22" }}
          >
            {storeName}
          </span>
        )}
      </div>

      <div aria-hidden className="mx-auto my-[22px] h-px w-[46px]" style={{ background: "#b08d57" }} />

      <h1
        className="text-balance text-center text-[1.9rem] leading-[1.15] sm:text-[2.4rem]"
        style={{ fontFamily: "var(--font-card-display), Georgia, serif", fontWeight: 600, color: "#3d2b22" }}
      >
        Obrigada, {customerName.split(" ")[0]}!
        <br />
        <em style={{ fontStyle: "italic", color: "#9c5c3a" }}>foi um prazer te atender</em>
      </h1>

      {firstItem ? (
        <div className="mt-[30px] grid justify-items-center gap-4">
          <div
            className="aspect-square w-[220px] max-w-[60vw] rounded-full p-[10px]"
            style={{
              background: "linear-gradient(145deg, #d9c39a, #b08d57 60%, #9c5c3a)",
              boxShadow: "0 18px 30px -14px rgba(61, 43, 34, 0.4)",
            }}
          >
            <div
              className="flex h-full w-full items-center justify-center overflow-hidden rounded-full"
              style={{ background: "#f6efe4", border: "3px solid #fffaf3" }}
            >
              {firstItem.coverImageUrl ? (
                <Image
                  src={firstItem.coverImageUrl}
                  alt={firstItem.name}
                  width={220}
                  height={220}
                  className="size-full object-cover"
                />
              ) : (
                <BagIcon />
              )}
            </div>
          </div>
          <div className="text-center">
            <p
              className="text-[1.25rem]"
              style={{ fontFamily: "var(--font-card-display), Georgia, serif", fontWeight: 600, color: "#3d2b22" }}
            >
              {firstItem.name}
              {firstItem.variantName ? ` — ${firstItem.variantName}` : ""}
            </p>
            {extraCount > 0 ? (
              <p className="text-[9.5px] uppercase" style={{ letterSpacing: "0.22em", color: "#6b5645" }}>
                + {extraCount} {extraCount === 1 ? "peça" : "peças"} neste pedido
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {items.length > 1 ? (
        <ul className="mx-auto mt-4 flex max-w-[38ch] flex-col gap-1 text-center text-sm" style={{ color: "#6b5645" }}>
          {items.slice(1).map((item, index) => (
            <li key={index}>
              {item.name}
              {item.variantName ? ` — ${item.variantName}` : ""}
            </li>
          ))}
        </ul>
      ) : null}

      <p
        className="mx-auto mt-[26px] max-w-[46ch] text-center text-[1.14rem] leading-[1.6]"
        style={{ color: "#6b5645" }}
      >
        Obrigada por escolher uma peça feita à mão, com tempo e atenção em cada detalhe. Esperamos
        que ela se torne parte das suas próprias histórias.
      </p>
      <p className="mt-[18px] text-center text-[1.7rem]" style={{ fontFamily: "var(--font-card-script), cursive", color: "#9c5c3a" }}>
        com carinho, {storeName}
      </p>

      <div className={`mt-[34px] grid grid-cols-1 gap-3 ${instagramHandle ? "sm:grid-cols-2" : ""}`}>
        <div
          className="flex flex-col items-center gap-1.5 rounded-[3px] border px-3.5 py-4 text-center"
          style={{ borderColor: "#e2d2b8", background: "#f6efe4" }}
        >
          <p className="text-[9.5px] uppercase" style={{ letterSpacing: "0.22em", color: "#6b5645" }}>
            Próxima encomenda
          </p>
          <p
            className="text-[1.5rem] font-bold"
            style={{ fontFamily: "var(--font-card-display), Georgia, serif", color: "#9c5c3a", letterSpacing: "0.02em" }}
          >
            {couponPercent}% OFF
          </p>
          <p className="text-[0.85rem]" style={{ color: "#6b5645" }}>
            Cupom: {couponLabel}
          </p>
        </div>

        {instagramHandle ? (
          <div
            className="flex flex-col items-center gap-1.5 rounded-[3px] border px-3.5 py-4 text-center"
            style={{ borderColor: "#e2d2b8", background: "#f6efe4" }}
          >
            <p className="text-[9.5px] uppercase" style={{ letterSpacing: "0.22em", color: "#6b5645" }}>
              Siga a loja
            </p>
            <p
              className="text-[1.05rem] font-semibold"
              style={{ fontFamily: "var(--font-card-display), Georgia, serif", color: "#3d2b22" }}
            >
              {instagramHandle}
            </p>
            <p className="text-[0.85rem]" style={{ color: "#6b5645" }}>
              Novidades toda semana
            </p>
          </div>
        ) : null}
      </div>

      {pixKey ? (
        <div
          className="mt-3 flex flex-col items-center gap-1 rounded-[3px] border px-4 py-5 text-center"
          style={{ borderColor: "#b08d57", background: "linear-gradient(135deg, #f6efe4, #d9c39a 220%)" }}
        >
          <p
            className="break-words text-[1.5rem] font-bold sm:text-[1.75rem]"
            style={{ fontFamily: "var(--font-card-display), Georgia, serif", color: "#3d2b22" }}
          >
            {pixKey}
          </p>
          <p className="text-[9.5px] uppercase" style={{ letterSpacing: "0.22em", color: "#6b5645" }}>
            PIX CNPJ
          </p>
        </div>
      ) : null}

      <div className="mt-[30px] text-center">
        <p className="text-[9px] uppercase" style={{ letterSpacing: "0.3em", color: "#b08d57" }}>
          Beleza que conecta pessoas
        </p>
      </div>
    </div>
  );
}

function Corner({ className }: { className: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 132 132"
      fill="none"
      stroke="#b08d57"
      strokeWidth="1.1"
      className={`absolute size-[132px] opacity-55 ${className}`}
    >
      <path d="M6 6c18 4 30 16 34 34M6 6c4 18 16 30 34 34M6 6C40 10 62 32 66 66M14 14c-2 10 2 20 10 26M22 22c8 4 14 12 15 22" />
      <circle cx="20" cy="20" r="3.2" fill="#b08d57" stroke="none" />
      <path d="M46 12c6 2 9 8 7 14-6-1-10-6-9-13z" fill="#b08d57" stroke="none" opacity="0.55" />
      <path d="M12 46c2 6 8 9 14 7-1-6-6-10-13-9z" fill="#b08d57" stroke="none" opacity="0.55" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="#b5714a" strokeWidth="2.2" strokeLinecap="round" className="size-[62%]">
      <path d="M28 40 L28 78 Q28 84 34 84 L66 84 Q72 84 72 78 L72 40 Z" />
      <path d="M36 40 V30 Q36 18 50 18 Q64 18 64 30 V40" />
      <path d="M28 52 H72" opacity="0.5" />
    </svg>
  );
}
