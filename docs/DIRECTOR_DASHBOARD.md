# Панель директора («Direktor») — спецификация для реализации

Промпт для Claude Code. Проект: Next.js 16 + Tailwind + Supabase + Vercel, приложение гимназии
Niko Rolović. Визуальный стиль — строго по `docs/DUOLINGO_REDESIGN.md` (токены §2, типографика §3,
компоненты §4). Все строки UI — черногорский (ijekavica, латиница). Всё mobile-first: директор
открывает это **с телефона**, 360px ширина — основной кейс, desktop — бонус.

Цель: директор за 60 секунд с телефона понимает, что происходит в школе, где проблемы и что
делать. Максимум статистики, аналитики и AI-выводов. Это будет показано Министерству
образования и его IT-отделу, поэтому: аккуратные данные, приватность по умолчанию, ничего
«на глазок».

---

## 0. Честная точка старта (прочитай перед тем, как что-то строить)

Сейчас в приложении **нет серверной телеметрии**. Результаты квизов (`quiz-runner.tsx`),
оценки (`grades/page.tsx`, ключ `my_grades_data_v2`) и прогресс лекций (`src/lib/progress.ts`)
живут только в `localStorage`. В БД есть: `profiles`, `verified_students`, `lectures`,
`lecture_jobs`, `news`, `news_likes`, `events`, `photos`, `photo_likes`, `teachers`,
`teacher_statuses`, `game_scores`, `ednevnik_tokens`. Ролей три: `student | moderator | admin`.

Поэтому работа делится на 5 фаз, **строго в этом порядке** — панель без данных бессмысленна:

1. Телеметрия (события + серверные копии квизов/прогресса) и сид-данные для демо.
2. Агрегаты в SQL (views + ежедневная таблица) и API.
3. UI панели `/direktor`.
4. AI-анализ (через существующий паттерн `lecture_jobs` + `tools/lekcija-worker.mjs`).
5. Алерты, экспорт, дайджест.

Каждая фаза — отдельный коммит, после каждой: `npx tsc --noEmit`, `npm run build`,
`node scripts/e2e-smoke.mjs`.

Приложение ещё не запущено, поэтому обязателен **режим демо** с правдоподобными данными
(см. §1.5) — панель должна выглядеть живой на презентации.

---

## 1. Фаза 1 — данные

### 1.1 Роли
Расширить `profiles.role` CHECK: `student | teacher | razredni | pedagog | direktor | moderator | admin`.
Доступ к `/direktor`: `direktor`, `admin`. К вкладке класса на уровне учеников — дополнительно
`razredni` (только свой класс/отделение — добавить `profiles.homeroom_class`, `homeroom_section`)
и `pedagog`. `teacher` видит только вкладку «Nastava» по своим лекциям.

### 1.2 Таблица событий `app_events`
```sql
create table app_events (
  id bigserial primary key,
  user_id uuid references profiles(id) on delete set null, -- null = гость
  role text, class_number int, section_number int,          -- денормализовано на момент события
  event text not null,           -- см. список ниже
  entity_id uuid,                -- лекция / новость / событие / фото
  subject text,                  -- для лекций
  value numeric,                 -- score %, длительность сек, и т.п.
  meta jsonb default '{}',
  session_id text,               -- uuid сессии на клиенте (sessionStorage)
  platform text,                 -- 'pwa' | 'browser', ОС из UA (без полного UA)
  created_at timestamptz default now()
);
create index on app_events (created_at);
create index on app_events (event, created_at);
create index on app_events (user_id, created_at);
```
RLS: insert — любой аутентифицированный и anon (гость), но `user_id = auth.uid()` или null;
select — только `direktor/admin/pedagog/razredni` через views (§2), напрямую никому.

Список событий (константы в `src/lib/analytics.ts`, тип `AppEvent`):
`app_open`, `session_start`, `session_end(value=сек)`, `screen_view(meta.path)`,
`lecture_open`, `lecture_read`, `lecture_unread`, `lecture_time(value=сек)`,
`quiz_start`, `quiz_finish(value=score%, meta.correct, meta.total, meta.duration_s)`,
`quiz_abandon`, `flashcards_start`, `flashcards_finish`, `lecture_search(meta.q, meta.results)`,
`news_view`, `news_like`, `event_view`, `schedule_view(meta.day)`, `grades_open`,
`grades_calc`, `ednevnik_connect`, `ednevnik_sync`, `gallery_view`, `photo_upload`,
`photo_like`, `game_start`, `game_over(value=score)`, `tournament_view`, `share`,
`push_received`, `push_opened`, `install_prompt`, `installed`, `profile_settings`,
`nav_customized`, `font_size_changed`, `theme_changed`.

