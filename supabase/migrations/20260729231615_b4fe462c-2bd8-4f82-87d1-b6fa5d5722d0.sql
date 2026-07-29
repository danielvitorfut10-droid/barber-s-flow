CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id uuid NOT NULL REFERENCES public.barbers(id) ON DELETE RESTRICT,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  user_id uuid,
  client_name text NOT NULL,
  client_phone text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'agendado',
  price_cents int NOT NULL DEFAULT 0,
  payment_method public.payment_method,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT appointments_time_valid CHECK (ends_at > starts_at),
  CONSTRAINT appointments_no_overlap EXCLUDE USING gist (
    barber_id WITH =, tstzrange(starts_at, ends_at) WITH &&
  ) WHERE (status <> 'cancelado')
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER appointments_updated BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX appointments_barber_start_idx ON public.appointments (barber_id, starts_at);

CREATE POLICY "appointments_select_staff" ON public.appointments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR barber_id = public.current_barber_id() OR user_id = auth.uid());
CREATE POLICY "appointments_admin_all" ON public.appointments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "appointments_barber_update" ON public.appointments FOR UPDATE TO authenticated
  USING (barber_id = public.current_barber_id()) WITH CHECK (barber_id = public.current_barber_id());
CREATE POLICY "appointments_barber_insert" ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (barber_id = public.current_barber_id());

CREATE TABLE public.blocked_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id uuid NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blocked_time_valid CHECK (ends_at > starts_at)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blocked_slots TO authenticated;
GRANT ALL ON public.blocked_slots TO service_role;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocks_admin_all" ON public.blocked_slots FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "blocks_barber_all" ON public.blocked_slots FOR ALL TO authenticated
  USING (barber_id = public.current_barber_id()) WITH CHECK (barber_id = public.current_barber_id());

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Geral',
  quantity int NOT NULL DEFAULT 0,
  min_quantity int NOT NULL DEFAULT 0,
  cost_cents int NOT NULL DEFAULT 0,
  price_cents int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "products_staff_read" ON public.products FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.current_barber_id() IS NOT NULL);
CREATE POLICY "products_admin_write" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  type public.stock_movement_type NOT NULL,
  quantity int NOT NULL CHECK (quantity > 0),
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stock_staff_read" ON public.stock_movements FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.current_barber_id() IS NOT NULL);
CREATE POLICY "stock_staff_insert" ON public.stock_movements FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.current_barber_id() IS NOT NULL);

CREATE OR REPLACE FUNCTION public.apply_stock_movement() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  IF NEW.type = 'entrada' THEN
    UPDATE public.products SET quantity = quantity + NEW.quantity WHERE id = NEW.product_id;
  ELSE
    UPDATE public.products SET quantity = GREATEST(quantity - NEW.quantity, 0) WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$fn$;
REVOKE EXECUTE ON FUNCTION public.apply_stock_movement() FROM anon, authenticated;

CREATE TRIGGER stock_apply AFTER INSERT ON public.stock_movements
FOR EACH ROW EXECUTE FUNCTION public.apply_stock_movement();

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id uuid REFERENCES public.barbers(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_read_staff" ON public.notifications FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR barber_id = public.current_barber_id());
CREATE POLICY "notif_update_staff" ON public.notifications FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR barber_id = public.current_barber_id())
  WITH CHECK (public.has_role(auth.uid(),'admin') OR barber_id = public.current_barber_id());

ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;