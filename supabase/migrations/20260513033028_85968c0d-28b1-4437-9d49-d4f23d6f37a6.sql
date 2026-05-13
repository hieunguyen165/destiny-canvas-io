
-- Cho phép khách vãng lai (chưa đăng nhập) lưu lịch sử lá số với user_id NULL
DROP POLICY IF EXISTS "insert own history" ON public.la_so_history;

CREATE POLICY "insert history (member or guest)"
ON public.la_so_history
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR (auth.uid() IS NULL AND user_id IS NULL)
);
