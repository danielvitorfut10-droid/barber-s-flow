INSERT INTO public.services (name, description, price_cents, duration_min, active, sort_order)
SELECT 'Corte + barba + sobrancelha', 'Combo completo de corte, barba e sobrancelha.', 7000, 75, true, 6
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE lower(name) LIKE '%corte%barba%sobrancelha%');