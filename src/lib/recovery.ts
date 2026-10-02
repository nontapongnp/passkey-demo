import { createHash, randomBytes } from "crypto";
import { prisma } from "./db";

const normalize = (code: string) => code.toLowerCase().replace(/[^a-f0-9]/g, "");
export const hashCode = (code: string) =>
  createHash("sha256").update(normalize(code)).digest("hex");

function generateCodes(n = 8) {
  return Array.from({ length: n }, () => {
    const hex = randomBytes(6).toString("hex"); // 12 ตัว
    return `${hex.slice(0, 6)}-${hex.slice(6)}`;
  });
}

// ออกชุดใหม่ (ของเก่าถูกลบทิ้ง) — คืน plaintext ให้โชว์ครั้งเดียว
export async function issueRecoveryCodes(userId: string) {
  const codes = generateCodes();
  await prisma.$transaction([
    prisma.recoveryCode.deleteMany({ where: { userId } }),
    prisma.recoveryCode.createMany({
      data: codes.map((c) => ({ userId, codeHash: hashCode(c) })),
    }),
  ]);
  return codes;
}
