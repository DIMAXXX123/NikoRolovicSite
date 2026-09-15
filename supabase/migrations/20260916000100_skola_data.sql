-- Škola panel: real-school data the app cannot derive from usage events —
-- grades, absences and behaviour notes. Three sources:
--   ednevnik  pupils who connect their eDnevnik upload their own grades/absences
--             (POST /api/skola/sync) — the only automatic path until the school
--             grants MEIS access;
--   manual    staff enter or paste rows (POST /api/skola/import, /api/skola/notes);
--   seed      demo data from seed_school_demo() so the panel is never empty.
-- Read through skola_stats(); rows are never exposed to pupils.

create table if not exists public.school_grades (
  id             uuid primary key default gen_random_uuid(),
  student_key    text not null,                 -- profiles.id or verified_students.id, as text
  class_number   int  not null check (class_number between 1 and 4),
  section_number int  not null check (section_number between 1 and 6),
  subject        text not null,
  grade          smallint not null check (grade between 1 and 5),
  grade_type     text,                          -- pismeni / usmeni / zaključna …
  graded_on      date not null,
  source         text not null default 'ednevnik' check (source in ('ednevnik','manual','seed')),
  created_by     uuid,
  synced_at      timestamptz not null default now()
);
create unique index if not exists school_grades_dedupe
  on public.school_grades (student_key, subject, graded_on, grade, coalesce(grade_type, ''));
create index if not exists school_grades_lookup on public.school_grades (graded_on, class_number, section_number, subject);
create index if not exists school_grades_student on public.school_grades (student_key);

create table if not exists public.school_absences (
  id             uuid primary key default gen_random_uuid(),
  student_key    text not null,
  class_number   int  not null check (class_number between 1 and 4),
  section_number int  not null check (section_number between 1 and 6),
  absent_on      date not null,
  hours          smallint not null default 1 check (hours between 1 and 8),
  justified      boolean,                       -- null = still undecided
  source         text not null default 'ednevnik' check (source in ('ednevnik','manual','seed')),
  created_by     uuid,
  synced_at      timestamptz not null default now()
);
create unique index if not exists school_absences_dedupe
  on public.school_absences (student_key, absent_on, coalesce(justified::text, 'n'));
create index if not exists school_absences_lookup on public.school_absences (absent_on, class_number, section_number);

create table if not exists public.school_notes (
  id             uuid primary key default gen_random_uuid(),
  class_number   int  not null check (class_number between 1 and 4),
  section_number int  not null check (section_number between 1 and 6),
  student_name   text,
  kind           text not null default 'napomena' check (kind in ('pohvala','opomena','napomena')),
  text           text not null check (char_length(text) between 1 and 1000),
  author_id      uuid,
  author_name    text,
  source         text not null default 'manual' check (source in ('manual','seed')),
  created_at     timestamptz not null default now()
);
create index if not exists school_notes_recent on public.school_notes (created_at desc);

alter table public.school_grades   enable row level security;
alter table public.school_absences enable row level security;
alter table public.school_notes    enable row level security;

drop policy if exists school_grades_staff_read   on public.school_grades;
drop policy if exists school_absences_staff_read on public.school_absences;
drop policy if exists school_notes_staff_read    on public.school_notes;
create policy school_grades_staff_read   on public.school_grades   for select using (public.is_school_staff());
create policy school_absences_staff_read on public.school_absences for select using (public.is_school_staff());
create policy school_notes_staff_read    on public.school_notes    for select using (public.is_school_staff());
-- writes only through the API (service role)
grant select on public.school_grades, public.school_absences, public.school_notes to authenticated;
grant all on public.school_grades, public.school_absences, public.school_notes to service_role;

