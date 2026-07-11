import Link from "next/link";
import Image from "next/image";
import { BarChart3, Boxes, Coffee, History, LayoutDashboard, ListTree, LogOut, ReceiptText, Settings, ShoppingCart, UserRoundCog, Users, type LucideIcon } from "lucide-react";
import { logoutAction } from "@/lib/actions";

export function Button({ children, variant = "primary" }: { children: React.ReactNode; variant?: "primary" | "secondary" | "danger" }) {
  const styles = {
    primary: "bg-coffee text-white shadow-sm hover:bg-[#5f422f]",
    secondary: "bg-white text-ink ring-1 ring-stone-300 hover:bg-stone-50",
    danger: "bg-rose-600 text-white shadow-sm hover:bg-rose-700"
  };
  return <button className={`inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold ${styles[variant]}`}>{children}</button>;
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-stone-200/80 bg-white/95 p-5 shadow-sm shadow-stone-200/70 ${className}`}>{children}</div>;
}

export function StatusPill({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${className}`}>{children}</span>;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-stone-700">
      {label}
      {children}
    </label>
  );
}

export function MetricCard({ label, value, icon }: { label: string; value: React.ReactNode; icon: React.ReactNode }) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-mist" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-stone-600">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-normal text-ink">{value}</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-md bg-coffee text-white shadow-sm">{icon}</div>
      </div>
    </Card>
  );
}

export function Shell({
  role,
  title,
  children
}: {
  role: "ADMIN" | "CASHIER";
  title: string;
  children: React.ReactNode;
}) {
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
    <div className="min-h-screen">
      <header className="border-b border-stone-200/80 bg-white/90 shadow-sm shadow-stone-200/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-stone-200">
              <Image src="/morning-haze-logo.png" alt="Morning Haze Cafe logo" fill className="object-cover" sizes="48px" priority />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-coffee">{role === "ADMIN" ? "Administrator" : "Cashier"}</p>
              <h1 className="text-xl font-bold text-ink">{title}</h1>
            </div>
          </div>
          <form action={logoutAction}>
            <button className="inline-flex h-10 items-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-semibold shadow-sm hover:bg-stone-50" title="Logout">
              <LogOut size={16} />
              Logout
            </button>
          </form>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3">
          {nav.map(([label, href, Icon]) => (
            <Link key={href} href={href} className="inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-mist hover:text-ink">
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
