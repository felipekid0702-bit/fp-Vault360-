DROP POLICY users_protect_super_master ON public.users;
CREATE POLICY users_protect_super_master ON public.users
  FOR UPDATE
  USING ((NOT is_super_master) OR ((select auth.uid()) = id));
;
