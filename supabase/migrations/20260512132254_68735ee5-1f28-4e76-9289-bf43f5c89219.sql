-- 1) Tighten app_settings: hide secret 'gemini_api_key' row from non-admins
DROP POLICY IF EXISTS "anyone can read settings" ON public.app_settings;

CREATE POLICY "public read non-sensitive settings"
ON public.app_settings FOR SELECT
TO anon, authenticated
USING (key <> 'gemini_api_key');

CREATE POLICY "admin read sensitive settings"
ON public.app_settings FOR SELECT
TO authenticated
USING (key = 'gemini_api_key' AND has_role(auth.uid(), 'admin'));

-- 2) Stop broadcasting app_settings via Realtime (key would leak through Realtime channel)
DO $$
BEGIN
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.app_settings';
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;
END $$;

-- 3) Require authentication to insert into la_so_history (no more anonymous guest writes)
DROP POLICY IF EXISTS "insert own or guest history" ON public.la_so_history;

CREATE POLICY "insert own history"
ON public.la_so_history FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 4) Cleanup: delete any orphan guest rows already retained (sensitive PII)
DELETE FROM public.la_so_history WHERE user_id IS NULL;