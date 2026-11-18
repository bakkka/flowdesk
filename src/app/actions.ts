"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { destroySession, writeSession } from "@/lib/session";
import { seedDatabase } from "../../prisma/demo-data";

function str(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function int(formData: FormData, key: string, fallback = 0): number {
  const value = Number.parseInt(str(formData, key), 10);
  return Number.isFinite(value) ? value : fallback;
}

function bool(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true" || value === "1";
}

export async function signIn(formData: FormData): Promise<void> {
  const email = str(formData, "email").toLowerCase();
  const password = str(formData, "password");

  if (!email || !password) redirect("/login?error=1");

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin || !verifyPassword(password, admin.passwordHash)) {
    redirect("/login?error=1");
  }

  await writeSession({ sub: admin.id, email: admin.email, name: admin.name });
  await prisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  redirect("/admin");
}

export async function signOut(): Promise<void> {
  await destroySession();
  redirect("/login");
}

export async function changeUserPlan(formData: FormData): Promise<void> {
  await requireAdmin();
  const userId = str(formData, "userId");
  const rawPlan = str(formData, "planCode");
  const planCode = rawPlan === "none" ? null : rawPlan;

  if (!userId) redirect("/admin/users");

  if (planCode) {
    const plan = await prisma.plan.findUnique({ where: { code: planCode } });
    if (!plan) redirect("/admin/users");
    await prisma.user.update({
      where: { id: userId },
      data: {
        planCode: plan.code,
        subscriptionEndsAt:
          plan.durationDays > 0
            ? new Date(Date.now() + plan.durationDays * 86_400_000)
            : null,
        segment: "active",
      },
    });
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: { planCode: null, subscriptionEndsAt: null },
    });
  }

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin");
  redirect(`/admin/users/${userId}?ok=saved`);
}

export async function toggleUserBlock(formData: FormData): Promise<void> {
  await requireAdmin();
  const userId = str(formData, "userId");
  if (!userId) redirect("/admin/users");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/admin/users");

  await prisma.user.update({
    where: { id: userId },
    data: { status: user.status === "blocked" ? "active" : "blocked" },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  redirect(`/admin/users/${userId}?ok=blocked`);
}

export async function savePlan(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData, "id");
  const code = str(formData, "code").toLowerCase();

  if (!/^[a-z0-9_-]{2,24}$/.test(code)) {
    redirect("/admin/plans?ok=badcode");
  }

  const data = {
    code,
    nameRu: str(formData, "nameRu") || code,
    nameEn: str(formData, "nameEn") || code,
    taglineRu: str(formData, "taglineRu"),
    taglineEn: str(formData, "taglineEn"),
    priceRub: int(formData, "priceRub"),
    priceStars: int(formData, "priceStars"),
    durationDays: int(formData, "durationDays", 30),
    featuresRu: str(formData, "featuresRu"),
    featuresEn: str(formData, "featuresEn"),
    sort: int(formData, "sort"),
    isFeatured: bool(formData, "isFeatured"),
    isActive: bool(formData, "isActive"),
  };

  if (id) {
    try {
      await prisma.plan.update({ where: { id }, data });
    } catch {
      redirect("/admin/plans?ok=badcode");
    }
  } else {
    const exists = await prisma.plan.findUnique({ where: { code } });
    if (exists) redirect("/admin/plans?ok=badcode");
    await prisma.plan.create({ data });
  }

  revalidatePath("/admin/plans");
  revalidatePath("/admin");
  redirect("/admin/plans?ok=saved");
}

export async function deletePlan(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData, "id");
  if (!id) redirect("/admin/plans");

  const plan = await prisma.plan.findUnique({ where: { id }, include: { _count: { select: { users: true } } } });
  if (!plan) redirect("/admin/plans");
  if (plan._count.users > 0) redirect("/admin/plans?ok=inuse");

  await prisma.plan.delete({ where: { id } });
  revalidatePath("/admin/plans");
  redirect("/admin/plans?ok=deleted");
}

