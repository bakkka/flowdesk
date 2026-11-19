"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, Zap } from "lucide-react";
import { cn } from "@/components/ui";

export type NavLabels = {
  dashboard: string;
  users: string;
  plans: string;
  broadcasts: string;
  content: string;
  settings: string;
  site: string;
};

const ITEMS = [
  { key: "dashboard", href: "/admin" },
  { key: "users", href: "/admin/users" },
  { key: "plans", href: "/admin/plans" },
  { key: "broadcasts", href: "/admin/broadcasts" },
  { key: "content", href: "/admin/content" },
  { key: "settings", href: "/admin/settings" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

export function SideNav({ labels, tagline }: { labels: NavLabels; tagline: string }) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-line bg-ink-900/80 backdrop-blur-xl lg:flex">
      <div className="flex items-center gap-3 px-5 pb-6 pt-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-cyan-300 text-ink-950 shadow-glow">
          <Zap size={18} strokeWidth={2.5} />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight text-white">Flowdesk</p>
          <p className="text-[11px] text-slate-500">{tagline}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-accent/10 text-white shadow-[inset_0_0_0_1px_rgba(42,171,238,0.25)]"
                  : "text-slate-400 hover:bg-ink-800/60 hover:text-slate-100",
              )}
            >
              {labels[item.key]}
            </Link>
          );
        })}
      </nav>

      <div className="p-3">
        <Link
          href="/"
          className="flex items-center justify-between rounded-xl border border-line-soft bg-ink-850/60 px-3 py-2.5 text-xs font-medium text-slate-400 transition hover:border-accent/30 hover:text-white"
        >
          {labels.site}
          <ExternalLink size={14} />
        </Link>
      </div>
    </aside>
  );
}

export function MobileNav({ labels }: { labels: NavLabels }) {
  const pathname = usePathname();

  return (
    <nav className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:hidden">
      {ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-medium transition",
              active ? "bg-accent/15 text-white" : "text-slate-400 hover:text-slate-100",
            )}
          >
            {labels[item.key]}
          </Link>
        );
      })}
    </nav>
  );
}
