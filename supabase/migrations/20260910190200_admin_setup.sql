-- Auto-assign admin role to specific email on signup
CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- If admin email, insert admin role
  IF NEW.email = 'rianbueno2018@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_admin_user();

-- Also apply immediately for existing user if they already signed up
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'rianbueno2018@gmail.com' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;

-- Also grant admin barber panel access policies
-- Allow barbers to read their own appointments
CREATE POLICY IF NOT EXISTS "barbers_read_own_appointments" ON public.appointments
  FOR SELECT TO authenticated
  USING (barber_id = public.current_barber_id() OR public.has_role(auth.uid(), 'admin'));

-- Allow barbers to manage their own blocked_slots
CREATE POLICY IF NOT EXISTS "blocked_slots_barber_manage" ON public.blocked_slots
  FOR ALL TO authenticated
  USING (barber_id = public.current_barber_id() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (barber_id = public.current_barber_id() OR public.has_role(auth.uid(), 'admin'));

-- Allow authenticated to read blocked_slots (needed for availability check)
CREATE POLICY IF NOT EXISTS "blocked_slots_public_read" ON public.blocked_slots
  FOR SELECT TO anon, authenticated
  USING (true);
