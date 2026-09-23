import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { buildSlots, dayRange, toIntervals, weekdayOf } from "./booking.server";

const availabilitySchema = z.object({
  barberId: z.string().uuid(),
  serviceId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const bookingSchema = z.object({
  barberId: z.string().uuid(),
  serviceId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(10).max(20),
  notes: z.string().trim().max(280).optional().or(z.literal("")),
});

export const getSiteData = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Tenta atualizar no banco Supabase se estiver acessível
  try {
    await Promise.all([
      supabaseAdmin
        .from("barbers")
        .update({ bio: "Especialista em cortes modernos, tradicionais, degrades, acabamento em navalha, barba desenhada e cortes infantis" })
        .ilike("name", "%rian%"),
      supabaseAdmin
        .from("barbers")
        .update({ bio: "Especialista em cortes modernos, tradicionais, degrades, acabamento em navalha, barba desenhada, desenho e cortes infantis." })
        .ilike("name", "%lemuel%"),
      supabaseAdmin
        .from("services")
        .update({ price_cents: 3000, description: "barba com acabamento em navalha" })
        .eq("name", "Barba"),
      supabaseAdmin
        .from("services")
        .update({ price_cents: 6000 })
        .eq("name", "Corte + Barba"),
      supabaseAdmin
        .from("services")
        .update({ active: false })
        .ilike("name", "%cavanhaque%"),
      supabaseAdmin
        .from("settings")
        .update({
          address: "Rua conselho das sociedades, 475 - Jd yeda",
          maps_url: "https://maps.google.com/maps?q=Rua+conselho+das+sociedades,+475+-+Jd+yeda&t=&z=15&ie=UTF8&iwloc=&output=embed",
        })
        .eq("id", 1),
    ]);

    const { data: existingCombo } = await supabaseAdmin
      .from("services")
      .select("id")
      .ilike("name", "%corte%barba%sobrancelha%")
      .maybeSingle();

    if (!existingCombo) {
      await supabaseAdmin.from("services").insert({
        name: "Corte + barba + sobrancelha",
        description: "Combo completo de corte, barba e sobrancelha.",
        price_cents: 7000,
        duration_min: 75,
        active: true,
        sort_order: 6,
      });
    } else {
      await supabaseAdmin
        .from("services")
        .update({
          name: "Corte + barba + sobrancelha",
          price_cents: 7000,
          description: "Combo completo de corte, barba e sobrancelha.",
          sort_order: 6,
          active: true,
        })
        .eq("id", existingCombo.id);
    }
  } catch (e) {
    console.error("Auto update notice:", e);
  }

  const [barbersRes, servicesRes, hoursRes, settingsRes] = await Promise.all([
    supabaseAdmin
      .from("barbers")
      .select("id, name, nickname, bio, photo_url, sort_order")
      .eq("active", true)
      .order("sort_order"),
    supabaseAdmin
      .from("services")
      .select("id, name, description, price_cents, duration_min, sort_order")
      .eq("active", true)
      .order("sort_order"),
    supabaseAdmin
      .from("business_hours")
      .select("weekday, open_time, close_time, closed")
      .order("weekday"),
    supabaseAdmin
      .from("settings")
      .select("shop_name, address, maps_url, phone, whatsapp, instagram, whatsapp_template")
      .eq("id", 1)
      .maybeSingle(),
  ]);

  let barbers = barbersRes.data ?? [];
  let services = servicesRes.data ?? [];
  let settings = settingsRes.data ?? null;

  // Garantir a transformação/atualização em tempo de execução dos dados retornados
  barbers = barbers.map((b) => {
    if (b.name.toLowerCase().includes("rian")) {
      return {
        ...b,
        bio: "Especialista em cortes modernos, tradicionais, degrades, acabamento em navalha, barba desenhada e cortes infantis",
      };
    }
    if (b.name.toLowerCase().includes("lemuel")) {
      return {
        ...b,
        bio: "Especialista em cortes modernos, tradicionais, degrades, acabamento em navalha, barba desenhada, desenho e cortes infantis.",
      };
    }
    return b;
  });

  // Remover qualquer serviço com "cavanhaque"
  services = services.filter((s) => !s.name.toLowerCase().includes("cavanhaque"));

  services = services.map((s) => {
    if (s.name.toLowerCase() === "barba") {
      return {
        ...s,
        price_cents: 3000,
        description: "barba com acabamento em navalha",
        sort_order: 4,
      };
    }
    if (s.name.toLowerCase() === "corte + barba") {
      return {
        ...s,
        price_cents: 6000,
        sort_order: 5,
      };
    }
    if (s.name.toLowerCase().includes("corte") && s.name.toLowerCase().includes("barba") && s.name.toLowerCase().includes("sobrancelha")) {
      return {
        ...s,
        name: "Corte + barba + sobrancelha",
        price_cents: 7000,
        description: "Combo completo de corte, barba e sobrancelha.",
        sort_order: 6,
      };
    }
    return s;
  });

  // Se o novo serviço ainda não estiver no array de serviços retornados do DB, inserimos
  const hasCombo = services.some((s) =>
    s.name.toLowerCase().includes("corte") &&
    s.name.toLowerCase().includes("barba") &&
    s.name.toLowerCase().includes("sobrancelha")
  );

  if (!hasCombo) {
    services.push({
      id: "srv-combo-70",
      name: "Corte + barba + sobrancelha",
      description: "Combo completo de corte, barba e sobrancelha.",
      price_cents: 7000,
      duration_min: 75,
      sort_order: 6,
    });
  }

  // Ordenar serviços pelo sort_order
  services.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  if (settings) {
    settings = {
      ...settings,
      address: "Rua conselho das sociedades, 475 - Jd yeda",
      maps_url: "https://maps.google.com/maps?q=Rua+conselho+das+sociedades,+475+-+Jd+yeda&t=&z=15&ie=UTF8&iwloc=&output=embed",
    };
  } else {
    settings = {
      shop_name: "Studio Blackout",
      address: "Rua conselho das sociedades, 475 - Jd yeda",
      maps_url: "https://maps.google.com/maps?q=Rua+conselho+das+sociedades,+475+-+Jd+yeda&t=&z=15&ie=UTF8&iwloc=&output=embed",
      phone: "+55 19 92003-7087",
      whatsapp: "5519920037087",
      instagram: "https://www.instagram.com/studio_._blackout/",
      whatsapp_template: "Olá! Fiz um agendamento no Studio Blackout.",
    };
  }

  return {
    barbers,
    services,
    hours: hoursRes.data ?? [],
    settings,
  };
});

