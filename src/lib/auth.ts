import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import type { Role } from "@prisma/client";

const JWT_COOKIE_NAME = "sevasetu_token";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "insecure-dev-secret",
);

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: Role;
  isVerified: boolean;
  [key: string]: unknown;
}

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createAuthToken(payload: AuthTokenPayload) {
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
  return jwt;
}

export async function setAuthCookie(token: string) {
  (await cookies()).set(JWT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" && process.env.VERCEL === "1",
    sameSite: "lax", 
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthCookie() {
  (await cookies()).delete(JWT_COOKIE_NAME);
}

export async function getAuthToken(): Promise<AuthTokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(JWT_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AuthTokenPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  // Production Auth Strategy: Secure JWT Verification
  const token = await getAuthToken();
  if (!token) return null;

  const user = await prisma.user.findUnique({
    where: { id: token.sub },
  });
  return user;
}