-- ---------------------------------------------------------------------------
-- School-year helpers (Montenegro: 1 Sep – 30 Jun, semesters split 1 Feb).
-- ---------------------------------------------------------------------------
create or replace function public.school_year_start(d date)
returns date language sql immutable as $$
  select case when extract(month from d) >= 9 then make_date(extract(year from d)::int, 9, 1)
              else make_date(extract(year from d)::int - 1, 9, 1) end;
$$;

create or replace function public.semester_start(d date)
returns date language sql immutable as $$
  select case when extract(month from d) >= 9 or extract(month from d) = 1
              then public.school_year_start(d)
              else make_date(extract(year from d)::int, 2, 1) end;
$$;

-- ---------------------------------------------------------------------------
-- skola_stats(period, class, section, subject)
-- period: 7d | 30d | semester | year | prev_year
-- ---------------------------------------------------------------------------
create or replace function public.skola_stats(
  p_period  text default 'year',
  p_class   int  default null,
  p_section int  default null,
  p_subject text default null
) returns jsonb
language plpgsql stable security definer
set search_path = public, pg_temp
as $$
declare
  today      date := (now() at time zone 'Europe/Podgorica')::date;
  d_from     date;
  d_to       date;   -- exclusive
  p_from     date;
  p_to       date;
  kmin       int := public.k_anon_min();
  j_meta     jsonb;
  j_grades   jsonb;
  j_att      jsonb;
  j_notes    jsonb;
  j_detail   jsonb := null;
