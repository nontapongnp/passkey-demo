// หัวหน้า login / register: ไอคอนลายนิ้วมือ + หัวข้อ + คำอธิบาย
export function Hero({ title, sub }: { title: string; sub: string }) {
  return (
    <header className="hero">
      <div className="hero-icon" aria-hidden="true">
        {/* fingerprint icon จาก Tabler Icons (MIT) */}
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18.9 7a8 8 0 0 1 1.1 5v1a6 6 0 0 0 .8 3" />
          <path d="M8 11a4 4 0 0 1 8 0v1a10 10 0 0 0 2 6" />
          <path d="M12 11v2a14 14 0 0 0 2.5 8" />
          <path d="M8 15a18 18 0 0 0 1.8 6" />
          <path d="M4.9 19a22 22 0 0 1 -.9 -7v-1a8 8 0 0 1 12 -6.95" />
        </svg>
      </div>
      <h1>{title}</h1>
      <p className="sub">{sub}</p>
    </header>
  );
}
