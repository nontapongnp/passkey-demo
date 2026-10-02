// helper ฝั่ง browser
export async function postJSON<T = any>(url: string, body?: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  return { ok: res.ok, status: res.status, data };
}

export function explainWebAuthnError(e: unknown) {
  const err = e as { name?: string; message?: string };
  switch (err?.name) {
    case "NotAllowedError":
      return "ยกเลิกหรือหมดเวลา ลองกดใหม่อีกครั้ง";
    case "InvalidStateError":
      return "อุปกรณ์นี้มี passkey ของบัญชีนี้อยู่แล้ว";
    default:
      return err?.message ?? "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
  }
}
