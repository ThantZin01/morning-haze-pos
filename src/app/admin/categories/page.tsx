import { Button, Card, Field, Shell } from "@/components/ui";
import { saveCategoryAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CategoryManager } from "./CategoryManager";

export default async function CategoriesPage() {
  await requireRole("ADMIN");
  const categories = await prisma.category.findMany({ orderBy: { categoryId: "asc" } });

  return (
    <Shell role="ADMIN" title="Category management">
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <Card className="h-fit">
          <h2 className="mb-4 text-lg font-bold">Create category</h2>
          <form action={saveCategoryAction} method="post" className="grid gap-3">
            <Field label="Category name"><input name="categoryName" required /></Field>
            <Field label="Description"><textarea name="description" rows={3} /></Field>
            <Field label="Status"><select name="status"><option>ACTIVE</option><option>INACTIVE</option></select></Field>
            <Button type="submit">Save category</Button>
          </form>
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-bold">Categories</h2>
          <CategoryManager categories={categories} />
        </Card>
      </div>
    </Shell>
  );
}
