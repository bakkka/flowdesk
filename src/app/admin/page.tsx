import { getDashboardData } from "@/lib/analytics";
import { formatMoney, formatNumber, formatPercent, formatRelative } from "@/lib/format";
import { getDict, getLocale } from "@/lib/i18n";
import { AreaChart, Donut } from "@/components/charts";
import { Avatar, Badge, EmptyState, PageHeader, SectionCard, Stat } from "@/components/ui";

export default async function DashboardPage() {
  const locale = await getLocale();
  const d = getDict(locale);
  const data = await getDashboardData();

  const planSlices = data.planSplit.map((slice) => ({
    label: locale === "ru" ? slice.nameRu : slice.nameEn,
    value: slice.count,
    color: slice.color,
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        title={d.dashboard.title}
        action={<Badge tone="neutral">{d.dashboard.period}</Badge>}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat
          label={d.dashboard.users}
          value={formatNumber(locale, data.totalUsers)}
          accent
        />
        <Stat
          label={d.dashboard.mrr}
          value={formatMoney(locale, data.mrr)}
          hint={d.dashboard.mrrHint}
        />
        <Stat
          label={d.dashboard.activeSubs}
          value={formatNumber(locale, data.activeSubs)}
          hint={d.dashboard.activeSubsHint}
        />
        <Stat
          label={d.dashboard.conversion}
          value={formatPercent(locale, data.conversion)}
          hint={d.dashboard.conversionHint}
        />
        <Stat
          label={d.dashboard.newUsers}
          value={formatNumber(locale, data.newUsers7)}
          hint={d.dashboard.newUsersHint}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          className="lg:col-span-2"
          title={d.dashboard.revenue}
        >
          <AreaChart data={data.revenueSeries} locale={locale} format="money" />
        </SectionCard>

        <SectionCard title={d.dashboard.planSplit}>
          <div className="flex flex-col items-center gap-5">
            <Donut
              slices={planSlices}
              centerValue={formatNumber(locale, data.totalUsers)}
              centerLabel={d.dashboard.users}
            />
            <ul className="w-full space-y-2.5">
              {data.planSplit.map((slice) => (
                <li key={slice.code} className="flex items-center gap-2 text-sm">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: slice.color }}
                    aria-hidden="true"
                  />
                  <span className="text-slate-300">
                    {locale === "ru" ? slice.nameRu : slice.nameEn}
                  </span>
                  <span className="ml-auto font-mono text-xs text-slate-400">
                    {formatNumber(locale, slice.count)}
                  </span>
                  <span className="w-10 text-right text-xs text-slate-500">
                    {formatPercent(locale, data.totalUsers ? (slice.count / data.totalUsers) * 100 : 0, 0)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          className="lg:col-span-2"
          title={d.dashboard.growth}
        >
          <AreaChart data={data.growthSeries} locale={locale} color="#34D399" />
        </SectionCard>

        <SectionCard
          title={d.dashboard.recent}
          bodyClassName="flex min-h-0 flex-col overflow-hidden p-0"
          className="overflow-hidden lg:h-[300px]"
        >
          {data.recentEvents.length === 0 ? (
            <EmptyState title={d.dashboard.emptyEvents} />
          ) : (
            <ul
              className="min-h-0 flex-1 divide-y divide-line-soft overflow-y-auto"
              style={{ maskImage: "linear-gradient(to bottom, black calc(100% - 26px), transparent)" }}
            >
              {data.recentEvents.map((event) => (
                <li key={event.id} className="flex items-start gap-3 px-5 py-3">
                  <Avatar name={event.userName} className="h-7 w-7 text-[10px]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-slate-200">
                      <span className="font-medium text-white">{event.userName}</span>{" "}
                      <span className="text-slate-500">
                        {d.dashboard.events[event.type as keyof typeof d.dashboard.events] ?? event.type}
                      </span>
                      {event.label ? <span className="text-slate-400"> · {event.label}</span> : null}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {event.username ? `@${event.username} · ` : ""}
                      {formatRelative(locale, event.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
