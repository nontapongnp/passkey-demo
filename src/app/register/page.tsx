import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { RegisterForm } from "./RegisterForm";
import { Hero } from "@/components/Hero";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  if (await getSessionUser()) redirect("/profile");
  return (
    <main>
      <Hero title="สร้างบัญชี" sub="ไม่ต้องตั้งรหัสผ่าน ใช้ลายนิ้วมือ ใบหน้า หรือ PIN ของเครื่องแทน" />
      <RegisterForm />
    </main>
  );
}
