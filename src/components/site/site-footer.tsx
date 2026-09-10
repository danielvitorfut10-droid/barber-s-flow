import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Instagram, MapPin, MessageCircle } from "lucide-react";
import { siteQueryOptions } from "@/lib/queries";

export function SiteFooter() {
  const { data: site } = useQuery(siteQueryOptions);
  const settings = site?.settings;
  const whatsappDigits = (settings?.whatsapp ?? "").replace(/\D/g, "");

  return (
    <footer className="border-t border-border/60 bg-card/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-2">
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

        <div className="space-y-2 md:justify-self-end">
          {settings?.address && (
            <a
              href={
                settings.maps_url ||
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${settings.address}, Campinas - SP`
                )}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline group"
              title="Ver no Google Maps"
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-500 transition-transform group-hover:scale-110" aria-hidden />
              <span>{settings.address}</span>
            </a>
          )}
          <nav className="flex flex-col pt-2 text-sm">
            <a href="/termos" className="py-1 text-muted-foreground hover:text-foreground">
              Termos de uso
            </a>
            <a href="/privacidade" className="py-1 text-muted-foreground hover:text-foreground">
              Política de privacidade
            </a>
            <a href="/auth" className="py-1 text-muted-foreground hover:text-foreground">
              Área da equipe
            </a>
          </nav>
        </div>
      </div>
      <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Studio Blackout. Todos os direitos reservados.
      </div>
    </footer>
  );
}
