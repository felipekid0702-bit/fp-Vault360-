-- Postgres grants EXECUTE to PUBLIC automatically on CREATE FUNCTION; revoking from
-- anon/authenticated alone doesn't remove that, since anon/authenticated inherit PUBLIC.
-- Explicitly revoke from PUBLIC too, then re-grant only to the roles that should have it.
REVOKE EXECUTE ON FUNCTION public.provision_new_tenant(text, text, text, public.operation_mode, uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.transfer_super_master(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_platform_identity(text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.bump_version(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_generate_expiration_notifications() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_current_user_tenant() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_is_super_master() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_has_permission(text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_audit(text, text, uuid, jsonb) FROM PUBLIC;

-- Re-grant to the exact roles that legitimately need to call each one.
GRANT EXECUTE ON FUNCTION public.provision_new_tenant(text, text, text, public.operation_mode, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_super_master(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_platform_identity(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_current_user_tenant() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_is_super_master() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_has_permission(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_audit(text, text, uuid, jsonb) TO authenticated;
-- bump_version and fn_generate_expiration_notifications are deploy/cron-only utilities:
-- no authenticated grant, only postgres/service_role (used by pg_cron and CI) keep access.
;
