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
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {description ? <p className="text-sm text-zinc-600">{description}</p> : null}
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-sm text-zinc-500">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
                {columns.map((column) => (
                  <th
                    key={column.header}
                    className={`py-2 font-medium ${column.align === "right" ? "text-right" : "text-left"}`}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-b border-zinc-100 last:border-0">
                  {columns.map((column) => (
                    <td
                      key={column.header}
                      className={`py-2.5 ${column.align === "right" ? "text-right tabular-nums" : "text-left"}`}
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