Клиент `track(event, payload?)`: буфер в памяти, отправка пачкой каждые 5 с или при
`visibilitychange`/`pagehide` через `navigator.sendBeacon` на `POST /api/track` (валидация
zod, лимит 50 событий/запрос, `src/lib/rate-limit.ts`). Никаких событий на сервере рендера.
Вызовы `track()` вставлять первым делом в существующие обработчики — не перестраивать их.

### 1.3 Серверные копии локальных данных
- `quiz_results (id, user_id, lecture_id, subject, class_number, score, correct, total, duration_s, answers jsonb, created_at)` — пишется из `quiz-runner.tsx` при завершении (для гостей — не пишется). localStorage остаётся источником для UI ученика.
- `lecture_progress_srv (user_id, lecture_id, read_at, primary key(user_id, lecture_id))` — синк из `src/lib/progress.ts` при `markRead/unmarkRead`.
- `student_grades (user_id, trimester, subject, grades int[], source 'manual'|'ednevnik', updated_at)` — опционально, **только с явным согласием** ученика (тумблер в Podešavanja «Dijeli ocjene sa školom (anonimno u statistici)», по умолчанию выключен). Без согласия — не писать.
- `attendance (user_id, date, lesson_no, status 'present'|'absent'|'late'|'justified', source)` — заполняется, если синк eDnevnik отдаёт изостанке; иначе таблица пустая, а панель показывает «Nema podataka o izostancima — potrebna integracija sa eDnevnikom».

### 1.4 Аудит
`audit_log (id, actor_id, action, target, meta, created_at)` — каждое открытие списка учеников,
каждый экспорт, каждый AI-запрос пишется. Показывается админу в `/admin`.

### 1.5 Демо-данные
`scripts/seed-analytics.mjs`: генерирует **90 дней** правдоподобных `app_events`,
`quiz_results`, `lecture_progress_srv` для всех `verified_students` (≈600), с реализмом:
- недельная сезонность (пн–пт выше, сб–вс 20%), пики 7:15–7:45 и 19:00–22:00;
- 55% учеников активны еженедельно, 25% — раз в месяц, 20% — установили и ушли;
- средний балл квизов по предметам разный (математика 61%, история 78% и т.п.), с двумя
  «проблемными» темами (avg < 50%) и одним классом с падающей активностью — чтобы
  early-warning и AI-выводы были не пустыми;
- один всплеск просмотров новости и один провальный пост.
Запуск только с `SUPABASE_SERVICE_ROLE_KEY`, флаг `--reset` очищает сгенерированное
(помечать `meta.seed=true`). Панель показывает бейдж «DEMO PODACI», если > 50% событий за
период — seed.

---

## 2. Фаза 2 — агрегаты и API

Никакой агрегации сырых событий на клиенте. Всё считается в Postgres.

### 2.1 Views (все — `security_invoker = false`, доступ через RLS-функцию `is_school_staff()`)
- `v_daily_activity(date, dau, sessions, avg_session_s, new_users, installs)`
- `v_retention(cohort_week, d1, d7, d30)` — по `session_start`
- `v_subject_stats(period, subject, class_number, lectures_total, opens, reads, quiz_starts, quiz_finishes, avg_score, median_score, p25_score, abandon_rate, avg_time_s)`
- `v_lecture_stats(lecture_id, title, subject, class_number, author_id, opens, reads, quiz_finishes, avg_score, abandon_rate, avg_time_s, first_read_lag_h, last_activity)`
- `v_class_stats(class_number, section_number, students_total, registered, active_7d, active_30d, lectures_read_per_student, quizzes_per_student, avg_score, trend_7d_pct)`
- `v_teacher_stats(author_id, lectures, opens, reads, avg_score, avg_first_read_lag_h, last_published)`
- `v_content_gaps(query, searches, zero_results)` — поисковые запросы без результатов
- `v_community_stats(period, news_views, news_reach_pct, likes, events_views, photos_pending, photos_approved, moderation_median_h, game_sessions, shares, push_open_rate)`
- `v_hour_heatmap(weekday, hour, events)`
- `v_at_risk_students(user_id, class_number, section_number, reasons text[], score)` —
  правила: нет активности ≥14 дней при прежней активности; падение avg_score ≥ 20 п.п. за 30 дней; ≥3 брошенных квиза подряд; (если есть `attendance`) ≥ 5 неоправданных за 30 дней. `score` 0–100 — сумма весов.
