"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startRegistration, browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { explainWebAuthnError, postJSON } from "@/lib/client";
import { RecoveryCodes } from "@/components/RecoveryCodes";

type Step = "form" | "codes";

export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [codes, setCodes] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!browserSupportsWebAuthn()) {
      setError("เบราว์เซอร์นี้ไม่รองรับ passkey");
      return;
    }

    setBusy(true);
    try {
      // 1) server ตรวจ email แล้วออก challenge + options
      const opt = await postJSON("/api/register/options", { email, displayName });
      if (!opt.ok) return setError(opt.data.error ?? "เริ่มสมัครไม่สำเร็จ");

      // 2) เบราว์เซอร์เรียก authenticator → สร้างคู่กุญแจ → private key อยู่ในเครื่อง
      let attestation;
      try {
        attestation = await startRegistration({ optionsJSON: opt.data });
      } catch (err) {
        return setError(explainWebAuthnError(err));
      }

      // 3) ส่งเฉพาะ public key + attestation ให้ server verify แล้วค่อยสร้างบัญชี
      const ver = await postJSON("/api/register/verify", attestation);
      if (!ver.ok) return setError(ver.data.error ?? "สร้างบัญชีไม่สำเร็จ");

      setCodes(ver.data.recoveryCodes);
      setStep("codes");
    } finally {
      setBusy(false);
    }
  }

  // 1 = กรอกข้อมูล, 2 = รอสร้าง passkey บนอุปกรณ์, 3 = เก็บ recovery codes
  const phase = step === "codes" ? 3 : busy ? 2 : 1;
  const cls = (n: number) => (phase === n ? "current" : phase > n ? "done" : "");

  return (
    <>
      <ol className="steps" aria-label="ขั้นตอนการสมัคร">
        <li className={cls(1)}>
          <strong>ข้อมูลบัญชี</strong>อีเมลและชื่อ
        </li>
        <li className={cls(2)}>
          <strong>สร้าง passkey</strong>ยืนยันบนเครื่อง
        </li>
        <li className={cls(3)}>
          <strong>เก็บ recovery codes</strong>ทางกู้บัญชี
        </li>
      </ol>

      {step === "form" && (
        <form className="card" onSubmit={onSubmit}>
          {error && <div className="error" role="alert">{error}</div>}

          <div className="field">
            <label htmlFor="email">อีเมล</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="hint">ใช้เป็นตัวระบุบัญชีและส่งแจ้งเตือนความปลอดภัย</div>
          </div>

          <div className="field">
            <label htmlFor="name">ชื่อที่แสดง</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              maxLength={50}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <button className="btn" disabled={busy}>
            {busy ? "รอยืนยันบนอุปกรณ์…" : "สร้างบัญชีด้วย passkey"}
          </button>
          <p className="hint" style={{ marginTop: 12 }}>
            กดแล้วเครื่องจะขอสแกนนิ้ว ใบหน้า หรือ PIN บัญชีจะถูกสร้างเมื่อสร้าง passkey สำเร็จเท่านั้น
          </p>
        </form>
      )}

      {step === "codes" && (
        <div className="card">
          <h2>บัญชีสร้างเสร็จแล้ว</h2>
          <p className="small">
            เก็บ recovery codes นี้ไว้ที่ปลอดภัย ใช้เข้าบัญชีได้ครั้งละ 1 โค้ดเมื่อไม่มีอุปกรณ์ที่มี passkey
            และจะแสดงเพียงครั้งนี้ครั้งเดียว
          </p>
          <RecoveryCodes codes={codes} />
          <label className="checkline" style={{ marginTop: 16, fontWeight: 400 }}>
            <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
            ฉันเก็บ recovery codes ไว้แล้ว
          </label>
          <button className="btn" disabled={!saved} onClick={() => router.push("/profile")}>
            ไปที่โปรไฟล์
          </button>
        </div>
      )}

      {step === "form" && (
        <p className="foot">
          มีบัญชีแล้ว? <a href="/login">เข้าสู่ระบบ</a>
        </p>
      )}
    </>
  );
}
