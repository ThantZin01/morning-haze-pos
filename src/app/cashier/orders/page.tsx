import { Card, Shell, StatusPill } from "@/components/ui";
import { ReceiptDisplay } from "@/components/ReceiptDisplay";
import { requireRole } from "@/lib/auth";
import { dateTime, money, statusClass } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function CashierOrdersPage({ searchParams }: { searchParams: Promise<{ receipt?: string }> }) {
  const cashier = await requireRole("CASHIER");
  const params = await searchParams;
  const orders = await prisma.order.findMany({
    where: { cashierId: cashier.userId },
    include: {
      orderItems: { include: { menuItem: true } },
      payment: true,
      receipt: true
    },
    orderBy: { orderDate: "desc" },
    take: 20
  });
  const selectedReceipt = params.receipt ? Number(params.receipt) : orders[0]?.receipt?.receiptId;
  const selected = orders.find((order) => order.receipt?.receiptId === selectedReceipt);

  return (
    <Shell role="CASHIER" title="Orders and receipts">
      <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
        <Card>
          <h2 className="mb-4 text-lg font-bold">Recent orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-stone-600"><tr><th className="py-2">Order</th><th>Date</th><th>Status</th><th>Total</th><th>Receipt</th></tr></thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.orderId} className="border-b last:border-0">
                    <td className="py-3 font-semibold">#{order.orderId}</td>
                    <td>{dateTime(order.orderDate)}</td>
                    <td><StatusPill className={statusClass(order.orderStatus)}>{order.orderStatus}</StatusPill></td>
                    <td>{money(order.totalAmount)}</td>
                    <td>{order.receipt?.receiptNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-bold">Receipt</h2>
          {selected?.receipt && selected.payment ? (
            <ReceiptDisplay
              receiptId={selected.receipt.receiptId}
              receiptNumber={selected.receipt.receiptNumber}
              printedStatus={selected.receipt.printedStatus}
              orderId={selected.orderId}
              orderDate={selected.orderDate.toISOString()}
              totalAmount={Number(selected.totalAmount)}
              paymentMethod={selected.payment.paymentMethod}
              amountPaid={Number(selected.payment.amountPaid)}
              changeAmount={Number(selected.payment.changeAmount)}
              items={selected.orderItems.map((item) => ({
                label: item.menuItem.itemName,
                quantity: item.quantity,
                subTotal: Number(item.subTotal)
              }))}
            />
          ) : (
            <p className="text-sm text-stone-600">No receipt generated yet.</p>
          )}
        </Card>
      </div>
    </Shell>
  );
}
