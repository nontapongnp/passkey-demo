import type { VerifiedRegistrationResponse } from "@simplewebauthn/server";

type RegistrationInfo = NonNullable<VerifiedRegistrationResponse["registrationInfo"]>;

// แปลงผล verify เป็นข้อมูลที่จะเก็บลง DB
export function toCredentialData(info: RegistrationInfo) {
  const { credential, credentialDeviceType, credentialBackedUp } = info;
  return {
    id: credential.id,
    publicKey: new Uint8Array(credential.publicKey),
    counter: credential.counter,
    deviceType: credentialDeviceType,
    backedUp: credentialBackedUp,
    transports: credential.transports ?? [],
    name: credentialDeviceType === "multiDevice" ? "Synced Passkey" : "Device-bound Passkey",
  };
}

// WebAuthn user handle — ใช้ random id ไม่ใช้ email (spec แนะนำ ห้ามมี PII)
export const userHandle = (userId: string) => new TextEncoder().encode(userId);
