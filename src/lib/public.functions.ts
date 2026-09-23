import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { buildSlots, dayRange, toIntervals, weekdayOf } from "./booking.server";
import { publicClient } from "./supabase-public.server";

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
  const db = publicClient();

  const [barbers, services, hours, settings] = await Promise.all([
    db
      .from("barbers")
      .select("id, name, nickname, bio, photo_url, sort_order")
      .eq("active", true)
      .order("sort_order"),
    db
      .from("services")
      .select("id, name, description, price_cents, duration_min, sort_order")
      .eq("active", true)
      .order("sort_order"),
    db
      .from("business_hours")
      .select("weekday, open_time, close_time, closed")
      .order("weekday"),
    db
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
    const db = publicClient();

    const [{ data: service }, { data: hour }, { data: settings }] = await Promise.all([
      db
        .from("services")
        .select("duration_min")
        .eq("id", data.serviceId)
        .maybeSingle(),
      db
        .from("business_hours")
        .select("open_time, close_time, closed")
        .eq("weekday", weekdayOf(data.date))
        .maybeSingle(),
      db.from("settings").select("slot_interval_min").eq("id", 1).maybeSingle(),
    ]);

    if (!service || !hour || hour.closed) return { slots: [] as { time: string; iso: string }[] };

    const range = dayRange(data.date);
    const { data: busyRows } = await db.rpc("get_public_busy", {
      _barber_id: data.barberId,
      _start: range.start,
      _end: range.end,
    });
    const rows = busyRows ?? [];
    const unblockedNightStarts = rows
      .filter((r) => r.kind === "unblocked")
      .map((r) => new Date(r.starts_at).getTime());
    const busy = rows.filter((r) => r.kind !== "unblocked");

    const slots = buildSlots({
      dateStr: data.date,
      openTime: String(hour.open_time).slice(0, 5),
      closeTime: String(hour.close_time).slice(0, 5),
      intervalMin: settings?.slot_interval_min ?? 30,
      durationMin: service.duration_min,
      busy: toIntervals(busy),
      unblockedNightStarts,
    });

    return { slots };
  });

export const createBooking = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => bookingSchema.parse(data))
  .handler(async ({ data }) => {
    const supabasePublic = publicClient();
    const { toIso } = await import("./format");
    const startsAt = new Date(toIso(data.date, data.time));
    if (Number.isNaN(startsAt.getTime())) {
      return { ok: false as const, error: "Escolha um horário futuro." };
    }
    const { data: res, error } = await supabasePublic.rpc("create_public_booking", {
      _barber_id: data.barberId,
      _service_id: data.serviceId,
      _starts_at: startsAt.toISOString(),
      _name: data.name,
      _phone: data.phone,
      _notes: data.notes || "",
      _label: `${data.date} ${data.time}`,
    });
    const r = (res ?? {}) as {
      ok?: boolean; error?: string; id?: string; barberName?: string; serviceName?: string; priceCents?: number;
    };
    if (error || !r.ok) {
      if (error) console.error(error);
      return { ok: false as const, error: r.error ?? "Não foi possível concluir o agendamento. Tente novamente." };
    }
    return {
      ok: true as const,
      id: r.id ?? null,
      barberName: r.barberName ?? "",
      serviceName: r.serviceName ?? "",
      priceCents: r.priceCents ?? 0,
    };
  });
