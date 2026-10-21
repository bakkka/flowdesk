import { Bot, Database, RotateCcw, Save, ShieldCheck, Terminal } from "lucide-react";
import { resetDemoData, saveSettings } from "@/app/actions";
import { prisma } from "@/lib/db";
import { getDict, getLocale } from "@/lib/i18n";
import { Badge, Field, Notice, PageHeader, SectionCard } from "@/components/ui";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const locale = await getLocale();
  const d = getDict(locale);
  const { ok } = await searchParams;

  const rows = await prisma.setting.findMany();
  const settings = new Map(rows.map((row) => [row.key, row.value]));
  const tokenConfigured = Boolean(process.env.TELEGRAM_BOT_TOKEN);

  return (
    <div className="space-y-5">
      <PageHeader title={d.settings.title} subtitle={d.settings.subtitle} />

      {ok === "saved" ? <Notice tone="success">{d.settings.saved}</Notice> : null}
      {ok === "reset" ? <Notice tone="success">{d.settings.resetDone}</Notice> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title={d.settings.bot} hint={d.settings.botStatus}>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-xl border border-line-soft bg-ink-900/60 p-3">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                  tokenConfigured
                    ? "border-mint/30 bg-mint/10 text-mint"
                    : "border-line bg-ink-800 text-slate-500"
                }`}
              >
                <Bot size={19} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white">
                  {tokenConfigured ? d.settings.connected : d.settings.offline}
                </p>
                <p className="truncate font-mono text-[11px] text-slate-500">
                  {tokenConfigured ? "TELEGRAM_BOT_TOKEN=••••••••" : "TELEGRAM_BOT_TOKEN —"}
                </p>
              </div>
              <Badge tone={tokenConfigured ? "success" : "muted"}>
                {tokenConfigured ? d.common.on : d.common.off}
              </Badge>
            </div>

            <p className="text-xs leading-relaxed text-slate-500">{d.settings.envHint}</p>

            <div className="rounded-xl border border-line-soft bg-ink-950/70 p-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <Terminal size={12} /> CLI
              </p>
              <code className="block font-mono text-[11px] leading-relaxed text-slate-300">
                npm run bot
              </code>
            </div>
          </div>
        </SectionCard>

        <SectionCard className="lg:col-span-2" title={d.settings.general} hint={d.settings.subtitle}>
          <form action={saveSettings} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={d.settings.adminChat} hint="Telegram chat id for alerts">
                <input
                  className="input font-mono"
                  name="admin_chat_id"
                  defaultValue={settings.get("admin_chat_id") ?? ""}
                />
              </Field>
              <Field label={d.settings.appUrl} hint="NEXT_PUBLIC_APP_URL">
                <input
                  className="input font-mono"
                  name="app_url"
                  defaultValue={settings.get("app_url") ?? "http://localhost:3000"}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={d.settings.provider}>
                <input className="input" value={d.settings.providerMock} readOnly />
              </Field>
              <Field label={d.settings.currency}>
                <input className="input" value="RUB" readOnly />
              </Field>
            </div>

            <div className="flex justify-end border-t border-line-soft pt-4">
              <button type="submit" className="btn btn-primary">
                <Save size={15} />
                {d.common.save}
              </button>
            </div>
          </form>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title={d.landing.techTitle} hint={d.landing.techSubtitle}>
          <ul className="space-y-2.5 text-sm text-slate-300">
            {d.settings.stackLines.map((line, index) => (
              <li key={line} className="flex items-center gap-2">
                {index === 0 ? (
                  <ShieldCheck size={15} className="shrink-0 text-mint" />
                ) : index === 1 ? (
                  <Database size={15} className="shrink-0 text-accent-soft" />
                ) : (
                  <Bot size={15} className="shrink-0 text-amber" />
                )}
                {line}
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title={d.settings.danger} hint={d.settings.resetHint}>
          <form action={resetDemoData} className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-xs text-xs leading-relaxed text-slate-500">
              {d.landing.footerNote}
            </p>
            <button type="submit" className="btn btn-danger">
              <RotateCcw size={15} />
              {d.settings.reset}
            </button>
          </form>
        </SectionCard>
      </div>
    </div>
  );
}
