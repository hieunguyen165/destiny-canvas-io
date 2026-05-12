
REVOKE ALL ON FUNCTION public.admin_add_points(uuid, integer, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.spend_points(integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_add_points(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.spend_points(integer, text) TO authenticated;
