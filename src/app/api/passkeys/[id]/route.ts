import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "ยังไม่ได้เข้าสู่ระบบ" }, { status: 401 });

  const { id } = await params;
  const count = await prisma.credential.count({ where: { userId: user.id } });
  if (count <= 1) {
    return NextResponse.json(
      { error: "ลบ Passkey อันสุดท้ายไม่ได้ ไม่งั้นจะเข้าบัญชีไม่ได้" },
      { status: 400 },
    );
  }

  await prisma.credential.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ deleted: true });
}
