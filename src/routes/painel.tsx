import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  CalendarDays,
  TrendingUp,
  Users,
  DollarSign,
  LogOut,
  Scissors,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  Clock,
  CheckCircle2,
  X,
  Loader2,
  BarChart3,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  parseISO,
  startOfDay,
  endOfDay,
  startOfWeek as startOfWeekFn,
  endOfWeek as endOfWeekFn,
  startOfMonth as startOfMonthFn,
  endOfMonth as endOfMonthFn,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useBarberAuth } from "@/hooks/use-barber-auth";
import { formatBRL } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/painel")({
  head: () => ({
    meta: [{ title: "Painel do Barbeiro — Studio Blackout" }],
  }),
  component: PainelPage,
});

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type Tab = "receita" | "agendamentos";

interface Appointment {
  id: string;
  client_name: string;
  client_phone: string;
  starts_at: string;
  ends_at: string;
  price_cents: number;
  status: string;
  services: { name: string } | null;
}

interface BlockedSlot {
  id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
function PainelPage() {
  const { user, barber, role, loading, isAuthorized, signOut } = useBarberAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("receita");

  // Redirect if not authorized
  useEffect(() => {
    if (!loading && !isAuthorized) {
      router.navigate({ to: "/" });
    }
  }, [loading, isAuthorized, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-[#39ff14]" />
      </div>
    );
  }

  if (!isAuthorized) return null;

  const displayName = barber?.name ?? user?.email ?? "Barbeiro";

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Sidebar / Top nav */}
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800">
              <Scissors className="h-4 w-4 text-[#39ff14]" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 leading-none">Studio Blackout</p>
              <p className="text-sm font-bold text-white leading-tight">{displayName}</p>
            </div>
            {role === "admin" && (
              <span className="rounded-full bg-[#39ff14]/10 border border-[#39ff14]/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#39ff14]">
                Admin
              </span>
            )}
          </div>

          {/* Tabs */}
          <nav className="flex gap-1">
            <TabButton active={activeTab === "receita"} onClick={() => setActiveTab("receita")}>
              <BarChart3 className="h-4 w-4" />
              Receita
            </TabButton>
            <TabButton active={activeTab === "agendamentos"} onClick={() => setActiveTab("agendamentos")}>
              <CalendarDays className="h-4 w-4" />
              Agendamentos
            </TabButton>
          </nav>

          <button
            onClick={signOut}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition-all hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {activeTab === "receita" && <ReceitaTab barber={barber} role={role} />}
        {activeTab === "agendamentos" && <AgendamentosTab barber={barber} role={role} />}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────
// Tab Button
// ─────────────────────────────────────────────
function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
        active
          ? "bg-[#39ff14]/10 text-[#39ff14] border border-[#39ff14]/30"
          : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
      }`}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────
// Receita Tab
// ─────────────────────────────────────────────
type Period = "dia" | "semana" | "mes";

function ReceitaTab({ barber, role }: { barber: { id: string } | null; role: string | null }) {
  const [period, setPeriod] = useState<Period>("mes");

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["barber-appointments", barber?.id, role],
    queryFn: async () => {
      let q = supabase
        .from("appointments")
        .select("id, client_name, client_phone, starts_at, ends_at, price_cents, status, services(name)")
        .neq("status", "cancelado")
        .order("starts_at", { ascending: false });

      // Admin sees all; barber sees own
      if (role === "barber" && barber?.id) {
        q = q.eq("barber_id", barber.id);
      }

      const { data } = await q;
      return (data ?? []) as Appointment[];
    },
    enabled: role !== null,
  });

  // Period filter
  const now = new Date();
  const filtered = appointments.filter((a) => {
    const d = parseISO(a.starts_at);
    if (period === "dia") return isSameDay(d, now);
    if (period === "semana") {
      const ws = startOfWeekFn(now, { weekStartsOn: 1 });
      const we = endOfWeekFn(now, { weekStartsOn: 1 });
      return d >= ws && d <= we;
    }
    if (period === "mes") {
      const ms = startOfMonthFn(now);
      const me = endOfMonthFn(now);
      return d >= ms && d <= me;
    }
    return true;
  });

  const totalCents = filtered.reduce((s, a) => s + a.price_cents, 0);
  const totalCount = filtered.length;
  const avgCents = totalCount > 0 ? Math.round(totalCents / totalCount) : 0;

  // Chart data — last 7 days
  const chartDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = format(d, "EEE", { locale: ptBR });
    const dayAppts = appointments.filter((a) => isSameDay(parseISO(a.starts_at), d));
    return { label, receita: dayAppts.reduce((s, a) => s + a.price_cents / 100, 0), count: dayAppts.length };
  });

  return (
    <div className="space-y-8">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Receita</h1>
        <div className="flex gap-1 rounded-lg border border-zinc-800 p-1 bg-zinc-900/50">
          {(["dia", "semana", "mes"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1 text-xs font-semibold capitalize transition-all ${
                period === p ? "bg-[#39ff14] text-black" : "text-zinc-400 hover:text-white"
              }`}
            >
              {p === "dia" ? "Hoje" : p === "semana" ? "Semana" : "Mês"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          label={period === "dia" ? "Receita Hoje" : period === "semana" ? "Receita da Semana" : "Receita do Mês"}
          value={formatBRL(totalCents)}
          icon={<DollarSign className="h-5 w-5" />}
          accent
        />
        <SummaryCard
          label="Atendimentos"
          value={String(totalCount)}
          icon={<Users className="h-5 w-5" />}
        />
        <SummaryCard
          label="Ticket Médio"
          value={formatBRL(avgCents)}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Receita — Últimos 7 dias
        </h2>
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#39ff14]" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartDays} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: "#71717a", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `R$${v}`}
              />
              <Tooltip
                cursor={{ fill: "rgba(57,255,20,0.05)" }}
                contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fff" }}
                formatter={(v: number) => [`R$ ${v.toFixed(2)}`, "Receita"]}
              />
              <Bar dataKey="receita" fill="#39ff14" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent appointments */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Últimos Atendimentos
        </h2>
        {isLoading ? (
          <div className="flex h-24 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#39ff14]" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-zinc-600 py-8">Nenhum atendimento neste período.</p>
        ) : (
          <div className="space-y-2">
            {filtered.slice(0, 10).map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-xl border border-zinc-800/60 bg-zinc-900 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400">
                    <Scissors className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{a.client_name}</p>
                    <p className="text-xs text-zinc-500">
                      {a.services?.name} •{" "}
                      {format(parseISO(a.starts_at), "dd/MM HH:mm")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#39ff14]">{formatBRL(a.price_cents)}</p>
                  <StatusBadge status={a.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 ${
        accent
          ? "border-[#39ff14]/20 bg-[#39ff14]/5"
          : "border-zinc-800 bg-zinc-900/50"
      }`}
    >
      <div
        className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${
          accent ? "bg-[#39ff14]/15 text-[#39ff14]" : "bg-zinc-800 text-zinc-400"
        }`}
      >
        {icon}
      </div>
      <p className="text-xs text-zinc-500 uppercase tracking-wide">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ? "text-[#39ff14]" : "text-white"}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    agendado: { label: "Agendado", cls: "text-blue-400" },
    confirmado: { label: "Confirmado", cls: "text-emerald-400" },
    concluido: { label: "Concluído", cls: "text-[#39ff14]" },
    cancelado: { label: "Cancelado", cls: "text-red-400" },
    nao_compareceu: { label: "Faltou", cls: "text-yellow-500" },
  };
  const s = map[status] ?? { label: status, cls: "text-zinc-400" };
  return <p className={`text-xs font-medium ${s.cls}`}>{s.label}</p>;
}

// ─────────────────────────────────────────────
// Agendamentos Tab
// ─────────────────────────────────────────────
function AgendamentosTab({ barber, role }: { barber: { id: string; name: string } | null; role: string | null }) {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());

  // Load appointments and blocked slots for the current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const { data: appointments = [] } = useQuery({
    queryKey: ["painel-appointments", format(currentMonth, "yyyy-MM"), barber?.id, role],
    queryFn: async () => {
      let q = supabase
        .from("appointments")
        .select("id, starts_at, ends_at, client_name, status, services(name)")
        .neq("status", "cancelado")
        .gte("starts_at", monthStart.toISOString())
        .lt("starts_at", monthEnd.toISOString());

      if (role === "barber" && barber?.id) q = q.eq("barber_id", barber.id);
      const { data } = await q;
      return data ?? [];
    },
    enabled: role !== null,
  });

  const { data: blockedSlots = [] } = useQuery({
    queryKey: ["painel-blocked", format(currentMonth, "yyyy-MM"), barber?.id, role],
    queryFn: async () => {
      let q = supabase
        .from("blocked_slots")
        .select("id, starts_at, ends_at, reason")
        .gte("starts_at", monthStart.toISOString())
        .lt("starts_at", monthEnd.toISOString());

      if (role === "barber" && barber?.id) q = q.eq("barber_id", barber.id);
      const { data } = await q;
      return (data ?? []) as BlockedSlot[];
    },
    enabled: role !== null,
  });

  // Business hours for selected day
  const { data: businessHours } = useQuery({
    queryKey: ["business-hours"],
    queryFn: async () => {
      const { data } = await supabase.from("business_hours").select("*").order("weekday");
      return data ?? [];
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["settings-slot"],
    queryFn: async () => {
      const { data } = await supabase.from("settings").select("slot_interval_min").eq("id", 1).maybeSingle();
      return data;
    },
  });

  // Block mutation
  const blockMutation = useMutation({
    mutationFn: async ({ startsAt, endsAt }: { startsAt: string; endsAt: string }) => {
      if (!barber?.id) throw new Error("Barbeiro não encontrado.");
      const { error } = await supabase.from("blocked_slots").insert({
        barber_id: barber.id,
        starts_at: startsAt,
        ends_at: endsAt,
        reason: "Bloqueado pelo barbeiro",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["painel-blocked"] });
      toast.success("Horário bloqueado com sucesso!");
    },
    onError: () => toast.error("Erro ao bloquear horário."),
  });

  const unblockMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blocked_slots").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["painel-blocked"] });
      toast.success("Horário desbloqueado!");
    },
    onError: () => toast.error("Erro ao desbloquear."),
  });

  // Calendar days
  const calStart = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
  const calEnd = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  // For selected day — build time slots
  const selectedDaySlots = (() => {
    if (!selectedDay) return [];
    const weekday = selectedDay.getDay();
    const hours = businessHours?.find((h) => h.weekday === weekday);
    if (!hours || hours.closed) return [];

    const interval = settings?.slot_interval_min ?? 30;
    const [openH, openM] = hours.open_time.slice(0, 5).split(":").map(Number);
    const [closeH, closeM] = hours.close_time.slice(0, 5).split(":").map(Number);

    const slots: { time: string; iso: string }[] = [];
    let h = openH;
    let m = openM;
    while (h * 60 + m < closeH * 60 + closeM) {
      const iso = new Date(
        selectedDay.getFullYear(),
        selectedDay.getMonth(),
        selectedDay.getDate(),
        h,
        m
      ).toISOString();
      slots.push({ time: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`, iso });
      m += interval;
      if (m >= 60) { h += Math.floor(m / 60); m = m % 60; }
      if (h >= 24) break;
    }
    return slots;
  })();

  // Day dot indicators
  function getDayInfo(day: Date) {
    const booked = appointments.filter((a) => isSameDay(parseISO(a.starts_at), day));
    const blocked = blockedSlots.filter((b) => isSameDay(parseISO(b.starts_at), day));
    return { booked: booked.length, blocked: blocked.length };
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Agendamentos</h1>
        <p className="text-sm text-zinc-500">Clique em um dia para gerenciar os horários</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        {/* Calendar */}
        <div className="lg:col-span-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          {/* Month nav */}
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </h2>
            <button
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="mb-2 grid grid-cols-7 text-center">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
              <div key={d} className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {calDays.map((day) => {
              const { booked, blocked } = getDayInfo(day);
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  className={`relative flex flex-col items-center gap-0.5 rounded-xl py-2 text-sm font-medium transition-all ${
                    !isCurrentMonth
                      ? "text-zinc-700 hover:bg-zinc-800/30"
                      : isSelected
                        ? "bg-[#39ff14] text-black shadow-lg shadow-[#39ff14]/20"
                        : today
                          ? "border border-[#39ff14]/40 bg-[#39ff14]/5 text-[#39ff14]"
                          : "text-zinc-300 hover:bg-zinc-800/60"
                  }`}
                >
                  <span>{format(day, "d")}</span>
                  {/* Dots */}
                  {isCurrentMonth && (booked > 0 || blocked > 0) && (
                    <div className="flex gap-0.5">
                      {booked > 0 && (
                        <span
                          className={`h-1 w-1 rounded-full ${isSelected ? "bg-black/60" : "bg-emerald-400"}`}
                        />
                      )}
                      {blocked > 0 && (
                        <span
                          className={`h-1 w-1 rounded-full ${isSelected ? "bg-black/60" : "bg-red-400"}`}
                        />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Agendado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400" /> Bloqueado
            </span>
          </div>
        </div>

        {/* Day slots panel */}
        <div className="lg:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          {!selectedDay ? (
            <div className="flex h-full items-center justify-center text-zinc-600">
              <p className="text-sm">Selecione um dia no calendário</p>
            </div>
          ) : (
            <>
              <h3 className="mb-1 text-sm font-bold text-white">
                {format(selectedDay, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </h3>

              {(() => {
                const weekday = selectedDay.getDay();
                const hours = businessHours?.find((h) => h.weekday === weekday);
                if (!hours || hours.closed) {
                  return (
                    <div className="mt-6 flex flex-col items-center justify-center gap-2 text-zinc-600">
                      <X className="h-8 w-8 text-zinc-700" />
                      <p className="text-sm">Dia fechado para atendimento</p>
                    </div>
                  );
                }

                return (
                  <>
                    <p className="mb-5 text-xs text-zinc-500">
                      {hours.open_time.slice(0, 5)} – {hours.close_time.slice(0, 5)}
                    </p>
                    <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                      {selectedDaySlots.map((slot) => {
                        const slotDate = new Date(slot.iso);
                        const slotEnd = new Date(slotDate.getTime() + (settings?.slot_interval_min ?? 30) * 60 * 1000);

                        // Check appointment
                        const appt = appointments.find((a) => {
                          const aStart = parseISO(a.starts_at);
                          const aEnd = parseISO(a.ends_at);
                          return slotDate >= aStart && slotDate < aEnd;
                        });

                        // Check blocked
                        const block = blockedSlots.find((b) => {
                          const bStart = parseISO(b.starts_at);
                          const bEnd = parseISO(b.ends_at);
                          return slotDate >= bStart && slotDate < bEnd;
                        });

                        if (appt) {
                          return (
                            <div
                              key={slot.iso}
                              className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5"
                            >
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                <div>
                                  <p className="text-xs font-bold text-emerald-300">{slot.time}</p>
                                  <p className="text-[10px] text-emerald-500/80">{appt.client_name}</p>
                                </div>
                              </div>
                              <span className="text-[10px] text-zinc-500 truncate max-w-[80px]">
                                {(appt as any).services?.name}
                              </span>
                            </div>
                          );
                        }

                        if (block) {
                          return (
                            <div
                              key={slot.iso}
                              className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5"
                            >
                              <div className="flex items-center gap-2">
                                <Lock className="h-4 w-4 text-red-400 shrink-0" />
                                <p className="text-xs font-bold text-red-300">{slot.time}</p>
                              </div>
                              <button
                                onClick={() => unblockMutation.mutate(block.id)}
                                disabled={unblockMutation.isPending}
                                className="flex items-center gap-1 rounded-lg border border-zinc-700 px-2 py-1 text-[10px] font-bold text-zinc-400 transition-all hover:border-[#39ff14]/40 hover:text-[#39ff14] disabled:opacity-50"
                              >
                                {unblockMutation.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Unlock className="h-3 w-3" />
                                )}
                                Desbloquear
                              </button>
                            </div>
                          );
                        }

                        // Free slot
                        return (
                          <div
                            key={slot.iso}
                            className="flex items-center justify-between rounded-xl border border-zinc-800/60 bg-zinc-900 px-3 py-2.5"
                          >
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-zinc-600 shrink-0" />
                              <p className="text-xs font-medium text-zinc-400">{slot.time}</p>
                            </div>
                            <button
                              onClick={() =>
                                blockMutation.mutate({
                                  startsAt: slotDate.toISOString(),
                                  endsAt: slotEnd.toISOString(),
                                })
                              }
                              disabled={blockMutation.isPending}
                              className="flex items-center gap-1 rounded-lg border border-zinc-700 px-2 py-1 text-[10px] font-bold text-zinc-500 transition-all hover:border-red-500/40 hover:bg-red-500/5 hover:text-red-400 disabled:opacity-50"
                            >
                              {blockMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Lock className="h-3 w-3" />
                              )}
                              Bloquear
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
