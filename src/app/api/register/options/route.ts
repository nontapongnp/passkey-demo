import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { prisma } from "@/lib/db";
import { preferredAuthenticatorType, rpID, rpName } from "@/lib/webauthn";
import { userHandle } from "@/lib/passkeys";
import { saveChallenge } from "@/lib/challenge";

// ขั้นที่ 1: รับ email + ชื่อ → ขอ options สำหรับสร้าง passkey
// ยังไม่สร้าง User ใน DB — จะสร้างต่อเมื่อ passkey verify ผ่านแล้วเท่านั้น
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const displayName = String(body.displayName ?? "").trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "รูปแบบอีเมลไม่ถูกต้อง" }, { status: 400 });
  }
  if (displayName.length < 1 || displayName.length > 50) {
    return NextResponse.json({ error: "ชื่อที่แสดงต้องยาว 1–50 ตัวอักษร" }, { status: 400 });
  }
  if (await prisma.user.findUnique({ where: { email } })) {
    return NextResponse.json({ error: "อีเมลนี้ถูกใช้สมัครแล้ว" }, { status: 409 });
  }

  const userId = randomUUID();

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: email,
    userDisplayName: displayName,
    userID: userHandle(userId),
    attestationType: "none",
    preferredAuthenticatorType,
    authenticatorSelection: {
      residentKey: "required", // ต้องเป็น discoverable credential → login แบบไม่ต้องกรอก email ได้
      userVerification: "required", // ต้อง biometric / PIN
    },
  });

  await saveChallenge({
    challenge: options.challenge,
    type: "register",
    userId,
    email,
    displayName,
  });

  return NextResponse.json(options);
}
