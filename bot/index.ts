import { Bot, Context, GrammyError, HttpError, InlineKeyboard } from "grammy";
import { PrismaClient } from "@prisma/client";
import { normalizeLang, t, type Lang } from "./i18n";

try {
  // Node 20.12+ — reads .env without extra dependencies.
  (process as unknown as { loadEnvFile?: (path: string) => void }).loadEnvFile?.(".env");
} catch {
  /* .env is optional */
}

const prisma = new PrismaClient();
const token = process.env.TELEGRAM_BOT_TOKEN?.trim();

if (!token) {
  console.log("⚠  " + t("ru").offline);
  console.log("   1) add TELEGRAM_BOT_TOKEN to .env");
  console.log("   2) npm run bot");
  process.exit(0);
}

const bot = new Bot(token);

type PlanRow = {
  code: string;
  nameRu: string;
  nameEn: string;
  taglineRu: string;
  taglineEn: string;
  priceRub: number;
  priceStars: number;
  durationDays: number;
  sort: number;
};

const planName = (plan: PlanRow, lang: Lang) => (lang === "en" ? plan.nameEn : plan.nameRu);
const planTagline = (plan: PlanRow, lang: Lang) => (lang === "en" ? plan.taglineEn : plan.taglineRu);

function formatDate(lang: Lang, date: Date): string {
  return new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function displayName(from: Context["from"]): string {
  return from?.first_name || from?.username || "friend";
}

async function touchUser(ctx: Context) {
  const from = ctx.from;
  if (!from) return null;
  const telegramId = String(from.id);

  let user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) {
    const freePlan = await prisma.plan.findUnique({ where: { code: "free" } });
    user = await prisma.user.create({
      data: {
        telegramId,
        firstName: from.first_name || "Friend",
        lastName: from.last_name ?? null,
        username: from.username ?? null,
        language: "ru",
        segment: "new",
        source: "telegram",
        planCode: freePlan ? "free" : null,
      },
    });
    await prisma.event.create({ data: { userId: user.id, type: "start" } });
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date(), username: from.username ?? user.username },
    });
  }
  return user;
}

async function getPlans(): Promise<PlanRow[]> {
  return prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { sort: "asc" },
    select: {
      code: true,
      nameRu: true,
      nameEn: true,
      taglineRu: true,
      taglineEn: true,
      priceRub: true,
      priceStars: true,
      durationDays: true,
      sort: true,
    },
  });
}

/** Expired paid plans fall back to free access. */
function effectivePlan(user: { planCode: string | null; subscriptionEndsAt: Date | null }): string {
  if (!user.planCode || user.planCode === "free") return "free";
  if (!user.subscriptionEndsAt || user.subscriptionEndsAt < new Date()) return "free";
  return user.planCode;
}

function rankOf(code: string | null, plans: PlanRow[]): number {
  const index = plans.findIndex((plan) => plan.code === code);
  return index === -1 ? 0 : index;
}

async function notifyAdmin(text: string) {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID?.trim();
  if (!chatId) return;
  try {
    await bot.api.sendMessage(chatId, text);
  } catch {
    /* admin notifications are best-effort */
  }
}

async function activateSubscription(
  userId: string,
  plan: PlanRow,
  provider: "mock" | "stars",
): Promise<Date> {
  const endsAt = new Date(Date.now() + Math.max(1, plan.durationDays) * 86_400_000);

  await prisma.user.update({
    where: { id: userId },
    data: {
      planCode: plan.code,
      subscriptionEndsAt: endsAt,
      segment: "active",
      lastActiveAt: new Date(),
    },
  });

  await prisma.payment.create({
    data: {
      userId,
      planCode: plan.code,
      amount: provider === "stars" ? plan.priceStars : plan.priceRub,
      currency: provider === "stars" ? "XTR" : "RUB",
      provider: provider === "stars" ? "stars" : "mock",
      status: "paid",
      externalId: `${provider}_${Date.now()}`,
    },
  });

  await prisma.event.create({ data: { userId, type: "payment", label: plan.code } });
  return endsAt;
}

/* ------------------------------------------------------------- keyboards */

function languageKeyboard() {
  return new InlineKeyboard()
    .text("🇷🇺 Русский", "lang:ru")
    .text("🇬🇧 English", "lang:en");
}

async function menuKeyboard(lang: Lang) {
  const d = t(lang);
  return new InlineKeyboard()
    .text(d.menuPlans, "plans")
    .text(d.menuMaterials, "materials")
    .row()
    .text(d.menuProfile, "profile")
    .text(d.menuHelp, "help");
}

