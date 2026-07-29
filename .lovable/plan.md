## Studio Blackout — Plataforma de agendamento e gestão

Sistema completo: site público premium + agendamento sem login + painéis de barbeiro/admin + financeiro + estoque, com Lovable Cloud (banco, login, tempo real).

### Identidade visual
- Paleta escura futurista: #0A0A0A (fundo), #2A2A2A (superfícies/cartões), #F5F5F5 (texto/destaque), cinzas intermediários para bordas.
- Tipografia: Poppins (títulos) + Roboto (texto), via link de fontes.
- Mobile-first, cantos levemente arredondados, micro-animações suaves, tudo em Português BR.

### Dados reais já confirmados
- Endereço: R. Concelho das Sociedades, 475 — Jd. Yeda (mapa incorporado do Google Maps)
- WhatsApp: +55 19 92003-7087
- Funcionamento: Terça a Sábado, 09:00–18:00
- Instagram: @studio_._blackout
- Serviços: Corte R$35 · Sobrancelha R$15 · Corte + Sobrancelha R$45 · Barba R$20 · Corte + Barba R$50 · Corte + Sobrancelha + Cavanhaque R$50
- Barbeiros iniciais: Rian e Lemuel

### 1. Site público
- Home com hero de impacto (imagem de barbearia gerada), nome em destaque e botão "Agendar agora" (repetido em pontos estratégicos).
- Seções: serviços com preço e duração, profissionais, sobre/história, horários, endereço + Google Maps, FAQ, rodapé com contatos e redes.
- Páginas próprias: `/servicos`, `/sobre`, `/contato`, `/termos`, `/privacidade` — cada uma com SEO próprio.

### 2. Modal de agendamento (sem login)
Etapas com barra de progresso: barbeiro → serviço → data → horário → nome e WhatsApp → revisão → confirmação.
- Horários calculados a partir do funcionamento, duração do serviço, agendamentos existentes e bloqueios do barbeiro.
- Validação em tempo real (nome, telefone com máscara), estados de carregamento e mensagens de erro amigáveis.
- Ao confirmar: grava no banco, bloqueia o horário na hora e abre o WhatsApp com mensagem pronta contendo todos os dados.

### 3. Contas e permissões
- Login por e-mail/senha para barbeiros e administradores; cadastro opcional para clientes (histórico pessoal).
- Papéis em tabela separada (`user_roles`: admin, barbeiro, cliente) com verificação no servidor.
- Barbeiro vê apenas o que é dele; admin vê tudo.

### 4. Painel do barbeiro
Agendamentos do dia, próximos atendimentos, calendário próprio, detalhes do cliente, mudança de status (agendado, confirmado, concluído, cancelado, não compareceu), bloqueio de horários/folgas, receita do dia/semana/mês. Atualização em tempo real.

### 5. Painel administrativo
- Dashboard: agendamentos do dia, clientes atendidos, próximos atendimentos, receitas (dia/semana/mês/total), receita por barbeiro, serviços mais realizados, produtos com estoque baixo. Gráficos em preto/cinza/branco.
- Agendamentos: lista com busca e filtros (barbeiro, data, serviço, status), criar/editar/reagendar/cancelar/trocar barbeiro.
- Financeiro: receita por período personalizado, filtro por barbeiro, forma de pagamento (dinheiro, PIX, débito, crédito), exportação CSV. Receita conta apenas em atendimentos concluídos.
- Produtos e estoque: cadastro (nome, categoria, quantidade, mínimo, preço de compra/venda, status), entradas e saídas, alerta de estoque baixo.
- Configurações: dados da barbearia, horários, dias de atendimento, redes, serviços e preços, barbeiros, mensagem automática do WhatsApp.
- Notificações internas: novo agendamento, alteração, cancelamento, estoque baixo.

### 6. PWA
Manifest, ícones e cores para instalação no celular (sem modo offline).

### Detalhes técnicos
- Lovable Cloud (Postgres + Auth + Realtime). Tabelas: `barbers`, `services`, `appointments`, `clients`, `blocked_slots`, `products`, `stock_movements`, `payments`, `settings`, `notifications`, `user_roles`, `profiles`.
- RLS em todas as tabelas com GRANTs explícitos: leitura pública apenas de barbeiros/serviços/configurações; agendamento anônimo via função de servidor validada (não expõe dados de outros clientes); barbeiro restrito ao próprio `barber_id`; admin via função `has_role`.
- Disponibilidade e criação de agendamento em funções de servidor com validação Zod e checagem de conflito no banco (constraint anti-duplicidade).
- Realtime nos agendamentos para sincronizar painéis.
- Migração inicial semeia barbeiros, serviços com preços reais, horários e produtos de exemplo.
- Contas de barbeiro/admin são criadas por você depois pelo cadastro; eu deixo o admin inicial configurável.
