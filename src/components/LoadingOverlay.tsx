// loading กลางจอ ระหว่างรอ redirect (sign in / ไปหน้าโปรไฟล์ / logout)
// หน้าเดิมยังค้างอยู่จนหน้าใหม่พร้อม overlay จึงอยู่จนกว่าจะเปลี่ยนหน้าเสร็จ
export function LoadingOverlay({ text }: { text: string }) {
  return (
    <div className="overlay" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <p>{text}</p>
    </div>
  )
}
