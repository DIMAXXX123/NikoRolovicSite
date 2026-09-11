-- ============================================================
-- profiles: close anon read + self role escalation
-- ============================================================
-- 1. "Public profiles readable" (FOR SELECT USING (true), PUBLIC role) let
--    anyone with the anon key dump every pupil's name, class and e-mail.
--    profiles_read already allows the same read for signed-in users.
DROP POLICY IF EXISTS "Public profiles readable" ON public.profiles;

-- 2. "Users update own profile" had a USING clause but no WITH CHECK, so a
--    student could PATCH their own row and set role = 'admin'/'creator'.
--    profiles_update_safe covers the same case and pins the role column.
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;

-- 3. Duplicate of profiles_insert, same predicate — drop the older copy.
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
