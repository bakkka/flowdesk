import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { changeUserPlan, toggleUserBlock } from "@/app/actions";
import { prisma } from "@/lib/db";
import { formatDate, formatDateTime, formatMoney, formatRelative } from "@/lib/format";
import { getDict, getLocale } from "@/lib/i18n";
import { Avatar, Badge, Notice, SectionCard } from "@/components/ui";

export default async function UserPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const { id } = await params;
  const { ok } = await searchParams;
  const locale = await getLocale();
  const d = getDict(locale);

  const [user, plans] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      include: {
        plan: true,
        payments: { orderBy: { createdAt: "desc" }, take: 12, include: { plan: true } },
        events: { orderBy: { createdAt: "desc" }, take: 12 },
        _count: { select: { payments: true } },
      },
    }),
    prisma.plan.findMany({ orderBy: { sort: "asc" } }),
  ]);

  if (!user) notFound();

  const planName = user.plan
    ? locale === "ru"
      ? user.plan.nameRu
      : user.plan.nameEn
    : d.users.noPlan;

  return (
    <div className="space-y-5">
      <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-white">
        <ArrowLeft size={14} />
        {d.users.title}
      </Link>

      {ok ? <Notice tone="success">{d.common.saved}</Notice> : null}

      <div className="card flex flex-wrap items-center gap-4 p-5">
        <Avatar name={`${user.firstName} ${user.lastName ?? ""}`} className="h-14 w-14 text-lg" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold tracking-tight text-white">
            {user.firstName} {user.lastName}
          </h1>
          <p className="mt-0.5 text-sm text-slate-400">
            {user.username ? `@${user.username}` : user.telegramId}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={user.planCode === "business" ? "warning" : user.planCode === "pro" ? "accent" : "muted"}>
            {planName}
          </Badge>
          <Badge tone={user.status === "blocked" ? "danger" : "success"}>
            {user.status === "blocked" ? d.users.blocked : d.users.active}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionCard title={d.users.changePlan}>
            <form action={changeUserPlan} className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="userId" value={user.id} />
              <label className="min-w-[200px] flex-1">
                <span className="label">{d.users.plan}</span>
                <select className="input" name="planCode" defaultValue={user.planCode ?? "none"}>
                  <option value="none">{d.users.noPlan}</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.code}>
                      {locale === "ru" ? plan.nameRu : plan.nameEn} ·{" "}
                      {plan.priceRub ? formatMoney(locale, plan.priceRub) : d.common.free}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className="btn btn-primary">
                {d.common.save}
              </button>
            </form>
            {user.subscriptionEndsAt ? (
              <p className="mt-3 text-xs text-slate-500">
                {d.users.until} {formatDate(locale, user.subscriptionEndsAt)}
              </p>
            ) : null}
          </SectionCard>

          <SectionCard title={d.users.payments} bodyClassName="p-0">
            {user.payments.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">{d.common.empty}</p>
            ) : (
              <ul className="divide-y divide-line-soft">
                {user.payments.map((payment) => (
                  <li key={payment.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-200">
                        {locale === "ru" ? payment.plan.nameRu : payment.plan.nameEn}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {formatDateTime(locale, payment.createdAt)}
                      </p>
                    </div>
                    <span className="font-mono text-xs text-slate-300">
                      {formatMoney(locale, payment.amount, payment.currency)}
                    </span>
                    <Badge
                      tone={
                        payment.status === "paid"
                          ? "success"
                          : payment.status === "refunded"
                            ? "warning"
                            : "danger"
                      }
                    >
                      {payment.status === "paid"
                        ? d.common.paid
                        : payment.status === "refunded"
                          ? d.common.refunded
                          : d.common.failed}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title={d.users.events} bodyClassName="p-0">
            {user.events.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">{d.dashboard.emptyEvents}</p>
            ) : (
              <ul className="divide-y divide-line-soft">
                {user.events.map((event) => (
                  <li key={event.id} className="flex items-center gap-3 px-5 py-2.5 text-[13px]">
                    <span className="text-slate-300">
                      {d.dashboard.events[event.type as keyof typeof d.dashboard.events] ?? event.type}
                    </span>
                    {event.label ? <span className="text-slate-500">· {event.label}</span> : null}
                    <span className="ml-auto text-[11px] text-slate-500">
                      {formatRelative(locale, event.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title={d.users.user}>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Telegram ID</dt>
                <dd className="font-mono text-xs text-slate-300">{user.telegramId}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">
                  {d.common.language}
                </dt>
                <dd className="uppercase text-slate-300">{user.language}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">{d.users.source}</dt>
                <dd className="text-slate-300">{user.source}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">{d.users.segment}</dt>
                <dd className="text-slate-300">{user.segment}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">{d.users.created}</dt>
                <dd className="text-slate-300">{formatDate(locale, user.createdAt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">{d.users.lastSeen}</dt>
                <dd className="text-slate-300">{formatRelative(locale, user.lastActiveAt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">{d.users.paymentsCount}</dt>
                <dd className="text-slate-300">{user._count.payments}</dd>
              </div>
            </dl>
          </SectionCard>

          <SectionCard title={d.common.actions}>
            <form action={toggleUserBlock}>
              <input type="hidden" name="userId" value={user.id} />
              <button
                type="submit"
                className={user.status === "blocked" ? "btn btn-ghost w-full" : "btn btn-danger w-full"}
              >
                {user.status === "blocked" ? d.users.unblock : d.users.block}
              </button>
            </form>
            <p className="mt-3 text-[11px] leading-relaxed text-slate-500">{d.users.blockHint}</p>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
