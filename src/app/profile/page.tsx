import { Shell, Card, Field, Button } from "@/components/ui";
import { changePasswordAction, updateProfileAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <Shell role={user.roleName} title="Profile">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-bold">Update Profile</h2>
          <form action={updateProfileAction} className="grid gap-4">
            <Field label="Full name"><input name="fullName" defaultValue={user.fullName} required /></Field>
            <Field label="Email"><input name="email" type="email" defaultValue={user.email} required /></Field>
            <Button>Save profile</Button>
          </form>
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-bold">Change Password</h2>
          <form action={changePasswordAction} className="grid gap-4">
            <Field label="Current password"><input name="currentPassword" type="password" required /></Field>
            <Field label="New password"><input name="newPassword" type="password" minLength={8} required /></Field>
            <Button>Change password</Button>
          </form>
        </Card>
      </div>
    </Shell>
  );
}
