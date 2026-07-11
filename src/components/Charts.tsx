import { Card } from "./ui";

type BarDatum = {
  label: string;
  value: number;
  display?: string;
};

type ProgressDatum = {
  label: string;
  value: number;
  max: number;
  helper?: string;
  tone?: "normal" | "warning" | "danger";
};

export function BarChartCard({
  title,
  subtitle,
  data,
  emptyText = "No chart data yet."
}: {
  title: string;
  subtitle?: string;
  data: BarDatum[];
  emptyText?: string;
}) {
  const maxValue = Math.max(...data.map((item) => item.value), 0);

  return (
    <Card>
      <div className="mb-5">
        <h2 className="text-lg font-bold">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-stone-600">{subtitle}</p> : null}
      </div>
      {data.length ? (
        <div className="flex h-64 items-end gap-3 rounded-lg bg-stone-50 px-4 pb-4 pt-6 ring-1 ring-stone-100">
          {data.map((item) => {
            const height = maxValue > 0 ? Math.max((item.value / maxValue) * 100, item.value > 0 ? 8 : 2) : 2;
            return (
              <div key={item.label} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2">
                <div className="flex min-h-8 items-end justify-center text-center text-xs font-semibold text-stone-600">{item.display ?? item.value}</div>
                <div className="flex h-40 items-end rounded-md bg-white p-1 ring-1 ring-stone-200">
                  <div
                    className="w-full rounded bg-coffee shadow-sm transition-all"
                    style={{ height: `${height}%` }}
                    title={`${item.label}: ${item.display ?? item.value}`}
                  />
                </div>
                <div className="truncate text-center text-xs font-semibold text-stone-600" title={item.label}>
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-stone-300 p-8 text-center text-sm text-stone-600">{emptyText}</div>
      )}
    </Card>
  );
}

export function ProgressChartCard({
  title,
  subtitle,
  data,
  emptyText = "No inventory records yet."
}: {
  title: string;
  subtitle?: string;
  data: ProgressDatum[];
  emptyText?: string;
}) {
  const toneClass = {
    normal: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500"
  };

  return (
    <Card>
      <div className="mb-5">
        <h2 className="text-lg font-bold">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-stone-600">{subtitle}</p> : null}
      </div>
      {data.length ? (
        <div className="grid gap-4">
          {data.map((item) => {
            const percent = item.max > 0 ? Math.min((item.value / item.max) * 100, 100) : 0;
            return (
              <div key={item.label} className="rounded-lg bg-stone-50 p-3 ring-1 ring-stone-100">
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <div>
                    <p className="font-bold text-ink">{item.label}</p>
                    {item.helper ? <p className="text-xs text-stone-500">{item.helper}</p> : null}
                  </div>
                  <p className="font-bold text-coffee">{item.value}</p>
                </div>
                <div className="h-2.5 rounded-full bg-white ring-1 ring-stone-200">
                  <div className={`h-full rounded-full ${toneClass[item.tone ?? "normal"]}`} style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-stone-300 p-8 text-center text-sm text-stone-600">{emptyText}</div>
      )}
    </Card>
  );
}
