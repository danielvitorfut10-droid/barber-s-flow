import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBooking } from "@/components/booking/booking-provider";
import { siteQueryOptions } from "@/lib/queries";
import { formatBRL, formatDuration } from "@/lib/format";
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
      { property: "og:title", content: "Studio Blackout — Barbearia premium com agendamento online" },
      {
        property: "og:description",
        content: "Agende seu corte na Studio Blackout em segundos. Barbeiros especialistas, ambiente reservado e horários confirmados na hora pelo WhatsApp.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { openBooking } = useBooking();
  const { data: site } = useQuery(siteQueryOptions);

  const whatsappDigits = (site?.settings?.whatsapp ?? "").replace(/\D/g, "");
  const whatsappUrl = whatsappDigits ? `https://wa.me/${whatsappDigits}` : "https://wa.me/";

  return (
    <div>
      {/* SEÇÃO HERO */}
      <section className="relative isolate overflow-hidden min-h-[85vh] md:min-h-screen flex items-center justify-center">
        {/* Fundo DESKTOP: parallax fixo com FUNDO-NEGUIN */}
        <div
          className="absolute inset-0 hidden md:block bg-cover bg-center bg-no-repeat bg-fixed bg-[url('/FUNDO-NEGUIN.jpg')]"
          aria-hidden="true"
        />
        {/* Fundo MOBILE: imagem fundo-mobile com bg-scroll (bg-fixed quebra no mobile) */}
        <div
          className="absolute inset-0 block md:hidden bg-cover bg-center bg-no-repeat bg-scroll bg-[url('/fundo-mobile.jpg')]"
          aria-hidden="true"
        />
        {/* Sobreposição suave para dar máximo destaque à imagem preservando a legibilidade */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/70" />

        <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center px-4 py-32 md:py-44 z-10">
          <h1 className="max-w-3xl font-display text-4xl font-extrabold leading-[1.1] tracking-tight md:text-6xl text-white drop-shadow-lg">
            Seu horário. Seu corte. Sem espera.
          </h1>
          <div className="mt-8 flex justify-center">
            <Button size="lg" onClick={openBooking} className="px-8 py-6 text-base font-semibold shadow-2xl">
              Agendar agora
            </Button>
          </div>
        </div>
      </section>

      {/* SEÇÃO SOBRE NÓS (Fundo Branco) */}
      <section id="sobre" className="w-full bg-white text-zinc-900 py-20 px-4 overflow-hidden">
        <div className="mx-auto max-w-4xl">
          {/* Título e Subtítulo Centralizados */}
          <div className="text-center mb-8">
            <span className="block text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-1">
              Conheça sobre o
            </span>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-900">
              Studio Blackout
            </h2>
          </div>

          {/* Texto de Apresentação */}
          <div className="space-y-6 text-zinc-700 leading-relaxed text-base sm:text-lg text-left sm:text-justify mb-10">
            <p>
              A barbearia Blackout, em Campinas é o lugar perfeito para os homens que buscam uma experiência única e elegante. Nós valorizamos cada detalhe, desde a escolha dos melhores produtos do mercado até a habilidade e sabedoria dos nossos profissionais. Nós acreditamos que um homem deve se sentir valorizado e homenageado, afinal, sua aparência é importante. É por isso que oferecemos serviços de corte de cabelo e barba.
            </p>
            <p>
              Aqui, você encontrará um ambiente acolhedor e confortável, onde poderá relaxar e desfrutar de uma cerveja gelada enquanto espera pelo seu horário. Nossos profissionais são altamente treinados e experientes, e estão sempre prontos para ajudá-lo a encontrar o estilo perfeito para você. Acima de tudo, queremos que você se sinta bem e satisfeito com o resultado.
            </p>
          </div>


          {/* Layout de 2 Imagens Desfasadas (Posicionamento igual à foto 2) */}
          <div className="relative mx-auto w-full max-w-2xl h-[420px] sm:h-[550px] mt-6">
            {/* Quadrado 1 (Superior Direito) */}
            <div className="absolute top-0 right-0 w-[58%] h-[260px] sm:h-[360px] rounded-2xl bg-zinc-200 border-2 border-zinc-300/80 shadow-2xl overflow-hidden group">
              <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-zinc-100/90 text-zinc-500 text-center transition-colors group-hover:bg-zinc-100">
                <div className="w-10 h-10 mb-2 rounded-full bg-zinc-300/70 flex items-center justify-center font-bold text-zinc-700">
                  1
                </div>
                <span className="font-bold text-sm text-zinc-800">Espaço para Imagem 1</span>
                <span className="text-xs text-zinc-500 mt-1">Topo Direito (ex: Mesa de Sinuca)</span>
              </div>
            </div>

            {/* Quadrado 2 (Inferior Esquerdo - Sobreposto) */}
            <div className="absolute bottom-0 left-0 w-[54%] h-[280px] sm:h-[380px] rounded-2xl bg-zinc-300 border-2 border-zinc-400/80 shadow-2xl overflow-hidden z-10 group">
              <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-zinc-200/95 text-zinc-600 text-center transition-colors group-hover:bg-zinc-200">
                <div className="w-10 h-10 mb-2 rounded-full bg-zinc-400/70 flex items-center justify-center font-bold text-zinc-800">
                  2
                </div>
                <span className="font-bold text-sm text-zinc-900">Espaço para Imagem 2</span>
                <span className="text-xs text-zinc-600 mt-1">Inferior Esquerdo (ex: Cadeira)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO SERVIÇOS (Modelo Imagem 2 - Fundo Preto) */}
      <section id="servicos" className="w-full bg-black text-white py-24 px-4 border-t border-zinc-900">
        <div className="mx-auto max-w-6xl">
          {/* Cabeçalho */}
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3">
              Tradição e qualidade
            </h2>
            <div className="flex items-center justify-center gap-3 text-xs uppercase tracking-[0.25em] font-semibold text-[#39ff14]">
              <span className="h-px w-8 bg-[#39ff14]/80" />
              <span>O QUE NÓS FAZEMOS</span>
              <span className="h-px w-8 bg-[#39ff14]/80" />
            </div>
          </div>

          {/* Grid de Serviços estilo Imagem 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {(site?.services ?? []).map((s) => {
              const { desc, iconType } = getServiceDetails(s.name, s.description);
              return (
                <div
                  key={s.id}
                  className="group relative flex flex-col items-center text-center p-8 rounded-2xl bg-zinc-950/90 border border-zinc-800/80 hover:border-[#39ff14]/40 hover:bg-zinc-900/80 transition-all duration-300 shadow-xl"
                >
                  {/* Ícone */}
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-white group-hover:scale-110 group-hover:bg-[#39ff14] group-hover:text-black transition-all duration-300">
                    <ServiceIcon type={iconType} />
                  </div>

                  {/* Nome do Serviço */}
                  <h3 className="font-display text-xl font-bold text-white mb-3 group-hover:text-[#39ff14] transition-colors">
                    {s.name}
                  </h3>

                  {/* Descrição detalhada */}
                  <p className="text-sm text-zinc-400 leading-relaxed mb-6 flex-1">
                    {desc}
                  </p>

                  {/* Preço e Duração */}
                  <div className="w-full pt-4 border-t border-zinc-800/80 flex items-center justify-between text-sm">
                    <span className="text-xs font-medium text-zinc-500">
                      {formatDuration(s.duration_min)}
                    </span>
                    <span className="font-display font-extrabold text-[#39ff14] text-base">
                      {formatBRL(s.price_cents)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ÍCONE FIXO DO WHATSAPP */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar pelo WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-emerald-500/30 active:scale-95 group"
      >
        <svg
          className="h-7 w-7 fill-current"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.99c-.002 5.45-4.437 9.887-9.885 9.887m0-18.375a11.332 11.332 0 00-8.029 3.328 11.32 11.32 0 00-3.321 8.026c0 1.98.484 3.91 1.406 5.632l-1.492 5.451 5.577-1.462a11.338 11.338 0 005.856 1.614h.005c6.254 0 11.346-5.092 11.349-11.347a11.28 11.28 0 00-3.32-8.024 11.282 11.282 0 00-8.031-3.318" />
        </svg>
      </a>
    </div>
  );
}

function getServiceDetails(name: string, customDesc?: string | null) {
  const lower = name.toLowerCase();

  let desc = customDesc || "";
  let iconType = "hair";

  if (lower.includes("barba") && !lower.includes("corte")) {
    iconType = "beard";
    if (!desc) desc = "Barba terapia ou barba simples feita ao estilo tradicional com navalha, toalha quente e óleos essenciais para uma pele impecável.";
  } else if (lower.includes("sobrancelha") && !lower.includes("corte")) {
    iconType = "eyebrow";
    if (!desc) desc = "Alinhamento de sobrancelha preciso para harmonizar o seu rosto com estilo e sofisticação.";
  } else if (lower.includes("corte") && lower.includes("barba")) {
    iconType = "combo";
    if (!desc) desc = "O combo completo para o homem moderno: corte de cabelo alinhado e barba impecável com ritual de toalha quente.";
  } else if (lower.includes("corte") && lower.includes("sobrancelha")) {
    iconType = "combo-eyebrow";
    if (!desc) desc = "Corte de cabelo completo com acabamento perfeito somado ao design de sobrancelha alinhado.";
  } else if (lower.includes("corte")) {
    iconType = "hair";
    if (!desc) desc = "Do clássico ao moderno, do social ao degradê, nossos profissionais são treinados para oferecer o melhor acabamento.";
  } else if (lower.includes("tintura") || lower.includes("pigment")) {
    iconType = "dye";
    if (!desc) desc = "Coloração e pigmentação de alta qualidade para revitalizar a cor e o estilo dos seus fios.";
  } else if (lower.includes("progressiva") || lower.includes("escova")) {
    iconType = "comb";
    if (!desc) desc = "Alinhamento capilar profissional para fios alinhados, macios e fáceis de pentear no dia a dia.";
  } else if (lower.includes("relax") || lower.includes("hidrat")) {
    iconType = "wash";
    if (!desc) desc = "Tratamento de relaxamento e hidratação profunda para recuperar o brilho e a saúde do cabelo.";
  } else {
    if (!desc) desc = "Serviço exclusivo realizado por profissionais altamente treinados com os melhores produtos do mercado.";
  }

  return { desc, iconType };
}

function ServiceIcon({ type }: { type: string }) {
  // Barba: bigode + barba (estilo imagem 2)
  if (type === "beard") {
    return (
      <svg className="w-9 h-9 fill-current" viewBox="0 0 100 60">
        {/* bigode esquerdo */}
        <path d="M5 10 Q25 2 50 18 Q30 22 10 16 Z" />
        {/* bigode direito */}
        <path d="M95 10 Q75 2 50 18 Q70 22 90 16 Z" />
        {/* barba central */}
        <path d="M20 24 Q50 18 80 24 Q82 44 65 56 Q50 62 35 56 Q18 44 20 24 Z" />
      </svg>
    );
  }
  if (type === "eyebrow") {
    return (
      <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
        <path d="M3 13c3.5-3.5 8-5 13-3 2.5 1 4 2.5 5 4-1-.5-2.5-1.5-4.5-2-4-1-7.5 0-10.5 2.5C4.5 15.5 3.5 14.5 3 13z"/>
      </svg>
    );
  }
  if (type === "combo" || type === "combo-eyebrow") {
    return (
      <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
        {/* tesoura + pente */}
        <path d="M6 2C4.3 2 3 3.3 3 5s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3zm12 0c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3zM6 6c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm12 0c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zM6.7 7.3L12 12.6l5.3-5.3 1.4 1.4-5.3 5.3 5.3 5.3-1.4 1.4L12 15.4l-5.3 5.3-1.4-1.4 5.3-5.3-5.3-5.3z"/>
      </svg>
    );
  }
  if (type === "dye") {
    return (
      <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
        <path d="M12 3c-4.4 0-8 3.6-8 8 0 5 8 10 8 10s8-5 8-10c0-4.4-3.6-8-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
      </svg>
    );
  }
  if (type === "comb") {
    return (
      <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
        <path d="M4 4h2v16H4V4zm4 0h2v8H8V4zm4 0h2v16h-2V4zm4 0h2v8h-2V4zm4 0h2v16h-2V4z"/>
      </svg>
    );
  }
  // Corte de cabelo: silhueta pompadour fiel à imagem de referência
  return (
    <svg className="w-9 h-9 fill-current" viewBox="0 0 64 56">
      <path d="
        M8 42
        C6 36 5 28 7 22
        C8 16 10 10 16 7
        C13 12 12 18 14 22
        C16 14 20 9 27 6
        C22 12 21 18 23 23
        C26 13 32 8 40 7
        C36 13 35 19 37 24
        C40 16 46 12 52 13
        C48 18 47 24 49 28
        C52 22 56 21 58 24
        C57 28 55 33 53 37
        C56 36 58 38 57 41
        C54 44 50 44 47 43
        C44 46 40 48 34 48
        C26 49 18 47 14 44
        C12 46 9 46 8 42
        Z
      "/>
      {/* Sombra lateral esquerda destacada */}
      <path d="M8 42 C5 44 4 50 6 54 C9 52 11 48 14 44 C11 44 9 43 8 42 Z"/>
    </svg>
  );
}
