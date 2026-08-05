import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Scissors, ShieldCheck, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBooking } from "@/components/booking/booking-provider";
import { siteQueryOptions } from "@/lib/queries";
import { formatBRL, formatDuration } from "@/lib/format";
import heroImg from "@/assets/hero-barbearia.jpg";
import sobreImg from "@/assets/sobre-barbearia.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Studio Blackout — Barbearia premium com agendamento online" },
      {
        name: "description",
        content:
          "Agende seu corte na Studio Blackout em segundos. Barbeiros especialistas, ambiente reservado e horários confirmados na hora pelo WhatsApp.",
      },
      { property: "og:title", content: "Studio Blackout — Barbearia premium" },
      {
        property: "og:description",
        content: "Corte preciso, ambiente reservado e agendamento online sem cadastro.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { openBooking } = useBooking();
  const { data: site } = useQuery(siteQueryOptions);

  return (
    <div>
      <section className="relative isolate overflow-hidden min-h-[85vh] md:min-h-screen flex items-center justify-center">
        {/* Fundo Hero (FUNDO-NEGUIN.jpg) - Efeito fixo/parado e centralizado */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed opacity-90 bg-[url('/FUNDO-NEGUIN.jpg')]"
          aria-hidden="true"
        />
        {/* Sobreposição de contraste elegante */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-background/95" />

        <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center px-4 py-32 md:py-44 z-10">
          <h1 className="max-w-3xl font-display text-4xl font-extrabold leading-[1.08] tracking-tight md:text-6xl text-white drop-shadow-md">
            Seu corte no horário exato. Sem fila, sem cadastro.
          </h1>
          <div className="mt-8 flex justify-center">
            <Button size="lg" onClick={openBooking} className="px-8 py-6 text-base font-semibold shadow-lg">
              Agendar agora
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: Timer, title: "Agenda em tempo real", text: "Só aparecem horários realmente livres." },
            { icon: ShieldCheck, title: "Sem login", text: "Nome e WhatsApp bastam para reservar." },
            { icon: Scissors, title: "Barbeiros especialistas", text: "Time fixo, padrão constante." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-6">
              <f.icon className="h-5 w-5 text-muted-foreground" aria-hidden />
              <h2 className="mt-4 font-display text-sm">{f.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <h2 className="font-display text-2xl font-bold tracking-tight">Serviços</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {(site?.services ?? []).map((s) => (
            <div
              key={s.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-xl border border-border bg-card p-5"
            >
              <div className="min-w-0">
                <p className="truncate font-display text-sm">{s.name}</p>
                <p className="text-xs text-muted-foreground">{formatDuration(s.duration_min)}</p>
              </div>
              <p className="shrink-0 font-display text-sm">{formatBRL(s.price_cents)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-24 md:grid-cols-2 md:items-center">
        <img
          src={sobreImg}
          alt="Barbeiro finalizando um corte na Studio Blackout"
          className="rounded-2xl border border-border object-cover"
          loading="lazy"
        />
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">Sobre o estúdio</h2>
          <p className="mt-4 text-sm text-muted-foreground">
            A Studio Blackout nasceu para tirar a barbearia do improviso: horário respeitado,
            acabamento impecável e um ambiente pensado para você desligar do resto do dia.
          </p>
          <p className="mt-4 flex gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {site?.settings?.address}
          </p>
          <Button className="mt-6" onClick={openBooking}>
            Reservar meu horário
          </Button>
        </div>
      </section>
    </div>
  );
}
