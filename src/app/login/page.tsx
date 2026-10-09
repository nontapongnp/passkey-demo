import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { LoginForm } from "./LoginForm";
import { Hero } from "@/components/Hero";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/profile");
  return (
    <main>
      <Hero title="เข้าสู่ระบบ" sub="กรอกอีเมล แล้วยืนยันตัวตนด้วย Passkey ของบัญชีนั้น ไม่ต้องใช้รหัสผ่าน" />
      <LoginForm />
    </main>
  );
}
