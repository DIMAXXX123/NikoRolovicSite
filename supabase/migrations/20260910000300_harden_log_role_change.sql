-- ============================================================
-- log_role_change(): trigger-only, pinned search_path
-- ============================================================
-- The function backs the profiles_role_audit trigger on public.profiles,
-- but it was also exposed as /rest/v1/rpc/log_role_change to anon and
-- authenticated while running SECURITY DEFINER, and its search_path was
-- mutable. Triggers do not need the EXECUTE privilege, so revoking it
-- keeps the audit trail working while closing the RPC.
-- SECURITY DEFINER is kept on purpose: audit_log has no INSERT policy.

CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO audit_log (user_id, action, table_name, record_id, details)
    VALUES (
      auth.uid(),
      'role_change',
      'profiles',
      NEW.id::text,
      jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role)
    );
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.log_role_change() FROM PUBLIC, anon, authenticated;
