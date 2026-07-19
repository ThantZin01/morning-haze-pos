"use client";

import { Minus, Plus, ShoppingCart, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";
import { createOrderAction } from "@/lib/actions";
import { money } from "@/lib/format";
import { Card, Field, StatusPill } from "./ui";

type MenuItem = {
  menuItemId: number;
  itemName: string;
  description: string | null;
  price: string | number;
  categoryName: string;
  stockQuantity: number | null;
  imageUrl?: string | null;
};

export function CashierOrderForm({ menuItems }: { menuItems: MenuItem[] }) {
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  const selectedItems = useMemo(
    () =>
      menuItems
        .map((item) => {
          const quantity = quantities[item.menuItemId] || 0;
          return {
            ...item,
            quantity,
            subTotal: Number(item.price) * quantity
          };
        })
        .filter((item) => item.quantity > 0),
    [menuItems, quantities]
  );

  const totalAmount = selectedItems.reduce((sum, item) => sum + item.subTotal, 0);

  function setQuantity(menuItemId: number, quantity: number, max: number) {
    const nextQuantity = Math.max(0, Math.min(quantity, max));
    setQuantities((current) => ({ ...current, [menuItemId]: nextQuantity }));
  }

  return (
    <form action={createOrderAction} className="grid gap-5 lg:grid-cols-[1fr_380px]">
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Create order</h2>
            <p className="text-sm text-stone-600">Select menu items and review the calculated total before payment.</p>
          </div>
          <StatusPill className={selectedItems.length ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-amber-50 text-amber-700 ring-amber-200"}>
            {selectedItems.length ? "Items Added" : "New Order"}
          </StatusPill>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {menuItems.map((item) => {
            const max = item.stockQuantity ?? 999;
            const quantity = quantities[item.menuItemId] || 0;

            return (
              <div key={item.menuItemId} className={`grid gap-3 rounded-lg border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${quantity > 0 ? "border-coffee bg-mist/70 shadow-emerald-100" : "border-stone-200 bg-white"}`}>
                {item.imageUrl ? (
                  <div className="relative h-32 overflow-hidden rounded-xl bg-stone-100">
                    <img src={item.imageUrl} alt={item.itemName} className="h-full w-full object-cover" />
                  </div>
                ) : null}
                <div>
                  <p className="inline-flex rounded-full bg-stone-100 px-2 py-1 text-xs font-semibold uppercase text-coffee">{item.categoryName}</p>
                  <h3 className="text-base font-bold">{item.itemName}</h3>
                  <p className="mt-1 min-h-10 text-sm text-stone-600">{item.description}</p>
                </div>
                <div className="flex items-center justify-between">
                  <strong className="text-lg text-ink">{money(item.price)}</strong>
                  <span className="rounded-full bg-stone-50 px-2 py-1 text-xs font-semibold text-stone-600 ring-1 ring-stone-200">Stock: {item.stockQuantity ?? "N/A"}</span>
                </div>
                <input type="hidden" name="menuItemId" value={item.menuItemId} />
                <input type="hidden" name="quantity" value={quantity} />
                <div className="flex h-11 items-center justify-between rounded-md border border-stone-300 bg-white px-2">
                  <button
                    type="button"
                    className="grid h-8 w-8 place-items-center rounded-md text-stone-700 hover:bg-stone-100"
                    onClick={() => setQuantity(item.menuItemId, quantity - 1, max)}
                    title="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    className="h-9 w-16 border-0 bg-transparent p-0 text-center font-bold shadow-none ring-0 focus:ring-0"
                    type="number"
                    min="0"
                    max={max}
                    value={quantity}
                    onChange={(event) => setQuantity(item.menuItemId, Number(event.target.value), max)}
                    aria-label={`${item.itemName} quantity`}
                  />
                  <button
                    type="button"
                    className="grid h-8 w-8 place-items-center rounded-md text-stone-700 hover:bg-stone-100"
                    onClick={() => setQuantity(item.menuItemId, quantity + 1, max)}
                    title="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      <Card className="sticky top-5 h-fit">
        <div className="mb-4 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-coffee text-white">
            <ShoppingCart size={18} />
          </div>
          <h2 className="text-lg font-bold">Payment</h2>
        </div>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <p className="text-sm font-semibold text-stone-700">Selected items</p>
            {selectedItems.length ? (
              selectedItems.map((item) => (
                <div key={item.menuItemId} className="flex justify-between rounded-md bg-stone-50 px-3 py-2 text-sm">
                  <span>
                    {item.quantity} x {item.itemName}
                  </span>
                  <strong>{money(item.subTotal)}</strong>
                </div>
              ))
            ) : (
              <p className="rounded-md bg-stone-50 px-3 py-2 text-sm text-stone-600">No item selected.</p>
            )}
          </div>
          <div className="rounded-md bg-coffee p-4 text-white">
            <p className="text-sm font-semibold text-white/80">Total amount</p>
            <p className="mt-1 text-3xl font-bold">{money(totalAmount)}</p>
          </div>
          <Field label="Payment method">
            <select name="paymentMethod">
              <option>Cash</option>
              <option>Card</option>
              <option>Mobile Pay</option>
            </select>
          </Field>
          <input type="hidden" name="amountPaid" value={totalAmount} />
          <div className="flex gap-2 rounded-md bg-stone-50 p-3 text-sm text-stone-700">
            <WalletCards size={18} className="mt-0.5 shrink-0 text-coffee" />
            The payment amount is calculated from selected menu items. No manual total entry is required.
          </div>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-coffee px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#5f422f] disabled:cursor-not-allowed disabled:bg-stone-300"
            disabled={!selectedItems.length}
          >
            {selectedItems.length ? "Confirm order and record payment" : "Select item before payment"}
          </button>
        </div>
      </Card>
    </form>
  );
}
