import { Button, Card, Field, Shell, StatusPill } from "@/components/ui";
import { deleteMenuItemAction, saveMenuItemAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { money, statusClass } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function MenuItemsPage() {
  await requireRole("ADMIN");
  const [categories, menuItems] = await Promise.all([
    prisma.category.findMany({ where: { status: "ACTIVE" }, orderBy: { categoryName: "asc" } }),
    prisma.menuItem.findMany({
      where: { isAvailable: true },
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
        <Card>
          <h2 className="mb-4 text-lg font-bold">Create menu item</h2>
          <form action={saveMenuItemAction} className="grid gap-3">
            <Field label="Item name"><input name="itemName" required /></Field>
            <Field label="Category"><select name="categoryId">{categories.map((c) => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}</select></Field>
            <Field label="Description"><textarea name="description" rows={3} /></Field>
            <Field label="Price"><input name="price" type="number" min="0" step="100" required /></Field>
            <Field label="Image URL"><input name="imageUrl" /></Field>
            <label className="flex items-center gap-2 text-sm font-semibold"><input className="w-4" type="checkbox" name="isAvailable" defaultChecked /> Available</label>
            <Button>Save item</Button>
          </form>
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-bold">Active menu items</h2>
          <div className="grid gap-4">
            {menuItems.map((item) => {
              const stockQuantity = item.inventory?.stockQuantity ?? 0;
              const canRemove = stockQuantity === 0;

              return (
                <div key={item.menuItemId} className="rounded-lg border border-stone-200 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-bold">{item.itemName}</h3>
                      <p className="text-xs text-stone-500">
                        Current category: {item.category.categoryName} | Stock: {stockQuantity} | Sold in orders: {item._count.orderItems}
                      </p>
                    </div>
                    <StatusPill className={statusClass(item.isAvailable ? "ACTIVE" : "INACTIVE")}>{item.isAvailable ? "Available" : "Unavailable"}</StatusPill>
                  </div>
                  <form action={saveMenuItemAction} className="grid gap-3 xl:grid-cols-[1fr_160px_140px_1.5fr_120px_auto]">
                    <input type="hidden" name="menuItemId" value={item.menuItemId} />
                    <input name="itemName" defaultValue={item.itemName} required />
                    <select name="categoryId" defaultValue={item.categoryId}>
                      {categories.map((category) => (
                        <option key={category.categoryId} value={category.categoryId}>
                          {category.categoryName}
                        </option>
                      ))}
                    </select>
                    <input name="price" type="number" min="0" step="100" defaultValue={Number(item.price)} required />
                    <input name="description" defaultValue={item.description || ""} />
                    <input name="imageUrl" defaultValue={item.imageUrl || ""} />
                    <label className="flex items-center gap-2 text-sm font-semibold">
                      <input className="w-4" type="checkbox" name="isAvailable" defaultChecked={item.isAvailable} />
                      Available
                    </label>
                    <Button>Update</Button>
                  </form>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-stone-600">
                      Price: <strong>{money(item.price)}</strong>. Stock must be zero. Sold over 100 will deactivate; 100 or less will delete.
                    </p>
                    <form action={deleteMenuItemAction}>
                      <input type="hidden" name="menuItemId" value={item.menuItemId} />
                      <button
                        className="rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-stone-300"
                        disabled={!canRemove}
                        title={canRemove ? "Apply delete/deactivate rule" : "Set stock to zero before removing this item"}
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </Shell>
  );
}
