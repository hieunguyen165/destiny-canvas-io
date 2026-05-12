
-- Fix self-insert privilege escalation on points_transactions: only admins may insert
DROP POLICY IF EXISTS "admin insert tx" ON public.points_transactions;
CREATE POLICY "admin insert tx" ON public.points_transactions
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Restrict EXECUTE on internal SECURITY DEFINER helper.
-- has_role() is only called from RLS policies and other definer functions (which run as the owner),
-- so end users do not need direct EXECUTE access.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
