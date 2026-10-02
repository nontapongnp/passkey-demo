"use client";

import { useState } from "react";

export function RecoveryCodes({ codes }: { codes: string[] }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(codes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <div className="codes" aria-label="Recovery codes">
        {codes.map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>
      <button type="button" className="btn secondary" onClick={copy}>
        {copied ? "คัดลอกแล้ว" : "คัดลอกทั้งหมด"}
      </button>
    </div>
  );
}
