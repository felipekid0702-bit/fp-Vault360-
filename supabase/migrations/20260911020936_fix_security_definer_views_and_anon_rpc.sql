-- The 4 BI views were created as SECURITY DEFINER, which makes them ignore the caller's
-- RLS and leak every tenant's rows. Switching to SECURITY INVOKER makes them run with the
-- calling user's permissions, so the existing tenant-isolation policies on the underlying
-- tables (inspections, equipment, user_certifications, contracts) apply as expected.
ALTER VIEW public.v_equipment_summary SET (security_invoker = true);
ALTER VIEW public.v_compliance_rate SET (security_invoker = true);
ALTER VIEW public.v_training_status SET (security_invoker = true);
ALTER VIEW public.v_fp_operations_summary SET (security_invoker = true);

-- These RPCs should never be callable while logged out (anon), and provisioning /
-- super-master transfer should not be reachable by ordinary authenticated users either
-- (the functions themselves should enforce super-master, but defense in depth here too).
REVOKE EXECUTE ON FUNCTION public.provision_new_tenant(text, text, text, public.operation_mode, uuid, text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.transfer_super_master(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_platform_identity(text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_version(text) FROM anon, authenticated;

-- fn_current_user_tenant / fn_is_super_master / fn_has_permission / log_audit are meant to be
-- called by any signed-in user, just not by anon (logged-out) sessions.
REVOKE EXECUTE ON FUNCTION public.fn_current_user_tenant() FROM anon;
REVOKE EXECUTE ON FUNCTION public.fn_is_super_master() FROM anon;
REVOKE EXECUTE ON FUNCTION public.fn_has_permission(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_audit(text, text, uuid, jsonb) FROM anon;
;
