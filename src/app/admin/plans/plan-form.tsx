import { savePlan } from "@/app/actions";
import type { Dict } from "@/lib/i18n";
import { Field } from "@/components/ui";

type PlanLike = {
  id: string;
  code: string;
  nameRu: string;
  nameEn: string;
  taglineRu: string;
  taglineEn: string;
  priceRub: number;
  priceStars: number;
  durationDays: number;
  featuresRu: string;
  featuresEn: string;
  sort: number;
  isFeatured: boolean;
  isActive: boolean;
};

export function PlanForm({
  plan,
  d,
  submitLabel,
}: {
  plan?: PlanLike;
  d: Dict;
  submitLabel: string;
}) {
  return (
    <form action={savePlan} className="card space-y-5 p-5 sm:p-6">
      {plan ? <input type="hidden" name="id" value={plan.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={d.plans.code} hint="a-z, 0-9, -, _" className="sm:max-w-[220px]">
          <input className="input font-mono" name="code" defaultValue={plan?.code} required />
        </Field>
        <Field label={d.plans.sort}>
          <input className="input" type="number" name="sort" defaultValue={plan?.sort ?? 10} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={d.plans.nameRu}>
          <input className="input" name="nameRu" defaultValue={plan?.nameRu} required />
        </Field>
        <Field label={d.plans.nameEn}>
          <input className="input" name="nameEn" defaultValue={plan?.nameEn} required />
        </Field>
        <Field label={d.plans.taglineRu}>
          <input className="input" name="taglineRu" defaultValue={plan?.taglineRu} />
        </Field>
        <Field label={d.plans.taglineEn}>
          <input className="input" name="taglineEn" defaultValue={plan?.taglineEn} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={d.plans.priceRub}>
          <input className="input" type="number" min="0" name="priceRub" defaultValue={plan?.priceRub ?? 0} />
        </Field>
        <Field label={d.plans.priceStars}>
          <input className="input" type="number" min="0" name="priceStars" defaultValue={plan?.priceStars ?? 0} />
        </Field>
        <Field label={d.plans.durationDays}>
          <input
            className="input"
            type="number"
            min="0"
            name="durationDays"
            defaultValue={plan?.durationDays ?? 30}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={d.plans.featuresRu}>
          <textarea className="input min-h-[110px]" name="featuresRu" defaultValue={plan?.featuresRu} />
        </Field>
        <Field label={d.plans.featuresEn}>
          <textarea className="input min-h-[110px]" name="featuresEn" defaultValue={plan?.featuresEn} />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={plan ? plan.isActive : true}
            className="h-4 w-4 rounded border-line accent-[#2AABEE]"
          />
          {d.plans.active}
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            name="isFeatured"
            defaultChecked={plan?.isFeatured ?? false}
            className="h-4 w-4 rounded border-line accent-[#2AABEE]"
          />
          {d.plans.featured}
        </label>
      </div>

      <div className="flex justify-end border-t border-line-soft pt-4">
        <button type="submit" className="btn btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
