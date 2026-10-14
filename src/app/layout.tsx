import type { Metadata } from "next";
import "./globals.css";
import { getLocale } from "@/lib/i18n";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Flowdesk — Telegram bot with subscriptions & admin panel",
    template: "%s · Flowdesk",
  },
  description:
    "Portfolio case: a subscription Telegram bot with payments, content delivery, segmented broadcasts and a bilingual admin panel.",
  keywords: [
    "Telegram bot",
    "subscriptions",
    "admin panel",
    "Next.js",
    "TypeScript",
    "Prisma",
    "grammY",
  ],
  openGraph: {
    type: "website",
    url: appUrl,
    siteName: "Flowdesk",
    title: "Flowdesk — subscription Telegram bot with an admin panel",
    description:
      "A working product: bot with plans, payments and content delivery, plus a bilingual admin panel with MRR, users and broadcasts.",
    locale: "ru_RU",
    alternateLocale: ["en_US"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Flowdesk — subscription Telegram bot with an admin panel",
    description:
      "Plans, payments, plan-gated content and segmented broadcasts — with a bilingual admin panel.",
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-ink-950 font-sans text-slate-100 antialiased">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-glow" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
