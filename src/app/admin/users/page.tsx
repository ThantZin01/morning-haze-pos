import { Button, Card, Field, Shell, StatusPill } from "@/components/ui";
import { deleteUserAction, saveUserAction, toggleUserAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { statusClass } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function UsersPage() {
  const admin = await requireRole("ADMIN");
  const users = await prisma.user.findMany({
    include: {
      role: true,
      _count: {
        select: {
          orders: true,
          createdCategories: true,
          updatedCategories: true,
          createdMenuItems: true,
          updatedMenuItems: true,
          lastUpdatedInventories: true
        }
      }
    },
    orderBy: { userId: "asc" }
  });

  return (
    <Shell role="ADMIN" title="User management">
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <Card>
          <h2 className="mb-4 text-lg font-bold">Create user</h2>
          <form action={saveUserAction} className="grid gap-3">
            <Field label="Full name"><input name="fullName" required /></Field>
            <Field label="Username"><input name="username" required /></Field>
            <Field label="Email"><input name="email" type="email" required /></Field>
            <Field label="Password"><input name="password" type="password" placeholder="Password@123" /></Field>
            <Field label="Role"><select name="roleName"><option value="ADMIN">Administrator</option><option value="CASHIER">Cashier</option></select></Field>
            <input type="hidden" name="status" value="ACTIVE" />
            <Button>Create user</Button>
          </form>
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-bold">Accounts</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-stone-600"><tr><th className="py-2">Name</th><th>Username</th><th>Role</th><th>Status</th><th>Records</th><th></th></tr></thead>
              <tbody>
                {users.map((user) => {
                  const linkedRecordCount =
                    user._count.orders +
                    user._count.createdCategories +
                    user._count.updatedCategories +
                    user._count.createdMenuItems +
                    user._count.updatedMenuItems +
                    user._count.lastUpdatedInventories;
                  const canDelete = linkedRecordCount === 0 && user.userId !== admin.userId;

                  return (
                    <tr key={user.userId} className="border-b last:border-0">
                      <td className="py-3 font-medium">{user.fullName}<p className="text-xs text-stone-500">{user.email}</p></td>
                      <td>{user.username}</td>
                      <td>{user.role.roleName}</td>
                      <td><StatusPill className={statusClass(user.status)}>{user.status}</StatusPill></td>
                      <td>{linkedRecordCount}</td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          <form action={toggleUserAction}>
                            <input type="hidden" name="userId" value={user.userId} />
                            <input type="hidden" name="status" value={user.status} />
                            <button className="rounded-md border px-3 py-1.5 text-xs font-semibold hover:bg-stone-50">{user.status === "ACTIVE" ? "Deactivate" : "Activate"}</button>
                          </form>
                          <form action={deleteUserAction}>
                            <input type="hidden" name="userId" value={user.userId} />
                            <button
                              className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-stone-300"
                              disabled={!canDelete}
                              title={canDelete ? "Delete account" : "Accounts with system records or your current account cannot be deleted"}
                            >
                              Delete
                            </button>
                          </form>
                        </div>
                      </td>
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
