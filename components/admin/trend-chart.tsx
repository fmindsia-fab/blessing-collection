import type { DailyPoint } from "@/lib/analytics/series";

// Gráfico de barras por dia, sem biblioteca: SVG para as barras e HTML para os textos
// (assim as letras não encolhem no celular). Todos os números vêm de eventos reais.

function formatDay(date: string) {
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
}

export function TrendChart({
  title,
  points,
  singular,
  plural,
}: {
  title: string;
  points: DailyPoint[];
  singular: string;
  plural: string;
}) {
  const total = points.reduce((sum, point) => sum + point.count, 0);
  const max = Math.max(1, ...points.map((point) => point.count));
  const best = points.reduce((a, b) => (b.count > a.count ? b : a), points[0]);
  const step = 100 / points.length;
  const gap = Math.min(step * 0.3, 1.2);
  const middle = points[Math.floor(points.length / 2)];

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">
          Total no período: <strong className="tabular-nums text-foreground">{total}</strong>
        </p>
      </div>

      {total === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          Nenhum registro neste período.
        </p>
      ) : (
        <>
          <div className="relative">
            <span className="absolute left-0 top-0 text-xs text-muted-foreground tabular-nums">{max}</span>
            <svg
              viewBox="0 0 100 40"
              preserveAspectRatio="none"
              role="img"
              aria-label={`${title}. Total ${total}. Maior dia: ${formatDay(best.date)}, com ${best.count}.`}
              className="mt-4 h-40 w-full"
            >
              {/* linhas de apoio: topo, meio e base */}
              {[0, 20, 40].map((y) => (
                <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="var(--border)" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
              ))}
              {points.map((point, index) => {
                const height = (point.count / max) * 40;
                return (
                  <rect
                    key={point.date}
                    x={index * step + gap / 2}
                    y={40 - height}
                    width={Math.max(step - gap, 0.4)}
                    height={height}
                    rx="0.4"
                    fill="var(--gold)"
                    opacity={point.count === 0 ? 0 : 0.9}
                  >
                    <title>{`${formatDay(point.date)}: ${point.count} ${point.count === 1 ? singular : plural}`}</title>
                  </rect>
                );
              })}
            </svg>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>{formatDay(points[0].date)}</span>
            <span>{formatDay(middle.date)}</span>
            <span>{formatDay(points[points.length - 1].date)}</span>
          </div>
        </>
      )}
    </section>
  );
}
