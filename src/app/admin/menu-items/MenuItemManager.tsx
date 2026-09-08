"use client";

import { useState } from "react";
import { Button, StatusPill, Field, Card } from "@/components/ui";
import { saveMenuItemAction, deleteMenuItemAction } from "@/lib/actions";
import { money, statusClass } from "@/lib/format";
import { Pencil, Trash2, X } from "lucide-react";
import Image from "next/image";

type Category = {
  categoryId: number;
  categoryName: string;
};

type MenuItem = {
  menuItemId: number;
  itemName: string;
  categoryId: number;
  description: string | null;
  price: any;
  imageUrl: string | null;
  isAvailable: boolean;
  category: Category;
  inventory: { stockQuantity: number } | null;
  _count: { orderItems: number };
};

export function MenuItemManager({ menuItems, categories }: { menuItems: MenuItem[]; categories: Category[] }) {
  const [editingId, setEditingId] = useState<number | null>(null);

  const editingItem = menuItems.find((item) => item.menuItemId === editingId);

  return (
    <>
      <div className="grid gap-4">
        {menuItems.map((item) => {
          const stockQuantity = item.inventory?.stockQuantity ?? 0;
          const canRemove = stockQuantity === 0;

          return (
            <div key={item.menuItemId} className="flex flex-col gap-4 rounded-lg border border-stone-200 p-4 transition hover:border-stone-300 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-4">
                {item.imageUrl ? (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-stone-100 ring-1 ring-stone-200">
                    <Image src={item.imageUrl} alt={item.itemName} fill className="object-cover" sizes="64px" />
                  </div>
                ) : (
                  <div className="h-16 w-16 shrink-0 rounded-md bg-stone-100 ring-1 ring-stone-200" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-stone-800">{item.itemName}</h3>
                    <StatusPill className={statusClass(item.isAvailable ? "ACTIVE" : "INACTIVE")}>
                      {item.isAvailable ? "Available" : "Unavailable"}
                    </StatusPill>
                  </div>
                  <p className="mt-1 text-sm font-medium text-stone-700">{money(item.price)}</p>
                  {item.description && <p className="mt-1 text-sm text-stone-500">{item.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
                    <p>Category: <span className="font-medium text-stone-700">{item.category.categoryName}</span></p>
                    <p>Stock: <span className="font-medium text-stone-700">{stockQuantity}</span></p>
                    <p>Sold: <span className="font-medium text-stone-700">{item._count.orderItems}</span></p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 sm:items-end">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingId(item.menuItemId)}
                    className="inline-flex h-9 items-center justify-center rounded-md border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 hover:text-stone-900 focus:outline-none focus:ring-2 focus:ring-coffee/20"
                    title="Edit menu item"
                  >
                    <Pencil size={16} className="mr-2" />
                    Edit
                  </button>
                  <form action={deleteMenuItemAction}>
                    <input type="hidden" name="menuItemId" value={item.menuItemId} />
                    <button
                      type="submit"
                      className="inline-flex h-9 items-center justify-center rounded-md bg-rose-50 px-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!canRemove}
                      title={canRemove ? "Apply delete/deactivate rule" : "Set stock to zero before removing this item"}
                      onClick={(e) => {
                        if (!confirm("Are you sure you want to remove this menu item?")) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <Trash2 size={16} className="mr-2" />
                      Delete
                    </button>
                  </form>
                </div>
                {!canRemove && (
                  <p className="text-right text-xs text-stone-500">
                    Stock must be zero to delete.
                  </p>
                )}
              </div>
            </div>
          );
        })}
        {menuItems.length === 0 && (
          <div className="rounded-lg border border-dashed border-stone-300 p-8 text-center text-stone-500">
            No menu items found. Create one to get started.
          </div>
        )}
      </div>

      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md animate-in fade-in zoom-in-95">
            <div className="mb-5 flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-lg font-bold text-stone-800">Edit Menu Item</h3>
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
                saveMenuItemAction(formData);
                setEditingId(null);
              }}
              className="grid gap-4"
              encType="multipart/form-data"
            >
              <input type="hidden" name="menuItemId" value={editingItem.menuItemId} />
              <Field label="Item name">
                <input
                  name="itemName"
                  defaultValue={editingItem.itemName}
                  required
                />
              </Field>
              <Field label="Category">
                <select name="categoryId" defaultValue={editingItem.categoryId}>
                  {categories.map((category) => (
                    <option key={category.categoryId} value={category.categoryId}>
                      {category.categoryName}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Price">
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="100"
                  defaultValue={Number(editingItem.price)}
                  required
                />
              </Field>
              <Field label="Description">
                <textarea
                  name="description"
                  defaultValue={editingItem.description || ""}
                  rows={2}
                />
              </Field>
              <Field label="Image URL">
                <input
                  name="imageUrl"
                  defaultValue={editingItem.imageUrl || ""}
                />
              </Field>
              <Field label="Upload image">
                <input name="image" type="file" accept="image/*" />
              </Field>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input className="w-4" type="checkbox" name="isAvailable" defaultChecked={editingItem.isAvailable} />
                Available
              </label>
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
