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
      <div className="flex flex-col items-center gap-2 pb-2 text-center">
        <h2 className="font-[family-name:var(--font-brand)] text-xl leading-none tracking-tight">{title}</h2>
        <span aria-hidden className="h-px w-10 rounded-full bg-[var(--gold)]" />
        {description ? <p className="pt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>

      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                {/* Coluna de posição: rankings pedem numeração explícita (PRD 6.4). */}
                <th className="w-10 py-2.5 text-left text-[0.625rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  #
                </th>
                {columns.map((column) => (
                  <th
                    key={column.header}
                    className={`py-2.5 text-[0.625rem] font-medium uppercase tracking-[0.16em] text-muted-foreground ${
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
                      className={`inline-flex size-7 items-center justify-center rounded-full text-[0.625rem] tabular-nums transition-colors ${
                        index < 3
                          ? "bg-[var(--gold)]/15 font-medium text-foreground"
                          : "text-muted-foreground"
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
      )}
    </section>
  );
}