- `v_school_health(date, score)` — композит 0–100: 30% покрытие, 25% WAU, 20% avg_score, 15% completion funnel, 10% свежесть контента. Формулу показать в UI по тапу на «ⓘ».

### 2.2 Ежедневная таблица
`daily_stats` заполняется `pg_cron` в 03:00 (`select refresh_daily_stats()`), хранит все
метрики за день по школе/классу/предмету — чтобы графики за полугодие открывались мгновенно.

### 2.3 API
`GET /api/direktor/stats?period=7d|30d|90d|semester|custom&from&to&class&section&subject`
→ один JSON со всеми блоками для текущего экрана; `Cache-Control: private, max-age=300`.
`GET /api/direktor/students?class&section` → только для `direktor/pedagog/razredni`, пишет audit.
`GET /api/direktor/export?format=csv|pdf&period=` → пишет audit.
Все ручки — `src/lib/api-auth.ts`, роли проверяются на сервере, не в UI.

### 2.4 Приватность (k-anonymity)
Любой агрегат по группе < 5 учеников возвращает `null` и UI показывает «Premalo podataka
(zaštita privatnosti)». Исключение — `v_at_risk_students` для `direktor/pedagog/razredni`.
Email никогда не отдаётся. Имена — только в списке at-risk.

---

## 3. Фаза 3 — UI `/direktor`

Route group `(admin)`, `src/app/(admin)/direktor/`. Нижняя навигация панели (своя, 5 вкладок,
иконки lucide): **Pregled · Učenje · Razredi · Nastava · Zajednica**, плюс кнопка «AI» в
шапке (§4). Сверху на каждом экране: переключатель периода — чипы `Danas · 7 dana · 30 dana ·
Polugodište · Prilagođeno` (44px), и фильтр класса/отделения там, где применимо.

Общие правила виджетов:
- **KPI-плитка** (§4): большое число 28/800, подпись 13/700 `#777`, дельта к прошлому периоду
  (▲ зелёный `#58CC02` / ▼ красный `#FF4B4B` / — серый), спарклайн 30 точек. Тап → детальный экран.
- Каждый график: заголовок, число-итог, дельта, «ⓘ» с определением метрики (одно предложение).
- Скелетоны при загрузке; пустое состояние §4.11: «Nema podataka za ovaj period — prikupljamo od {datum}».
- Графики — `recharts` (добавить), цвета только из токенов; на 360px все графики одной колонкой,
  высота ≤ 220px; heatmap — CSS grid, не canvas.
- Всё, что список — виртуализировать от 50 строк.
- Никаких горизонтальных скроллов страницы; таблицы — в `overflow-x:auto`.

### 3.1 Pregled (главная)
1. **AI-карточка дня** (см. §4) — сверху: 3 строки вывода + «Pročitaj analizu».
2. **Zdravlje škole** — кольцевой индикатор 0–100, дельта к прошлой неделе, тап → формула и 5 компонент.
3. Ряд KPI (2×3): `Aktivni danas`, `Aktivni 7 dana (WAU)`, `Aktivni 30 dana (MAU)`,
   `Pokrivenost` (registered / verified_students, %), `Prosječno vrijeme po sesiji`,
   `Sesija po učeniku / sedmično`.
4. **Zadržavanje**: D1 / D7 / D30 по последней когорте + мини-график по когортам недель.
5. **Aktivnost 30 dana** — линия DAU с наложенной линией прошлого периода.
6. **Kada uče** — heatmap день×час (7×24), подсказка «Vrhunac: utorak 19–21h».
7. **Signali** — список алертов (§5): «Odjeljenje 2-3: aktivnost −38% ove sedmice», «Matematika: prosjek kviza 47%», «12 fotografija čeka moderaciju 3+ dana», «5 učenika u riziku».
8. **Uređaji i instalacije**: % PWA-установок, iOS/Android/desktop, доля с подключённым eDnevnik.
9. Кнопка «Izvještaj za Ministarstvo» (§5.2).

