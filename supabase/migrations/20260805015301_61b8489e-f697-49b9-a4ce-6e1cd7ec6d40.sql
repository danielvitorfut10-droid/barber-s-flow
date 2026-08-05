-- 1. Trigger-only functions: no direct callers at all
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_stock_movement() FROM PUBLIC, anon, authenticated;

-- 2. RLS helpers: harden then restrict to authenticated only (required by policies)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      -- callers may only ask about themselves; service_role is exempt
      AND (_user_id = auth.uid() OR current_setting('role', true) = 'service_role')
  );
$function$;

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.current_barber_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_barber_id() TO authenticated, service_role;