async function sendMenu(ctx: Context, lang: Lang, edit = false) {
  const d = t(lang);
  const keyboard = await menuKeyboard(lang);
  if (edit) {
    try {
      await ctx.editMessageText(d.menuTitle, { reply_markup: keyboard });
      return;
    } catch {
      /* message may be unchanged */
    }
  }
  await ctx.reply(d.menuTitle, { reply_markup: keyboard });
}

/* ---------------------------------------------------------------- start */

bot.command("start", async (ctx) => {
  const user = await touchUser(ctx);
  if (!user) return;
  const lang = normalizeLang(user.language);
  const d = t(lang);

  await ctx.reply(
    `👋 ${d.chooseLang}\n\n${t(lang).welcome(displayName(ctx.from))}`,
    { reply_markup: languageKeyboard() },
  );
});

bot.command("menu", async (ctx) => {
  const user = await touchUser(ctx);
  if (!user) return;
  await sendMenu(ctx, normalizeLang(user.language));
});

bot.command("help", async (ctx) => {
  const user = await touchUser(ctx);
  if (!user) return;
  const lang = normalizeLang(user.language);
  await ctx.reply(t(lang).helpTitle, {
    reply_markup: new InlineKeyboard().text(t(lang).backToMenu, "menu"),
  });
});

/* --------------------------------------------------------------- language */

bot.callbackQuery(/^lang:(ru|en)$/, async (ctx) => {
  const lang = ctx.match[1] as Lang;
  const user = await touchUser(ctx);
  if (!user) return;

  await prisma.user.update({ where: { id: user.id }, data: { language: lang } });
  await ctx.answerCallbackQuery();

  const d = t(lang);
  await ctx.editMessageText(d.welcome(displayName(ctx.from)), {
    reply_markup: await menuKeyboard(lang),
  });
});

/* ---------------------------------------------------------------- plans */

bot.callbackQuery("plans", async (ctx) => {
  const user = await touchUser(ctx);
  if (!user) return;
  const lang = normalizeLang(user.language);
  const d = t(lang);
  const plans = await getPlans();

  const current = effectivePlan(user);
  const lines = plans.map((plan) => {
    const price = plan.priceRub > 0 ? `${plan.priceRub} ${d.perMonth}` : d.freeLabel;
    const marker = plan.code === current ? " ✅" : "";
    return `• ${planName(plan, lang)} — ${price}${marker}\n  ${planTagline(plan, lang)}`;
  });

  const keyboard = new InlineKeyboard();
  for (const plan of plans) {
    keyboard.text(d.planLine(planName(plan, lang), plan.priceRub), `plan:${plan.code}`).row();
  }
  keyboard.text(d.backToMenu, "menu");

  await prisma.event.create({ data: { userId: user.id, type: "plan_view" } });

  try {
    await ctx.editMessageText(`${d.plansTitle}\n\n${lines.join("\n")}`, { reply_markup: keyboard });
  } catch {
    await ctx.reply(`${d.plansTitle}\n\n${lines.join("\n")}`, { reply_markup: keyboard });
  }
});

bot.callbackQuery(/^plan:(.+)$/, async (ctx) => {
  const user = await touchUser(ctx);
  if (!user) return;
  const lang = normalizeLang(user.language);
  const d = t(lang);

  const plans = await getPlans();
  const plan = plans.find((item) => item.code === ctx.match[1]);
  if (!plan) {
    await ctx.answerCallbackQuery({ text: d.materialMissing });
    return;
  }

  if (plan.code === effectivePlan(user)) {
    await ctx.answerCallbackQuery({ text: d.alreadyActive, show_alert: true });
    return;
  }

  if (plan.priceRub === 0) {
    const endsAt = await activateSubscription(user.id, plan, "mock");
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(d.paymentSuccess(planName(plan, lang), formatDate(lang, endsAt)), {
      reply_markup: await menuKeyboard(lang),
    });
    return;
  }

  const keyboard = new InlineKeyboard()
    .text(d.payCard, `pay:${plan.code}:mock`)
    .row()
    .text(d.payStars, `pay:${plan.code}:stars`)
    .row()
    .text(d.back, "plans");

  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    `${planName(plan, lang)} · ${plan.priceRub} ${d.perMonth}\n${planTagline(plan, lang)}\n\n${d.paymentTitle(planName(plan, lang))}`,
    { reply_markup: keyboard },
  );
});

