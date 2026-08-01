import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import {
  getActiveAdminById,
  verifyAdminCredentials,
  type AdminIdentity,
} from "./admin-users";

const COOKIE_NAME = "hoza_admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8;

type SessionPayload = {
  adminId: number;
  email: string;
  expiresAt: number;
};

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "Admin authentication is not configured. Set ADMIN_SESSION_SECRET to at least 32 random characters.",
    );
  }

  return secret;
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function createSessionValue(admin: AdminIdentity, secret: string) {
  const payload: SessionPayload = {
    adminId: admin.id,
    email: admin.email,
    expiresAt: Date.now() + SESSION_DURATION_SECONDS * 1000,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${signature(encodedPayload, secret)}`;
}

function verifySessionValue(value: string, secret: string) {
  const [encodedPayload, providedSignature] = value.split(".");
  if (!encodedPayload || !providedSignature) return false;
  if (!safeEqual(providedSignature, signature(encodedPayload, secret))) return false;

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as Partial<SessionPayload>;

    if (
      typeof payload.adminId !== "number" ||
      typeof payload.email !== "string" ||
      typeof payload.expiresAt !== "number" ||
      payload.expiresAt <= Date.now()
    ) {
      return false;
    }

    const admin = getActiveAdminById(payload.adminId);
    return Boolean(admin && safeEqual(admin.email, payload.email));
  } catch {
    return false;
  }
}

export function authenticateAdmin(email: string, password: string) {
  return verifyAdminCredentials(email, password);
}

export async function isAdminAuthenticated() {
  try {
    const secret = getSessionSecret();
    const session = (await cookies()).get(COOKIE_NAME)?.value;
    return session ? verifySessionValue(session, secret) : false;
  } catch {
    return false;
  }
}

export async function startAdminSession(admin: AdminIdentity) {
  const secret = getSessionSecret();
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, createSessionValue(admin, secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function endAdminSession() {
  (await cookies()).delete(COOKIE_NAME);
}
