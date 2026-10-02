import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";
import { prisma } from "./db";

const COOKIE = "session";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  await prisma.session.create({
    data: { id: sha256(token), userId, expiresAt: new Date(Date.now() + TTL_MS) },
  });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_MS / 1000,
  });
}

export async function getSessionUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { id: sha256(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { id: sha256(token) } });
  jar.delete(COOKIE);
}
