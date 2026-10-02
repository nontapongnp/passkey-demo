// Relying Party config — ต้องตรงกับ domain ที่เบราว์เซอร์เปิดอยู่ ไม่งั้น passkey จะไม่ทำงาน
// (นี่แหละคือกลไกกัน phishing: passkey ผูกกับ RP ID)
export const rpName = process.env.RP_NAME ?? "Passkey Demo";
export const rpID = process.env.RP_ID ?? "localhost";
export const origin = process.env.ORIGIN ?? "http://localhost:3000";

// สวิตช์ demo: PASSKEY_PREFER="remoteDevice" → ขอให้เบราว์เซอร์โชว์ QR ให้มือถือสแกนก่อน (hints: ["hybrid"])
// "localDevice" = Windows Hello / Touch ID, "securityKey" = YubiKey, ไม่ตั้ง = ให้เบราว์เซอร์เลือกเอง
// เป็นแค่ hint — เบราว์เซอร์ที่ไม่รองรับ hints จะเมินค่านี้
const prefer = process.env.PASSKEY_PREFER;
export const preferredAuthenticatorType =
  prefer === "localDevice" || prefer === "remoteDevice" || prefer === "securityKey" ? prefer : undefined;
