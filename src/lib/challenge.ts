import { cookies } from "next/headers";
import { prisma } from "./db";

const COOKIE = "challenge_id";
const TTL_MS = 5 * 60 * 1000;

type ChallengeType = "register" | "login" | "add-passkey";

export async function saveChallenge(data: {
  challenge: string;
  type: ChallengeType;
  userId?: string;
  email?: string;
  displayName?: string;
}) {
  const row = await prisma.challenge.create({
    data: { ...data, expiresAt: new Date(Date.now() + TTL_MS) },
  });
  (await cookies()).set(COOKIE, row.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_MS / 1000,
  });
}

// ใช้ได้ครั้งเดียว: อ่านแล้วลบทิ้งทันที (กัน replay)
export async function consumeChallenge(type: ChallengeType) {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (!id) return null;
  jar.delete(COOKIE);

  const row = await prisma.challenge.findUnique({ where: { id } });
  if (!row) return null;
  await prisma.challenge.delete({ where: { id } }).catch(() => {});

  if (row.type !== type || row.expiresAt < new Date()) return null;
  return row;
}
