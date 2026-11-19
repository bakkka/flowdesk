import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getDict, getLocale } from "@/lib/i18n";
import { PageHeader } from "@/components/ui";
import { PlanForm } from "../plan-form";

export default async function NewPlanPage() {
  const locale = await getLocale();
  const d = getDict(locale);

  return (
    <div>
      <Link
        href="/admin/plans"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-white"
      >
        <ArrowLeft size={14} />
        {d.plans.title}
      </Link>
      <PageHeader title={d.plans.create} />
      <PlanForm d={d} submitLabel={d.plans.savePlan} />
    </div>
  );
}
