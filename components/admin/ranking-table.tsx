type Column<T> = {
  header: string;
  align?: "left" | "right";
  cell: (row: T) => React.ReactNode;
};

export function RankingTable<T>({
  title,
  description,
  rows,
  columns,
  emptyMessage,
}: {
  title: string;
  description?: string;
  rows: T[];
  columns: Column<T>[];
  emptyMessage: string;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-[var(--radius-image)] border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold leading-none tracking-tight">{title}</h2>
        {description ? <p className="pt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>

      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <>
          {/* Telas pequenas: cards empilhados, sem scroll horizontal forçado. */}
          <ul className="flex flex-col gap-2 md:hidden">
            {rows.map((row, index) => (
              <li
                key={index}
                className="flex items-start gap-3 rounded-[var(--radius)] border border-border/60 p-3"
              >
                <span
                  className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs tabular-nums ${
                    index < 3 ? "bg-[var(--gold)]/15 font-semibold text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {index + 1}
                </span>
                <div className="flex flex-1 flex-col gap-1">
                  {columns.map((column) => (
                    <div
                      key={column.header}
                      className="flex items-baseline justify-between gap-3 text-sm"
                    >
                      <span className="text-xs text-muted-foreground">{column.header}</span>
                      <span className={column.align === "right" ? "tabular-nums" : ""}>
                        {column.cell(row)}
                      </span>
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>

          {/* Tablet/desktop: tabela convencional. */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  {/* Coluna de posição: rankings pedem numeração explícita (PRD 6.4). */}
                  <th className="w-10 py-2.5 text-left text-xs font-medium text-muted-foreground">#</th>
                  {columns.map((column) => (
                    <th
                      key={column.header}
                      className={`py-2.5 text-xs font-medium text-muted-foreground ${
                        column.align === "right" ? "text-right" : "text-left"
                      }`}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={index}
                    className="group border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/50"
                  >
                    <td className="py-3">
                      {/* Top 3 recebem o acento; o resto fica neutro. */}
                      <span
                        className={`inline-flex size-7 items-center justify-center rounded-full text-xs tabular-nums transition-colors ${
                          index < 3 ? "bg-[var(--gold)]/15 font-semibold text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    {columns.map((column) => (
                      <td
                        key={column.header}
                        className={`py-3 ${column.align === "right" ? "text-right tabular-nums" : "text-left"}`}
                      >
                        {column.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
