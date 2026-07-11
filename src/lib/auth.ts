import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { createSessionToken, verifySessionToken, type SessionUser } from "./session";

const COOKIE_NAME = "mhc_session";

export async function currentUser() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { userId: session.userId },
    include: { role: true }
  });

  if (!user || user.status !== "ACTIVE") return null;

  return {
    userId: user.userId,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    roleName: user.role.roleName as "ADMIN" | "CASHIER"
  };
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(roleName: "ADMIN" | "CASHIER") {
  const user = await requireUser();
  if (user.roleName !== roleName) {
    redirect(user.roleName === "ADMIN" ? "/admin" : "/cashier");
  }
  return user;
}

export async function login(username: string, password: string) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email: username }]
    },
    include: { role: true }
  });

  if (!user || user.status !== "ACTIVE") {
    return { ok: false, error: "Invalid username or password." };
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    return { ok: false, error: "Invalid username or password." };
  }

  const sessionUser: SessionUser = {
    userId: user.userId,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    roleName: user.role.roleName as "ADMIN" | "CASHIER"
  };

  (await cookies()).set(COOKIE_NAME, createSessionToken(sessionUser), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });

  return { ok: true, roleName: sessionUser.roleName };
}

export async function logout() {
  (await cookies()).delete(COOKIE_NAME);
}
