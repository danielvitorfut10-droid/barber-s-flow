CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE public.app_role AS ENUM ('admin','barber','client');
CREATE TYPE public.appointment_status AS ENUM ('agendado','confirmado','concluido','cancelado','nao_compareceu');
CREATE TYPE public.payment_method AS ENUM ('dinheiro','pix','debito','credito');
CREATE TYPE public.stock_movement_type AS ENUM ('entrada','saida');

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $fn$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$fn$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$fn$;

CREATE POLICY "profiles_select_own_or_admin" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "user_roles_select_own_or_admin" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.barbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  nickname text,
  bio text,
  photo_url text,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.barbers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.barbers TO authenticated;
GRANT ALL ON public.barbers TO service_role;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER barbers_updated BEFORE UPDATE ON public.barbers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.current_barber_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT id FROM public.barbers WHERE user_id = auth.uid() LIMIT 1;
$fn$;

CREATE POLICY "barbers_public_read" ON public.barbers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "barbers_admin_write" ON public.barbers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_cents int NOT NULL DEFAULT 0,
  duration_min int NOT NULL DEFAULT 30,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER services_updated BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "services_public_read" ON public.services FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "services_admin_write" ON public.services FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.business_hours (
  weekday int PRIMARY KEY CHECK (weekday BETWEEN 0 AND 6),
  open_time time NOT NULL DEFAULT '09:00',
  close_time time NOT NULL DEFAULT '18:00',
  closed boolean NOT NULL DEFAULT false
);
GRANT SELECT ON public.business_hours TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_hours TO authenticated;
GRANT ALL ON public.business_hours TO service_role;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hours_public_read" ON public.business_hours FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "hours_admin_write" ON public.business_hours FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  shop_name text NOT NULL DEFAULT 'Studio Blackout',
  address text,
  maps_url text,
  phone text,
  whatsapp text,
  instagram text,
  logo_url text,
  whatsapp_template text,
  slot_interval_min int NOT NULL DEFAULT 30,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_public_read" ON public.settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings_admin_write" ON public.settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));