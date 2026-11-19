# Деплой Flowdesk

Пошаговый план: Postgres → Vercel → бот → домен.

---

## 0. Что понадобится

- аккаунт GitHub (репозиторий уже готов локально);
- Vercel (бесплатный план подходит);
- Postgres: Neon или Supabase (бесплатный тариф);
- токен бота от [@BotFather](https://t.me/BotFather);
- домен (см. раздел 4).

---

## 1. Postgres

SQLite работает только локально: на Vercel файловая система эфемерная.

1. Создайте проект в Neon (или Supabase) и скопируйте connection string.
2. В `prisma/schema.prisma` поменяйте провайдер:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

3. Примените схему и загрузите демо-данные:

```bash
# .env
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

npx prisma db push
npm run db:seed
```

> На реальном проекте вместо `db push` используйте миграции: `prisma migrate dev` локально,
> `prisma migrate deploy` на проде.

---

## 2. Vercel

1. **Add New → Project** → выберите репозиторий.
2. Framework preset определится как **Next.js**, менять сборку не нужно:
   `npm run build` уже включает `prisma generate`.
3. Добавьте переменные окружения (Production + Preview):

| Переменная | Значение |
| --- | --- |
| `DATABASE_URL` | строка подключения из Neon |
| `SESSION_SECRET` | длинная случайная строка |
| `NEXT_PUBLIC_APP_URL` | `https://ваш-домен` |
| `NEXT_PUBLIC_TELEGRAM_BOT_URL` | `https://t.me/your_bot` (необязательно, скрывает ссылки, если пусто) |

`TELEGRAM_BOT_TOKEN` на Vercel не нужен: бот работает отдельным процессом (раздел 3).
Chat id администратора задаётся в админке (`/admin/settings`) и хранится в БД; env
`TELEGRAM_ADMIN_CHAT_ID` остаётся fallback для воркера.

Сгенерировать секрет:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

4. **Deploy**.

После первого деплоя проверьте: `/`, `/login`, `/admin`, `/robots.txt`, `/sitemap.xml`.

---

## 3. Бот

Бот — отдельный долгоживущий процесс (polling), ему не нужен порт.
Держите его запущенным постоянно: при остановке процесса бот не отвечает,
хотя сайт и админка продолжают работать.

**Railway / Fly.io / VPS:**

- Start command: `npm run bot`
- Переменные: `DATABASE_URL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID` (fallback)
- Тот же Postgres, что и у веб-приложения.

**Токен:** [@BotFather](https://t.me/BotFather) → `/newbot` → скопировать токен в переменную
`TELEGRAM_BOT_TOKEN`. Токен не коммитится и не хранится в БД.

**Chat id администратора:**

1. Проще всего — в админке `/admin/settings` → «Chat ID администратора». Значение пишется
   в `Setting.admin_chat_id`, имеет приоритет над env и перечитывается ботом при каждой
   отправке уведомления.
2. Либо env `TELEGRAM_ADMIN_CHAT_ID` как fallback.
3. Свой id можно узнать у [@userinfobot](https://t.me/userinfobot) или из
   `https://api.telegram.org/bot<TOKEN>/getUpdates` после сообщения боту (токен не публикуйте).

**Проверка:** `npm run bot:once` — делает `getMe`, печатает `@username` и выходит с кодом 0.
Неверный токен завершится читаемой ошибкой Telegram (`401 Unauthorized`).

**Ссылка на бота:** задайте `NEXT_PUBLIC_TELEGRAM_BOT_URL=https://t.me/your_bot` и
пересоберите сайт. Ссылка появится на лендинге и в настройках админки; пустое значение
её скрывает.

> Для production надёжнее webhook или постоянно живущий воркер. Vercel не держит
> долгоживущие процессы, поэтому бот туда не деплоится. Для портфолио polling проще.

---

## 4. Домен

### Где покупать

| Регистратор | Плюсы |
| --- | --- |
| Cloudflare Registrar | по себестоимости, без наценки |
| Porkbun / Namecheap | простые DNS, честные цены |
| reg.ru | оплата картой РФ |

Ориентир: `.dev` ≈ $12–15/год, `.com` ≈ $10–15/год.

### Рекомендация

Для портфолио лучше личный домен, а не название проекта: позже на нём разместятся
остальные кейсы.

- `zrnkov.dev` — коротко, современно, `.dev` требует HTTPS (Vercel даёт сертификат сам);
- `artemzrnkov.com` — формальнее, хорошо для резюме и LinkedIn;
- `azhukov.dev` — если хотите латиницу по имени.

### Подключение к Vercel

1. Купите домен.
2. Vercel → Project → **Settings → Domains → Add**.
3. Если DNS остаётся у регистратора:

| Тип | Имя | Значение |
| --- | --- | --- |
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

> Vercel показывает актуальные значения прямо в интерфейсе — используйте их.
> Либо переключите NS на `ns1.vercel-dns.com` / `ns2.vercel-dns.com`.

4. Дождитесь статуса **Valid Configuration** и сертификата.
5. Обновите `NEXT_PUBLIC_APP_URL` на новый домен и сделайте redeploy.

---

## 5. Чек-лист после деплоя

- [ ] `NEXT_PUBLIC_APP_URL` указывает на боевой домен (иначе сломаются sitemap/OG).
- [ ] `SESSION_SECRET` уникальный и не из примера.
- [ ] `/admin` требует логин, без сессии редиректит на `/login`.
- [ ] `/robots.txt` и `/sitemap.xml` отдают корректный домен.
- [ ] `NEXT_PUBLIC_TELEGRAM_BOT_URL` задан, ссылка на бота видна на лендинге и в настройках.
- [ ] Бот отвечает на `/start`, оплата Stars создаёт инвойс.
- [ ] Уведомление о платеже приходит на chat id из админки (или env).
- [ ] Демо-данные загружены, дашборд не пустой.
- [ ] Ссылка на демо добавлена в профиль Upwork.

## 6. Важно для публичного демо

- Сайт содержит **синтетические** данные и мок-оплату — так и написано в футере.
- Не загружайте в публичное демо реальные базы и платёжные ключи.
- Кнопка «Пересобрать демо-данные» доступна любому, кто вошёл в демо-админку.
  Если это мешает — уберите её из `src/app/admin/settings/page.tsx`.
- Пароль демо-админа (`flowdesk`) опубликован намеренно. Для реального проекта —
  смените его после seed и не храните в репозитории.

## 7. Обновления

```bash
git add -A
git commit -m "feat: ..."
git push
```

Vercel пересоберёт проект автоматически. Изменения схемы — `npx prisma db push`
(или `prisma migrate deploy`, если перейдёте на миграции).
