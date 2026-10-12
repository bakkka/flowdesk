export type Lang = "ru" | "en";

const ru = {
  chooseLang: "Выберите язык / Choose your language",
  welcome: (name: string) =>
    `Привет, ${name}! 👋\n\nЯ Flowdesk — бот с подпиской: уроки, гайды и разборы для тех, кто запускает продукты в Telegram.\n\nЧто посмотрим?`,
  menuTitle: "Главное меню. Что открыть?",
  menuPlans: "💳 Тарифы",
  menuMaterials: "📚 Материалы",
  menuProfile: "👤 Профиль",
  menuHelp: "❓ Помощь",
  plansTitle: "Тарифы Flowdesk — доступ по подписке:",
  perMonth: "₽/мес",
  freeLabel: "бесплатно",
  planLine: (name: string, price: number) => (price > 0 ? `${name} — ${price} ₽` : `${name} — бесплатно`),
  planDuration: (days: number) => `${days} дней доступа`,
  choosePlan: "Выберите тариф:",
  activePlan: (name: string, date: string) => `Ваш тариф: ${name}, действует до ${date}`,
  noPlan: "Сейчас у вас нет активной подписки.",
  alreadyActive: "Этот тариф уже активен ✅",
  paymentTitle: (name: string) => `Оплата тарифа ${name}`,
  paymentDescription: "Доступ к материалам Flowdesk на 30 дней",
  payCard: "💳 Оплатить картой (демо)",
  payStars: "⭐ Оплатить Stars",
  payConfirm: "Подтвердить оплату",
  payCancelled: "Оплата отменена. Вы вернулись в меню.",
  paymentSuccess: (name: string, date: string) =>
    `Оплата прошла ✅\n\nТариф ${name} активен до ${date}.\nМатериалы уже открыты — загляните в раздел «Материалы».`,
  paymentPending: "Создаю счёт…",
  paymentError: "Не получилось создать счёт. Попробуйте демо-оплату картой.",
  starsUnavailable: "Оплата Stars сейчас недоступна, показываю демо-оплату.",
  materialsTitle: "Материалы:",
  materialsLocked: "🔒",
  materialsOpen: "📘",
  lockedHint: (planName: string) => `Открывается с тарифа ${planName}.`,
  upgradeButton: "Открыть тариф Pro",
  back: "← Назад",
  backToMenu: "← В меню",
  materialMissing: "Материал не найден.",
  materialLocked: (planName: string) =>
    `Этот материал открывается с тарифа ${planName}.\n\nОформите подписку — и доступ появится сразу.`,
  profileTitle: "Профиль",
  profileName: "Имя",
  profilePlan: "Тариф",
  profileUntil: "Действует до",
  profilePayments: "Платежей",
  profileLanguage: "Язык",
  helpTitle:
    "Flowdesk — демонстрационный продукт: бот с подпиской и админ-панелью.\n\n" +
    "• /start — перезапустить бота\n" +
    "• «Тарифы» — оформить подписку\n" +
    "• «Материалы» — открыть контент по тарифу\n" +
    "• «Профиль» — статус подписки\n\n" +
    "Оплата в демо-режиме имитируется, деньги не списываются.",
  adminNewPayment: (name: string, plan: string, amount: number) =>
    `💰 Новый платёж: ${name} · ${plan} · ${amount} ₽`,
  offline: "Бот не запущен: задайте TELEGRAM_BOT_TOKEN в .env",
};

const en: typeof ru = {
  chooseLang: "Choose your language / Выберите язык",
  welcome: (name: string) =>
    `Hi, ${name}! 👋\n\nI'm Flowdesk — a subscription bot with lessons, guides and breakdowns for people shipping products in Telegram.\n\nWhat would you like to open?`,
  menuTitle: "Main menu. What next?",
  menuPlans: "💳 Plans",
  menuMaterials: "📚 Materials",
  menuProfile: "👤 Profile",
  menuHelp: "❓ Help",
  plansTitle: "Flowdesk plans — access by subscription:",
  perMonth: "₽/mo",
  freeLabel: "free",
  planLine: (name: string, price: number) => (price > 0 ? `${name} — ${price} ₽` : `${name} — free`),
  planDuration: (days: number) => `${days} days of access`,
  choosePlan: "Choose a plan:",
  activePlan: (name: string, date: string) => `Your plan: ${name}, active until ${date}`,
  noPlan: "You don't have an active subscription yet.",
  alreadyActive: "This plan is already active ✅",
  paymentTitle: (name: string) => `Payment for ${name}`,
  paymentDescription: "Flowdesk materials for 30 days",
  payCard: "💳 Pay by card (demo)",
  payStars: "⭐ Pay with Stars",
  payConfirm: "Confirm payment",
  payCancelled: "Payment cancelled. Back to the menu.",
  paymentSuccess: (name: string, date: string) =>
    `Payment received ✅\n\n${name} is active until ${date}.\nMaterials are unlocked — check the Materials section.`,
  paymentPending: "Creating an invoice…",
  paymentError: "Couldn't create the invoice. Try the demo card payment.",
  starsUnavailable: "Stars payments are unavailable right now, showing the demo flow.",
  materialsTitle: "Materials:",
  materialsLocked: "🔒",
  materialsOpen: "📘",
  lockedHint: (planName: string) => `Unlocks with the ${planName} plan.`,
  upgradeButton: "Get Pro",
  back: "← Back",
  backToMenu: "← Menu",
  materialMissing: "Material not found.",
  materialLocked: (planName: string) =>
    `This material unlocks with the ${planName} plan.\n\nSubscribe and access opens immediately.`,
  profileTitle: "Profile",
  profileName: "Name",
  profilePlan: "Plan",
  profileUntil: "Active until",
  profilePayments: "Payments",
  profileLanguage: "Language",
  helpTitle:
    "Flowdesk is a demo product: a subscription bot with an admin panel.\n\n" +
    "• /start — restart the bot\n" +
    "• Plans — subscribe\n" +
    "• Materials — open content by plan\n" +
    "• Profile — subscription status\n\n" +
    "Payments are simulated in demo mode, no money is charged.",
  adminNewPayment: (name: string, plan: string, amount: number) =>
    `💰 New payment: ${name} · ${plan} · ${amount} ₽`,
  offline: "Bot is offline: set TELEGRAM_BOT_TOKEN in .env",
};

export type BotDict = typeof ru;

export function t(lang: Lang): BotDict {
  return lang === "en" ? en : ru;
}

export function normalizeLang(value: string | null | undefined): Lang {
  return value === "en" ? "en" : "ru";
}
