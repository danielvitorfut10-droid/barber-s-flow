-- Auto-assign admin role to admin emails on signup
CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF LOWER(NEW.email) IN ('rianbueno2018@gmail.com', 'barbosalemueltrabalho@gmail.com') THEN
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

-- Apply immediately for existing user if already signed up
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = 'barbosalemueltrabalho@gmail.com' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Link barber 'Lemuel' to this user_id if not already linked
    UPDATE public.barbers
    SET user_id = v_user_id
    WHERE (LOWER(name) LIKE '%lemuel%' OR LOWER(name) LIKE '%lemoel%')
      AND user_id IS NULL;
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = 'rianbueno2018@gmail.com' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Link barber 'Rian' to this user_id if not already linked
    UPDATE public.barbers
    SET user_id = v_user_id
    WHERE LOWER(name) LIKE '%rian%'
      AND user_id IS NULL;
  END IF;
END;
$$;
