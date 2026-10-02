import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { rpID } from "@/lib/webauthn";
import { saveChallenge } from "@/lib/challenge";

// Usernameless login: ไม่ส่ง allowCredentials → เบราว์เซอร์ให้ผู้ใช้เลือก passkey เอง
export async function POST() {
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "required",
  });
  await saveChallenge({ challenge: options.challenge, type: "login" });
  return NextResponse.json(options);
}
