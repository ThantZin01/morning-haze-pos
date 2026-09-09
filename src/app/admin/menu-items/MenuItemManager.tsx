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
      <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-stone-50 text-stone-600">
            <tr>
              <th className="p-4 font-semibold">Item</th>
              <th className="p-4 font-semibold">Category</th>
              <th className="p-4 font-semibold">Price</th>
              <th className="p-4 font-semibold">Stock</th>
              <th className="p-4 font-semibold">Sold</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {menuItems.map((item) => {
              const stockQuantity = item.inventory?.stockQuantity ?? 0;
              const canRemove = stockQuantity === 0;
              return (
                <tr key={item.menuItemId} className="transition hover:bg-stone-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-stone-100 ring-1 ring-stone-200">
                          <Image src={item.imageUrl} alt={item.itemName} fill className="object-cover" sizes="40px" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 shrink-0 rounded bg-stone-100 ring-1 ring-stone-200" />
                      )}
                      <div>
                        <div className="font-bold text-stone-800">{item.itemName}</div>
                        {item.description && <div className="text-xs text-stone-500 line-clamp-1">{item.description}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-stone-700">{item.category.categoryName}</td>
                  <td className="p-4 font-medium text-stone-700">{money(item.price)}</td>
                  <td className="p-4 text-stone-700">{stockQuantity}</td>
                  <td className="p-4 text-stone-700">{item._count.orderItems}</td>
                  <td className="p-4">
                    <StatusPill className={statusClass(item.isAvailable ? "ACTIVE" : "INACTIVE")}>
                      {item.isAvailable ? "Available" : "Unavailable"}
                    </StatusPill>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(item.menuItemId)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-600 shadow-sm transition hover:bg-stone-50 hover:text-stone-900 focus:outline-none focus:ring-2 focus:ring-coffee/20"
                        title="Edit menu item"
                      >
                        <Pencil size={14} />
                      </button>
                      <form action={deleteMenuItemAction} className="inline-block">
                        <input type="hidden" name="menuItemId" value={item.menuItemId} />
                        <button
                          type="submit"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-rose-50 text-rose-600 transition hover:bg-rose-100 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={!canRemove}
                          title={canRemove ? "Delete item" : "Stock must be zero to delete"}
                          onClick={(e) => {
                            if (!confirm("Are you sure you want to remove this menu item?")) {
                              e.preventDefault();
                            }
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {menuItems.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-stone-500">
                  No menu items found. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
