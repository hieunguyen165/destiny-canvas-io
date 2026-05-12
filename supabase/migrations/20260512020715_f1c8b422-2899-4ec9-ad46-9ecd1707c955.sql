
-- 1) Điểm cho thành viên
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points integer NOT NULL DEFAULT 0;

-- 2) Giao dịch điểm
CREATE TABLE IF NOT EXISTS public.points_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  reason text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "view own tx or admin" ON public.points_transactions;
CREATE POLICY "view own tx or admin" ON public.points_transactions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admin insert tx" ON public.points_transactions;
CREATE POLICY "admin insert tx" ON public.points_transactions
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- 3) Lịch sử lá số: cho phép khách (user_id NULL)
ALTER TABLE public.la_so_history ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.la_so_history ADD COLUMN IF NOT EXISTS guest_name text;

DROP POLICY IF EXISTS "insert own history" ON public.la_so_history;
CREATE POLICY "insert own or guest history" ON public.la_so_history
  FOR INSERT TO authenticated, anon
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR (user_id IS NULL)
  );

DROP POLICY IF EXISTS "view own history or admin" ON public.la_so_history;
CREATE POLICY "view own history or admin" ON public.la_so_history
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- 4) Hàm cộng điểm (admin)
CREATE OR REPLACE FUNCTION public.admin_add_points(_user_id uuid, _amount integer, _reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.profiles SET points = points + _amount WHERE id = _user_id;
  INSERT INTO public.points_transactions(user_id, amount, reason, created_by)
  VALUES (_user_id, _amount, COALESCE(_reason,'Cộng điểm'), auth.uid());
END;
$$;

-- 5) Hàm trừ điểm (atomic) — dùng cho luận chi tiết
CREATE OR REPLACE FUNCTION public.spend_points(_amount integer, _reason text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  remain integer;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  UPDATE public.profiles SET points = points - _amount
   WHERE id = uid AND points >= _amount
   RETURNING points INTO remain;
  IF remain IS NULL THEN
    RAISE EXCEPTION 'insufficient_points';
  END IF;
  INSERT INTO public.points_transactions(user_id, amount, reason, created_by)
  VALUES (uid, -_amount, COALESCE(_reason,'Sử dụng điểm'), uid);
  RETURN remain;
END;
$$;
