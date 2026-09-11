-- Same duplicate-SELECT-policy issue as before, on tables that already had a separate
-- SELECT policy plus a FOR ALL policy. Splitting FOR ALL into INSERT/UPDATE/DELETE only.
DROP POLICY contracts_write ON public.contracts;
CREATE POLICY contracts_insert ON public.contracts FOR INSERT WITH CHECK (fn_is_super_master() OR (fp_tenant_id = fn_current_user_tenant()));
CREATE POLICY contracts_update ON public.contracts FOR UPDATE USING (fn_is_super_master() OR (fp_tenant_id = fn_current_user_tenant())) WITH CHECK (fn_is_super_master() OR (fp_tenant_id = fn_current_user_tenant()));
CREATE POLICY contracts_delete ON public.contracts FOR DELETE USING (fn_is_super_master() OR (fp_tenant_id = fn_current_user_tenant()));

DROP POLICY user_roles_write ON public.user_roles;
CREATE POLICY user_roles_insert ON public.user_roles FOR INSERT WITH CHECK (fn_is_super_master() OR (tenant_id = fn_current_user_tenant()));
CREATE POLICY user_roles_update ON public.user_roles FOR UPDATE USING (fn_is_super_master() OR ((tenant_id = fn_current_user_tenant()) AND fn_has_permission('platform','manage_roles'))) WITH CHECK (fn_is_super_master() OR (tenant_id = fn_current_user_tenant()));
CREATE POLICY user_roles_delete ON public.user_roles FOR DELETE USING (fn_is_super_master() OR ((tenant_id = fn_current_user_tenant()) AND fn_has_permission('platform','manage_roles')));

DROP POLICY users_modify ON public.users;
CREATE POLICY users_insert ON public.users FOR INSERT WITH CHECK (fn_is_super_master() OR (tenant_id = fn_current_user_tenant()));
CREATE POLICY users_update ON public.users FOR UPDATE USING (fn_is_super_master() OR ((tenant_id = fn_current_user_tenant()) AND fn_has_permission('platform','manage_users'))) WITH CHECK (fn_is_super_master() OR (tenant_id = fn_current_user_tenant()));
CREATE POLICY users_delete ON public.users FOR DELETE USING (fn_is_super_master() OR ((tenant_id = fn_current_user_tenant()) AND fn_has_permission('platform','manage_users')));
;
