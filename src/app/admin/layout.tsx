import Link from "next/link";
import { LogOut, Zap } from "lucide-react";
import { signOut } from "@/app/actions";
import { requireAdmin } from "@/lib/auth";
import { getDict, getLocale } from "@/lib/i18n";
import { Avatar } from "@/components/ui";
import { LocaleSwitch } from "@/components/locale-switch";
import { MobileNav, SideNav } from "@/components/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const locale = await getLocale();
  const d = getDict(locale);

  const labels = {
    dashboard: d.nav.dashboard,
    users: d.nav.users,
    plans: d.nav.plans,
    broadcasts: d.nav.broadcasts,
    content: d.nav.content,
    settings: d.nav.settings,
    site: d.nav.site,
  };

  return (
    <div className="min-h-screen">
      <SideNav labels={labels} tagline={d.tagline} />

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 border-b border-line bg-ink-950/85 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <Link href="/admin" className="flex items-center gap-2 lg:hidden">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-cyan-300 text-ink-950">
                <Zap size={14} strokeWidth={2.6} />
              </span>
              <span className="text-sm font-semibold text-white">Flowdesk</span>
            </Link>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <LocaleSwitch locale={locale} />

              <div className="hidden items-center gap-2 rounded-xl border border-line-soft bg-ink-900/60 py-1 pl-1 pr-3 md:flex">
                <Avatar name={admin.name} className="h-7 w-7 text-[10px]" />
                <div className="leading-tight">
                  <p className="text-[12px] font-medium text-slate-200">{admin.name}</p>
                  <p className="text-[10px] text-slate-500">{admin.role}</p>
                </div>
              </div>

              <form action={signOut}>
                <button
                  type="submit"
                  className="btn btn-ghost btn-sm"
                  title={d.nav.logout}
                  aria-label={d.nav.logout}
                >
                  <LogOut size={15} />
                  <span className="hidden sm:inline">{d.nav.logout}</span>
                </button>
              </form>
            </div>
          </div>

          <div className="px-4 pb-2 lg:hidden">
            <MobileNav labels={labels} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
