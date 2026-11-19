import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TONES = {
  neutral: "border-line bg-ink-800/70 text-slate-300",
  accent: "border-accent/30 bg-accent/10 text-accent-soft",
  success: "border-mint/30 bg-mint/10 text-mint",
  warning: "border-amber/30 bg-amber/10 text-amber",
  danger: "border-rose/30 bg-rose/10 text-rose",
  muted: "border-line-soft bg-ink-900/60 text-slate-500",
} as const;

export type Tone = keyof typeof TONES;

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const AVATAR_GRADIENTS = [
  "from-sky-400/80 to-cyan-300/80",
  "from-emerald-400/80 to-teal-300/80",
  "from-violet-400/80 to-fuchsia-300/80",
  "from-amber-400/80 to-orange-300/80",
  "from-rose-400/80 to-pink-300/80",
];

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradient = AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];

  return (
    <span
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[12px] font-bold text-ink-950",
        gradient,
        className,
      )}
      aria-hidden="true"
    >
      {initials || "?"}
    </span>
  );
}

export function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className={cn("card card-pad relative overflow-hidden text-center", accent && "border-accent/25")}>
      {accent && (
        <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
      )}
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-[26px]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[28px]">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  text,
  icon,
}: {
  title: string;
  text?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      {icon ? <div className="mb-1 text-slate-600">{icon}</div> : null}
      <p className="text-sm font-medium text-slate-300">{title}</p>
      {text ? <p className="max-w-sm text-xs text-slate-500">{text}</p> : null}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="label">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function SectionCard({
  title,
  hint,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("card flex flex-col", className)}>
      <header className="flex items-center justify-between gap-3 border-b border-line-soft px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
        </div>
        {action}
      </header>
      <div className={cn("flex-1 p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function Progress({ value, tone = "bg-accent" }: { value: number; tone?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-800">
      <div
        className={cn("h-full rounded-full transition-all", tone)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function Notice({ tone = "success", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "mb-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm",
        TONES[tone],
      )}
      role="status"
    >
      {children}
    </div>
  );
}
