# Acesso do Lemuel ao painel

Criar o login do Lemuel para que ele entre no painel e veja **apenas os dados dele** — agendamentos, receita e clientes do próprio atendimento, sem acesso aos dados dos outros profissionais nem às áreas exclusivas do administrador.

## O que será feito

1. Criar a conta de acesso com o e-mail e a senha informados, já confirmada (sem precisar validar e-mail).
2. Vincular essa conta ao profissional "Lemuel" já cadastrado.
3. Dar a ele a permissão de barbeiro (não de administrador), para que o painel mostre somente a agenda e os números dele.
4. Ajustar a regra atual que estava tratando o e-mail do Lemuel como administrador — hoje isso lhe daria visão total.
5. Testar a entrada no painel com esse login e confirmar que ele vê apenas os próprios agendamentos.

## Situação hoje

- Só existe uma conta de acesso no sistema: a do Rian (administrador), já ligada ao profissional Rian.
- O Lemuel ainda não tem conta.
- Uma regra no aplicativo lista o e-mail do Lemuel junto com o do Rian como administrador; isso será removido.

## Detalhes técnicos

- Criar o usuário no Auth via Admin API (senha nunca escrita no código-fonte); inserir `user_roles` com `role = 'barber'` e atualizar `barbers.user_id` do registro "Lemuel".
- Migração `20260912165000_add_lemuel_admin.sql` concede `admin` ao e-mail do Lemuel no gatilho de signup: substituir por lógica que dê `admin` apenas ao e-mail do Rian.
- `src/hooks/use-barber-auth.ts`: remover `barbosalemueltrabalho@gmail.com` de `isAdminEmail`, mantendo o vínculo automático de barbeiro por nome.
- `src/routes/painel.tsx` já filtra por `barber.id` e esconde blocos `role === "admin"`; nenhuma mudança estrutural necessária.
- Verificação final via Playwright em `localhost:8080`: login, `/painel`, conferir ausência das seções de admin.
