import { cn } from "@/components/ui";
import type { Locale } from "@/lib/format";

export function LocaleSwitch({ locale }: { locale: Locale }) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-line bg-ink-900/70 p-0.5">
      {(["ru", "en"] as Locale[]).map((code) => (
        <a
          key={code}
          href={`/api/locale?to=${code}`}
          className={cn(
            "rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wide transition",
            code === locale ? "bg-ink-700 text-white" : "text-slate-500 hover:text-slate-200",
          )}
          aria-pressed={code === locale}
          aria-label={code === "ru" ? "Русский" : "English"}
        >
          {code}
        </a>
      ))}
    </div>
  );
}
