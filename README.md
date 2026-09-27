# tudo que fiz — loja online

Site novo, separado do Avesso, com banco de dados de verdade (Supabase), contas de
cliente reais, pagamento por Pix e cartão (Mercado Pago), painel admin escondido,
lista de espera, e preparado para vendedores externos — cada peça protegida por
regras de segurança no próprio banco (RLS), não só na tela.

O que já está pronto no código (feito por mim):
- Loja completa: catálogo, filtro por categoria, carrinho, checkout com Pix e cartão
- Conta de cliente (cadastro/login) com histórico de pedidos e status de pagamento
- Painel admin em `/admin` (não aparece no menu) com abas: Produtos, Categorias,
  Vendedores, Lista de espera, Configurações — tudo lendo/gravando no banco de verdade
- Upload de foto de produto (guardado no Supabase Storage)
- Lista de espera para peças esgotadas (avisos manuais via WhatsApp pelo admin)
- Botão flutuante do WhatsApp com balão de mensagem
- Segurança por linha (RLS) no banco: cliente só vê os próprios pedidos, vendedor só
  mexe nos próprios produtos, admin vê e edita tudo — validado no servidor, não no
  navegador
- Confirmação de pagamento automática via webhook do Mercado Pago

O que só você pode fazer (são contas e chaves que só o dono pode criar). Siga na
ordem — leva uns 20–30 minutos:

## 1. Criar o banco de dados (Supabase)

1. Crie uma conta grátis em https://supabase.com e clique em "New project".
2. Escolha um nome (ex: `tudo-que-fiz`) e uma senha forte para o banco (guarde-a).
3. Espere o projeto terminar de criar (1–2 minutos).
4. No menu lateral, abra **SQL Editor** → **New query**.
5. Abra o arquivo `supabase/schema.sql` desta pasta, copie tudo, cole no editor e
   clique em **Run**. Isso cria todas as tabelas, categorias iniciais e as regras de
   segurança.
6. Em **Project Settings → API**, copie:
   - **Project URL** → vai virar `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → vai virar `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** (em "Project API keys", clique em "Reveal") →
     vai virar `SUPABASE_SERVICE_ROLE_KEY` (**nunca** compartilhe essa; ela só entra
     no servidor, nunca no navegador)

## 2. Criar sua conta de admin

1. Depois de publicar o site (passo 5), acesse `/conta` no site e crie sua própria
   conta normalmente (nome, WhatsApp, e-mail, senha).
2. Volte ao Supabase → **SQL Editor** → New query e rode:
   ```sql
   update profiles set is_admin = true
   where id = (select id from auth.users where email = 'SEU-EMAIL-AQUI');
   ```
3. Pronto — ao entrar em `/admin` com essa conta, você já tem acesso total ao painel.

## 3. Criar a conta de pagamentos (Mercado Pago)

1. Crie/entre na sua conta em https://www.mercadopago.com.br
2. Vá em **Seu negócio → Configurações → Credenciais de produção** (ou "de teste",
   pra testar antes de vender de verdade)
3. Copie o **Access Token** → vai virar `MP_ACCESS_TOKEN`
4. Depois que o site estiver no ar (passo 5), volte aqui em
   **Sua aplicação → Webhooks → Configurar notificações** e cadastre a URL:
   `https://SEU-DOMINIO.com.br/api/mp-webhook`
   marcando pelo menos o tópico **Pagamentos**.
   Isso é o que confirma o pagamento automaticamente quando o Pix cai.
5. Na mesma tela de Webhooks, copie a **Chave secreta** (assinatura) →
   vai virar `MP_WEBHOOK_SECRET`. É ela que garante que só o Mercado Pago
   de verdade consegue avisar seu site que um pagamento foi aprovado —
   sem isso, o site rejeita a notificação por segurança.

## 4. Configurar as variáveis de ambiente

1. Duplique o arquivo `.env.example` e renomeie a cópia para `.env.local`.
2. Preencha com os valores que você copiou nos passos 1 e 3.

## 5. Publicar o site (Vercel — grátis pra começar)

1. Crie uma conta em https://vercel.com (pode entrar com GitHub).
2. Suba esta pasta para um repositório no GitHub (ou use `vercel` pela linha de
   comando dentro da pasta, com `npx vercel`).
3. Em vercel.com, clique em **Add New → Project**, escolha o repositório.
4. Em **Environment Variables**, adicione as mesmas variáveis do seu `.env.local`
   (as 6 do arquivo `.env.example`).
5. Clique em **Deploy**. Em ~1 minuto seu site estará no ar em um endereço
   `algo.vercel.app`.
6. (Opcional) Em **Project Settings → Domains**, conecte seu domínio próprio
   (ex: tudoquefiz.com.br).
7. Depois de publicado, volte e complete o passo 2 (virar admin) e o passo 3.4
   (cadastrar o webhook com a URL final).

## 6. Rodando localmente (para testar antes de publicar, opcional)

```bash
npm install
npm run dev
```
Abra http://localhost:3000

## Como cadastrar categorias e produtos daqui pra frente

Tudo pelo painel — não precisa mexer em código:
- Acesse `/admin` logada como admin
- Aba **Categorias**: adicionar, editar ou remover categorias
- Aba **Produtos**: adicionar peças, com foto, preço, estoque e categoria
- Aba **Configurações**: WhatsApp, Instagram, textos da página inicial

## Como uma vendedora externa entra e ganha acesso

Isso já é auto-atendido, sem precisar mexer em SQL para cada pessoa nova:

1. A pessoa cria uma conta normal em `/conta` (ou já tem uma, como cliente).
2. Ela acessa **`/vendedor`** — esse link aparece pra qualquer pessoa logada no
   rodapé do site ("também faz coisas à mão? venda aqui") e na própria página
   `/conta` — e preenche um formulário curto contando o que ela faz.
3. Isso cria uma **candidatura**, que aparece pra você no painel `/admin`, aba
   **Candidaturas**.
4. Você aprova com um clique. Isso automaticamente:
   - cria o vendedor dela no banco,
   - libera o `seller_id` no perfil dela,
   - e a partir da próxima vez que ela abrir `/vendedor`, o formulário de
     candidatura vira o **painel dela**: só os produtos dela, com upload de
     foto, preço e estoque — nada de outra vendedora nem os seus aparece lá,
     porque isso é garantido pelas regras do banco (RLS), não pela tela.
5. Se preferir recusar, o botão "✕" ao lado da candidatura marca como recusada
   e ela pode reenviar o pedido depois.

Você também pode cadastrar uma vendedora manualmente pela aba **Vendedores**
(sem passar pela candidatura) quando quiser — útil pra casos combinados por
fora do site.

## Sobre segurança

- Cliente só enxerga os próprios pedidos (mesmo tentando adivinhar a URL de outro
  pedido, o banco bloqueia).
- Vendedor só edita os próprios produtos.
- Admin (você) é o único papel que enxerga e edita tudo.
- Preço e estoque são sempre conferidos de novo no servidor no momento da compra —
  nunca confiamos no que o navegador manda, então não dá pra "hackear" um preço
  pela tela.
- A chave que dá acesso total ao banco (`SUPABASE_SERVICE_ROLE_KEY`) só existe no
  servidor (Vercel), nunca chega ao navegador do cliente.
