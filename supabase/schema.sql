-- ============================================================
-- tudo que fiz — schema do banco (Supabase / Postgres)
-- Rode este arquivo inteiro em: Supabase → SQL Editor → New query
-- ============================================================

-- Extensão pra gerar ids
create extension if not exists "pgcrypto";

-- ---------- PERFIS (estende auth.users) ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  is_admin boolean not null default false,
  seller_id uuid, -- preenchido se essa pessoa for uma vendedora aprovada
  created_at timestamptz not null default now()
);

-- cria o perfil automaticamente quando alguém se cadastra
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ---------- VENDEDORES ----------
create table if not exists sellers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_profile_id uuid references profiles(id),
  status text not null default 'pendente', -- pendente | aprovado | bloqueado
  is_store_owner boolean not null default false, -- true só pra "tudo que fiz" (você)
  pix_key text,
  mp_access_token text, -- se cada vendedor receber o próprio Pix direto (fase futura)
  created_at timestamptz not null default now()
);

alter table profiles
  add constraint profiles_seller_fk foreign key (seller_id) references sellers(id);

-- ---------- CATEGORIAS ----------
create table if not exists categories (
  id text primary key,
  name text not null,
  icon text not null default 'outros',
  sort_order int not null default 0
);

-- ---------- PRODUTOS ----------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references sellers(id),
  category_id text not null references categories(id),
  name text not null,
  description text,
  price_cents int not null default 0,
  stock int not null default 0,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- LISTA DE ESPERA ----------
create table if not exists waitlist (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  name text not null,
  phone text not null,
  created_at timestamptz not null default now()
);

-- ---------- PEDIDOS ----------
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references profiles(id),
  customer_name text not null,
  customer_phone text not null,
  customer_address text,
  total_cents int not null default 0,
  payment_method text not null default 'pix', -- pix | cartao
  status text not null default 'aguardando_pagamento', -- aguardando_pagamento | pago | cancelado
  mp_payment_id text,
  mp_preference_id text,
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id),
  seller_id uuid references sellers(id),
  name text not null,
  price_cents int not null,
  qty int not null
);

-- ---------- LOJA / CONFIGURAÇÕES GERAIS ----------
create table if not exists settings (
  id int primary key default 1,
  instagram text default '@tudoquefiz',
  whatsapp text default '5548999936071',
  tagline text default 'um laboratório de mãos inquietas',
  story text default 'tudo que fiz nasceu de quem tem interesse demais pra caber numa coisa só.',
  check (id = 1)
);
insert into settings (id) values (1) on conflict (id) do nothing;

-- categorias iniciais (as 13 que você pediu)
insert into categories (id, name, icon, sort_order) values
  ('textil','Têxteis e fios','textil',1),
  ('ceramica','Cerâmica e modelagem','ceramica',2),
  ('papelaria','Papelaria artesanal','papelaria',3),
  ('pintura','Pintura e desenho','pintura',4),
  ('madeira','Madeira','madeira',5),
  ('velas','Velas, aromas e cosméticos naturais','velas',6),
  ('joias','Joias e acessórios','joias',7),
  ('moda','Moda e vestuário','moda',8),
  ('infantil','Infantil e brinquedos','infantil',9),
  ('decoracao','Decoração artesanal','decoracao',10),
  ('reciclagem','Reciclagem e reaproveitamento','reciclagem',11),
  ('servicos','Criação e serviços criativos','servicos',12),
  ('outros','Outros','outros',13)
on conflict (id) do nothing;

-- a "loja própria" como primeira vendedora, dona da loja
insert into sellers (id, name, status, is_store_owner)
values ('00000000-0000-0000-0000-000000000001', 'tudo que fiz (loja própria)', 'aprovado', true)
on conflict (id) do nothing;

-- ============================================================
-- ROW LEVEL SECURITY — a parte que garante a segurança de verdade
-- ============================================================
alter table profiles enable row level security;
alter table sellers enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table waitlist enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table settings enable row level security;

-- função auxiliar: sou admin?
create or replace function is_admin()
returns boolean as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$ language sql stable security definer;

-- função auxiliar: qual meu seller_id (se eu for vendedora)?
create or replace function my_seller_id()
returns uuid as $$
  select seller_id from profiles where id = auth.uid();
