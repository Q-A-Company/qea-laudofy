-- ============================================================================
-- QEA Laudofy - schema inicial
--
-- Uso interno de UMA imobiliária (~15 corretores). Não há multi-tenancy real:
-- existe uma única linha em `organizations`, e as tabelas principais carregam
-- organization_id só para não fechar a porta de uma evolução futura (nenhuma
-- lógica de isolamento entre organizações é implementada agora).
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------

create type user_role as enum ('admin', 'corretor');

create type property_status as enum ('rascunho', 'ativo', 'inativo', 'vendido', 'alugado');

-- Regra de negócio: um imóvel tem exatamente 1 tipo, EXCETO quando o tipo é
-- comercial/loja/sala, caso em que pode combinar mais de um desses três
-- (ver constraint tipo_imovel_regra na tabela properties).
create type tipo_imovel_enum as enum (
  'apartamento', 'casa', 'cobertura', 'comercial', 'loja', 'sala', 'sitio', 'terreno'
);

create type planta_tipo_enum as enum ('linear', 'duplex', 'triplex', 'quadriplex');
create type bairro_enum as enum ('barra_da_tijuca', 'recreio', 'outros');
create type posicao_enum as enum ('frente', 'fundos', 'lateral');
create type sol_enum as enum ('manha', 'tarde');
create type imovel_ocupacao_enum as enum ('vazio', 'ocupado');
create type hidrometro_enum as enum ('individual', 'coletivo');
create type finalidade_enum as enum ('venda', 'locacao');

create type review_status_enum as enum ('pendente', 'aceito', 'editado', 'rejeitado');
create type processing_status_enum as enum ('aguardando', 'processando', 'concluido', 'erro');
create type batch_status_enum as enum ('processando', 'concluido', 'erro_parcial');

-- ----------------------------------------------------------------------------
-- ORGANIZATIONS (1 única linha, seed abaixo)
-- ----------------------------------------------------------------------------

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

insert into organizations (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Imobiliária');

-- ----------------------------------------------------------------------------
-- PROFILES (espelha auth.users; role define admin vs corretor)
-- ----------------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid not null default '00000000-0000-0000-0000-000000000001'
    references organizations (id),
  name text not null,
  email text not null,
  role user_role not null default 'corretor',
  phone text,
  created_at timestamptz not null default now()
);

-- cria o profile automaticamente quando um usuário é criado no Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', new.email), new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- helper para políticas de RLS (SECURITY DEFINER evita recursão de RLS em profiles)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ----------------------------------------------------------------------------
-- helper genérico de updated_at
-- ----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- PROPERTIES
-- ----------------------------------------------------------------------------

create table properties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default '00000000-0000-0000-0000-000000000001'
    references organizations (id),
  broker_id uuid not null references profiles (id),
  created_by uuid not null references profiles (id),
  status property_status not null default 'rascunho',

  tipo_imovel tipo_imovel_enum[] not null,
  planta_tipo planta_tipo_enum,

  bairro bairro_enum,
  bairro_outro text,
  endereco text,
  cep text,
  localizacao text,
  condominio_nome text,
  edificio text,

  posicao posicao_enum[],
  sol sol_enum[],
  imovel_ocupacao imovel_ocupacao_enum,
  agendamento_obs text,
  chave_disponivel boolean,
  chave_numero text,
  placa_instalada boolean,
  placa_numero text,
  canto_de_pedra boolean not null default false,

  proprietario_nome text,
  proprietario_telefones text,
  proprietario_email text,
  conjuge_nome text,
  conjuge_telefone text,
  conjuge_email text,

  -- "planta original" x "atual": mantidos separados a pedido da equipe (útil
  -- quando houve reforma/ampliação em relação à planta registrada)
  quartos_planta_original smallint,
  suites_planta_original smallint,
  quartos smallint,
  suites smallint,
  banheiros smallint,
  vagas smallint,
  suite_master_index smallint, -- qual das `suites` é a master (1..suites), usado na classificação de fotos

  subsolo boolean,
  ano_construcao smallint,
  elevadores smallint,
  andar text, -- "Nº/Pav." na ficha original: confirmado como campo de uso livre por corretor, sem regra fixa
  unidades_por_andar smallint,

  area_terreno numeric(12, 2),
  area_construida numeric(12, 2),
  hidrometro hidrometro_enum,
  condominio_valor numeric(12, 2),
  iptu_valor numeric(12, 2),
  inscricao_iptu text,

  finalidade finalidade_enum[],
  valor numeric(14, 2),
  data_entrega date,
  permuta_aceita boolean,
  permuta_tipo_local text,
  motivo_venda text,
  condicoes_obs text,

  -- Sim/Não da ficha original, por conjunto (imóvel x condomínio); jsonb pra
  -- não precisar de migration toda vez que um item da lista mudar
  caracteristicas_imovel jsonb not null default '{}'::jsonb,
  caracteristicas_condominio jsonb not null default '{}'::jsonb,

  descricao text,
  descricao_marketing_ia text, -- gerado por IA generativa, sempre isolado dos campos factuais acima

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tipo_imovel_regra check (
    (
      tipo_imovel <@ array['comercial', 'loja', 'sala']::tipo_imovel_enum[]
      and array_length(tipo_imovel, 1) >= 1
    )
    or (
      array_length(tipo_imovel, 1) = 1
      and tipo_imovel[1] in ('apartamento', 'casa', 'cobertura', 'sitio', 'terreno')
    )
  )
);

