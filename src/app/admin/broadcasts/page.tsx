import { Megaphone, Send } from "lucide-react";
import { saveBroadcast } from "@/app/actions";
import { prisma } from "@/lib/db";
import { formatDateTime, formatNumber } from "@/lib/format";
import { getDict, getLocale } from "@/lib/i18n";
import { Badge, EmptyState, Field, Notice, PageHeader, SectionCard } from "@/components/ui";

export default async function BroadcastsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const locale = await getLocale();
  const d = getDict(locale);
  const { ok } = await searchParams;

  const broadcasts = await prisma.broadcast.findMany({ orderBy: { createdAt: "desc" }, take: 30 });

  const audienceLabel: Record<string, string> = {
    all: d.broadcasts.audienceAll,
    free: d.broadcasts.audienceFree,
    pro: d.broadcasts.audiencePro,
    business: d.broadcasts.audienceBusiness,
    inactive: d.broadcasts.audienceInactive,
  };

  const notices: Record<string, { tone: "success" | "warning"; text: string }> = {
    sent: { tone: "success", text: `${d.broadcasts.statusSent} ✓` },
    draft: { tone: "success", text: d.broadcasts.statusDraft },
    required: { tone: "warning", text: d.common.required },
  };

  return (
    <div className="space-y-5">
      <PageHeader title={d.broadcasts.title} subtitle={d.broadcasts.subtitle} />

      {ok && notices[ok] ? <Notice tone={notices[ok].tone}>{notices[ok].text}</Notice> : null}

      <SectionCard title={d.broadcasts.composer} hint={d.broadcasts.textHint}>
        <form action={saveBroadcast} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={d.broadcasts.name}>
              <input className="input" name="title" required maxLength={120} />
            </Field>
            <Field label={d.broadcasts.audience}>
              <select className="input" name="audience" defaultValue="all">
                <option value="all">{d.broadcasts.audienceAll}</option>
                <option value="free">{d.broadcasts.audienceFree}</option>
                <option value="pro">{d.broadcasts.audiencePro}</option>
                <option value="business">{d.broadcasts.audienceBusiness}</option>
                <option value="inactive">{d.broadcasts.audienceInactive}</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Field label={d.broadcasts.textRu}>
              <textarea className="input min-h-[130px]" name="textRu" required />
            </Field>
            <Field label={d.broadcasts.textEn}>
              <textarea className="input min-h-[130px]" name="textEn" />
            </Field>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line-soft pt-4">
            <button type="submit" name="intent" value="draft" className="btn btn-ghost">
              {d.broadcasts.saveDraft}
            </button>
            <button type="submit" name="intent" value="send" className="btn btn-primary">
              <Send size={15} />
              {d.broadcasts.sendNow}
            </button>
          </div>
        </form>
      </SectionCard>

      <div className="card overflow-hidden">
        {broadcasts.length === 0 ? (
          <EmptyState title={d.broadcasts.empty} icon={<Megaphone size={24} />} />
        ) : (
          <>
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line-soft">
                    <th className="table-head px-5 py-3">{d.broadcasts.name}</th>
                    <th className="table-head px-3 py-3">{d.broadcasts.audience}</th>
                    <th className="table-head px-3 py-3">{d.common.status}</th>
                    <th className="table-head px-3 py-3">{d.broadcasts.recipients}</th>
                    <th className="table-head px-3 py-3">{d.broadcasts.delivered}</th>
                    <th className="table-head px-5 py-3 text-right">{d.broadcasts.sentAt}</th>
                  </tr>
                </thead>
                <tbody>
                  {broadcasts.map((broadcast) => (
                    <tr key={broadcast.id} className="border-b border-line-soft/60 last:border-0">
                      <td className="px-5 py-3">
                        <p className="font-medium text-white">{broadcast.title}</p>
                        <p className="mt-0.5 line-clamp-1 max-w-md text-xs text-slate-500">
                          {broadcast.textRu}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-400">
                        {audienceLabel[broadcast.audience] ?? broadcast.audience}
                      </td>
                      <td className="px-3 py-3">
                        <Badge tone={broadcast.status === "sent" ? "success" : "muted"}>
                          {broadcast.status === "sent"
                            ? d.broadcasts.statusSent
                            : d.broadcasts.statusDraft}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-slate-300">
                        {formatNumber(locale, broadcast.recipients)}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-slate-300">
                        {formatNumber(locale, broadcast.delivered)}
                        {broadcast.openRate > 0 ? (
                          <span className="ml-2 text-[10px] text-slate-500">{broadcast.openRate}%</span>
                        ) : null}
                      </td>
                      <td className="px-5 py-3 text-right text-xs text-slate-500">
                        {broadcast.sentAt ? formatDateTime(locale, broadcast.sentAt) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-line-soft md:hidden">
              {broadcasts.map((broadcast) => (
                <li key={broadcast.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-white">{broadcast.title}</p>
                    <Badge tone={broadcast.status === "sent" ? "success" : "muted"}>
                      {broadcast.status === "sent" ? d.broadcasts.statusSent : d.broadcasts.statusDraft}
                    </Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">{broadcast.textRu}</p>
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    {audienceLabel[broadcast.audience] ?? broadcast.audience} ·{" "}
                    {formatNumber(locale, broadcast.delivered)}/{formatNumber(locale, broadcast.recipients)}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
