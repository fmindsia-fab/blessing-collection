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
    <section className="flex flex-col gap-4">
      <div className="rule-heading flex flex-col gap-1.5">
        <h2 className="font-[family-name:var(--font-brand)] text-xl leading-none tracking-tight">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>

      {rows.length === 0 ? (
        <p className="py-8 text-sm text-muted-foreground">{emptyMessage}</p>
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
                  className="border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/60"
                >
                  <td className="py-3 text-xs tabular-nums text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
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
