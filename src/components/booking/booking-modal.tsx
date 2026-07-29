import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock,
  Loader2,
  MessageCircle,
  Scissors,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatBRL, formatDateLong, formatDuration, maskPhone, toDateKey } from "@/lib/format";
import { siteQueryOptions } from "@/lib/queries";
import { getAvailability, createBooking } from "@/lib/public.functions";
import { buildWhatsappLink } from "./whatsapp";

const STEPS = ["Barbeiro", "Serviço", "Data", "Horário", "Dados", "Revisão"];

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export function BookingModal({ open, onOpenChange }: Props) {
  const { data: site } = useQuery(siteQueryOptions);
  const availabilityFn = useServerFn(getAvailability);
  const createFn = useServerFn(createBooking);

  const [step, setStep] = useState(0);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState<{ whatsappUrl: string } | null>(null);

  const barber = site?.barbers.find((b) => b.id === barberId) ?? null;
  const service = site?.services.find((s) => s.id === serviceId) ?? null;

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setStep(0);
        setBarberId(null);
        setServiceId(null);
        setDate(null);
        setTime(null);
        setName("");
        setPhone("");
        setNotes("");
        setDone(null);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const days = useMemo(() => {
    const closedWeekdays = new Set(
      (site?.hours ?? []).filter((h) => h.closed).map((h) => h.weekday),
    );
    const list: { key: string; label: string; weekday: number; disabled: boolean }[] = [];
    for (let i = 0; i < 21; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const key = toDateKey(d);
      const weekday = d.getDay();
      list.push({
        key,
        weekday,
        label: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(d),
        disabled: closedWeekdays.has(weekday),
      });
    }
    return list;
  }, [site]);

  const slotsQuery = useQuery({
    queryKey: ["availability", barberId, serviceId, date],
    enabled: Boolean(open && barberId && serviceId && date),
    queryFn: () =>
      availabilityFn({ data: { barberId: barberId!, serviceId: serviceId!, date: date! } }),
  });

  const phoneDigits = phone.replace(/\D/g, "");
  const nameValid = name.trim().length >= 2;
  const phoneValid = phoneDigits.length >= 10;

  const mutation = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          barberId: barberId!,
          serviceId: serviceId!,
          date: date!,
          time: time!,
          name: name.trim(),
          phone,
          notes: notes.trim(),
        },
      }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error);
        if (result.error.includes("reservado")) {
          setTime(null);
          setStep(3);
          slotsQuery.refetch();
        }
        return;
      }
      const url = buildWhatsappLink({
        whatsapp: site?.settings?.whatsapp ?? "",
        template: site?.settings?.whatsapp_template ?? null,
        clientName: name.trim(),
        barberName: result.barberName,
        serviceName: result.serviceName,
        dateLabel: formatDateLong(date!),
        timeLabel: time!,
        priceLabel: formatBRL(result.priceCents),
      });
      setDone({ whatsappUrl: url });
      toast.success("Agendamento confirmado!");
    },
    onError: () => toast.error("Falha de conexão. Tente novamente."),
  });

  const canAdvance =
    (step === 0 && barberId) ||
    (step === 1 && serviceId) ||
    (step === 2 && date) ||
    (step === 3 && time) ||
    (step === 4 && nameValid && phoneValid);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto border-border bg-popover p-0 sm:max-w-lg">
        <div className="border-b border-border p-5">
          <DialogTitle className="font-display text-lg">
            {done ? "Agendamento confirmado" : "Agendar agora"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {done
              ? "Seu horário já está reservado na agenda."
              : `Etapa ${step + 1} de ${STEPS.length} — ${STEPS[step]}`}
          </DialogDescription>
          {!done && (
            <Progress
              value={((step + 1) / STEPS.length) * 100}
              className="mt-4 h-1 bg-secondary"
              aria-label="Progresso do agendamento"
            />
          )}
        </div>

        <div className="p-5">
          {done ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                <Check className="h-7 w-7" aria-hidden />
              </div>
              <div className="space-y-1">
                <p className="font-display text-base">
                  {service?.name} com {barber?.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {date && formatDateLong(date)} às {time}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button asChild size="lg">
                  <a href={done.whatsappUrl} target="_blank" rel="noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" aria-hidden />
                    Enviar confirmação no WhatsApp
                  </a>
                </Button>
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          ) : (
            <>
              {step === 0 && (
                <div className="grid gap-3">
                  {!site
                    ? [0, 1].map((i) => <Skeleton key={i} className="h-20 w-full" />)
                    : site.barbers.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            setBarberId(b.id);
                            setStep(1);
                          }}
                          className={cn(
                            "flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-foreground/40 hover:bg-accent",
                            barberId === b.id && "border-foreground",
                          )}
                        >
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-lg">
                            {b.name.charAt(0)}
                          </span>
                          <span className="min-w-0">
                            <span className="block font-display text-sm">{b.name}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {b.bio}
                            </span>
                          </span>
                        </button>
                      ))}
                </div>
              )}

              {step === 1 && (
                <div className="grid gap-2">
                  {(site?.services ?? []).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setServiceId(s.id);
                        setTime(null);
                        setStep(2);
                      }}
                      className={cn(
                        "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-foreground/40 hover:bg-accent",
                        serviceId === s.id && "border-foreground",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-display text-sm">{s.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {formatDuration(s.duration_min)}
                        </span>
                      </span>
                      <span className="shrink-0 font-display text-sm">
                        {formatBRL(s.price_cents)}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {step === 2 && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {days.map((d) => (
                    <button
                      key={d.key}
                      type="button"
                      disabled={d.disabled}
                      onClick={() => {
                        setDate(d.key);
                        setTime(null);
                        setStep(3);
                      }}
                      className={cn(
                        "rounded-lg border border-border bg-card px-2 py-3 text-center text-xs transition-colors hover:border-foreground/40",
                        d.disabled && "cursor-not-allowed opacity-30 hover:border-border",
                        date === d.key && "border-foreground bg-secondary",
                      )}
                    >
                      <span className="block font-display text-sm">{d.label}</span>
                      <span className="block text-[10px] uppercase text-muted-foreground">
                        {["dom", "seg", "ter", "qua", "qui", "sex", "sáb"][d.weekday]}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {step === 3 && (
                <div>
                  {slotsQuery.isLoading ? (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : (slotsQuery.data?.slots.length ?? 0) === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Nenhum horário livre nesta data. Escolha outro dia.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {slotsQuery.data!.slots.map((s) => (
                        <button
                          key={s.time}
                          type="button"
                          onClick={() => {
                            setTime(s.time);
                            setStep(4);
                          }}
                          className={cn(
                            "rounded-lg border border-border bg-card py-2 text-sm transition-colors hover:border-foreground/40",
                            time === s.time && "border-foreground bg-secondary",
                          )}
                        >
                          {s.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="booking-name">Nome completo</Label>
                    <Input
                      id="booking-name"
                      value={name}
                      maxLength={80}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                      aria-invalid={name.length > 0 && !nameValid}
                    />
                    {name.length > 0 && !nameValid && (
                      <p className="text-xs text-destructive">Informe pelo menos 2 caracteres.</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="booking-phone">WhatsApp</Label>
                    <Input
                      id="booking-phone"
                      inputMode="tel"
                      value={phone}
                      onChange={(e) => setPhone(maskPhone(e.target.value))}
                      placeholder="(19) 90000-0000"
                      aria-invalid={phone.length > 0 && !phoneValid}
                    />
                    {phone.length > 0 && !phoneValid && (
                      <p className="text-xs text-destructive">Informe DDD + número.</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="booking-notes">Observações (opcional)</Label>
                    <Textarea
                      id="booking-notes"
                      value={notes}
                      maxLength={280}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Alguma preferência?"
                    />
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-3">
                  <ReviewRow icon={<User className="h-4 w-4" />} label="Barbeiro" value={barber?.name ?? ""} />
                  <ReviewRow
                    icon={<Scissors className="h-4 w-4" />}
                    label="Serviço"
                    value={`${service?.name} • ${formatBRL(service?.price_cents ?? 0)}`}
                  />
                  <ReviewRow
                    icon={<CalendarDays className="h-4 w-4" />}
                    label="Data"
                    value={date ? formatDateLong(date) : ""}
                  />
                  <ReviewRow icon={<Clock className="h-4 w-4" />} label="Horário" value={time ?? ""} />
                  <ReviewRow icon={<User className="h-4 w-4" />} label="Cliente" value={`${name} • ${phone}`} />
                </div>
              )}
            </>
          )}
        </div>

        {!done && (
          <div className="flex items-center justify-between gap-3 border-t border-border p-5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || mutation.isPending}
            >
              <ArrowLeft className="mr-1 h-4 w-4" aria-hidden />
              Voltar
            </Button>
            {step === 5 ? (
              <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
                Confirmar agendamento
              </Button>
            ) : (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
                Continuar
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReviewRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-lg border border-border bg-card p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="block truncate text-sm">{value}</span>
      </span>
    </div>
  );
}
