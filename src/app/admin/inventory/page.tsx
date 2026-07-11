import { AlertTriangle } from "lucide-react";
import { ProgressChartCard } from "@/components/Charts";
import { Button, Card, Field, Shell, StatusPill } from "@/components/ui";
import { saveInventoryAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { dateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function InventoryPage() {
  await requireRole("ADMIN");
  const [menuItems, inventory] = await Promise.all([
    prisma.menuItem.findMany({ orderBy: { itemName: "asc" } }),
    prisma.inventory.findMany({ include: { menuItem: true, lastUpdatedByAdmin: true }, orderBy: { inventoryId: "asc" } })
  ]);
  const inventoryChart = inventory
    .slice()
    .sort((a, b) => a.stockQuantity - b.stockQuantity)
    .slice(0, 8)
    .map((record) => ({
      label: record.menuItem.itemName,
      value: record.stockQuantity,
      max: Math.max(record.stockQuantity, record.reorderLevel * 2, 1),
      helper: `${record.unit} | reorder at ${record.reorderLevel}`,
      tone: record.stockQuantity === 0 ? "danger" as const : record.stockQuantity <= record.reorderLevel ? "warning" as const : "normal" as const
    }));

  return (
    <Shell role="ADMIN" title="Inventory management">
      <div className="mb-5">
        <ProgressChartCard title="Stock level chart" subtitle="Lowest stock items are shown first for quick reorder decisions." data={inventoryChart} />
      </div>
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <Card>
          <h2 className="mb-4 text-lg font-bold">Update stock</h2>
          <form action={saveInventoryAction} className="grid gap-3">
            <Field label="Menu item"><select name="menuItemId">{menuItems.map((item) => <option key={item.menuItemId} value={item.menuItemId}>{item.itemName}</option>)}</select></Field>
            <Field label="Stock quantity"><input name="stockQuantity" type="number" min="0" required /></Field>
            <Field label="Reorder level"><input name="reorderLevel" type="number" min="0" required /></Field>
            <Field label="Unit"><input name="unit" placeholder="cups, pieces, packs" required /></Field>
            <Button>Save inventory</Button>
          </form>
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-bold">Stock records</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-stone-600"><tr><th className="py-2">Item</th><th>Quantity</th><th>Reorder</th><th>Unit</th><th>Last updated</th></tr></thead>
              <tbody>
                {inventory.map((record) => {
                  const low = record.stockQuantity <= record.reorderLevel;
                  return (
                    <tr key={record.inventoryId} className="border-b last:border-0">
                      <td className="py-3 font-medium">
                        <span className="inline-flex items-center gap-2">{low ? <AlertTriangle size={16} className="text-amber-600" /> : null}{record.menuItem.itemName}</span>
                      </td>
                      <td>{record.stockQuantity}</td>
                      <td>{record.reorderLevel}</td>
                      <td>{record.unit}</td>
                      <td>{dateTime(record.lastUpdated)}</td>
                      <td>{low ? <StatusPill className="bg-amber-50 text-amber-700 ring-amber-200">Low stock</StatusPill> : null}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Shell>
  );
}