$$ language sql stable security definer;

-- PROFILES: cada um vê e edita só o próprio; admin vê todos
create policy "profiles: ver o próprio" on profiles for select using (id = auth.uid() or is_admin());
create policy "profiles: editar o próprio" on profiles for update using (id = auth.uid() or is_admin());

-- CATEGORIES: todo mundo lê; só admin escreve
create policy "categorias: leitura pública" on categories for select using (true);
create policy "categorias: admin escreve" on categories for insert with check (is_admin());
create policy "categorias: admin edita" on categories for update using (is_admin());
create policy "categorias: admin apaga" on categories for delete using (is_admin());

-- SETTINGS: todo mundo lê; só admin escreve
create policy "settings: leitura pública" on settings for select using (true);
create policy "settings: admin edita" on settings for update using (is_admin());

-- SELLERS: leitura pública (nome/status, pra mostrar "vendido por"); só admin cria/edita
create policy "sellers: leitura pública" on sellers for select using (true);
create policy "sellers: admin cria" on sellers for insert with check (is_admin());
create policy "sellers: admin edita" on sellers for update using (is_admin());
create policy "sellers: admin apaga" on sellers for delete using (is_admin());

-- PRODUCTS: leitura pública dos ativos; dono do produto (seller) ou admin pode escrever
create policy "produtos: leitura pública" on products for select using (active = true or is_admin() or seller_id = my_seller_id());
create policy "produtos: vendedor cria os próprios" on products for insert with check (is_admin() or seller_id = my_seller_id());
create policy "produtos: vendedor edita os próprios" on products for update using (is_admin() or seller_id = my_seller_id());
create policy "produtos: vendedor apaga os próprios" on products for delete using (is_admin() or seller_id = my_seller_id());

-- WAITLIST: qualquer um cadastra; só admin lê a lista
create policy "waitlist: qualquer um entra" on waitlist for insert with check (true);
create policy "waitlist: admin lê" on waitlist for select using (is_admin());

-- ORDERS: cliente vê só os próprios pedidos; admin vê todos; vendedor vê pedidos com item dele (via view, simplificado aqui: admin only por ora)
create policy "orders: cliente vê os próprios" on orders for select using (customer_id = auth.uid() or is_admin());
create policy "orders: cliente cria os próprios" on orders for insert with check (customer_id = auth.uid() or customer_id is null);
create policy "orders: admin atualiza status" on orders for update using (is_admin());

-- ORDER_ITEMS: segue a visibilidade do pedido pai
create policy "order_items: vê se pode ver o pedido" on order_items for select using (
  exists (select 1 from orders o where o.id = order_id and (o.customer_id = auth.uid() or is_admin()))
  or seller_id = my_seller_id()
);
create policy "order_items: cria junto do pedido" on order_items for insert with check (true);

-- ---------- CANDIDATURAS DE VENDEDORAS ----------
-- Caminho de auto-atendimento: a cliente loga, pede pra vender, admin aprova
-- com um clique no painel (sem precisar mexer em SQL pra cada pessoa nova).
create table if not exists seller_applications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  message text,
  status text not null default 'pendente', -- pendente | aprovado | recusado
  created_at timestamptz not null default now()
);

alter table seller_applications enable row level security;

create policy "candidaturas: cria a própria" on seller_applications
  for insert with check (profile_id = auth.uid());
create policy "candidaturas: vê a própria ou admin vê todas" on seller_applications
  for select using (profile_id = auth.uid() or is_admin());
create policy "candidaturas: admin atualiza" on seller_applications
  for update using (is_admin());

-- ============================================================
-- ARMAZENAMENTO DE FOTOS DOS PRODUTOS
-- ============================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product-images: leitura pública"
on storage.objects for select
using (bucket_id = 'product-images');

create policy "product-images: admin envia"
on storage.objects for insert
with check (bucket_id = 'product-images' and is_admin());

create policy "product-images: admin apaga"
on storage.objects for delete
using (bucket_id = 'product-images' and is_admin());

-- ============================================================
-- COMO VIRAR ADMIN (rode depois de criar sua própria conta pelo site):
--   update profiles set is_admin = true where id = 'SEU-USER-ID-AQUI';
-- Pra achar seu user id: Supabase → Authentication → Users
-- ============================================================
