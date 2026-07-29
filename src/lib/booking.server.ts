import { toIso } from "./format";

export type Slot = { time: string; iso: string };

type Interval = { start: number; end: number };

export function weekdayOf(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
}

function minutesOf(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * Gera os horários livres de um barbeiro em um dia, considerando
 * funcionamento, duração do serviço, agendamentos e bloqueios.
 */
export function buildSlots(params: {
  dateStr: string;
  openTime: string;
  closeTime: string;
  intervalMin: number;
  durationMin: number;
  busy: Interval[];
  now?: Date;
}): Slot[] {
  const { dateStr, openTime, closeTime, intervalMin, durationMin, busy } = params;
  const now = params.now ?? new Date();
  const minStart = now.getTime() + 30 * 60 * 1000;

  const open = minutesOf(openTime);
  const close = minutesOf(closeTime);
  const slots: Slot[] = [];

  for (let m = open; m + durationMin <= close; m += intervalMin) {
    const time = `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
    const iso = toIso(dateStr, time);
    const start = new Date(iso).getTime();
    const end = start + durationMin * 60 * 1000;
    if (start < minStart) continue;
    const conflict = busy.some((b) => start < b.end && end > b.start);
    if (!conflict) slots.push({ time, iso });
  }

  return slots;
}

export function toIntervals(rows: { starts_at: string; ends_at: string }[]): Interval[] {
  return rows.map((r) => ({
    start: new Date(r.starts_at).getTime(),
    end: new Date(r.ends_at).getTime(),
  }));
}

export function dayRange(dateStr: string) {
  const start = toIso(dateStr, "00:00");
  const [y, m, d] = dateStr.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1, 12));
  const nextStr = `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
  return { start, end: toIso(nextStr, "00:00") };
}

export function buildWhatsappMessage(input: {
  template: string | null;
  clientName: string;
  barberName: string;
  serviceName: string;
  dateLabel: string;
  timeLabel: string;
  priceLabel: string;
}) {
  const base = input.template?.trim() || "Olá! Fiz um agendamento no Studio Blackout.";
  return [
    base,
    "",
    `Cliente: ${input.clientName}`,
    `Barbeiro: ${input.barberName}`,
    `Serviço: ${input.serviceName}`,
    `Data: ${input.dateLabel}`,
    `Horário: ${input.timeLabel}`,
    `Valor: ${input.priceLabel}`,
  ].join("\n");
}
