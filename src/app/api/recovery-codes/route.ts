import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { issueRecoveryCodes } from "@/lib/recovery";

// สร้างชุดใหม่ → ชุดเก่าใช้ไม่ได้ทันที
export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "ยังไม่ได้เข้าสู่ระบบ" }, { status: 401 });
  return NextResponse.json({ recoveryCodes: await issueRecoveryCodes(user.id) });
}