bot.callbackQuery(/^pay:(.+):mock$/, async (ctx) => {
  const user = await touchUser(ctx);
  if (!user) return;
  const lang = normalizeLang(user.language);
  const d = t(lang);
  const plans = await getPlans();
  const plan = plans.find((item) => item.code === ctx.match[1]);
  if (!plan) return;

  const keyboard = new InlineKeyboard()
    .text(d.payConfirm, `confirm:${plan.code}`)
    .row()
    .text(d.backToMenu, "menu");

  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    `${d.paymentTitle(planName(plan, lang))}\n\n${plan.priceRub} ${d.perMonth} · ${d.planDuration(plan.durationDays)}`,
    { reply_markup: keyboard },
  );
});

bot.callbackQuery(/^pay:(.+):stars$/, async (ctx) => {
  const user = await touchUser(ctx);
  if (!user || !ctx.chat) return;
  const lang = normalizeLang(user.language);
  const d = t(lang);
  const plans = await getPlans();
  const plan = plans.find((item) => item.code === ctx.match[1]);
  if (!plan) return;

  await ctx.answerCallbackQuery({ text: d.paymentPending });

  try {
    await ctx.api.sendInvoice(
      ctx.chat.id,
      planName(plan, lang),
      planTagline(plan, lang) || d.paymentDescription,
      `sub:${plan.code}`,
      "XTR",
      [{ label: planName(plan, lang), amount: Math.max(1, plan.priceStars) }],
      { provider_token: "" },
    );
  } catch {
    await ctx.reply(d.starsUnavailable, {
      reply_markup: new InlineKeyboard().text(d.payConfirm, `confirm:${plan.code}`),
    });
  }
});

bot.callbackQuery(/^confirm:(.+)$/, async (ctx) => {
  const user = await touchUser(ctx);
  if (!user) return;
  const lang = normalizeLang(user.language);
  const d = t(lang);
  const plans = await getPlans();
  const plan = plans.find((item) => item.code === ctx.match[1]);
  if (!plan) return;

  const endsAt = await activateSubscription(user.id, plan, "mock");
  await ctx.answerCallbackQuery({ text: "✅" });

  await notifyAdmin(d.adminNewPayment(displayName(ctx.from), planName(plan, lang), plan.priceRub));

  await ctx.editMessageText(d.paymentSuccess(planName(plan, lang), formatDate(lang, endsAt)), {
    reply_markup: await menuKeyboard(lang),
  });
});

/* ------------------------------------------------------------ materials */

bot.callbackQuery("materials", async (ctx) => {
  const user = await touchUser(ctx);
  if (!user) return;
  const lang = normalizeLang(user.language);
  const d = t(lang);
  const plans = await getPlans();

  const materials = await prisma.material.findMany({
    where: { isPublished: true },
    orderBy: { sort: "asc" },
  });

  const userRank = rankOf(effectivePlan(user), plans);
  const currentPlan = plans.find((plan) => plan.code === effectivePlan(user)) ?? plans[0];
  const currentName = currentPlan ? planName(currentPlan, lang) : effectivePlan(user);

  const keyboard = new InlineKeyboard();
  const lines: string[] = [];

  for (const material of materials) {
    const unlocked = rankOf(material.minPlan, plans) <= userRank;
    const title = lang === "en" ? material.titleEn : material.titleRu;
    lines.push(`${unlocked ? d.materialsOpen : d.materialsLocked} ${title}`);
    keyboard
      .text(`${unlocked ? d.materialsOpen : d.materialsLocked} ${title.slice(0, 34)}`, `mat:${material.id}`)
      .row();
  }

  keyboard.text(d.backToMenu, "menu");

  await ctx.answerCallbackQuery();
  const header = `${d.materialsTitle}\n${d.activePlan(currentName, user.subscriptionEndsAt ? formatDate(lang, user.subscriptionEndsAt) : "—")}\n`;
  try {
    await ctx.editMessageText(`${header}\n${lines.join("\n")}`, { reply_markup: keyboard });
  } catch {
    await ctx.reply(`${header}\n${lines.join("\n")}`, { reply_markup: keyboard });
  }
});

bot.callbackQuery(/^mat:(.+)$/, async (ctx) => {
  const user = await touchUser(ctx);
  if (!user) return;
  const lang = normalizeLang(user.language);
  const d = t(lang);
  const plans = await getPlans();

  const material = await prisma.material.findUnique({ where: { id: ctx.match[1] } });
  if (!material || !material.isPublished) {
    await ctx.answerCallbackQuery({ text: d.materialMissing });
    return;
  }

  const unlocked = rankOf(material.minPlan, plans) <= rankOf(effectivePlan(user), plans);
  const title = lang === "en" ? material.titleEn : material.titleRu;
  const body = lang === "en" ? material.bodyEn : material.bodyRu;
  const summary = lang === "en" ? material.summaryEn : material.summaryRu;

  await ctx.answerCallbackQuery();

  if (!unlocked) {
    const requiredPlan = plans.find((plan) => plan.code === material.minPlan);
    await ctx.reply(d.materialLocked(requiredPlan ? planName(requiredPlan, lang) : material.minPlan), {
      reply_markup: new InlineKeyboard()
        .text(d.upgradeButton, "plans")
        .row()
        .text(d.backToMenu, "menu"),
    });
    return;
  }

  await prisma.event.create({ data: { userId: user.id, type: "material_open", label: title } });

  const text = `📘 ${title}\n\n${summary}\n\n${body}${material.durationMin ? `\n\n⏱ ${material.durationMin} min` : ""}`.trim();
  await ctx.reply(text, {
    reply_markup: new InlineKeyboard().text(d.back, "materials").row().text(d.backToMenu, "menu"),
  });
});

