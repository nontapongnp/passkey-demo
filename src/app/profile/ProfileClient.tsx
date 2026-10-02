"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startRegistration } from "@simplewebauthn/browser";
import { explainWebAuthnError, postJSON } from "@/lib/client";
import { RecoveryCodes } from "@/components/RecoveryCodes";

type Passkey = {
  id: string;
  name: string;
  backedUp: boolean;
  deviceType: string;
  transports: string[];
  createdAt: string;
  lastUsedAt: string | null;
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });

export function ProfileClient({
  user,
  passkeys,
  recoveryLeft,
}: {
  user: { email: string; displayName: string; createdAt: string };
  passkeys: Passkey[];
  recoveryLeft: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [newCodes, setNewCodes] = useState<string[] | null>(null);

  async function logout() {
    await postJSON("/api/logout");
    router.push("/login");
    router.refresh();
  }

  async function addPasskey() {
    setError("");
    setBusy(true);
    try {
      const opt = await postJSON("/api/passkeys/options");
      if (!opt.ok) return setError(opt.data.error ?? "เพิ่ม passkey ไม่สำเร็จ");

      let attestation;
      try {
        attestation = await startRegistration({ optionsJSON: opt.data });
      } catch (err) {
        return setError(explainWebAuthnError(err));
      }

      const ver = await postJSON("/api/passkeys/verify", attestation);
      if (!ver.ok) return setError(ver.data.error ?? "เพิ่ม passkey ไม่สำเร็จ");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function removePasskey(id: string) {
    if (!confirm("ลบ passkey นี้? อุปกรณ์นั้นจะเข้าสู่ระบบไม่ได้อีก")) return;
    setError("");
    const res = await fetch(`/api/passkeys/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return setError(data.error ?? "ลบไม่สำเร็จ");
    }
    router.refresh();
  }

  async function regenerateCodes() {
    if (!confirm("สร้างชุดใหม่? ชุดเก่าจะใช้ไม่ได้ทันที")) return;
    setError("");
    const res = await postJSON("/api/recovery-codes");
    if (!res.ok) return setError(res.data.error ?? "สร้างไม่สำเร็จ");
    setNewCodes(res.data.recoveryCodes);
    router.refresh();
  }

  return (
    <>
      <div className="profile-head">
        <div className="avatar" aria-hidden="true">{user.displayName.trim().charAt(0).toUpperCase()}</div>
        <div style={{ flex: 1 }}>
          <h1>{user.displayName}</h1>
          <div className="small">{user.email} · สมัครเมื่อ {fmt(user.createdAt)}</div>
        </div>
        <button className="btn secondary" onClick={logout}>ออกจากระบบ</button>
      </div>

      {error && <div className="error" role="alert">{error}</div>}

      {passkeys.length < 2 && (
        <div className="notice">
          บัญชีนี้มี passkey เพียง {passkeys.length} อัน ถ้าอุปกรณ์หายจะต้องพึ่ง recovery code
          แนะนำให้เพิ่ม passkey อีกอย่างน้อย 1 อัน เช่น มือถืออีกเครื่องหรือ security key
        </div>
      )}

      <section className="card" aria-labelledby="pk-title">
        <h2 id="pk-title">Passkeys ({passkeys.length})</h2>
        <p className="small">server เก็บเฉพาะ public key ส่วน private key อยู่ในอุปกรณ์ของคุณ</p>

        {passkeys.map((p) => (
          <div className="row" key={p.id}>
            <div>
              <strong>{p.name}</strong>
              <span className={`badge ${p.backedUp ? "synced" : "bound"}`}>
                {p.backedUp ? "sync ข้ามเครื่อง" : "ผูกกับอุปกรณ์"}
              </span>
              <div className="small">
                เพิ่มเมื่อ {fmt(p.createdAt)}
                {p.lastUsedAt ? ` · ใช้ล่าสุด ${fmt(p.lastUsedAt)}` : " · ยังไม่เคยใช้เข้าสู่ระบบ"}
                {p.transports.length > 0 && ` · ${p.transports.join(", ")}`}
              </div>
            </div>
            <button
              className="btn danger"
              onClick={() => removePasskey(p.id)}
              disabled={passkeys.length <= 1}
              title={passkeys.length <= 1 ? "ลบอันสุดท้ายไม่ได้" : undefined}
            >
              ลบ
            </button>
          </div>
        ))}

        <div style={{ marginTop: 16 }}>
          <button className="btn inline" onClick={addPasskey} disabled={busy}>
            {busy ? "รอยืนยันบนอุปกรณ์…" : "เพิ่ม passkey"}
          </button>
        </div>
      </section>

      <section className="card" aria-labelledby="rc-title">
        <h2 id="rc-title">Recovery codes</h2>
        <p className="small">เหลือโค้ดที่ยังไม่ได้ใช้ {recoveryLeft} จาก 8</p>

        {newCodes ? (
          <>
            <div className="notice">ชุดใหม่ — จะแสดงครั้งนี้ครั้งเดียว</div>
            <RecoveryCodes codes={newCodes} />
          </>
        ) : (
          <button className="btn secondary inline" onClick={regenerateCodes}>
            สร้างชุดใหม่
          </button>
        )}
      </section>
    </>
  );
}
