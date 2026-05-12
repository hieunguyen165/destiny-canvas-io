-- 1) Tặng 10 điểm cho thành viên mới + ghi giao dịch
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, points)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email), 10);

  INSERT INTO public.points_transactions(user_id, amount, reason, created_by)
  VALUES (NEW.id, 10, 'Quà đăng ký thành viên (+10 điểm)', NEW.id);

  IF lower(NEW.email) = 'xuanhieufi@gmail.com' THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

-- 2) Bảng yêu cầu nạp điểm
CREATE TABLE IF NOT EXISTS public.topup_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount_points integer NOT NULL CHECK (amount_points > 0),
  amount_vnd integer NOT NULL CHECK (amount_vnd > 0),
  note text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_by uuid,
  approved_at timestamptz
);
ALTER TABLE public.topup_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user insert own topup" ON public.topup_requests;
CREATE POLICY "user insert own topup" ON public.topup_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user view own topup or admin" ON public.topup_requests;
CREATE POLICY "user view own topup or admin" ON public.topup_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "admin update topup" ON public.topup_requests;
CREATE POLICY "admin update topup" ON public.topup_requests FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin'));

-- 3) RPC duyệt / từ chối nạp điểm
CREATE OR REPLACE FUNCTION public.approve_topup(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE r RECORD;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO r FROM public.topup_requests WHERE id = _id AND status='pending' FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'not_found_or_done'; END IF;
  UPDATE public.profiles SET points = points + r.amount_points WHERE id = r.user_id;
  INSERT INTO public.points_transactions(user_id, amount, reason, created_by)
    VALUES (r.user_id, r.amount_points, 'Nạp điểm: '||r.amount_vnd||'đ', auth.uid());
  UPDATE public.topup_requests SET status='approved', approved_by=auth.uid(), approved_at=now() WHERE id=_id;
END; $$;

CREATE OR REPLACE FUNCTION public.reject_topup(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.topup_requests SET status='rejected', approved_by=auth.uid(), approved_at=now() WHERE id=_id AND status='pending';
END; $$;

REVOKE EXECUTE ON FUNCTION public.approve_topup(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reject_topup(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_topup(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_topup(uuid) TO authenticated;