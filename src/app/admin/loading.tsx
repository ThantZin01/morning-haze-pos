import { Shell, Card } from "@/components/ui";

export default function AdminLoading() {
  return (
    <Shell role="ADMIN" title="Loading...">
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="h-[104px] animate-pulse bg-stone-100" />
        ))}
      </div>
      <Card className="mt-5 h-24 animate-pulse bg-stone-100" />
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card className="h-[340px] animate-pulse bg-stone-100" />
        <Card className="h-[340px] animate-pulse bg-stone-100" />
      </div>
    </Shell>
  );
}
