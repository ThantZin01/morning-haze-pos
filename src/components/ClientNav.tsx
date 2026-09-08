"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Boxes, Coffee, History, LayoutDashboard, ListTree, ReceiptText, Settings, ShoppingCart, UserRoundCog, Users, type LucideIcon } from "lucide-react";

export function ClientNav({ role }: { role: "ADMIN" | "CASHIER" }) {
  const pathname = usePathname();

  const nav: Array<[string, string, LucideIcon]> =
    role === "ADMIN"
      ? [
          ["Dashboard", "/admin", LayoutDashboard],
          ["Users", "/admin/users", Users],
          ["Categories", "/admin/categories", ListTree],
          ["Menu Items", "/admin/menu-items", Coffee],
          ["Inventory", "/admin/inventory", Boxes],
          ["Reports", "/admin/reports", BarChart3],
          ["History", "/admin/history", History],
          ["Profile", "/profile", Settings]
        ]
      : [
          ["POS", "/cashier", ShoppingCart],
          ["Orders", "/cashier/orders", ReceiptText],
          ["Profile", "/profile", UserRoundCog]
        ];

  return (
    <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3">
      {nav.map(([label, href, Icon]) => {
        const isActive = pathname === href || (href !== "/admin" && href !== "/cashier" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold transition ${
              isActive
                ? "bg-coffee text-white shadow-sm"
                : "text-stone-700 hover:bg-mist hover:text-ink"
            }`}
          >
            <Icon size={16} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
