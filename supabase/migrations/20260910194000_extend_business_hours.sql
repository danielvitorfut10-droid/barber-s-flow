-- Extend shop closing time to 23:59 (allowing slots up to 00:00) for all open days
UPDATE public.business_hours
SET open_time = '09:00', close_time = '23:59'
WHERE open_time IS NOT NULL;
