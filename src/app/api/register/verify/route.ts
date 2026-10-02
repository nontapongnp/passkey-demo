import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { verifyRegistrationResponse, type RegistrationResponseJSON } from "@simplewebauthn/server";
import { prisma } from "@/lib/db";
import { origin, rpID } from "@/lib/webauthn";
import { toCredentialData } from "@/lib/passkeys";
import { consumeChallenge } from "@/lib/challenge";
import { createSession } from "@/lib/session";
import { issueRecoveryCodes } from "@/lib/recovery";

// ขั้นที่ 2: เบราว์เซอร์ส่ง attestation กลับมา → verify → ค่อยสร้าง User + Credential
export async function POST(req: Request) {
  const response = (await req.json()) as RegistrationResponseJSON;

  const ch = await consumeChallenge("register");
  if (!ch?.userId || !ch.email || !ch.displayName) {
    return NextResponse.json({ error: "Challenge หมดอายุ ลองใหม่อีกครั้ง" }, { status: 400 });
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: ch.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: "ตรวจสอบ Passkey ไม่ผ่าน" }, { status: 400 });
  }

  try {
    await prisma.user.create({
      data: {
        id: ch.userId,
        email: ch.email,
        displayName: ch.displayName,
        credentials: { create: toCredentialData(verification.registrationInfo) },
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "อีเมลนี้ถูกใช้สมัครแล้ว" }, { status: 409 });
    }
    throw e;
  }

  const recoveryCodes = await issueRecoveryCodes(ch.userId);
  await createSession(ch.userId);

  return NextResponse.json({ verified: true, recoveryCodes });
}
