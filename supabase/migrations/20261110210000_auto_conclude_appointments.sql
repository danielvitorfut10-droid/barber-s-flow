-- Ajuste de status: agendamentos futuros devem permanecer como 'agendado'
-- e ser concluidos apenas apos a data/horario do atendimento, desde que nao cancelados pelo admin.

-- 1. Corrige agendamentos futuros marcados como 'concluido'
UPDATE public.appointments
SET status = 'agendado'
WHERE starts_at > now()
  AND status = 'concluido';

-- 2. Conclui agendamentos cujo horario de termino ja passou e nao foram cancelados
UPDATE public.appointments
SET status = 'concluido'
WHERE ends_at <= now()
  AND status IN ('agendado', 'confirmado');
