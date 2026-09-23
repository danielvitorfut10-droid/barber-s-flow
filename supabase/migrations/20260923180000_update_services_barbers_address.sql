-- Update barbers bios according to user request
UPDATE public.barbers
SET bio = 'Especialista em cortes modernos, tradicionais, degrades, acabamento em navalha, barba desenhada e cortes infantis'
WHERE LOWER(name) = 'rian';

UPDATE public.barbers
SET bio = 'Especialista em cortes modernos, tradicionais, degrades, acabamento em navalha, barba desenhada, desenho e cortes infantis.'
WHERE LOWER(name) = 'lemuel';

-- Update service prices & description
UPDATE public.services
SET price_cents = 3000, description = 'barba com acabamento em navalha'
WHERE name = 'Barba';

UPDATE public.services
SET price_cents = 6000
WHERE name = 'Corte + Barba';

-- Deactivate Corte + Sobrancelha + Cavanhaque
UPDATE public.services
SET active = false
WHERE LOWER(name) LIKE '%cavanhaque%';

-- Add new service Corte + barba + sobrancelha (R$ 70,00)
INSERT INTO public.services (name, description, price_cents, duration_min, active, sort_order)
SELECT 'Corte + barba + sobrancelha', 'Combo completo de corte, barba e sobrancelha.', 7000, 75, true, 6
WHERE NOT EXISTS (
    SELECT 1 FROM public.services WHERE LOWER(name) = 'corte + barba + sobrancelha'
);

-- Update settings address
UPDATE public.settings
SET address = 'Rua conselho das sociedades, 475 - Jd yeda',
    maps_url = 'https://maps.google.com/maps?q=Rua+conselho+das+sociedades,+475+-+Jd+yeda&t=&z=15&ie=UTF8&iwloc=&output=embed'
WHERE id = 1;
