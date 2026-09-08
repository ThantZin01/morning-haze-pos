import { Button, Card, Field, Shell } from "@/components/ui";
import { saveMenuItemAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MenuItemManager } from "./MenuItemManager";

export default async function MenuItemsPage() {
  await requireRole("ADMIN");
  const [categories, menuItems] = await Promise.all([
    prisma.category.findMany({ where: { status: "ACTIVE" }, orderBy: { categoryName: "asc" } }),
    prisma.menuItem.findMany({
      include: {
        category: true,
        inventory: true,
        _count: { select: { orderItems: true } }
      },
      orderBy: { menuItemId: "asc" }
    })
  ]);

  return (
    <Shell role="ADMIN" title="Menu item management">
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <Card className="h-fit">
          <h2 className="mb-4 text-lg font-bold">Create menu item</h2>
          <form action={saveMenuItemAction} method="post" className="grid gap-3" encType="multipart/form-data">
            <Field label="Item name"><input name="itemName" required /></Field>
            <Field label="Category"><select name="categoryId">{categories.map((c) => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}</select></Field>
            <Field label="Description"><textarea name="description" rows={3} /></Field>
            <Field label="Price"><input name="price" type="number" min="0" step="100" required /></Field>
            <Field label="Image URL"><input name="imageUrl" /></Field>
            <Field label="Upload image"><input name="image" type="file" accept="image/*" /></Field>
            <label className="flex items-center gap-2 text-sm font-semibold"><input className="w-4" type="checkbox" name="isAvailable" defaultChecked /> Available</label>
            <Button type="submit">Save item</Button>
          </form>
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-bold">Active menu items</h2>
          <MenuItemManager menuItems={menuItems} categories={categories} />
        </Card>
      </div>
    </Shell>
  );
}
