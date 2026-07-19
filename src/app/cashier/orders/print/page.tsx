import { notFound } from "next/navigation";
import { Shell } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { PrintReceiptButton } from "@/components/PrintReceiptButton";

export default async function PrintReceiptPage({ searchParams }: { searchParams: Promise<{ receipt?: string }> }) {
  const cashier = await requireRole("CASHIER");
  const params = await searchParams;
  const receiptId = Number(params.receipt);

  if (!receiptId) notFound();

  const receipt = await prisma.receipt.findUnique({
    where: { receiptId },
    include: {
      order: { include: { orderItems: { include: { menuItem: true } }, payment: true } }
    }
  });

  if (!receipt || receipt.order.cashierId !== cashier.userId) notFound();

  return (
    <Shell role="CASHIER" title="Print receipt">
      <div className="mx-auto max-w-xl rounded-2xl border border-stone-300 bg-white p-6 shadow-sm">
        <div className="mb-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-coffee">Morning Haze Cafe House</p>
          <h2 className="mt-2 text-2xl font-black">Receipt</h2>
          <p className="mt-1 text-sm text-stone-500">Order #{receipt.orderId}</p>
          <p className="text-xs text-stone-500">{new Date(receipt.order.orderDate).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">{receipt.receiptNumber}</p>
        </div>

        <div className="grid gap-2 text-sm">
          {receipt.order.orderItems.map((item) => (
            <div key={item.orderItemId} className="flex items-start justify-between gap-3">
              <span className="text-stone-700">{item.quantity} x {item.menuItem.itemName}</span>
              <strong className="shrink-0">{money(item.subTotal)}</strong>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-dashed border-stone-300 pt-3 text-sm">
          <div className="flex justify-between"><span className="text-stone-600">Total</span><strong>{money(receipt.totalAmount)}</strong></div>
          <div className="mt-2 flex justify-between"><span className="text-stone-600">Payment</span><strong>{receipt.order.payment?.paymentMethod}</strong></div>
          <div className="mt-2 flex justify-between"><span className="text-stone-600">Paid</span><strong>{money(receipt.order.payment?.amountPaid ?? 0)}</strong></div>
          <div className="mt-2 flex justify-between"><span className="text-stone-600">Change</span><strong>{money(receipt.order.payment?.changeAmount ?? 0)}</strong></div>
        </div>

        <div className="mt-6 rounded-md bg-stone-50 p-3 text-center text-xs text-stone-600">
          Thank you for visiting Morning Haze Cafe House. Please come again.
        </div>

        <div className="no-print mt-6 flex flex-wrap gap-2">
          <PrintReceiptButton />
          <a href={`/cashier/orders?receipt=${receipt.receiptId}`} className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">
            Back to receipt
          </a>
        </div>
      </div>
    </Shell>
  );
}