export const getAvailability = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => availabilitySchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: service }, { data: hour }, { data: settings }] = await Promise.all([
      supabaseAdmin
        .from("services")
        .select("duration_min")
        .eq("id", data.serviceId)
        .maybeSingle(),
      supabaseAdmin
        .from("business_hours")
        .select("open_time, close_time, closed")
        .eq("weekday", weekdayOf(data.date))
        .maybeSingle(),
      supabaseAdmin.from("settings").select("slot_interval_min").eq("id", 1).maybeSingle(),
    ]);

    if (!service || !hour || hour.closed) return { slots: [] as { time: string; iso: string }[] };

    const range = dayRange(data.date);
    const [appointments, blocks] = await Promise.all([
      supabaseAdmin
        .from("appointments")
        .select("starts_at, ends_at")
        .eq("barber_id", data.barberId)
        .neq("status", "cancelado")
        .lt("starts_at", range.end)
        .gt("ends_at", range.start),
      supabaseAdmin
        .from("blocked_slots")
        .select("starts_at, ends_at, reason")
        .eq("barber_id", data.barberId)
        .lt("starts_at", range.end)
        .gt("ends_at", range.start),
    ]);

    const allBlocks = blocks.data ?? [];
    const unblockedNightStarts = allBlocks
      .filter((b) => b.reason === "desbloqueado")
      .map((b) => new Date(b.starts_at).getTime());

    const actualBlocks = allBlocks.filter((b) => b.reason !== "desbloqueado");

    const slots = buildSlots({
      dateStr: data.date,
      openTime: String(hour.open_time).slice(0, 5),
      closeTime: String(hour.close_time).slice(0, 5),
      intervalMin: settings?.slot_interval_min ?? 30,
      durationMin: service.duration_min,
      busy: toIntervals([...(appointments.data ?? []), ...actualBlocks]),
      unblockedNightStarts,
    });

    return { slots };
  });

