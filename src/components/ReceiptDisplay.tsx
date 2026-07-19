"use client";

import { CheckCircle2, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { markReceiptPrintedAction } from "@/lib/actions";
import { dateTime, money } from "@/lib/format";

type ReceiptItem = {
  label: string;
  quantity: number;
  subTotal: number;
};

export function ReceiptDisplay({
  receiptId,
  receiptNumber,
  printedStatus,
  orderId,
  orderDate,
  totalAmount,
  paymentMethod,
  amountPaid,
  changeAmount,
  items
}: {
  receiptId: number;
  receiptNumber: string;
  printedStatus: boolean;
  orderId: number;
  orderDate: string;
  totalAmount: number;
  paymentMethod: string;
  amountPaid: number;
  changeAmount: number;
  items: ReceiptItem[];
}) {
  const router = useRouter();

  const handleOpenPrintPage = () => {
    if (typeof window === "undefined") return;
    router.push(`/cashier/orders/print?receipt=${receiptId}`);
  };

  return (
    <div className="grid gap-4">
      <div className="receipt-paper rounded-2xl border border-stone-300 bg-white p-6 shadow-sm">
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-coffee">Morning Haze Cafe House</p>
          <h3 className="mt-2 text-xl font-black">Receipt</h3>
          <p className="mt-1 text-sm text-stone-500">Order #{orderId}</p>
          <p className="text-xs text-stone-500">{dateTime(new Date(orderDate))}</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">{receiptNumber}</p>
        </div>

        <div className="my-4 border-b border-dashed border-stone-300" />

        <div className="grid gap-2 text-sm">
          {items.map((item) => (
            <div key={`${item.label}-${item.quantity}`} className="flex items-start justify-between gap-3">
              <span className="text-stone-700">
                {item.quantity} x {item.label}
              </span>
              <strong className="shrink-0">{money(item.subTotal)}</strong>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-dashed border-stone-300 pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-600">Total</span>
            <strong>{money(totalAmount)}</strong>
          </div>
          <div className="mt-2 flex justify-between">
            <span className="text-stone-600">Payment</span>
            <strong>{paymentMethod}</strong>
          </div>
          <div className="mt-2 flex justify-between">
            <span className="text-stone-600">Paid</span>
            <strong>{money(amountPaid)}</strong>
          </div>
          <div className="mt-2 flex justify-between">
            <span className="text-stone-600">Change</span>
            <strong>{money(changeAmount)}</strong>
          </div>
        </div>

        <div className="mt-4 rounded-md bg-stone-50 p-3 text-center text-xs text-stone-600">
          Thank you for visiting Morning Haze Cafe House. Please come again.
        </div>
      </div>

      <div className="no-print flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleOpenPrintPage}
          className="inline-flex items-center gap-2 rounded-md bg-coffee px-4 py-2 text-sm font-semibold text-white hover:bg-[#5f422f]"
        >
          <Printer size={16} />
          Print receipt
        </button>

        <form action={markReceiptPrintedAction} className="inline-flex">
          <input type="hidden" name="receiptId" value={receiptId} />
          <button className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">
            <CheckCircle2 size={16} />
            {printedStatus ? "Marked as printed" : "Mark as printed"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => router.push("/cashier")}
          className="inline-flex items-center rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
        >
          Finish sale
        </button>
      </div>
    </div>
  );
}
