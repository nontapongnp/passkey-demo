import { NextResponse } from "next/server";
import { generateAuthenticationOptions, type AuthenticatorTransportFuture } from "@simplewebauthn/server";
import { prisma } from "@/lib/db";
import { rpID } from "@/lib/webauthn";
import { saveChallenge } from "@/lib/challenge";

// Login แบบกรอกอีเมลก่อน: ส่ง allowCredentials เฉพาะ Passkey ของบัญชีนี้ → เบราว์เซอร์ให้เลือกได้แค่ของบัญชีนี้
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();

  // ponytail: บอกตรง ๆ ว่าไม่พบบัญชี (account enumeration) — production ควรตอบ options หลอกแทน
  const user = email
    ? await prisma.user.findUnique({ where: { email }, include: { credentials: true } })
    : null;
  if (!user || user.credentials.length === 0) {
    return NextResponse.json({ error: "ไม่พบบัญชีนี้ หรือบัญชีนี้ยังไม่มี Passkey" }, { status: 404 });
  }

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "required",
    allowCredentials: user.credentials.map((c) => ({
      id: c.id,
      transports: c.transports as AuthenticatorTransportFuture[],
    })),
  });
  await saveChallenge({ challenge: options.challenge, type: "login", userId: user.id });
  return NextResponse.json(options);
}
