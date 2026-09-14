This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## Резервное копирование и восстановление

### Что сейчас включено

Проект Supabase `ydcbxqrnmnbceyzqgbui` (регион `eu-west-1`, Postgres 17.6) находится в
организации на тарифе **Free**. Это значит:

| Что | Есть на Free | Комментарий |
| --- | --- | --- |
| Автоматические ежедневные бэкапы БД | **Нет** | Supabase делает их только на Pro (7 дней), Team (14) и Enterprise (30). |
| Point-in-Time Recovery (PITR) | **Нет** | Платный add-on, доступен только с Pro. |
| Восстановление через дашборд (Database → Backups) | **Нет** | Раздел пуст, восстанавливать не из чего. |
| Файлы в Storage (фото галереи) | **Нет** | Storage не входит в бэкап БД ни на одном тарифе — в бэкапе только метаданные. |
| Код edge-функций | **Да, в этом репозитории** | См. `supabase/functions/` — раньше существовал только в облаке. |
| Схема БД | **Да, в этом репозитории** | `supabase/schema.sql`. |

Вывод: **на текущем тарифе резервных копий базы нет вообще**. Если проект удалить или
потерять, данные (пользователи, лекции, оценки, фото) восстановить будет неоткуда.
Supabase отдельно предупреждает, что при удалении проекта все копии стираются безвозвратно.

### Что делать: ручной дамп

Пока проект на Free, дамп нужно снимать руками — рекомендуется раз в неделю, а также
обязательно перед любой миграцией схемы. Нужен [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
# Строку подключения бери в Dashboard → Connect (там же точный хост пулера),
# пароль — в Project Settings → Database → Database password.
export DB_URL='postgresql://postgres.ydcbxqrnmnbceyzqgbui:<пароль>@<хост-пулера>:5432/postgres'
DATE=$(date +%F)

# 1. Схема (таблицы, индексы, RLS-политики, функции, триггеры)
supabase db dump --db-url "$DB_URL" -f "backup-$DATE-schema.sql"

# 2. Данные
supabase db dump --db-url "$DB_URL" --data-only -f "backup-$DATE-data.sql"

# 3. Роли
supabase db dump --db-url "$DB_URL" --role-only -f "backup-$DATE-roles.sql"
```

Дампы **не коммитим в репозиторий** — в них персональные данные школьников. Храним
вне облака Supabase (внешний диск, другой облачный аккаунт), минимум две последние копии.

Файлы Storage (bucket `photos`) выгружаются отдельно — через S3-совместимый доступ
(Project Settings → Storage) или скриптом на `supabase-js` со `service_role`-ключом.

### Срок хранения

Своими дампами срок задаём сами. Разумный минимум для портала: 4 последних еженедельных
дампа + по дампу перед каждой миграцией. Если проект переедет на Pro, добавятся
автоматические ежедневные копии с глубиной 7 дней, и ручные дампы можно будет делать реже
(но не отменять совсем — Storage они всё равно не покрывают).

### Как разворачивать

**Вариант A. Восстановление в тот же проект** (например, после неудачной миграции):

```bash
psql "$DB_URL" -f backup-<DATE>-schema.sql
psql "$DB_URL" -f backup-<DATE>-data.sql
```

**Вариант B. Полное восстановление с нуля** (проект потерян):

1. Создать новый проект Supabase в регионе `eu-west-1`.
2. Накатить схему: `supabase/schema.sql` (или свежий `backup-*-schema.sql`) через SQL Editor или `psql`.
3. Залить данные из `backup-*-data.sql`.
4. Развернуть edge-функции из этого репозитория:
   ```bash
   supabase link --project-ref <новый-ref>
   supabase functions deploy ai-lecture --no-verify-jwt
   supabase functions deploy ednevnik-proxy --no-verify-jwt
   supabase functions deploy telegram-webhook
   ```
   Флаги JWT воспроизводят текущие настройки: `ai-lecture` и `ednevnik-proxy` работают
   без проверки JWT, `telegram-webhook` — с проверкой.
5. Прописать секреты функций: `OPENAI_API_KEY` (для `ai-lecture`), `TELEGRAM_BOT_TOKEN`
   (для `telegram-webhook`); `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` подставляются платформой.
6. Восстановить bucket `photos` и загрузить в него выгруженные файлы.
7. Обновить переменные окружения в Vercel (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` и прочие) на значения нового проекта и передеплоить.
8. Заново выставить Telegram-webhook на новый URL функции.

Восстановление в тот же проект и восстановление в новый занимают разное время: `psql`
с дампом идёт минуты, а вот пересборка Storage и перевыпуск ключей — это работа руками,
её стоит прорепетировать до того, как она понадобится.

## Edge-функции

Исходники всех трёх облачных функций лежат в `supabase/functions/` — они выгружены из
облака и теперь версионируются в git:

| Функция | JWT | Назначение |
| --- | --- | --- |
| `ai-lecture` | без проверки | Структурирует лекции из фотографий через OpenAI Vision. |
| `ednevnik-proxy` | без проверки | Прокси к `dnevnik.edu.me` (оценки, отсутствия). |
| `telegram-webhook` | с проверкой | Модерация фото галереи кнопками в Telegram. |

Эти файлы исключены из тайпчека Next.js (`tsconfig.json` → `exclude`): это Deno-код
с URL-импортами, тайпчекер сайта его не понимает.

## Скрипты

Одноразовые и служебные скрипты вынесены из корня в `scripts/` (наполнение лекциями,
сидинг, разовые починки данных). Все они ждут `service_role`-ключ в переменной окружения
`SUPABASE_SERVICE_ROLE_KEY` — раньше ключ был вписан в код прямо в репозитории.

```bash
SUPABASE_SERVICE_ROLE_KEY='...' node scripts/seed-likes.mjs
```

## CI

`.github/workflows/ci.yml` на каждый push и pull request прогоняет `npm ci`,
`npm run build` и `npx eslint src`. Ошибки линтера не валят сборку, пока их не больше
порога `ESLINT_MAX_ERRORS` (сейчас 55) — новые ошибки добавлять нельзя, а по мере
починки старых порог нужно опускать.