begin
  if p_period = '7d' then
    d_from := today - 6; d_to := today + 1; p_from := d_from - 7; p_to := d_from;
  elsif p_period = '30d' then
    d_from := today - 29; d_to := today + 1; p_from := d_from - 30; p_to := d_from;
  elsif p_period = 'semester' then
    d_from := public.semester_start(today); d_to := today + 1;
    p_from := d_from - interval '1 year'; p_to := d_to - interval '1 year';
  elsif p_period = 'prev_year' then
    d_from := public.school_year_start(today) - interval '1 year'; d_to := public.school_year_start(today);
    p_from := d_from - interval '1 year'; p_to := d_to - interval '1 year';
  else
    d_from := public.school_year_start(today); d_to := today + 1;
    p_from := d_from - interval '1 year'; p_to := d_to - interval '1 year';
  end if;

  -- ---------- meta / sources ----------
  select jsonb_build_object(
    'period', p_period, 'from', d_from, 'to', d_to - 1, 'prev_from', p_from, 'prev_to', p_to - 1,
    'class', p_class, 'section', p_section, 'subject', p_subject,
    'generated_at', now(), 'k_min', kmin,
    'verified_total', (select count(*) from public.verified_students),
    'students_with_grades', (select count(distinct student_key) from public.school_grades where graded_on >= d_from and graded_on < d_to),
    'ednevnik_students', (select count(distinct student_key) from public.school_grades where source = 'ednevnik'),
    'manual_rows', (select count(*) from public.school_grades where source = 'manual'),
    'seed_share', (select coalesce(round(100.0 * count(*) filter (where source = 'seed') / nullif(count(*), 0), 1), 0)
                     from public.school_grades where graded_on >= d_from and graded_on < d_to),
    'last_sync_at', (select max(synced_at) from public.school_grades where source = 'ednevnik')
  ) into j_meta;

  -- ---------- grades ----------
  with g as (
    select * from public.school_grades
     where graded_on >= p_from and graded_on < d_to
       and (p_class is null or class_number = p_class)
       and (p_section is null or section_number = p_section)
       and (p_subject is null or subject = p_subject)
  ), cur as (select * from g where graded_on >= d_from),
  prev as (select * from g where graded_on < p_to),
  by_subject as (
    select c.subject,
           count(*) as n, count(distinct c.student_key) as students,
           avg(c.grade) as avg_grade,
           (select avg(grade) from prev p where p.subject = c.subject) as prev_avg,
           count(*) filter (where c.grade = 1) as n1, count(*) filter (where c.grade = 2) as n2,
           count(*) filter (where c.grade = 3) as n3, count(*) filter (where c.grade = 4) as n4,
           count(*) filter (where c.grade = 5) as n5
      from cur c group by c.subject
  ), by_section as (
    select c.class_number, c.section_number,
           count(*) as n, count(distinct c.student_key) as students,
           avg(c.grade) as avg_grade,
           (select avg(grade) from prev p where p.class_number = c.class_number and p.section_number = c.section_number) as prev_avg,
           count(*) filter (where c.grade <= 2) as low,
           (select count(*) from public.verified_students v where v.class_number = c.class_number and v.section_number = c.section_number) as roster
      from cur c group by c.class_number, c.section_number
  ), by_class as (
    select c.class_number, count(*) as n, count(distinct c.student_key) as students, avg(c.grade) as avg_grade,
           (select avg(grade) from prev p where p.class_number = c.class_number) as prev_avg,
           (select count(*) from public.verified_students v where v.class_number = c.class_number) as roster
      from cur c group by c.class_number
  ), weekly as (
    select date_trunc('week', graded_on)::date as w, avg(grade) as avg_grade, count(*) as n
      from public.school_grades
     where graded_on >= today - 364
       and (p_class is null or class_number = p_class)
       and (p_section is null or section_number = p_section)
       and (p_subject is null or subject = p_subject)
     group by 1
  ), monthly as (
    select date_trunc('month', graded_on)::date as m, avg(grade) as avg_grade, count(*) as n
      from public.school_grades
     where graded_on >= today - 364
       and (p_class is null or class_number = p_class)
       and (p_section is null or section_number = p_section)
       and (p_subject is null or subject = p_subject)
     group by 1
  )
  select jsonb_build_object(
    'avg', (select round(avg(grade)::numeric, 2) from cur),
    'prev_avg', (select round(avg(grade)::numeric, 2) from prev),
    'n', (select count(*) from cur),
    'students', (select count(distinct student_key) from cur),
    'low_share_pct', (select round(100.0 * count(*) filter (where grade <= 2) / nullif(count(*), 0), 1) from cur),
    'dist', (select jsonb_build_array(count(*) filter (where grade = 1), count(*) filter (where grade = 2), count(*) filter (where grade = 3), count(*) filter (where grade = 4), count(*) filter (where grade = 5)) from cur),
    'by_subject', (select coalesce(jsonb_agg(jsonb_build_object(
        'subject', subject, 'n', n, 'students', students, 'k_hidden', students < kmin,
        'avg', case when students >= kmin then round(avg_grade::numeric, 2) end,
        'prev_avg', case when students >= kmin then round(prev_avg::numeric, 2) end,
        'low_share_pct', case when students >= kmin then round(100.0 * (n1 + n2) / nullif(n, 0), 1) end,
        'dist', case when students >= kmin then jsonb_build_array(n1, n2, n3, n4, n5) end
      ) order by avg_grade asc nulls last), '[]') from by_subject),
    'by_class', (select coalesce(jsonb_agg(jsonb_build_object(
        'class_number', class_number, 'n', n, 'students', students, 'roster', roster,
        'coverage_pct', round(100.0 * students / nullif(roster, 0), 1),
        'avg', case when students >= kmin then round(avg_grade::numeric, 2) end,
        'prev_avg', case when students >= kmin then round(prev_avg::numeric, 2) end
      ) order by class_number), '[]') from by_class),
    'by_section', (select coalesce(jsonb_agg(jsonb_build_object(
        'class_number', class_number, 'section_number', section_number, 'n', n, 'students', students, 'roster', roster,
        'k_hidden', students < kmin,
        'coverage_pct', round(100.0 * students / nullif(roster, 0), 1),
        'avg', case when students >= kmin then round(avg_grade::numeric, 2) end,
        'prev_avg', case when students >= kmin then round(prev_avg::numeric, 2) end,
        'low_share_pct', case when students >= kmin then round(100.0 * low / nullif(n, 0), 1) end
      ) order by class_number, section_number), '[]') from by_section),
    'weekly', (select coalesce(jsonb_agg(jsonb_build_object('week_start', w, 'avg', round(avg_grade::numeric, 2), 'n', n) order by w), '[]') from weekly),
    'monthly', (select coalesce(jsonb_agg(jsonb_build_object('month', m, 'avg', round(avg_grade::numeric, 2), 'n', n) order by m), '[]') from monthly)
  ) into j_grades;

  -- ---------- attendance ----------
  with a as (
    select * from public.school_absences
     where absent_on >= p_from and absent_on < d_to
       and (p_class is null or class_number = p_class)
       and (p_section is null or section_number = p_section)
  ), cur as (select * from a where absent_on >= d_from),
  prev as (select * from a where absent_on < p_to),
  by_section as (
    select c.class_number, c.section_number,
           sum(c.hours) as hours, sum(c.hours) filter (where c.justified = false) as unjustified,
           count(distinct c.student_key) as students,
           (select count(*) from public.verified_students v where v.class_number = c.class_number and v.section_number = c.section_number) as roster,
           (select sum(hours) from prev p where p.class_number = c.class_number and p.section_number = c.section_number) as prev_hours
      from cur c group by c.class_number, c.section_number
  ), by_class as (
    select c.class_number, sum(c.hours) as hours, sum(c.hours) filter (where c.justified = false) as unjustified,
           (select count(*) from public.verified_students v where v.class_number = c.class_number) as roster,
           (select sum(hours) from prev p where p.class_number = c.class_number) as prev_hours
      from cur c group by c.class_number
  ), weekly as (
    select date_trunc('week', absent_on)::date as w, sum(hours) as hours, sum(hours) filter (where justified = false) as unjustified
      from public.school_absences
     where absent_on >= today - 364
       and (p_class is null or class_number = p_class)
       and (p_section is null or section_number = p_section)
     group by 1
  ), heavy as (
    select student_key, sum(hours) filter (where justified = false) as unj from cur group by student_key
  )
  select jsonb_build_object(
    'hours', (select coalesce(sum(hours), 0) from cur),
    'unjustified', (select coalesce(sum(hours) filter (where justified = false), 0) from cur),
    'prev_hours', (select coalesce(sum(hours), 0) from prev),
    'per_student', (select round(coalesce(sum(hours), 0)::numeric / nullif((select count(*) from public.verified_students v
                        where (p_class is null or v.class_number = p_class) and (p_section is null or v.section_number = p_section)), 0), 2) from cur),
    'students_absent', (select count(distinct student_key) from cur),
    'heavy_unjustified', (select count(*) from heavy where unj >= 10),
    'by_section', (select coalesce(jsonb_agg(jsonb_build_object(
        'class_number', class_number, 'section_number', section_number, 'roster', roster,
        'hours', hours, 'unjustified', coalesce(unjustified, 0), 'prev_hours', coalesce(prev_hours, 0),
        'per_student', round(hours::numeric / nullif(roster, 0), 2),
        'unjustified_pct', round(100.0 * coalesce(unjustified, 0) / nullif(hours, 0), 1),
        'students_absent', students
      ) order by class_number, section_number), '[]') from by_section),
    'by_class', (select coalesce(jsonb_agg(jsonb_build_object(
        'class_number', class_number, 'roster', roster, 'hours', hours, 'unjustified', coalesce(unjustified, 0),
        'prev_hours', coalesce(prev_hours, 0), 'per_student', round(hours::numeric / nullif(roster, 0), 2)
      ) order by class_number), '[]') from by_class),
    'weekly', (select coalesce(jsonb_agg(jsonb_build_object('week_start', w, 'hours', hours, 'unjustified', coalesce(unjustified, 0)) order by w), '[]') from weekly)
  ) into j_att;

  -- ---------- notes ----------
  with n as (
    select * from public.school_notes
     where created_at >= public.local_day_start(d_from) and created_at < public.local_day_start(d_to)
       and (p_class is null or class_number = p_class)
       and (p_section is null or section_number = p_section)
  )
  select jsonb_build_object(
    'total', (select count(*) from n),
    'by_kind', (select coalesce(jsonb_object_agg(kind, c), '{}') from (select kind, count(*) c from n group by kind) t),
    'by_section', (select coalesce(jsonb_agg(jsonb_build_object('class_number', class_number, 'section_number', section_number,
                      'pohvala', p, 'opomena', o, 'napomena', np) order by class_number, section_number), '[]')
                    from (select class_number, section_number,
                                 count(*) filter (where kind = 'pohvala') p, count(*) filter (where kind = 'opomena') o,
                                 count(*) filter (where kind = 'napomena') np
                            from n group by class_number, section_number) t),
    'latest', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'class_number', class_number, 'section_number', section_number,
                      'student_name', student_name, 'kind', kind, 'text', text, 'author_name', author_name, 'created_at', created_at)
                      order by created_at desc), '[]')
                 from (select * from n order by created_at desc limit 30) t)
  ) into j_notes;

  -- ---------- section detail ----------
  if p_class is not null and p_section is not null then
    with cur as (
      select * from public.school_grades where graded_on >= d_from and graded_on < d_to
         and class_number = p_class and section_number = p_section
    ), school as (
      select subject, avg(grade) as avg_grade from public.school_grades
       where graded_on >= d_from and graded_on < d_to group by subject
    ), secs as (
      select subject, avg(grade) as avg_grade, count(*) as n, count(distinct student_key) as students,
             count(*) filter (where grade <= 2) as low
        from cur group by subject
    )
    select jsonb_build_object(
      'subjects', (select coalesce(jsonb_agg(jsonb_build_object('subject', s.subject,
                     'avg', case when x.students >= kmin then round(x.avg_grade::numeric, 2) end,
                     'n', x.n, 'students', x.students, 'k_hidden', coalesce(x.students, 0) < kmin,
                     'low_share_pct', case when x.students >= kmin then round(100.0 * x.low / nullif(x.n, 0), 1) end,
                     'school_avg', round(s.avg_grade::numeric, 2)) order by x.avg_grade asc nulls last), '[]')
                    from school s left join secs x on x.subject = s.subject),
      'absences_daily', (select coalesce(jsonb_agg(jsonb_build_object('date', d, 'hours', h, 'unjustified', u) order by d), '[]')
                           from (select absent_on d, sum(hours) h, sum(hours) filter (where justified = false) u
                                   from public.school_absences
                                  where absent_on >= greatest(d_from, today - 59) and absent_on < d_to
                                    and class_number = p_class and section_number = p_section group by 1) t)
    ) into j_detail;
  end if;

  return jsonb_build_object('meta', j_meta, 'grades', j_grades, 'attendance', j_att, 'notes', j_notes, 'section_detail', j_detail);
