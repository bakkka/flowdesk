import Link from "next/link";
import { Check, Pencil, Plus, Star, Users } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatMoney, formatNumber } from "@/lib/format";
import { getDict, getLocale } from "@/lib/i18n";
import { Badge, Notice, PageHeader } from "@/components/ui";

export default async function PlansPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const locale = await getLocale();
  const d = getDict(locale);
  const { ok } = await searchParams;

  const [plans, grouped] = await Promise.all([
    prisma.plan.findMany({ orderBy: { sort: "asc" } }),
    prisma.user.groupBy({ by: ["planCode"], _count: { _all: true } }),
  ]);

  const counts = new Map(grouped.map((row) => [row.planCode ?? "none", row._count._all]));
  const freeCount = (counts.get("free") ?? 0) + (counts.get("none") ?? 0);

  const notices: Record<string, string> = {
    saved: d.common.saved,
    deleted: d.common.saved,
    badcode: d.plans.code + ": a-z, 0-9, -, _",
    inuse: d.plans.deleteHint,
  };

  return (
    <div>
      <PageHeader
        title={d.plans.title}
        subtitle={d.plans.subtitle}
        action={
          <Link href="/admin/plans/new" className="btn btn-primary">
            <Plus size={16} />
            {d.plans.create}
          </Link>
        }
      />

      {ok && notices[ok] ? <Notice tone={ok === "saved" || ok === "deleted" ? "success" : "warning"}>{notices[ok]}</Notice> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => {
          const features = (locale === "ru" ? plan.featuresRu : plan.featuresEn)
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);

          return (
            <div
              key={plan.id}
              className={`card relative flex flex-col p-5 ${
                plan.isFeatured ? "border-accent/40 shadow-glow" : ""
              }`}
            >
              {plan.isFeatured ? (
                <span className="absolute right-4 top-4">
                  <Badge tone="accent">
                    <Star size={11} /> Pro
                  </Badge>
                </span>
              ) : null}

              <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">{plan.code}</p>
              <h3 className="mt-1 text-lg font-semibold text-white">
                {locale === "ru" ? plan.nameRu : plan.nameEn}
              </h3>
              <p className="mt-0.5 min-h-[18px] text-xs text-slate-400">
                {locale === "ru" ? plan.taglineRu : plan.taglineEn}
              </p>

              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-2xl font-semibold tracking-tight text-white">
                  {plan.priceRub > 0 ? formatMoney(locale, plan.priceRub) : d.common.free}
                </span>
                {plan.priceRub > 0 ? <span className="text-xs text-slate-500">/ {d.common.perMonth}</span> : null}
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                {plan.priceStars > 0 ? `${plan.priceStars} ⭐ · ` : ""}
                {plan.durationDays} {d.common.days}
              </p>

              <ul className="mt-4 flex-1 space-y-2 text-[13px] text-slate-300">
                {features.slice(0, 5).map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check size={14} className="mt-0.5 shrink-0 text-mint" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex items-center justify-between border-t border-line-soft pt-4">
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Users size={13} />
                  {formatNumber(locale, plan.code === "free" ? freeCount : (counts.get(plan.code) ?? 0))} {d.plans.subscribers}
                </span>
                <div className="flex items-center gap-2">
                  <Badge tone={plan.isActive ? "success" : "muted"}>
                    {plan.isActive ? d.plans.shown : d.plans.hidden}
                  </Badge>
                  <Link href={`/admin/plans/${plan.id}`} className="btn btn-ghost btn-sm">
                    <Pencil size={13} />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
