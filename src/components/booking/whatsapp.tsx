export function buildWhatsappLink(input: {
  whatsapp: string;
  template: string | null;
  clientName: string;
  barberName: string;
  serviceName: string;
  dateLabel: string;
  timeLabel: string;
  priceLabel: string;
}) {
  const base = input.template?.trim() || "Olá! Fiz um agendamento no Studio Blackout.";
  const message = [
    base,
    "",
    `Cliente: ${input.clientName}`,
    `Barbeiro: ${input.barberName}`,
    `Serviço: ${input.serviceName}`,
    `Data: ${input.dateLabel}`,
    `Horário: ${input.timeLabel}`,
    `Valor: ${input.priceLabel}`,
  ].join("\n");
  const number = input.whatsapp.replace(/\D/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
