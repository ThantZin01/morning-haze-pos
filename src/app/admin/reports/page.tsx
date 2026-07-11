import { BarChartCard } from "@/components/Charts";
import { Card, Shell } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { dateTime, money } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function ReportsPage() {
  await requireRole("ADMIN");
  const [orders, totals, popular, byCashier] = await Promise.all([
    prisma.order.findMany({ include: { cashier: true, payment: true }, orderBy: { orderDate: "desc" }, take: 25 }),
    prisma.order.aggregate({ _sum: { totalAmount: true }, _count: true, where: { orderStatus: "Completed" } }),
    prisma.orderItem.groupBy({ by: ["menuItemId"], _sum: { quantity: true }, orderBy: { _sum: { quantity: "desc" } }, take: 5 }),
    prisma.order.groupBy({ by: ["cashierId"], _sum: { totalAmount: true }, _count: true })
  ]);
  const menuItems = await prisma.menuItem.findMany({ where: { menuItemId: { in: popular.map((item) => item.menuItemId) } } });
  const cashiers = await prisma.user.findMany({ where: { userId: { in: byCashier.map((item) => item.cashierId) } } });
  const lastSevenDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const value = orders.filter((order) => order.orderDate.toDateString() === date.toDateString()).reduce((sum, order) => sum + Number(order.totalAmount), 0);
    return {
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      value,
      display: money(value)
    };
  });
  const popularChart = popular.map((item) => {
    const menuItem = menuItems.find((entry) => entry.menuItemId === item.menuItemId);
    return {
      label: menuItem?.itemName || `Item ${item.menuItemId}`,
      value: item._sum.quantity || 0
    };
  });

  return (
    <Shell role="ADMIN" title="Sales reports">
      <div className="grid gap-4 md:grid-cols-3">
        <Card><p className="text-sm text-stone-600">Total revenue</p><p className="mt-2 text-3xl font-bold">{money(totals._sum.totalAmount || 0)}</p></Card>
        <Card><p className="text-sm text-stone-600">Completed orders</p><p className="mt-2 text-3xl font-bold">{totals._count}</p></Card>
        <Card><p className="text-sm text-stone-600">Daily sales</p><p className="mt-2 text-3xl font-bold">{money(orders.filter((o) => o.orderDate.toDateString() === new Date().toDateString()).reduce((sum, o) => sum + Number(o.totalAmount), 0))}</p></Card>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <BarChartCard title="Daily sales chart" subtitle="Revenue from recent completed orders." data={lastSevenDays} />
        <BarChartCard title="Popular items chart" subtitle="Top menu items by quantity sold." data={popularChart} />
        <Card>
          <h2 className="mb-4 text-lg font-bold">Transaction records</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-stone-600"><tr><th className="py-2">Date</th><th>Cashier</th><th>Status</th><th>Total</th></tr></thead>
              <tbody>{orders.map((order) => <tr key={order.orderId} className="border-b last:border-0"><td className="py-3">{dateTime(order.orderDate)}</td><td>{order.cashier.fullName}</td><td>{order.orderStatus}</td><td>{money(order.totalAmount)}</td></tr>)}</tbody>
            </table>
          </div>
        </Card>
        <div className="grid gap-5">
          <Card>
            <h2 className="mb-4 text-lg font-bold">Orders by cashier</h2>
            <div className="grid gap-2 text-sm">
              {byCashier.map((item) => <p key={item.cashierId} className="flex justify-between rounded-md bg-stone-50 px-3 py-2"><span>{cashiers.find((c) => c.userId === item.cashierId)?.fullName}</span><strong>{item._count} orders / {money(item._sum.totalAmount || 0)}</strong></p>)}
            </div>
          </Card>
          <Card>
            <h2 className="mb-4 text-lg font-bold">Popular menu items</h2>
            <div className="grid gap-2 text-sm">
              {popular.map((item) => <p key={item.menuItemId} className="flex justify-between rounded-md bg-stone-50 px-3 py-2"><span>{menuItems.find((m) => m.menuItemId === item.menuItemId)?.itemName}</span><strong>{item._sum.quantity || 0} sold</strong></p>)}
            </div>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