function audienceWhere(audience: string) {
  const now = new Date();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 86_400_000);

  switch (audience) {
    case "free":
      return {
        status: "active",
        OR: [
          { planCode: null },
          { planCode: "free" },
          { subscriptionEndsAt: { lt: now } },
        ],
      };
    case "pro":
    case "business":
      return { status: "active", planCode: audience, subscriptionEndsAt: { gt: now } };
    case "inactive":
      return { status: "active", lastActiveAt: { lt: twoWeeksAgo } };
    default:
      return { status: "active" };
  }
}

export async function saveBroadcast(formData: FormData): Promise<void> {
  await requireAdmin();
  const title = str(formData, "title");
  const textRu = str(formData, "textRu");
  const textEn = str(formData, "textEn");
  const audience = str(formData, "audience") || "all";
  const intent = str(formData, "intent");

  if (!title || !textRu) redirect("/admin/broadcasts?ok=required");

  const recipients = await prisma.user.findMany({
    where: audienceWhere(audience),
    select: { id: true },
  });

  if (intent === "send") {
    const delivered = Math.round(recipients.length * 0.972);
    const failed = recipients.length - delivered;

    const broadcast = await prisma.broadcast.create({
      data: {
        title,
        textRu,
        textEn: textEn || textRu,
        audience,
        status: "sent",
        sentAt: new Date(),
        recipients: recipients.length,
        delivered,
        failed,
        openRate: recipients.length ? Math.round((delivered / recipients.length) * 61) : 0,
      },
    });

    if (recipients.length > 0) {
      await prisma.event.createMany({
        data: recipients.slice(0, 400).map((recipient) => ({
          userId: recipient.id,
          type: "broadcast_sent",
          label: broadcast.title,
          createdAt: new Date(),
        })),
      });
    }
  } else {
    await prisma.broadcast.create({
      data: {
        title,
        textRu,
        textEn: textEn || textRu,
        audience,
        status: "draft",
      },
    });
  }

  revalidatePath("/admin/broadcasts");
  revalidatePath("/admin");
  redirect(intent === "send" ? "/admin/broadcasts?ok=sent" : "/admin/broadcasts?ok=draft");
}

export async function saveMaterial(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData, "id");
  const minPlan = str(formData, "minPlan") || "free";

  const plan = await prisma.plan.findUnique({ where: { code: minPlan } });
  if (!plan) redirect("/admin/content?ok=noplan");

  const data = {
    titleRu: str(formData, "titleRu") || "Без названия",
    titleEn: str(formData, "titleEn") || str(formData, "titleRu") || "Untitled",
    summaryRu: str(formData, "summaryRu"),
    summaryEn: str(formData, "summaryEn"),
    bodyRu: str(formData, "bodyRu"),
    bodyEn: str(formData, "bodyEn"),
    kind: str(formData, "kind") || "lesson",
    minPlan,
    durationMin: int(formData, "durationMin", 10),
    isPublished: bool(formData, "isPublished"),
    sort: int(formData, "sort"),
  };

  if (id) {
    await prisma.material.update({ where: { id }, data });
  } else {
    await prisma.material.create({ data });
  }

  revalidatePath("/admin/content");
  redirect("/admin/content?ok=saved");
}

export async function toggleMaterialPublish(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData, "id");
  if (!id) redirect("/admin/content");

  const material = await prisma.material.findUnique({ where: { id } });
  if (!material) redirect("/admin/content");

  await prisma.material.update({
    where: { id },
    data: { isPublished: !material.isPublished },
  });

  revalidatePath("/admin/content");
  redirect("/admin/content?ok=saved");
}

export async function saveSettings(formData: FormData): Promise<void> {
  await requireAdmin();
  const entries: [string, string][] = [
    ["admin_chat_id", str(formData, "admin_chat_id")],
    ["app_url", str(formData, "app_url")],
  ];

  for (const [key, value] of entries) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  revalidatePath("/admin/settings");
  redirect("/admin/settings?ok=saved");
}

export async function resetDemoData(): Promise<void> {
  await requireAdmin();
  await seedDatabase(prisma);
  revalidatePath("/", "layout");
  redirect("/admin/settings?ok=reset");
}
