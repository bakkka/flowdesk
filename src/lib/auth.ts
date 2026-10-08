import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/password";

export { hashPassword, verifyPassword };

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const session = await readSession();
  if (!session) return null;
  const admin = await prisma.admin.findUnique({ where: { id: session.sub } });
  if (!admin) return null;
  return { id: admin.id, email: admin.email, name: admin.name, role: admin.role };
}

/** Server-side guard for every /admin page. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/login");
  return admin;
}
