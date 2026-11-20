-- Migration: Fix Corte + Barba duration to 1 hour (60 min) and block all slots for barber Lemuel

-- 1. Atualizar a duração dos serviços de Corte + Barba e combos para 60 minutos (1 hora)
UPDATE public.services
SET duration_min = 60
WHERE LOWER(name) LIKE '%corte%barba%';

-- 2. Atualizar agendamentos existentes que ficaram com mais de 60 minutos de duração para 60 minutos
UPDATE public.appointments a
SET ends_at = a.starts_at + interval '60 minutes'
FROM public.services s
WHERE a.service_id = s.id
  AND LOWER(s.name) LIKE '%corte%barba%'
  AND a.ends_at > a.starts_at + interval '60 minutes';

-- 3. Atualizar a função get_public_busy para bloquear todos os horários de Lemuel
CREATE OR REPLACE FUNCTION public.get_public_busy(_barber_id uuid, _start timestamptz, _end timestamptz)
RETURNS TABLE(starts_at timestamptz, ends_at timestamptz, kind text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  b_name text;
BEGIN
  SELECT name INTO b_name FROM public.barbers WHERE id = _barber_id;
  IF LOWER(coalesce(b_name,'')) LIKE '%lemuel%' OR LOWER(coalesce(b_name,'')) LIKE '%lemoel%' THEN
    -- Barbeiro Lemuel com todos os horários bloqueados
    RETURN QUERY SELECT _start, _end, 'busy'::text;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT a.starts_at, a.ends_at, 'busy'::text FROM public.appointments a
   WHERE a.barber_id = _barber_id AND a.status <> 'cancelado'
     AND a.starts_at < _end AND a.ends_at > _start
  UNION ALL
  SELECT b.starts_at, b.ends_at,
         CASE WHEN b.reason = 'desbloqueado' THEN 'unblocked' ELSE 'busy' END
    FROM public.blocked_slots b
   WHERE b.barber_id = _barber_id AND b.starts_at < _end AND b.ends_at > _start;
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_busy(uuid, timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_busy(uuid, timestamptz, timestamptz) TO anon, authenticated, service_role;

-- 4. Atualizar create_public_booking para impedir agendamentos para Lemuel e fixar duração em 60 min
CREATE OR REPLACE FUNCTION public.create_public_booking(_barber_id uuid, _service_id uuid, _starts_at timestamp with time zone, _name text, _phone text, _notes text, _label text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  s record; b record; _ends timestamptz; _id uuid; _dur integer;
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

  -- Bloqueio exclusivo para o barbeiro Lemuel
  IF LOWER(b.name) LIKE '%lemuel%' OR LOWER(b.name) LIKE '%lemoel%' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'O barbeiro Lemuel está com a agenda bloqueada no momento.');
  END IF;

  IF _starts_at IS NULL OR _starts_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Escolha um horário futuro.');
  END IF;

  -- Garantir que corte + barba ou combo tenha duração de exatamente 60 minutos (1 hora)
  _dur := s.duration_min;
  IF LOWER(s.name) LIKE '%corte%' AND LOWER(s.name) LIKE '%barba%' THEN
    _dur := 60;
  END IF;
  _ends := _starts_at + make_interval(mins => _dur);

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

REVOKE ALL ON FUNCTION public.create_public_booking(uuid, uuid, timestamptz, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_public_booking(uuid, uuid, timestamptz, text, text, text, text) TO anon, authenticated, service_role;
