import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { LoginForm } from "./LoginForm";
import { Hero } from "@/components/Hero";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/profile");
  return (
    <main>
      <Hero title="เข้าสู่ระบบ" sub="ไม่ต้องกรอกอีเมลหรือรหัสผ่าน เลือก Passkey ที่บันทึกไว้ได้เลย" />
      <LoginForm />
    </main>
  );
}
