"use client";

import { useState } from "react";
import { AlertTriangle, Trash2, Pencil } from "lucide-react";
import { ProgressChartCard } from "@/components/Charts";
import { Button, Card, Field, StatusPill } from "@/components/ui";
import { saveInventoryAction, saveRawMaterialAction, deleteRawMaterialAction } from "@/lib/actions";
import { dateTime } from "@/lib/format";

type MenuItem = { menuItemId: number; itemName: string };
type InventoryRecord = {
  inventoryId: number;
  menuItemId: number;
  stockQuantity: number;
  reorderLevel: number;
  unit: string;
  lastUpdated: Date;
  menuItem: MenuItem;
};
type RawMaterialRecord = {
  materialId: number;
  name: string;
  stockQuantity: number;
  reorderLevel: number;
  unit: string;
  lastUpdated: Date;
};

export function InventoryManager({
  menuItems,
  inventory,
  rawMaterials
}: {
  menuItems: MenuItem[];
  inventory: InventoryRecord[];
  rawMaterials: RawMaterialRecord[];
}) {
  const [stockType, setStockType] = useState<"MENU_ITEM" | "RAW_MATERIAL">("MENU_ITEM");
  const [editingRawMaterial, setEditingRawMaterial] = useState<RawMaterialRecord | null>(null);

  const inventoryChart = [
    ...inventory.map((record) => ({
      label: record.menuItem.itemName,
      value: record.stockQuantity,
      max: Math.max(record.stockQuantity, record.reorderLevel * 2, 1),
      helper: `${record.unit} | reorder at ${record.reorderLevel}`,
      tone: record.stockQuantity === 0 ? ("danger" as const) : record.stockQuantity <= record.reorderLevel ? ("warning" as const) : ("normal" as const)
    })),
    ...rawMaterials.map((record) => ({
      label: record.name,
      value: record.stockQuantity,
      max: Math.max(record.stockQuantity, record.reorderLevel * 2, 1),
      helper: `${record.unit} | reorder at ${record.reorderLevel}`,
      tone: record.stockQuantity === 0 ? ("danger" as const) : record.stockQuantity <= record.reorderLevel ? ("warning" as const) : ("normal" as const)
    }))
  ]
    .sort((a, b) => a.value - b.value)
    .slice(0, 8);

  return (
    <>
      <div className="mb-5 grid gap-5 lg:grid-cols-[360px_1fr]">
        <Card className="h-fit">
          <h2 className="mb-4 text-lg font-bold">
            {editingRawMaterial ? "Edit raw material" : "Update stock"}
          </h2>
          
          {!editingRawMaterial && (
            <div className="mb-4 flex rounded-md border border-stone-200 p-1">
              <button
                className={`flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition ${stockType === "MENU_ITEM" ? "bg-stone-100 text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
                onClick={() => setStockType("MENU_ITEM")}
              >
                Menu Item
              </button>
              <button
                className={`flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition ${stockType === "RAW_MATERIAL" ? "bg-stone-100 text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
                onClick={() => setStockType("RAW_MATERIAL")}
              >
                Raw Material
              </button>
            </div>
          )}

          {stockType === "MENU_ITEM" && !editingRawMaterial ? (
            <form action={saveInventoryAction} className="grid gap-3">
              <Field label="Menu item">
                <select name="menuItemId">
                  {menuItems.map((item) => (
                    <option key={item.menuItemId} value={item.menuItemId}>
                      {item.itemName}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Stock quantity to add/remove">
                <input name="stockQuantity" type="number" required />
              </Field>
              <Field label="Reorder level">
                <input name="reorderLevel" type="number" min="0" required />
              </Field>
              <Field label="Unit">
                <input name="unit" placeholder="cups, pieces, packs" required />
              </Field>
              <Button>Save menu item stock</Button>
            </form>
          ) : (
            <form
              action={(formData) => {
                saveRawMaterialAction(formData);
                setEditingRawMaterial(null);
              }}
              className="grid gap-3"
            >
              {editingRawMaterial && (
                <input type="hidden" name="materialId" value={editingRawMaterial.materialId} />
              )}
              <Field label="Raw material name">
                <input
                  name="name"
                  placeholder="e.g. Sugar, Coffee Beans"
                  defaultValue={editingRawMaterial?.name || ""}
                  required
                />
              </Field>
              <Field label={editingRawMaterial ? "Stock quantity to add/remove" : "Initial stock quantity"}>
                <input
                  name="stockQuantity"
                  type="number"
                  defaultValue={editingRawMaterial ? 0 : ""}
                  required
                />
              </Field>
              <Field label="Reorder level">
                <input
                  name="reorderLevel"
                  type="number"
                  min="0"
                  defaultValue={editingRawMaterial?.reorderLevel || ""}
                  required
                />
              </Field>
              <Field label="Unit">
                <input
                  name="unit"
                  placeholder="kg, ml, packs"
                  defaultValue={editingRawMaterial?.unit || ""}
                  required
                />
              </Field>
              <div className="flex gap-2">
                <Button className="flex-1">
                  {editingRawMaterial ? "Save changes" : "Create & add stock"}
                </Button>
                {editingRawMaterial && (
                  <Button type="button" variant="secondary" onClick={() => setEditingRawMaterial(null)}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          )}
        </Card>

        <div className="grid gap-5">
          <Card>
            <h2 className="mb-4 text-lg font-bold">Menu Item Stock</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b text-stone-600">
                  <tr>
                    <th className="py-2">Item</th>
                    <th>Quantity</th>
                    <th>Reorder</th>
                    <th>Unit</th>
                    <th>Last updated</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((record) => {
                    const low = record.stockQuantity <= record.reorderLevel;
                    return (
                      <tr key={record.inventoryId} className="border-b last:border-0">
                        <td className="py-3 font-medium">
                          <span className="inline-flex items-center gap-2">
                            {low ? <AlertTriangle size={16} className="text-amber-600" /> : null}
                            {record.menuItem.itemName}
                          </span>
                        </td>
                        <td>{record.stockQuantity}</td>
                        <td>{record.reorderLevel}</td>
                        <td>{record.unit}</td>
                        <td>{dateTime(record.lastUpdated)}</td>
                        <td>
                          {low ? (
                            <StatusPill className="bg-amber-50 text-amber-700 ring-amber-200">
                              Low stock
                            </StatusPill>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                  {inventory.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-stone-500">
                        No menu items found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-bold">Raw Material Stock</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b text-stone-600">
                  <tr>
                    <th className="py-2">Material</th>
                    <th>Quantity</th>
                    <th>Reorder</th>
                    <th>Unit</th>
                    <th>Last updated</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rawMaterials.map((record) => {
                    const low = record.stockQuantity <= record.reorderLevel;
                    return (
                      <tr key={record.materialId} className="border-b last:border-0">
                        <td className="py-3 font-medium">
                          <span className="inline-flex items-center gap-2">
                            {low ? <AlertTriangle size={16} className="text-amber-600" /> : null}
                            {record.name}
                          </span>
                        </td>
                        <td>{record.stockQuantity}</td>
                        <td>{record.reorderLevel}</td>
                        <td>{record.unit}</td>
                        <td>{dateTime(record.lastUpdated)}</td>
                        <td>
                          {low ? (
                            <StatusPill className="bg-amber-50 text-amber-700 ring-amber-200">
                              Low stock
                            </StatusPill>
                          ) : null}
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setStockType("RAW_MATERIAL");
                                setEditingRawMaterial(record);
                              }}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-600 shadow-sm transition hover:bg-stone-50"
                              title="Edit raw material"
                            >
                              <Pencil size={14} />
                            </button>
                            <form action={deleteRawMaterialAction} className="inline-block">
                              <input type="hidden" name="materialId" value={record.materialId} />
                              <button
                                type="submit"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                                onClick={(e) => {
                                  if (!confirm("Are you sure you want to delete this raw material?")) {
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
                  {rawMaterials.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-stone-500">
                        No raw materials found. Create one to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      <div>
        <ProgressChartCard
          title="Stock level chart"
          subtitle="Lowest stock items are shown first for quick reorder decisions (includes both menu items and raw materials)."
          data={inventoryChart}
        />
      </div>
    </>
  );
}
