-- ============================================================
-- verified_students: service-role only
-- ============================================================
-- Before this migration the table carried
--   CREATE POLICY "Service role full access" ON verified_students FOR ALL USING (true)
-- granted to the PUBLIC role. Because FOR ALL falls back to USING for the
-- insert check, anyone holding the (public) anon key could read the full
-- name + e-mail of every student and insert/update/delete rows.
-- A second policy (verified_read_unused_auth) additionally exposed every
-- not-yet-registered student to any signed-in user.
--
-- The list is only ever consulted from server code that uses the
-- service_role key (src/app/api/register, /api/complete-profile,
-- /api/admin/students, /api/kick-student, /api/telegram/webhook).
-- service_role bypasses RLS, so dropping every policy leaves the table
-- reachable from the server only.

DROP POLICY IF EXISTS "Service role full access" ON public.verified_students;
DROP POLICY IF EXISTS verified_read_unused_auth      ON public.verified_students;
DROP POLICY IF EXISTS verified_students_insert       ON public.verified_students;
DROP POLICY IF EXISTS verified_students_update       ON public.verified_students;
DROP POLICY IF EXISTS verified_students_delete       ON public.verified_students;

ALTER TABLE public.verified_students ENABLE ROW LEVEL SECURITY;

-- No policies at all => no row is visible or writable through the anon /
-- authenticated API roles, on top of RLS the table grants are removed too.
REVOKE ALL ON TABLE public.verified_students FROM anon, authenticated;

COMMENT ON TABLE public.verified_students IS
  'Roster of students allowed to register. Contains PII — service_role only, no RLS policies on purpose.';
