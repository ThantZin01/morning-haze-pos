import { BarChart3, Boxes, Coffee, Users } from "lucide-react";
import { BarChartCard, ProgressChartCard } from "@/components/Charts";
import { Shell, MetricCard, Card } from "@/components/ui";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export default async function AdminDashboard() {
  await requireRole("ADMIN");
  const [users, menuItems, inventory, sales, completedOrders] = await Promise.all([
    prisma.user.count(),
    prisma.menuItem.count(),
    prisma.inventory.findMany({ include: { menuItem: true }, orderBy: { stockQuantity: "asc" } }),
    prisma.order.aggregate({ _sum: { totalAmount: true }, _count: true, where: { orderStatus: "Completed" } }),
    prisma.order.findMany({ where: { orderStatus: "Completed" }, orderBy: { orderDate: "desc" }, take: 50 })
  ]);
  const lowStock = inventory.filter((item) => item.stockQuantity <= item.reorderLevel).length;
  const recentDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toDateString();
    const value = completedOrders.filter((order) => order.orderDate.toDateString() === key).reduce((sum, order) => sum + Number(order.totalAmount), 0);
    return {
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      value,
      display: money(value)
    };
  });
  const stockSnapshot = inventory.slice(0, 5).map((item) => ({
    label: item.menuItem.itemName,
    value: item.stockQuantity,
    max: Math.max(item.stockQuantity, item.reorderLevel * 2, 1),
    helper: `Reorder at ${item.reorderLevel}`,
    tone: item.stockQuantity === 0 ? "danger" as const : item.stockQuantity <= item.reorderLevel ? "warning" as const : "normal" as const
  }));

  return (
    <Shell role="ADMIN" title="Admin dashboard overview">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Users" value={users} icon={<Users size={21} />} />
        <MetricCard label="Menu items" value={menuItems} icon={<Coffee size={21} />} />
        <MetricCard label="Low stock" value={lowStock} icon={<Boxes size={21} />} />
        <MetricCard label="Revenue" value={money(sales._sum.totalAmount || 0)} icon={<BarChart3 size={21} />} />
      </div>
      <Card className="mt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Morning Haze Cafe House</h2>
            <p className="mt-1 text-sm text-stone-600">Use the navigation above to manage accounts, menu setup, stock, and sales reports.</p>
          </div>
          <div className="rounded-md bg-mist px-4 py-3 text-sm font-semibold text-coffee ring-1 ring-emerald-100">System ready</div>
        </div>
      </Card>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <BarChartCard title="Recent sales" subtitle="Completed order revenue across the last 7 days." data={recentDays} />
        <ProgressChartCard title="Inventory watch" subtitle="Lowest stock items compared with reorder levels." data={stockSnapshot} />
      </div>
    </Shell>
  );
}
