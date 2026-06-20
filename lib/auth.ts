import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireEnv } from "./config";

const COOKIE_NAME = "bill_tester_session";

function sign(value: string) {
  return crypto.createHmac("sha256", requireEnv("SESSION_SECRET")).update(value).digest("hex");
}

export function createSessionValue() {
  const payload = JSON.stringify({ authenticated: true, createdAt: Date.now() });
  const encoded = Buffer.from(payload).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function isValidSession(value?: string) {
  if (!value) return false;
  const [encoded, signature] = value.split(".");
  if (!encoded || !signature) return false;
  const expected = sign(encoded);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function requireAuth() {
  const cookieStore = await cookies();
  if (!isValidSession(cookieStore.get(COOKIE_NAME)?.value)) {
    redirect("/login");
  }
}

export async function setSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, createSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function passwordMatches(password: string) {
  const expected = requireEnv("APP_PASSWORD");
  const provided = Buffer.from(password);
  const wanted = Buffer.from(expected);
  if (provided.length !== wanted.length) return false;
  return crypto.timingSafeEqual(provided, wanted);
}

