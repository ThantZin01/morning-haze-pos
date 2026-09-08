import { Shell, Card } from "@/components/ui";

export default function CashierLoading() {
  return (
    <Shell role="CASHIER" title="Loading...">
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div>
          <Card className="mb-4 h-14 animate-pulse bg-stone-100" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="h-48 animate-pulse bg-stone-100" />
            ))}
          </div>
        </div>
        <div>
          <Card className="h-[600px] animate-pulse bg-stone-100 sticky top-4" />
        </div>
      </div>
    </Shell>
  );
}
