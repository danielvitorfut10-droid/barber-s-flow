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

  const [barbers, services, hours, settings] = await Promise.all([
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

  return {
    barbers: barbers.data ?? [],
    services: services.data ?? [],
    hours: hours.data ?? [],
    settings: settings.data ?? null,
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
        .gte("starts_at", range.start)
        .lt("starts_at", range.end),
      supabaseAdmin
        .from("blocked_slots")
        .select("starts_at, ends_at")
        .eq("barber_id", data.barberId)
        .lt("starts_at", range.end)
        .gt("ends_at", range.start),
    ]);

    const slots = buildSlots({
      dateStr: data.date,
      openTime: String(hour.open_time).slice(0, 5),
      closeTime: String(hour.close_time).slice(0, 5),
      intervalMin: settings?.slot_interval_min ?? 30,
      durationMin: service.duration_min,
      busy: toIntervals([...(appointments.data ?? []), ...(blocks.data ?? [])]),
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

    const { data: created, error } = await supabaseAdmin
      .from("appointments")
      .insert({
        barber_id: barber.id,
        service_id: service.id,
        client_name: data.name,
        client_phone: data.phone,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
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
