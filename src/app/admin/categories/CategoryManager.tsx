"use client";

import { useState } from "react";
import { Button, StatusPill, Field, Card } from "@/components/ui";
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

  const editingCategory = categories.find((c) => c.categoryId === editingId);

  return (
    <>
      <div className="grid gap-3">
        {categories.map((category) => (
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
        ))}
        {categories.length === 0 && (
          <div className="rounded-lg border border-dashed border-stone-300 p-8 text-center text-stone-500">
            No categories found. Create one to get started.
          </div>
        )}
      </div>

      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md animate-in fade-in zoom-in-95">
            <div className="mb-5 flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-lg font-bold text-stone-800">Edit Category</h3>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="rounded-md p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                title="Cancel editing"
              >
                <X size={20} />
              </button>
            </div>
            <form
              action={(formData) => {
                saveCategoryAction(formData);
                setEditingId(null);
              }}
              className="grid gap-4"
            >
              <input type="hidden" name="categoryId" value={editingCategory.categoryId} />
              <Field label="Category name">
                <input
                  name="categoryName"
                  defaultValue={editingCategory.categoryName}
                  required
                />
              </Field>
              <Field label="Description">
                <textarea
                  name="description"
                  defaultValue={editingCategory.description || ""}
                  rows={3}
                />
              </Field>
              <Field label="Status">
                <select name="status" defaultValue={editingCategory.status}>
                  <option>ACTIVE</option>
                  <option>INACTIVE</option>
                </select>
              </Field>
              <div className="mt-2 flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setEditingId(null)}>
                  Cancel
                </Button>
                <Button type="submit">Save changes</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}
