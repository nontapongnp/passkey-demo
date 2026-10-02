import { NextResponse } from "next/server";
import {
  verifyAuthenticationResponse,
  type AuthenticationResponseJSON,
  type AuthenticatorTransportFuture,
} from "@simplewebauthn/server";
import { prisma } from "@/lib/db";
import { origin, rpID } from "@/lib/webauthn";
import { consumeChallenge } from "@/lib/challenge";
import { createSession } from "@/lib/session";

const fail = () =>
  NextResponse.json({ error: "เข้าสู่ระบบไม่สำเร็จ" }, { status: 401 });

export async function POST(req: Request) {
  const response = (await req.json()) as AuthenticationResponseJSON;

  const ch = await consumeChallenge("login");
  if (!ch) return fail();

  const cred = await prisma.credential.findUnique({ where: { id: response.id } });
  if (!cred) return fail();

  try {
    const { verified, authenticationInfo } = await verifyAuthenticationResponse({
      response,
      expectedChallenge: ch.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: cred.id,
        publicKey: new Uint8Array(cred.publicKey),
        counter: cred.counter,
        transports: cred.transports as AuthenticatorTransportFuture[],
      },
    });
    if (!verified) return fail();

    await prisma.credential.update({
      where: { id: cred.id },
      data: { counter: authenticationInfo.newCounter, lastUsedAt: new Date() },
    });
  } catch {
    return fail();
  }

  await createSession(cred.userId);
  return NextResponse.json({ verified: true });
}
