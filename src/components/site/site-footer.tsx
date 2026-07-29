import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Instagram, MapPin, MessageCircle } from "lucide-react";
import { siteQueryOptions } from "@/lib/queries";

const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export function SiteFooter() {
  const { data: site } = useQuery(siteQueryOptions);
  const settings = site?.settings;
  const whatsappDigits = (settings?.whatsapp ?? "").replace(/\D/g, "");

  return (
    <footer className="border-t border-border/60 bg-card/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-3">
        <div className="space-y-3">
          <p className="font-display text-sm font-extrabold uppercase tracking-[0.3em]">
            Studio <span className="text-muted-foreground">Blackout</span>
          </p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Barbearia premium. Corte preciso, ambiente reservado e horário garantido.
          </p>
          <div className="flex gap-3 pt-1">
            {whatsappDigits && (
              <a
                href={`https://wa.me/${whatsappDigits}`}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
            )}
            {settings?.instagram && (
              <a
                href={settings.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Instagram className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <p className="font-display text-xs uppercase tracking-widest text-muted-foreground">
            Horários
          </p>
          <ul className="space-y-1 text-sm">
            {(site?.hours ?? []).map((h) => (
              <li key={h.weekday} className="flex justify-between gap-4">
                <span className="text-muted-foreground">{WEEKDAYS[h.weekday]}</span>
                <span>{h.closed ? "Fechado" : `${h.opens_at.slice(0, 5)} – ${h.closes_at.slice(0, 5)}`}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <p className="font-display text-xs uppercase tracking-widest text-muted-foreground">
            Onde estamos
          </p>
          <p className="flex gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{settings?.address}</span>
          </p>
          <nav className="flex flex-col pt-2 text-sm">
            <Link to="/termos" className="py-1 text-muted-foreground hover:text-foreground">
              Termos de uso
            </Link>
            <Link to="/privacidade" className="py-1 text-muted-foreground hover:text-foreground">
              Política de privacidade
            </Link>
            <Link to="/auth" className="py-1 text-muted-foreground hover:text-foreground">
              Área da equipe
            </Link>
          </nav>
        </div>
      </div>
      <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Studio Blackout. Todos os direitos reservados.
      </div>
    </footer>
  );
}
