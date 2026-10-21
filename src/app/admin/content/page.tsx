import { BookOpen, Eye, EyeOff, FileText, PlayCircle, Plus } from "lucide-react";
import { saveMaterial, toggleMaterialPublish } from "@/app/actions";
import { prisma } from "@/lib/db";
import { getDict, getLocale } from "@/lib/i18n";
import { Badge, EmptyState, Field, Notice, PageHeader, SectionCard } from "@/components/ui";

const KIND_ICONS: Record<string, React.ReactNode> = {
  lesson: <BookOpen size={15} />,
  guide: <FileText size={15} />,
  video: <PlayCircle size={15} />,
};

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const locale = await getLocale();
  const d = getDict(locale);
  const { ok } = await searchParams;

  const [materials, plans] = await Promise.all([
    prisma.material.findMany({ orderBy: { sort: "asc" }, include: { minPlanRef: true } }),
    prisma.plan.findMany({ orderBy: { sort: "asc" } }),
  ]);

  const kindLabel: Record<string, string> = {
    lesson: d.content.kindLesson,
    guide: d.content.kindGuide,
    video: d.content.kindVideo,
  };

  return (
    <div className="space-y-5">
      <PageHeader title={d.content.title} subtitle={d.content.subtitle} />

      {ok === "saved" ? <Notice tone="success">{d.common.saved}</Notice> : null}
      {ok === "noplan" ? <Notice tone="warning">{d.common.error}</Notice> : null}

      <details className="card group overflow-hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">
          <span className="flex items-center gap-2 text-sm font-semibold text-white">
            <Plus size={16} className="text-accent-soft" />
            {d.content.create}
          </span>
          <span className="text-xs text-slate-500 group-open:hidden">▾</span>
          <span className="hidden text-xs text-slate-500 group-open:block">▴</span>
        </summary>
        <form action={saveMaterial} className="space-y-4 border-t border-line-soft p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={d.content.titleRu}>
              <input className="input" name="titleRu" required />
            </Field>
            <Field label={d.content.titleEn}>
              <input className="input" name="titleEn" />
            </Field>
            <Field label={d.content.summaryRu}>
              <input className="input" name="summaryRu" />
            </Field>
            <Field label={d.content.summaryEn}>
              <input className="input" name="summaryEn" />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <Field label={d.content.kind}>
              <select className="input" name="kind" defaultValue="lesson">
                <option value="lesson">{d.content.kindLesson}</option>
                <option value="guide">{d.content.kindGuide}</option>
                <option value="video">{d.content.kindVideo}</option>
              </select>
            </Field>
            <Field label={d.content.minPlan}>
              <select className="input" name="minPlan" defaultValue="free">
                {plans.map((plan) => (
                  <option key={plan.code} value={plan.code}>
                    {locale === "ru" ? plan.nameRu : plan.nameEn}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={d.content.duration}>
              <input className="input" type="number" min="0" name="durationMin" defaultValue={10} />
            </Field>
            <Field label={d.plans.sort}>
              <input className="input" type="number" name="sort" defaultValue={materials.length} />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              name="isPublished"
              defaultChecked
              className="h-4 w-4 rounded border-line accent-[#2AABEE]"
            />
            {d.content.published}
          </label>

          <div className="flex justify-end border-t border-line-soft pt-4">
            <button type="submit" className="btn btn-primary">
              {d.content.save}
            </button>
          </div>
        </form>
      </details>

      <div className="card overflow-hidden">
        {materials.length === 0 ? (
          <EmptyState title={d.content.empty} icon={<BookOpen size={24} />} />
        ) : (
          <ul className="divide-y divide-line-soft">
            {materials.map((material) => (
              <li key={material.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-ink-800 text-slate-400">
                  {KIND_ICONS[material.kind] ?? <BookOpen size={15} />}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {locale === "ru" ? material.titleRu : material.titleEn}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {locale === "ru" ? material.summaryRu : material.summaryEn}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="hidden text-[11px] text-slate-500 sm:inline">
                    {kindLabel[material.kind] ?? material.kind}
                    {material.durationMin ? ` · ${material.durationMin} ${d.common.minutes}` : ""}
                  </span>
                  <Badge tone="accent">
                    {d.content.openLevel}{" "}
                    {locale === "ru" ? material.minPlanRef.nameRu : material.minPlanRef.nameEn}
                  </Badge>
                  <Badge tone={material.isPublished ? "success" : "muted"}>
                    {material.isPublished ? d.content.published : d.content.hidden}
                  </Badge>
                  <form action={toggleMaterialPublish}>
                    <input type="hidden" name="id" value={material.id} />
                    <button
                      type="submit"
                      className="btn btn-ghost btn-sm"
                      title={material.isPublished ? d.content.hidden : d.content.published}
                      aria-label={material.isPublished ? d.content.hidden : d.content.published}
                    >
                      {material.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