end;
$$;

revoke all on function public.skola_stats(text, int, int, text) from public;
grant execute on function public.skola_stats(text, int, int, text) to service_role;

-- ---------------------------------------------------------------------------
-- Demo seed: one school year of grades + absences + notes for the whole roster.
-- Deterministic (setseed) and idempotent (deletes previous seed rows).
-- ---------------------------------------------------------------------------
create or replace function public.seed_school_demo()
returns jsonb
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  today   date := (now() at time zone 'Europe/Podgorica')::date;
  sy      date := public.school_year_start(today);      -- current school year start
  psy     date := sy - interval '1 year';               -- previous school year start
  subjects text[] := array['Matematika','Fizika','Hemija','Biologija','CSBH','Engleski jezik','Italijanski jezik','Istorija','Geografija','Informatika'];
  sub_off  numeric[] := array[-0.35,-0.30,-0.20,0.05,0.00,0.30,0.20,0.10,0.15,0.40];
  types    text[] := array['usmeni','pismeni','usmeni','kontrolni','usmeni','domaći'];
  r        record;
  ability  numeric;
  sec_off  numeric;
  i        int;
  k        int;
  d        date;
  g        int;
  n_grades int := 0;
  n_abs    int := 0;
  n_notes  int := 0;
  heavy    boolean;
  notes_text text[] := array[
    'Ometa čas razgovorom, opomenut usmeno.',
    'Odličan rad na času, pomaže drugima.',
    'Nije donio domaći treći put zaredom.',
    'Pohvala za nastup na školskoj priredbi.',
    'Kašnjenje na prvi čas — obaviješteni roditelji.',
    'Sukob sa drugom iz odjeljenja, razgovor sa pedagogom.',
    'Uzoran odnos prema obavezama.',
    'Korišćenje telefona tokom pismenog.',
    'Predstavljao školu na opštinskom takmičenju.',
    'Razgovor sa roditeljima zbog izostanaka.'];
  notes_kind text[] := array['opomena','pohvala','napomena','pohvala','napomena','opomena','pohvala','opomena','pohvala','napomena'];
  first_names text[] := array['Luka','Marko','Nikola','Andrija','Vuk','Petar','Sara','Mia','Ana','Jovana','Milica','Lana','Teodora','Ognjen','Danilo','Jelena'];
  last_names  text[] := array['Popović','Vuković','Marković','Radović','Ivanović','Jovanović','Đurović','Perović','Kovačević','Nikolić'];
