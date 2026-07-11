import type { Decimal } from "@prisma/client/runtime/library";

export function money(value: number | string | Decimal) {
  const amount = typeof value === "number" ? value : Number(value);
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)} MMK`;
}

export function dateTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(value);
}

export function statusClass(status: string) {
  if (["ACTIVE", "Completed", "Paid", "Receipt Generated"].includes(status)) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }
  if (["Cancelled", "INACTIVE"].includes(status)) {
    return "bg-rose-50 text-rose-700 ring-rose-200";
  }
  return "bg-amber-50 text-amber-700 ring-amber-200";
}
