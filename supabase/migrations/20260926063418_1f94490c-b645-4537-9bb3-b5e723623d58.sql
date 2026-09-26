ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_no_overlap;

CREATE OR REPLACE FUNCTION public.create_public_booking(_barber_id uuid, _service_id uuid, _starts_at timestamp with time zone, _name text, _phone text, _notes text, _label text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  s record; b record; _ends timestamptz; _id uuid;
BEGIN
  _name := btrim(coalesce(_name,'')); _phone := btrim(coalesce(_phone,''));
  _notes := nullif(btrim(coalesce(_notes,'')),'');
  IF length(_name) < 2 OR length(_name) > 80 OR length(_phone) < 10 OR length(_phone) > 20
     OR (_notes IS NOT NULL AND length(_notes) > 280) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Dados inválidos.');
  END IF;
  SELECT id, name, price_cents, duration_min, active INTO s FROM services WHERE id = _service_id;
  SELECT id, name, active INTO b FROM barbers WHERE id = _barber_id;
  IF s.id IS NULL OR b.id IS NULL OR NOT s.active OR NOT b.active THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Serviço ou barbeiro indisponível.');
  END IF;
  IF _starts_at IS NULL OR _starts_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Escolha um horário futuro.');
  END IF;
  _ends := _starts_at + make_interval(mins => s.duration_min);
  -- Bloqueia apenas o horário exato já agendado (mesmo início)
  IF EXISTS (SELECT 1 FROM appointments WHERE barber_id = b.id AND status <> 'cancelado'
             AND starts_at = _starts_at) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Esse horário acabou de ser reservado por outro cliente. Por favor, escolha outro horário disponível.');
  END IF;
  IF EXISTS (SELECT 1 FROM blocked_slots WHERE barber_id = b.id AND reason IS DISTINCT FROM 'desbloqueado'
             AND starts_at < _ends AND ends_at > _starts_at) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Esse horário está indisponível ou foi bloqueado pelo barbeiro. Escolha outro horário.');
  END IF;
  INSERT INTO appointments (barber_id, service_id, client_name, client_phone, starts_at, ends_at, price_cents, notes)
  VALUES (b.id, s.id, _name, _phone, _starts_at, _ends, s.price_cents, _notes) RETURNING id INTO _id;
  INSERT INTO notifications (barber_id, type, title, body)
  VALUES (b.id, 'novo_agendamento', 'Novo agendamento', _name || ' • ' || s.name || ' • ' || left(coalesce(_label,''), 40));
  RETURN jsonb_build_object('ok', true, 'id', _id, 'barberName', b.name, 'serviceName', s.name, 'priceCents', s.price_cents);
END $function$;