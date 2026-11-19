import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { deletePlan } from "@/app/actions";
import { prisma } from "@/lib/db";
import { formatNumber } from "@/lib/format";
import { getDict, getLocale } from "@/lib/i18n";
import { PageHeader } from "@/components/ui";
import { PlanForm } from "../plan-form";

export default async function EditPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getLocale();
  const d = getDict(locale);

  const plan = await prisma.plan.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });

  if (!plan) notFound();

  return (
    <div>
      <Link
        href="/admin/plans"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-white"
      >
        <ArrowLeft size={14} />
        {d.plans.title}
      </Link>

      <PageHeader
        title={locale === "ru" ? plan.nameRu : plan.nameEn}
        subtitle={`${formatNumber(locale, plan._count.users)} ${d.plans.subscribers}`}
      />

      <PlanForm plan={plan} d={d} submitLabel={d.common.save} />

      <div className="card mt-4 flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="text-sm font-medium text-slate-200">
            {plan._count.users > 0 ? d.plans.deleteHint : d.common.delete}
          </p>
        </div>
        <form action={deletePlan}>
          <input type="hidden" name="id" value={plan.id} />
          <button
            type="submit"
            disabled={plan._count.users > 0}
            className="btn btn-danger btn-sm"
          >
            {d.common.delete}
          </button>
        </form>
      </div>
    </div>
  );
}
