CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE has_admin boolean;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;

  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') INTO has_admin;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN has_admin THEN 'client'::public.app_role ELSE 'admin'::public.app_role END)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$fn$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.current_barber_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;

INSERT INTO public.barbers (name, nickname, bio, active, sort_order) VALUES
  ('Rian', 'Rian', 'Especialista em cortes modernos, degradês e acabamento na navalha.', true, 1),
  ('Lemuel', 'Lemuel', 'Barba desenhada, sobrancelha e cortes clássicos com precisão.', true, 2);

INSERT INTO public.services (name, description, price_cents, duration_min, active, sort_order) VALUES
  ('Corte', 'Corte de cabelo completo com acabamento.', 3500, 40, true, 1),
  ('Sobrancelha', 'Design e limpeza de sobrancelha.', 1500, 15, true, 2),
  ('Corte + Sobrancelha', 'Corte completo com design de sobrancelha.', 4500, 50, true, 3),
  ('Barba', 'Barba modelada com toalha quente.', 2000, 30, true, 4),
  ('Corte + Barba', 'Combo completo de corte e barba.', 5000, 70, true, 5),
  ('Corte + Sobrancelha + Cavanhaque', 'Pacote completo de acabamento.', 5000, 70, true, 6);

INSERT INTO public.business_hours (weekday, open_time, close_time, closed) VALUES
  (0, '09:00', '18:00', true),
  (1, '09:00', '18:00', true),
  (2, '09:00', '18:00', false),
  (3, '09:00', '18:00', false),
  (4, '09:00', '18:00', false),
  (5, '09:00', '18:00', false),
  (6, '09:00', '18:00', false);

INSERT INTO public.settings (id, shop_name, address, maps_url, phone, whatsapp, instagram, whatsapp_template, slot_interval_min) VALUES
  (1, 'Studio Blackout',
   'R. Concelho das Sociedades, 475 - Jd. Yeda',
   'https://www.google.com/maps?q=R.+Concelho+das+Sociedades,+475+-+Jd.+Yeda&output=embed',
   '+55 19 92003-7087',
   '5519920037087',
   'https://www.instagram.com/studio_._blackout/',
   'Olá! Fiz um agendamento no Studio Blackout.',
   30);

INSERT INTO public.products (name, category, quantity, min_quantity, cost_cents, price_cents, active) VALUES
  ('Pomada Modeladora', 'Cabelo', 12, 4, 1800, 3500, true),
  ('Gel Fixador', 'Cabelo', 8, 3, 1200, 2500, true),
  ('Shampoo Anticaspa', 'Cabelo', 6, 2, 2200, 4000, true),
  ('Água Mineral 500ml', 'Bebidas', 24, 10, 150, 400, true),
  ('Coca-Cola Lata', 'Bebidas', 18, 8, 300, 700, true),
  ('Corona Long Neck', 'Bebidas', 10, 6, 700, 1500, true);