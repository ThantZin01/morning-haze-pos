import { Printer } from "lucide-react";
import { Button, Card, Shell, StatusPill } from "@/components/ui";
import { markReceiptPrintedAction } from "@/lib/actions";
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
            <div className="grid gap-4">
              <div className="rounded-md border border-dashed border-stone-300 p-4">
                <div className="text-center">
                  <p className="text-sm font-semibold uppercase text-coffee">Morning Haze Cafe House</p>
                  <h3 className="text-xl font-bold">Receipt</h3>
                  <p className="text-xs text-stone-500">{selected.receipt.receiptNumber}</p>
                </div>
                <div className="mt-4 grid gap-2 text-sm">
                  {selected.orderItems.map((item) => (
                    <p key={item.orderItemId} className="flex justify-between">
                      <span>{item.quantity} x {item.menuItem.itemName}</span>
                      <strong>{money(item.subTotal)}</strong>
                    </p>
                  ))}
                </div>
                <div className="mt-4 border-t pt-3 text-sm">
                  <p className="flex justify-between"><span>Total</span><strong>{money(selected.totalAmount)}</strong></p>
                  <p className="flex justify-between"><span>Payment</span><strong>{selected.payment.paymentMethod}</strong></p>
                  <p className="flex justify-between"><span>Paid</span><strong>{money(selected.payment.amountPaid)}</strong></p>
                  <p className="flex justify-between"><span>Change</span><strong>{money(selected.payment.changeAmount)}</strong></p>
                </div>
              </div>
              <form action={markReceiptPrintedAction}>
                <input type="hidden" name="receiptId" value={selected.receipt.receiptId} />
                <button className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-coffee px-4 py-2 text-sm font-semibold text-white hover:bg-[#5f422f]">
                  <Printer size={16} />
                  {selected.receipt.printedStatus ? "Receipt printed" : "Mark receipt as printed"}
                </button>
              </form>
            </div>
          ) : (
            <p className="text-sm text-stone-600">No receipt generated yet.</p>
          )}
        </Card>
      </div>
    </Shell>
  );
}
