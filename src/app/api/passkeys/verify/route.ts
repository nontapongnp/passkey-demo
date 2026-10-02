import { NextResponse } from "next/server";
import { verifyRegistrationResponse, type RegistrationResponseJSON } from "@simplewebauthn/server";
import { prisma } from "@/lib/db";
import { origin, rpID } from "@/lib/webauthn";
import { toCredentialData } from "@/lib/passkeys";
import { consumeChallenge } from "@/lib/challenge";
import { getSessionUser } from "@/lib/session";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "ยังไม่ได้เข้าสู่ระบบ" }, { status: 401 });

  const response = (await req.json()) as RegistrationResponseJSON;
  const ch = await consumeChallenge("add-passkey");
  if (!ch || ch.userId !== user.id) {
    return NextResponse.json({ error: "Challenge หมดอายุ ลองใหม่อีกครั้ง" }, { status: 400 });
  }

  try {
    const v = await verifyRegistrationResponse({
      response,
      expectedChallenge: ch.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
    if (!v.verified || !v.registrationInfo) throw new Error("ตรวจสอบ Passkey ไม่ผ่าน");

    await prisma.credential.create({
      data: { ...toCredentialData(v.registrationInfo), userId: user.id },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
  return NextResponse.json({ verified: true });
}