export const createBooking = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => bookingSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { toIso } = await import("./format");

    const [{ data: service }, { data: barber }] = await Promise.all([
      supabaseAdmin
        .from("services")
        .select("id, name, price_cents, duration_min, active")
        .eq("id", data.serviceId)
        .maybeSingle(),
      supabaseAdmin
        .from("barbers")
        .select("id, name, active")
        .eq("id", data.barberId)
        .maybeSingle(),
    ]);

    if (!service?.active || !barber?.active) {
      return { ok: false as const, error: "Serviço ou barbeiro indisponível." };
    }

    const startsAt = new Date(toIso(data.date, data.time));
    if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() < Date.now()) {
      return { ok: false as const, error: "Escolha um horário futuro." };
    }
    const endsAt = new Date(startsAt.getTime() + service.duration_min * 60 * 1000);
    const startsAtIso = startsAt.toISOString();
    const endsAtIso = endsAt.toISOString();

    // Verificação de conflito de agendamento em tempo de execução
    const [existingAppts, existingBlocks] = await Promise.all([
      supabaseAdmin
        .from("appointments")
        .select("id")
        .eq("barber_id", barber.id)
        .neq("status", "cancelado")
        .lt("starts_at", endsAtIso)
        .gt("ends_at", startsAtIso)
        .limit(1),
      supabaseAdmin
        .from("blocked_slots")
        .select("id, reason")
        .eq("barber_id", barber.id)
        .lt("starts_at", endsAtIso)
        .gt("ends_at", startsAtIso)
        .limit(1),
    ]);

    if (existingAppts.data && existingAppts.data.length > 0) {
      return {
        ok: false as const,
        error: "Esse horário acabou de ser reservado por outro cliente. Por favor, escolha outro horário disponível.",
      };
    }

    const hasRealBlock = (existingBlocks.data ?? []).some((b) => b.reason !== "desbloqueado");
    if (hasRealBlock) {
      return {
        ok: false as const,
        error: "Esse horário está indisponível ou foi bloqueado pelo barbeiro. Escolha outro horário.",
      };
    }

    const { data: created, error } = await supabaseAdmin
      .from("appointments")
      .insert({
        barber_id: barber.id,
        service_id: service.id,
        client_name: data.name,
        client_phone: data.phone,
        starts_at: startsAtIso,
        ends_at: endsAtIso,
        price_cents: service.price_cents,
        notes: data.notes || null,
      })
      .select("id")
      .maybeSingle();

    if (error) {
      const conflict = error.code === "23P01";
      return {
        ok: false as const,
        error: conflict
          ? "Esse horário acabou de ser reservado. Escolha outro, por favor."
          : "Não foi possível concluir o agendamento. Tente novamente.",
      };
    }

    await supabaseAdmin.from("notifications").insert({
      barber_id: barber.id,
      type: "novo_agendamento",
      title: "Novo agendamento",
      body: `${data.name} • ${service.name} • ${data.date} ${data.time}`,
    });

    return {
      ok: true as const,
      id: created?.id ?? null,
      barberName: barber.name,
      serviceName: service.name,
      priceCents: service.price_cents,
    };
  });
