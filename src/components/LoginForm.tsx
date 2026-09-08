"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { loginAction } from "@/lib/actions";
import { Button, Card, Field } from "./ui";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await loginAction(formData);
    });
  };

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
      <form onSubmit={handleSubmit} className="grid gap-4">
        <Field label="Username or email">
          <input 
            name="username" 
            required 
            autoComplete="username" 
            disabled={isPending}
          />
        </Field>
        <Field label="Password">
          <div className="relative">
            <input 
              name="password" 
              required 
              type={showPassword ? "text" : "password"} 
              autoComplete="current-password" 
              className="!pr-10"
              disabled={isPending}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              title={showPassword ? "Hide password" : "Show password"}
              disabled={isPending}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </Field>
        <Button disabled={isPending} className="flex items-center justify-center gap-2">
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </Button>
      </form>
    </Card>
  );
}

