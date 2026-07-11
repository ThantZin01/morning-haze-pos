import { Button, Card, Field, Shell, StatusPill } from "@/components/ui";
import { saveCategoryAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { statusClass } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function CategoriesPage() {
  await requireRole("ADMIN");
  const categories = await prisma.category.findMany({ orderBy: { categoryId: "asc" } });

  return (
    <Shell role="ADMIN" title="Category management">
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <Card>
          <h2 className="mb-4 text-lg font-bold">Create category</h2>
          <form action={saveCategoryAction} className="grid gap-3">
            <Field label="Category name"><input name="categoryName" required /></Field>
            <Field label="Description"><textarea name="description" rows={3} /></Field>
            <Field label="Status"><select name="status"><option>ACTIVE</option><option>INACTIVE</option></select></Field>
            <Button>Save category</Button>
          </form>
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-bold">Categories</h2>
          <div className="grid gap-3">
            {categories.map((category) => (
              <form key={category.categoryId} action={saveCategoryAction} className="grid gap-3 rounded-md border p-4 md:grid-cols-[1fr_1.5fr_120px_auto]">
                <input type="hidden" name="categoryId" value={category.categoryId} />
                <input name="categoryName" defaultValue={category.categoryName} required />
                <input name="description" defaultValue={category.description || ""} />
                <select name="status" defaultValue={category.status}><option>ACTIVE</option><option>INACTIVE</option></select>
                <Button>Update</Button>
                <StatusPill className={statusClass(category.status)}>{category.status}</StatusPill>
              </form>
            ))}
          </div>
        </Card>
      </div>
    </Shell>
  );
}
