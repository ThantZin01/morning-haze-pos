import crypto from "node:crypto";

export type SessionUser = {
  userId: number;
  fullName: string;
  username: string;
  email: string;
  roleName: "ADMIN" | "CASHIER";
};

type SessionPayload = SessionUser & { exp: number };

function secret() {
  const authSecret = process.env.AUTH_SECRET;
  if (!authSecret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET must be set in production.");
    }
    return "dev-only-change-this-secret";
  }
  return authSecret;
}

function sign(value: string) {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

export function createSessionToken(user: SessionUser) {
  const payloadObject: SessionPayload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8
  };
  const payload = Buffer.from(JSON.stringify(payloadObject)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token?: string): SessionUser | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || sign(payload) !== signature) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionPayload;
    if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
    const { exp, ...user } = parsed;
    return user;
  } catch {
    return null;
  }
}
