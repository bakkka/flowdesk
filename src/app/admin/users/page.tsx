import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { ChevronLeft, ChevronRight, Search, Users } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatDate, formatNumber, formatRelative } from "@/lib/format";
import { getDict, getLocale } from "@/lib/i18n";
import { Avatar, Badge, EmptyState, PageHeader } from "@/components/ui";

const PAGE_SIZE = 25;

function planTone(code: string | null) {
  if (code === "business") return "warning" as const;
  if (code === "pro") return "accent" as const;
  return "muted" as const;
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; plan?: string; page?: string }>;
}) {
  const locale = await getLocale();
  const d = getDict(locale);
  const params = await searchParams;

  const q = (params.q ?? "").trim();
  const status = params.status ?? "";
  const plan = params.plan ?? "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const where: Prisma.UserWhereInput = {};
  if (q) {
    where.OR = [
      { firstName: { contains: q } },
      { lastName: { contains: q } },
      { username: { contains: q } },
      { telegramId: { contains: q } },
    ];
  }
  if (status) where.status = status;
  if (plan === "none") where.planCode = null;
  else if (plan) where.planCode = plan;

  const [total, users, plans] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { plan: true },
    }),
    prisma.plan.findMany({ orderBy: { sort: "asc" } }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const href = (nextPage: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (status) sp.set("status", status);
    if (plan) sp.set("plan", plan);
    sp.set("page", String(nextPage));
    return `/admin/users?${sp.toString()}`;
  };

  return (
    <div>
      <PageHeader
        title={d.users.title}
        subtitle={d.users.subtitle}
        action={
          <Badge tone="neutral">
            {d.common.total}: {formatNumber(locale, total)}
          </Badge>
        }
      />

      <form method="get" className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[210px] flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input pl-9"
            name="q"
            defaultValue={q}
            placeholder={d.users.searchPlaceholder}
            autoComplete="off"
          />
        </div>
        <select className="input w-auto min-w-[140px]" name="status" defaultValue={status}>
          <option value="">{d.users.allStatuses}</option>
          <option value="active">{d.users.active}</option>
          <option value="blocked">{d.users.blocked}</option>
        </select>
        <select className="input w-auto min-w-[140px]" name="plan" defaultValue={plan}>
          <option value="">{d.users.allPlans}</option>
          <option value="none">{d.users.noPlan}</option>
          {plans.map((item) => (
            <option key={item.code} value={item.code}>
              {locale === "ru" ? item.nameRu : item.nameEn}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-ghost">
          <Search size={15} />
          {d.common.search}
        </button>
      </form>

      <div className="card overflow-hidden">
        {users.length === 0 ? (
          <EmptyState title={d.users.noResults} icon={<Users size={24} />} />
        ) : (
          <>
            <div className="hidden md:block">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line-soft">
                    <th className="table-head px-5 py-3">{d.users.user}</th>
                    <th className="table-head px-3 py-3">{d.users.plan}</th>
                    <th className="table-head px-3 py-3">{d.common.status}</th>
                    <th className="table-head px-3 py-3">{d.users.created}</th>
                    <th className="table-head px-3 py-3">{d.users.lastSeen}</th>
                    <th className="table-head px-5 py-3 text-right">{d.common.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-line-soft/60 transition last:border-0 hover:bg-ink-800/40"
                    >
                      <td className="px-5 py-3">
                        <Link href={`/admin/users/${user.id}`} className="flex items-center gap-3">
                          <Avatar name={`${user.firstName} ${user.lastName ?? ""}`} />
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-white">
                              {user.firstName} {user.lastName}
                            </span>
                            <span className="block truncate text-xs text-slate-500">
                              {user.username ? `@${user.username}` : user.telegramId}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        <Badge tone={planTone(user.planCode)}>
                          {user.plan ? (locale === "ru" ? user.plan.nameRu : user.plan.nameEn) : d.users.noPlan}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <Badge tone={user.status === "blocked" ? "danger" : "success"}>
                          {user.status === "blocked" ? d.users.blocked : d.users.active}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-400">{formatDate(locale, user.createdAt)}</td>
                      <td className="px-3 py-3 text-xs text-slate-400">
                        {formatRelative(locale, user.lastActiveAt)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="inline-flex rounded-lg border border-line px-2 py-1 text-xs text-slate-400 transition hover:border-accent/40 hover:text-white"
                        >
                          <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-line-soft md:hidden">
              {users.map((user) => (
                <li key={user.id}>
                  <Link href={`/admin/users/${user.id}`} className="flex items-center gap-3 px-4 py-3">
                    <Avatar name={`${user.firstName} ${user.lastName ?? ""}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {user.username ? `@${user.username}` : user.telegramId}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge tone={planTone(user.planCode)}>
                        {user.plan ? (locale === "ru" ? user.plan.nameRu : user.plan.nameEn) : d.users.noPlan}
                      </Badge>
                      <span className="text-[10px] text-slate-500">
                        {formatRelative(locale, user.lastActiveAt)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {pages > 1 ? (
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span>
            {formatNumber(locale, (page - 1) * PAGE_SIZE + 1)}–
            {formatNumber(locale, Math.min(page * PAGE_SIZE, total))} / {formatNumber(locale, total)}
          </span>
          <div className="flex items-center gap-2">
            <Link
              href={href(page - 1)}
              aria-disabled={page <= 1}
              className={`inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 transition ${
                page <= 1 ? "pointer-events-none opacity-40" : "hover:border-accent/40 hover:text-white"
              }`}
            >
              <ChevronLeft size={14} />
            </Link>
            <span className="font-mono text-slate-400">
              {page} / {pages}
            </span>
            <Link
              href={href(page + 1)}
              aria-disabled={page >= pages}
              className={`inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 transition ${
                page >= pages ? "pointer-events-none opacity-40" : "hover:border-accent/40 hover:text-white"
              }`}
            >
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