create index properties_broker_id_idx on properties (broker_id);
create index properties_organization_id_idx on properties (organization_id);

create trigger properties_set_updated_at
  before update on properties
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- PHOTO_CATEGORIES (taxonomia configurável, com ordem de exibição)
-- ----------------------------------------------------------------------------

create table photo_categories (
  key text primary key,
  label text not null,
  display_group text not null,
  sort_order int not null,
  active boolean not null default true
);

insert into photo_categories (key, label, display_group, sort_order) values
  ('fachada', 'Fachada', 'fachada', 10),
  ('garagem', 'Garagem', 'fachada', 20),
  ('sala', 'Sala', 'social', 30),
  ('sala_jantar', 'Sala de Jantar', 'social', 40),
  ('sala_tv', 'Sala de TV', 'social', 50),
  ('cozinha', 'Cozinha', 'social', 60),
  ('area_servico', 'Área de Serviço', 'social', 70),
  ('varanda', 'Varanda', 'social', 80),
  ('quarto', 'Quarto', 'quartos', 90),
  ('suite_comum', 'Suíte', 'quartos', 100),
  ('suite_master', 'Suíte Master', 'quartos', 110),
  ('banheiro_comum', 'Banheiro', 'quartos', 120),
  ('banheiro_suite_master', 'Banheiro da Suíte Master', 'quartos', 130),
  ('closet_comum', 'Closet', 'quartos', 140),
  ('closet_suite_master', 'Closet da Suíte Master', 'quartos', 150),
  ('piscina', 'Piscina', 'lazer', 160),
  ('area_lazer', 'Área de Lazer', 'lazer', 170),
  ('area_gourmet', 'Área Gourmet', 'lazer', 180),
  ('churrasqueira', 'Churrasqueira', 'lazer', 190),
  ('academia', 'Academia', 'lazer', 200),
  ('playground', 'Playground', 'lazer', 210);

-- ----------------------------------------------------------------------------
-- PHOTO_UPLOAD_BATCHES (1 linha por leva de upload; alimenta a barra de progresso)
-- ----------------------------------------------------------------------------

