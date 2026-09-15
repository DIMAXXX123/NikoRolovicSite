-- Photo moderation was limited to admin/moderator: the creator account (the
-- owner) and teachers could neither see pending photos nor approve them.
-- Every school staff role + moderator may now read pending and change status.
create or replace function public.is_moderator()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.profiles where id = auth.uid()
                  and role in ('admin','moderator','creator','direktor','pedagog','razredni','teacher'));
$$;
revoke all on function public.is_moderator() from public;
grant execute on function public.is_moderator() to authenticated, anon, service_role;

drop policy if exists photos_read on public.photos;
create policy photos_read on public.photos for select
  using (auth.role() = 'authenticated' and (status = 'approved' or user_id = auth.uid() or public.is_moderator()));

drop policy if exists photos_update on public.photos;
create policy photos_update on public.photos for update
  using (public.is_moderator()) with check (public.is_moderator());

drop policy if exists photos_delete on public.photos;
create policy photos_delete on public.photos for delete
  using (user_id = auth.uid() or public.is_moderator());
