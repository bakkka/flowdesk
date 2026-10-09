import { prisma } from "@/lib/db";

const DAY = 86_400_000;
export const PLAN_COLORS = ["#2AABEE", "#34D399", "#A78BFA", "#FBBF24", "#FB7185"];

export type SeriesPoint = { day: string; value: number };
export type PlanSlice = {
  code: string;
  nameRu: string;
  nameEn: string;
  count: number;
  color: string;
};
export type FeedItem = {
  id: string;
  type: string;
  label: string | null;
  createdAt: Date;
  userName: string;
  username: string | null;
};

export type DashboardData = {
  totalUsers: number;
  paidUsers: number;
  activeSubs: number;
  mrr: number;
  conversion: number;
  newUsers7: number;
  retention: number;
  revenueSeries: SeriesPoint[];
  growthSeries: SeriesPoint[];
  planSplit: PlanSlice[];
  recentEvents: FeedItem[];
};

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function lastDays(count: number, endOffset = 0): Date[] {
  const anchor = startOfDay(new Date());
  // endOffset=1 ends the series yesterday, so a partial current day doesn't
  // create a cliff at the right edge of the chart.
  const end = new Date(anchor.getTime() - endOffset * DAY);
  return Array.from({ length: count }, (_, i) => new Date(end.getTime() - (count - 1 - i) * DAY));
}

export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date();
  const days = lastDays(30, 1);
  const since = new Date(now.getTime() - 30 * DAY);

  const [users, payments, plans, recentEvents] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        createdAt: true,
        lastActiveAt: true,
        planCode: true,
        subscriptionEndsAt: true,
        status: true,
      },
    }),
    prisma.payment.findMany({
      where: { createdAt: { gte: since } },
      select: { amount: true, createdAt: true, status: true },
    }),
    prisma.plan.findMany({ orderBy: { sort: "asc" } }),
    prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      take: 9,
      include: { user: { select: { firstName: true, username: true } } },
    }),
  ]);

  const totalUsers = users.length;
  const paidUsers = users.filter(
    (u) =>
      u.planCode !== null &&
      u.planCode !== "free" &&
      u.subscriptionEndsAt !== null &&
      u.subscriptionEndsAt > now,
  ).length;

  const mrr = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const sevenDaysAgo = now.getTime() - 7 * DAY;
  const newUsers7 = users.filter((u) => u.createdAt.getTime() >= sevenDaysAgo).length;

  const activeLastWeek = users.filter(
    (u) => u.lastActiveAt.getTime() >= now.getTime() - 7 * DAY,
  ).length;

  const revenueBuckets = new Map<string, number>(days.map((d) => [dayKey(d), 0]));
  for (const payment of payments) {
    if (payment.status !== "paid") continue;
    const key = dayKey(payment.createdAt);
    if (revenueBuckets.has(key)) revenueBuckets.set(key, (revenueBuckets.get(key) ?? 0) + payment.amount);
  }

  const growthBuckets = new Map<string, number>(days.map((d) => [dayKey(d), 0]));
  for (const user of users) {
    const key = dayKey(user.createdAt);
    if (growthBuckets.has(key)) growthBuckets.set(key, (growthBuckets.get(key) ?? 0) + 1);
  }

  const counts = new Map<string, number>();
  for (const user of users) {
    const code = user.planCode ?? "free";
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }

  const planSplit: PlanSlice[] = plans
    .filter((p) => p.isActive)
    .map((p, index) => ({
      code: p.code,
      nameRu: p.nameRu,
      nameEn: p.nameEn,
      count: counts.get(p.code) ?? 0,
      color: PLAN_COLORS[index % PLAN_COLORS.length],
    }));

  return {
    totalUsers,
    paidUsers,
    activeSubs: paidUsers,
    mrr,
    conversion: totalUsers ? (paidUsers / totalUsers) * 100 : 0,
    newUsers7,
    retention: totalUsers ? (activeLastWeek / totalUsers) * 100 : 0,
    revenueSeries: days.map((d) => ({ day: dayKey(d), value: revenueBuckets.get(dayKey(d)) ?? 0 })),
    growthSeries: days.map((d) => ({ day: dayKey(d), value: growthBuckets.get(dayKey(d)) ?? 0 })),
    planSplit,
    recentEvents: recentEvents.map((event) => ({
      id: event.id,
      type: event.type,
      label: event.label,
      createdAt: event.createdAt,
      userName: event.user?.firstName ?? "—",
      username: event.user?.username ?? null,
    })),
  };
}

export type LandingStats = {
  users: number;
  mrr: number;
  plans: number;
  retention: number;
};

export async function getLandingStats(): Promise<LandingStats> {
  const now = new Date();
  const since = new Date(now.getTime() - 30 * DAY);

  const [users, payments, plans] = await Promise.all([
    prisma.user.findMany({ select: { lastActiveAt: true } }),
    prisma.payment.findMany({
      where: { createdAt: { gte: since }, status: "paid" },
      select: { amount: true },
    }),
    prisma.plan.count({ where: { isActive: true } }),
  ]);

  const activeLastWeek = users.filter(
    (u) => u.lastActiveAt.getTime() >= now.getTime() - 7 * DAY,
  ).length;

  return {
    users: users.length,
    mrr: payments.reduce((sum, p) => sum + p.amount, 0),
    plans,
    retention: users.length ? Math.round((activeLastWeek / users.length) * 100) : 0,
  };
}
