-- 1) Tables that already have policies defined but RLS was never turned on
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_scopes ENABLE ROW LEVEL SECURITY;

-- 2) Reference / global tables with no policies yet
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.version_history ENABLE ROW LEVEL SECURITY;

-- permissions: reference catalog, any authenticated user can read it (needed to render role/permission UIs),
-- only the Super Master can change what permissions exist.
CREATE POLICY permissions_select ON public.permissions
  FOR SELECT TO authenticated
  USING (true);
CREATE POLICY permissions_write ON public.permissions
  FOR ALL TO authenticated
  USING (fn_is_super_master())
  WITH CHECK (fn_is_super_master());

-- role_permissions: any authenticated user can read (to know what a role can do),
-- only Super Master (or someone with platform:manage_roles) can write.
CREATE POLICY role_permissions_select ON public.role_permissions
  FOR SELECT TO authenticated
  USING (true);
CREATE POLICY role_permissions_write ON public.role_permissions
  FOR ALL TO authenticated
  USING (fn_is_super_master() OR fn_has_permission('platform', 'manage_roles'))
  WITH CHECK (fn_is_super_master() OR fn_has_permission('platform', 'manage_roles'));

-- platform_settings: single global row with product/company info, safe for any authenticated
-- user to read (used to render branding), only Super Master can change it.
CREATE POLICY platform_settings_select ON public.platform_settings
  FOR SELECT TO authenticated
  USING (true);
CREATE POLICY platform_settings_write ON public.platform_settings
  FOR ALL TO authenticated
  USING (fn_is_super_master())
  WITH CHECK (fn_is_super_master());

-- version_history: readable by any authenticated user (changelog), only Super Master writes it.
CREATE POLICY version_history_select ON public.version_history
  FOR SELECT TO authenticated
  USING (true);
CREATE POLICY version_history_write ON public.version_history
  FOR ALL TO authenticated
  USING (fn_is_super_master())
  WITH CHECK (fn_is_super_master());
;