/* --------------------------------------------------------------- profile */

bot.callbackQuery("profile", async (ctx) => {
  const user = await touchUser(ctx);
  if (!user) return;
  const lang = normalizeLang(user.language);
  const d = t(lang);
  const plans = await getPlans();

  const current = effectivePlan(user);
  const plan = plans.find((item) => item.code === current);
  const payments = await prisma.payment.count({ where: { userId: user.id, status: "paid" } });

  const lines = [
    d.profileTitle,
    "",
    `${d.profileName}: ${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`,
    `${d.profilePlan}: ${plan ? planName(plan, lang) : d.noPlan}`,
  ];
  if (user.subscriptionEndsAt && current !== "free") {
    lines.push(`${d.profileUntil}: ${formatDate(lang, user.subscriptionEndsAt)}`);
  } else {
    lines.push(d.noPlan);
  }
  lines.push(`${d.profilePayments}: ${payments}`);
  lines.push(`${d.profileLanguage}: ${lang.toUpperCase()}`);

  await ctx.answerCallbackQuery();
  try {
    await ctx.editMessageText(lines.join("\n"), {
      reply_markup: new InlineKeyboard()
        .text(d.menuPlans, "plans")
        .row()
        .text(d.backToMenu, "menu"),
    });
  } catch {
    await ctx.reply(lines.join("\n"));
  }
});

/* ------------------------------------------------------------------ misc */

bot.callbackQuery("help", async (ctx) => {
  const user = await touchUser(ctx);
  const lang = normalizeLang(user?.language);
  const d = t(lang);
  await ctx.answerCallbackQuery();
  try {
    await ctx.editMessageText(d.helpTitle, {
      reply_markup: new InlineKeyboard().text(d.backToMenu, "menu"),
    });
  } catch {
    await ctx.reply(d.helpTitle);
  }
});

bot.callbackQuery("menu", async (ctx) => {
  const user = await touchUser(ctx);
  if (!user) return;
  await ctx.answerCallbackQuery();
  await sendMenu(ctx, normalizeLang(user.language), true);
});

/* --------------------------------------------------------------- payments */

bot.on("pre_checkout_query", async (ctx) => {
  await ctx.answerPreCheckoutQuery(true);
});

bot.on("message:successful_payment", async (ctx) => {
  const payment = ctx.message.successful_payment;
  const payload = payment.invoice_payload;
  const code = payload.startsWith("sub:") ? payload.slice(4) : null;
  if (!code) return;

  const from = ctx.from;
  const user = from
    ? await prisma.user.findUnique({ where: { telegramId: String(from.id) } })
    : null;
  if (!user) return;

  const plans = await getPlans();
  const plan = plans.find((item) => item.code === code);
  if (!plan) return;

  const endsAt = await activateSubscription(user.id, plan, "stars");
  const lang = normalizeLang(user.language);
  const d = t(lang);

  await ctx.reply(d.paymentSuccess(planName(plan, lang), formatDate(lang, endsAt)), {
    reply_markup: await menuKeyboard(lang),
  });
  await notifyAdmin(d.adminNewPayment(displayName(from), planName(plan, lang), plan.priceStars));
});

bot.catch((error) => {
  const ctx = error.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  if (error.error instanceof GrammyError) console.error("Telegram API:", error.error.description);
  else if (error.error instanceof HttpError) console.error("Network:", error.error);
  else console.error(error.error);
});

async function main() {
  const me = await bot.api.getMe();
  console.log(`✔ @${me.username} is online (${me.first_name})`);

  if (process.argv.includes("--once")) {
    await prisma.$disconnect();
    return;
  }

  await bot.api.setMyCommands([
    { command: "start", description: "Start / Начать" },
    { command: "menu", description: "Menu / Меню" },
    { command: "help", description: "Help / Помощь" },
  ]);

  await bot.start({
    onStart: (info) => console.log(`→ polling as @${info.username}`),
  });
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
