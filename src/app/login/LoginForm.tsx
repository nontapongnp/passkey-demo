"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startAuthentication, browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { explainWebAuthnError, postJSON } from "@/lib/client";

export function LoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  async function loginWithPasskey() {
    setError("");
    if (!browserSupportsWebAuthn()) {
      setError("เบราว์เซอร์นี้ไม่รองรับ passkey");
      return;
    }
    setBusy(true);
    try {
      // 1) ขอ challenge จาก server
      const opt = await postJSON("/api/login/options");
      if (!opt.ok) return setError(opt.data.error ?? "เริ่มเข้าสู่ระบบไม่สำเร็จ");

      // 2) ปลดล็อกอุปกรณ์ → เซ็น challenge ด้วย private key (key ไม่ออกจากเครื่อง)
      let assertion;
      try {
        assertion = await startAuthentication({ optionsJSON: opt.data });
      } catch (err) {
        return setError(explainWebAuthnError(err));
      }

      // 3) ส่งแค่ลายเซ็นกลับไปให้ server ตรวจด้วย public key
      const ver = await postJSON("/api/login/verify", assertion);
      if (!ver.ok) return setError(ver.data.error ?? "เข้าสู่ระบบไม่สำเร็จ");

      router.push("/profile");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function loginWithRecovery(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await postJSON("/api/login/recovery", { email, code });
      if (!res.ok) return setError(res.data.error ?? "เข้าสู่ระบบไม่สำเร็จ");
      router.push("/profile");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="card">
        {error && <div className="error" role="alert">{error}</div>}
        <button className="btn" onClick={loginWithPasskey} disabled={busy}>
          {busy ? "รอยืนยันบนอุปกรณ์…" : "เข้าสู่ระบบด้วย passkey"}
        </button>

        <details>
          <summary>ไม่มีอุปกรณ์ที่มี passkey? ใช้ recovery code</summary>
          <form onSubmit={loginWithRecovery}>
            <div className="field">
              <label htmlFor="r-email">อีเมล</label>
              <input id="r-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="r-code">Recovery code</label>
              <input id="r-code" type="text" required placeholder="xxxxxx-xxxxxx" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <button className="btn secondary" disabled={busy}>เข้าสู่ระบบด้วย recovery code</button>
          </form>
        </details>
      </div>

      <p className="foot">
        ยังไม่มีบัญชี? <a href="/register">สร้างบัญชี</a>
      </p>
    </>
  );
}
