"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UsersError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen grid place-items-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-xl rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-stone-900">Unable to save user</h1>
        <p className="mt-4 text-sm leading-6 text-stone-600">
          {error?.message || "Something went wrong while creating or updating the user. Please try again."}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex w-full justify-center rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm hover:bg-stone-50 sm:w-auto"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/users")}
            className="inline-flex w-full justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 sm:w-auto"
          >
            Back to user list
          </button>
        </div>
      </div>
    </main>
  );
}
