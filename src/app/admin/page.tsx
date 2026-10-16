import {
  BookOpen,
  CreditCard,
  Eye,
  Menu as MenuIcon,
  Send,
  Sparkles,
  Target,
  UserPlus,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { getDashboardData } from "@/lib/analytics";
import { formatMoney, formatNumber, formatPercent, formatRelative } from "@/lib/format";
import { getDict, getLocale } from "@/lib/i18n";
import { AreaChart, Donut } from "@/components/charts";
import { Avatar, Badge, EmptyState, PageHeader, SectionCard, Stat } from "@/components/ui";

const EVENT_ICONS: Record<string, React.ReactNode> = {
  start: <Zap size={13} />,
  plan_view: <Eye size={13} />,
  payment: <CreditCard size={13} />,
  material_open: <BookOpen size={13} />,
  broadcast_sent: <Send size={13} />,
  menu: <MenuIcon size={13} />,
};

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
        subtitle={d.dashboard.subtitle}
        action={
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
            </span>
            <Badge tone="neutral">{d.dashboard.period}</Badge>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat
          label={d.dashboard.users}
          value={formatNumber(locale, data.totalUsers)}
          hint={d.dashboard.usersHint}
          icon={<Users size={15} />}
          accent
        />
        <Stat
          label={d.dashboard.mrr}
          value={formatMoney(locale, data.mrr)}
          hint={d.dashboard.mrrHint}
          icon={<Wallet size={15} />}
        />
        <Stat
          label={d.dashboard.activeSubs}
          value={formatNumber(locale, data.activeSubs)}
          hint={d.dashboard.activeSubsHint}
          icon={<Sparkles size={15} />}
        />
        <Stat
          label={d.dashboard.conversion}
          value={formatPercent(locale, data.conversion)}
          hint={d.dashboard.conversionHint}
          icon={<Target size={15} />}
        />
        <Stat
          label={d.dashboard.newUsers}
          value={formatNumber(locale, data.newUsers7)}
          hint={d.dashboard.newUsersHint}
          icon={<UserPlus size={15} />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          className="lg:col-span-2"
          title={d.dashboard.revenue}
          hint={d.dashboard.revenueHint}
          action={<Badge tone="accent">{formatMoney(locale, data.mrr)}</Badge>}
        >
          <AreaChart data={data.revenueSeries} locale={locale} format="money" />
        </SectionCard>

        <SectionCard title={d.dashboard.planSplit} hint={d.dashboard.planSplitHint}>
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
          hint={d.dashboard.growthHint}
          action={
            <Badge tone="success">
              +{formatNumber(locale, data.newUsers7)} · {d.dashboard.newUsersHint}
            </Badge>
          }
        >
          <AreaChart data={data.growthSeries} locale={locale} color="#34D399" />
        </SectionCard>

        <SectionCard
          title={d.dashboard.recent}
          hint={d.dashboard.recentHint}
          bodyClassName="flex min-h-0 flex-col overflow-hidden p-0"
          className="overflow-hidden lg:h-[300px]"
        >
          {data.recentEvents.length === 0 ? (
            <EmptyState title={d.dashboard.emptyEvents} icon={<Zap size={22} />} />
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
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span className="text-slate-600">
                        {EVENT_ICONS[event.type] ?? <Zap size={12} />}
                      </span>
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
