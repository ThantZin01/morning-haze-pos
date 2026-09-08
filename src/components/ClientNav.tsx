"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type LucideIcon } from "lucide-react";

export function ClientNav({ nav }: { nav: Array<[string, string, LucideIcon]> }) {
  const pathname = usePathname();

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