### 3.2 Učenje
1. KPI: `Pročitane lekcije`, `Završeni kvizovi`, `Prosječan rezultat`, `% učenika sa ≥1 kvizom sedmično`, `Prosječno vrijeme na lekciji`, `Serije (streak) ≥7 dana`.
2. **Lijevak učenja**: otvoreno → pročitano → kviz započet → kviz završen (горизонтальные бары с %).
3. **Prosjek po predmetu** — горизонтальные бары, сортировка по возрастанию (проблемные сверху), с медианой и p25 в подписи; тап → предмет.
4. **Raspodjela rezultata** — гистограмма 0–100 по 10; доля < 50% выделена красным.
5. **Teme u riziku** — лекции с avg_score < 60% или abandon_rate > 40% (минимум 10 попыток): название, предмет, класс, avg, попытки, тренд.
6. **Najčitanije / Najmanje čitane** — топ-10 и анти-топ-10 лекций.
7. **Pokrivenost programa** — по предмету и классу: сколько лекций есть, сколько прочитано хотя бы одним, «предмети без лекција».
8. **Praznine u sadržaju** — поисковые запросы без результатов (v_content_gaps), кнопка «Napravi lekciju» → `/lectures/nova` с предзаполненной темой.
9. **Trend po sedmicama** — reads, quizzes, avg_score за 12 недель.
10. **Kartice (flashcards) vs kviz** — доля использования, средний результат после карточек.
11. Экран предмета (`/direktor/ucenje/[subject]`): всё выше, но по предмету + по классам 1–4 + список лекций с метриками + учителя-авторы.

### 3.3 Razredi
1. **Matrica odjeljenja** — сетка класс×отделение (1-1 … 4-6): каждая ячейка = цвет по активности (5 ступеней), число active_7d %, стрелка тренда. Тап → отделение.
2. **Rang odjeljenja** — по композиту (активность 40%, avg_score 40%, чтения на ученика 20%), с дельтой позиции.
3. **Poređenje razreda 1–4** — четыре бара по каждой метрике.
4. Экран отделения (`/direktor/razredi/[class]-[section]`):
   - KPI: ученика всего / зарегистрировано / активно 7d / 30d; читаний и квизов на ученика; avg_score; тренд.
   - Prosjek po predmetu для этого отделения vs средняя по школе (два бара рядом).
   - Aktivnost 30 dana vs школа.
   - **Učenici u riziku** — только для `direktor/pedagog/razredni`: имя, причины (чипы: «Neaktivan 16 dana», «Rezultat −24 p.p.», «3 napuštena kviza»), риск-скор, кнопка «Obavijesti razrednog» (Telegram-нотификация через `/api/telegram/notify`, пишет audit). Это **не** рейтинг и **не** список всех учеников — только флаги.
   - Если есть `attendance`: изостанци по неделям, оправданные/неоправданные, топ-дни.
   - Если есть `student_grades` (с согласием, ≥5 учеников): распределение оценок по предметам, корреляция «активность в приложении ↔ оценка» (scatter, анонимно).

### 3.4 Nastava
1. KPI: `Objavljene lekcije`, `Aktivni nastavnici` (публиковали за период), `Prosječno vrijeme do prvog čitanja`, `Lekcija na čekanju (AI nacrti)` из `lecture_jobs`, `Fotografije na moderaciji`.
2. **Nastavnici** — список: имя, предмет, лекций, просмотров, avg_score их лекций, свежесть (дней с последней публикации), статус из `teacher_statuses`. Сортировка. Это для директора, не публично.
3. **Svježina sadržaja** — доля лекций старше 90 дней без обновления; по предметам.
4. **AI nacrti** — очередь `lecture_jobs`: статусы, среднее время генерации, доля отредактированных учителем перед публикацией (если поле есть — добавить `edited_before_publish bool`).
5. **Moderacija** — очередь фото: ожидающих, медианное время ответа, доля отклонённых, кто модерирует.
6. **Efekat objave** — после публикации лекции: сколько учеников открыли за 24/72 ч (по классу).

