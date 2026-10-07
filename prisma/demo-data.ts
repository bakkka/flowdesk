import type { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

/**
 * Deterministic demo dataset.
 * The same seed is used by `npm run db:seed` and by the "rebuild demo data"
 * button in Settings, so a demo always looks identical.
 */

export const DEMO_ADMIN = {
  email: "admin@flowdesk.app",
  password: "flowdesk",
  name: "Артём Жуков",
};

export const DEMO_PLANS = [
  {
    code: "free",
    nameRu: "Free",
    nameEn: "Free",
    taglineRu: "Попробовать формат",
    taglineEn: "Try the format",
    priceRub: 0,
    priceStars: 0,
    durationDays: 0,
    featuresRu: "Доступ к вводным урокам\nАнонсы новых материалов\nБазовые чек-листы",
    featuresEn: "Intro lessons\nNew material announcements\nBasic checklists",
    isFeatured: false,
    sort: 0,
  },
  {
    code: "pro",
    nameRu: "Pro",
    nameEn: "Pro",
    taglineRu: "Для тех, кто запускает",
    taglineEn: "For those who ship",
    priceRub: 890,
    priceStars: 99,
    durationDays: 30,
    featuresRu:
      "Все уроки и гайды\nШаблоны постов и воронок\nРазбор метрик бота\nДоступ к архиву вебинаров",
    featuresEn:
      "All lessons and guides\nPost and funnel templates\nBot metrics review\nWebinar archive access",
    isFeatured: true,
    sort: 1,
  },
  {
    code: "business",
    nameRu: "Business",
    nameEn: "Business",
    taglineRu: "Команда и личная стратегия",
    taglineEn: "Team and personal strategy",
    priceRub: 2490,
    priceStars: 279,
    durationDays: 30,
    featuresRu:
      "Всё из Pro\nЛичная стратегия на месяц\nПриоритетная поддержка\nДоступ для 3 участников",
    featuresEn:
      "Everything in Pro\nMonthly personal strategy\nPriority support\nAccess for 3 seats",
    isFeatured: false,
    sort: 2,
  },
];

/** Small deterministic PRNG — reproducible demos. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY = 86_400_000;

const RU_FIRST = [
  "Алексей", "Мария", "Дмитрий", "Анна", "Сергей", "Екатерина", "Иван", "Ольга",
  "Михаил", "Наталья", "Павел", "Ирина", "Артём", "Юлия", "Никита", "Светлана",
  "Роман", "Ксения", "Егор", "Виктория",
];
const RU_LAST = [
  "Смирнов", "Иванова", "Кузнецов", "Петрова", "Соколов", "Морозова", "Лебедев",
  "Новикова", "Козлов", "Волкова", "Попов", "Егорова", "Павлов", "Семёнова",
  "Орлов", "Макарова", "Зайцев", "Захарова", "Крылов", "Белова",
];
const EN_FIRST = [
  "Alex", "Maria", "Daniel", "Anna", "Sergey", "Kate", "Ivan", "Olga",
  "Michael", "Natalie", "Paul", "Irene", "Artem", "Julia", "Nick", "Svetlana",
  "Roman", "Ksenia", "Egor", "Victoria",
];
const EN_LAST = [
  "Smirnov", "Ivanova", "Kuznetsov", "Petrova", "Sokolov", "Morozova", "Lebedev",
  "Novikova", "Kozlov", "Volkova", "Popov", "Egorova", "Pavlov", "Semenova",
  "Orlov", "Makarova", "Zaitsev", "Zakharova", "Krylov", "Belova",
];
const SOURCES = ["instagram", "telegram", "youtube", "referral", "organic", "ads"];
const SOURCE_WEIGHTS = [0.28, 0.22, 0.14, 0.12, 0.14, 0.1];

function weighted(rand: () => number, weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < weights.length; i += 1) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

export async function seedDatabase(prisma: PrismaClient, userCount = 1240): Promise<void> {
  const now = Date.now();
  const rand = mulberry32(20261115);
  const pick = <T,>(items: T[]): T => items[Math.floor(rand() * items.length)];
  const between = (min: number, max: number) => min + rand() * (max - min);

  // --- wipe (child rows first) -------------------------------------------
  await prisma.event.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.user.deleteMany();
  await prisma.material.deleteMany();
  await prisma.broadcast.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.admin.deleteMany();

  // --- staff --------------------------------------------------------------
  await prisma.admin.create({
    data: {
      id: "admin_owner",
      email: DEMO_ADMIN.email,
      name: DEMO_ADMIN.name,
      passwordHash: hashPassword(DEMO_ADMIN.password),
      role: "owner",
    },
  });

  // --- plans --------------------------------------------------------------
  for (const plan of DEMO_PLANS) {
    await prisma.plan.create({
      data: { ...plan, isActive: true, createdAt: new Date(now - 150 * DAY) },
    });
  }
  const planByCode = new Map(DEMO_PLANS.map((p) => [p.code, p]));

  // --- users --------------------------------------------------------------
  const users: {
    id: string;
    telegramId: string;
    username: string | null;
    firstName: string;
    lastName: string;
    language: string;
    planCode: string | null;
    subscriptionEndsAt: Date | null;
    status: string;
    segment: string;
    source: string;
    createdAt: Date;
    lastActiveAt: Date;
  }[] = [];

  for (let i = 0; i < userCount; i += 1) {
    // More registrations closer to today: pow > 1 biases toward 0.
    const daysAgo = Math.floor(Math.pow(rand(), 1.25) * 120);
    const createdAt = new Date(now - daysAgo * DAY - Math.floor(rand() * DAY));

    const isRu = rand() < 0.72;
    const firstName = isRu ? pick(RU_FIRST) : pick(EN_FIRST);
    const lastName = isRu ? pick(RU_LAST) : pick(EN_LAST);
    const hasUsername = rand() < 0.58;

    const source = SOURCES[weighted(rand, SOURCE_WEIGHTS)];

    // Paid share grows for older users — looks like a maturing funnel.
    const paidChance = (0.24 + Math.min(0.22, ((120 - daysAgo) / 120) * 0.22)) * (daysAgo === 0 ? 0.5 : 1);
    let planCode: string | null = null;
    if (rand() < paidChance) {
      planCode = rand() < 0.74 ? "pro" : "business";
    }

    const activeWithin = Math.floor(Math.pow(rand(), 2) * 34);
    const lastActiveAt = new Date(
      Math.min(now - Math.floor(rand() * 3600_000), createdAt.getTime() + activeWithin * DAY),
    );

    const status = rand() < 0.04 ? "blocked" : "active";

    let segment = "new";
    if (daysAgo > 60) segment = "loyal";
    if (activeWithin > 21) segment = "churn";
    else if (activeWithin > 7) segment = "active";

    const subscriptionEndsAt = planCode
      ? new Date(now + Math.floor(between(-20, 45)) * DAY)
      : null;

    users.push({
      id: `u_${i + 1}`,
      telegramId: String(100_000_000 + Math.floor(rand() * 899_999_999)),
      username: hasUsername ? `${firstName.toLowerCase()}_${Math.floor(rand() * 900 + 100)}` : null,
      firstName,
      lastName,
      language: isRu ? "ru" : "en",
      planCode,
      subscriptionEndsAt,
      status,
      segment,
      source,
      createdAt,
      lastActiveAt,
    });
  }

  await prisma.user.createMany({ data: users });

  // --- payments -----------------------------------------------------------
  type PaymentRow = {
    id: string;
    userId: string;
    planCode: string;
    amount: number;
    currency: string;
    provider: string;
    status: string;
    externalId: string | null;
    createdAt: Date;
  };
  const payments: PaymentRow[] = [];
  let paymentSeq = 0;

  for (const user of users) {
    if (!user.planCode) continue;
    const plan = planByCode.get(user.planCode);
    if (!plan) continue;

    const lifetimeDays = Math.floor((now - user.createdAt.getTime()) / DAY);
    const cycles = Math.min(3, Math.max(1, Math.ceil(lifetimeDays / 30)));

    for (let k = 0; k < cycles; k += 1) {
      let paidAt = new Date(user.createdAt.getTime() + k * 29 * DAY + 2 * 3600_000);
      if (paidAt.getTime() > now) {
        if (k > 0) continue;
        // Every paying user gets at least one recent payment.
        paidAt = new Date(now - Math.floor(between(1, 6)) * 3_600_000);
      }

      const roll = rand();
      const status = roll < 0.94 ? "paid" : roll < 0.97 ? "refunded" : "failed";
      paymentSeq += 1;
      payments.push({
        id: `p_${paymentSeq}`,
        userId: user.id,
        planCode: plan.code,
        amount: plan.priceRub,
        currency: "RUB",
        provider: rand() < 0.78 ? "mock" : "stars",
        status,
        externalId: `demo_${paymentSeq}`,
        createdAt: paidAt,
      });
    }
  }

  // A few renewals today keep the last bucket of the revenue chart alive.
  const paidUsers = users.filter((user) => user.planCode);
  for (let i = 0; i < 20 && paidUsers.length > 0; i += 1) {
    const user = paidUsers[Math.floor(rand() * paidUsers.length)];
    const plan = planByCode.get(user.planCode as string);
    if (!plan) continue;
    paymentSeq += 1;
    payments.push({
      id: `p_${paymentSeq}`,
      userId: user.id,
      planCode: plan.code,
      amount: plan.priceRub,
      currency: "RUB",
      provider: "mock",
      status: "paid",
      externalId: `demo_${paymentSeq}`,
      createdAt: new Date(now - Math.floor(rand() * 9) * 3_600_000 - 60_000),
    });
  }

  await prisma.payment.createMany({ data: payments });

  // --- events -------------------------------------------------------------
  const eventTypes = ["menu", "material_open", "plan_view", "start", "payment", "broadcast_sent"];
  const eventWeights = [0.42, 0.24, 0.14, 0.08, 0.07, 0.05];
  const events: {
    id: string;
    userId: string;
    type: string;
    label: string | null;
    createdAt: Date;
  }[] = [];

  for (let i = 0; i < 4200; i += 1) {
    const user = pick(users);
    const type = eventTypes[weighted(rand, eventWeights)];
    events.push({
      id: `e_${i + 1}`,
      userId: user.id,
      type,
      label: type === "plan_view" ? pick(["Free", "Pro", "Business"]) : null,
      createdAt: new Date(now - Math.floor(Math.pow(rand(), 1.4) * 30 * DAY) - Math.floor(rand() * DAY)),
    });
  }

  events.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  await prisma.event.createMany({ data: events });

  // --- materials ----------------------------------------------------------
  await prisma.material.createMany({
    data: [
      {
        id: "m_1",
        titleRu: "Старт: как получить максимум от бота",
        titleEn: "Start here: get the most from the bot",
        summaryRu: "Короткий тур по возможностям и первым шагам.",
        summaryEn: "A short tour of the features and the first steps.",
        bodyRu: "Разберитесь с меню, включите нужный язык и заберите вводные материалы.",
        bodyEn: "Learn the menu, set your language and grab the intro materials.",
        kind: "lesson",
        minPlan: "free",
        durationMin: 7,
        sort: 0,
      },
      {
        id: "m_2",
        titleRu: "Чек-лист первых 7 дней подписки",
        titleEn: "First 7 days of a subscription",
        summaryRu: "Что сделать в первую неделю, чтобы не забросить.",
        summaryEn: "What to do in week one so you don't stall.",
        bodyRu: "Один шаг в день: от настройки профиля до первой рассылки.",
        bodyEn: "One step a day: from profile setup to your first broadcast.",
        kind: "guide",
        minPlan: "free",
        durationMin: 10,
        sort: 1,
      },
      {
        id: "m_3",
        titleRu: "Воронка в Telegram: от /start до оплаты",
        titleEn: "Telegram funnel: from /start to payment",
        summaryRu: "Схема из 5 сообщений, которая продаёт без давления.",
        summaryEn: "A five-message flow that sells without pressure.",
        bodyRu: "Разбор структуры: оффер, доказательство, тариф, снятие возражений, оплата.",
        bodyEn: "Structure breakdown: offer, proof, pricing, objections, checkout.",
        kind: "lesson",
        minPlan: "pro",
        durationMin: 24,
        sort: 2,
      },
      {
        id: "m_4",
        titleRu: "Шаблоны постов для рассылок",
        titleEn: "Post templates for broadcasts",
        summaryRu: "12 готовых формулировок под разные сегменты.",
        summaryEn: "12 ready-made copy blocks for different segments.",
        bodyRu: "Копируйте, меняйте под свой продукт и отправляйте.",
        bodyEn: "Copy, adapt to your product, send.",
        kind: "guide",
        minPlan: "pro",
        durationMin: 15,
        sort: 3,
      },
      {
        id: "m_5",
        titleRu: "Разбор кейса: 1 200 подписчиков за квартал",
        titleEn: "Case breakdown: 1,200 subscribers in a quarter",
        summaryRu: "Что сработало и где слились деньги.",
        summaryEn: "What worked and where the money leaked.",
        bodyRu: "Цифры, скриншоты дашборда и три решения, которые дали рост.",
        bodyEn: "Numbers, dashboard screenshots and three decisions behind the growth.",
        kind: "video",
        minPlan: "pro",
        durationMin: 42,
        sort: 4,
      },
      {
        id: "m_6",
        titleRu: "Business: личная стратегия на месяц",
        titleEn: "Business: your monthly strategy",
        summaryRu: "Индивидуальный разбор воронки и контент-плана.",
        summaryEn: "A personal review of your funnel and content plan.",
        bodyRu: "Созвон 45 минут + документ с планом на 4 недели.",
        bodyEn: "A 45-minute call plus a four-week plan document.",
        kind: "lesson",
        minPlan: "business",
        durationMin: 45,
        sort: 5,
      },
      {
        id: "m_7",
        titleRu: "Как читать метрики бота",
        titleEn: "How to read bot metrics",
        summaryRu: "MRR, конверсия и удержание простыми словами.",
        summaryEn: "MRR, conversion and retention in plain words.",
        bodyRu: "Какая цифра на что влияет и когда пора менять оффер.",
        bodyEn: "What each number drives and when to change the offer.",
        kind: "lesson",
        minPlan: "business",
        durationMin: 18,
        sort: 6,
      },
      {
        id: "m_8",
        titleRu: "Архив вебинаров",
        titleEn: "Webinar archive",
        summaryRu: "Все записи с разборами и ответами на вопросы.",
        summaryEn: "All recordings with breakdowns and Q&A.",
        bodyRu: "Обновляется раз в две недели.",
        bodyEn: "Updated every two weeks.",
        kind: "video",
        minPlan: "business",
        durationMin: 0,
        sort: 7,
      },
    ].map((m, i) => ({ ...m, isPublished: true, createdAt: new Date(now - (30 - i) * DAY) })),
  });

  // --- broadcasts ---------------------------------------------------------
  await prisma.broadcast.createMany({
    data: [
      {
        id: "b_1",
        title: "Запуск нового гайда",
        textRu: "Вышел гайд «Воронка в Telegram». Он уже в разделе «Материалы» 🎁",
        textEn: "The 'Telegram funnel' guide is out. Find it in the Materials section 🎁",
        audience: "all",
        status: "sent",
        sentAt: new Date(now - 9 * DAY),
        recipients: 1180,
        delivered: 1146,
        failed: 34,
        openRate: 62,
        createdAt: new Date(now - 10 * DAY),
      },
      {
        id: "b_2",
        title: "Апдейт для Pro",
        textRu: "Для Pro добавили шаблоны постов — 12 штук, можно копировать как есть.",
        textEn: "Pro now includes post templates — 12 of them, ready to copy.",
        audience: "pro",
        status: "sent",
        sentAt: new Date(now - 4 * DAY),
        recipients: 312,
        delivered: 305,
        failed: 7,
        openRate: 71,
        createdAt: new Date(now - 5 * DAY),
      },
      {
        id: "b_3",
        title: "Возвращаем неактивных",
        textRu: "Вы давно не заглядывали. Вот что нового случилось за две недели 👀",
        textEn: "You haven't visited in a while. Here's what's new in two weeks 👀",
        audience: "inactive",
        status: "sent",
        sentAt: new Date(now - 2 * DAY),
        recipients: 204,
        delivered: 198,
        failed: 6,
        openRate: 24,
        createdAt: new Date(now - 3 * DAY),
      },
      {
        id: "b_4",
        title: "Промо на Business",
        textRu: "До конца недели Business со скидкой 20% — личная стратегия в подарок.",
        textEn: "Business is 20% off until the weekend — personal strategy included.",
        audience: "free",
        status: "draft",
        recipients: 0,
        delivered: 0,
        failed: 0,
        openRate: 0,
        createdAt: new Date(now - 1 * DAY),
      },
    ],
  });

  // --- settings -----------------------------------------------------------
  await prisma.setting.createMany({
    data: [
      { key: "admin_chat_id", value: "482113377" },
      { key: "app_url", value: "http://localhost:3000" },
      { key: "currency", value: "RUB" },
      { key: "payment_provider", value: "mock" },
    ],
  });
}
