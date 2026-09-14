-- ============================================================
-- Direktor panel, phase A.1: roles, homeroom columns, is_school_staff()
-- ============================================================
-- profiles.role used to be checked only for NOT NULL. Extend it to the
-- closed list the panels rely on. One legacy row carried the value 'ivan'
-- (a typo, no code recognises it) - it is normalised to 'student' first so
-- the CHECK can be validated.
UPDATE public.profiles SET role = 'student'
 WHERE role NOT IN ('student','teacher','razredni','pedagog','direktor','moderator','admin','creator');

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('student','teacher','razredni','pedagog','direktor','moderator','admin','creator'));

-- Homeroom teacher ("razredni") -> the class/section they may see at
-- student level. NULL for everyone else.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS homeroom_class   INT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS homeroom_section INT;

-- True when the caller may read school-wide aggregates. SECURITY DEFINER so
-- it can read profiles.role regardless of the caller's own RLS; STABLE so the
-- planner evaluates it once per statement.
CREATE OR REPLACE FUNCTION public.is_school_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
     WHERE id = auth.uid()
       AND role IN ('direktor','admin','pedagog','razredni','teacher','creator')
  );
$$;

REVOKE ALL ON FUNCTION public.is_school_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_school_staff() TO authenticated, anon, service_role;

COMMENT ON FUNCTION public.is_school_staff() IS
  'True for direktor/admin/pedagog/razredni/teacher/creator - gate for analytics views and app_events SELECT.';
