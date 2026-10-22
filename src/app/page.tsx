import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  CreditCard,
  Languages,
  Layers,
  Send,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { getLandingStats } from "@/lib/analytics";
import { getCurrentAdmin } from "@/lib/auth";
import { formatMoney, formatNumber } from "@/lib/format";
import { getDict, getLocale } from "@/lib/i18n";
import { Badge } from "@/components/ui";
import { LocaleSwitch } from "@/components/locale-switch";
import { PhoneMock } from "@/components/phone";

const FEATURE_ICONS = [
  <Languages key="lang" size={18} />,
  <CreditCard key="card" size={18} />,
  <BookOpen key="book" size={18} />,
  <Send key="send" size={18} />,
  <BarChart3 key="chart" size={18} />,
  <ShieldCheck key="shield" size={18} />,
];

export default async function LandingPage() {
  const locale = await getLocale();
  const d = getDict(locale);
  const [stats, admin] = await Promise.all([getLandingStats(), getCurrentAdmin()]);

  const adminHref = admin ? "/admin" : "/login";
  const adminLabel = admin ? d.nav.dashboard : d.landing.ctaPrimary;

  const statsRow = [
    { value: formatNumber(locale, stats.users), label: d.landing.statUsers },
    { value: formatMoney(locale, stats.mrr), label: d.landing.statRevenue },
    { value: formatNumber(locale, stats.plans), label: d.landing.statPlans },
    { value: `${stats.retention}%`, label: d.landing.statRetention },
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line/80 bg-ink-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-cyan-300 text-ink-950 shadow-glow">
              <Zap size={16} strokeWidth={2.6} />
            </span>
            <span className="text-sm font-semibold tracking-tight text-white">Flowdesk</span>
          </Link>

          <nav className="ml-6 hidden items-center gap-6 text-sm text-slate-400 md:flex">
            <a href="#features" className="transition hover:text-white">
              {d.landing.featuresTitle}
            </a>
            <a href="#case" className="transition hover:text-white">
              {d.landing.caseTitle}
            </a>
            <a href="#stack" className="transition hover:text-white">
              {d.landing.techTitle}
            </a>
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <LocaleSwitch locale={locale} />
            <Link href={adminHref} className="btn btn-primary btn-sm">
              {adminLabel}
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid" aria-hidden="true" />
          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:pb-24">
            <div className="animate-fade-up">
              <Badge tone="accent" className="px-3 py-1 text-[11px]">
                <Sparkles size={12} />
                {d.landing.badge}
              </Badge>

              <h1 className="mt-5 text-balance text-[32px] font-semibold leading-[1.08] tracking-tight text-white sm:text-[44px] lg:text-[50px]">
                {d.landing.titleA}
                <br />
                <span className="gradient-text">{d.landing.titleB}</span>
              </h1>

              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-slate-400">
                {d.landing.subtitle}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link href={adminHref} className="btn btn-primary px-5 py-3">
                  {d.landing.ctaPrimary}
                  <ArrowRight size={16} />
                </Link>
                <a href="#case" className="btn btn-ghost px-5 py-3">
                  {d.landing.ctaSecondary}
                </a>
              </div>

              <p className="mt-4 font-mono text-[11px] text-slate-500">{d.landing.demoNote}</p>

              <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
                {statsRow.map((item) => (
                  <div key={item.label}>
                    <dt className="min-h-[26px] text-[11px] uppercase leading-snug tracking-wider text-slate-500">
                      {item.label}
                    </dt>
                    <dd className="mt-1 text-xl font-semibold tracking-tight text-white">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="animate-fade-up animate-delay-2">
              <PhoneMock
                title={d.landing.phone.title}
                status={d.landing.phone.status}
                messages={d.landing.phone.messages}
              />
            </div>
          </div>
        </section>

        {/* features */}
        <section id="features" className="border-t border-line/60 py-16 sm:py-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {d.landing.featuresTitle}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {d.landing.featuresSubtitle}
              </p>
            </div>

            <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {d.landing.features.map((feature, index) => (
                <article
                  key={feature.title}
                  className="card card-hover group p-5"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent-soft transition group-hover:border-accent/40">
                    {FEATURE_ICONS[index]}
                  </span>
                  <h3 className="mt-4 text-[15px] font-semibold text-white">{feature.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">{feature.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* flow */}
        <section className="border-t border-line/60 bg-ink-900/30 py-16 sm:py-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {d.landing.flowTitle}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-400">{d.landing.flowSubtitle}</p>

            <ol className="mt-9 grid gap-4 md:grid-cols-3">
              {d.landing.flowSteps.map((step, index) => (
                <li key={step.title} className="card relative p-5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/30 bg-accent/10 font-mono text-xs font-semibold text-accent-soft">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 text-[15px] font-semibold text-white">{step.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">{step.text}</p>
                  {index < 2 ? (
                    <ArrowRight
                      size={16}
                      className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-slate-600 md:block"
                      aria-hidden="true"
                    />
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* case */}
        <section id="case" className="border-t border-line/60 py-16 sm:py-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {d.landing.caseTitle}
                </h2>
                <p className="mt-2 text-sm text-slate-400">{d.landing.caseSubtitle}</p>
              </div>
              <Badge tone="success">
                <CheckCircle2 size={12} /> shipped
              </Badge>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {d.landing.resultMetrics.map((metric) => (
                <div key={metric.label} className="card p-5">
                  <p className="text-2xl font-semibold tracking-tight text-white">{metric.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{metric.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {[
                { title: d.landing.problemTitle, text: d.landing.problemText, icon: <BarChart3 size={16} /> },
                { title: d.landing.solutionTitle, text: d.landing.solutionText, icon: <Layers size={16} /> },
                { title: d.landing.resultTitle, text: d.landing.resultText, icon: <Sparkles size={16} /> },
              ].map((block) => (
                <article key={block.title} className="card p-5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-ink-800 text-slate-300">
                    {block.icon}
                  </span>
                  <h3 className="mt-3 text-[13px] font-semibold uppercase tracking-wider text-slate-500">
                    {block.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-300">{block.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* stack */}
        <section id="stack" className="border-t border-line/60 bg-ink-900/30 py-16 sm:py-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {d.landing.techTitle}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-400">{d.landing.techSubtitle}</p>

            <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {d.landing.techGroups.map((group) => (
                <div key={group.name} className="card p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {group.name}
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {group.items.map((item) => (
                      <li key={item} className="chip">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* cta */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl border border-accent/25 bg-gradient-to-br from-accent/12 via-ink-900 to-ink-900 p-8 sm:p-12">
              <div className="absolute inset-0 bg-grid opacity-40" aria-hidden="true" />
              <div className="relative flex flex-wrap items-center justify-between gap-6">
                <div className="max-w-xl">
                  <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    {d.landing.ctaTitle}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{d.landing.ctaText}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href={adminHref} className="btn btn-primary px-5 py-3">
                    {d.landing.ctaButton}
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line/60 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 text-xs text-slate-500 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-accent to-cyan-300 text-ink-950">
              <Zap size={12} strokeWidth={2.8} />
            </span>
            <span className="font-medium text-slate-300">Flowdesk</span>
            <span className="text-slate-600">·</span>
            <span>{d.landing.footerNote}</span>
          </div>
          <div className="flex items-center gap-3">
            <LocaleSwitch locale={locale} />
          </div>
        </div>
      </footer>
    </div>
  );
}
