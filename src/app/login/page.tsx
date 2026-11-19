import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Zap } from "lucide-react";
import { signIn } from "@/app/actions";
import { getCurrentAdmin } from "@/lib/auth";
import { getDict, getLocale } from "@/lib/i18n";
import { Field, Notice } from "@/components/ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const admin = await getCurrentAdmin();
  if (admin) redirect("/admin");

  const params = await searchParams;
  const locale = await getLocale();
  const d = getDict(locale);

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-line bg-ink-900/60 p-10 lg:flex">
        <div className="absolute inset-0 bg-grid opacity-60" aria-hidden="true" />
        <div className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-cyan-300 text-ink-950 shadow-glow">
            <Zap size={20} strokeWidth={2.5} />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Flowdesk</p>
            <p className="text-xs text-slate-500">{d.tagline}</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white">
            {d.landing.title}
          </h2>
        </div>

        <p className="relative text-[11px] text-slate-600">{d.landing.footerNote}</p>
      </div>

      <div className="flex w-full flex-col justify-center px-5 py-10 sm:px-10 lg:w-1/2">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-xs text-slate-500 transition hover:text-white">
            <ArrowLeft size={14} />
            {d.auth.back}
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-white">{d.auth.title}</h1>
          </div>

          {params.error ? <Notice tone="danger">{d.auth.error}</Notice> : null}

          <form action={signIn} className="space-y-4">
            <Field label={d.auth.email}>
              <input
                className="input"
                type="email"
                name="email"
                autoComplete="username"
                defaultValue="admin@flowdesk.app"
                required
              />
            </Field>
            <Field label={d.auth.password}>
              <input
                className="input"
                type="password"
                name="password"
                autoComplete="current-password"
                defaultValue="flowdesk"
                required
              />
            </Field>
            <button type="submit" className="btn btn-primary w-full">
              {d.auth.submit}
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-dashed border-line bg-ink-900/50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {d.login.demoTitle}
            </p>
            <p className="mt-1 font-mono text-xs text-slate-300">{d.login.demoHint}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
