-- Pin search_path on every SECURITY DEFINER / trigger function so a caller can't shadow
-- "public" with a schema earlier in their session search_path and hijack table references.
ALTER FUNCTION public.fn_current_user_tenant() SET search_path = public, extensions;
ALTER FUNCTION public.fn_is_super_master() SET search_path = public, extensions;
ALTER FUNCTION public.fn_has_permission(text, text) SET search_path = public, extensions;
ALTER FUNCTION public.provision_new_tenant(text, text, text, public.operation_mode, uuid, text, text) SET search_path = public, extensions;
ALTER FUNCTION public.transfer_super_master(uuid) SET search_path = public, extensions;
ALTER FUNCTION public.bump_version(text) SET search_path = public, extensions;
ALTER FUNCTION public.update_platform_identity(text, text) SET search_path = public, extensions;
ALTER FUNCTION public.log_audit(text, text, uuid, jsonb) SET search_path = public, extensions;
ALTER FUNCTION public.fn_apply_rope_cut() SET search_path = public, extensions;
ALTER FUNCTION public.fn_recalc_kit_status(uuid) SET search_path = public, extensions;
ALTER FUNCTION public.fn_audit_log_immutable() SET search_path = public, extensions;
ALTER FUNCTION public.fn_set_updated_at() SET search_path = public, extensions;
ALTER FUNCTION public.fn_apply_inspection_result() SET search_path = public, extensions;
ALTER FUNCTION public.fn_trigger_kit_status() SET search_path = public, extensions;
ALTER FUNCTION public.fn_set_user_certification_status() SET search_path = public, extensions;
;
