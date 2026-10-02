# Passkey Demo (Next.js + Prisma + PostgreSQL)

ตัวอย่างประกอบ present เรื่อง Passkey / WebAuthn — มีหน้า register, login, profile

## รันยังไง

```bash
cp .env.example .env
npm install
npm run db:up       # PostgreSQL ใน docker
npm run db:push     # สร้างตารางจาก prisma/schema.prisma
npm run dev         # http://localhost:3000
```

ต้องเปิดผ่าน `http://localhost:3000` เท่านั้น (ไม่ใช่ 127.0.0.1 หรือ IP) เพราะ RP ID คือ `localhost`

## ดีไซน์ flow การสมัคร

**กรอกแค่ 2 ช่อง:** อีเมล (ตัวระบุบัญชี) และชื่อที่แสดง — ไม่มีช่องรหัสผ่าน

**ผูก passkey ทันทีในขั้นตอนสมัคร ก่อนบัญชีจะถูกสร้าง**

1. กรอกอีเมล + ชื่อ → `POST /api/register/options`
   server เช็กว่าอีเมลยังไม่ถูกใช้ สุ่ม userId แล้วออก challenge (ยังไม่สร้าง User ใน DB)
2. เบราว์เซอร์เรียก authenticator (`startRegistration`) → สร้างคู่กุญแจ
   private key อยู่ในเครื่อง ส่งแค่ public key กลับมา
3. `POST /api/register/verify` → verify attestation แล้วค่อยสร้าง User + Credential
4. แสดง recovery codes 8 ชุด ครั้งเดียว ต้องติ๊กยืนยันว่าเก็บแล้วจึงไปต่อ
5. หน้า profile เตือนให้เพิ่ม passkey อันที่ 2 (ตรงกับสไลด์ "ทางกู้ต้องมีอย่างน้อย 2 ทาง")

**ทำไมไม่สร้างบัญชีก่อนแล้วค่อยผูก passkey ทีหลัง:**
บัญชีที่ไม่มีกุญแจสักอันจะล็อกอินไม่ได้ และกลายเป็น record ค้างใน DB
การสร้างเมื่อ verify ผ่านแล้วทำให้ "ไม่มี passkey = ไม่มีบัญชี"

## ไฟล์สำคัญ

| ไฟล์ | หน้าที่ |
|---|---|
| `prisma/schema.prisma` | ไม่มี passwordHash — เก็บ publicKey, counter, deviceType, backedUp |
| `src/app/api/register/*` | ออก options / verify ตอนสมัคร |
| `src/app/api/login/*` | login แบบ usernameless + ทางสำรองด้วย recovery code |
| `src/app/api/passkeys/*` | เพิ่ม / ลบ passkey (ลบอันสุดท้ายไม่ได้) |
| `src/lib/challenge.ts` | challenge ใช้ครั้งเดียว อายุ 5 นาที |
| `src/lib/session.ts` | session cookie (DB เก็บเฉพาะ hash ของ token) |
| `src/lib/webauthn.ts` | RP ID / origin — จุดที่ผูก passkey กับ domain จริง |

## Demo ตอน present

- **ไม่มี passkey จริงก็ demo ได้:** Chrome DevTools → ⋮ → More tools → **WebAuthn** →
  Enable virtual authenticator environment → Add authenticator
  (Protocol `ctap2`, Transport `internal`, เปิด Resident Keys และ User Verification)
- **โชว์ว่าไม่มีความลับวิ่งข้ามเน็ต:** เปิดแท็บ Network ตอน login จะเห็นแค่ challenge กับ signature
- **โชว์ว่า DB ไม่มีอะไรให้ขโมย:** `npm run db:studio` ดูตาราง Credential จะมีแค่ public key
- **โชว์กลไกกัน phishing:** เปลี่ยน `ORIGIN`/`RP_ID` ใน `.env` ให้ไม่ตรงกับ URL แล้วลอง login จะล้มเหลว
- **Cross-device (QR + Bluetooth) ตามสไลด์ use case:** ต้องมี HTTPS และ domain จริง
  ใช้ ngrok / cloudflared แล้วตั้ง `RP_ID` และ `ORIGIN` ให้ตรงกับ domain นั้น

## สิ่งที่ตัดออกเพื่อให้ demo เล็ก (production ต้องเพิ่ม)

- ยืนยันอีเมล (ตอนนี้ใครก็สมัครด้วยอีเมลใดก็ได้)
- Rate limiting โดยเฉพาะ `/api/login/recovery` และ `/api/register/options`
  (ตอนนี้ endpoint สมัครบอกได้ว่าอีเมลไหนมีบัญชีแล้ว → account enumeration)
- แจ้งเตือนทางอีเมลเมื่อเพิ่ม/ลบ passkey หรือใช้ recovery code
- Conditional UI (passkey autofill ในช่องอีเมล), ตั้งชื่อ/เปลี่ยนชื่อ passkey
- ล้าง Challenge และ Session ที่หมดอายุเป็นระยะ (cron)
- ตรวจ `counter` ที่ถอยหลัง (ส่วนมาก synced passkey จะส่ง 0 เสมอ จึงไม่ได้บังคับในตัวอย่างนี้)
