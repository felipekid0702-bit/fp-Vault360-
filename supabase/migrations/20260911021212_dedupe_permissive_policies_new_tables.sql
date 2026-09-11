-- The SELECT policy + a "FOR ALL" write policy on the same table both apply to SELECT,
-- so Postgres has to evaluate two permissive policies per read. Split the write policies
-- into INSERT/UPDATE/DELETE only so each action hits exactly one policy.
DROP POLICY permissions_write ON public.permissions;
CREATE POLICY permissions_insert ON public.permissions FOR INSERT TO authenticated WITH CHECK (fn_is_super_master());
CREATE POLICY permissions_update ON public.permissions FOR UPDATE TO authenticated USING (fn_is_super_master()) WITH CHECK (fn_is_super_master());
CREATE POLICY permissions_delete ON public.permissions FOR DELETE TO authenticated USING (fn_is_super_master());

DROP POLICY role_permissions_write ON public.role_permissions;
CREATE POLICY role_permissions_insert ON public.role_permissions FOR INSERT TO authenticated WITH CHECK (fn_is_super_master() OR fn_has_permission('platform', 'manage_roles'));
CREATE POLICY role_permissions_update ON public.role_permissions FOR UPDATE TO authenticated USING (fn_is_super_master() OR fn_has_permission('platform', 'manage_roles')) WITH CHECK (fn_is_super_master() OR fn_has_permission('platform', 'manage_roles'));
CREATE POLICY role_permissions_delete ON public.role_permissions FOR DELETE TO authenticated USING (fn_is_super_master() OR fn_has_permission('platform', 'manage_roles'));

DROP POLICY platform_settings_write ON public.platform_settings;
CREATE POLICY platform_settings_update ON public.platform_settings FOR UPDATE TO authenticated USING (fn_is_super_master()) WITH CHECK (fn_is_super_master());

DROP POLICY version_history_write ON public.version_history;
CREATE POLICY version_history_insert ON public.version_history FOR INSERT TO authenticated WITH CHECK (fn_is_super_master());
;