### 3.5 Zajednica
1. KPI: `Doseg vijesti` (% активных, увидевших ≥1 новость), `Lajkovi`, `Pregledi događaja`, `Objave u galeriji`, `Partije igre`, `Dijeljenja`.
2. **Vijesti** — таблица: заголовок, просмотры, охват %, лайки, время до пика; **Najbolje vrijeme za objavu** (по часам, из событий `news_view`).
3. **Događaji** — просмотры до события по дням (растёт ли интерес), после — фото в галерее с тегом события.
4. **Galerija** — загрузки по неделям, одобрено/отклонено, топ-авторы (по классам, не по именам).
5. **Igra i turnir** — сессии, уникальные игроки, среднее время, корреляция «играет ↔ читает лекции» (анонимно, чтобы отвечать на вопрос «не отвлекает ли»).
6. **Push** — отправлено / получено / открыто, по типу уведомления.
7. **eDnevnik** — доля подключивших, синков в день, ошибки синка.

---

## 4. Фаза 4 — AI-анализ

Использовать существующий паттерн: таблица заданий + внешний воркер с Claude
(`tools/lekcija-worker.mjs`, режимы API-ключ / `claude -p`). **Не звать модель из
Next.js-роутов напрямую** — единый воркер.

### 4.1 Данные
- `analysis_jobs (id, kind 'daily'|'weekly'|'adhoc'|'question', scope jsonb {period, class, section, subject}, question text, status, input_snapshot jsonb, output jsonb, model, tokens_in, tokens_out, created_by, created_at, finished_at, error)`.
- `input_snapshot` — **только агрегаты** из views §2.1 (JSON ≤ 30 KB). Никаких имён, email, user_id; ученики в at-risk передаются как `{class, section, reasons, score}` без идентификаторов. Это надо будет показать IT-отделу министерства — сделать так, чтобы это было очевидно из кода (`buildAnalysisSnapshot()` в `src/lib/analysis-snapshot.ts` с комментарием-контрактом).

### 4.2 Воркер
`tools/analiza-worker.mjs` (или режим в существующем воркере, флаг `--analysis`): берёт job,
собирает промпт, получает **строго JSON** по схеме:
```json
{
  "summary": "3 rečenice na crnogorskom",
  "health_verdict": "dobro|pažnja|problem",
  "insights": [{"title":"", "detail":"", "metric":"", "delta":"", "severity":"info|warn|critical", "link":"/direktor/..."}],
  "recommendations": [{"action":"", "why":"", "who":"direktor|razredni|nastavnik|pedagog", "effort":"nisko|srednje|visoko"}],
  "anomalies": [{"what":"", "when":"", "possible_cause":""}],
  "risk_summary": {"students_at_risk": 0, "classes_to_watch": ["2-3"], "subjects_to_watch": ["Matematika"]},
  "questions_for_staff": ["..."],
  "confidence": "niska|srednja|visoka",
  "data_caveats": ["..."]
}
```
Промпт (на черногорском) содержит: роль «analitičar podataka za direktora gimnazije», правила —
не выдумывать цифры, ссылаться только на переданные, называть период, при `null`-агрегатах
(k-anonymity) говорить «premalo podataka», выводы формулировать как гипотезы с указанием, чем
проверить, рекомендации — конкретные и выполнимые за неделю, без общих фраз.
Валидация ответа zod; при ошибке — повтор один раз, потом `status='error'`.

### 4.3 Расписание
`pg_cron`: `daily` в 06:00 (за вчера + 7 дней контекста), `weekly` в понедельник 06:30 (за
неделю + сравнение с прошлой). Кнопка «Osvježi analizu» → `adhoc` (лимит 5/день на школу).

### 4.4 UI
- Карточка на Pregled: `summary`, вердикт цветной точкой, «Generisano: {datum} · {model}», дисклеймер 11/700 «AI analiza agregiranih podataka. Provjerite prije odluke.».
- Экран `/direktor/ai`: полный отчёт — секции Uvidi (карточки по severity, тап по `link` ведёт на виджет), Preporuke (чек-лист с «Označi urađeno» → сохраняется в `analysis_actions`), Anomalije, Rizici, Pitanja za kolegijum, Ograničenja podataka. История отчётов по датам.
- **Pitaj podatke** — поле ввода: вопрос на естественном языке («Koje odjeljenje najviše pada u matematici?»). Реализация безопасная: воркер получает вопрос **и тот же снапшот агрегатов**, отвечает по нему; **никакого NL→SQL** по сырым таблицам. Если ответа в снапшоте нет — модель обязана сказать «Nemam te podatke u pregledu» и предложить, какой фильтр выбрать. Ответы кэшируются по (вопрос, период, фильтры).
- Каждый AI-запрос → `audit_log`.

