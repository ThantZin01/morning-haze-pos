import { Clock3, CreditCard, ReceiptText, ShoppingBag } from "lucide-react";
import { Card, MetricCard, Shell, StatusPill } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { dateTime, money, statusClass } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function OrderHistoryPage() {
  await requireRole("ADMIN");

  const orders = await prisma.order.findMany({
    where: { orderStatus: { in: ["Completed", "Paid", "Receipt Generated"] } },
    include: {
      cashier: true,
      payment: true,
      receipt: true,
      orderItems: {
        include: {
          menuItem: {
            include: { category: true }
          }
        }
      }
    },
    orderBy: { orderDate: "desc" }
  });

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
  const totalItems = orders.reduce((sum, order) => sum + order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
  const latestOrder = orders[0]?.orderDate;

  return (
    <Shell role="ADMIN" title="Sold order history">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Sold orders" value={orders.length} icon={<ReceiptText size={21} />} />
        <MetricCard label="Items sold" value={totalItems} icon={<ShoppingBag size={21} />} />
        <MetricCard label="Revenue" value={money(totalRevenue)} icon={<CreditCard size={21} />} />
        <MetricCard label="Latest sale" value={latestOrder ? dateTime(latestOrder) : "No sales"} icon={<Clock3 size={21} />} />
      </div>

      <Card className="mt-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Order history details</h2>
            <p className="mt-1 text-sm text-stone-600">Review completed sold orders, receipt numbers, payment records, and purchased items.</p>
          </div>
          <StatusPill className="bg-mist text-coffee ring-emerald-100">{orders.length} records</StatusPill>
        </div>

        <div className="grid gap-4">
          {orders.length ? (
            orders.map((order) => (
              <div key={order.orderId} className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 pb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold">Order #{order.orderId}</h3>
                      <StatusPill className={statusClass(order.orderStatus)}>{order.orderStatus}</StatusPill>
                    </div>
                    <p className="mt-1 text-sm text-stone-600">
                      {dateTime(order.orderDate)} | Cashier: {order.cashier.fullName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase text-stone-500">Total amount</p>
                    <p className="text-xl font-bold text-coffee">{money(order.totalAmount)}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_260px]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="text-stone-600">
                        <tr>
                          <th className="py-2">Item</th>
                          <th>Category</th>
                          <th>Qty</th>
                          <th>Unit price</th>
                          <th className="text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.orderItems.map((item) => (
                          <tr key={item.orderItemId} className="border-t border-stone-100">
                            <td className="py-2 font-semibold">{item.menuItem.itemName}</td>
                            <td>{item.menuItem.category.categoryName}</td>
                            <td>{item.quantity}</td>
                            <td>{money(item.unitPrice)}</td>
                            <td className="text-right font-semibold">{money(item.subTotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid gap-2 rounded-md bg-stone-50 p-3 text-sm">
                    <p className="flex justify-between gap-3">
                      <span className="text-stone-600">Receipt</span>
                      <strong>{order.receipt?.receiptNumber || "Not generated"}</strong>
                    </p>
                    <p className="flex justify-between gap-3">
                      <span className="text-stone-600">Payment</span>
                      <strong>{order.payment?.paymentMethod || "N/A"}</strong>
                    </p>
                    <p className="flex justify-between gap-3">
                      <span className="text-stone-600">Paid</span>
                      <strong>{money(order.payment?.amountPaid || 0)}</strong>
                    </p>
                    <p className="flex justify-between gap-3">
                      <span className="text-stone-600">Change</span>
                      <strong>{money(order.payment?.changeAmount || 0)}</strong>
                    </p>
                    <p className="flex justify-between gap-3">
                      <span className="text-stone-600">Printed</span>
                      <strong>{order.receipt?.printedStatus ? "Yes" : "No"}</strong>
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-stone-300 p-8 text-center text-sm text-stone-600">No sold order history yet.</div>
          )}
        </div>
      </Card>
    </Shell>
  );
}