begin
  perform setseed(0.42);
  delete from public.school_grades   where source = 'seed';
  delete from public.school_absences where source = 'seed';
  delete from public.school_notes    where source = 'seed';

  for r in select id, class_number, section_number from public.verified_students order by id loop
    -- section character: 3-4 weak, 1-2 weak-ish, 4-1 and 2-3 strong
    sec_off := case
      when r.class_number = 3 and r.section_number = 4 then -0.55
      when r.class_number = 1 and r.section_number = 2 then -0.30
      when r.class_number = 2 and r.section_number = 6 then -0.20
      when r.class_number = 4 and r.section_number = 1 then  0.40
      when r.class_number = 2 and r.section_number = 3 then  0.30
      else (random() - 0.5) * 0.2 end;
    ability := least(4.9, greatest(1.6, 3.55 + sec_off + (random() + random() + random() - 1.5) * 0.9));
    heavy := random() < 0.08;

    for i in 1..array_length(subjects, 1) loop
      -- previous school year: ~9 grades per subject, Sep..mid-Jun
      for k in 1..(7 + floor(random() * 4)::int) loop
        d := psy + (floor(random() * 285))::int;      -- Sep 1 .. mid June
        if extract(month from d) in (7, 8) then continue; end if;
        -- seasonal drift: dips before the winter break and in May, lift in October
        g := least(5, greatest(1, round(ability + sub_off[i] + 0.22 * sin((extract(month from d) - 9) * 0.9) + (random() + random() - 1) * 1.1)::int));
        insert into public.school_grades (student_key, class_number, section_number, subject, grade, grade_type, graded_on, source)
        values (r.id::text, r.class_number, r.section_number, subjects[i], g, types[1 + floor(random() * 6)::int], d, 'seed')
        on conflict do nothing;
        n_grades := n_grades + 1;
      end loop;
      -- current school year so far: 1–2 grades per subject
      for k in 1..(1 + floor(random() * 2)::int) loop
        d := sy + (floor(random() * greatest(1, (today - sy)))::int);
        if d > today then continue; end if;
        g := least(5, greatest(1, round(ability + sub_off[i] + (random() + random() - 1) * 1.1)::int));
        insert into public.school_grades (student_key, class_number, section_number, subject, grade, grade_type, graded_on, source)
        values (r.id::text, r.class_number, r.section_number, subjects[i], g, types[1 + floor(random() * 6)::int], d, 'seed')
        on conflict do nothing;
        n_grades := n_grades + 1;
      end loop;
    end loop;

    -- absences: school days only, ~3 % (heavy: 12 %) of days, 15 % unjustified (heavy: 50 %)
    d := psy;
    while d <= today loop
      if extract(isodow from d) <= 5 and extract(month from d) not in (7, 8)
         and not (extract(month from d) = 1 and extract(day from d) <= 15)
         and random() < (case when heavy then 0.12 else 0.03 end) * (case when r.class_number = 3 and r.section_number = 4 then 1.8 else 1 end) then
        insert into public.school_absences (student_key, class_number, section_number, absent_on, hours, justified, source)
        values (r.id::text, r.class_number, r.section_number, d,
                (1 + floor(random() * 6))::int,
                case when random() < (case when heavy then 0.5 else 0.15 end) then false else true end, 'seed')
        on conflict do nothing;
        n_abs := n_abs + 1;
      end if;
      d := d + 1;
    end loop;
  end loop;

  -- notes: ~70 over the year, a dozen this month
  for k in 1..70 loop
    i := 1 + floor(random() * 10)::int;
    insert into public.school_notes (class_number, section_number, student_name, kind, text, author_name, source, created_at)
    values (1 + floor(random() * 4)::int, 1 + floor(random() * 6)::int,
            first_names[1 + floor(random() * 16)::int] || ' ' || substr(last_names[1 + floor(random() * 10)::int], 1, 1) || '.',
            notes_kind[i], notes_text[i], 'Razredni starješina', 'seed',
            public.local_day_start(case when k <= 12 then today - floor(random() * 14)::int else psy + floor(random() * 300)::int end) + interval '10 hours');
    n_notes := n_notes + 1;
  end loop;

  return jsonb_build_object('grades', n_grades, 'absences', n_abs, 'notes', n_notes);
