import Image from "next/image";
import { loginAction } from "@/lib/actions";
import { Button, Card, Field } from "./ui";

export function LoginForm({ hasError = false }: { hasError?: boolean }) {
  return (
    <Card className="w-full max-w-md border-stone-200/80 p-7 shadow-xl shadow-stone-200/80">
      <div className="mb-7 grid justify-items-center gap-4 text-center">
        <div className="relative h-40 w-40 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-stone-200">
          <Image src="/morning-haze-logo.png" alt="Morning Haze Cafe logo" fill className="object-cover" sizes="160px" priority />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Morning Haze POS</h1>
          <p className="text-sm font-medium text-stone-600">Web-Based Cafe System</p>
        </div>
      </div>
      <form action={loginAction} className="grid gap-4">
        <Field label="Username or email">
          <input name="username" required autoComplete="username" />
        </Field>
        <Field label="Password">
          <input name="password" required type="password" autoComplete="current-password" />
        </Field>
        {hasError ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 ring-1 ring-rose-100">Invalid username or password.</p> : null}
        <Button>Login</Button>
      </form>
    </Card>
  );
}
