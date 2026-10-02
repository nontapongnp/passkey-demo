import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { ProfileClient } from "./ProfileClient";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [credentials, recoveryLeft] = await Promise.all([
    prisma.credential.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    prisma.recoveryCode.count({ where: { userId: user.id, usedAt: null } }),
  ]);

  return (
    <main className="wide">
      <ProfileClient
        user={{
          email: user.email,
          displayName: user.displayName,
          createdAt: user.createdAt.toISOString(),
        }}
        passkeys={credentials.map((c) => ({
          id: c.id,
          name: c.name,
          backedUp: c.backedUp,
          deviceType: c.deviceType,
          transports: c.transports,
          createdAt: c.createdAt.toISOString(),
          lastUsedAt: c.lastUsedAt?.toISOString() ?? null,
        }))}
        recoveryLeft={recoveryLeft}
      />
    </main>
  );
}
