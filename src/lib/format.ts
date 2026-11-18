export type Locale = "ru" | "en";

export const LOCALES: Locale[] = ["ru", "en"];
export const LOCALE_COOKIE = "fd_locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "ru" || value === "en";
}

export function formatMoney(locale: Locale, amount: number, currency = "RUB"): string {
  return new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(locale: Locale, value: number): string {
  return new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "en-US").format(value);
}

export function formatPercent(locale: Locale, value: number, digits = 1): string {
  return new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "en-US", {
    maximumFractionDigits: digits,
  }).format(value) + "%";
}

export function formatDate(locale: Locale, date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(locale: Locale, date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatRelative(locale: Locale, date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = d.getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
    numeric: "auto",
  });
  const minutes = Math.round(diff / 60000);
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return rtf.format(days, "day");
  return rtf.format(Math.round(days / 30), "month");
}

export function formatShortDate(locale: Locale, date: Date): string {
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
    day: "numeric",
    month: "short",
  }).format(date);
}
