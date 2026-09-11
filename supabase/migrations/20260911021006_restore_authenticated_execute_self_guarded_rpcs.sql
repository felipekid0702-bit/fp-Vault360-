-- These three functions already raise an exception internally unless fn_is_super_master()
-- is true, so they are safe to expose to any signed-in user; the previous revoke removed
-- them from `authenticated` too, which would have broken the Super Master's own UI.
-- (bump_version has NO internal guard and looks like a deploy-time utility, so it is
-- intentionally left restricted to service_role/postgres only.)
GRANT EXECUTE ON FUNCTION public.provision_new_tenant(text, text, text, public.operation_mode, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_super_master(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_platform_identity(text, text) TO authenticated;
;
