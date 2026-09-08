"use client";

import { useState } from "react";
import { Button, StatusPill } from "@/components/ui";
import { saveCategoryAction, deleteCategoryAction } from "@/lib/actions";
import { statusClass } from "@/lib/format";
import { Pencil, Trash2, X } from "lucide-react";

type Category = {
  categoryId: number;
  categoryName: string;
  description: string | null;
  status: string;
};

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [editingId, setEditingId] = useState<number | null>(null);

  return (
    <div className="grid gap-3">
      {categories.map((category) => {
        if (editingId === category.categoryId) {
          return (
            <div key={category.categoryId} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-bold text-stone-800">Edit Category</h3>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="rounded-md p-1 text-stone-500 hover:bg-stone-200 hover:text-stone-800"
                  title="Cancel editing"
                >
                  <X size={16} />
                </button>
              </div>
              <form
                action={(formData) => {
                  saveCategoryAction(formData);
                  setEditingId(null);
                }}
                className="grid gap-3 md:grid-cols-[1fr_1.5fr_120px_auto]"
              >
                <input type="hidden" name="categoryId" value={category.categoryId} />
                <input
                  name="categoryName"
                  defaultValue={category.categoryName}
                  required
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-coffee focus:ring-1 focus:ring-coffee"
                />
                <input
                  name="description"
                  defaultValue={category.description || ""}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-coffee focus:ring-1 focus:ring-coffee"
                />
                <select
                  name="status"
                  defaultValue={category.status}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-coffee focus:ring-1 focus:ring-coffee"
                >
                  <option>ACTIVE</option>
                  <option>INACTIVE</option>
                </select>
                <Button type="submit">Update</Button>
              </form>
            </div>
          );
        }

        return (
          <div key={category.categoryId} className="flex flex-col gap-3 rounded-lg border border-stone-200 p-4 transition hover:border-stone-300 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-stone-800">{category.categoryName}</h3>
                <StatusPill className={statusClass(category.status)}>{category.status}</StatusPill>
              </div>
              {category.description && (
                <p className="mt-1 text-sm text-stone-500">{category.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditingId(category.categoryId)}
                className="inline-flex h-9 items-center justify-center rounded-md border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 hover:text-stone-900 focus:outline-none focus:ring-2 focus:ring-coffee/20"
                title="Edit category"
              >
                <Pencil size={16} className="mr-2" />
                Edit
              </button>
              <form action={deleteCategoryAction}>
                <input type="hidden" name="categoryId" value={category.categoryId} />
                <button
                  type="submit"
                  className="inline-flex h-9 items-center justify-center rounded-md bg-rose-50 px-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  title="Delete category"
                  onClick={(e) => {
                    if (!confirm("Are you sure you want to delete this category?")) {
                      e.preventDefault();
                    }
                  }}
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete
                </button>
              </form>
            </div>
          </div>
        );
      })}
      {categories.length === 0 && (
        <div className="rounded-lg border border-dashed border-stone-300 p-8 text-center text-stone-500">
          No categories found. Create one to get started.
        </div>
      )}
    </div>
  );
}
