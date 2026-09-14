-- direktor_stats() takes ~6 s over the seeded events; the panel must open
-- instantly. Cache the JSON per (period, class, section, subject) and
-- serve it when fresher than 6 hours; refresh school-wide periods on demand
-- (the worker calls refresh_direktor_stats() every 30 minutes).
create table if not exists public.direktor_stats_cache (
  key text primary key,
  payload jsonb not null,
  computed_at timestamptz not null default now()
);
alter table public.direktor_stats_cache enable row level security;
revoke all on public.direktor_stats_cache from anon, authenticated;

create or replace function public.direktor_stats_cached(period text, class_number int default null, section_number int default null, subject text default null, max_age interval default interval '6 hours')
returns jsonb language plpgsql security definer set search_path = public set statement_timeout = '150s' as $$
declare
  k text := coalesce(period,'7d') || '|' || coalesce(class_number::text,'') || '|' || coalesce(section_number::text,'') || '|' || coalesce(subject,'');
  r jsonb;
  role_ text := public.caller_role();
begin
  if role_ is null or role_ not in ('direktor','admin','creator','pedagog','service_role') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select payload into r from public.direktor_stats_cache c where c.key = k and c.computed_at > now() - max_age;
  if found then return r; end if;
  r := public.direktor_stats(period, class_number, section_number, subject);
  insert into public.direktor_stats_cache (key, payload, computed_at) values (k, r, now())
  on conflict (key) do update set payload = excluded.payload, computed_at = now();
  return r;
end $$;
grant execute on function public.direktor_stats_cached(text, int, int, text, interval) to authenticated, service_role;

create or replace function public.refresh_direktor_stats()
returns int language plpgsql security definer set search_path = public set statement_timeout = '600s' as $$
declare p text; n int := 0;
begin
  if public.caller_role() is distinct from 'service_role' then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  foreach p in array array['today','7d','30d','semester'] loop
    perform public.direktor_stats_cached(p, null, null, null, interval '0');
    n := n + 1;
  end loop;
  return n;
end $$;
grant execute on function public.refresh_direktor_stats() to service_role;
