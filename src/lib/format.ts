export const TZ_OFFSET = "-03:00";

export function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDuration(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

/** Converte "2026-08-04" + "09:30" para um ISO com fuso de Brasília. */
export function toIso(dateStr: string, timeStr: string) {
  return `${dateStr}T${timeStr}:00${TZ_OFFSET}`;
}

/** Converte objeto Date do calendário para chave YYYY-MM-DD imune a fuso horário. */
export function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Retorna a data de HOJE no fuso de Brasília (YYYY-MM-DD). */
export function getTodayDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}


export function formatTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDateLong(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date(Date.UTC(y, m - 1, d, 12)));
}

export function formatDateShort(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(new Date(iso));
}

export function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export const STATUS_LABEL: Record<string, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
  nao_compareceu: "Não compareceu",
};

/**
 * Conclui o agendamento apenas quando a data/horário já tiver passado
 * e não tiver sido cancelado pelo admin.
 */
export function resolveAppointmentStatus(
  status: string,
  startsAt: string | Date,
  endsAt?: string | Date
): "agendado" | "confirmado" | "concluido" | "cancelado" | "nao_compareceu" {
  if (status === "cancelado") return "cancelado";
  if (status === "nao_compareceu") return "nao_compareceu";

  const now = new Date();
  const start = typeof startsAt === "string" ? new Date(startsAt) : startsAt;
  const end = endsAt
    ? typeof endsAt === "string"
      ? new Date(endsAt)
      : endsAt
    : new Date(start.getTime() + 30 * 60 * 1000);

  // Se a data já passou e não foi cancelado, conclui o agendamento
  if (end.getTime() <= now.getTime()) {
    return "concluido";
  }

  // Se a data ainda não passou (futuro), não pode constar como concluído
  if (status === "concluido") {
    return "agendado";
  }

  return (status as any) || "agendado";
}

export const PAYMENT_LABEL: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  debito: "Cartão de débito",
  credito: "Cartão de crédito",
};

export const WEEKDAYS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];
