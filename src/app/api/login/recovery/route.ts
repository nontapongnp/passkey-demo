import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashCode } from "@/lib/recovery";
import { createSession } from "@/lib/session";

// ทางสำรอง: email + recovery code (ใช้ได้ครั้งเดียว)
// ⚠️ production ต้องมี rate limit + แจ้งเตือนทางอีเมลเมื่อมีการใช้
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const code = String(body.code ?? "");

  const fail = () =>
    NextResponse.json({ error: "อีเมลหรือ recovery code ไม่ถูกต้อง" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return fail();

  // updateMany + เงื่อนไข usedAt: null → กัน race ใช้โค้ดซ้ำพร้อมกัน
  const { count } = await prisma.recoveryCode.updateMany({
    where: { userId: user.id, codeHash: hashCode(code), usedAt: null },
    data: { usedAt: new Date() },
  });
  if (count === 0) return fail();

  await createSession(user.id);
  return NextResponse.json({ verified: true });
}
