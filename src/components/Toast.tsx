"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { CheckCircle, XCircle, X } from "lucide-react";

type Toast = { id: number; message: string; type: "success" | "error" };

let toastId = 0;

export function Toast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success || error) {
      const message = success
        ? decodeURIComponent(success)
        : decodeURIComponent(error!);
      const type = success ? "success" : "error";

      const id = ++toastId;
      setToasts((prev) => [...prev, { id, message, type }]);

      // Remove the query param from the URL without a page reload
      const params = new URLSearchParams(searchParams.toString());
      params.delete("success");
      params.delete("error");
      const newUrl = params.toString() ? `${pathname}?${params}` : pathname;
      router.replace(newUrl, { scroll: false });

      // Auto-dismiss after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    }
  }, [searchParams, pathname, router]);

  function dismiss(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3" role="region" aria-label="Notifications">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 rounded-xl px-4 py-3.5 shadow-xl ring-1 backdrop-blur-sm transition-all duration-300 min-w-[280px] max-w-sm ${
            toast.type === "success"
              ? "bg-emerald-50/95 ring-emerald-200 text-emerald-900"
              : "bg-rose-50/95 ring-rose-200 text-rose-900"
          }`}
          style={{ animation: "slideIn 0.25s ease-out" }}
        >
          {toast.type === "success" ? (
            <CheckCircle size={20} className="mt-0.5 shrink-0 text-emerald-500" />
          ) : (
            <XCircle size={20} className="mt-0.5 shrink-0 text-rose-500" />
          )}
          <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
          <button
            onClick={() => dismiss(toast.id)}
            className="shrink-0 rounded-md p-0.5 opacity-60 hover:opacity-100"
            aria-label="Dismiss"
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
