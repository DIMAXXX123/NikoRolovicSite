-- service_role inherits authenticator's statement_timeout=8s; the stats
-- functions must not die under load (the worker's cache refresh runs
-- direktor_stats for 20-30 s at the same time). Raise it per function and
-- cache skola_stats like direktor_stats.
alter function public.skola_stats(text, int, int, text) set statement_timeout = '120s';
alter function public.nastavnik_stats(uuid, text) set statement_timeout = '120s';
alter function public.direktor_students(int, int) set statement_timeout = '60s';
alter function public.build_analysis_snapshot(jsonb) set statement_timeout = '120s';
alter function public.school_import(text, jsonb) set statement_timeout = '60s';

create table if not exists public.skola_stats_cache (
  key text primary key,
  payload jsonb not null,
  computed_at timestamptz not null default now()
);
alter table public.skola_stats_cache enable row level security;
revoke all on public.skola_stats_cache from anon, authenticated;

create or replace function public.skola_stats_cached(p_period text, p_class int default null, p_section int default null, p_subject text default null, max_age interval default interval '15 minutes')
returns jsonb language plpgsql security definer set search_path = public set statement_timeout = '150s' as $$
declare
  k text := coalesce(p_period,'year') || '|' || coalesce(p_class::text,'') || '|' || coalesce(p_section::text,'') || '|' || coalesce(p_subject,'');
  r jsonb;
begin
  if public.caller_role() is distinct from 'service_role' then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select payload into r from public.skola_stats_cache c where c.key = k and c.computed_at > now() - max_age;
  if found then return r; end if;
  r := public.skola_stats(p_period, p_class, p_section, p_subject);
  insert into public.skola_stats_cache (key, payload, computed_at) values (k, r, now())
  on conflict (key) do update set payload = excluded.payload, computed_at = now();
  return r;
end $$;
revoke all on function public.skola_stats_cached(text, int, int, text, interval) from public;
grant execute on function public.skola_stats_cached(text, int, int, text, interval) to service_role;

-- Drop the whole cache after any write (import / sync / notes) so the panel is never stale after entry.
create or replace function public.skola_cache_invalidate() returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- safeupdate (preloaded for the API roles) refuses DELETE without WHERE
  delete from public.skola_stats_cache where computed_at <= now();
  return null;
end $$;
drop trigger if exists school_grades_cache_inv on public.school_grades;
drop trigger if exists school_absences_cache_inv on public.school_absences;
drop trigger if exists school_notes_cache_inv on public.school_notes;
create trigger school_grades_cache_inv after insert or update or delete on public.school_grades for each statement execute function public.skola_cache_invalidate();
create trigger school_absences_cache_inv after insert or update or delete on public.school_absences for each statement execute function public.skola_cache_invalidate();
create trigger school_notes_cache_inv after insert or update or delete on public.school_notes for each statement execute function public.skola_cache_invalidate();

create or replace function public.refresh_skola_stats()
returns int language plpgsql security definer set search_path = public set statement_timeout = '600s' as $$
declare p text; n int := 0;
begin
  if public.caller_role() is distinct from 'service_role' then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  foreach p in array array['30d','semester','year','prev_year'] loop
    perform public.skola_stats_cached(p, null, null, null, interval '0');
    n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function public.refresh_skola_stats() from public;
grant execute on function public.refresh_skola_stats() to service_role;

-- Same for the Profesor panel (3-4 s per call uncached).
create table if not exists public.nastavnik_stats_cache (
  key text primary key,
  payload jsonb not null,
  computed_at timestamptz not null default now()
);
alter table public.nastavnik_stats_cache enable row level security;
revoke all on public.nastavnik_stats_cache from anon, authenticated;

create or replace function public.nastavnik_stats_cached(author uuid, period text, max_age interval default interval '15 minutes')
returns jsonb language plpgsql security definer set search_path = public set statement_timeout = '150s' as $$
declare
  k text := coalesce(author::text,'') || '|' || coalesce(period,'7d');
  r jsonb;
begin
  if public.caller_role() is distinct from 'service_role' then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select payload into r from public.nastavnik_stats_cache c where c.key = k and c.computed_at > now() - max_age;
  if found then return r; end if;
  r := public.nastavnik_stats(author, period);
  insert into public.nastavnik_stats_cache (key, payload, computed_at) values (k, r, now())
  on conflict (key) do update set payload = excluded.payload, computed_at = now();
  return r;
end $$;
revoke all on function public.nastavnik_stats_cached(uuid, text, interval) from public;
grant execute on function public.nastavnik_stats_cached(uuid, text, interval) to service_role;
