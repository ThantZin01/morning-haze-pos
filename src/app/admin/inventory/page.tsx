import { Shell } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InventoryManager } from "./InventoryManager";

export default async function InventoryPage() {
  await requireRole("ADMIN");
  const [menuItems, inventory, rawMaterials] = await Promise.all([
    prisma.menuItem.findMany({ orderBy: { itemName: "asc" } }),
    prisma.inventory.findMany({ include: { menuItem: true }, orderBy: { inventoryId: "asc" } }),
    prisma.rawMaterial.findMany({ orderBy: { materialId: "asc" } })
  ]);

  return (
    <Shell role="ADMIN" title="Inventory management">
      <InventoryManager 
        menuItems={menuItems} 
        inventory={inventory} 
        rawMaterials={rawMaterials} 
      />
    </Shell>
  );
}