create table photo_upload_batches (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties (id) on delete cascade,
  total_photos int not null default 0,
  processed_photos int not null default 0,
  status batch_status_enum not null default 'processando',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index photo_upload_batches_property_id_idx on photo_upload_batches (property_id);

-- ----------------------------------------------------------------------------
-- PROPERTY_PHOTOS
-- ----------------------------------------------------------------------------

create table property_photos (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties (id) on delete cascade,
  batch_id uuid references photo_upload_batches (id) on delete set null,

  storage_path text not null,
  original_filename text,
  upload_order int not null,
  captured_at timestamptz, -- timestamp EXIF, quando disponível; usado na heurística de agrupamento
  uploaded_at timestamptz not null default now(),

  ai_suggested_category text references photo_categories (key),
  ai_confidence numeric(4, 3),
  ai_raw_response jsonb,

  final_category text references photo_categories (key),
  group_key text, -- ex: "suite_master_1" - agrupa fotos do mesmo ambiente
  display_order int,

  review_status review_status_enum not null default 'pendente',
  processing_status processing_status_enum not null default 'aguardando',
  error_message text,

  created_at timestamptz not null default now()
);

create index property_photos_property_id_idx on property_photos (property_id);
create index property_photos_batch_id_idx on property_photos (batch_id);

-- ----------------------------------------------------------------------------
-- REPORTS (laudos gerados)
-- ----------------------------------------------------------------------------

create table reports (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties (id) on delete cascade,
  generated_by uuid not null references profiles (id),
  template_version text not null,
  docx_storage_path text not null,
  pdf_storage_path text,
  generated_at timestamptz not null default now()
);

create index reports_property_id_idx on reports (property_id);

-- ============================================================================
-- ROW LEVEL SECURITY
--
-- Regra geral: corretor vê/gerencia só os próprios imóveis (broker_id =
-- auth.uid()); admin vê/gerencia tudo (public.is_admin()).
-- ============================================================================

alter table organizations enable row level security;
alter table photo_categories enable row level security;
alter table profiles enable row level security;
alter table properties enable row level security;
alter table photo_upload_batches enable row level security;
alter table property_photos enable row level security;
alter table reports enable row level security;

create policy organizations_select on organizations
  for select using (auth.role() = 'authenticated');

create policy photo_categories_select on photo_categories
  for select using (auth.role() = 'authenticated');

create policy profiles_select_own_or_admin on profiles
  for select using (id = auth.uid() or public.is_admin());

create policy profiles_update_own on profiles
  for update using (id = auth.uid());

create policy profiles_admin_all on profiles
  for all using (public.is_admin()) with check (public.is_admin());

create policy properties_select on properties
  for select using (broker_id = auth.uid() or public.is_admin());

create policy properties_insert on properties
  for insert with check (broker_id = auth.uid() or public.is_admin());

create policy properties_update on properties
  for update using (broker_id = auth.uid() or public.is_admin());

create policy properties_delete on properties
  for delete using (broker_id = auth.uid() or public.is_admin());

create policy property_photos_select on property_photos
  for select using (
    exists (
      select 1 from properties p
      where p.id = property_photos.property_id
        and (p.broker_id = auth.uid() or public.is_admin())
    )
  );

create policy property_photos_insert on property_photos
  for insert with check (
    exists (
      select 1 from properties p
      where p.id = property_photos.property_id
        and (p.broker_id = auth.uid() or public.is_admin())
    )
  );

create policy property_photos_update on property_photos
  for update using (
    exists (
      select 1 from properties p
      where p.id = property_photos.property_id
        and (p.broker_id = auth.uid() or public.is_admin())
    )
  );

create policy property_photos_delete on property_photos
  for delete using (
    exists (
      select 1 from properties p
      where p.id = property_photos.property_id
        and (p.broker_id = auth.uid() or public.is_admin())
    )
  );

create policy photo_upload_batches_select on photo_upload_batches
  for select using (
    exists (
      select 1 from properties p
      where p.id = photo_upload_batches.property_id
        and (p.broker_id = auth.uid() or public.is_admin())
    )
  );

create policy photo_upload_batches_insert on photo_upload_batches
  for insert with check (
    exists (
      select 1 from properties p
      where p.id = photo_upload_batches.property_id
        and (p.broker_id = auth.uid() or public.is_admin())
    )
  );

create policy photo_upload_batches_update on photo_upload_batches
  for update using (
    exists (
      select 1 from properties p
      where p.id = photo_upload_batches.property_id
        and (p.broker_id = auth.uid() or public.is_admin())
    )
  );

create policy reports_select on reports
  for select using (
    exists (
      select 1 from properties p
      where p.id = reports.property_id
        and (p.broker_id = auth.uid() or public.is_admin())
    )
  );

create policy reports_insert on reports
  for insert with check (
    exists (
      select 1 from properties p
      where p.id = reports.property_id
        and (p.broker_id = auth.uid() or public.is_admin())
    )
  );

-- ============================================================================
-- STORAGE (buckets + políticas)
--
-- Convenção de path: "<property_id>/photos/<arquivo>" e "<property_id>/reports/<arquivo>".
-- OBS: sintaxe de storage policies varia entre versões do Supabase - validar
-- ao aplicar esta migration contra o projeto real.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('property-files', 'property-files', false)
on conflict (id) do nothing;

create policy property_files_select on storage.objects
  for select using (
    bucket_id = 'property-files'
    and exists (
      select 1 from properties p
      where p.id::text = (storage.foldername(name))[1]
        and (p.broker_id = auth.uid() or public.is_admin())
    )
  );

create policy property_files_insert on storage.objects
  for insert with check (
    bucket_id = 'property-files'
    and exists (
      select 1 from properties p
      where p.id::text = (storage.foldername(name))[1]
        and (p.broker_id = auth.uid() or public.is_admin())
    )
  );

create policy property_files_delete on storage.objects
  for delete using (
    bucket_id = 'property-files'
    and exists (
      select 1 from properties p
      where p.id::text = (storage.foldername(name))[1]
        and (p.broker_id = auth.uid() or public.is_admin())
    )
  );
