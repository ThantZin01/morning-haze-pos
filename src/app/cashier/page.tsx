import { CashierOrderForm } from "@/components/CashierOrderForm";
import { Shell } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function CashierPage() {
  await requireRole("CASHIER");
  const menuItems = await prisma.menuItem.findMany({
    where: { isAvailable: true, category: { status: "ACTIVE" } },
    include: { category: true, inventory: true },
    orderBy: [{ category: { categoryName: "asc" } }, { itemName: "asc" }]
  });

  return (
    <Shell role="CASHIER" title="Cashier POS dashboard">
      <CashierOrderForm
        menuItems={menuItems.map((item) => ({
          menuItemId: item.menuItemId,
          itemName: item.itemName,
          description: item.description,
          price: item.price.toString(),
          categoryName: item.category.categoryName,
          stockQuantity: item.inventory?.stockQuantity ?? null
        }))}
      />
    </Shell>
  );
}
