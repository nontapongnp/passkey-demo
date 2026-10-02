import { NextResponse } from "next/server";
import { generateRegistrationOptions, type AuthenticatorTransportFuture } from "@simplewebauthn/server";
import { prisma } from "@/lib/db";
import { preferredAuthenticatorType, rpID, rpName } from "@/lib/webauthn";
import { userHandle } from "@/lib/passkeys";
import { saveChallenge } from "@/lib/challenge";
import { getSessionUser } from "@/lib/session";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "ยังไม่ได้เข้าสู่ระบบ" }, { status: 401 });

  const existing = await prisma.credential.findMany({
    where: { userId: user.id },
    select: { id: true, transports: true },
  });

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: user.email,
    userDisplayName: user.displayName,
    userID: userHandle(user.id),
    attestationType: "none",
    preferredAuthenticatorType,
    // กันลงทะเบียนอุปกรณ์เดิมซ้ำ
    excludeCredentials: existing.map((c) => ({
      id: c.id,
      transports: c.transports as AuthenticatorTransportFuture[],
    })),
    authenticatorSelection: { residentKey: "required", userVerification: "required" },
  });

  await saveChallenge({ challenge: options.challenge, type: "add-passkey", userId: user.id });
  return NextResponse.json(options);
}