end;
$$;
revoke all on function public.seed_school_demo() from public;
grant execute on function public.seed_school_demo() to service_role;

-- ---------------------------------------------------------------------------
-- Bulk insert with ON CONFLICT DO NOTHING (the dedupe indexes use expressions,
-- which PostgREST upsert cannot target). Used by /api/skola/import and /sync.
-- ---------------------------------------------------------------------------
create or replace function public.school_import(p_kind text, p_rows jsonb)
returns int
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare n int;
begin
  if p_kind = 'grades' then
    with ins as (
      insert into public.school_grades (student_key, class_number, section_number, subject, grade, grade_type, graded_on, source, created_by)
      select r.student_key, r.class_number, r.section_number, r.subject, r.grade, r.grade_type, r.graded_on, coalesce(r.source, 'manual'), r.created_by
        from jsonb_to_recordset(p_rows) as r(student_key text, class_number int, section_number int, subject text, grade smallint, grade_type text, graded_on date, source text, created_by uuid)
      on conflict do nothing
      returning 1)
    select count(*) into n from ins;
  elsif p_kind = 'absences' then
    with ins as (
      insert into public.school_absences (student_key, class_number, section_number, absent_on, hours, justified, source, created_by)
      select r.student_key, r.class_number, r.section_number, r.absent_on, coalesce(r.hours, 1), r.justified, coalesce(r.source, 'manual'), r.created_by
        from jsonb_to_recordset(p_rows) as r(student_key text, class_number int, section_number int, absent_on date, hours smallint, justified boolean, source text, created_by uuid)
      on conflict do nothing
      returning 1)
    select count(*) into n from ins;
  else
    raise exception 'unknown kind %', p_kind;
  end if;
  return n;
end;
$$;
revoke all on function public.school_import(text, jsonb) from public;
grant execute on function public.school_import(text, jsonb) to service_role;