---

## 5. Фаза 5 — алерты, экспорт, дайджест

### 5.1 Alerts
Таблица `alert_rules (metric, comparator, threshold, window, scope, channel)` с дефолтами:
- WAU по отделению −30% нед/нед; отделение с 0 активности 7 дней;
- avg_score предмета < 50% при ≥ 20 попытках; лекция с abandon > 50% при ≥ 10;
- очередь модерации > 10 или старше 72 ч; at-risk список вырос на ≥ 3;
- AI-отчёт с `health_verdict = problem`.
Проверка в `pg_cron` каждый час → `alerts` таблица → push (существующий `notification-bell`) +
Telegram (`/api/telegram/notify`) директору. В UI «Signali» на Pregled + экран настройки правил
(тумблеры, пороги, 44px).

### 5.2 Экспорт
- «Izvještaj za Ministarstvo» → PDF (серверный рендер, `@react-pdf/renderer` или печать HTML):
  титул (школа, период, дата), Zdravlje škole, KPI, Učenje по предметам, Razredi (агрегаты,
  без имён), Nastava (без имён учителей — только счётчики), Zajednica, AI-sažetak, методология
  и определения метрик, страница «Zaštita podataka» (k-anonymity, что не собираем).
- CSV по каждому экрану (то, что видно, с текущими фильтрами).
- Все экспорты — в `audit_log`.

### 5.3 Дайджест
Понедельник 07:00 — Telegram директору: 5 строк (WAU, дельта, лучший/худший предмет, риски,
1 рекомендация от AI) + ссылка на `/direktor`. Тумблер в настройках панели.

---

## 6. Что не делать
- Не показывать рейтинги учеников по именам никому, кроме at-risk для уполномоченных.
- Не считать агрегаты на клиенте из сырых событий.
- Не звать модель из Next.js-роутов; не передавать модели персональные данные.
- Не ломать существующие экраны ученика: `track()` — добавление, не переписывание.
- Не менять существующие таблицы деструктивно; только добавления (`alter … add column`).

## 7. Строки UI (черногорский, полный список пополнять по мере работы)
«Direktor», «Pregled», «Učenje», «Razredi», «Nastava», «Zajednica», «AI analiza», «Danas»,
«7 dana», «30 dana», «Polugodište», «Prilagođeno», «Zdravlje škole», «Aktivni danas»,
«Aktivni 7 dana», «Aktivni 30 dana», «Pokrivenost», «Prosječno vrijeme po sesiji»,
«Zadržavanje», «Kada uče», «Signali», «Uređaji i instalacije», «Izvještaj za Ministarstvo»,
«Pročitane lekcije», «Završeni kvizovi», «Prosječan rezultat», «Lijevak učenja»,
«Prosjek po predmetu», «Raspodjela rezultata», «Teme u riziku», «Najčitanije», «Najmanje čitane»,
«Pokrivenost programa», «Praznine u sadržaju», «Napravi lekciju», «Matrica odjeljenja»,
«Rang odjeljenja», «Učenici u riziku», «Obavijesti razrednog», «Neaktivan {n} dana»,
«Objavljene lekcije», «Aktivni nastavnici», «Svježina sadržaja», «AI nacrti», «Moderacija»,
«Doseg vijesti», «Najbolje vrijeme za objavu», «Osvježi analizu», «Pitaj podatke»,
«Nemam te podatke u pregledu», «Generisano», «AI analiza agregiranih podataka. Provjerite prije odluke.»,
«Premalo podataka (zaštita privatnosti)», «Nema podataka za ovaj period — prikupljamo od {datum}»,
«DEMO PODACI», «Označi urađeno», «Preporuke», «Uvidi», «Anomalije», «Rizici», «Ograničenja podataka».

## 8. Проверка
`npx tsc --noEmit`, `npm run build`, `node scripts/e2e-smoke.mjs` (добавить: track отправляет
пачку; `/direktor` редиректит ученика; все 5 вкладок рендерятся с seed-данными на 360px без
горизонтального скролла; k-anonymity возвращает null для группы < 5; AI-карточка показывает
последний отчёт; экспорт пишет audit). `node scripts/shot-all.mjs` — скриншоты всех экранов
панели на 360px и desktop.
